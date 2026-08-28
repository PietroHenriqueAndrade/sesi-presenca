"""Normalização de imagens antes de OpenCV/dlib/face_recognition."""
import io

import cv2
import numpy as np
from PIL import Image, ImageOps


def normalizar_imagem_rgb(conteudo: bytes, max_lado: int | None = None) -> np.ndarray:
    """Retorna imagem RGB 8-bit e C-contiguous, o formato aceito pelo dlib.

    Corrige EXIF, remove alpha/paleta e opcionalmente limita a maior dimensão.
    Lança exceção quando os bytes não representam uma imagem válida.
    """
    with Image.open(io.BytesIO(conteudo)) as imagem_pil:
        imagem_pil = ImageOps.exif_transpose(imagem_pil).convert("RGB")
        imagem_rgb = np.asarray(imagem_pil, dtype=np.uint8)

    if max_lado:
        altura, largura = imagem_rgb.shape[:2]
        maior = max(altura, largura)
        if maior > max_lado:
            escala = float(max_lado) / float(maior)
            nova_largura = max(1, int(largura * escala))
            nova_altura = max(1, int(altura * escala))
            imagem_rgb = cv2.resize(
                imagem_rgb,
                (nova_largura, nova_altura),
                interpolation=cv2.INTER_AREA,
            )

    return np.ascontiguousarray(imagem_rgb, dtype=np.uint8)


def normalizar_imagem_bgr(conteudo: bytes, max_lado: int | None = None) -> np.ndarray:
    imagem_rgb = normalizar_imagem_rgb(conteudo, max_lado=max_lado)
    return np.ascontiguousarray(
        cv2.cvtColor(imagem_rgb, cv2.COLOR_RGB2BGR),
        dtype=np.uint8,
    )
