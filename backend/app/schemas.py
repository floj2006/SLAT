"""Схемы Pydantic — описание того, какие данные приходят в API и уходят из него.

Модели (models.py) описывают таблицы в базе.
Схемы (этот файл) описывают JSON, который видит frontend.
Pydantic сам проверяет типы: если прислать pair_number="abc",
FastAPI вернёт ошибку 422 ещё до того, как код эндпоинта запустится.
"""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

WeekType = Literal["both", "odd", "even"]
ChangeType = Literal["replacement", "room", "cancelled"]


class OrmModel(BaseModel):
    # from_attributes=True позволяет создавать схему прямо из объекта SQLAlchemy
    model_config = ConfigDict(from_attributes=True)


# ---------- Справочники ----------

class GroupIn(BaseModel):
    name: str = Field(min_length=1)
    course: int = Field(ge=1, le=4)
    specialty: str = Field(min_length=1)


class GroupOut(OrmModel, GroupIn):
    id: int


class TeacherIn(BaseModel):
    full_name: str = Field(min_length=1)
    department: str = Field(min_length=1)
    email: str = ""


class TeacherOut(OrmModel, TeacherIn):
    id: int


class SubjectIn(BaseModel):
    name: str = Field(min_length=1)


class SubjectOut(OrmModel, SubjectIn):
    id: int


class ClassroomIn(BaseModel):
    number: str = Field(min_length=1)
    building: str = Field(min_length=1)
    capacity: int = Field(ge=1, default=30)


class ClassroomOut(OrmModel, ClassroomIn):
    id: int


# ---------- Занятия ----------

class LessonIn(BaseModel):
    group_id: int
    subject_id: int
    teacher_id: int
    classroom_id: int
    day_of_week: int = Field(ge=1, le=6)
    pair_number: int = Field(ge=1, le=6)
    week_type: WeekType = "both"
    lesson_type: str = "Лекция"


class LessonOut(OrmModel):
    id: int
    day_of_week: int
    pair_number: int
    week_type: str
    lesson_type: str
    group: GroupOut
    subject: SubjectOut
    teacher: TeacherOut
    classroom: ClassroomOut


# ---------- Изменения ----------

class ChangeIn(BaseModel):
    lesson_id: int
    date: date
    change_type: ChangeType
    new_teacher_id: Optional[int] = None
    new_classroom_id: Optional[int] = None
    comment: str = ""


class ChangeOut(OrmModel):
    id: int
    date: date
    change_type: str
    comment: str
    lesson: LessonOut
    new_teacher: Optional[TeacherOut] = None
    new_classroom: Optional[ClassroomOut] = None


# ---------- Расписание на неделю ----------

class ScheduleLesson(BaseModel):
    """Занятие в конкретный день с уже применённым изменением (если оно есть)."""

    lesson: LessonOut
    change: Optional[ChangeOut] = None


class ScheduleDay(BaseModel):
    date: date
    day_of_week: int
    lessons: list[ScheduleLesson]


class WeekSchedule(BaseModel):
    week_start: date
    week_type: str  # odd / even — какая это неделя
    days: list[ScheduleDay]


# ---------- Авторизация ----------

class LoginIn(BaseModel):
    username: str
    password: str


class UserOut(OrmModel):
    username: str
    role: str


class LoginOut(BaseModel):
    token: str
    user: UserOut


class SearchOut(BaseModel):
    groups: list[GroupOut]
    teachers: list[TeacherOut]
