import unittest

from core_utils import (
    calcular_face_score,
    extrair_mensagem_backend,
    normalizar_node_api_url,
    uuid_valido,
)


class CoreUtilsTests(unittest.TestCase):
    def test_normaliza_url_node_sem_prefixo(self):
        self.assertEqual(normalizar_node_api_url('http://localhost:3000'), 'http://localhost:3000/api/v1')

    def test_preserva_url_node_com_prefixo(self):
        self.assertEqual(normalizar_node_api_url('http://10.0.0.5:3000/api/v1/'), 'http://10.0.0.5:3000/api/v1')

    def test_uuid_valido(self):
        self.assertTrue(uuid_valido('123e4567-e89b-12d3-a456-426614174000'))
        self.assertFalse(uuid_valido('nao-e-uuid'))
        self.assertFalse(uuid_valido(None))

    def test_face_score_e_monotonico_e_limitado(self):
        score_perfeito = calcular_face_score(0.0, 0.46, 0.85)
        score_medio = calcular_face_score(0.23, 0.46, 0.85)
        score_limite = calcular_face_score(0.46, 0.46, 0.85)
        score_ruim = calcular_face_score(0.90, 0.46, 0.85)
        self.assertEqual(score_perfeito, 1.0)
        self.assertGreater(score_perfeito, score_medio)
        self.assertGreater(score_medio, score_limite)
        self.assertEqual(score_limite, 0.85)
        self.assertEqual(score_ruim, 0.85)

    def test_face_score_none_retorna_zero(self):
        self.assertEqual(calcular_face_score(None, 0.46, 0.85), 0.0)

    def test_extrai_mensagem_backend_em_ordem_de_prioridade(self):
        self.assertEqual(extrair_mensagem_backend({'message': 'A'}, 'fallback'), 'A')
        self.assertEqual(extrair_mensagem_backend({'mensagem': 'B'}, 'fallback'), 'B')
        self.assertEqual(extrair_mensagem_backend({'error': 'C'}, 'fallback'), 'C')
        self.assertEqual(extrair_mensagem_backend({}, 'fallback'), 'fallback')


if __name__ == '__main__':
    unittest.main()
