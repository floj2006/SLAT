import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, LogOut } from 'lucide-react'
import { getList, getMe, logout } from '../../api/api.js'
import Button from '../../components/ui/Button.jsx'
import Segmented from '../../components/ui/Segmented.jsx'
import { clearToken, getToken } from '../../utils/storage.js'
import LessonsPanel from './LessonsPanel.jsx'
import ChangesPanel from './ChangesPanel.jsx'
import DirectoryPanel from './DirectoryPanel.jsx'
import { DIRECTORIES } from './directories.js'
import pageStyles from '../Page.module.css'
import styles from './Admin.module.css'

const TABS = [
  { value: 'lessons', label: 'Занятия' },
  { value: 'changes', label: 'Изменения' },
  { value: 'teachers', label: 'Преподаватели' },
  { value: 'subjects', label: 'Предметы' },
  { value: 'classrooms', label: 'Аудитории' },
  { value: 'groups', label: 'Группы' },
]

// Административная панель. Без входа перекидывает на /admin/login.
function AdminPage() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('lessons')
  const [refs, setRefs] = useState(null) // справочники: группы, преподаватели, предметы, аудитории
  const navigate = useNavigate()

  const loadRefs = useCallback(async () => {
    const [groups, teachers, subjects, classrooms] = await Promise.all(
      ['groups', 'teachers', 'subjects', 'classrooms'].map(getList),
    )
    setRefs({ groups, teachers, subjects, classrooms })
  }, [])

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin/login')
      return
    }
    // Спрашиваем у сервера, кто мы. Если токен устарел — сервер ответит 401.
    getMe()
      .then((me) => {
        setUser(me)
        loadRefs()
      })
      .catch(() => navigate('/admin/login'))
  }, [navigate, loadRefs])

  async function handleLogout() {
    await logout().catch(() => {})
    clearToken()
    navigate('/admin/login')
  }

  if (!user || !refs) return null

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.header}>
        <div className={pageStyles.heading}>
          <h1 className={pageStyles.title}>Администрирование</h1>
          <p className={pageStyles.subtitle}>
            Вы вошли как {user.username} · роль: {user.role === 'admin' ? 'администратор' : 'просмотр'}
          </p>
        </div>
        <Button icon={LogOut} onClick={handleLogout}>
          Выйти
        </Button>
      </div>

      {user.role !== 'admin' && (
        <p className={styles.notice}>
          <Eye size={17} />
          Вы вошли только для просмотра. Сохранять изменения может администратор учебной части — сервер отклонит попытку.
        </p>
      )}

      <div className={styles.tabs}>
        <Segmented value={tab} onChange={setTab} options={TABS} />
      </div>

      {tab === 'lessons' && <LessonsPanel refs={refs} />}
      {tab === 'changes' && <ChangesPanel refs={refs} />}
      {DIRECTORIES[tab] && <DirectoryPanel key={tab} config={DIRECTORIES[tab]} items={refs[tab]} onChanged={loadRefs} />}
    </div>
  )
}

export default AdminPage
