import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Mail } from 'lucide-react'
import { getItem, getTeacherSchedule } from '../api/api.js'
import ScheduleScreen from '../components/schedule/ScheduleScreen.jsx'
import styles from './Page.module.css'

// Страница расписания преподавателя: /teacher/2
function TeacherSchedulePage() {
  const { teacherId } = useParams()
  const [teacher, setTeacher] = useState(null)

  useEffect(() => {
    getItem('teachers', teacherId).then(setTeacher).catch(() => setTeacher(null))
  }, [teacherId])

  const loadWeek = useCallback((weekStart) => getTeacherSchedule(teacherId, weekStart), [teacherId])

  const header = (
    <div>
      <nav className={styles.crumbs}>
        <Link to="/search">Поиск</Link>
        <ChevronRight size={14} />
        <strong>Преподаватель</strong>
      </nav>
      <div className={styles.heading}>
        <h1 className={styles.title}>{teacher ? teacher.full_name : 'Загрузка…'}</h1>
        {teacher && (
          <p className={styles.subtitle}>
            {teacher.department} · <Mail size={13} style={{ verticalAlign: '-2px' }} /> {teacher.email}
          </p>
        )}
      </div>
    </div>
  )

  return <ScheduleScreen key={teacherId} header={header} loadWeek={loadWeek} mode="teacher" />
}

export default TeacherSchedulePage
