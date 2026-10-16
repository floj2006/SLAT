import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { Select } from '../../components/ui/Field.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { deleteItem, getChanges } from '../../api/api.js'
import { CHANGE_TYPES } from '../../data/constants.js'
import { formatDayMonth, fromISODate, toISODate } from '../../utils/dates.js'
import { shortName } from '../../components/schedule/lessonStatus.js'
import ChangeForm from './ChangeForm.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import styles from './Admin.module.css'

// Что именно поменялось — коротко для таблицы
function describe(change) {
  if (change.change_type === 'replacement') return `→ ${shortName(change.new_teacher.full_name)}`
  if (change.change_type === 'room') return `→ ауд. ${change.new_classroom.number}`
  return 'пара не проводится'
}

// Вкладка «Изменения»: замены и отмены начиная с сегодняшнего дня
function ChangesPanel({ refs }) {
  const [groupId, setGroupId] = useState('')
  const [changes, setChanges] = useState([])
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const showToast = useToast()

  function loadChanges() {
    getChanges({ group_id: groupId, date_from: toISODate(new Date()) })
      .then(setChanges)
      .catch((err) => showToast(err.message, 'error'))
  }

  useEffect(() => {
    loadChanges()
  }, [groupId])

  function handleSaved() {
    setEditing(null)
    loadChanges()
    showToast('Изменение сохранено — студенты увидят его в расписании')
  }

  async function handleDelete() {
    try {
      await deleteItem('changes', deleting.id)
      showToast('Изменение удалено')
      loadChanges()
    } catch (err) {
      showToast(err.message, 'error')
    }
    setDeleting(null)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <Select label="Группа" value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Все группы"
          options={refs.groups.map((g) => ({ value: g.id, label: g.name }))} />
        <span className={styles.grow} />
        <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
          Добавить изменение
        </Button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Группа</th>
              <th>Пара</th>
              <th>Предмет</th>
              <th>Тип</th>
              <th>Что изменилось</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={change.id}>
                <td className={styles.strong}>{formatDayMonth(fromISODate(change.date))}</td>
                <td>{change.lesson.group.name}</td>
                <td className={styles.mono}>{change.lesson.pair_number}</td>
                <td>{change.lesson.subject.name}</td>
                <td>
                  <Badge tone={change.change_type}>{CHANGE_TYPES[change.change_type]}</Badge>
                </td>
                <td>{describe(change)}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={() => setEditing(change)} aria-label="Изменить">
                      <Pencil size={15} />
                    </button>
                    <button className={`${styles.iconButton} ${styles.danger}`} onClick={() => setDeleting(change)} aria-label="Удалить">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>Изменений с сегодняшнего дня нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ChangeForm
          change={editing.id ? editing : null}
          groupId={groupId || refs.groups[0]?.id}
          refs={refs}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Удалить изменение?"
          text={`${CHANGE_TYPES[deleting.change_type]}: ${deleting.lesson.subject.name}, ${deleting.lesson.group.name}. Пара снова пойдёт по основному расписанию.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

export default ChangesPanel
