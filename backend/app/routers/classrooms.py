"""REST API для аудиторий: /api/classrooms"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..texts import in_use_message
from ..database import get_db
from ..models import Classroom
from ..schemas import ClassroomIn, ClassroomOut

router = APIRouter(prefix="/api/classrooms", tags=["Аудитории"])


def find_classroom(db: Session, classroom_id: int) -> Classroom:
    classroom = db.get(Classroom, classroom_id)
    if classroom is None:
        raise HTTPException(status_code=404, detail="Аудитория не найдена")
    return classroom


@router.get("", response_model=list[ClassroomOut])
def list_classrooms(db: Session = Depends(get_db)):
    return db.query(Classroom).order_by(Classroom.number).all()


@router.post("", response_model=ClassroomOut, status_code=201, dependencies=[Depends(require_admin)])
def create_classroom(data: ClassroomIn, db: Session = Depends(get_db)):
    if db.query(Classroom).filter(Classroom.number == data.number).first():
        raise HTTPException(status_code=409, detail="Аудитория с таким номером уже есть в справочнике.")
    classroom = Classroom(**data.model_dump())
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


@router.put("/{classroom_id}", response_model=ClassroomOut, dependencies=[Depends(require_admin)])
def update_classroom(classroom_id: int, data: ClassroomIn, db: Session = Depends(get_db)):
    classroom = find_classroom(db, classroom_id)
    for field, value in data.model_dump().items():
        setattr(classroom, field, value)
    db.commit()
    db.refresh(classroom)
    return classroom


@router.delete("/{classroom_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    classroom = find_classroom(db, classroom_id)
    if classroom.lessons:
        raise HTTPException(status_code=409, detail=in_use_message("аудитория", len(classroom.lessons)))
    db.delete(classroom)
    db.commit()
