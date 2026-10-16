import { ArrowRight, MapPin, User, Users, Clock, ArrowRightLeft, DoorOpen, Ban } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import { BELLS } from '../../data/constants.js'
import { getPairProgress, roomLabel, shortName } from './lessonStatus.js'
import { pairLabel } from '../../utils/text.js'
import styles from './LessonCard.module.css'

const STATUS_BADGES = {
  now: { tone: 'now', icon: Clock, text: 'Идёт сейчас' },
  replacement: { tone: 'replacement', icon: ArrowRightLeft, text: 'Замена' },
  room: { tone: 'room', icon: DoorOpen, text: 'Другая аудитория' },
  cancelled: { tone: 'cancelled', icon: Ban, text: 'Отменена' },
}

/*
  Карточка занятия (в Figma — Lesson Card, варианты Status=...).
  Props:
    item   — { lesson, change } из ответа API
    status — 'default' | 'now' | 'replacement' | 'room' | 'cancelled'
    mode   — 'group' (показываем преподавателя) или 'teacher' (показываем группу)
*/
function LessonCard({ item, status, mode = 'group' }) {
  const { lesson, change } = item
  const bell = BELLS[lesson.pair_number]
  const badge = STATUS_BADGES[status]

  return (
    <article className={`${styles.card} ${styles[status]}`}>
      <div className={styles.time}>
        <span className={styles.pair}>{pairLabel(lesson.pair_number)}</span>
        <span className={styles.start}>{bell.start}</span>
        <span className={styles.end}>{bell.end}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <h3 className={styles.subject}>{lesson.subject.name}</h3>
          {badge && (
            <Badge tone={badge.tone} icon={badge.icon}>
              {badge.text}
            </Badge>
          )}
        </div>

        <div className={styles.meta}>
          {mode === 'group' ? (
            <span className={styles.item}>
              <User size={15} />
              <span className={status === 'replacement' || status === 'cancelled' ? styles.old : ''}>
                {shortName(lesson.teacher.full_name)}
              </span>
              {status === 'replacement' && change.new_teacher && (
                <>
                  <ArrowRight size={14} className={styles.arrowReplacement} />
                  <strong className={styles.newReplacement}>{shortName(change.new_teacher.full_name)}</strong>
                </>
              )}
            </span>
          ) : (
            <span className={styles.item}>
              <Users size={15} />
              <span>{lesson.group.name}</span>
            </span>
          )}

          <span className={styles.item}>
            <MapPin size={15} />
            <span className={status === 'room' || status === 'cancelled' ? styles.old : ''}>
              {roomLabel(lesson.classroom)}
            </span>
            {status === 'room' && change.new_classroom && (
              <>
                <ArrowRight size={14} className={styles.arrowRoom} />
                <strong className={styles.newRoom}>ауд. {change.new_classroom.number}</strong>
              </>
            )}
          </span>

          <Badge>{lesson.lesson_type}</Badge>
        </div>

        {change && change.comment && <p className={styles.comment}>{change.comment}</p>}

        {status === 'now' && (
          <div className={styles.progress}>
            <div style={{ width: `${Math.round(getPairProgress(lesson.pair_number) * 100)}%` }} />
          </div>
        )}
      </div>
    </article>
  )
}

export default LessonCard
