import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getGroupSchedule, getItem } from '../api/api.js'
import ScheduleScreen from '../components/schedule/ScheduleScreen.jsx'
import { saveLastGroupId } from '../utils/storage.js'
import styles from './Page.module.css'

// Страница расписания группы: /group/3
function GroupSchedulePage() {
  const { groupId } = useParams() // id берётся из адреса страницы
  const [group, setGroup] = useState(null)

  useEffect(() => {
    getItem('groups', groupId).then(setGroup).catch(() => setGroup(null))
    saveLastGroupId(groupId) // запоминаем, чтобы пункт меню «Расписание» вёл сюда
  }, [groupId])

  // useCallback: функция не создаётся заново на каждый рендер,
  // иначе ScheduleScreen подумал бы, что она изменилась, и грузил неделю повторно
  const loadWeek = useCallback((weekStart) => getGroupSchedule(groupId, weekStart), [groupId])

  const header = (
    <div>
      <nav className={styles.crumbs}>
        <Link to="/">Группы</Link>
        <ChevronRight size={14} />
        <strong>{group ? group.name : '…'}</strong>
      </nav>
      <div className={styles.heading}>
        <h1 className={styles.title}>{group ? group.name : 'Загрузка…'}</h1>
        {group && (
          <p className={styles.subtitle}>
            {group.specialty} · {group.course} курс
          </p>
        )}
      </div>
    </div>
  )

  return <ScheduleScreen key={groupId} header={header} loadWeek={loadWeek} mode="group" />
}

export default GroupSchedulePage
