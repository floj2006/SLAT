// Описание справочников для DirectoryPanel: поля формы и тексты интерфейса
export const DIRECTORIES = {
  teachers: {
    resource: 'teachers',
    addLabel: 'Добавить преподавателя',
    editTitle: 'Редактировать преподавателя',
    deleteTitle: 'Удалить преподавателя?',
    savedToast: 'Преподаватель сохранён',
    deletedToast: 'Преподаватель удалён',
    fields: [
      { name: 'full_name', label: 'ФИО', wide: true },
      { name: 'department', label: 'Кафедра' },
      { name: 'email', label: 'Email', type: 'email', required: false },
    ],
  },
  subjects: {
    resource: 'subjects',
    addLabel: 'Добавить предмет',
    editTitle: 'Редактировать предмет',
    deleteTitle: 'Удалить предмет?',
    savedToast: 'Предмет сохранён',
    deletedToast: 'Предмет удалён',
    fields: [{ name: 'name', label: 'Название', wide: true }],
  },
  classrooms: {
    resource: 'classrooms',
    addLabel: 'Добавить аудиторию',
    editTitle: 'Редактировать аудиторию',
    deleteTitle: 'Удалить аудиторию?',
    savedToast: 'Аудитория сохранена',
    deletedToast: 'Аудитория удалена',
    fields: [
      { name: 'number', label: 'Номер' },
      { name: 'building', label: 'Корпус' },
      { name: 'capacity', label: 'Мест', type: 'number' },
    ],
  },
  groups: {
    resource: 'groups',
    addLabel: 'Добавить группу',
    editTitle: 'Редактировать группу',
    deleteTitle: 'Удалить группу?',
    savedToast: 'Группа сохранена',
    deletedToast: 'Группа удалена',
    fields: [
      { name: 'name', label: 'Название' },
      { name: 'course', label: 'Курс', type: 'number' },
      { name: 'specialty', label: 'Специальность', wide: true },
    ],
  },
}
