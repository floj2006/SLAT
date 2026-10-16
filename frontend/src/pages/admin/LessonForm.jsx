import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Field.jsx'
import { createItem, updateItem } from '../../api/api.js'
import { BELLS, DAY_NAMES, LESSON_TYPES, WEEK_TYPES } from '../../data/constants.js'
import styles from './Admin.module.css'

// Начальные значения формы: из занятия (редактирование) или пустые (создание)
function initialForm(lesson, groupId) {
  if (lesson) {
    return {
      group_id: lesson.group.id,
      subject_id: lesson.subject.id,
      teacher_id: lesson.teacher.id,
      classroom_id: lesson.classroom.id,
      day_of_week: lesson.day_of_week,
      pair_number: lesson.pair_number,
      week_type: lesson.week_type,
      lesson_type: lesson.lesson_type,
    }
  }
  return {
    group_id: groupId, subject_id: '', teacher_id: '', classroom_id: '',
    day_of_week: 1, pair_number: 1, week_type: 'both', lesson_type: 'Лекция',
  }
}

/*
  Форма создания / изменения занятия (в Figma — экран «06 Форма занятия»).
  Props: lesson (null для нового), groupId, refs (справочники), onClose, onSaved, onDelete
*/
function LessonForm({ lesson, groupId, refs, onClose, onSaved, onDelete }) {
  const [form, setForm] = useState(() => initialForm(lesson, groupId))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Одна функция-обработчик для всех полей: имя поля берём из атрибута name
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    // Из <select> значения приходят строками — переводим id и номера в числа
    const data = {
      ...form,
      group_id: Number(form.group_id),
      subject_id: Number(form.subject_id),
      teacher_id: Number(form.teacher_id),
      classroom_id: Number(form.classroom_id),
      day_of_week: Number(form.day_of_week),
      pair_number: Number(form.pair_number),
    }
    try {
      const saved = lesson ? await updateItem('lessons', lesson.id, data) : await createItem('lessons', data)
      onSaved(saved)
    } catch (err) {
      setError(err.message) // например: «Аудитория занята группой ИС-22 в это время»
    } finally {
      setSaving(false)
    }
  }

  const options = (items, label) => items.map((item) => ({ value: item.id, label: label(item) }))

  return (
    <Modal
      title={lesson ? 'Изменить занятие' : 'Новое занятие'}
      onClose={onClose}
      footer={
        <>
          {lesson && (
            <Button variant="ghost" icon={Trash2} onClick={() => onDelete(lesson)}>
              Удалить
            </Button>
          )}
          <span className={styles.spacer} />
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" form="lesson-form" disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </>
      }
    >
      <form id="lesson-form" className={styles.form} onSubmit={handleSubmit}>
        <Select label="Группа" name="group_id" value={form.group_id} onChange={handleChange} required
          options={options(refs.groups, (g) => g.name)} />
        <Select label="Предмет" name="subject_id" value={form.subject_id} onChange={handleChange} required
          placeholder="Выберите предмет" options={options(refs.subjects, (s) => s.name)} />
        <Select label="Преподаватель" name="teacher_id" value={form.teacher_id} onChange={handleChange} required
          placeholder="Выберите преподавателя" options={options(refs.teachers, (t) => t.full_name)} />
        <Select label="Аудитория" name="classroom_id" value={form.classroom_id} onChange={handleChange} required
          placeholder="Выберите аудиторию" options={options(refs.classrooms, (c) => `${c.number} · ${c.building}`)} />
        <Select label="День недели" name="day_of_week" value={form.day_of_week} onChange={handleChange}
          options={DAY_NAMES.map((name, i) => ({ value: i + 1, label: name }))} />
        <Select label="Пара" name="pair_number" value={form.pair_number} onChange={handleChange}
          options={Object.entries(BELLS).map(([n, b]) => ({ value: n, label: `${n} · ${b.start} – ${b.end}` }))} />
        <Select label="Неделя" name="week_type" value={form.week_type} onChange={handleChange}
          options={Object.entries(WEEK_TYPES).map(([value, label]) => ({ value, label }))} />
        <Select label="Тип занятия" name="lesson_type" value={form.lesson_type} onChange={handleChange}
          options={LESSON_TYPES.map((type) => ({ value: type, label: type }))} />
        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </Modal>
  )
}

export default LessonForm
