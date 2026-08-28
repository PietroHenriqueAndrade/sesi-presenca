import io
import os
import sys
import types
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

# O ambiente de auditoria pode não ter face_recognition instalado. Para testar
# contratos HTTP, substituímos somente o binding nativo por um fake controlado.
if 'face_recognition' not in sys.modules:
    fake = types.ModuleType('face_recognition')
    fake.load_image_file = lambda _path: np.zeros((200, 200, 3), dtype=np.uint8)
    fake.face_encodings = lambda _img, **_kw: [np.zeros(128)]
    fake.face_locations = lambda _img: []
    fake.face_landmarks = lambda _img, _loc=None: []
    fake.face_distance = lambda _known, _face: np.array([0.2])
    sys.modules['face_recognition'] = fake

os.environ.setdefault('IA_API_KEY', 'chave-interna-de-teste-123456789')
os.environ.setdefault('NODE_API_URL', 'http://localhost:3000')

import main  # noqa: E402

ALUNO_ID = '123e4567-e89b-12d3-a456-426614174000'
TURMA_ID = '223e4567-e89b-12d3-a456-426614174000'


class FakeNodeResponse:
    def __init__(self, status_code=200, data=None, message=''):
        self.status_code = status_code
        self.ok = 200 <= status_code < 300
        self._data = data or {}
        self._message = message
        self.text = ''
        self.content = b'{}'

    def json(self):
        if self.ok:
            return {'status': 'success', 'data': self._data}
        return {'status': 'error', 'message': self._message or 'erro'}


def image_bytes():
    img = Image.new('RGB', (300, 300), color=(150, 150, 150))
    out = io.BytesIO()
    img.save(out, format='JPEG')
    return out.getvalue()


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(main.app)

    def test_health_e_publico(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['servico'], 'python-face-api')

    def test_exclusao_biometrica_exige_chave_interna(self):
        response = self.client.delete(f'/alunos/{ALUNO_ID}/biometria')
        self.assertEqual(response.status_code, 401)

    def test_exclusao_biometrica_valida_uuid(self):
        response = self.client.delete(
            '/alunos/invalido/biometria',
            headers={'x-api-key': os.environ['IA_API_KEY']},
        )
        self.assertEqual(response.status_code, 400)

    def test_cadastro_exige_token_de_autorizacao_curta(self):
        response = self.client.post(
            '/cadastrar',
            data={'numero_foto': '1'},
            files={'file': ('foto.jpg', image_bytes(), 'image/jpeg')},
        )
        self.assertEqual(response.status_code, 422)

    @patch.object(main.requests, 'post', return_value=FakeNodeResponse(status_code=401, message='Sessão expirada'))
    def test_cadastro_rejeita_sessao_invalida_emitida_pelo_node(self, _mock_post):
        response = self.client.post(
            '/cadastrar',
            data={'numero_foto': '1', 'enrollment_token': 'token-invalido'},
            files={'file': ('foto.jpg', image_bytes(), 'image/jpeg')},
        )
        self.assertEqual(response.status_code, 401)

    @patch.object(main.requests, 'post', return_value=FakeNodeResponse(data={
        'alunoId': ALUNO_ID,
        'turmaId': TURMA_ID,
        'alunoNome': 'ALUNO TESTE',
        'matricula': '20260001',
    }))
    def test_cadastro_usa_identidade_oficial_da_sessao_node(self, mock_post):
        response = self.client.post(
            '/cadastrar',
            data={
                'numero_foto': '1',
                'enrollment_token': 'token-valido',
                # Campos extras são deliberadamente ignorados; a identidade vem do Node.
                'aluno_id': 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
                'nome': 'OUTRA PESSOA',
            },
            files={'file': ('foto.jpg', image_bytes(), 'image/jpeg')},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.json()['status'], {'erro', 'sucesso'})
        args, kwargs = mock_post.call_args
        self.assertTrue(args[0].endswith('/ia/validar-sessao-cadastro'))
        self.assertEqual(kwargs['json'], {'token': 'token-valido'})


    @patch.object(main.requests, 'get', return_value=FakeNodeResponse(data={'id': 'u1', 'role': 'COZINHA'}))
    def test_perfil_cozinha_nao_opera_terminal_facial(self, _mock_get):
        response = self.client.post(
            '/reconhecer',
            headers={'Authorization': 'Bearer token-valido'},
            files={'file': ('foto.jpg', image_bytes(), 'image/jpeg')},
        )
        self.assertEqual(response.status_code, 403)

    def test_reconhecimento_exige_jwt(self):
        response = self.client.post(
            '/reconhecer',
            files={'file': ('foto.jpg', image_bytes(), 'image/jpeg')},
        )
        self.assertEqual(response.status_code, 401)


if __name__ == '__main__':
    unittest.main()
