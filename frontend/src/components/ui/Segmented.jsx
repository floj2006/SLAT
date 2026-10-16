import styles from './Segmented.module.css'

/*
  Переключатель из нескольких вариантов (День / Неделя, Все / Замены ...).
    <Segmented value={view} onChange={setView}
      options={[{ value: 'day', label: 'День' }, { value: 'week', label: 'Неделя' }]} />
*/
function Segmented({ options, value, onChange }) {
  return (
    <div className={styles.group} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={option.value === value}
          className={`${styles.item} ${option.value === value ? styles.active : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default Segmented
