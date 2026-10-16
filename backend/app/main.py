"""Точка входа backend. Запуск из папки backend:

    uvicorn app.main:app --reload

Документация API откроется по адресу http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, changes, classrooms, groups, lessons, schedule, subjects, teachers
from .seed import seed_if_empty

# Создаём таблицы (если их ещё нет) и заполняем тестовыми данными
Base.metadata.create_all(bind=engine)
seed_if_empty()

app = FastAPI(title="SLOT. API", description="Расписание колледжа")

# Разрешаем frontend (Vite на порту 5173) обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in [auth, groups, teachers, subjects, classrooms, lessons, changes, schedule]:
    app.include_router(module.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
