import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { getChanges, getGroups } from '../api/api.js'
import { Select } from '../components/ui/Field.jsx'
import Segmented from '../components/ui/Segmented.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ChangeRow from '../components/schedule/ChangeRow.jsx'
import { CHANGE_TYPES } from '../data/constants.js'
import { formatRelativeDay, fromISODate, toISODate } from '../utils/dates.js'
import styles from './Page.module.css'
import local from './ChangesPage.module.css'

// Раскладываем изменения по датам: { '2026-10-16': [...], ... }
function groupByDate(changes) {
  const result = {}
  for (const change of changes) {
    if (!result[change.date]) result[change.date] = []
    result[change.date].push(change)
  }
  return result
}

function ChangesPage() {
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState('')
  const [type, setType] = useState('all')
  const [changes, setChanges] = useState(null)

  useEffect(() => {
    getGroups().then(setGroups).catch(() => setGroups([]))
  }, [])

  // Перезагружаем список, когда выбрали другую группу
  useEffect(() => {
    getChanges({ group_id: groupId, date_from: toISODate(new Date()) })
      .then(setChanges)
      .catch(() => setChanges([]))
  }, [groupId])

  const list = changes || []
  const visible = type === 'all' ? list : list.filter((change) => change.change_type === type)
  const byDate = groupByDate(visible)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Изменения</h1>
          <p className={styles.subtitle}>Замены, переносы и отмены на ближайшие дни</p>
        </div>
        <div className={local.select}>
          <Select
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            placeholder="Все группы"
            options={groups.map((group) => ({ value: group.id, label: group.name }))}
            aria-label="Группа"
          />
        </div>
      </div>

      <div className={local.stats}>
        {Object.entries(CHANGE_TYPES).map(([key, label]) => (
          <div key={key} className={local.stat}>
            <span className={local.statLabel}>
              <span className={`${local.dot} ${local[key]}`} />
              {label}
            </span>
            <strong className={local.statValue}>{list.filter((change) => change.change_type === key).length}</strong>
          </div>
        ))}
      </div>

      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: 'all', label: 'Все' },
          { value: 'replacement', label: 'Замены' },
          { value: 'room', label: 'Аудитории' },
          { value: 'cancelled', label: 'Отмены' },
        ]}
      />

      {changes && visible.length === 0 && (
        <EmptyState icon={CalendarCheck} title="Изменений нет" text="Всё идёт по основному расписанию." />
      )}

      {Object.entries(byDate).map(([date, items]) => (
        <section key={date} className={styles.list}>
          <div className={local.dayHead}>
            <h2 className={local.dayTitle}>{formatRelativeDay(fromISODate(date))}</h2>
            <Badge>{items.length}</Badge>
          </div>
          {items.map((change) => (
            <ChangeRow key={change.id} change={change} />
          ))}
        </section>
      ))}
    </div>
  )
}

export default ChangesPage
