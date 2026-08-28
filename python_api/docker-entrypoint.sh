#!/bin/sh
set -eu

DATA_DIR="${BIOMETRIC_DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR/banco_alunos"
chown -R appuser:appuser "$DATA_DIR"

exec gosu appuser python run.py
