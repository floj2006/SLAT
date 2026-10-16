"""Сборка расписания на неделю.

Постоянное расписание (Lesson) говорит «по понедельникам 2-й парой».
Изменения (ScheduleChange) говорят «а 14 октября эта пара отменена».
Функция build_week соединяет одно с другим и возвращает готовую неделю.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from .models import Lesson, ScheduleChange

DAYS_IN_WEEK = 6  # учимся с понедельника по субботу


def monday_of(any_day: date) -> date:
    """Возвращает понедельник той недели, в которую попадает дата."""
    return any_day - timedelta(days=any_day.weekday())


def week_type_of(any_day: date) -> str:
    """Чётность недели по номеру ISO-недели: 'odd' (нечётная) или 'even' (чётная)."""
    week_number = any_day.isocalendar().week
    return "odd" if week_number % 2 == 1 else "even"


def build_week(db: Session, lessons: list[Lesson], week_start: date) -> dict:
    """Раскладывает занятия по дням недели и подставляет изменения.

    lessons    — занятия, которые нужно показать (группы или преподавателя)
    week_start — любая дата недели; будет приведена к понедельнику
    Возвращает словарь в формате схемы WeekSchedule.
    """
    week_start = monday_of(week_start)
    week_end = week_start + timedelta(days=DAYS_IN_WEEK - 1)
    current_week_type = week_type_of(week_start)

    # Оставляем занятия, которые идут на этой неделе
    active = [ls for ls in lessons if ls.week_type in ("both", current_week_type)]

    # Все изменения этих занятий за неделю: ключ — (id занятия, дата)
    lesson_ids = [ls.id for ls in active]
    changes = (
        db.query(ScheduleChange)
        .filter(ScheduleChange.lesson_id.in_(lesson_ids))
        .filter(ScheduleChange.date >= week_start, ScheduleChange.date <= week_end)
        .all()
    )
    change_by_key = {(ch.lesson_id, ch.date): ch for ch in changes}

    days = []
    for offset in range(DAYS_IN_WEEK):
        day_date = week_start + timedelta(days=offset)
        day_number = offset + 1
        day_lessons = [ls for ls in active if ls.day_of_week == day_number]
        day_lessons.sort(key=lambda ls: ls.pair_number)

        days.append({
            "date": day_date,
            "day_of_week": day_number,
            "lessons": [
                {"lesson": ls, "change": change_by_key.get((ls.id, day_date))}
                for ls in day_lessons
            ],
        })

    return {"week_start": week_start, "week_type": current_week_type, "days": days}
