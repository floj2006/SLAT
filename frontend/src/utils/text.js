/*
  Помощники для текстов интерфейса.

  plural(5, ['пара', 'пары', 'пар']) → 'пар'
  Русское склонение после числа: 1 пара, 2 пары, 5 пар, 21 пара, 11 пар.
*/
export function plural(count, [one, few, many]) {
  const lastTwo = count % 100
  const last = count % 10
  if (lastTwo >= 11 && lastTwo <= 14) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

// «3 пары», «1 группа», «5 изменений»
export function countLabel(count, forms) {
  return `${count} ${plural(count, forms)}`
}

// Номер пары: «2-я пара»
export function pairLabel(number) {
  return `${number}-я пара`
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const FORMS = {
  pair: ['пара', 'пары', 'пар'],
  group: ['группа', 'группы', 'групп'],
  change: ['изменение', 'изменения', 'изменений'],
  replacement: ['замена', 'замены', 'замен'],
  cancel: ['отмена', 'отмены', 'отмен'],
  room: ['перенос в другую аудиторию', 'переноса в другую аудиторию', 'переносов в другую аудиторию'],
}
