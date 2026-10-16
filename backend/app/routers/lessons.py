"""REST API для занятий: /api/lessons

GET    /api/lessons?group_id=1   — список занятий (можно фильтровать)
POST   /api/lessons              — добавить занятие (admin)
PUT    /api/lessons/{id}         — изменить занятие (admin)
DELETE /api/lessons/{id}         — удалить занятие (admin)

Перед сохранением сервер проверяет конфликты: группа, преподаватель
и аудитория не могут быть заняты дважды в одно и то же время.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import Classroom, Group, Lesson, Subject, Teacher
from ..schemas import LessonIn, LessonOut
from ..texts import short_name

router = APIRouter(prefix="/api/lessons", tags=["Занятия"])


def find_lesson(db: Session, lesson_id: int) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Занятие не найдено")
    return lesson


def check_references(db: Session, data: LessonIn):
    """Проверяет, что группа, предмет, преподаватель и аудитория существуют."""
    checks = [
        (Group, data.group_id, "группу"),
        (Subject, data.subject_id, "предмет"),
        (Teacher, data.teacher_id, "преподавателя"),
        (Classroom, data.classroom_id, "аудиторию"),
    ]
    for model, item_id, title in checks:
        if db.get(model, item_id) is None:
            raise HTTPException(
                status_code=400,
                detail=f"Не удалось найти {title} — возможно, запись только что удалили. Обновите страницу.",
            )


def weeks_overlap(week_a: str, week_b: str) -> bool:
    """«Каждую неделю» пересекается со всем, а нечётная с чётной — нет."""
    return week_a == "both" or week_b == "both" or week_a == week_b


def check_conflicts(db: Session, data: LessonIn, skip_id: Optional[int] = None):
    """Ищет занятия в то же время и выдаёт ошибку 409, если кто-то занят."""
    same_time = (
        db.query(Lesson)
        .filter(Lesson.day_of_week == data.day_of_week, Lesson.pair_number == data.pair_number)
        .all()
    )
    overlapping = [
        other for other in same_time
        if other.id != skip_id and weeks_overlap(other.week_type, data.week_type)
    ]
    # Сначала проверяем группу, потом преподавателя, потом аудиторию
    for other in overlapping:
        if other.group_id == data.group_id:
            raise HTTPException(
                status_code=409,
                detail=f"У группы {other.group.name} в это время уже стоит «{other.subject.name}». "
                "Выберите другую пару или измените существующую.",
            )
    for other in overlapping:
        if other.teacher_id == data.teacher_id:
            raise HTTPException(
                status_code=409,
                detail=f"{short_name(other.teacher.full_name)} в это время ведёт пару у группы {other.group.name}. "
                "Выберите другое время или другого преподавателя.",
            )
    for other in overlapping:
        if other.classroom_id == data.classroom_id:
            raise HTTPException(
                status_code=409,
                detail=f"Аудитория {other.classroom.number} в это время занята группой {other.group.name}. "
                "Выберите другую аудиторию.",
            )


@router.get("", response_model=list[LessonOut])
def list_lessons(
    group_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Lesson)
    if group_id:
        query = query.filter(Lesson.group_id == group_id)
    if teacher_id:
        query = query.filter(Lesson.teacher_id == teacher_id)
    return query.order_by(Lesson.day_of_week, Lesson.pair_number).all()


@router.post("", response_model=LessonOut, status_code=201, dependencies=[Depends(require_admin)])
def create_lesson(data: LessonIn, db: Session = Depends(get_db)):
    check_references(db, data)
    check_conflicts(db, data)
    lesson = Lesson(**data.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.put("/{lesson_id}", response_model=LessonOut, dependencies=[Depends(require_admin)])
def update_lesson(lesson_id: int, data: LessonIn, db: Session = Depends(get_db)):
    lesson = find_lesson(db, lesson_id)
    check_references(db, data)
    check_conflicts(db, data, skip_id=lesson_id)
    for field, value in data.model_dump().items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = find_lesson(db, lesson_id)
    db.delete(lesson)
    db.commit()
