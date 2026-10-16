"""Автотесты API. Запуск из папки backend:  python -m pytest -q

Тесты работают с отдельной временной базой, рабочую slot.db не трогают.
"""

import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.seed import seed


@pytest.fixture
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
    TestSession = sessionmaker(bind=engine, autoflush=False)
    Base.metadata.create_all(bind=engine)
    db = TestSession()
    seed(db)
    db.close()

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    engine.dispose()
    os.remove(path)


def login(client, username="admin", password="admin123"):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_groups_and_schedule(client):
    groups = client.get("/api/groups").json()
    assert len(groups) == 6
    week = client.get(f"/api/groups/{groups[0]['id']}/schedule?week_start=2026-10-14").json()
    assert week["week_start"] == "2026-10-12"  # приведено к понедельнику
    assert len(week["days"]) == 6
    assert sum(len(d["lessons"]) for d in week["days"]) > 0


def test_search(client):
    result = client.get("/api/search", params={"q": "морозова"}).json()
    assert result["teachers"][0]["full_name"].startswith("Морозова")
    assert client.get("/api/search", params={"q": "ис-2"}).json()["groups"]


def test_write_requires_login(client):
    response = client.post("/api/subjects", json={"name": "Робототехника"})
    assert response.status_code == 401


def test_viewer_cannot_edit(client):
    headers = login(client, "student", "student123")
    response = client.post("/api/subjects", json={"name": "Робототехника"}, headers=headers)
    assert response.status_code == 403


def test_wrong_password(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "nope"})
    assert response.status_code == 401


def test_lesson_crud_and_conflicts(client):
    headers = login(client)
    group = client.get("/api/groups").json()[0]
    lessons = client.get("/api/lessons", params={"group_id": group["id"]}).json()
    first = lessons[0]

    payload = {
        "group_id": group["id"], "subject_id": first["subject"]["id"],
        "teacher_id": first["teacher"]["id"], "classroom_id": first["classroom"]["id"],
        "day_of_week": first["day_of_week"], "pair_number": first["pair_number"],
        "week_type": "both", "lesson_type": "Практика",
    }
    # То же время у той же группы — конфликт, и сервер объясняет почему
    conflict = client.post("/api/lessons", json=payload, headers=headers)
    assert conflict.status_code == 409
    assert conflict.json()["detail"] == "У группы уже есть занятие в это время"

    # Свободное время: суббота, 6-я пара
    payload.update(day_of_week=6, pair_number=6)
    created = client.post("/api/lessons", json=payload, headers=headers)
    assert created.status_code == 201
    lesson_id = created.json()["id"]

    payload["lesson_type"] = "Лабораторная"
    updated = client.put(f"/api/lessons/{lesson_id}", json=payload, headers=headers)
    assert updated.json()["lesson_type"] == "Лабораторная"

    assert client.delete(f"/api/lessons/{lesson_id}", headers=headers).status_code == 204
    assert client.delete(f"/api/lessons/{lesson_id}", headers=headers).status_code == 404


def test_change_validation_and_create(client):
    headers = login(client)
    lesson = client.get("/api/lessons").json()[0]  # занятие в понедельник
    teacher = client.get("/api/teachers").json()[-1]

    # 2026-10-13 — вторник, а занятие в понедельник
    wrong_day = {"lesson_id": lesson["id"], "date": "2026-10-13", "change_type": "cancelled"}
    assert client.post("/api/changes", json=wrong_day, headers=headers).status_code == 400

    payload = {"lesson_id": lesson["id"], "date": "2026-11-02", "change_type": "replacement",
               "new_teacher_id": teacher["id"], "comment": "Тест"}
    if lesson["week_type"] == "both":
        response = client.post("/api/changes", json=payload, headers=headers)
        assert response.status_code == 201
        assert response.json()["new_teacher"]["id"] == teacher["id"]


def test_cannot_delete_used_teacher(client):
    headers = login(client)
    teacher = client.get("/api/teachers").json()[0]
    assert client.delete(f"/api/teachers/{teacher['id']}", headers=headers).status_code == 409


def test_demo_changes_are_fresh(client):
    """Тестовые изменения создаются от сегодняшней даты, чтобы демо не «устаревало»."""
    from datetime import date
    changes = client.get("/api/changes", params={"date_from": date.today().isoformat()}).json()
    assert len(changes) >= 5
