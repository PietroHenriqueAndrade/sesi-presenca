"""Funções puras do serviço de IA.

Mantidas separadas de ``main.py`` para que regras de integração possam ser
validadas por testes automatizados sem importar dlib/face_recognition.
"""
from uuid import UUID


def normalizar_node_api_url(url: str | None) -> str:
    url = (url or "http://localhost:3000").strip().rstrip("/")
    if not url.endswith("/api/v1"):
        url = f"{url}/api/v1"
    return url


def uuid_valido(valor) -> bool:
    try:
        UUID(str(valor))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def calcular_face_score(distancia, tolerancia: float, score_minimo: float) -> float:
    """Converte distância facial em score normalizado [0, 1].

    Não trata a distância como probabilidade; apenas produz uma escala monotônica
    compatível com o limiar do backend Node.
    """
    if distancia is None:
        return 0.0

    tolerancia = max(float(tolerancia), 1e-9)
    score_minimo = max(0.0, min(1.0, float(score_minimo)))
    distancia = max(0.0, float(distancia))
    qualidade_relativa = 1.0 - min(distancia / tolerancia, 1.0)
    score = score_minimo + qualidade_relativa * (1.0 - score_minimo)
    return round(max(0.0, min(1.0, score)), 4)


def extrair_mensagem_backend(corpo, fallback: str) -> str:
    if isinstance(corpo, dict):
        return (
            corpo.get("message")
            or corpo.get("mensagem")
            or (corpo.get("error") if isinstance(corpo.get("error"), str) else None)
            or fallback
        )
    return fallback
