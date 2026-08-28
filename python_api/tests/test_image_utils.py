import io
import unittest

import numpy as np
from PIL import Image

from image_utils import normalizar_imagem_bgr, normalizar_imagem_rgb


class ImageUtilsTests(unittest.TestCase):
    @staticmethod
    def imagem_bytes(modo='RGBA', tamanho=(1600, 800)):
        imagem = Image.new(modo, tamanho, color=(10, 20, 30, 255) if modo == 'RGBA' else 128)
        buffer = io.BytesIO()
        imagem.save(buffer, format='PNG')
        return buffer.getvalue()

    def test_normalizacao_rgb_entrega_uint8_tres_canais_contiguos(self):
        imagem = normalizar_imagem_rgb(self.imagem_bytes(), max_lado=1200)
        self.assertEqual(imagem.dtype, np.uint8)
        self.assertEqual(imagem.shape[2], 3)
        self.assertTrue(imagem.flags['C_CONTIGUOUS'])
        self.assertEqual(max(imagem.shape[:2]), 1200)

    def test_normalizacao_remove_alpha(self):
        imagem = normalizar_imagem_rgb(self.imagem_bytes('RGBA', (40, 40)))
        self.assertEqual(imagem.shape, (40, 40, 3))

    def test_normalizacao_bgr_tambem_e_uint8_contigua(self):
        imagem = normalizar_imagem_bgr(self.imagem_bytes('RGBA', (40, 40)))
        self.assertEqual(imagem.dtype, np.uint8)
        self.assertTrue(imagem.flags['C_CONTIGUOUS'])
        self.assertEqual(imagem.shape, (40, 40, 3))

    def test_bytes_invalidos_geram_erro(self):
        with self.assertRaises(Exception):
            normalizar_imagem_rgb(b'nao-e-imagem')


if __name__ == '__main__':
    unittest.main()
