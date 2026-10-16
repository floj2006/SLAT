import { BELLS } from '../../data/constants.js'
import { isSameDay, timeToMinutes } from '../../utils/dates.js'

/*
  Определяет статус занятия для карточки:
  'replacement' | 'room' | 'cancelled' — если есть изменение,
  'now' — если пара идёт прямо сейчас,
  'default' — обычное занятие.
*/
export function getLessonStatus(item, date, now = new Date()) {
  if (item.change) return item.change.change_type

  if (isSameDay(date, now)) {
    const bell = BELLS[item.lesson.pair_number]
    const minutes = now.getHours() * 60 + now.getMinutes()
    if (minutes >= timeToMinutes(bell.start) && minutes < timeToMinutes(bell.end)) return 'now'
  }
  return 'default'
}

// Какая доля пары уже прошла (0..1) — для полоски прогресса
export function getPairProgress(pairNumber, now = new Date()) {
  const bell = BELLS[pairNumber]
  const start = timeToMinutes(bell.start)
  const end = timeToMinutes(bell.end)
  const minutes = now.getHours() * 60 + now.getMinutes()
  return Math.min(1, Math.max(0, (minutes - start) / (end - start)))
}

// Сокращаем ФИО: «Морозова Алина Сергеевна» → «Морозова А. С.»
export function shortName(fullName) {
  const [last, first, middle] = fullName.split(' ')
  return [last, first && first[0] + '.', middle && middle[0] + '.'].filter(Boolean).join(' ')
}

export function roomLabel(classroom) {
  return `ауд. ${classroom.number} · ${classroom.building}`
}
