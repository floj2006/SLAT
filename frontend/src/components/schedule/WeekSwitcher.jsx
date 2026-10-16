import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WEEK_TYPES } from '../../data/constants.js'
import { formatWeekRange, fromISODate } from '../../utils/dates.js'
import styles from './WeekSwitcher.module.css'

/*
  Переключатель недель (в Figma — Week Switcher).
  Props: weekStart — понедельник 'ГГГГ-ММ-ДД', weekType — 'odd'/'even',
         onPrev / onNext — что делать по стрелкам
*/
function WeekSwitcher({ weekStart, weekType, onPrev, onNext }) {
  return (
    <div className={styles.switcher}>
      <button className={styles.arrow} onClick={onPrev} aria-label="Предыдущая неделя">
        <ChevronLeft size={17} />
      </button>
      <div className={styles.label}>
        <span className={styles.range}>{formatWeekRange(fromISODate(weekStart))}</span>
        <span className={styles.type}>{WEEK_TYPES[weekType]} неделя</span>
      </div>
      <button className={styles.arrow} onClick={onNext} aria-label="Следующая неделя">
        <ChevronRight size={17} />
      </button>
    </div>
  )
}

export default WeekSwitcher
