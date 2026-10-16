"""REST API для предметов: /api/subjects"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..texts import in_use_message
from ..database import get_db
from ..models import Subject
from ..schemas import SubjectIn, SubjectOut

router = APIRouter(prefix="/api/subjects", tags=["Предметы"])


def find_subject(db: Session, subject_id: int) -> Subject:
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    return subject


@router.get("", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.name).all()


@router.post("", response_model=SubjectOut, status_code=201, dependencies=[Depends(require_admin)])
def create_subject(data: SubjectIn, db: Session = Depends(get_db)):
    if db.query(Subject).filter(Subject.name == data.name).first():
        raise HTTPException(status_code=409, detail="Такой предмет уже есть в справочнике.")
    subject = Subject(**data.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/{subject_id}", response_model=SubjectOut, dependencies=[Depends(require_admin)])
def update_subject(subject_id: int, data: SubjectIn, db: Session = Depends(get_db)):
    subject = find_subject(db, subject_id)
    subject.name = data.name
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = find_subject(db, subject_id)
    if subject.lessons:
        raise HTTPException(status_code=409, detail=in_use_message("предмет", len(subject.lessons)))
    db.delete(subject)
    db.commit()
