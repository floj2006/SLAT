import { useEffect, useState } from 'react'
import { CalendarX2, Coffee } from 'lucide-react'
import DayTabs, { pairsLabel } from './DayTabs.jsx'
import WeekSwitcher from './WeekSwitcher.jsx'
import WeekGrid from './WeekGrid.jsx'
import LessonCard from './LessonCard.jsx'
import { getLessonStatus } from './lessonStatus.js'
import Segmented from '../ui/Segmented.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { BELLS } from '../../data/constants.js'
import { addDays, dayOfWeek, formatRelativeDay, fromISODate, getMonday, toISODate } from '../../utils/dates.js'
import styles from './ScheduleScreen.module.css'

// Какой день открыть сразу: сегодня (если это Пн–Сб), иначе понедельник
function initialDay() {
  const today = dayOfWeek(new Date())
  return today === 7 ? 1 : today
}
function initialWeek() {
  const today = new Date()
  // В воскресенье сразу показываем следующую неделю
  return toISODate(getMonday(dayOfWeek(today) === 7 ? addDays(today, 1) : today))
}

/*
  Экран расписания — общий для группы и преподавателя.
  Props:
    header   — заголовок страницы (JSX)
    loadWeek — функция (weekStart) => Promise с неделей из API
    mode     — 'group' или 'teacher'
*/
function ScheduleScreen({ header, loadWeek, mode }) {
  const [weekStart, setWeekStart] = useState(initialWeek)
  const [selectedDay, setSelectedDay] = useState(initialDay)
  const [view, setView] = useState('day')
  const [week, setWeek] = useState(null)
  const [error, setError] = useState('')

  // Каждый раз, когда меняется неделя, загружаем её с сервера
  useEffect(() => {
    let cancelled = false
    setError('')
    loadWeek(weekStart)
      .then((data) => {
        if (!cancelled) setWeek(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true // ответ на старый запрос больше не нужен
    }
  }, [weekStart, loadWeek])

  function changeWeek(step) {
    setWeekStart(toISODate(addDays(fromISODate(weekStart), step * 7)))
  }

  function openDay(day) {
    setSelectedDay(day)
    setView('day')
  }

  const day = week ? week.days.find((d) => d.day_of_week === selectedDay) : null

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        {header}
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'day', label: 'День' },
                { value: 'week', label: 'Неделя' },
              ]}
            />
          </div>
          {week && (
            <WeekSwitcher
              weekStart={week.week_start}
              weekType={week.week_type}
              onPrev={() => changeWeek(-1)}
              onNext={() => changeWeek(1)}
            />
          )}
        </div>
      </div>

      {error && <EmptyState icon={CalendarX2} title="Не удалось загрузить расписание" text={error} />}
      {!week && !error && <div className={styles.skeleton} />}

      {week && view === 'day' && (
        <>
          <DayTabs days={week.days} selected={selectedDay} onSelect={setSelectedDay} />
          <DayView day={day} mode={mode} />
        </>
      )}

      {week && view === 'week' && <WeekGrid days={week.days} onSelectDay={openDay} />}
    </div>
  )
}

function DayView({ day, mode }) {
  const date = fromISODate(day.date)
  const lessons = day.lessons
  const first = lessons[0]
  const last = lessons[lessons.length - 1]

  return (
    <section className={styles.day}>
      <div className={styles.dayHeading}>
        <h2 className={styles.dayTitle}>{capitalize(formatRelativeDay(date))}</h2>
        {lessons.length > 0 && (
          <span className={styles.dayMeta}>
            {pairsLabel(lessons.length)} · {BELLS[first.lesson.pair_number].start} – {BELLS[last.lesson.pair_number].end}
          </span>
        )}
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="Свободный день"
          text="В этот день занятий нет. Можно выдохнуть или посмотреть другой день."
        />
      ) : (
        <div className={styles.list}>
          {lessons.map((item) => (
            <LessonCard key={item.lesson.id} item={item} status={getLessonStatus(item, date)} mode={mode} />
          ))}
        </div>
      )}
    </section>
  )
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default ScheduleScreen
