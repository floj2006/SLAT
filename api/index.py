"""Точка входа для Vercel: Vercel запускает этот файл как серверную функцию.

Здесь нет своей логики — просто подключаем то же приложение FastAPI,
что запускается локально командой uvicorn (backend/app/main.py).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402,F401
