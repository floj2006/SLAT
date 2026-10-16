import { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import { Input, Select } from '../../components/ui/Field.jsx'
import { createItem, getLessons, updateItem } from '../../api/api.js'
import { CHANGE_TYPES, DAY_ACCUSATIVE, DAY_NAMES, DAY_PLURAL_DATIVE, WEEK_TYPES } from '../../data/constants.js'
import { toISODate } from '../../utils/dates.js'
import styles from './Admin.module.css'

function initialForm(change, groupId) {
  if (change) {
    return {
      group_id: change.lesson.group.id,
      lesson_id: change.lesson.id,
      date: change.date,
      change_type: change.change_type,
      new_teacher_id: change.new_teacher?.id || '',
      new_classroom_id: change.new_classroom?.id || '',
      comment: change.comment,
    }
  }
  return {
    group_id: groupId, lesson_id: '', date: toISODate(new Date()), change_type: 'replacement',
    new_teacher_id: '', new_classroom_id: '', comment: '',
  }
}

// Форма замены / переноса аудитории / отмены пары
function ChangeForm({ change, groupId, refs, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(change, groupId))
  const [lessons, setLessons] = useState([])
  const [error, setError] = useState('')

  // Когда выбрали группу — подгружаем её занятия для списка «Занятие»
  useEffect(() => {
    if (form.group_id) getLessons({ group_id: form.group_id }).then(setLessons)
  }, [form.group_id])

  function handleChange(event) {
    const { name, value } = event.target
    // Сменили группу — выбранное занятие больше не подходит
    if (name === 'group_id') setForm({ ...form, group_id: value, lesson_id: '' })
    else setForm({ ...form, [name]: value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const data = {
      lesson_id: Number(form.lesson_id),
      date: form.date,
      change_type: form.change_type,
      new_teacher_id: form.new_teacher_id ? Number(form.new_teacher_id) : null,
      new_classroom_id: form.new_classroom_id ? Number(form.new_classroom_id) : null,
      comment: form.comment,
    }
    try {
      const saved = change ? await updateItem('changes', change.id, data) : await createItem('changes', data)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    }
  }

  const lesson = lessons.find((l) => l.id === Number(form.lesson_id))

  return (
    <Modal
      title={change ? 'Редактировать изменение' : 'Новое изменение'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" form="change-form">
            {change ? 'Сохранить' : 'Добавить изменение'}
          </Button>
        </>
      }
    >
      <form id="change-form" className={styles.form} onSubmit={handleSubmit}>
        <Select label="Группа" name="group_id" value={form.group_id} onChange={handleChange}
          options={refs.groups.map((g) => ({ value: g.id, label: g.name }))} />
        <Input label="Дата" type="date" name="date" value={form.date} onChange={handleChange} required />
        <div className={styles.full}>
          <Select label="Занятие" name="lesson_id" value={form.lesson_id} onChange={handleChange} required
            placeholder="Выберите пару"
            options={lessons.map((l) => ({
              value: l.id,
              label: `${DAY_NAMES[l.day_of_week - 1]}, ${l.pair_number}-я пара — ${l.subject.name} (${WEEK_TYPES[l.week_type].toLowerCase()})`,
            }))} />
        </div>
        {lesson && (
          <p className={styles.hint}>
            Эта пара проходит по {DAY_PLURAL_DATIVE[lesson.day_of_week - 1]} — выберите дату {DAY_ACCUSATIVE[lesson.day_of_week - 1]}.
          </p>
        )}
        <Select label="Что изменилось" name="change_type" value={form.change_type} onChange={handleChange}
          options={Object.entries(CHANGE_TYPES).map(([value, label]) => ({ value, label }))} />
        {form.change_type === 'replacement' && (
          <Select label="Кто заменяет" name="new_teacher_id" value={form.new_teacher_id} onChange={handleChange} required
            placeholder="Преподаватель" options={refs.teachers.map((t) => ({ value: t.id, label: t.full_name }))} />
        )}
        {form.change_type === 'room' && (
          <Select label="Новая аудитория" name="new_classroom_id" value={form.new_classroom_id} onChange={handleChange} required
            placeholder="Аудитория" options={refs.classrooms.map((c) => ({ value: c.id, label: `${c.number} · ${c.building}` }))} />
        )}
        <div className={styles.full}>
          <Input label="Комментарий" name="comment" value={form.comment} onChange={handleChange}
            placeholder="Например: преподаватель на курсах повышения квалификации" />
        </div>
        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </Modal>
  )
}

export default ChangeForm
