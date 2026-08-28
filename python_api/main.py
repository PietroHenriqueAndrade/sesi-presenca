from fastapi import FastAPI, UploadFile, File, Request, Form, Header, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

import face_recognition
import cv2
import numpy as np
import os
import json
import logging
import requests
import hmac
import base64
import hashlib
import time

from uuid import UUID
from dotenv import load_dotenv
from core_utils import normalizar_node_api_url, uuid_valido, calcular_face_score as calcular_face_score_util, extrair_mensagem_backend
from image_utils import normalizar_imagem_rgb

load_dotenv()

APP_ENV = (os.getenv('APP_ENV') or os.getenv('PYTHON_ENV') or 'development').strip().lower()
IS_PRODUCTION = APP_ENV == 'production'

# ============================================================
# CONFIGURAÇÃO GERAL
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("tcc-face")

app = FastAPI(
    title="API de Reconhecimento Facial - TCC",
    version="1.1.0",
    docs_url=None if IS_PRODUCTION else '/docs',
    redoc_url=None if IS_PRODUCTION else '/redoc',
    openapi_url=None if IS_PRODUCTION else '/openapi.json',
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PASTA_STATIC = os.path.join(BASE_DIR, "static")
BIOMETRIC_DATA_DIR = os.path.abspath(os.getenv("BIOMETRIC_DATA_DIR", BASE_DIR))
PASTA_BANCO = os.path.join(BIOMETRIC_DATA_DIR, "banco_alunos")
CAMINHO_MAPEAMENTO = os.path.join(BIOMETRIC_DATA_DIR, "mapeamento_alunos.json")

for pasta in [PASTA_STATIC, BIOMETRIC_DATA_DIR, PASTA_BANCO]:
    os.makedirs(pasta, exist_ok=True)

app.mount("/static", StaticFiles(directory=PASTA_STATIC), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# CORS: útil caso o Miguel rode o Flutter também como Web durante os testes.
# No APK/mobile o CORS do navegador não se aplica.
cors_default = "" if IS_PRODUCTION else "http://localhost:3000,http://localhost:5173,http://localhost:8080"
cors_env = os.getenv("CORS_ORIGINS", cors_default)
origens_cors = [origem.strip() for origem in cors_env.split(",") if origem.strip()]
if IS_PRODUCTION:
    if not origens_cors:
        raise RuntimeError("CORS_ORIGINS precisa conter a URL HTTPS do Dashboard em produção.")
    for origem in origens_cors:
        if not origem.startswith("https://") or "*" in origem:
            raise RuntimeError("CORS_ORIGINS em produção aceita somente origens HTTPS explícitas.")
allow_loopback_default = "false" if IS_PRODUCTION else "true"
allow_loopback_cors = (os.getenv("ALLOW_LOOPBACK_CORS", allow_loopback_default).strip().lower() == "true")
loopback_regex = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$" if allow_loopback_cors else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_cors,
    allow_origin_regex=loopback_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "x-api-key"],
)

# ============================================================
# INTEGRAÇÃO COM O BACKEND NODE DO NEIL
# ============================================================

node_api_url_env = (os.getenv("NODE_API_URL") or "").strip()
node_internal_hostport = (os.getenv("NODE_INTERNAL_HOSTPORT") or "").strip()
if node_api_url_env:
    NODE_API_URL = normalizar_node_api_url(node_api_url_env)
elif node_internal_hostport:
    NODE_API_URL = normalizar_node_api_url(f"http://{node_internal_hostport}")
else:
    NODE_API_URL = normalizar_node_api_url("http://localhost:3000")

IA_API_KEY = (os.getenv("IA_API_KEY") or "").strip()
NODE_TIMEOUT_SEGUNDOS = float(os.getenv("NODE_TIMEOUT_SEGUNDOS", "10"))
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(5 * 1024 * 1024)))

if IS_PRODUCTION:
    if len(IA_API_KEY) < 32 or any(marker in IA_API_KEY.upper() for marker in ("TROQUE", "CHANGE_ME", "EXAMPLE")):
        raise RuntimeError("IA_API_KEY precisa ser um segredo aleatório de 32+ caracteres em produção.")
    if not node_api_url_env and not node_internal_hostport:
        raise RuntimeError("Configure NODE_API_URL ou NODE_INTERNAL_HOSTPORT em produção.")
    if not os.getenv("BIOMETRIC_DATA_DIR"):
        raise RuntimeError("BIOMETRIC_DATA_DIR precisa apontar para armazenamento persistente em produção.")

# Desafios de segundo fator duram apenas 2 minutos e são single-use.
# Guardar somente o SHA-256 evita manter o token completo em memória.
DESAFIOS_CONSUMIDOS = {}

# Score normalizado mínimo aceito pelo backend para presença facial:
NODE_MIN_FACE_SCORE = float(os.getenv("NODE_MIN_FACE_SCORE", "0.70"))
NODE_MIN_FACE_SCORE = max(0.0, min(1.0, NODE_MIN_FACE_SCORE))

# ============================================================
# AUTORIZAÇÃO DAS ROTAS USADAS PELA WEBVIEW
# ============================================================

def validar_usuario_node(authorization: str | None, roles_permitidas=None):
    """Valida o JWT no Node e, quando solicitado, restringe o perfil do terminal."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token de acesso não fornecido.")
    try:
        resposta = requests.get(
            f"{NODE_API_URL}/auth/me",
            headers={"Authorization": authorization, "Accept": "application/json"},
            timeout=NODE_TIMEOUT_SEGUNDOS,
        )
    except requests.RequestException as erro:
        logger.error("Falha ao validar JWT no Node: %s", erro)
        raise HTTPException(status_code=503, detail="Backend Node indisponível para validar a sessão.") from erro
    if resposta.status_code != 200:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")
    payload = resposta.json()
    usuario = payload.get("data") if isinstance(payload, dict) else None
    if roles_permitidas:
        role = str((usuario or {}).get("role") or "").upper()
        if role not in set(roles_permitidas):
            raise HTTPException(status_code=403, detail="Este perfil não pode operar o terminal de reconhecimento.")
    return payload


def validar_chave_interna(chave: str | None):
    if not IA_API_KEY:
        raise HTTPException(status_code=503, detail="IA_API_KEY não configurada no serviço Python.")
    if not chave or not hmac.compare_digest(str(chave), IA_API_KEY):
        raise HTTPException(status_code=401, detail="Chave interna inválida.")


def validar_upload_imagem(file: UploadFile, conteudo: bytes):
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo de imagem vazio.")
    if len(conteudo) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Imagem acima do limite permitido.")
    if file.content_type and not file.content_type.lower().startswith("image/"):
        raise HTTPException(status_code=415, detail="O arquivo enviado não é uma imagem.")

# ============================================================
# CONFIGURAÇÃO DO RECONHECIMENTO
# ============================================================

rostos_conhecidos_encodings = []
rostos_conhecidos_nomes = []

encodings_cadastro_pendentes = {}

# Distância facial: quanto MENOR, mais parecidos são os rostos.
# 0.50 é um ponto inicial mais realista para câmera frontal de tablet, sem
# abrir mão da checagem de ambiguidade entre identidades muito parecidas.
TOLERANCIA_RECONHECIMENTO = float(os.getenv("FACE_TOLERANCE", "0.50"))
MARGEM_MINIMA_CONFIANCA = float(os.getenv("FACE_MARGIN", "0.07"))
NUM_JITTERS_CADASTRO = int(os.getenv("FACE_NUM_JITTERS", "1"))

# O Laplaciano varia bastante entre webcams/celulares/tablets. Mantemos
# limites diferentes para cadastro (mais exigente) e reconhecimento diário.
NITIDEZ_MIN_CADASTRO = float(os.getenv("FACE_BLUR_ENROLL_MIN", "45"))
NITIDEZ_MIN_RECONHECIMENTO = float(os.getenv("FACE_BLUR_RECOGNITION_MIN", "35"))

logger.info(
    "Config facial | tolerancia=%.3f | margem=%.3f | nitidez cadastro=%.1f | nitidez reconhecimento=%.1f",
    TOLERANCIA_RECONHECIMENTO,
    MARGEM_MINIMA_CONFIANCA,
    NITIDEZ_MIN_CADASTRO,
    NITIDEZ_MIN_RECONHECIMENTO,
)

# ============================================================
# MAPEAMENTO ALUNO -> UUIDs DO POSTGRES
# ============================================================

def carregar_mapeamento():
    if not os.path.exists(CAMINHO_MAPEAMENTO):
        logger.warning("mapeamento_alunos.json não encontrado.")
        return {}

    try:
        with open(CAMINHO_MAPEAMENTO, "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
            return dados if isinstance(dados, dict) else {}
    except (json.JSONDecodeError, OSError) as erro:
        logger.error("Erro ao carregar mapeamento_alunos.json: %s", erro)
        return {}

def salvar_mapeamento_aluno(nome_aluno, aluno_id, turma_id):
    """Salva o UUID do aluno como identidade facial estável.

    O nome é apenas metadado de exibição. Isso evita colisão entre dois alunos
    com o mesmo nome e permite renomear o aluno sem perder a biometria.
    """
    if not uuid_valido(aluno_id) or not uuid_valido(turma_id):
        raise ValueError('aluno_id e turma_id devem ser UUIDs válidos.')

    aluno_id = str(aluno_id)
    turma_id = str(turma_id)
    mapeamento = carregar_mapeamento()

    # Remove entradas legadas que apontem para o mesmo aluno antes de gravar
    # no formato novo, indexado pelo UUID.
    for chave, info in list(mapeamento.items()):
        if isinstance(info, dict) and str(info.get('alunoId')) == aluno_id and chave != aluno_id:
            mapeamento.pop(chave, None)

    mapeamento[aluno_id] = {
        'alunoId': aluno_id,
        'turmaId': turma_id,
        'nome': nome_aluno,
    }

    temporario = f"{CAMINHO_MAPEAMENTO}.tmp"
    with open(temporario, 'w', encoding='utf-8') as arquivo:
        json.dump(mapeamento, arquivo, ensure_ascii=False, indent=2)
    os.replace(temporario, CAMINHO_MAPEAMENTO)
    logger.info('Mapeamento facial atualizado para alunoId=%s.', aluno_id)


def obter_mapeamento_aluno(identidade):
    mapeamento = carregar_mapeamento()
    info = mapeamento.get(identidade)

    # Compatibilidade de leitura com bancos faciais antigos, onde a chave era
    # o nome do aluno. Novos cadastros sempre usam UUID.
    if not info:
        for chave, candidato in mapeamento.items():
            if isinstance(candidato, dict) and str(candidato.get('alunoId')) == str(identidade):
                info = candidato
                break

    if not isinstance(info, dict):
        return None, 'Identidade facial reconhecida sem mapeamento válido.'

    aluno_id = info.get('alunoId')
    turma_id = info.get('turmaId')
    if not uuid_valido(aluno_id) or not uuid_valido(turma_id):
        return None, 'Mapeamento facial possui alunoId/turmaId inválido.'

    return {
        'alunoId': str(aluno_id),
        'turmaId': str(turma_id),
        'nome': info.get('nome') or str(identidade),
    }, None

# ============================================================
# BANCO FACIAL LOCAL
# ============================================================

def carregar_banco_local():
    rostos_conhecidos_encodings.clear()
    rostos_conhecidos_nomes.clear()

    arquivos = os.listdir(PASTA_BANCO)
    if not arquivos:
        logger.info("Banco facial local vazio.")
        return

    logger.info("Carregando banco facial local...")

    for arquivo in arquivos:
        if not arquivo.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        caminho = os.path.join(PASTA_BANCO, arquivo)

        try:
            imagem = face_recognition.load_image_file(caminho)
            encodings = face_recognition.face_encodings(
                imagem,
                num_jitters=NUM_JITTERS_CADASTRO
            )

            if not encodings:
                logger.warning("Nenhum rosto utilizável em %s", arquivo)
                continue

            nome_base = os.path.splitext(arquivo)[0]
            partes = nome_base.rsplit("_", 1)
            nome_aluno = partes[0] if len(partes) == 2 else nome_base

            rostos_conhecidos_encodings.append(encodings[0])
            rostos_conhecidos_nomes.append(nome_aluno)
            logger.info("Face carregada: %s", arquivo)

        except Exception as erro:
            logger.exception("Erro ao carregar %s: %s", arquivo, erro)

    logger.info("Banco facial carregado: %s fotos.", len(rostos_conhecidos_nomes))

carregar_banco_local()

# ============================================================
# ROTAS DE STATUS / INTERFACE LOCAL
# ============================================================

@app.get("/", response_class=HTMLResponse)
async def interface_teste(request: Request):
    if IS_PRODUCTION:
        raise HTTPException(status_code=404, detail="Interface local desabilitada em produção.")
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/health")
async def health_check():
    mapeamento = carregar_mapeamento()
    return {
        "status": "ok",
        "servico": "python-face-api",
        "identidades_carregadas": len(set(rostos_conhecidos_nomes)),
        "fotos_carregadas": len(rostos_conhecidos_nomes),
        "alunos_mapeados": len(mapeamento),
    }


@app.get("/health/ready")
def health_ready():
    """Readiness público sem segredos: confirma Python, banco facial e alcance do Node."""
    try:
        resposta = requests.get(
            f"{NODE_API_URL}/health/ready",
            headers={"Accept": "application/json"},
            timeout=min(NODE_TIMEOUT_SEGUNDOS, 5),
        )
    except requests.RequestException as erro:
        logger.warning("Readiness: backend Node indisponível: %s", erro)
        raise HTTPException(status_code=503, detail="Backend Node indisponível.") from erro

    if not resposta.ok:
        raise HTTPException(status_code=503, detail="Backend Node não está pronto.")

    return {
        "status": "ok",
        "servico": "python-face-api",
        "node": "ok",
        "identidades_carregadas": len(set(rostos_conhecidos_nomes)),
        "fotos_carregadas": len(rostos_conhecidos_nomes),
    }


@app.get("/health/node")
def health_node(x_api_key: str | None = Header(None, alias="x-api-key")):
    """Diagnóstico interno da ponte Python -> Node sem expor URLs da rede."""
    validar_chave_interna(x_api_key)
    try:
        resposta = requests.get(
            f"{NODE_API_URL}/health",
            timeout=NODE_TIMEOUT_SEGUNDOS,
        )
        return {
            "status": "ok" if resposta.ok else "erro",
            "http_status": resposta.status_code,
        }
    except requests.exceptions.Timeout:
        return {"status": "erro", "mensagem": "Timeout ao alcançar o backend Node."}
    except requests.exceptions.ConnectionError:
        return {"status": "erro", "mensagem": "Backend Node indisponível."}
    except requests.RequestException as erro:
        logger.error("Falha ao consultar health do Node: %s", erro)
        return {"status": "erro", "mensagem": "Falha ao consultar o backend Node."}


@app.delete("/alunos/{aluno_id}/biometria")
def excluir_biometria(aluno_id: str, x_api_key: str | None = Header(None, alias="x-api-key")):
    """Remoção server-to-server para a exclusão definitiva LGPD iniciada no Node."""
    validar_chave_interna(x_api_key)
    if not uuid_valido(aluno_id):
        raise HTTPException(status_code=400, detail="aluno_id inválido.")

    mapeamento = carregar_mapeamento()
    chaves = [
        chave for chave, info in mapeamento.items()
        if isinstance(info, dict) and str(info.get("alunoId")) == str(aluno_id)
    ]
    removidas = 0
    for chave in chaves:
        mapeamento.pop(chave, None)
        for numero in ("1", "2", "3"):
            caminho = os.path.join(PASTA_BANCO, f"{chave}_{numero}.jpg")
            if os.path.exists(caminho):
                os.remove(caminho)
                removidas += 1

    # Novo formato usa o UUID diretamente no nome do arquivo, mesmo que o
    # mapeamento esteja danificado ou ausente.
    for numero in ("1", "2", "3"):
        caminho = os.path.join(PASTA_BANCO, f"{aluno_id}_{numero}.jpg")
        if os.path.exists(caminho):
            os.remove(caminho)
            removidas += 1

    temporario = f"{CAMINHO_MAPEAMENTO}.tmp"
    with open(temporario, "w", encoding="utf-8") as arquivo:
        json.dump(mapeamento, arquivo, ensure_ascii=False, indent=2)
    os.replace(temporario, CAMINHO_MAPEAMENTO)
    carregar_banco_local()
    return {
        "status": "sucesso",
        "alunoId": aluno_id,
        "mapeamentos_removidos": len(chaves),
        "fotos_removidas": removidas,
    }

# ============================================================
# CADASTRO FACIAL
# ============================================================

def limpar_fotos_parciais(identidade):
    """Remove somente o cadastro facial incompleto desta identidade."""
    encodings_cadastro_pendentes.pop(str(identidade), None)

    try:
        for numero in ("1", "2", "3"):
            caminho = os.path.join(
                PASTA_BANCO,
                f"{identidade}_{numero}.jpg"
            )

            if os.path.exists(caminho):
                os.remove(caminho)

    except Exception as erro:
        logger.warning(
            "Erro ao limpar fotos parciais: %s",
            erro
        )


def medir_nitidez(imagem_bgr):
    """Retorna a variância do Laplaciano usada como indicador de nitidez."""
    cinza = cv2.cvtColor(
        imagem_bgr,
        cv2.COLOR_BGR2GRAY
    )

    return float(
        cv2.Laplacian(
            cinza,
            cv2.CV_64F
        ).var()
    )


def checar_nitidez(imagem_bgr, limite=80.0):
    return medir_nitidez(imagem_bgr) >= float(limite)


def obter_encodings_cadastro(aluno_id):
    """
    Obtém os 3 templates recém-cadastrados sem
    precisar recarregar o banco facial inteiro.
    """

    pendentes = encodings_cadastro_pendentes.get(
        str(aluno_id),
        {}
    )

    resultado = []

    for numero in ("1", "2", "3"):

        encoding = pendentes.get(numero)

        # Fallback:
        # caso o Python tenha sido reiniciado entre uma foto e outra,
        # tenta recuperar somente a foto necessária.
        if encoding is None:

            caminho = os.path.join(
                PASTA_BANCO,
                f"{aluno_id}_{numero}.jpg"
            )

            if not os.path.exists(caminho):
                return None

            imagem = face_recognition.load_image_file(
                caminho
            )

            encontrados = face_recognition.face_encodings(
                imagem,
                num_jitters=max(
                    1,
                    NUM_JITTERS_CADASTRO
                ),
            )

            if len(encontrados) != 1:
                return None

            encoding = encontrados[0]

        resultado.append(encoding)

    return resultado


def atualizar_identidade_na_memoria(
    aluno_id,
    novos_encodings
):
    """
    Atualiza somente o aluno recém-cadastrado
    dentro do banco facial carregado em memória.
    """

    identidade = str(aluno_id)

    pares = [
        (nome, encoding)
        for nome, encoding in zip(
            rostos_conhecidos_nomes,
            rostos_conhecidos_encodings
        )
        if str(nome) != identidade
    ]

    rostos_conhecidos_nomes[:] = [
        nome
        for nome, _ in pares
    ]

    rostos_conhecidos_encodings[:] = [
        encoding
        for _, encoding in pares
    ]

    for encoding in novos_encodings:

        rostos_conhecidos_nomes.append(
            identidade
        )

        rostos_conhecidos_encodings.append(
            encoding
        )

    logger.info(
        "Banco facial atualizado em memória | aluno=%s | templates=%s | total=%s",
        identidade,
        len(novos_encodings),
        len(rostos_conhecidos_nomes),
    )


@app.post("/cadastrar")
async def cadastrar_aluno(
    numero_foto: str = Form(...),
    enrollment_token: str = Form(...),
    file: UploadFile = File(...),
):

    if numero_foto not in {"1", "2", "3"}:
        raise HTTPException(
            status_code=422,
            detail="numero_foto deve ser 1, 2 ou 3."
        )

    if not IA_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="IA_API_KEY não configurada."
        )

    # Mantemos a validação do token em TODAS as fotos.
    # Segurança não será removida para ganhar velocidade.
    try:

        resposta_sessao = requests.post(
            f"{NODE_API_URL}/ia/validar-sessao-cadastro",
            json={
                "token": enrollment_token
            },
            headers={
                "x-api-key": IA_API_KEY,
                "Accept": "application/json"
            },
            timeout=NODE_TIMEOUT_SEGUNDOS,
        )

        corpo_sessao = (
            resposta_sessao.json()
            if resposta_sessao.content
            else {}
        )

    except requests.RequestException as erro:

        raise HTTPException(
            status_code=503,
            detail="Backend indisponível para validar o cadastro biométrico."
        ) from erro

    except ValueError as erro:

        raise HTTPException(
            status_code=502,
            detail="Backend retornou resposta inválida ao validar cadastro."
        ) from erro

    if not resposta_sessao.ok:

        raise HTTPException(
            status_code=resposta_sessao.status_code,
            detail=extrair_mensagem_backend(
                corpo_sessao,
                "Autorização de cadastro inválida."
            ),
        )

    sessao = corpo_sessao.get("data") or {}

    aluno_id = str(
        sessao.get("alunoId") or ""
    )

    turma_id = str(
        sessao.get("turmaId") or ""
    )

    nome_limpo = " ".join(
        str(
            sessao.get("alunoNome") or ""
        ).strip().split()
    ).upper()

    if (
        not uuid_valido(aluno_id)
        or not uuid_valido(turma_id)
        or not nome_limpo
    ):
        raise HTTPException(
            status_code=502,
            detail="Backend devolveu dados incompletos para o cadastro biométrico."
        )

    # Foto 1 começa um cadastro novo.
    if numero_foto == "1":
        limpar_fotos_parciais(
            aluno_id
        )

    try:

        conteudo = await file.read()

        validar_upload_imagem(
            file,
            conteudo
        )

        try:

            # Reduzimos 1400 -> 1200.
            # Continua suficiente para o rosto guiado,
            # mas diminui bastante o custo do dlib.
            imagem_rgb = np.ascontiguousarray(
                normalizar_imagem_rgb(
                    conteudo,
                    max_lado=1200
                ),
                dtype=np.uint8,
            )

            if (
                imagem_rgb.ndim != 3
                or imagem_rgb.shape[2] != 3
            ):
                raise ValueError(
                    "Imagem precisa possuir 3 canais RGB."
                )

            imagem_bgr = np.ascontiguousarray(
                cv2.cvtColor(
                    imagem_rgb,
                    cv2.COLOR_RGB2BGR
                ),
                dtype=np.uint8,
            )

        except Exception as erro:

            logger.warning(
                "Erro ao normalizar imagem de cadastro: %s",
                erro
            )

            return {
                "status": "erro",
                "mensagem": "Imagem inválida ou corrompida."
            }

        nitidez = medir_nitidez(
            imagem_bgr
        )

        logger.info(
            "Qualidade cadastro | aluno=%s | foto=%s | nitidez=%.2f | minimo=%.2f | resolucao=%sx%s",
            aluno_id,
            numero_foto,
            nitidez,
            NITIDEZ_MIN_CADASTRO,
            imagem_bgr.shape[1],
            imagem_bgr.shape[0],
        )

        if nitidez < NITIDEZ_MIN_CADASTRO:

            return {
                "status": "erro",
                "mensagem": (
                    f"Imagem muito borrada "
                    f"(nitidez {nitidez:.0f}). "
                    "Fique parado, melhore a iluminação "
                    "e tente esta foto novamente."
                ),
            }

        locais = face_recognition.face_locations(
            imagem_rgb
        )

        if not locais:

            return {
                "status": "erro",
                "mensagem": (
                    "Nenhum rosto detectado. "
                    "Centralize-se na câmera e tente novamente."
                ),
            }

        if len(locais) > 1:

            return {
                "status": "erro",
                "mensagem": (
                    "Mais de um rosto detectado. "
                    "Cadastre uma pessoa por vez."
                ),
            }

        top, right, bottom, left = locais[0]

        if min(
            bottom - top,
            right - left
        ) < 140:

            return {
                "status": "erro",
                "mensagem": (
                    "Aproxime um pouco o rosto da câmera "
                    "para melhorar a qualidade."
                ),
            }

        marcas = face_recognition.face_landmarks(
            imagem_rgb,
            locais
        )

        # A pose continua sendo medida para diagnóstico, mas não bloqueia
        # o cadastro. A proporção nariz/olhos varia bastante entre pessoas e
        # webcams e estava rejeitando fotos utilizáveis.
        if marcas:
            try:
                pontos = marcas[0]

                nariz_x = pontos[
                    "nose_bridge"
                ][0][0]

                olho_esq_x = pontos[
                    "left_eye"
                ][0][0]

                olho_dir_x = pontos[
                    "right_eye"
                ][0][0]

                proporcao = (
                    nariz_x - olho_esq_x
                ) / (
                    olho_dir_x
                    - olho_esq_x
                    + 1e-6
                )

                logger.info(
                    "Pose cadastro | aluno=%s | foto=%s | proporcao=%.3f",
                    aluno_id,
                    numero_foto,
                    proporcao,
                )
            except Exception as erro_pose:
                logger.debug(
                    "Não foi possível calcular pose do cadastro: %s",
                    erro_pose,
                )

        encodings = face_recognition.face_encodings(
            imagem_rgb,
            known_face_locations=locais,
            num_jitters=max(
                1,
                NUM_JITTERS_CADASTRO
            ),
        )

        if len(encodings) != 1:

            return {
                "status": "erro",
                "mensagem": (
                    "Não foi possível extrair "
                    "um template facial confiável. "
                    "Tente esta foto novamente."
                ),
            }

        caminho_destino = os.path.join(
            PASTA_BANCO,
            f"{aluno_id}_{numero_foto}.jpg"
        )

        if not cv2.imwrite(
            caminho_destino,
            imagem_bgr
        ):
            raise RuntimeError(
                "Não foi possível salvar a imagem no banco facial."
            )

        # Guarda o encoding que já calculamos.
        # Não vamos calcular tudo novamente depois.
        encodings_cadastro_pendentes.setdefault(
            aluno_id,
            {}
        )[numero_foto] = encodings[0]

        if numero_foto == "3":

            novos_encodings = obter_encodings_cadastro(
                aluno_id
            )

            if (
                not novos_encodings
                or len(novos_encodings) != 3
            ):
                return {
                    "status": "erro",
                    "mensagem": (
                        "As três fotos não estão completas. "
                        "Reinicie o cadastro deste aluno."
                    ),
                }

            salvar_mapeamento_aluno(
                nome_limpo,
                aluno_id,
                turma_id
            )

            # MUITO IMPORTANTE:
            # antes existia carregar_banco_local()
            # aqui, que relia TODAS as fotos.
            #
            # Agora atualizamos somente este aluno.
            atualizar_identidade_na_memoria(
                aluno_id,
                novos_encodings
            )

            encodings_cadastro_pendentes.pop(
                aluno_id,
                None
            )

            try:

                resposta = requests.post(
                    f"{NODE_API_URL}/ia/cadastro-concluido",
                    json={
                        "token": enrollment_token
                    },
                    headers={
                        "x-api-key": IA_API_KEY,
                        "Accept": "application/json"
                    },
                    timeout=NODE_TIMEOUT_SEGUNDOS,
                )

                if not resposta.ok:

                    logger.warning(
                        "Node não marcou cadastro biométrico como concluído: HTTP %s",
                        resposta.status_code
                    )

            except requests.RequestException as erro:

                logger.warning(
                    "Falha ao avisar Node sobre conclusão do cadastro: %s",
                    erro
                )

        return {
            "status": "sucesso",
            "mensagem": (
                f"Foto {numero_foto} salva!"
            ),
            "aluno": nome_limpo
        }

    except HTTPException:
        raise

    except Exception as erro:

        logger.exception(
            "Erro durante cadastro facial: %s",
            erro
        )

        raise HTTPException(
            status_code=500,
            detail="Falha interna ao processar o cadastro facial."
        ) from erro

# ============================================================
# RECONHECIMENTO FACIAL
# ============================================================

def calcular_face_score(distancia):
    return calcular_face_score_util(distancia, TOLERANCIA_RECONHECIMENTO, NODE_MIN_FACE_SCORE)


def _node_post(path, payload):
    try:
        resposta = requests.post(
            f"{NODE_API_URL}{path}",
            json=payload,
            headers={"x-api-key": IA_API_KEY, "Accept": "application/json"},
            timeout=NODE_TIMEOUT_SEGUNDOS,
        )
        try:
            corpo = resposta.json()
        except ValueError:
            corpo = {"message": resposta.text[:1000] or "Resposta não-JSON do backend."}
        return resposta, corpo
    except requests.exceptions.Timeout as erro:
        raise HTTPException(status_code=504, detail="O backend demorou demais para responder.") from erro
    except requests.exceptions.RequestException as erro:
        raise HTTPException(status_code=503, detail="Não foi possível conectar ao backend Node.") from erro


def registrar_presenca_no_node(identidade, distancia):
    info, erro_mapeamento = obter_mapeamento_aluno(identidade)
    if erro_mapeamento:
        return {"ok": False, "tipo": "MAPEAMENTO_INVALIDO", "mensagem": erro_mapeamento}
    if not IA_API_KEY:
        return {"ok": False, "tipo": "CONFIGURACAO", "mensagem": "IA_API_KEY não configurada."}

    face_score = calcular_face_score(distancia)
    resposta, corpo = _node_post("/ia/registrar-presenca", {
        "alunoId": info["alunoId"],
        "turmaId": info["turmaId"],
        "faceScore": face_score,
    })
    if resposta.ok:
        return {"ok": True, "faceScore": face_score, "alunoNome": info.get("nome"), "data": corpo}

    mapa_erros = {
        400: "REQUISICAO_INVALIDA", 401: "API_KEY_INVALIDA", 403: "SEM_PERMISSAO",
        404: "ROTA_NAO_ENCONTRADA", 409: "CONFLITO", 422: "RECONHECIMENTO_REJEITADO",
        428: "SEGUNDO_FATOR_NECESSARIO", 429: "RATE_LIMIT",
    }
    return {
        "ok": False,
        "tipo": mapa_erros.get(resposta.status_code, "ERRO_BACKEND"),
        "http_status": resposta.status_code,
        "faceScore": face_score,
        "alunoNome": info.get("nome"),
        "mensagem": extrair_mensagem_backend(corpo, f"Backend respondeu HTTP {resposta.status_code}."),
        "data": corpo,
    }


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def criar_desafio_ambiguidade(candidatos):
    if not IA_API_KEY:
        raise HTTPException(status_code=503, detail="IA_API_KEY não configurada para desafio de identidade.")
    payload = {
        "exp": int(time.time()) + 120,
        "nonce": _b64url_encode(os.urandom(16)),
        "candidatos": candidatos[:3],
    }
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    assinatura = hmac.new(IA_API_KEY.encode("utf-8"), raw, hashlib.sha256).digest()
    return f"{_b64url_encode(raw)}.{_b64url_encode(assinatura)}"


def _limpar_desafios_consumidos():
    agora = int(time.time())
    for digest, exp in list(DESAFIOS_CONSUMIDOS.items()):
        if exp < agora:
            DESAFIOS_CONSUMIDOS.pop(digest, None)


def validar_desafio_ambiguidade(token):
    _limpar_desafios_consumidos()
    digest = hashlib.sha256(str(token).encode("utf-8")).hexdigest()
    if digest in DESAFIOS_CONSUMIDOS:
        raise HTTPException(status_code=409, detail="Este desafio de identidade já foi utilizado.")
    try:
        payload_b64, assinatura_b64 = token.split(".", 1)
        raw = _b64url_decode(payload_b64)
        assinatura = _b64url_decode(assinatura_b64)
        esperada = hmac.new(IA_API_KEY.encode("utf-8"), raw, hashlib.sha256).digest()
        if not hmac.compare_digest(assinatura, esperada):
            raise ValueError("assinatura inválida")
        payload = json.loads(raw.decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("desafio expirado")
        if not payload.get("nonce"):
            raise ValueError("nonce ausente")
        candidatos = payload.get("candidatos")
        if not isinstance(candidatos, list) or not 1 <= len(candidatos) <= 3:
            raise ValueError("candidatos inválidos")
        return candidatos
    except HTTPException:
        raise
    except Exception as erro:
        raise HTTPException(status_code=400, detail="Desafio de identidade inválido ou expirado.") from erro


def consumir_desafio_ambiguidade(token):
    # Revalida antes de consumir e guarda apenas o digest por pouco tempo.
    validar_desafio_ambiguidade(token)
    digest = hashlib.sha256(str(token).encode("utf-8")).hexdigest()
    DESAFIOS_CONSUMIDOS[digest] = int(time.time()) + 130


def candidatos_para_node(candidatos):
    saida = []
    for candidato in candidatos:
        identidade = candidato["identidade"]
        distancia = candidato["distancia"]
        info, erro = obter_mapeamento_aluno(identidade)
        if erro or not info:
            continue
        saida.append({
            "alunoId": info["alunoId"],
            "turmaId": info["turmaId"],
            "faceScore": calcular_face_score(distancia),
        })
    return saida


def reconhecer_face_com_rgb(imagem_rgb):
    """Identifica usando consenso das múltiplas fotos cadastradas por aluno.

    Em vez de escolher a melhor FOTO do banco, agrupamos as distâncias por
    identidade. Isso reduz o peso de uma única foto acidentalmente parecida e
    permite detectar explicitamente quando os dois melhores alunos ficam muito
    próximos (situação comum em gêmeos idênticos).
    """
    imagem_rgb = np.ascontiguousarray(imagem_rgb, dtype=np.uint8)
    locais = face_recognition.face_locations(imagem_rgb)

    if not locais:
        for rotacao in (cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE):
            rotacionada = np.ascontiguousarray(cv2.rotate(imagem_rgb, rotacao), dtype=np.uint8)
            locais = face_recognition.face_locations(rotacionada)
            if locais:
                imagem_rgb = rotacionada
                break

    if not locais:
        return {"status": "nao_encontrado", "motivo": "Nenhum rosto detectado."}
    if len(locais) != 1:
        return {"status": "nao_encontrado", "motivo": "Mantenha somente uma pessoa diante da câmera."}

    top, right, bottom, left = locais[0]
    if min(bottom - top, right - left) < 120:
        return {"status": "nao_encontrado", "motivo": "Aproxime um pouco o rosto da câmera."}

    encodings = face_recognition.face_encodings(imagem_rgb, known_face_locations=locais, num_jitters=1)
    if len(encodings) != 1 or not rostos_conhecidos_encodings:
        return {"status": "nao_encontrado", "motivo": "Não foi possível extrair uma identidade facial confiável."}

    distancias = face_recognition.face_distance(rostos_conhecidos_encodings, encodings[0])
    por_aluno = {}
    for identidade, distancia in zip(rostos_conhecidos_nomes, distancias):
        por_aluno.setdefault(identidade, []).append(float(distancia))

    candidatos = []
    diagnostico = []

    for identidade, valores in por_aluno.items():
        ordenadas = sorted(valores)
        melhor = ordenadas[0]
        amostra = ordenadas[:min(2, len(ordenadas))]
        media_melhores = sum(amostra) / len(amostra)

        # 70% melhor amostra + 30% consistência entre as duas melhores.
        # Isso aproveita as múltiplas fotos cadastradas sem deixar uma foto
        # lateral ruim dominar completamente a decisão.
        distancia_agregada = (0.70 * melhor) + (0.30 * media_melhores)

        diagnostico.append({
            "identidade": identidade,
            "melhor": float(melhor),
            "agregada": float(distancia_agregada),
            "distancias": [float(v) for v in ordenadas],
        })

        if (
            melhor <= TOLERANCIA_RECONHECIMENTO
            and distancia_agregada <= (TOLERANCIA_RECONHECIMENTO + 0.015)
        ):
            candidatos.append({
                "identidade": identidade,
                "distancia": float(distancia_agregada),
                "melhorFoto": float(melhor),
                "amostras": len(valores),
            })

    diagnostico.sort(key=lambda item: item["agregada"])
    logger.info(
        "DEBUG reconhecimento | tolerancia=%.3f | top=%s",
        TOLERANCIA_RECONHECIMENTO,
        [
            {
                "id": item["identidade"],
                "melhor": round(item["melhor"], 4),
                "agregada": round(item["agregada"], 4),
                "fotos": [round(v, 4) for v in item["distancias"]],
            }
            for item in diagnostico[:3]
        ],
    )

    if not candidatos:
        melhor_debug = diagnostico[0] if diagnostico else None
        if melhor_debug:
            logger.warning(
                "Reconhecimento rejeitado | melhor identidade=%s | melhorFoto=%.4f | agregada=%.4f | limite=%.4f",
                melhor_debug["identidade"],
                melhor_debug["melhor"],
                melhor_debug["agregada"],
                TOLERANCIA_RECONHECIMENTO,
            )
        return {"status": "nao_encontrado", "motivo": "Rosto fora do limite de confiança."}

    candidatos.sort(key=lambda item: item["distancia"])
    melhor = candidatos[0]
    if len(candidatos) > 1:
        delta = candidatos[1]["distancia"] - melhor["distancia"]
        if delta < MARGEM_MINIMA_CONFIANCA:
            logger.warning(
                "Identidade ambígua: %s=%.4f / %s=%.4f / margem=%.4f",
                melhor["identidade"], melhor["distancia"], candidatos[1]["identidade"], candidatos[1]["distancia"], delta,
            )
            return {"status": "ambiguo", "candidatos": candidatos[:2], "margem": float(delta)}

    logger.info(
        "Rosto reconhecido | identidade=%s | distancia=%.4f | score=%.3f",
        melhor["identidade"],
        melhor["distancia"],
        calcular_face_score(melhor["distancia"]),
    )
    return {"status": "reconhecido", "identidade": melhor["identidade"], "distancia": melhor["distancia"]}


def formatar_sucesso_node(resultado_node, aluno_nome):
    resposta_node = resultado_node.get("data") or {}
    dados_evento = resposta_node.get("data") if isinstance(resposta_node, dict) else None
    dados_evento = dados_evento if isinstance(dados_evento, dict) else {}
    evento = dados_evento.get("status")
    registro_novo = evento != "IGNORADO"
    mensagens = {
        "ENTRADA_REGISTRADA": "Entrada registrada com sucesso.",
        "SAIDA_REGISTRADA": "Saída registrada com sucesso.",
        "SAIDA_ANTECIPADA_REGISTRADA": "Saída antecipada registrada.",
        "IGNORADO": dados_evento.get("mensagem", "O ciclo de presença de hoje já foi concluído."),
    }
    return {
        "status": "sucesso",
        "reconhecido": True,
        "presenca_registrada": registro_novo,
        "aluno": aluno_nome,
        "faceScore": resultado_node.get("faceScore"),
        "evento": evento,
        "mensagem": mensagens.get(evento, "Reconhecimento processado pelo backend."),
    }


@app.post("/reconhecer")
async def reconhecer_rosto(file: UploadFile = File(...), authorization: str | None = Header(None)):
    validar_usuario_node(authorization, {"ADMIN", "SECRETARIA", "PROFESSOR"})
    conteudo = await file.read()
    validar_upload_imagem(file, conteudo)
    try:
        imagem_rgb = np.ascontiguousarray(normalizar_imagem_rgb(conteudo, max_lado=1200), dtype=np.uint8)
        imagem_bgr = cv2.cvtColor(imagem_rgb, cv2.COLOR_RGB2BGR)
    except Exception as erro:
        logger.warning("Imagem ilegível no reconhecimento: %s", erro)
        return {"status": "erro", "reconhecido": False, "presenca_registrada": False, "mensagem": "Formato de imagem ilegível."}

    nitidez = medir_nitidez(imagem_bgr)
    logger.info(
        "Qualidade reconhecimento | nitidez=%.2f | minimo=%.2f | resolucao=%sx%s",
        nitidez,
        NITIDEZ_MIN_RECONHECIMENTO,
        imagem_bgr.shape[1],
        imagem_bgr.shape[0],
    )
    if nitidez < NITIDEZ_MIN_RECONHECIMENTO:
        return {
            "status": "sucesso",
            "reconhecido": False,
            "presenca_registrada": False,
            "mensagem": (
                f"Imagem borrada (nitidez {nitidez:.0f}). "
                "Fique parado e tente novamente."
            ),
        }

    resultado = reconhecer_face_com_rgb(imagem_rgb)
    if resultado["status"] == "nao_encontrado":
        if not rostos_conhecidos_encodings:
            return {"status": "erro", "reconhecido": False, "presenca_registrada": False, "mensagem": "Banco facial vazio. Cadastre a biometria pelo Dashboard."}
        return {"status": "sucesso", "reconhecido": False, "presenca_registrada": False, "mensagem": resultado.get("motivo", "Rosto não reconhecido com segurança.")}

    if resultado["status"] == "ambiguo":
        candidatos = candidatos_para_node(resultado["candidatos"])
        if not candidatos:
            return {"status": "sucesso", "reconhecido": False, "presenca_registrada": False, "mensagem": "Identidade ambígua sem cadastro de verificação. Procure a secretaria."}
        return {
            "status": "verificacao_adicional",
            "reconhecido": False,
            "presenca_registrada": False,
            "desafio": criar_desafio_ambiguidade(candidatos),
            "mensagem": "Rostos muito semelhantes detectados. Informe o código pessoal.",
        }

    identidade = resultado["identidade"]
    distancia = resultado["distancia"]
    resultado_node = registrar_presenca_no_node(identidade, distancia)
    info, _ = obter_mapeamento_aluno(identidade)
    aluno_nome = resultado_node.get("alunoNome") or (info.get("nome") if info else identidade)

    if not resultado_node.get("ok") and resultado_node.get("tipo") == "SEGUNDO_FATOR_NECESSARIO":
        candidatos = candidatos_para_node([{"identidade": identidade, "distancia": distancia}])
        return {
            "status": "verificacao_adicional",
            "reconhecido": False,
            "presenca_registrada": False,
            "desafio": criar_desafio_ambiguidade(candidatos),
            "mensagem": "Esta identidade exige confirmação com código pessoal.",
        }

    if not resultado_node.get("ok"):
        return {
            "status": "erro",
            "reconhecido": True,
            "presenca_registrada": False,
            "aluno": aluno_nome,
            "faceScore": resultado_node.get("faceScore"),
            "tipo_erro": resultado_node.get("tipo"),
            "mensagem": resultado_node.get("mensagem", "Rosto reconhecido, mas a presença não foi confirmada."),
        }

    return formatar_sucesso_node(resultado_node, aluno_nome)


@app.post("/confirmar-ambiguidade")
async def confirmar_ambiguidade(request: Request, authorization: str | None = Header(None)):
    validar_usuario_node(authorization, {"ADMIN", "SECRETARIA", "PROFESSOR"})
    try:
        corpo = await request.json()
    except Exception as erro:
        raise HTTPException(status_code=400, detail="JSON inválido.") from erro

    codigo = str(corpo.get("codigo") or "").strip()
    desafio = str(corpo.get("desafio") or "").strip()
    if len(codigo) != 6 or not codigo.isdigit():
        raise HTTPException(status_code=422, detail="O código pessoal deve possuir 6 dígitos.")
    candidatos = validar_desafio_ambiguidade(desafio)
    resposta, payload = _node_post("/ia/resolver-ambiguidade", {"codigo": codigo, "candidatos": candidatos})
    if not resposta.ok:
        raise HTTPException(status_code=resposta.status_code, detail=extrair_mensagem_backend(payload, "Código pessoal inválido."))

    consumir_desafio_ambiguidade(desafio)
    dados = payload.get("data") or {}
    aluno = dados.get("aluno") or {}
    resultado_node = {"ok": True, "faceScore": dados.get("presenca", {}).get("faceScore"), "data": payload}
    return formatar_sucesso_node(resultado_node, aluno.get("nome") or "Aluno identificado")