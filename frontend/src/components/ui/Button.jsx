import styles from './Button.module.css'

/*
  Кнопка. Пример:
    <Button variant="primary" icon={Plus} onClick={openForm}>Добавить</Button>

  variant: primary | secondary | ghost | danger
  size:    md | sm
  icon:    иконка из lucide-react (необязательно)
*/
function Button({ children, variant = 'secondary', size = 'md', icon: Icon, fullWidth, type = 'button', ...rest }) {
  const classes = [styles.button, styles[variant], styles[size], fullWidth ? styles.full : '']

  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2} />}
      {children && <span>{children}</span>}
    </button>
  )
}

export default Button
