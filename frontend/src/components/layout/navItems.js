import { CalendarDays, House, Search, RefreshCcw } from 'lucide-react'
import { getLastGroupId } from '../../utils/storage.js'

// Пункты меню. Используются и в Sidebar (компьютер), и в MobileNav (телефон).
export function getNavItems() {
  const lastGroupId = getLastGroupId()
  return [
    { to: '/', label: 'Главная', icon: House, end: true },
    { to: lastGroupId ? `/group/${lastGroupId}` : '/', label: 'Расписание', icon: CalendarDays, match: '/group' },
    { to: '/search', label: 'Поиск', icon: Search },
    { to: '/changes', label: 'Изменения', icon: RefreshCcw },
  ]
}
