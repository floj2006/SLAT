import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'

/*
  Окно «Удалить ...?» — чтобы не удалить данные случайным кликом.
  Props: title — что удаляем («Удалить занятие?»), text — подробности, onConfirm, onClose
*/
function ConfirmDialog({ title = 'Удалить?', text, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Не удалять
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Удалить
          </Button>
        </>
      }
    >
      <p>{text}</p>
      <p style={{ marginTop: 8, color: 'var(--color-text-3)', font: 'var(--text-small)' }}>Это действие нельзя отменить.</p>
    </Modal>
  )
}

export default ConfirmDialog
