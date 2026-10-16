import { ArrowRight, ArrowRightLeft, Ban, DoorOpen } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import { BELLS, CHANGE_TYPES } from '../../data/constants.js'
import { roomLabel, shortName } from './lessonStatus.js'
import { pairLabel } from '../../utils/text.js'
import styles from './ChangeRow.module.css'

const ICONS = { replacement: ArrowRightLeft, room: DoorOpen, cancelled: Ban }

/*
  Строка изменения (в Figma — Change Row, варианты Type=...).
  Props: change — объект изменения из API (внутри есть lesson)
*/
function ChangeRow({ change }) {
  const { lesson, change_type: type } = change

  return (
    <article className={styles.row}>
      <div className={styles.time}>
        <span className={styles.pair}>{pairLabel(lesson.pair_number)}</span>
        <span className={styles.start}>{BELLS[lesson.pair_number].start}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <Badge>{lesson.group.name}</Badge>
          <h3 className={styles.subject}>{lesson.subject.name}</h3>
        </div>
        <Details change={change} />
        {change.comment && <p className={styles.comment}>{change.comment}</p>}
      </div>

      <div className={styles.status}>
        <Badge tone={type} icon={ICONS[type]}>
          {CHANGE_TYPES[type]}
        </Badge>
      </div>
    </article>
  )
}

// «Было → стало» в зависимости от типа изменения
function Details({ change }) {
  const { lesson } = change

  if (change.change_type === 'replacement') {
    return (
      <p className={styles.details}>
        <span className={styles.old}>{shortName(lesson.teacher.full_name)}</span>
        <ArrowRight size={14} className={styles.replacement} />
        <strong className={styles.replacement}>{shortName(change.new_teacher.full_name)}</strong>
      </p>
    )
  }
  if (change.change_type === 'room') {
    return (
      <p className={styles.details}>
        <span className={styles.old}>ауд. {lesson.classroom.number}</span>
        <ArrowRight size={14} className={styles.room} />
        <strong className={styles.room}>{roomLabel(change.new_classroom)}</strong>
      </p>
    )
  }
  return (
    <p className={styles.details}>
      Пары не будет · {shortName(lesson.teacher.full_name)}, ауд. {lesson.classroom.number}
    </p>
  )
}

export default ChangeRow
