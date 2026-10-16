"""Вход и выход администратора: /api/auth"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import check_login, get_current_user, new_token
from ..database import get_db
from ..models import User
from ..schemas import LoginIn, LoginOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["Авторизация"])


@router.post("/login", response_model=LoginOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not check_login(user, data.password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль. Проверьте раскладку и Caps Lock.")

    user.token = new_token()
    db.commit()
    return {"token": user.token, "user": user}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=204)
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.token = None
    db.commit()
