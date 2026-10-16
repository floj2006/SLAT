import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Field.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { deleteItem, getLessons } from '../../api/api.js'
import { BELLS, DAY_NAMES, WEEK_TYPES } from '../../data/constants.js'
import { shortName } from '../../components/schedule/lessonStatus.js'
import LessonForm from './LessonForm.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import styles from './Admin.module.css'

// Вкладка «Занятия»: таблица занятий группы + добавление, изменение, удаление
function LessonsPanel({ refs }) {
  const [groupId, setGroupId] = useState(refs.groups[0]?.id || '')
  const [day, setDay] = useState('')
  const [lessons, setLessons] = useState([])
  const [editing, setEditing] = useState(null) // null — окно закрыто, {} — новое, lesson — изменение
  const [deleting, setDeleting] = useState(null)
  const showToast = useToast()

  function loadLessons() {
    getLessons({ group_id: groupId }).then(setLessons).catch((err) => showToast(err.message, 'error'))
  }

  // Загружаем занятия при открытии и каждый раз при выборе другой группы
  useEffect(() => {
    loadLessons()
  }, [groupId])

  function handleSaved() {
    setEditing(null)
    loadLessons()
    showToast('Занятие сохранено')
  }

  async function handleDelete() {
    try {
      await deleteItem('lessons', deleting.id)
      showToast('Занятие удалено')
      loadLessons()
    } catch (err) {
      showToast(err.message, 'error')
    }
    setDeleting(null)
    setEditing(null)
  }

  const visible = day ? lessons.filter((lesson) => lesson.day_of_week === Number(day)) : lessons
  const groupName = refs.groups.find((g) => g.id === Number(groupId))?.name

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <Select label="Группа" value={groupId} onChange={(e) => setGroupId(e.target.value)}
          options={refs.groups.map((g) => ({ value: g.id, label: g.name }))} />
        <Select label="День недели" value={day} onChange={(e) => setDay(e.target.value)} placeholder="Все дни"
          options={DAY_NAMES.map((name, i) => ({ value: i + 1, label: name }))} />
        <span className={styles.grow} />
        <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
          Добавить занятие
        </Button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>День</th>
              <th>Пара</th>
              <th>Предмет</th>
              <th>Преподаватель</th>
              <th>Аудитория</th>
              <th>Неделя</th>
              <th>Тип</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {visible.map((lesson) => (
              <tr key={lesson.id}>
                <td>{DAY_NAMES[lesson.day_of_week - 1]}</td>
                <td className={styles.mono}>
                  {lesson.pair_number} · {BELLS[lesson.pair_number].start}
                </td>
                <td className={styles.strong}>{lesson.subject.name}</td>
                <td>{shortName(lesson.teacher.full_name)}</td>
                <td>{lesson.classroom.number}</td>
                <td>{WEEK_TYPES[lesson.week_type]}</td>
                <td>{lesson.lesson_type}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={() => setEditing(lesson)} aria-label="Изменить">
                      <Pencil size={15} />
                    </button>
                    <button className={`${styles.iconButton} ${styles.danger}`} onClick={() => setDeleting(lesson)} aria-label="Удалить">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>Занятий нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>
        Занятий у группы {groupName}: {lessons.length} · изменения сразу сохраняются в базе SQLite
      </p>

      {editing && (
        <LessonForm
          lesson={editing.id ? editing : null}
          groupId={groupId}
          refs={refs}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onDelete={setDeleting}
        />
      )}
      {deleting && (
        <ConfirmDialog
          text={`${deleting.subject.name}, ${DAY_NAMES[deleting.day_of_week - 1].toLowerCase()}, ${deleting.pair_number} пара. Изменения этого занятия тоже удалятся.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

export default LessonsPanel
