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
import { FORMS, capitalize, countLabel } from '../utils/text.js'
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
          Чтобы утром не гадать, где первая пара.
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
            Вы недавно смотрели:{' '}
            <Link to={`/group/${lastGroup.id}`} className={styles.recentLink}>
              {lastGroup.name}
            </Link>
          </p>
        )}
      </section>

      <ChangesBanner changes={todayChanges} />

      {error && <EmptyState icon={SearchX} title="Не удалось загрузить группы" text={error} />}
      {!error && groups.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Такой группы нет"
          text="Проверьте название: например, «ИС-21». Ищете преподавателя? Откройте поиск."
          action={<Link to="/search" className={styles.recentLink}>Перейти к поиску</Link>}
        />
      )}

      {Object.entries(byCourse).map(([course, list]) => (
        <section key={course} className={styles.course}>
          <div className={styles.courseHead}>
            <h2 className={styles.courseTitle}>{course} курс</h2>
            <span className={styles.courseCount}>{countLabel(list.length, FORMS.group)}</span>
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
  // Показываем только то, что есть: «2 замены · 1 отмена»
  const details = [
    [count('replacement'), FORMS.replacement],
    [count('room'), FORMS.room],
    [count('cancelled'), FORMS.cancel],
  ]
    .filter(([n]) => n > 0)
    .map(([n, forms]) => countLabel(n, forms))
    .join(' · ')

  return (
    <Link to="/changes" className={styles.banner}>
      <span className={styles.bannerIcon}>
        <RefreshCcw size={19} />
      </span>
      <span className={styles.bannerText}>
        <strong>
          {changes.length > 0 ? `Сегодня ${countLabel(changes.length, FORMS.change)} в расписании` : 'Сегодня всё по расписанию'}
        </strong>
        <span>{changes.length > 0 ? details : 'Замен и отмен нет — пары идут как обычно'}</span>
      </span>
      <span className={styles.bannerLink}>
        {changes.length > 0 ? 'Подробнее' : 'Все изменения'} <ArrowRight size={15} />
      </span>
    </Link>
  )
}

export default HomePage
