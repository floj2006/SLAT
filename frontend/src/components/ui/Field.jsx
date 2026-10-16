import styles from './Field.module.css'

/*
  Поля формы: Input (текстовое поле) и Select (выпадающий список).
  Оба принимают label (подпись) и error (текст ошибки).

    <Input label="Фамилия" value={name} onChange={(e) => setName(e.target.value)} />
    <Select label="Группа" value={groupId} onChange={...} options={[{ value: 1, label: 'ИС-21' }]} />
*/

export function Input({ label, error, icon: Icon, ...rest }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={`${styles.control} ${error ? styles.invalid : ''}`}>
        {Icon && <Icon size={17} className={styles.icon} />}
        <input className={styles.input} {...rest} />
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  )
}

export function Select({ label, error, options, placeholder, ...rest }) {
  return (
    <label className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={`${styles.control} ${error ? styles.invalid : ''}`}>
        <select className={styles.input} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </label>
  )
}
