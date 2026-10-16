import { useEffect, useState } from 'react'
import { BELLS } from '../../data/constants.js'
import { timeToMinutes } from '../../utils/dates.js'
import { pairLabel } from '../../utils/text.js'
import styles from './NowWidget.module.css'

/*
  Карточка «Что сейчас»: идёт пара, перемена или занятия закончились.
  Пример useEffect + setInterval: каждые 30 секунд обновляем текущее время.
*/
function getStatus(now) {
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (now.getDay() === 0) return { label: 'Сегодня выходной', time: 'пары начнутся в понедельник', progress: 0 }

  for (const [pair, bell] of Object.entries(BELLS)) {
    const start = timeToMinutes(bell.start)
    const end = timeToMinutes(bell.end)
    if (minutes >= start && minutes < end) {
      return { label: `Идёт ${pairLabel(pair)}`, time: `${bell.start} – ${bell.end}`, progress: (minutes - start) / (end - start) }
    }
    if (minutes < start) {
      return { label: `Скоро ${pairLabel(pair)}`, time: `начало в ${bell.start}`, progress: 0 }
    }
  }
  return { label: 'Пары закончились', time: 'на сегодня всё', progress: 1 }
}

function NowWidget() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer) // убираем таймер, когда компонент исчезает
  }, [])

  const status = getStatus(now)

  return (
    <div className={styles.widget}>
      <div className={styles.row}>
        <span className={styles.pulse} />
        <span className={styles.label}>{status.label}</span>
      </div>
      <span className={styles.time}>{status.time}</span>
      <div className={styles.track}>
        <div className={styles.bar} style={{ width: `${Math.round(status.progress * 100)}%` }} />
      </div>
    </div>
  )
}

export default NowWidget
