"""Тестовые данные. Все имена и группы вымышленные.

Запуск вручную (пересоздаёт базу с нуля):
    python -m app.seed
При обычном старте сервера (main.py) данные добавляются,
только если база пустая.
"""

import os
from datetime import date, timedelta

from .auth import hash_password
from .database import Base, SessionLocal, engine
from .models import Classroom, Group, Lesson, ScheduleChange, Subject, Teacher, User
from .schedule_service import week_type_of

GROUPS = [
    ("ИС-21", 2, "Информационные системы и программирование"),
    ("ИС-22", 2, "Информационные системы и программирование"),
    ("ВЕБ-23", 1, "Веб-разработка"),
    ("ПР-31", 3, "Программирование в компьютерных системах"),
    ("СА-24", 1, "Сетевое и системное администрирование"),
    ("ДИЗ-22", 2, "Графический дизайн"),
]

TEACHERS = [
    ("Морозова Алина Сергеевна", "Информационные технологии", "morozova@slot.college"),
    ("Ветров Павел Андреевич", "Информационные технологии", "vetrov@slot.college"),
    ("Климова Дарья Олеговна", "Математика", "klimova@slot.college"),
    ("Соболев Игорь Викторович", "Сетевые технологии", "sobolev@slot.college"),
    ("Лаптева Ника Романовна", "Дизайн", "lapteva@slot.college"),
    ("Гордеев Марк Ильич", "Гуманитарные дисциплины", "gordeev@slot.college"),
    ("Есина Вера Павловна", "Иностранные языки", "esina@slot.college"),
    ("Тарасов Глеб Денисович", "Физическая культура", "tarasov@slot.college"),
    ("Рябова Елена Игоревна", "Информационные технологии", "ryabova@slot.college"),
    ("Широков Антон Львович", "Математика", "shirokov@slot.college"),
]

SUBJECTS = [
    "Базы данных", "Веб-программирование", "Проектирование ИС", "Математика",
    "Дискретная математика", "Компьютерные сети", "Английский язык", "История",
    "Физическая культура", "Алгоритмы и структуры данных", "UI/UX-дизайн",
    "Операционные системы",
]

CLASSROOMS = [
    ("101", "Корпус А", 30), ("104", "Корпус А", 28), ("201", "Корпус А", 32),
    ("214", "Корпус А", 24), ("305", "Корпус А", 26), ("12", "Корпус Б", 60),
    ("Б-21", "Корпус Б", 20), ("Б-24", "Корпус Б", 20), ("Спортзал", "Корпус Б", 80),
    ("Лаб-3", "Корпус А", 16),
]

# Какой преподаватель ведёт какой предмет (номера из списков выше)
SUBJECT_TEACHER = {
    "Базы данных": 0, "Проектирование ИС": 0,
    "Веб-программирование": 1, "Алгоритмы и структуры данных": 1,
    "Математика": 2, "Дискретная математика": 9,
    "Компьютерные сети": 3, "Операционные системы": 3,
    "UI/UX-дизайн": 4, "История": 5, "Английский язык": 6,
    "Физическая культура": 7,
}

# Учебный план: какие предметы есть у группы
CURRICULUM = {
    "ИС-21": ["Базы данных", "Проектирование ИС", "Веб-программирование", "Математика", "Английский язык", "Физическая культура"],
    "ИС-22": ["Алгоритмы и структуры данных", "Базы данных", "Дискретная математика", "История", "Английский язык", "Проектирование ИС"],
    "ВЕБ-23": ["Веб-программирование", "UI/UX-дизайн", "Математика", "История", "Английский язык", "Физическая культура"],
    "ПР-31": ["Алгоритмы и структуры данных", "Операционные системы", "Дискретная математика", "Компьютерные сети", "Английский язык"],
    "СА-24": ["Компьютерные сети", "Операционные системы", "Математика", "История", "Физическая культура"],
    "ДИЗ-22": ["UI/UX-дизайн", "История", "Английский язык", "Математика", "Физическая культура"],
}

# Сколько пар у каждой группы по дням (Пн..Сб)
PAIRS_PER_DAY = [3, 4, 3, 4, 3, 2]
LESSON_TYPES = ["Лекция", "Практика", "Лабораторная"]


def create_lessons(db, groups, subjects, teachers, classrooms):
    """Раскладывает предметы по сетке так, чтобы не было конфликтов."""
    busy = set()  # (день, пара, "t"/"r", id) — занятые преподаватели и аудитории
    counter = 0

    for group_index, group in enumerate(groups):
        plan = CURRICULUM[group.name]
        for day in range(1, 7):
            first_pair = 1 + (group_index + day) % 2  # кто-то начинает со 2-й пары
            for pair in range(first_pair, first_pair + PAIRS_PER_DAY[day - 1]):
                for attempt in range(len(plan)):
                    subject_name = plan[(counter + attempt) % len(plan)]
                    teacher = teachers[SUBJECT_TEACHER[subject_name]]
                    if (day, pair, "t", teacher.id) in busy:
                        continue
                    room = pick_room(subject_name, day, pair, busy, classrooms, counter)
                    if room is None:
                        continue
                    busy.add((day, pair, "t", teacher.id))
                    busy.add((day, pair, "r", room.id))
                    week_type = "both"
                    if subject_name in ("История", "Дискретная математика"):
                        week_type = "odd" if (group_index + day) % 2 else "even"
                    db.add(Lesson(
                        group=group, subject=subjects[subject_name], teacher=teacher,
                        classroom=room, day_of_week=day, pair_number=pair,
                        week_type=week_type, lesson_type=LESSON_TYPES[(counter + pair) % 3],
                    ))
                    break
                counter += 1


def pick_room(subject_name, day, pair, busy, classrooms, counter):
    if subject_name == "Физическая культура":
        options = [c for c in classrooms if c.number == "Спортзал"]
    else:
        options = [c for c in classrooms if c.number != "Спортзал"]
    for shift in range(len(options)):
        room = options[(counter + shift) % len(options)]
        if (day, pair, "r", room.id) not in busy:
            return room
    return None


def pick_substitute(lesson, teachers):
    """Замену ищем на той же кафедре, а если там никого нет — берём любого другого."""
    colleagues = [t for t in teachers if t.department == lesson.teacher.department and t.id != lesson.teacher_id]
    if colleagues:
        return colleagues[0]
    return next(t for t in teachers if t.id != lesson.teacher_id)


def demo_days():
    """Сегодня и следующие учебные дни (без воскресений) — чтобы демо всегда было «живым»."""
    day = date.today()
    days = []
    while len(days) < 6:
        if day.isoweekday() != 7:
            days.append(day)
        day += timedelta(days=1)
    return days


# (номер учебного дня от сегодня, группа, какая по счёту пара группы в этот день, тип)
CHANGE_PLAN = [
    (0, "ИС-21", 0, "replacement"), (0, "ИС-21", -1, "cancelled"), (0, "ПР-31", 0, "room"),
    (0, "ВЕБ-23", 1, "replacement"), (1, "ИС-21", 1, "room"), (1, "СА-24", 0, "replacement"),
    (2, "ДИЗ-22", 0, "cancelled"), (2, "ИС-22", 1, "replacement"), (3, "ИС-21", 0, "replacement"),
    (4, "ПР-31", -1, "cancelled"),
]
COMMENTS = {
    "replacement": "Преподаватель на курсах повышения квалификации",
    "room": "В аудитории ремонт проектора",
    "cancelled": "Перенос по приказу учебной части",
}


def create_changes(db, groups, teachers, classrooms):
    """Несколько изменений на ближайшие дни — чтобы было что показать."""
    days = demo_days()
    group_by_name = {g.name: g for g in groups}
    for day_index, group_name, position, change_type in CHANGE_PLAN:
        target_day = days[day_index]
        lessons = [
            ls for ls in group_by_name[group_name].lessons
            if ls.day_of_week == target_day.isoweekday()
            and ls.week_type in ("both", week_type_of(target_day))
        ]
        if not lessons:
            continue
        lessons.sort(key=lambda ls: ls.pair_number)
        lesson = lessons[position % len(lessons)]
        change = ScheduleChange(lesson=lesson, date=target_day, change_type=change_type,
                                comment=COMMENTS[change_type])
        if change_type == "replacement":
            change.new_teacher = pick_substitute(lesson, teachers)
        if change_type == "room":
            change.new_classroom = next(c for c in classrooms if c.id != lesson.classroom_id and c.number != "Спортзал")
        db.add(change)


def seed(db):
    groups = [Group(name=n, course=c, specialty=s) for n, c, s in GROUPS]
    teachers = [Teacher(full_name=n, department=d, email=e) for n, d, e in TEACHERS]
    subjects = {name: Subject(name=name) for name in SUBJECTS}
    classrooms = [Classroom(number=n, building=b, capacity=c) for n, b, c in CLASSROOMS]
    db.add_all(groups + teachers + list(subjects.values()) + classrooms)
    db.flush()  # получить id без окончательного сохранения

    create_lessons(db, groups, subjects, teachers, classrooms)
    db.flush()
    db.expire_all()  # чтобы group.lessons увидели только что добавленные занятия
    create_changes(db, groups, teachers, classrooms)

    # Пароль администратора можно задать переменной окружения ADMIN_PASSWORD (так сделано на Vercel)
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    db.add(User(username="admin", password_hash=hash_password(admin_password), role="admin"))
    db.add(User(username="student", password_hash=hash_password("student123"), role="viewer"))
    db.commit()


def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(Group).count() == 0:
            seed(db)
    finally:
        db.close()


def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_if_empty()


if __name__ == "__main__":
    reset_database()
    print("База пересоздана: backend/slot.db")
