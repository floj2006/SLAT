"""Авторизация администратора.

Как это работает:
1. Пользователь отправляет логин и пароль на POST /api/auth/login.
2. Сервер сверяет пароль с хешем из базы и выдаёт случайный токен.
3. Frontend хранит токен и добавляет его в каждый запрос:
   заголовок  Authorization: Bearer <токен>
4. Эндпоинты, которые меняют данные, вызывают require_admin.
   Без верного токена сервер ответит 401, без прав администратора — 403.

Пароли не хранятся в открытом виде: в базе лежит только хеш (PBKDF2).
"""

import hashlib
import hmac
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import User


def hash_password(password: str) -> str:
    """Возвращает строку вида 'соль$хеш'. Соль делает одинаковые пароли разными в базе."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, saved_hash: str) -> bool:
    """Проверяет, подходит ли пароль к сохранённому хешу."""
    salt, expected = saved_hash.split("$")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return hmac.compare_digest(digest.hex(), expected)


# Хеш-заглушка от случайного пароля. По нему «проверяем» пароль, когда логина
# нет, — тогда ответ на несуществующий логин длится столько же, сколько на
# существующий, и по времени нельзя угадать, какие логины заведены в системе.
_DUMMY_HASH = hash_password(secrets.token_hex(16))


def check_login(user, password: str) -> bool:
    """Безопасная проверка логина: одинаковое время для любого исхода."""
    if user is None:
        verify_password(password, _DUMMY_HASH)  # считаем «вхолостую»
        return False
    return verify_password(password, user.password_hash)


def new_token() -> str:
    return secrets.token_hex(24)


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    """Находит пользователя по токену из заголовка Authorization."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Войдите в учётную запись, чтобы изменять расписание.")

    token = authorization.removeprefix("Bearer ")
    user = db.query(User).filter(User.token == token).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Сессия истекла. Войдите снова.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Пропускает дальше только пользователя с ролью admin."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав: изменять расписание может только администратор.")
    return user
