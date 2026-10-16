import { useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

/*
  Модальное окно. Показывается, только если его отрисовали:
    {isOpen && <Modal title="Новое занятие" onClose={close}>...</Modal>}
  Закрывается по крестику, по клику на фон и по клавише Escape.
*/
function Modal({ title, onClose, children, footer }) {
  // Пока окно открыто, слушаем нажатия клавиш
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  )
}

export default Modal
