import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import MobileNav from './MobileNav.jsx'
import styles from './AppLayout.module.css'

// Каркас всех страниц: меню + область контента.
// <Outlet /> — место, куда React Router подставляет текущую страницу.
function AppLayout() {
  return (
    <div className={styles.app}>
      <Sidebar />
      <div className={styles.column}>
        <MobileNav />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
