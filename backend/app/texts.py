"""Помощники для текстов ошибок: склонение и короткие имена.

Сервер сам формирует понятные сообщения на русском, а frontend
просто показывает их пользователю (поле detail в ответе).
"""

DAY_PLURAL_DATIVE = ["понедельникам", "вторникам", "средам", "четвергам", "пятницам", "субботам"]
WEEKDAY_NAMES = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]


def plural(count: int, one: str, few: str, many: str) -> str:
    """plural(5, 'занятие', 'занятия', 'занятий') → '5 занятий'"""
    last_two = count % 100
    last = count % 10
    if 11 <= last_two <= 14:
        word = many
    elif last == 1:
        word = one
    elif 2 <= last <= 4:
        word = few
    else:
        word = many
    return f"{count} {word}"


def short_name(full_name: str) -> str:
    """«Морозова Алина Сергеевна» → «Морозова А. С.»"""
    parts = full_name.split()
    return " ".join([parts[0]] + [p[0] + "." for p in parts[1:3]])


def in_use_message(what: str, lessons_count: int) -> str:
    """Единое сообщение, когда запись из справочника нельзя удалить."""
    return (
        f"Нельзя удалить: {what} используется в расписании "
        f"({plural(lessons_count, 'занятие', 'занятия', 'занятий')}). "
        "Сначала измените или удалите эти занятия."
    )
