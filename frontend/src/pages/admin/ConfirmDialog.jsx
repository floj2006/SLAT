import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'

// Окно «Точно удалить?» — чтобы не удалить данные случайным кликом
function ConfirmDialog({ text, onConfirm, onClose }) {
  return (
    <Modal
      title="Удалить запись?"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Удалить
          </Button>
        </>
      }
    >
      <p>{text}</p>
    </Modal>
  )
}

export default ConfirmDialog
