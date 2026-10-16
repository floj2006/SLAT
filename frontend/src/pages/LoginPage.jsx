import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { login } from '../api/api.js'
import { Input } from '../components/ui/Field.jsx'
import Button from '../components/ui/Button.jsx'
import { saveToken } from '../utils/storage.js'
import styles from './LoginPage.module.css'

// Вход в административную панель
function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault() // не перезагружать страницу
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      saveToken(data.token)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.icon}>
          <Lock size={20} />
        </div>
        <div className={styles.heading}>
          <h1 className={styles.title}>Вход для учебной части</h1>
          <p className={styles.subtitle}>Редактировать расписание могут только администраторы.</p>
        </div>
        <Input label="Логин" icon={User} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
        <Input
          label="Пароль"
          icon={Lock}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={error}
        />
        <Button type="submit" variant="primary" fullWidth disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </Button>
        <p className={styles.hint}>
          Демо: <code>admin / admin123</code> — администратор, <code>student / student123</code> — только просмотр
        </p>
      </form>
    </div>
  )
}

export default LoginPage
