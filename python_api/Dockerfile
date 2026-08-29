FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CMAKE_BUILD_PARALLEL_LEVEL=1 \
    MAKEFLAGS=-j1 \
    APP_ENV=production \
    BIOMETRIC_DATA_DIR=/app/data

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential cmake libopenblas-dev liblapack-dev gosu \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-prod.txt ./requirements-prod.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements-prod.txt

COPY core_utils.py image_utils.py main.py run.py ./
COPY static ./static
COPY templates ./templates
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/data/banco_alunos \
    && chown -R appuser:appuser /app \
    && chmod +x /app/docker-entrypoint.sh

# O entrypoint inicia como root apenas para ajustar as permissões do disk montado,
# então troca imediatamente para o usuário sem privilégios appuser via gosu.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
