import { NavLink, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import NowWidget from './NowWidget.jsx'
import { getNavItems } from './navItems.js'
import styles from './Sidebar.module.css'

// Боковое меню для экранов шире 768px
function Sidebar() {
  const location = useLocation()

  // Пункт активен, если адрес совпадает (или начинается с match)
  function isActive(item, isExact) {
    if (item.match) return location.pathname.startsWith(item.match)
    return isExact
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Logo />
        <ThemeToggle />
      </div>

      <nav className={styles.nav}>
        <span className={styles.section}>Меню</span>
        {getNavItems().map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive: exact }) => `${styles.link} ${isActive(item, exact) ? styles.active : ''}`}
          >
            <item.icon size={18} strokeWidth={1.9} />
            {item.label}
          </NavLink>
        ))}

        <span className={styles.section}>Учебная часть</span>
        <NavLink
          to="/admin"
          className={() => `${styles.link} ${location.pathname.startsWith('/admin') ? styles.active : ''}`}
        >
          <ShieldCheck size={18} strokeWidth={1.9} />
          Администрирование
        </NavLink>
      </nav>

      <div className={styles.bottom}>
        <NowWidget />
        <p className={styles.footnote}>Колледж «Северный» · 2026/27</p>
      </div>
    </aside>
  )
}

export default Sidebar
