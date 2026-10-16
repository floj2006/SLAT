"""Расписание группы на неделю и поиск.

GET /api/groups/{id}/schedule?week_start=2026-10-12
GET /api/search?q=ис
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Group, Lesson, Teacher
from ..schedule_service import build_week
from ..schemas import SearchOut, WeekSchedule

router = APIRouter(tags=["Расписание"])


@router.get("/api/groups/{group_id}/schedule", response_model=WeekSchedule)
def group_schedule(group_id: int, week_start: Optional[date] = None, db: Session = Depends(get_db)):
    if db.get(Group, group_id) is None:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    lessons = db.query(Lesson).filter(Lesson.group_id == group_id).all()
    return build_week(db, lessons, week_start or date.today())


@router.get("/api/search", response_model=SearchOut)
def search(q: str = "", db: Session = Depends(get_db)):
    """Ищет группы и преподавателей по части названия или фамилии.

    SQLite не умеет регистронезависимо сравнивать русские буквы,
    поэтому сравниваем в Python через lower(). Данных немного — это быстро.
    """
    text = q.strip().lower()
    if not text:
        return {"groups": [], "teachers": []}

    groups = [g for g in db.query(Group).order_by(Group.name).all() if text in g.name.lower()]
    teachers = [
        t for t in db.query(Teacher).order_by(Teacher.full_name).all()
        if text in t.full_name.lower() or text in t.department.lower()
    ]
    return {"groups": groups[:10], "teachers": teachers[:10]}
