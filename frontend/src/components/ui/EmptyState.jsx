import styles from './EmptyState.module.css'

// Заглушка, когда показывать нечего: «Пар нет», «Ничего не найдено»
function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className={styles.empty}>
      {Icon && (
        <div className={styles.icon}>
          <Icon size={22} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {text && <p className={styles.text}>{text}</p>}
      {action}
    </div>
  )
}

export default EmptyState
