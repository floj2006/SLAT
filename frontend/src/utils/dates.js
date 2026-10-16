/*
  Функции для работы с датами.
  Даты между frontend и backend передаются строкой 'ГГГГ-ММ-ДД'.
*/

// Date → '2026-10-16' (в местном времени, без сдвига часового пояса)
export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// '2026-10-16' → Date
export function fromISODate(text) {
  const [year, month, day] = text.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

// Понедельник недели, в которую входит дата
export function getMonday(date) {
  const day = date.getDay() || 7 // воскресенье в JS = 0, делаем 7
  return addDays(date, 1 - day)
}

export function isSameDay(a, b) {
  return toISODate(a) === toISODate(b)
}

// 1 = понедельник ... 7 = воскресенье
export function dayOfWeek(date) {
  return date.getDay() || 7
}

export function formatDayMonth(date) {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

// «12 – 17 октября» или «28 сент. – 3 окт.»
export function formatWeekRange(monday) {
  const saturday = addDays(monday, 5)
  if (monday.getMonth() === saturday.getMonth()) {
    return `${monday.getDate()} – ${formatDayMonth(saturday)}`
  }
  const short = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('ru-RU', short)} – ${saturday.toLocaleDateString('ru-RU', short)}`
}

// «Сегодня», «Завтра» или «пятница, 16 октября»
export function formatRelativeDay(date) {
  const today = new Date()
  if (isSameDay(date, today)) return 'Сегодня'
  if (isSameDay(date, addDays(today, 1))) return 'Завтра'
  if (isSameDay(date, addDays(today, -1))) return 'Вчера'
  return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Минуты от начала дня: '08:30' → 510
export function timeToMinutes(text) {
  const [hours, minutes] = text.split(':').map(Number)
  return hours * 60 + minutes
}

// Номер недели по ISO (как в Python date.isocalendar().week)
export function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day) // четверг этой недели определяет её номер
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}
