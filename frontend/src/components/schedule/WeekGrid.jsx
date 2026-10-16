import { BELLS, DAY_SHORT } from '../../data/constants.js'
import { fromISODate } from '../../utils/dates.js'
import { getLessonStatus, roomLabel } from './lessonStatus.js'
import styles from './WeekGrid.module.css'

// Вся неделя одним экраном: 6 колонок, в каждой — короткие карточки пар
function WeekGrid({ days, onSelectDay }) {
  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const date = fromISODate(day.date)
        return (
          <section key={day.date} className={styles.column}>
            <button className={styles.head} onClick={() => onSelectDay(day.day_of_week)}>
              <span>{DAY_SHORT[day.day_of_week - 1]}</span>
              <strong>{date.getDate()}</strong>
            </button>
            {day.lessons.length === 0 && <p className={styles.free}>Пар нет</p>}
            {day.lessons.map((item) => {
              const status = getLessonStatus(item, date)
              return (
                <div key={item.lesson.id} className={`${styles.lesson} ${styles[status]}`}>
                  <span className={styles.time}>{BELLS[item.lesson.pair_number].start}</span>
                  <span className={styles.subject}>{item.lesson.subject.name}</span>
                  <span className={styles.place}>{roomLabel(item.lesson.classroom)}</span>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}

export default WeekGrid
