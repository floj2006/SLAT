import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import styles from './GroupCard.module.css'

// Карточка группы на главной (в Figma — Group Card). Вся карточка — ссылка.
function GroupCard({ group }) {
  return (
    <Link to={`/group/${group.id}`} className={styles.card}>
      <div className={styles.top}>
        <h3 className={styles.name}>{group.name}</h3>
        <ArrowRight size={18} className={styles.arrow} />
      </div>
      <p className={styles.specialty}>{group.specialty}</p>
      <div>
        <Badge>{group.course} курс</Badge>
      </div>
    </Link>
  )
}

export default GroupCard
