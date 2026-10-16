import { useEffect, useState } from 'react'
import { BELLS } from '../../data/constants.js'
import { timeToMinutes } from '../../utils/dates.js'
import styles from './NowWidget.module.css'

/*
  Карточка «Что сейчас»: идёт пара, перемена или занятия закончились.
  Пример useEffect + setInterval: каждые 30 секунд обновляем текущее время.
*/
function getStatus(now) {
  const minutes = now.getHours() * 60 + now.getMinutes()
  const isSunday = now.getDay() === 0

  for (const [pair, bell] of Object.entries(BELLS)) {
    const start = timeToMinutes(bell.start)
    const end = timeToMinutes(bell.end)
    if (!isSunday && minutes >= start && minutes < end) {
      return { label: `Идёт ${pair} пара`, time: `${bell.start} – ${bell.end}`, progress: (minutes - start) / (end - start) }
    }
    if (!isSunday && minutes < start) {
      return { label: `Следующая — ${pair} пара`, time: `начало в ${bell.start}`, progress: 0 }
    }
  }
  return { label: 'Пары закончились', time: 'до завтра', progress: 1 }
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
