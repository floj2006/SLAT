import { NavLink, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getNavItems } from './navItems.js'
import styles from './MobileNav.module.css'

// Навигация для телефона: шапка сверху и панель вкладок снизу
function MobileNav() {
  const location = useLocation()

  return (
    <>
      <header className={styles.topbar}>
        <Logo />
        <div className={styles.actions}>
          <NavLink to="/admin" className={styles.iconLink} aria-label="Администрирование">
            <ShieldCheck size={18} />
          </NavLink>
          <ThemeToggle />
        </div>
      </header>

      <nav className={styles.tabbar}>
        {getNavItems().map((item) => {
          const active = item.match ? location.pathname.startsWith(item.match) : null
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.tab} ${(active ?? isActive) ? styles.active : ''}`}
            >
              <item.icon size={21} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

export default MobileNav
