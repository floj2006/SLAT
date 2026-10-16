import { createContext, useCallback, useContext, useState } from 'react'
import { CircleCheck, CircleAlert } from 'lucide-react'
import styles from './Toast.module.css'

/*
  Всплывающие уведомления (в Figma — Notifications).
  ToastProvider оборачивает всё приложение (см. main.jsx),
  а любой компонент может показать уведомление:

    const showToast = useToast()
    showToast('Занятие сохранено')
    showToast('Ошибка', 'error')
*/
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((text, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, text, type }])
    // Через 3,5 секунды убираем уведомление
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.type === 'error' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
