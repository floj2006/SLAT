"""REST API для групп: /api/groups

GET    /api/groups        — список групп (доступен всем)
POST   /api/groups        — создать группу (только admin)
PUT    /api/groups/{id}   — изменить группу (только admin)
DELETE /api/groups/{id}   — удалить группу (только admin)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..texts import in_use_message
from ..database import get_db
from ..models import Group
from ..schemas import GroupIn, GroupOut

router = APIRouter(prefix="/api/groups", tags=["Группы"])


def find_group(db: Session, group_id: int) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return group


@router.get("", response_model=list[GroupOut])
def list_groups(db: Session = Depends(get_db)):
    return db.query(Group).order_by(Group.course, Group.name).all()


@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: int, db: Session = Depends(get_db)):
    return find_group(db, group_id)


@router.post("", response_model=GroupOut, status_code=201, dependencies=[Depends(require_admin)])
def create_group(data: GroupIn, db: Session = Depends(get_db)):
    if db.query(Group).filter(Group.name == data.name).first():
        raise HTTPException(status_code=409, detail="Группа с таким названием уже есть. Проверьте список групп.")
    group = Group(**data.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=GroupOut, dependencies=[Depends(require_admin)])
def update_group(group_id: int, data: GroupIn, db: Session = Depends(get_db)):
    group = find_group(db, group_id)
    for field, value in data.model_dump().items():
        setattr(group, field, value)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = find_group(db, group_id)
    if group.lessons:
        raise HTTPException(status_code=409, detail=in_use_message("группа", len(group.lessons)))
    db.delete(group)
    db.commit()
