import { DAY_SHORT } from '../../data/constants.js'
import { fromISODate, isSameDay } from '../../utils/dates.js'
import { FORMS, countLabel } from '../../utils/text.js'
import styles from './DayTabs.module.css'

// «нет пар», «1 пара», «3 пары», «5 пар»
export function pairsLabel(count) {
  return count === 0 ? 'нет пар' : countLabel(count, FORMS.pair)
}

/*
  Вкладки дней недели (в Figma — Day Tab).
  Props: days — дни из API, selected — номер выбранного дня (1..6), onSelect — функция выбора
*/
function DayTabs({ days, selected, onSelect }) {
  const today = new Date()

  return (
    <div className={styles.tabs} role="tablist">
      {days.map((day) => {
        const date = fromISODate(day.date)
        const isActive = day.day_of_week === selected

        return (
          <button
            key={day.date}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onSelect(day.day_of_week)}
          >
            <span className={styles.top}>
              {DAY_SHORT[day.day_of_week - 1]}
              {isSameDay(date, today) && <span className={styles.today} aria-label="сегодня" />}
            </span>
            <span className={styles.date}>{date.getDate()}</span>
            <span className={styles.count}>
              <span className={styles.full}>{pairsLabel(day.lessons.length)}</span>
              <span className={styles.short}>{day.lessons.length}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default DayTabs
