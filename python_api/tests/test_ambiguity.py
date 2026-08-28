import os
import sys
import types
import unittest
from unittest.mock import patch

import numpy as np
from fastapi import HTTPException

if 'face_recognition' not in sys.modules:
    fake = types.ModuleType('face_recognition')
    fake.load_image_file = lambda _path: np.zeros((200, 200, 3), dtype=np.uint8)
    fake.face_encodings = lambda _img, **_kw: [np.zeros(128)]
    fake.face_locations = lambda _img: [(20, 180, 180, 20)]
    fake.face_landmarks = lambda _img, _loc=None: []
    fake.face_distance = lambda _known, _face: np.array([0.2] * len(_known))
    sys.modules['face_recognition'] = fake

os.environ.setdefault('IA_API_KEY', 'chave-interna-de-teste-123456789')
os.environ.setdefault('NODE_API_URL', 'http://localhost:3000')

import main  # noqa: E402


class AmbiguityTests(unittest.TestCase):
    def test_desafio_assinado_preserva_candidatos(self):
        candidatos = [
            {'alunoId': 'a', 'turmaId': 't', 'faceScore': 0.93},
            {'alunoId': 'b', 'turmaId': 't', 'faceScore': 0.92},
        ]
        token = main.criar_desafio_ambiguidade(candidatos)
        self.assertEqual(main.validar_desafio_ambiguidade(token), candidatos)

    def test_desafio_adulterado_e_rejeitado(self):
        token = main.criar_desafio_ambiguidade([{'alunoId': 'a', 'turmaId': 't', 'faceScore': 0.9}])
        adulterado = ('A' if token[0] != 'A' else 'B') + token[1:]
        with self.assertRaises(HTTPException):
            main.validar_desafio_ambiguidade(adulterado)

    def test_desafio_consumido_nao_pode_ser_reutilizado(self):
        token = main.criar_desafio_ambiguidade([{'alunoId': 'a', 'turmaId': 't', 'faceScore': 0.9}])
        main.consumir_desafio_ambiguidade(token)
        with self.assertRaises(HTTPException) as ctx:
            main.validar_desafio_ambiguidade(token)
        self.assertEqual(ctx.exception.status_code, 409)

    @patch.object(main.face_recognition, 'face_locations', return_value=[(20, 180, 180, 20)])
    @patch.object(main.face_recognition, 'face_encodings', return_value=[np.zeros(128)])
    @patch.object(main.face_recognition, 'face_distance', return_value=np.array([0.30, 0.31, 0.305, 0.315]))
    def test_rostos_muito_proximos_viram_ambiguos_em_vez_de_chute(self, *_mocks):
        antigos_enc = list(main.rostos_conhecidos_encodings)
        antigos_nom = list(main.rostos_conhecidos_nomes)
        try:
            main.rostos_conhecidos_encodings[:] = [np.zeros(128) for _ in range(4)]
            main.rostos_conhecidos_nomes[:] = ['gemea-a', 'gemea-a', 'gemea-b', 'gemea-b']
            resultado = main.reconhecer_face_com_rgb(np.zeros((200, 200, 3), dtype=np.uint8))
            self.assertEqual(resultado['status'], 'ambiguo')
            self.assertEqual(len(resultado['candidatos']), 2)
        finally:
            main.rostos_conhecidos_encodings[:] = antigos_enc
            main.rostos_conhecidos_nomes[:] = antigos_nom


if __name__ == '__main__':
    unittest.main()
