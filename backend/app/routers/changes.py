"""REST API для изменений и замен: /api/changes

GET    /api/changes?group_id=1&date_from=2026-10-12  — список изменений
POST   /api/changes        — добавить изменение (admin)
PUT    /api/changes/{id}   — изменить (admin)
DELETE /api/changes/{id}   — удалить (admin)
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import Classroom, Lesson, ScheduleChange, Teacher
from ..schedule_service import week_type_of
from ..schemas import ChangeIn, ChangeOut

router = APIRouter(prefix="/api/changes", tags=["Изменения"])


def find_change(db: Session, change_id: int) -> ScheduleChange:
    change = db.get(ScheduleChange, change_id)
    if change is None:
        raise HTTPException(status_code=404, detail="Изменение не найдено")
    return change


def validate_change(db: Session, data: ChangeIn):
    """Проверяет, что изменение имеет смысл."""
    lesson = db.get(Lesson, data.lesson_id)
    if lesson is None:
        raise HTTPException(status_code=400, detail="Такого занятия нет")

    # Дата должна совпадать с днём недели занятия (isoweekday: 1 = понедельник)
    if data.date.isoweekday() != lesson.day_of_week:
        raise HTTPException(status_code=400, detail="В эту дату у занятия нет пары — другой день недели")
    if lesson.week_type not in ("both", week_type_of(data.date)):
        raise HTTPException(status_code=400, detail="В эту неделю занятие не проводится")

    if data.change_type == "replacement":
        if data.new_teacher_id is None or db.get(Teacher, data.new_teacher_id) is None:
            raise HTTPException(status_code=400, detail="Для замены выберите преподавателя")
    if data.change_type == "room":
        if data.new_classroom_id is None or db.get(Classroom, data.new_classroom_id) is None:
            raise HTTPException(status_code=400, detail="Для переноса выберите аудиторию")


@router.get("", response_model=list[ChangeOut])
def list_changes(
    group_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ScheduleChange).join(Lesson)
    if group_id:
        query = query.filter(Lesson.group_id == group_id)
    if date_from:
        query = query.filter(ScheduleChange.date >= date_from)
    if date_to:
        query = query.filter(ScheduleChange.date <= date_to)
    return query.order_by(ScheduleChange.date, Lesson.pair_number).all()


def save_fields(change: ScheduleChange, data: ChangeIn):
    change.lesson_id = data.lesson_id
    change.date = data.date
    change.change_type = data.change_type
    change.comment = data.comment
    # Лишние поля обнуляем: у отмены нет нового преподавателя и т.д.
    change.new_teacher_id = data.new_teacher_id if data.change_type == "replacement" else None
    change.new_classroom_id = data.new_classroom_id if data.change_type == "room" else None


@router.post("", response_model=ChangeOut, status_code=201, dependencies=[Depends(require_admin)])
def create_change(data: ChangeIn, db: Session = Depends(get_db)):
    validate_change(db, data)
    exists = (
        db.query(ScheduleChange)
        .filter(ScheduleChange.lesson_id == data.lesson_id, ScheduleChange.date == data.date)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Для этой пары в эту дату изменение уже есть")
    change = ScheduleChange()
    save_fields(change, data)
    db.add(change)
    db.commit()
    db.refresh(change)
    return change


@router.put("/{change_id}", response_model=ChangeOut, dependencies=[Depends(require_admin)])
def update_change(change_id: int, data: ChangeIn, db: Session = Depends(get_db)):
    change = find_change(db, change_id)
    validate_change(db, data)
    save_fields(change, data)
    db.commit()
    db.refresh(change)
    return change


@router.delete("/{change_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_change(change_id: int, db: Session = Depends(get_db)):
    change = find_change(db, change_id)
    db.delete(change)
    db.commit()
