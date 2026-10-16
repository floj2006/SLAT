import { useEffect, useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { getGroups, getTeachers, search } from '../api/api.js'
import { Input } from '../components/ui/Field.jsx'
import Segmented from '../components/ui/Segmented.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ResultRow from '../components/schedule/ResultRow.jsx'
import styles from './Page.module.css'
import local from './SearchPage.module.css'

// «Ветров Павел Андреевич» → «ВП»
function initials(fullName) {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

function SearchPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [results, setResults] = useState({ groups: [], teachers: [] })

  // Пустой запрос — показываем всех. Иначе — спрашиваем сервер,
  // но не на каждую букву, а через 250 мс после последнего нажатия.
  useEffect(() => {
    const text = query.trim()
    const timer = setTimeout(async () => {
      try {
        if (text === '') {
          const [groups, teachers] = await Promise.all([getGroups(), getTeachers()])
          setResults({ groups, teachers })
        } else {
          setResults(await search(text))
        }
      } catch {
        setResults({ groups: [], teachers: [] })
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const showGroups = filter !== 'teachers'
  const showTeachers = filter !== 'groups'
  const nothing =
    (!showGroups || results.groups.length === 0) && (!showTeachers || results.teachers.length === 0)

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Поиск</h1>
        <p className={styles.subtitle}>Группы и преподаватели колледжа</p>
      </div>

      <div className={local.bar}>
        <div className={local.input}>
          <Input
            icon={Search}
            placeholder="Группа, фамилия или кафедра"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            aria-label="Поиск"
          />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'groups', label: 'Группы' },
            { value: 'teachers', label: 'Преподаватели' },
          ]}
        />
      </div>

      {nothing && <EmptyState icon={SearchX} title="Ничего не нашлось" text="Попробуйте часть названия: «ис», «мор», «сети»." />}

      {showGroups && results.groups.length > 0 && (
        <section className={styles.list}>
          <h2 className={styles.overline}>Группы · {results.groups.length}</h2>
          {results.groups.map((group) => (
            <ResultRow
              key={group.id}
              to={`/group/${group.id}`}
              avatar={`${group.course}к`}
              title={group.name}
              subtitle={`${group.specialty} · ${group.course} курс`}
              query={query.trim()}
            />
          ))}
        </section>
      )}

      {showTeachers && results.teachers.length > 0 && (
        <section className={styles.list}>
          <h2 className={styles.overline}>Преподаватели · {results.teachers.length}</h2>
          {results.teachers.map((teacher) => (
            <ResultRow
              key={teacher.id}
              to={`/teacher/${teacher.id}`}
              avatar={initials(teacher.full_name)}
              title={teacher.full_name}
              subtitle={teacher.department}
              query={query.trim()}
            />
          ))}
        </section>
      )}
    </div>
  )
}

export default SearchPage
