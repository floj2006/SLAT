import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import styles from './ResultRow.module.css'

// Подсвечиваем найденную часть текста: «Ветров», запрос «ве» → <mark>Ве</mark>тров
function Highlight({ text, query }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

/*
  Строка результата поиска (в Figma — Teacher Row).
  Props: to — ссылка, avatar — 2 буквы, title, subtitle, query — что искали
*/
function ResultRow({ to, avatar, title, subtitle, query }) {
  return (
    <Link to={to} className={styles.row}>
      <span className={styles.avatar}>{avatar}</span>
      <span className={styles.info}>
        <span className={styles.title}>
          <Highlight text={title} query={query} />
        </span>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>
      <span className={styles.link}>
        Расписание <ArrowRight size={15} />
      </span>
    </Link>
  )
}

export default ResultRow
