// =====================================================================
//  Часть 3: интерактивный прототип. Копируем экраны на страницу
//  «05 / Prototype» и связываем их переходами по клику.
// =====================================================================

function navigate(node, target, errors) {
  if (!node || !target) { errors.push('нет узла для связи ' + (target ? target.name : '?')); return }
  return node.setReactionsAsync([{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE', destinationId: target.id, navigation: 'NAVIGATE',
      transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.25 },
      preserveScrollPosition: false, resetVideoPosition: false,
    }],
  }]).catch((e) => errors.push(node.name + ': ' + e.message))
}

// Слои названы заранее: «Nav Item / Поиск», «Button / Сохранить», «Tab / Главная»
const byName = (screen, name) => screen.findOne((n) => n.name === name)

// Вызывается в конце part2: desktop и mobile — объекты { 'имя экрана': frame }
async function buildPrototype(desktop, mobile) {
  const prototypePage = figma.root.children.find((p) => p.name === 'Prototype')
  await prototypePage.loadAsync()
  for (const child of [...prototypePage.children]) child.remove()

  const copy = (screen) => {
    const clone = screen.clone()
    prototypePage.appendChild(clone)
    return clone
  }
  const d = {
    home: copy(desktop['01 Главная']), schedule: copy(desktop['02 Расписание группы']),
    search: copy(desktop['03 Поиск']), changes: copy(desktop['04 Изменения']),
    admin: copy(desktop['05 Администрирование']), form: copy(desktop['06 Форма занятия']),
  }
  const m = {
    home: copy(mobile['M1 Главная']), schedule: copy(mobile['M2 Расписание']),
    search: copy(mobile['M3 Поиск']), changes: copy(mobile['M4 Изменения']),
  }
  Object.values(d).forEach((screen, i) => { screen.x = i * 1560; screen.y = 0 })
  Object.values(m).forEach((screen, i) => { screen.x = i * 470; screen.y = 1500 })

  const errors = []
  const jobs = []
  const menu = [['Главная', 'home'], ['Расписание', 'schedule'], ['Поиск', 'search'], ['Изменения', 'changes'], ['Администрирование', 'admin']]
  for (const screen of Object.values(d)) {
    for (const [label, key] of menu) jobs.push(navigate(byName(screen, 'Nav Item / ' + label), d[key], errors))
  }
  jobs.push(navigate(byName(d.home, 'Group Card / ИС-21'), d.schedule, errors))
  jobs.push(navigate(byName(d.home, 'Changes Banner'), d.changes, errors))
  jobs.push(navigate(byName(d.search, 'Result / Ветров Павел Андреевич'), d.schedule, errors))
  jobs.push(navigate(byName(d.admin, 'Table Row'), d.form, errors))
  jobs.push(navigate(byName(d.admin, 'Button / Добавить занятие'), d.form, errors))
  jobs.push(navigate(byName(d.form, 'Button / Сохранить'), d.admin, errors))
  jobs.push(navigate(byName(d.form, 'Button / Отмена'), d.admin, errors))

  const tabs = [['Главная', 'home'], ['Расписание', 'schedule'], ['Поиск', 'search'], ['Изменения', 'changes']]
  for (const screen of Object.values(m)) {
    for (const [label, key] of tabs) jobs.push(navigate(byName(screen, 'Tab / ' + label), m[key], errors))
  }
  jobs.push(navigate(byName(m.home, 'Group Card / ИС-21'), m.schedule, errors))
  jobs.push(navigate(byName(m.search, 'Result / Ветров Павел Андреевич'), m.schedule, errors))
  await Promise.all(jobs)

  prototypePage.flowStartingPoints = [
    { nodeId: d.home.id, name: 'Desktop: студент → администратор' },
    { nodeId: m.home.id, name: 'Mobile: расписание с телефона' },
  ]
  return { flows: prototypePage.flowStartingPoints, links: jobs.length, errors, screens: Object.values(d).concat(Object.values(m)).map((s) => s.id) }
}
