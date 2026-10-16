"""Подключение к базе данных SQLite.

Здесь создаются три вещи, которые нужны всему backend:
- engine — «двигатель», который умеет отправлять SQL-запросы в файл slot.db;
- SessionLocal — фабрика сессий (одна сессия = один «разговор» с базой);
- Base — родительский класс для всех моделей-таблиц из models.py.
"""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Файл базы лежит рядом с папкой app: backend/slot.db
DB_PATH = Path(__file__).resolve().parent.parent / "slot.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False нужен SQLite, потому что FastAPI
# может обрабатывать запросы в разных потоках.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autoflush=False)

Base = declarative_base()


def get_db():
    """Открывает сессию на время одного HTTP-запроса и закрывает её после.

    FastAPI вызывает эту функцию через Depends(get_db) в каждом эндпоинте.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
