import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'

function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={SearchX}
      title="Страница не найдена"
      text="Возможно, ссылка устарела."
      action={
        <Button variant="primary" onClick={() => navigate('/')}>
          На главную
        </Button>
      }
    />
  )
}

export default NotFoundPage
