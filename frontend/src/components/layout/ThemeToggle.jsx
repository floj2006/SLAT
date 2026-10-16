import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { saveTheme } from '../../utils/storage.js'
import styles from './ThemeToggle.module.css'

// Кнопка переключения светлой и тёмной темы.
// Тема хранится в атрибуте <html data-theme="dark">, а CSS-переменные
// в tokens.css меняют цвета под этот атрибут.
function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light')

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    saveTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button className={styles.toggle} onClick={toggleTheme} aria-label="Сменить тему">
      {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  )
}

export default ThemeToggle
