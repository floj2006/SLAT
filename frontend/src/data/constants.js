// Постоянные значения, которые используются в разных частях приложения

// Расписание звонков: номер пары → начало и конец
export const BELLS = {
  1: { start: '08:30', end: '10:00' },
  2: { start: '10:10', end: '11:40' },
  3: { start: '12:20', end: '13:50' },
  4: { start: '14:00', end: '15:30' },
  5: { start: '15:40', end: '17:10' },
  6: { start: '17:20', end: '18:50' },
}

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
export const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const WEEK_TYPES = {
  both: 'Каждую неделю',
  odd: 'Нечётная',
  even: 'Чётная',
}

export const CHANGE_TYPES = {
  replacement: 'Замена',
  room: 'Другая аудитория',
  cancelled: 'Отменено',
}

export const LESSON_TYPES = ['Лекция', 'Практика', 'Лабораторная']
