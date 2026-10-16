import { Link } from 'react-router-dom'
import styles from './Logo.module.css'

// Логотип «SLOT.» — точка выделена акцентным цветом
function Logo() {
  return (
    <Link to="/" className={styles.logo} aria-label="SLOT. — на главную">
      SLOT<span className={styles.dot}>.</span>
    </Link>
  )
}

export default Logo
