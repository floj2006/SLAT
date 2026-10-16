import styles from './Badge.module.css'

/*
  Метка статуса (в Figma — компонент Lesson Status).
  tone: neutral | accent | now | replacement | room | cancelled
*/
function Badge({ tone = 'neutral', icon: Icon, children }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {Icon && <Icon size={13} strokeWidth={2.25} />}
      {children}
    </span>
  )
}

export default Badge
