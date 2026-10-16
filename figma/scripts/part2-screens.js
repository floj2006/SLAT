// =====================================================================
//  Часть 2: экраны Desktop 1440 и Mobile 390 из компонентов библиотеки.
// =====================================================================

const LIBRARY = {
  Button: 'Button', IconButton: 'Icon Button', Input: 'Input', Select: 'Select', Badge: 'Lesson Status',
  Segment: 'Segment', NavItem: 'Nav Item', Sidebar: 'Sidebar', TopBar: 'Mobile Top Bar', TabBar: 'Mobile Tab Bar',
  DayTab: 'Day Tab', LessonCard: 'Lesson Card', ChangeRow: 'Change Row', GroupCard: 'Group Card',
  TeacherRow: 'Teacher Row', WeekSwitcher: 'Week Switcher', TableRow: 'Table Row', Modal: 'Modal',
  Toast: 'Notification', Empty: 'Empty State', Banner: 'Changes Banner', Stat: 'Stat Card',
}

async function loadLibrary() {
  const page = figma.root.children.find((p) => p.name === 'Design System')
  await page.loadAsync()
  for (const node of page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (node.name.startsWith('Icon/')) { ICON[node.name.slice(5)] = node; continue }
    if (node.type === 'COMPONENT' && node.parent.type === 'COMPONENT_SET') continue
    for (const [key, name] of Object.entries(LIBRARY)) if (node.name === name) C[key] = node
  }
  // Колонки сетки на Foundations делаем полупрозрачными
  const columns = page.findOne((n) => n.name === 'Columns')
  if (columns) for (const c of columns.children) c.opacity = 0.15
  const missing = Object.keys(LIBRARY).filter((k) => !C[k])
  if (missing.length) throw new Error('Нет компонентов: ' + missing.join(', '))
}

// ---------- Маленькие строительные блоки ----------
function badge(status, label) {
  const b = inst(C.Badge, { Status: status })
  setText(b, 'Label', label)
  return b
}
function button(kind, label, iconName) {
  const b = inst(C.Button, { Variant: kind, State: 'Default' })
  setText(b, 'Label', label)
  b.name = 'Button / ' + label
  if (iconName) swapIcon(b, iconName, kind === 'Primary' ? 'bg' : 'text')
  else hideIcon(b)
  return b
}
function segmented(labels, active) {
  const group = box('H', { name: 'Segmented', gap: 2, p: 3, r: 'md', fill: 'surface-2', stroke: 'border' })
  labels.forEach((label, i) => {
    const s = inst(C.Segment, { Active: i === active ? 'true' : 'false' })
    setText(s, 'Label', label)
    add(group, s)
  })
  return group
}
function field(kind, label, value, state = 'Default', error) {
  const f = inst(C[kind], { State: state })
  setText(f, 'Label', label)
  setText(f, 'Value', value)
  if (!label) {
    const key = Object.keys(f.componentProperties).find((k) => k.startsWith('Show label'))
    f.setProperties({ [key]: false })
  }
  if (error) {
    const node = f.findOne((n) => n.type === 'TEXT' && n.name === 'Error')
    if (node) node.characters = error
  }
  return f
}
async function heading(title, subtitle, size = 'H1') {
  const h = box('V', { name: 'Heading', gap: 6 })
  add(h, await txt(title, size, 'text', { name: 'Title' }))
  if (subtitle) add(h, await txt(subtitle, 'Small', 'text-2', { name: 'Subtitle' }))
  return h
}
async function hero(title, size) {
  const t = await txt(title, size, 'text', { name: 'Hero' })
  const dot = title.lastIndexOf('.')
  t.setRangeFills(dot, dot + 1, [solid('accent')])
  return t
}
function highlight(textNode, query) {
  if (!textNode) return
  const at = textNode.characters.toLowerCase().indexOf(query)
  if (at >= 0) {
    try { textNode.setRangeFills(at, at + query.length, [solid('accent-text')]) } catch (e) { /* не критично */ }
  }
}

// ---------- Каркасы экранов ----------
function desktopShell(name, active) {
  const screen = box('H', { name, fill: 'bg', w: 1440 })
  const sidebar = inst(C.Sidebar, { Active: active })
  const main = box('V', { name: 'Main', gap: 32, p: [40, 40, 56, 40] })
  add(screen, sidebar, main)
  fillH(sidebar)
  main.layoutGrow = 1
  main.minHeight = 1024
  main.layoutGrids = [{ pattern: 'COLUMNS', alignment: 'STRETCH', gutterSize: 16, count: 12, offset: 40, visible: false, color: { r: 0.18, g: 0.36, b: 1, a: 0.08 } }]
  return { screen, main }
}
function mobileShell(name, active) {
  const screen = box('V', { name, fill: 'bg', w: 390, h: 844, clip: true })
  const top = C.TopBar.createInstance()
  const main = box('V', { name: 'Main', gap: 20, p: [20, 16, 104, 16] })
  add(screen, top, main)
  fillW(top)
  fillW(main)
  main.layoutGrids = [{ pattern: 'COLUMNS', alignment: 'STRETCH', gutterSize: 12, count: 4, offset: 16, visible: false, color: { r: 0.18, g: 0.36, b: 1, a: 0.08 } }]
  const tabs = inst(C.TabBar, { Active: active })
  add(screen, tabs)
  tabs.layoutPositioning = 'ABSOLUTE'
  tabs.x = 0
  tabs.y = 844 - tabs.height
  return { screen, main }
}

// ---------- Данные для макетов (как в seed.py) ----------
const GROUPS = {
  '1 курс': [['ВЕБ-23', 'Веб-разработка'], ['СА-24', 'Сетевое и системное администрирование']],
  '2 курс': [['ИС-21', 'Информационные системы и программирование'], ['ИС-22', 'Информационные системы и программирование'], ['ДИЗ-22', 'Графический дизайн']],
  '3 курс': [['ПР-31', 'Программирование в компьютерных системах']],
}
const DAYS = [['Пн', '12', '4 пары'], ['Вт', '13', '5 пар'], ['Ср', '14', '3 пары'], ['Чт', '15', '4 пары'], ['Пт', '16', '4 пары'], ['Сб', '17', '2 пары']]
const LESSONS = [
  ['Default', '1 пара', '08:30', '10:00', 'Математика', 'Климова Д. О.', 'ауд. 201 · Корпус А', 'Практика'],
  ['Replacement', '2 пара', '10:10', '11:40', 'Базы данных', 'Морозова А. С.', 'ауд. 214 · Корпус А', 'Лекция', 'Ветров П. А.'],
  ['Now', '3 пара', '12:20', '13:50', 'Веб-программирование', 'Ветров П. А.', 'ауд. Лаб-3 · Корпус А', 'Лабораторная'],
  ['Cancelled', '4 пара', '14:00', '15:30', 'Английский язык', 'Есина В. П.', 'ауд. 104 · Корпус А', 'Практика'],
]
const CHANGES = {
  'Сегодня, 16 октября': [
    ['Replacement', '2 пара', '10:10', 'ИС-21', 'Базы данных', 'Морозова А. С.', 'Ветров П. А.', 'Преподаватель на курсах повышения квалификации'],
    ['Room', '3 пара', '12:20', 'ПР-31', 'Операционные системы', 'ауд. 214', 'ауд. 305', 'В аудитории ремонт проектора'],
    ['Cancelled', '4 пара', '14:00', 'ИС-21', 'Английский язык', 'Есина В. П. · ауд. 104', '', 'Перенос по приказу учебной части'],
  ],
  'Понедельник, 19 октября': [
    ['Replacement', '1 пара', '08:30', 'ВЕБ-23', 'UI/UX-дизайн', 'Лаптева Н. Р.', 'Рябова Е. И.', 'Преподаватель на конференции'],
    ['Room', '2 пара', '10:10', 'СА-24', 'Компьютерные сети', 'ауд. Б-21', 'ауд. Б-24', 'Плановая проверка сети'],
  ],
}
const TABLE = [
  ['Понедельник', '1 · 08:30', 'Математика', 'Климова Д. О.', '201', 'Каждую', 'Практика'],
  ['Понедельник', '2 · 10:10', 'Базы данных', 'Морозова А. С.', '214', 'Каждую', 'Лекция'],
  ['Понедельник', '3 · 12:20', 'Проектирование ИС', 'Морозова А. С.', '305', 'Каждую', 'Практика'],
  ['Понедельник', '4 · 14:00', 'Английский язык', 'Есина В. П.', '104', 'Нечётная', 'Практика'],
  ['Вторник', '2 · 10:10', 'Веб-программирование', 'Ветров П. А.', 'Лаб-3', 'Каждую', 'Лабораторная'],
  ['Вторник', '3 · 12:20', 'Физическая культура', 'Тарасов Г. Д.', 'Спортзал', 'Каждую', 'Практика'],
  ['Вторник', '4 · 14:00', 'Математика', 'Климова Д. О.', '201', 'Чётная', 'Лекция'],
  ['Среда', '1 · 08:30', 'Базы данных', 'Морозова А. С.', 'Лаб-3', 'Каждую', 'Лабораторная'],
]

function lessonCard([status, pair, start, end, subject, teacher, room, type, newTeacher]) {
  const card = inst(C.LessonCard, { Status: status })
  setText(card, 'Pair', pair)
  setText(card, 'Start', start)
  setText(card, 'End', end)
  setText(card, 'Subject', subject)
  setText(card, 'Teacher', teacher)
  setText(card, 'Room', room)
  setNested(card, 'Type', 'Label', type)
  if (newTeacher) setText(card, 'New Teacher', newTeacher)
  return card
}
function changeRow([type, pair, start, group, subject, oldValue, newValue, comment], mobile) {
  const row = inst(C.ChangeRow, { Type: type })
  setText(row, 'Pair', pair)
  setText(row, 'Start', start)
  setNested(row, 'Group', 'Label', group)
  setText(row, 'Subject', subject)
  setText(row, 'Old', oldValue)
  if (newValue) setText(row, 'New', newValue)
  setText(row, 'Comment', comment)
  if (mobile) hide(row, 'Status')
  return row
}
function groupCard(name, specialty, course) {
  const card = inst(C.GroupCard, { State: 'Default' })
  setText(card, 'Name', name)
  setText(card, 'Specialty', specialty)
  setNested(card, 'Course', 'Label', course)
  card.name = 'Group Card / ' + name
  return card
}
function resultRow(initials, name, details, query) {
  const row = C.TeacherRow.createInstance()
  setText(row, 'Initials', initials)
  highlight(setText(row, 'Name', name) || row.findOne((n) => n.type === 'TEXT' && n.name === 'Name'), query)
  setText(row, 'Department', details)
  row.name = 'Result / ' + name
  return row
}
function fillAll(parent) { for (const child of parent.children) fillW(child) }

// ---------- Содержимое экранов (общее для desktop и mobile) ----------
async function homeContent(main, mobile) {
  const meta = box('H', { name: 'Today', gap: 8 })
  add(meta, badge('Neutral', 'Пятница, 16 октября'), badge('Accent', 'Нечётная неделя'))
  const intro = box('V', { name: 'Hero', gap: 16 })
  add(intro, await hero(mobile ? 'Расписание —\nза пару секунд.' : 'Расписание —\nза пару секунд.', mobile ? 'H1' : 'Display'),
    await txt('Выберите группу, чтобы увидеть занятия, замены и свободные окна. Без Excel-таблиц.', mobile ? 'Small' : 'Body', 'text-2', { w: mobile ? 358 : 520, name: 'Lead' }))
  const search = field('Input', '', 'Найти группу, например ИС-21')
  add(intro, search)
  if (mobile) fillW(search)
  else { search.resize(520, search.height) }
  const banner = C.Banner.createInstance()
  banner.name = 'Changes Banner'
  add(main, meta, intro, banner)
  fillW(main.children[2])
  for (const [course, list] of Object.entries(GROUPS)) {
    if (mobile && course !== '2 курс') continue
    const sectionBox = box('V', { name: 'Course / ' + course, gap: 16 })
    const head = box('H', { gap: 10, align: 'CENTER' })
    add(head, await txt(course, 'H3', 'text'), await txt(`${list.length} ${list.length === 1 ? 'группа' : 'группы'}`, 'Small', 'text-3'))
    const grid = box(mobile ? 'V' : 'H', { name: 'Grid', gap: mobile ? 12 : 16, wrap: !mobile })
    for (const [name, specialty] of list) add(grid, groupCard(name, specialty, course))
    if (mobile) fillAll(grid)
    add(sectionBox, head, grid)
    add(main, sectionBox)
    fillW(sectionBox)
    fillW(grid)
  }
}

async function scheduleContent(main, mobile) {
  if (!mobile) {
    const crumbs = box('H', { name: 'Breadcrumbs', gap: 6, align: 'CENTER' })
    add(crumbs, await txt('Группы', 'Small', 'text-3'), icon('chevron-right', 14, 'text-3'), await txt('ИС-21', 'Small Medium', 'text'))
    add(main, crumbs)
  }
  const header = box('H', { name: 'Header', align: mobile ? 'CENTER' : 'MAX', justify: 'SPACE_BETWEEN' })
  const title = await heading('ИС-21', mobile ? '2 курс · ИСиП' : 'Информационные системы и программирование · 2 курс', mobile ? 'H2' : 'H1')
  const controls = box('H', { name: 'Controls', gap: 12, align: 'CENTER' })
  if (!mobile) add(controls, segmented(['День', 'Неделя'], 0))
  add(controls, C.WeekSwitcher.createInstance())
  add(header, title, controls)
  const days = box('H', { name: 'Day Tabs', gap: mobile ? 4 : 8 })
  DAYS.forEach(([day, date, count], i) => {
    const tab = inst(C.DayTab, { State: i === 4 ? 'Active' : 'Default' })
    setText(tab, 'Day', day)
    setText(tab, 'Date', date)
    setText(tab, 'Count', mobile ? count.split(' ')[0] : count)
    if (i === 4) {
      const key = Object.keys(tab.componentProperties).find((k) => k.startsWith('Today'))
      tab.setProperties({ [key]: true })
    }
    add(days, tab)
    tab.layoutGrow = 1
  })
  const dayHead = box('H', { name: 'Day Heading', align: 'CENTER', justify: 'SPACE_BETWEEN' })
  add(dayHead, await txt('Пятница, 16 октября', mobile ? 'H3' : 'H2', 'text'), await txt(mobile ? '4 пары' : '4 пары · 08:30 – 15:30', 'Small', 'text-3'))
  const list = box('V', { name: 'Lessons', gap: 12 })
  for (const lesson of mobile ? LESSONS.slice(0, 3) : LESSONS) add(list, lessonCard(lesson))
  fillAll(list)
  add(main, header, days, dayHead, list)
  for (const n of [header, days, dayHead, list]) fillW(n)
}

async function searchContent(main, mobile) {
  const query = 'ве'
  const bar = box(mobile ? 'V' : 'H', { name: 'Search Bar', gap: 12, align: mobile ? 'MIN' : 'CENTER' })
  const input = field('Input', '', query, 'Focus')
  const value = input.findOne((n) => n.type === 'TEXT' && n.name === 'Value')
  if (value) value.fills = [solid('text')]
  add(bar, input, segmented(['Все', 'Группы', 'Преподаватели'], 0))
  if (mobile) fillW(input)
  else input.resize(520, input.height)
  add(main, await heading('Поиск', 'Группы и преподаватели колледжа'), bar)
  fillW(bar)
  const results = box('V', { name: 'Results', gap: 24 })
  const groupsBox = box('V', { name: 'Groups', gap: 8 })
  add(groupsBox, await txt('Группы · 1', 'Overline', 'text-3', { upper: true }), resultRow('1к', 'ВЕБ-23', 'Веб-разработка · 1 курс', query))
  const teachersBox = box('V', { name: 'Teachers', gap: 8 })
  add(teachersBox, await txt('Преподаватели · 2', 'Overline', 'text-3', { upper: true }),
    resultRow('ВП', 'Ветров Павел Андреевич', 'Информационные технологии', query),
    resultRow('ЕВ', 'Есина Вера Павловна', 'Иностранные языки', query))
  for (const b of [groupsBox, teachersBox]) { add(results, b); fillW(b); for (const r of b.children.slice(1)) fillW(r) }
  add(main, results)
  fillW(results)
}

async function changesContent(main, mobile) {
  const header = box('H', { name: 'Header', align: 'MAX', justify: 'SPACE_BETWEEN' })
  add(header, await heading('Изменения', 'Замены, переносы и отмены на ближайшие дни'))
  if (!mobile) {
    const select = field('Select', '', 'Все группы')
    select.resize(220, select.height)
    add(header, select)
  }
  add(main, header)
  fillW(header)
  if (!mobile) {
    const stats = box('H', { name: 'Stats', gap: 16 })
    for (const [type, value] of [['Replacement', '2'], ['Room', '2'], ['Cancelled', '1']]) {
      const stat = inst(C.Stat, { Type: type })
      setText(stat, 'Value', value)
      add(stats, stat)
      stat.layoutGrow = 1
    }
    add(main, stats)
    fillW(stats)
  }
  add(main, segmented(['Все', 'Замены', 'Аудитории', 'Отмены'], 0))
  for (const [day, rows] of Object.entries(CHANGES)) {
    const group = box('V', { name: 'Day / ' + day, gap: 12 })
    const head = box('H', { gap: 10, align: 'CENTER' })
    add(head, await txt(day, 'H3', 'text'), badge('Neutral', String(rows.length)))
    add(group, head)
    for (const row of rows) add(group, changeRow(row, mobile))
    for (const r of group.children.slice(1)) fillW(r)
    add(main, group)
    fillW(group)
  }
}

async function adminContent(main) {
  const header = box('H', { name: 'Header', align: 'CENTER', justify: 'SPACE_BETWEEN' })
  add(header, await heading('Администрирование', 'Вы вошли как admin · роль: администратор'), button('Secondary', 'Выйти', 'log-out'))
  const toolbar = box('H', { name: 'Toolbar', gap: 12, align: 'MAX' })
  const group = field('Select', 'Группа', 'ИС-21')
  const day = field('Select', 'День недели', 'Все дни')
  add(toolbar, group, day)
  spacer(toolbar)
  add(toolbar, button('Primary', 'Добавить занятие', 'plus'))
  const table = box('V', { name: 'Table', r: 'lg', fill: 'surface', stroke: 'border', clip: true })
  await shadow(table, 'sm')
  const tableHead = inst(C.TableRow, { Kind: 'Header' })
  tableHead.name = 'Table Header'
  add(table, tableHead)
  for (const values of TABLE) {
    const row = inst(C.TableRow, { Kind: 'Row' })
    row.name = 'Table Row'
    ;['Day', 'Pair', 'Subject', 'Teacher', 'Room', 'Week', 'Type'].forEach((cell, i) => setText(row, cell, values[i]))
    add(table, row)
  }
  fillAll(table)
  add(main, header, segmented(['Занятия', 'Изменения', 'Преподаватели', 'Предметы', 'Аудитории', 'Группы'], 0), toolbar, table,
    await txt('19 занятий у группы ИС-21 · изменения сохраняются в базе SQLite', 'Small', 'text-3'))
  for (const n of [header, toolbar, table]) fillW(n)
}

async function lessonForm(screen) {
  const overlay = box('V', { name: 'Overlay', align: 'CENTER', justify: 'CENTER' })
  overlay.fills = [{ type: 'SOLID', color: hex('#0E0E10'), opacity: 0.4 }]
  add(screen, overlay)
  overlay.layoutPositioning = 'ABSOLUTE'
  overlay.resize(1440, screen.height)
  overlay.x = 0
  overlay.y = 0
  const modal = C.Modal.createInstance().detachInstance()
  modal.name = 'Modal / Lesson Form'
  modal.findOne((n) => n.type === 'TEXT' && n.name === 'Title').characters = 'Изменить занятие'
  const body = modal.findOne((n) => n.name === 'Body')
  for (const child of [...body.children]) child.remove()
  const rows = [
    [['Группа', 'ИС-21'], ['Предмет', 'Базы данных']],
    [['Преподаватель', 'Ветров П. А.', 'Error'], ['Аудитория', '214 · Корпус А']],
    [['День недели', 'Понедельник'], ['Пара', '2 · 10:10 – 11:40']],
    [['Неделя', 'Каждую неделю'], ['Тип занятия', 'Лекция']],
  ]
  for (const row of rows) {
    const r = box('H', { name: 'Row', gap: 16, align: 'MIN' })
    for (const [label, value, state] of row) {
      const f = field('Select', label, value, state || 'Default', state ? 'Преподаватель уже ведёт занятие у группы ИС-22 в это время' : null)
      add(r, f)
      f.layoutGrow = 1
    }
    add(body, r)
    fillW(r)
  }
  const footer = modal.findOne((n) => n.name === 'Footer')
  const remove = button('Ghost', 'Удалить', 'trash-2')
  footer.insertChild(0, remove)
  footer.primaryAxisAlignItems = 'MIN'
  const gap = figma.createFrame()
  gap.name = 'Spacer'
  gap.fills = []
  gap.resize(1, 1)
  footer.insertChild(1, gap)
  gap.layoutGrow = 1
  add(overlay, modal)
  return modal
}

// ---------- Запуск ----------
async function main() {
  const screensPage = figma.root.children.find((p) => p.name === 'Screens')
  await figma.setCurrentPageAsync(screensPage)
  for (const child of [...screensPage.children]) child.remove()
  await loadAll()
  await loadLibrary()

  const result = { desktop: {}, mobile: {} }
  const desktopScreens = [
    ['01 Главная', 'Главная', homeContent],
    ['02 Расписание группы', 'Расписание', scheduleContent],
    ['03 Поиск', 'Поиск', searchContent],
    ['04 Изменения', 'Изменения', changesContent],
    ['05 Администрирование', 'Админ', adminContent],
    ['06 Форма занятия', 'Админ', adminContent],
  ]
  let x = 0
  let maxHeight = 0
  for (const [name, active, build] of desktopScreens) {
    const { screen, main } = desktopShell(name, active)
    await build(main, false)
    if (name === '05 Администрирование') {
      const toast = inst(C.Toast, { Type: 'Success' })
      add(screen, toast)
      toast.layoutPositioning = 'ABSOLUTE'
      toast.x = 1440 - 24 - toast.width
      toast.y = screen.height - 24 - toast.height
    }
    if (name === '06 Форма занятия') await lessonForm(screen)
    result.desktop[name] = screen
    screen.x = x
    screen.y = 0
    x += 1440 + 120
    maxHeight = Math.max(maxHeight, screen.height)
  }
  const mobileScreens = [
    ['M1 Главная', 'Главная', homeContent],
    ['M2 Расписание', 'Расписание', scheduleContent],
    ['M3 Поиск', 'Поиск', searchContent],
    ['M4 Изменения', 'Изменения', changesContent],
  ]
  x = 0
  for (const [name, active, build] of mobileScreens) {
    const { screen, main } = mobileShell(name, active)
    await build(main, true)
    screen.x = x
    screen.y = 0
    x += 390 + 80
    result.mobile[name] = screen
  }

  // Раскладываем экраны по секциям 03 и 04
  const desktopSection = figma.createSection()
  desktopSection.name = '03 / Desktop Screens — 1440'
  for (const screen of Object.values(result.desktop)) desktopSection.appendChild(screen)
  let right = 0
  let bottom = 0
  for (const screen of Object.values(result.desktop)) {
    screen.x += 80
    screen.y += 80
    right = Math.max(right, screen.x + screen.width)
    bottom = Math.max(bottom, screen.y + screen.height)
  }
  desktopSection.resizeWithoutConstraints(right + 80, bottom + 80)
  desktopSection.x = 0
  desktopSection.y = 0

  const mobileSection = figma.createSection()
  mobileSection.name = '04 / Mobile Screens — 390'
  for (const screen of Object.values(result.mobile)) {
    mobileSection.appendChild(screen)
    screen.x += 80
    screen.y = 80
  }
  mobileSection.resizeWithoutConstraints(4 * 470 + 80, 844 + 160)
  mobileSection.x = 0
  mobileSection.y = desktopSection.height + 200

  const ids = (group) => Object.fromEntries(Object.entries(group).map(([k, n]) => [k, n.id]))
  const prototype = await buildPrototype(result.desktop, result.mobile)
  for (const name of ['02 Расписание группы', '06 Форма занятия', '01 Главная']) await result.desktop[name].screenshot({ scale: 0.4 })
  await result.mobile['M2 Расписание'].screenshot({ scale: 0.6 })
  return { desktop: ids(result.desktop), mobile: ids(result.mobile), sections: [desktopSection.id, mobileSection.id], prototype }
}
