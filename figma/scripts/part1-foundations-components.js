// =====================================================================
//  Часть 1: страницы файла, обложка, Foundations и библиотека компонентов.
// =====================================================================

// На бесплатном плане Figma (Starter) можно только 3 страницы,
// поэтому разделы 00–05 — это Sections внутри страниц.
const PAGE_NAMES = ['Design System', 'Screens', 'Prototype']

function getPages() {
  return PAGE_NAMES.map((name, i) => {
    let page = figma.root.children.find((p) => p.name === name)
    if (!page && figma.root.children[i]) { page = figma.root.children[i]; page.name = name }
    if (!page) { page = figma.createPage(); page.name = name }
    return page
  })
}

// ---------------- Компоненты ----------------

async function section(board, title, note) {
  const s = box('V', { name: 'Section / ' + title, gap: 16 })
  add(s, await txt(title, 'H2', 'text'))
  if (note) add(s, await txt(note, 'Small', 'text-2', { w: 720 }))
  add(board, s)
  return s
}

async function buildButtons(parent) {
  const looks = {
    Primary: { Default: ['text', 'bg'], Hover: ['accent', 'text-inverse'], Pressed: ['accent-hover', 'text-inverse'], Disabled: ['text', 'bg'] },
    Secondary: { Default: ['surface', 'text', 'border'], Hover: ['surface-2', 'text', 'border-strong'], Pressed: ['surface-2', 'text', 'border-strong'], Disabled: ['surface', 'text', 'border'] },
    Ghost: { Default: [null, 'text-2'], Hover: ['surface-2', 'text'], Pressed: ['border', 'text'], Disabled: [null, 'text-2'] },
    Danger: { Default: ['cancelled', 'text-inverse'], Hover: ['cancelled', 'text-inverse'], Pressed: ['cancelled', 'text-inverse'], Disabled: ['cancelled', 'text-inverse'] },
  }
  const comps = []
  for (const [kind, states] of Object.entries(looks)) {
    for (const [state, [bg, fg, border]] of Object.entries(states)) {
      const b = box('H', { component: true, name: `Variant=${kind}, State=${state}`, gap: 8, p: [0, 16], r: 'md', align: 'CENTER', fill: bg })
      b.resize(b.width, 40)
      b.layoutSizingVertical = 'FIXED'
      b.counterAxisAlignItems = 'CENTER'
      if (border) setStroke(b, border)
      if (kind === 'Secondary' && state !== 'Disabled') await shadow(b, 'sm')
      add(b, icon('plus', 17, fg), await txt('Кнопка', 'Label', fg, { name: 'Label' }))
      if (state === 'Disabled') b.opacity = 0.45
      if (kind === 'Danger' && state === 'Hover') b.opacity = 0.9
      comps.push(b)
    }
  }
  const set = combine(comps, 'Button', parent, 4)
  const labelKey = set.addComponentProperty('Label', 'TEXT', 'Кнопка')
  const iconKey = set.addComponentProperty('Show icon', 'BOOLEAN', true)
  for (const c of set.children) {
    c.findOne((n) => n.name === 'Label').componentPropertyReferences = { characters: labelKey }
    c.findOne((n) => n.name.startsWith('icon/')).componentPropertyReferences = { visible: iconKey }
  }
  set.description = 'Кнопка. React: components/ui/Button.jsx — props variant, size, icon, disabled.'
  C.Button = set
}

async function buildIconButton(parent) {
  const comps = []
  for (const [state, bg, border] of [['Default', 'surface', 'border'], ['Hover', 'surface-2', 'border-strong'], ['Disabled', 'surface', 'border']]) {
    const b = box('H', { component: true, name: `State=${state}`, w: 36, h: 36, r: 'md', fill: bg, stroke: border, align: 'CENTER', justify: 'CENTER' })
    add(b, icon('chevron-left', 17, state === 'Hover' ? 'text' : 'text-2'))
    if (state === 'Disabled') b.opacity = 0.45
    comps.push(b)
  }
  C.IconButton = combine(comps, 'Icon Button', parent, 3)
  C.IconButton.description = 'Квадратная кнопка с иконкой: стрелки недель, тема, действия в таблице.'
}

async function buildField(parent, kind) {
  const states = ['Default', 'Hover', 'Focus', 'Error', 'Disabled']
  const comps = []
  for (const state of states) {
    const f = box('V', { component: true, name: `State=${state}`, gap: 6, w: kind === 'Input' ? 320 : 240 })
    const control = box('H', { name: 'Control', gap: 8, p: [0, 12], r: 'md', align: 'CENTER', fill: state === 'Disabled' ? 'surface-2' : 'surface' })
    control.resize(100, 42)
    const border = { Default: 'border', Hover: 'border-strong', Focus: 'accent', Error: 'cancelled', Disabled: 'border' }[state]
    setStroke(control, border)
    if (state === 'Focus') {
      control.effects = [{ type: 'DROP_SHADOW', color: { r: 0.18, g: 0.36, b: 1, a: 0.22 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL' }]
    }
    if (kind === 'Input') add(control, icon('search', 17, 'text-3'))
    const value = await txt(kind === 'Input' ? 'Найти группу' : 'ИС-21', 'Body', kind === 'Input' ? 'text-3' : 'text', { name: 'Value' })
    add(control, value)
    fillW(value)
    if (kind === 'Select') add(control, icon('chevron-down', 17, 'text-3'))
    add(f, await txt(kind === 'Input' ? 'Поиск' : 'Группа', 'Caption', 'text-2', { name: 'Label' }), control)
    fillW(control)
    control.layoutSizingVertical = 'FIXED'
    if (state === 'Error') add(f, await txt('Преподаватель уже занят в это время', 'Small', 'cancelled', { name: 'Error' }))
    if (state === 'Disabled') f.opacity = 0.6
    comps.push(f)
  }
  const set = combine(comps, kind, parent, comps.length)
  const labelKey = set.addComponentProperty('Label', 'TEXT', kind === 'Input' ? 'Поиск' : 'Группа')
  const valueKey = set.addComponentProperty('Value', 'TEXT', kind === 'Input' ? 'Найти группу' : 'ИС-21')
  const showLabel = set.addComponentProperty('Show label', 'BOOLEAN', true)
  for (const c of set.children) {
    const label = c.findOne((n) => n.name === 'Label')
    label.componentPropertyReferences = { characters: labelKey, visible: showLabel }
    c.findOne((n) => n.name === 'Value').componentPropertyReferences = { characters: valueKey }
  }
  set.description = kind === 'Input' ? 'Текстовое поле. React: components/ui/Field.jsx → Input' : 'Выпадающий список. React: components/ui/Field.jsx → Select'
  C[kind] = set
}

async function buildBadges(parent) {
  const comps = []
  for (const [status, [bg, fg, iconName]] of Object.entries(BADGES)) {
    const b = box('H', { component: true, name: `Status=${status}`, gap: 5, p: [0, 9], r: 'full', align: 'CENTER', fill: bg })
    b.resize(b.width, 24)
    b.layoutSizingVertical = 'FIXED'
    if (iconName) add(b, icon(iconName, 13, fg))
    add(b, await txt(BADGE_TEXT[status], 'Caption', fg, { name: 'Label' }))
    comps.push(b)
  }
  const set = combine(comps, 'Lesson Status', parent, 6)
  const key = set.addComponentProperty('Label', 'TEXT', 'Статус')
  for (const c of set.children) c.findOne((n) => n.name === 'Label').componentPropertyReferences = { characters: key }
  set.description = 'Метка статуса занятия. React: components/ui/Badge.jsx — prop tone.'
  C.Badge = set
}

async function buildSegment(parent) {
  const comps = []
  for (const active of ['true', 'false']) {
    const s = box('H', { component: true, name: `Active=${active}`, p: [0, 12], r: 7, align: 'CENTER', fill: active === 'true' ? 'surface' : null })
    s.resize(s.width, 32)
    s.layoutSizingVertical = 'FIXED'
    if (active === 'true') await shadow(s, 'sm')
    add(s, await txt('День', 'Small Medium', active === 'true' ? 'text' : 'text-2', { name: 'Label' }))
    comps.push(s)
  }
  const set = combine(comps, 'Segment', parent, 2)
  const key = set.addComponentProperty('Label', 'TEXT', 'День')
  for (const c of set.children) c.findOne((n) => n.name === 'Label').componentPropertyReferences = { characters: key }
  set.description = 'Элемент переключателя. Группа сегментов = components/ui/Segmented.jsx'
  C.Segment = set
}

async function buildNavItem(parent) {
  const comps = []
  for (const [state, bg, fg, iconColor] of [['Default', null, 'text-2', 'text-2'], ['Hover', 'surface-2', 'text', 'text'], ['Active', 'surface', 'text', 'accent']]) {
    const n = box('H', { component: true, name: `State=${state}`, gap: 12, p: [0, 12], r: 'md', align: 'CENTER', fill: bg, w: 216, h: 38 })
    if (state === 'Active') { setStroke(n, 'border'); await shadow(n, 'sm') }
    add(n, icon('house', 18, iconColor), await txt('Главная', 'Label', fg, { name: 'Label' }))
    comps.push(n)
  }
  const set = combine(comps, 'Nav Item', parent, 3)
  const key = set.addComponentProperty('Label', 'TEXT', 'Главная')
  for (const c of set.children) c.findOne((n) => n.name === 'Label').componentPropertyReferences = { characters: key }
  set.description = 'Пункт бокового меню. React: components/layout/Sidebar.jsx'
  C.NavItem = set
}

async function nowWidget(label, time, progress) {
  const w = box('V', { name: 'Now Widget', gap: 6, p: [12, 16, 16, 16], r: 'lg', fill: 'surface', stroke: 'border' })
  await shadow(w, 'sm')
  const row = box('H', { name: 'Status', gap: 8, align: 'CENTER' })
  const dot = figma.createEllipse()
  dot.resize(7, 7)
  setFill(dot, 'now')
  add(row, dot, await txt(label, 'Small Medium', 'text', { name: 'Label' }))
  const track = box('H', { name: 'Track', fill: 'surface-2', r: 'full', h: 4, w: 184 })
  const bar = figma.createRectangle()
  bar.name = 'Progress'
  bar.resize(Math.max(4, 184 * progress), 4)
  setFill(bar, 'accent')
  bar.cornerRadius = 999
  add(track, bar)
  add(w, row, await txt(time, 'Mono', 'text-3', { name: 'Time' }), track)
  fillW(track)
  return w
}

async function buildSidebar(parent) {
  const comps = []
  for (const active of ['Главная', 'Расписание', 'Поиск', 'Изменения', 'Админ']) {
    const s = box('V', { component: true, name: `Active=${active}`, gap: 2, p: [24, 16], fill: 'bg', w: 248, h: 1024 })
    s.strokes = [solid('border')]
    s.strokeAlign = 'INSIDE'
    s.strokeTopWeight = 0; s.strokeBottomWeight = 0; s.strokeLeftWeight = 0; s.strokeRightWeight = 1
    const top = box('H', { name: 'Top', p: [0, 8, 32, 8], align: 'CENTER', justify: 'SPACE_BETWEEN' })
    add(top, await logo(), iconButton('moon'))
    add(s, top)
    fillW(top)
    add(s, await txt('Меню', 'Overline', 'text-3', { name: 'Section', upper: true }))
    for (const [label, iconName] of NAV) {
      const item = inst(C.NavItem, { State: label === active ? 'Active' : 'Default' })
      setText(item, 'Label', label)
      item.name = 'Nav Item / ' + label
      swapIcon(item, iconName, label === active ? 'accent' : 'text-2')
      add(s, item)
    }
    const second = await txt('Учебная часть', 'Overline', 'text-3', { name: 'Section', upper: true })
    add(s, second)
    const admin = inst(C.NavItem, { State: active === 'Админ' ? 'Active' : 'Default' })
    setText(admin, 'Label', 'Администрирование')
    admin.name = 'Nav Item / Администрирование'
    swapIcon(admin, 'shield-check', active === 'Админ' ? 'accent' : 'text-2')
    add(s, admin)
    for (const label of s.findAll((n) => n.name === 'Section')) {
      const wrap = box('H', { name: 'Section', p: [16, 12, 8, 12] })
      s.insertChild(s.children.indexOf(label), wrap)
      wrap.appendChild(label)
    }
    spacer(s)
    const now = await nowWidget('Идёт 3 пара', '12:20 – 13:50', 0.45)
    add(s, now)
    fillW(now)
    const foot = box('H', { name: 'Footnote', p: [12, 8, 0, 8] })
    add(foot, await txt('Колледж «Северный» · 2026/27', 'Caption', 'text-3'))
    add(s, foot)
    comps.push(s)
  }
  C.Sidebar = combine(comps, 'Sidebar', parent, 5)
  C.Sidebar.description = 'Боковое меню (≥768px). React: components/layout/Sidebar.jsx'
}

async function buildMobileBars(parent) {
  const top = box('H', { component: true, name: 'Mobile Top Bar', p: [0, 16], align: 'CENTER', justify: 'SPACE_BETWEEN', fill: 'bg', w: 390, h: 60 })
  top.strokes = [solid('border')]
  top.strokeTopWeight = 0; top.strokeLeftWeight = 0; top.strokeRightWeight = 0; top.strokeBottomWeight = 1
  const actions = box('H', { name: 'Actions', gap: 8 })
  add(actions, iconButton('shield-check'), iconButton('moon'))
  add(top, await logo(22), actions)
  add(parent, top)
  C.TopBar = top

  const comps = []
  for (const [active] of NAV) {
    const bar = box('H', { component: true, name: `Active=${active}`, p: [6, 8, 22, 8], fill: 'surface', w: 390 })
    bar.strokes = [solid('border')]
    bar.strokeTopWeight = 1; bar.strokeLeftWeight = 0; bar.strokeRightWeight = 0; bar.strokeBottomWeight = 0
    for (const [label, iconName] of NAV) {
      const isActive = label === active
      const tab = box('V', { name: 'Tab / ' + label, gap: 3, p: [6, 0], align: 'CENTER' })
      add(tab, icon(iconName, 21, isActive ? 'accent' : 'text-3'), await txt(label, 'Caption', isActive ? 'text' : 'text-3', { name: 'Label' }))
      add(bar, tab)
      tab.layoutGrow = 1
    }
    comps.push(bar)
  }
  C.TabBar = combine(comps, 'Mobile Tab Bar', parent, 2)
  C.TabBar.description = 'Нижняя навигация (<768px). React: components/layout/MobileNav.jsx'
}

async function buildDayTab(parent) {
  const comps = []
  for (const state of ['Default', 'Hover', 'Active']) {
    const active = state === 'Active'
    const d = box('V', { component: true, name: `State=${state}`, gap: 2, p: [10, 12], r: 'lg', align: 'CENTER', w: 140, fill: active ? 'text' : state === 'Hover' ? 'surface-2' : 'surface' })
    if (!active) setStroke(d, state === 'Hover' ? 'border-strong' : 'border')
    const top = box('H', { name: 'Top', gap: 6, align: 'CENTER' })
    const dot = figma.createEllipse()
    dot.name = 'Today'
    dot.resize(6, 6)
    setFill(dot, 'accent')
    add(top, await txt('Пн', 'Caption', active ? 'bg' : 'text-3', { name: 'Day' }), dot)
    add(d, top, await txt('12', 'H2', active ? 'bg' : 'text', { name: 'Date' }), await txt('4 пары', 'Caption', active ? 'bg' : 'text-3', { name: 'Count' }))
    if (active) d.findOne((n) => n.name === 'Count').opacity = 0.7
    comps.push(d)
  }
  const set = combine(comps, 'Day Tab', parent, 3)
  const today = set.addComponentProperty('Today', 'BOOLEAN', false)
  for (const c of set.children) c.findOne((n) => n.name === 'Today').componentPropertyReferences = { visible: today }
  set.description = 'Вкладка дня недели. React: components/schedule/DayTabs.jsx'
  C.DayTab = set
}

async function metaItem(iconName, text, name, color = 'text-2', strike = false) {
  const m = box('H', { name, gap: 6, align: 'CENTER' })
  add(m, icon(iconName, 15, 'text-3'), await txt(text, 'Small', color, { name: name, strike }))
  return m
}

async function buildLessonCard(parent) {
  const comps = []
  for (const status of ['Default', 'Now', 'Replacement', 'Room', 'Cancelled']) {
    const cancelled = status === 'Cancelled'
    const card = box('H', { component: true, name: `Status=${status}`, r: 'lg', fill: cancelled ? 'surface-2' : 'surface', stroke: status === 'Now' ? 'accent' : 'border', w: 720, clip: true })
    await shadow(card, status === 'Now' ? 'md' : 'sm')
    if (status === 'Now') {
      const bar = figma.createRectangle()
      bar.name = 'Accent'
      bar.resize(4, 10)
      setFill(bar, 'accent')
      add(card, bar)
      fillH(bar)
    }
    const time = box('V', { name: 'Time', gap: 2, p: [18, 0, 18, 20], w: 96 })
    add(time, await txt('2 пара', 'Caption', 'text-3', { name: 'Pair' }), await txt('10:10', 'Mono Large', cancelled ? 'text-3' : 'text', { name: 'Start' }), await txt('11:40', 'Mono', 'text-3', { name: 'End' }))
    const divider = figma.createRectangle()
    divider.name = 'Divider'
    divider.resize(1, 10)
    setFill(divider, 'border')
    const body = box('V', { name: 'Body', gap: 10, p: [18, 20] })
    const head = box('H', { name: 'Head', gap: 12, align: 'CENTER' })
    const subject = await txt('Базы данных', 'H3', cancelled ? 'text-3' : 'text', { name: 'Subject', strike: cancelled })
    add(head, subject)
    fillW(subject)
    if (status !== 'Default') {
      const badge = inst(C.Badge, { Status: status })
      setText(badge, 'Label', BADGE_TEXT[status])
      badge.name = 'Status'
      add(head, badge)
    }
    const meta = box('H', { name: 'Meta', gap: 16, align: 'CENTER', wrap: true })
    const teacher = await metaItem('user', 'Морозова А. С.', 'Teacher', status === 'Replacement' || cancelled ? 'text-3' : 'text-2', status === 'Replacement' || cancelled)
    if (status === 'Replacement') add(teacher, icon('arrow-right', 14, 'replacement'), await txt('Климова Д. О.', 'Small Medium', 'replacement', { name: 'New Teacher' }))
    const room = await metaItem('map-pin', 'ауд. 214 · Корпус А', 'Room', status === 'Room' || cancelled ? 'text-3' : 'text-2', status === 'Room' || cancelled)
    if (status === 'Room') add(room, icon('arrow-right', 14, 'room'), await txt('ауд. 305', 'Small Medium', 'room', { name: 'New Room' }))
    const type = inst(C.Badge, { Status: 'Neutral' })
    setText(type, 'Label', 'Лекция')
    type.name = 'Type'
    add(meta, teacher, room, type)
    add(body, head, meta)
    fillW(head)
    fillW(meta)
    if (['Replacement', 'Room', 'Cancelled'].includes(status)) {
      const comment = { Replacement: 'Преподаватель на курсах повышения квалификации', Room: 'В аудитории ремонт проектора', Cancelled: 'Перенос по приказу учебной части' }[status]
      add(body, await txt(comment, 'Small', 'text-3', { name: 'Comment' }))
    }
    if (status === 'Now') {
      const track = box('H', { name: 'Progress', fill: 'surface-2', r: 'full', h: 4 })
      const fill = figma.createRectangle()
      fill.resize(260, 4)
      fill.cornerRadius = 999
      setFill(fill, 'accent')
      add(track, fill)
      add(body, track)
      fillW(track)
    }
    add(card, time, divider, body)
    fillH(divider)
    body.layoutGrow = 1
    comps.push(card)
  }
  C.LessonCard = combine(comps, 'Lesson Card', parent, 1)
  C.LessonCard.description = 'Карточка занятия. React: components/schedule/LessonCard.jsx. Статус берётся из change.change_type.'
}

async function buildChangeRow(parent) {
  const comps = []
  for (const type of ['Replacement', 'Room', 'Cancelled']) {
    const row = box('H', { component: true, name: `Type=${type}`, gap: 16, p: 16, r: 'lg', fill: 'surface', stroke: 'border', w: 720 })
    const time = box('V', { name: 'Time', gap: 2, w: 64 })
    add(time, await txt('3 пара', 'Caption', 'text-3', { name: 'Pair' }), await txt('12:20', 'Mono Large', 'text', { name: 'Start' }))
    const body = box('V', { name: 'Body', gap: 6 })
    const head = box('H', { name: 'Head', gap: 8, align: 'CENTER', wrap: true })
    const group = inst(C.Badge, { Status: 'Neutral' })
    setText(group, 'Label', 'ИС-21')
    group.name = 'Group'
    add(head, group, await txt('Веб-программирование', 'H3', 'text', { name: 'Subject' }))
    const details = box('H', { name: 'Details', gap: 6, align: 'CENTER' })
    const color = type === 'Replacement' ? 'replacement' : type === 'Room' ? 'room' : 'cancelled'
    if (type === 'Cancelled') {
      add(details, await txt('Ветров П. А. · ауд. 201', 'Small', 'text-3', { name: 'Old' }))
    } else {
      add(details,
        await txt(type === 'Replacement' ? 'Ветров П. А.' : 'ауд. 201', 'Small', 'text-3', { name: 'Old', strike: true }),
        icon('arrow-right', 14, color),
        await txt(type === 'Replacement' ? 'Рябова Е. И.' : 'ауд. Лаб-3', 'Small Medium', color, { name: 'New' }))
    }
    add(body, head, details, await txt('Преподаватель на курсах повышения квалификации', 'Small', 'text-3', { name: 'Comment' }))
    fillW(head)
    const badge = inst(C.Badge, { Status: type })
    setText(badge, 'Label', BADGE_TEXT[type])
    badge.name = 'Status'
    add(row, time, body, badge)
    body.layoutGrow = 1
    comps.push(row)
  }
  C.ChangeRow = combine(comps, 'Change Row', parent, 1)
  C.ChangeRow.description = 'Строка изменения на странице «Изменения». React: components/schedule/ChangeRow.jsx'
}

async function buildGroupCard(parent) {
  const comps = []
  for (const state of ['Default', 'Hover']) {
    const card = box('V', { component: true, name: `State=${state}`, gap: 16, p: 20, r: 'lg', fill: 'surface', stroke: state === 'Hover' ? 'border-strong' : 'border', w: 360 })
    await shadow(card, state === 'Hover' ? 'md' : 'sm')
    const top = box('H', { name: 'Top', align: 'CENTER', justify: 'SPACE_BETWEEN' })
    add(top, await txt('ИС-21', 'H2', 'text', { name: 'Name' }), icon('arrow-right', 18, state === 'Hover' ? 'accent' : 'text-3'))
    const specialty = await txt('Информационные системы и программирование', 'Small', 'text-2', { name: 'Specialty' })
    const bottom = box('H', { name: 'Bottom', gap: 8, align: 'CENTER' })
    const course = inst(C.Badge, { Status: 'Neutral' })
    setText(course, 'Label', '2 курс')
    course.name = 'Course'
    add(bottom, course)
    add(card, top, specialty, bottom)
    fillW(top)
    fillW(specialty)
    comps.push(card)
  }
  C.GroupCard = combine(comps, 'Group Card', parent, 2)
  C.GroupCard.description = 'Карточка группы на главной. React: components/schedule/GroupCard.jsx'
}

async function buildTeacherRow(parent) {
  const row = box('H', { component: true, name: 'Teacher Row', gap: 14, p: [14, 16], r: 'lg', fill: 'surface', stroke: 'border', align: 'CENTER', w: 720 })
  const avatar = box('H', { name: 'Avatar', w: 40, h: 40, r: 'full', fill: 'accent-soft', align: 'CENTER', justify: 'CENTER' })
  add(avatar, await txt('ВП', 'Small Medium', 'accent-text', { name: 'Initials' }))
  const info = box('V', { name: 'Info', gap: 2 })
  add(info, await txt('Ветров Павел Андреевич', 'H3', 'text', { name: 'Name' }), await txt('Информационные технологии', 'Small', 'text-2', { name: 'Department' }))
  const link = box('H', { name: 'Link', gap: 6, align: 'CENTER' })
  add(link, await txt('Расписание', 'Small Medium', 'accent-text', { name: 'Link Label' }), icon('arrow-right', 15, 'accent-text'))
  add(row, avatar, info, link)
  info.layoutGrow = 1
  for (const t of info.children) fillW(t)
  add(parent, row)
  C.TeacherRow = row
  row.description = 'Строка результата поиска (преподаватель или группа). React: pages/SearchPage.jsx'
}

async function buildWeekSwitcher(parent) {
  const w = box('H', { component: true, name: 'Week Switcher', gap: 4, p: 3, r: 'md', fill: 'surface', stroke: 'border', align: 'CENTER' })
  const label = box('V', { name: 'Label', p: [0, 10], align: 'CENTER' })
  add(label, await txt('12 – 17 октября', 'Small Medium', 'text', { name: 'Range' }), await txt('Нечётная неделя', 'Caption', 'text-3', { name: 'Week' }))
  const left = iconButton('chevron-left')
  const right = iconButton('chevron-right')
  for (const b of [left, right]) { b.strokes = []; b.fills = [] }
  add(w, left, label, right)
  add(parent, w)
  C.WeekSwitcher = w
  w.description = 'Переключатель недель. React: components/schedule/WeekSwitcher.jsx'
}

async function buildTableRow(parent) {
  const comps = []
  for (const kind of ['Header', 'Row']) {
    const header = kind === 'Header'
    const row = box('H', { component: true, name: `Kind=${kind}`, gap: 16, p: [0, 16], align: 'CENTER', fill: header ? 'surface-2' : 'surface', w: 1112, h: header ? 40 : 56 })
    row.strokes = [solid('border')]
    row.strokeTopWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; row.strokeBottomWeight = 1
    const cells = header
      ? [['Day', 'День', 100], ['Pair', 'Пара', 64], ['Subject', 'Предмет', 0], ['Teacher', 'Преподаватель', 200], ['Room', 'Аудитория', 96], ['Week', 'Неделя', 120], ['Type', 'Тип', 104]]
      : [['Day', 'Понедельник', 100], ['Pair', '2 · 10:10', 64], ['Subject', 'Базы данных', 0], ['Teacher', 'Морозова А. С.', 200], ['Room', '214', 96], ['Week', 'Каждую', 120], ['Type', 'Лекция', 104]]
    for (const [name, value, width] of cells) {
      const style = header ? 'Overline' : name === 'Subject' ? 'Small Medium' : name === 'Pair' ? 'Mono' : 'Small'
      const t = await txt(value, style, header ? 'text-3' : name === 'Subject' ? 'text' : 'text-2', { name, upper: header })
      add(row, t)
      if (width) { t.resize(width, t.height); t.textAutoResize = 'HEIGHT' } else { fillW(t) }
    }
    const actions = box('H', { name: 'Actions', gap: 4, w: 72, justify: 'MAX' })
    if (!header) {
      for (const name of ['pencil', 'trash-2']) {
        const b = iconButton(name)
        b.resize(32, 32)
        add(actions, b)
      }
    }
    add(row, actions)
    comps.push(row)
  }
  C.TableRow = combine(comps, 'Table Row', parent, 1)
  C.TableRow.description = 'Строка таблицы в админ-панели. React: pages/admin/LessonsPanel.jsx'
}

async function buildFeedback(parent) {
  // Modal
  const modal = box('V', { component: true, name: 'Modal', r: 'xl', fill: 'surface', stroke: 'border', w: 560, clip: true })
  await shadow(modal, 'lg')
  const header = box('H', { name: 'Header', p: [20, 24], align: 'CENTER', justify: 'SPACE_BETWEEN' })
  const close = iconButton('x')
  close.strokes = []
  close.fills = []
  add(header, await txt('Заголовок окна', 'H3', 'text', { name: 'Title' }), close)
  const body = box('V', { name: 'Body', gap: 16, p: 24 })
  add(body, await txt('Содержимое окна: форма, подтверждение удаления или подробности.', 'Body', 'text-2', { name: 'Content' }))
  const footer = box('H', { name: 'Footer', gap: 8, p: [16, 24], fill: 'surface-2', justify: 'MAX' })
  const cancel = inst(C.Button, { Variant: 'Ghost', State: 'Default' })
  setText(cancel, 'Label', 'Отмена')
  cancel.name = 'Button / Отмена'
  hideIcon(cancel)
  const ok = inst(C.Button, { Variant: 'Primary', State: 'Default' })
  setText(ok, 'Label', 'Сохранить')
  ok.name = 'Button / Сохранить'
  hideIcon(ok)
  add(footer, cancel, ok)
  add(modal, header, line(), body, line(), footer)
  for (const n of [header, body, footer]) fillW(n)
  for (const n of modal.findAll((x) => x.name === 'Line')) fillW(n)
  add(parent, modal)
  C.Modal = modal
  modal.description = 'Модальное окно. React: components/ui/Modal.jsx'

  // Toast
  const toasts = []
  for (const [type, iconName, color, text] of [['Success', 'circle-check', 'now', 'Занятие сохранено'], ['Error', 'circle-alert', 'cancelled', 'Аудитория занята в это время']]) {
    const t = box('H', { component: true, name: `Type=${type}`, gap: 12, p: [12, 16], r: 'md', fill: 'text', align: 'CENTER', w: 320 })
    await shadow(t, 'lg')
    add(t, icon(iconName, 18, color), await txt(text, 'Small Medium', 'bg', { name: 'Message' }))
    toasts.push(t)
  }
  C.Toast = combine(toasts, 'Notification', parent, 2)
  C.Toast.description = 'Всплывающее уведомление. React: components/ui/Toast.jsx'

  // Empty state
  const empty = box('V', { component: true, name: 'Empty State', gap: 8, p: [56, 24], r: 'lg', align: 'CENTER', w: 720 })
  setStroke(empty, 'border-strong')
  empty.dashPattern = [5, 4]
  const holder = box('H', { name: 'Icon', w: 48, h: 48, r: 'lg', fill: 'surface', stroke: 'border', align: 'CENTER', justify: 'CENTER' })
  await shadow(holder, 'sm')
  add(holder, icon('coffee', 22, 'text-2'))
  const text = await txt('В этот день занятий нет. Можно выдохнуть или посмотреть другой день.', 'Small', 'text-2', { name: 'Text', align: 'CENTER', w: 340 })
  add(empty, holder, await txt('Свободный день', 'H3', 'text', { name: 'Title' }), text)
  add(parent, empty)
  C.Empty = empty
  empty.description = 'Пустое состояние. React: components/ui/EmptyState.jsx'
}

async function buildBanner(parent) {
  const banner = box('H', { component: true, name: 'Changes Banner', gap: 16, p: [16, 20], r: 'lg', fill: 'surface', stroke: 'border', align: 'CENTER', w: 720 })
  await shadow(banner, 'sm')
  const square = box('H', { name: 'Icon', w: 40, h: 40, r: 'md', fill: 'accent-soft', align: 'CENTER', justify: 'CENTER' })
  add(square, icon('refresh-ccw', 19, 'accent'))
  const text = box('V', { name: 'Text', gap: 2 })
  add(text, await txt('Сегодня 4 изменения в расписании', 'Body Medium', 'text', { name: 'Title' }), await txt('2 замены · 1 другая аудитория · 1 отмена', 'Small', 'text-2', { name: 'Details' }))
  const link = box('H', { name: 'Link', gap: 6, align: 'CENTER' })
  add(link, await txt('Смотреть', 'Small Medium', 'accent-text', { name: 'Link Label' }), icon('arrow-right', 15, 'accent-text'))
  add(banner, square, text, link)
  text.layoutGrow = 1
  for (const t of text.children) fillW(t)
  add(parent, banner)
  C.Banner = banner
  banner.description = 'Плашка «изменения сегодня» на главной. React: pages/HomePage.jsx'

  const comps = []
  for (const [type, color] of [['Replacement', 'replacement'], ['Room', 'room'], ['Cancelled', 'cancelled']]) {
    const card = box('V', { component: true, name: `Type=${type}`, gap: 4, p: [16, 20], r: 'lg', fill: 'surface', stroke: 'border', w: 260 })
    const top = box('H', { name: 'Top', gap: 8, align: 'CENTER' })
    const dot = figma.createEllipse()
    dot.resize(8, 8)
    setFill(dot, color)
    add(top, dot, await txt(BADGE_TEXT[type], 'Small', 'text-2', { name: 'Label' }))
    add(card, top, await txt('4', 'H1', 'text', { name: 'Value' }))
    comps.push(card)
  }
  C.Stat = combine(comps, 'Stat Card', parent, 3)
  C.Stat.description = 'Счётчик изменений. React: pages/ChangesPage.jsx'
}

// ---------------- Foundations ----------------
async function buildFoundations(page) {
  const root = box('V', { name: 'Foundations', gap: 56, p: 64, fill: 'bg', w: 1440 })
  add(root, await txt('Foundations', 'Display', 'text'),
    await txt('Токены SLOT. живут в переменных (коллекция «SLOT Tokens»: цвета, отступы, скругления). Во frontend те же значения лежат в src/styles/tokens.css — там же тёмная тема.', 'Body', 'text-2', { w: 720 }))

  const groups = [
    ['Поверхности', ['bg', 'surface', 'surface-2', 'border', 'border-strong']],
    ['Текст', ['text', 'text-2', 'text-3']],
    ['Акцент', ['accent', 'accent-hover', 'accent-soft', 'accent-text']],
    ['Статусы занятий', ['now', 'now-soft', 'replacement', 'replacement-soft', 'room', 'room-soft', 'cancelled', 'cancelled-soft']],
  ]
  const colors = box('V', { name: 'Colors', gap: 24 })
  add(colors, await txt('Цвета', 'H1', 'text'))
  const themes = box('H', { name: 'Themes', gap: 24 })
  for (const mode of ['Light', 'Dark']) {
    const dark = mode === 'Dark'
    // Светлая палитра привязана к переменным, тёмная — статичные образцы
    const paint = (key) => (dark ? [{ type: 'SOLID', color: hex(DARK[key]) }] : [solid(key)])
    const panel = box('V', { name: 'Palette / ' + mode, gap: 20, p: 24, r: 'xl', w: 644 })
    panel.fills = paint('bg')
    panel.strokes = paint('border')
    const title = await txt(dark ? 'Тёмная тема · data-theme="dark"' : 'Светлая тема · переменные SLOT Tokens', 'H3', 'text')
    title.fills = paint('text')
    add(panel, title)
    for (const [groupTitle, keys] of groups) {
      const label = await txt(groupTitle, 'Overline', 'text-3', { upper: true })
      label.fills = paint('text-3')
      add(panel, label)
      const row = box('H', { name: groupTitle, gap: 12, wrap: true })
      for (const key of keys) {
        const sw = box('V', { name: 'color/' + key, gap: 6, w: 109 })
        const chip = figma.createRectangle()
        chip.resize(109, 64)
        setRadius(chip, 'md')
        chip.fills = paint(key)
        chip.strokes = paint('border')
        const name = await txt(key, 'Caption', 'text')
        name.fills = paint('text')
        const value = await txt((dark ? DARK : LIGHT)[key], 'Mono', 'text-3')
        value.fills = paint('text-3')
        add(sw, chip, name, value)
        add(row, sw)
      }
      add(panel, row)
      fillW(row)
    }
    add(themes, panel)
  }
  add(colors, themes)

  const type = box('V', { name: 'Typography', gap: 4 })
  add(type, await txt('Типографика', 'H1', 'text'), await txt(`Основной шрифт — ${F.regular.family}, цифры и время — ${F.mono.family}.`, 'Body', 'text-2'))
  for (const [name, weight, size, lineH, tracking] of TYPE) {
    const row = box('H', { name: 'Type / ' + name, gap: 24, p: [16, 0], align: 'CENTER', w: 1312 })
    row.strokes = [solid('border')]
    row.strokeTopWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; row.strokeBottomWeight = 1
    const label = await txt(name, 'Caption', 'text-3', { w: 140 })
    const sample = await txt(name === 'Display' ? 'Расписание за секунды' : name.startsWith('Mono') ? '08:30 – 10:00 · ауд. 214' : 'Пара по базам данных перенесена', name, 'text')
    const spec = await txt(`${F[weight].family} ${F[weight].style} · ${size}/${lineH} · ${tracking}%`, 'Mono', 'text-3', { w: 320 })
    add(row, label, sample, spec)
    fillW(sample)
    add(type, row)
  }

  const scale = box('H', { name: 'Scales', gap: 48 })
  const spacing = box('V', { name: 'Spacing', gap: 10 })
  add(spacing, await txt('Отступы · сетка 4px', 'H2', 'text'))
  for (const [key, px] of Object.entries(SPACE)) {
    const r = box('H', { name: 'space/' + key, gap: 12, align: 'CENTER' })
    const bar = figma.createRectangle()
    bar.resize(px * 2, 12)
    bar.cornerRadius = 3
    setFill(bar, 'accent')
    add(r, await txt('space/' + key, 'Mono', 'text-2', { w: 80 }), bar, await txt(px + 'px', 'Mono', 'text-3'))
    add(spacing, r)
  }
  const radii = box('V', { name: 'Radius', gap: 16 })
  add(radii, await txt('Скругления', 'H2', 'text'))
  const radiiRow = box('H', { gap: 16 })
  for (const key of Object.keys(RADIUS)) {
    const item = box('V', { gap: 8, align: 'CENTER' })
    const sq = figma.createRectangle()
    sq.resize(72, 72)
    setRadius(sq, key)
    setFill(sq, 'surface')
    setStroke(sq, 'border-strong')
    add(item, sq, await txt(`${key} · ${RADIUS[key]}`, 'Mono', 'text-3'))
    add(radiiRow, item)
  }
  add(radii, radiiRow)
  const shadows = box('V', { name: 'Shadows', gap: 16 })
  add(shadows, await txt('Тени', 'H2', 'text'))
  const shadowRow = box('H', { gap: 24, p: [8, 0, 24, 0] })
  for (const key of Object.keys(SHADOWS)) {
    const card = box('V', { w: 140, h: 96, r: 'lg', fill: 'surface', p: 16, justify: 'MAX' })
    await shadow(card, key)
    add(card, await txt('Shadow/' + key, 'Caption', 'text-2'))
    add(shadowRow, card)
  }
  add(shadows, shadowRow)
  add(scale, spacing, radii, shadows)

  const grid = box('V', { name: 'Grid', gap: 16 })
  add(grid, await txt('Сетка', 'H1', 'text'),
    await txt('Desktop 1440: боковое меню 248px + контент 1112px (поля 40px), 12 колонок, gutter 16px. Mobile 390: поля 16px, 4 колонки, gutter 12px. Брейкпоинт: 768px — меню уходит вниз.', 'Body', 'text-2', { w: 900 }))
  const cols = box('H', { name: 'Columns', gap: 16, w: 1112 })
  for (let i = 0; i < 12; i++) {
    const c = figma.createRectangle()
    c.resize(10, 64)
    c.cornerRadius = 4
    setFill(c, 'accent')
    c.opacity = 0.15
    add(cols, c)
    c.layoutGrow = 1
  }
  add(grid, cols)

  const icons = box('V', { name: 'Icons', gap: 16 })
  add(icons, await txt('Иконки · Lucide', 'H1', 'text'), await txt('Те же иконки, что в React (пакет lucide-react). Линия 2px, сетка 24px.', 'Body', 'text-2'))
  const iconRow = box('H', { gap: 12, wrap: true, w: 1312 })
  for (const name of Object.keys(ICONS)) {
    const cell = box('V', { gap: 8, p: 12, r: 'md', fill: 'surface', stroke: 'border', align: 'CENTER', w: 96 })
    add(cell, icon(name, 24, 'text'), await txt(name, 'Caption', 'text-3', { align: 'CENTER' }))
    add(iconRow, cell)
  }
  add(icons, iconRow)

  add(root, colors, type, scale, grid, icons)
  page.appendChild(root)
  root.x = 0
  root.y = 0
  return root
}

async function buildCover(page) {
  const cover = box('V', { name: 'Cover', gap: 24, p: [120, 120], fill: 'text', w: 1600, h: 960, justify: 'MAX' })
  const title = await logo(200)
  title.fills = [solid('bg')]
  title.setRangeFills(4, 5, [solid('accent')])
  add(cover,
    await txt('Индивидуальный проект · Проектирование и дизайн информационных систем', 'Body Medium', 'text-3'),
    title,
    await txt('Платформа расписания колледжа: дизайн-система, компоненты, адаптивные экраны и прототип.', 'H2', 'bg', { w: 900 }),
    await txt('01 Foundations · 02 Components · 03 Desktop 1440 · 04 Mobile 390 · 05 Prototype', 'Mono', 'text-3'))
  page.appendChild(cover)
  return cover
}

// ---------------- Запуск ----------------
async function main() {
  const pages = getPages()
  const page = pages[0]
  await figma.setCurrentPageAsync(page)
  for (const child of [...page.children]) child.remove()
  await loadAll()

  const board = box('V', { name: 'Components', gap: 64, p: 64, fill: 'bg' })
  add(board, await txt('Components', 'Display', 'text'),
    await txt('Каждый компонент — это Component или Component Set с вариантами состояний. Все цвета привязаны к переменным, все контейнеры собраны на Auto Layout.', 'Body', 'text-2', { w: 720 }))
  page.appendChild(board)

  const iconSection = await section(board, 'Icons', 'Иконки Lucide как отдельные компоненты — используются во всех остальных компонентах.')
  const iconGrid = box('H', { name: 'Icon Components', gap: 16, wrap: true, w: 900 })
  for (const name of Object.keys(ICONS)) add(iconGrid, makeIconComponent(name))
  add(iconSection, iconGrid)

  await buildButtons(await section(board, 'Buttons', 'Variant: Primary / Secondary / Ghost / Danger × State: Default / Hover / Pressed / Disabled. Свойства: Label, Show icon.'))
  await buildIconButton(await section(board, 'Icon Button'))
  await buildBadges(await section(board, 'Lesson Status', 'Статусы: идёт сейчас, замена, другая аудитория, отмена. Каждому — свой мягкий фон.'))
  const inputs = await section(board, 'Inputs & Select', 'Состояния: Default, Hover, Focus (кольцо фокуса), Error, Disabled.')
  await buildField(inputs, 'Input')
  await buildField(inputs, 'Select')
  const nav = await section(board, 'Navigation', 'Пункт меню, боковое меню для desktop, верхняя и нижняя панели для mobile, переключатели.')
  await buildNavItem(nav)
  await buildSegment(nav)
  await buildWeekSwitcher(nav)
  await buildMobileBars(nav)
  await buildSidebar(await section(board, 'Sidebar', 'Вариант Active показывает, какой пункт открыт.'))
  const schedule = await section(board, 'Schedule Cards', 'Карточка занятия, вкладка дня, строка изменения, карточка группы.')
  await buildDayTab(schedule)
  await buildLessonCard(schedule)
  await buildChangeRow(schedule)
  await buildGroupCard(schedule)
  await buildTeacherRow(schedule)
  await buildBanner(await section(board, 'Summary', 'Плашка изменений на главной и счётчики на странице изменений.'))
  await buildTableRow(await section(board, 'Table', 'Таблица занятий в административной панели.'))
  await buildFeedback(await section(board, 'Modals, Notifications, Empty States'))

  const foundations = await buildFoundations(page)
  const cover = await buildCover(page)
  const sections = [
    sectionAround(page, cover, '00 / Cover', 0, 0),
    sectionAround(page, foundations, '01 / Foundations', 1840, 0),
  ]
  sections.push(sectionAround(page, board, '02 / Components', 1840 + sections[1].width + 160, 0))

  const sets = page.findAllWithCriteria({ types: ['COMPONENT_SET'] })
  const singles = page.findAllWithCriteria({ types: ['COMPONENT'] }).filter((c) => c.parent.type !== 'COMPONENT_SET')
  await board.screenshot({ scale: 0.2 })
  await foundations.screenshot({ scale: 0.3 })
  return {
    pages: pages.map((p) => ({ id: p.id, name: p.name })),
    fonts: F,
    sections: sections.map((s) => s.id),
    componentSets: sets.map((s) => `${s.name} (${s.children.length})`),
    singleComponents: singles.filter((c) => !c.name.startsWith('Icon/')).map((c) => c.name),
    ids: { board: board.id, foundations: foundations.id, cover: cover.id },
  }
}
