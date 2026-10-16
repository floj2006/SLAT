"""Модели — это таблицы базы данных, описанные как Python-классы (ORM).

Один класс = одна таблица. Один атрибут Column = одна колонка.
SQLAlchemy сам превращает эти классы в SQL: CREATE TABLE, SELECT, INSERT...
"""

from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class Group(Base):
    """Учебная группа, например «ИС-21»."""

    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    course = Column(Integer, nullable=False)  # курс: 1, 2, 3, 4
    specialty = Column(String, nullable=False)

    lessons = relationship("Lesson", back_populates="group")


class Teacher(Base):
    """Преподаватель."""

    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=False)  # кафедра / цикловая комиссия
    email = Column(String, nullable=False, default="")

    lessons = relationship("Lesson", back_populates="teacher")


class Subject(Base):
    """Учебный предмет (дисциплина)."""

    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    lessons = relationship("Lesson", back_populates="subject")


class Classroom(Base):
    """Аудитория."""

    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True)
    number = Column(String, unique=True, nullable=False)  # «214», «А-305»
    building = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False, default=30)

    lessons = relationship("Lesson", back_populates="classroom")


class Lesson(Base):
    """Занятие в постоянном расписании.

    Например: «ИС-21, понедельник, 2-я пара, только нечётные недели,
    Базы данных, Морозова, аудитория 214».
    """

    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)

    day_of_week = Column(Integer, nullable=False)  # 1 = понедельник ... 6 = суббота
    pair_number = Column(Integer, nullable=False)  # номер пары: 1..6
    week_type = Column(String, nullable=False, default="both")  # both / odd / even
    lesson_type = Column(String, nullable=False, default="Лекция")

    group = relationship("Group", back_populates="lessons")
    subject = relationship("Subject", back_populates="lessons")
    teacher = relationship("Teacher", back_populates="lessons")
    classroom = relationship("Classroom", back_populates="lessons")

    # cascade: если удалить занятие, удалятся и его замены
    changes = relationship("ScheduleChange", back_populates="lesson", cascade="all, delete-orphan")


class ScheduleChange(Base):
    """Изменение конкретного занятия в конкретную дату.

    change_type:
    - replacement — замена преподавателя;
    - room — перенос в другую аудиторию;
    - cancelled — занятие отменено.
    """

    __tablename__ = "schedule_changes"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    date = Column(Date, nullable=False)
    change_type = Column(String, nullable=False)
    new_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    new_classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    comment = Column(String, nullable=False, default="")

    lesson = relationship("Lesson", back_populates="changes")
    new_teacher = relationship("Teacher")
    new_classroom = relationship("Classroom")


class User(Base):
    """Пользователь административной панели."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")  # admin / viewer
    token = Column(String, nullable=True)  # текущий токен входа
