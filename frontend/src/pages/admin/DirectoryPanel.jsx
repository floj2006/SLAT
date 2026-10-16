import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { Input } from '../../components/ui/Field.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { createItem, deleteItem, updateItem } from '../../api/api.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import styles from './Admin.module.css'

/*
  Одна вкладка для любого справочника: преподаватели, предметы, аудитории, группы.
  Что показывать, описано в объекте config (см. directories.js):
    config.resource — адрес API ('teachers')
    config.fields   — поля формы и колонки таблицы
  Props: config, items — записи справочника, onChanged — перезагрузить справочники
*/
function DirectoryPanel({ config, items, onChanged }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const showToast = useToast()

  async function handleDelete() {
    try {
      await deleteItem(config.resource, deleting.id)
      showToast('Запись удалена')
      onChanged()
    } catch (err) {
      showToast(err.message, 'error') // например: «Нельзя удалить: преподаватель ведёт 12 занятий»
    }
    setDeleting(null)
  }

  function handleSaved() {
    setEditing(null)
    onChanged()
    showToast('Сохранено')
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.grow} />
        <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
          {config.addLabel}
        </Button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {config.fields.map((field) => (
                <th key={field.name}>{field.label}</th>
              ))}
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {config.fields.map((field, index) => (
                  <td key={field.name} className={index === 0 ? styles.strong : ''}>
                    {item[field.name]}
                  </td>
                ))}
                <td>
                  <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={() => setEditing(item)} aria-label="Изменить">
                      <Pencil size={15} />
                    </button>
                    <button className={`${styles.iconButton} ${styles.danger}`} onClick={() => setDeleting(item)} aria-label="Удалить">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <DirectoryForm config={config} item={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {deleting && (
        <ConfirmDialog text={`«${deleting[config.fields[0].name]}» будет удалено.`} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  )
}

// Форма записи справочника: поля строятся по config.fields
function DirectoryForm({ config, item, onClose, onSaved }) {
  const empty = Object.fromEntries(config.fields.map((field) => [field.name, field.type === 'number' ? 1 : '']))
  const [form, setForm] = useState(item || empty)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const data = {}
    for (const field of config.fields) {
      data[field.name] = field.type === 'number' ? Number(form[field.name]) : form[field.name]
    }
    try {
      if (item) await updateItem(config.resource, item.id, data)
      else await createItem(config.resource, data)
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal
      title={item ? 'Изменить запись' : config.addLabel}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" form="directory-form">
            Сохранить
          </Button>
        </>
      }
    >
      <form id="directory-form" className={styles.form} onSubmit={handleSubmit}>
        {config.fields.map((field) => (
          <div key={field.name} className={field.wide ? styles.full : ''}>
            <Input
              label={field.label}
              type={field.type || 'text'}
              value={form[field.name]}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
              required={field.required !== false}
              min={field.type === 'number' ? 1 : undefined}
            />
          </div>
        ))}
        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </Modal>
  )
}

export default DirectoryPanel
