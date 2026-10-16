// Описание справочников для DirectoryPanel: какие поля есть и как они называются
export const DIRECTORIES = {
  teachers: {
    resource: 'teachers',
    addLabel: 'Добавить преподавателя',
    fields: [
      { name: 'full_name', label: 'ФИО', wide: true },
      { name: 'department', label: 'Кафедра' },
      { name: 'email', label: 'Email', type: 'email', required: false },
    ],
  },
  subjects: {
    resource: 'subjects',
    addLabel: 'Добавить предмет',
    fields: [{ name: 'name', label: 'Название', wide: true }],
  },
  classrooms: {
    resource: 'classrooms',
    addLabel: 'Добавить аудиторию',
    fields: [
      { name: 'number', label: 'Номер' },
      { name: 'building', label: 'Корпус' },
      { name: 'capacity', label: 'Мест', type: 'number' },
    ],
  },
  groups: {
    resource: 'groups',
    addLabel: 'Добавить группу',
    fields: [
      { name: 'name', label: 'Название' },
      { name: 'course', label: 'Курс', type: 'number' },
      { name: 'specialty', label: 'Специальность', wide: true },
    ],
  },
}
