"""REST API для преподавателей: /api/teachers

GET    /api/teachers               — список преподавателей
GET    /api/teachers/{id}          — один преподаватель
GET    /api/teachers/{id}/schedule — расписание преподавателя на неделю
POST / PUT / DELETE                — только для admin
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..texts import in_use_message
from ..database import get_db
from ..models import Lesson, Teacher
from ..schedule_service import build_week
from ..schemas import TeacherIn, TeacherOut, WeekSchedule

router = APIRouter(prefix="/api/teachers", tags=["Преподаватели"])


def find_teacher(db: Session, teacher_id: int) -> Teacher:
    teacher = db.get(Teacher, teacher_id)
    if teacher is None:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    return teacher


@router.get("", response_model=list[TeacherOut])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).order_by(Teacher.full_name).all()


@router.get("/{teacher_id}", response_model=TeacherOut)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    return find_teacher(db, teacher_id)


@router.get("/{teacher_id}/schedule", response_model=WeekSchedule)
def teacher_schedule(teacher_id: int, week_start: Optional[date] = None, db: Session = Depends(get_db)):
    find_teacher(db, teacher_id)
    lessons = db.query(Lesson).filter(Lesson.teacher_id == teacher_id).all()
    return build_week(db, lessons, week_start or date.today())


@router.post("", response_model=TeacherOut, status_code=201, dependencies=[Depends(require_admin)])
def create_teacher(data: TeacherIn, db: Session = Depends(get_db)):
    teacher = Teacher(**data.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}", response_model=TeacherOut, dependencies=[Depends(require_admin)])
def update_teacher(teacher_id: int, data: TeacherIn, db: Session = Depends(get_db)):
    teacher = find_teacher(db, teacher_id)
    for field, value in data.model_dump().items():
        setattr(teacher, field, value)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = find_teacher(db, teacher_id)
    if teacher.lessons:
        raise HTTPException(status_code=409, detail=in_use_message("преподаватель", len(teacher.lessons)))
    db.delete(teacher)
    db.commit()
