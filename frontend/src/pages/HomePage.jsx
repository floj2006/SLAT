import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCcw, Search, SearchX } from 'lucide-react'
import { getChanges, getGroups } from '../api/api.js'
import { Input } from '../components/ui/Field.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import GroupCard from '../components/schedule/GroupCard.jsx'
import { getLastGroupId } from '../utils/storage.js'
import { isoWeekNumber, toISODate } from '../utils/dates.js'
import styles from './HomePage.module.css'

// Группируем группы по курсу: { 1: [...], 2: [...] }
function groupByCourse(groups) {
  const result = {}
  for (const group of groups) {
    if (!result[group.course]) result[group.course] = []
    result[group.course].push(group)
  }
  return result
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function groupsLabel(count) {
  if (count === 1) return '1 группа'
  if (count < 5) return `${count} группы`
  return `${count} групп`
}

function HomePage() {
  const [groups, setGroups] = useState([])
  const [todayChanges, setTodayChanges] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const today = toISODate(new Date())
    getGroups().then(setGroups).catch((err) => setError(err.message))
    getChanges({ date_from: today, date_to: today }).then(setTodayChanges).catch(() => setTodayChanges([]))
  }, [])

  const filtered = groups.filter((group) => group.name.toLowerCase().includes(query.trim().toLowerCase()))
  const byCourse = groupByCourse(filtered)
  const lastGroup = groups.find((group) => String(group.id) === getLastGroupId())
  const today = new Date()

  // Enter в поле поиска сразу открывает первую найденную группу
  function handleSubmit(event) {
    event.preventDefault()
    if (filtered.length > 0) navigate(`/group/${filtered[0].id}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.today}>
        <Badge>{capitalize(today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }))}</Badge>
        <Badge tone="accent">{isoWeekNumber(today) % 2 === 1 ? 'Нечётная неделя' : 'Чётная неделя'}</Badge>
      </div>

      <section className={styles.hero}>
        <h1 className={styles.title}>
          Расписание —<br />
          за пару секунд<span className={styles.dot}>.</span>
        </h1>
        <p className={styles.lead}>
          Выберите группу, чтобы увидеть занятия, замены и свободные окна. Без Excel-таблиц.
        </p>
        <form className={styles.search} onSubmit={handleSubmit}>
          <Input
            icon={Search}
            placeholder="Найти группу, например ИС-21"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Поиск группы"
          />
        </form>
        {lastGroup && (
          <p className={styles.recent}>
            Недавно открывали:{' '}
            <Link to={`/group/${lastGroup.id}`} className={styles.recentLink}>
              {lastGroup.name}
            </Link>
          </p>
        )}
      </section>

      <ChangesBanner changes={todayChanges} />

      {error && <EmptyState icon={SearchX} title="Сервер недоступен" text={`${error}. Запущен ли backend?`} />}
      {!error && groups.length > 0 && filtered.length === 0 && (
        <EmptyState icon={SearchX} title="Группа не найдена" text="Проверьте название или откройте поиск преподавателей." />
      )}

      {Object.entries(byCourse).map(([course, list]) => (
        <section key={course} className={styles.course}>
          <div className={styles.courseHead}>
            <h2 className={styles.courseTitle}>{course} курс</h2>
            <span className={styles.courseCount}>{groupsLabel(list.length)}</span>
          </div>
          <div className={styles.grid}>
            {list.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// Плашка «Сегодня N изменений» (в Figma — Changes Banner)
function ChangesBanner({ changes }) {
  const count = (type) => changes.filter((change) => change.change_type === type).length

  return (
    <Link to="/changes" className={styles.banner}>
      <span className={styles.bannerIcon}>
        <RefreshCcw size={19} />
      </span>
      <span className={styles.bannerText}>
        <strong>{changes.length > 0 ? `Сегодня изменений в расписании: ${changes.length}` : 'Сегодня изменений нет'}</strong>
        <span>
          Замены: {count('replacement')} · другая аудитория: {count('room')} · отмены: {count('cancelled')}
        </span>
      </span>
      <span className={styles.bannerLink}>
        Смотреть <ArrowRight size={15} />
      </span>
    </Link>
  )
}

export default HomePage
