// =====================================================================
//  SLOT. — общие функции генератора Figma-макета.
//  Этот файл подключается перед part1 / part2 / part3 (см. bundle.mjs).
//  Значения токенов совпадают с frontend/src/styles/tokens.css.
// =====================================================================

const LIGHT = {
  'bg': '#F6F6F3', 'surface': '#FFFFFF', 'surface-2': '#F0F0EC', 'border': '#E5E5DF', 'border-strong': '#D4D4CC',
  'text': '#0E0E10', 'text-2': '#55555E', 'text-3': '#8B8B93', 'text-inverse': '#FFFFFF',
  'accent': '#2F5BFF', 'accent-hover': '#1F47E6', 'accent-soft': '#E8EDFF', 'accent-text': '#2448D8',
  'now': '#0A7A4B', 'now-soft': '#DCF6E8', 'replacement': '#A35A00', 'replacement-soft': '#FFF1D6',
  'room': '#6B3FE0', 'room-soft': '#EFE9FF', 'cancelled': '#C0352B', 'cancelled-soft': '#FDE7E5',
}
const DARK = {
  'bg': '#0B0B0D', 'surface': '#141417', 'surface-2': '#1C1C20', 'border': '#26262C', 'border-strong': '#34343B',
  'text': '#F4F4F5', 'text-2': '#A6A6AF', 'text-3': '#6F6F78', 'text-inverse': '#FFFFFF',
  'accent': '#5B7CFF', 'accent-hover': '#7590FF', 'accent-soft': '#1B2347', 'accent-text': '#8EA4FF',
  'now': '#3DDC97', 'now-soft': '#0F2A1F', 'replacement': '#F5B445', 'replacement-soft': '#2E2210',
  'room': '#A98BFF', 'room-soft': '#231B3D', 'cancelled': '#FF7A6E', 'cancelled-soft': '#331816',
}
const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 14: 56 }
const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 999 }
const TYPE = [
  // имя, начертание, размер, межстрочный (px), трекинг (%)
  ['Display', 'semibold', 56, 57, -3],
  ['H1', 'semibold', 36, 40, -2],
  ['H2', 'semibold', 24, 29, -1.5],
  ['H3', 'semibold', 17, 23, -0.5],
  ['Body', 'regular', 15, 22, 0],
  ['Body Medium', 'medium', 15, 22, 0],
  ['Label', 'medium', 14, 20, 0],
  ['Small', 'regular', 13, 19, 0],
  ['Small Medium', 'medium', 13, 19, 0],
  ['Caption', 'medium', 12, 16, 0],
  ['Overline', 'semibold', 11, 14, 6],
  ['Mono', 'mono', 13, 17, 0],
  ['Mono Large', 'monoBold', 15, 20, 0],
]
const SHADOWS = {
  'sm': [[0, 1, 2, 0, 0.05]],
  'md': [[0, 1, 2, 0, 0.04], [0, 6, 20, -6, 0.1]],
  'lg': [[0, 24, 56, -16, 0.22], [0, 2, 6, 0, 0.06]],
}

const T = {}      // токены-переменные: T['text'], T['space/4'], T['radius/md']
const TS = {}     // текстовые стили: TS['H1']
const ES = {}     // стили теней: ES['sm']
const ICON = {}   // компоненты иконок: ICON['search']
const C = {}      // компоненты: C.Button, C.LessonCard ...
let F = null      // шрифты
let COLLECTION = null

function hex(value) {
  const h = value.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }
}

// ---------- Шрифты: Onest + JetBrains Mono, иначе Inter ----------
async function ensureFonts() {
  const all = await figma.listAvailableFontsAsync()
  const norm = (s) => s.toLowerCase().replace(/\s/g, '')
  function find(families, styles) {
    for (const family of families) {
      for (const style of styles) {
        const hit = all.find((f) => f.fontName.family === family && norm(f.fontName.style) === norm(style))
        if (hit) return hit.fontName
      }
    }
    return { family: 'Inter', style: 'Regular' }
  }
  const sans = ['Onest', 'Inter']
  const mono = ['JetBrains Mono', 'Roboto Mono', 'Inter']
  F = {
    regular: find(sans, ['Regular']),
    medium: find(sans, ['Medium']),
    semibold: find(sans, ['SemiBold', 'Semi Bold']),
    bold: find(sans, ['Bold']),
    mono: find(mono, ['Medium', 'Regular']),
    monoBold: find(mono, ['SemiBold', 'Semi Bold', 'Bold']),
  }
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
  for (const font of Object.values(F)) await figma.loadFontAsync(font)
}

// ---------- Переменные (Light / Dark) ----------
async function ensureTokens() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  COLLECTION = collections.find((c) => c.name === 'SLOT Tokens')
  const existing = await figma.variables.getLocalVariablesAsync()
  if (!COLLECTION) {
    COLLECTION = figma.variables.createVariableCollection('SLOT Tokens')
  }
  // Starter-план разрешает только один режим, поэтому в переменных — светлая тема.
  // Тёмная палитра показана на странице Foundations (и полностью работает в React).
  const lightId = COLLECTION.modes[0].modeId
  if (COLLECTION.modes[0].name !== 'Light') COLLECTION.renameMode(lightId, 'Light')
  const byName = {}
  for (const v of existing) if (v.variableCollectionId === COLLECTION.id) byName[v.name] = v

  function make(name, type, scopes) {
    if (byName[name]) return byName[name]
    const v = figma.variables.createVariable(name, COLLECTION, type)
    v.scopes = scopes
    return v
  }
  for (const key of Object.keys(LIGHT)) {
    const v = make('color/' + key, 'COLOR', ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'])
    v.setValueForMode(lightId, { ...hex(LIGHT[key]), a: 1 })
    T[key] = v
  }
  for (const [key, px] of Object.entries(SPACE)) {
    const v = make('space/' + key, 'FLOAT', ['GAP'])
    v.setValueForMode(lightId, px)
    T['space/' + key] = v
  }
  for (const [key, px] of Object.entries(RADIUS)) {
    const v = make('radius/' + key, 'FLOAT', ['CORNER_RADIUS'])
    v.setValueForMode(lightId, px)
    T['radius/' + key] = v
  }
}

// ---------- Текстовые стили и тени ----------
async function ensureStyles() {
  const textStyles = await figma.getLocalTextStylesAsync()
  for (const [name, weight, size, line, tracking] of TYPE) {
    let style = textStyles.find((s) => s.name === name)
    if (!style) {
      style = figma.createTextStyle()
      style.name = name
    }
    style.fontName = F[weight]
    style.fontSize = size
    style.lineHeight = { unit: 'PIXELS', value: line }
    style.letterSpacing = { unit: 'PERCENT', value: tracking }
    TS[name] = style
  }
  const effectStyles = await figma.getLocalEffectStylesAsync()
  for (const [name, layers] of Object.entries(SHADOWS)) {
    let style = effectStyles.find((s) => s.name === 'Shadow/' + name)
    if (!style) {
      style = figma.createEffectStyle()
      style.name = 'Shadow/' + name
    }
    style.effects = layers.map(([x, y, blur, spread, alpha]) => ({
      type: 'DROP_SHADOW', color: { r: 0.055, g: 0.055, b: 0.063, a: alpha },
      offset: { x, y }, radius: blur, spread, visible: true, blendMode: 'NORMAL',
    }))
    ES[name] = style
  }
}

// ---------- Краска, привязанная к переменной ----------
function solid(token, opacity) {
  const paint = { type: 'SOLID', color: hex(LIGHT[token]) }
  if (opacity != null) paint.opacity = opacity
  return T[token] ? figma.variables.setBoundVariableForPaint(paint, 'color', T[token]) : paint
}
function setFill(node, token, opacity) { node.fills = token ? [solid(token, opacity)] : [] }
function setStroke(node, token, weight = 1) {
  node.strokes = [solid(token)]
  node.strokeWeight = weight
  node.strokeAlign = 'INSIDE'
}
function bindNum(node, field, token, value) {
  node[field] = value
  if (T[token]) {
    try { node.setBoundVariable(field, T[token]) } catch (e) { /* поле не поддерживает переменные */ }
  }
}
function setRadius(node, key) {
  const px = RADIUS[key] != null ? RADIUS[key] : key
  if (RADIUS[key] == null) { node.cornerRadius = px; return }
  for (const corner of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) {
    bindNum(node, corner, 'radius/' + key, px)
  }
}
function spaceToken(px) {
  const key = Object.keys(SPACE).find((k) => SPACE[k] === px)
  return key ? 'space/' + key : null
}
function setGap(node, px) { bindNum(node, 'itemSpacing', spaceToken(px), px) }
function setPad(node, p) {
  const [t, r, b, l] = Array.isArray(p) ? (p.length === 2 ? [p[0], p[1], p[0], p[1]] : p) : [p, p, p, p]
  bindNum(node, 'paddingTop', spaceToken(t), t)
  bindNum(node, 'paddingRight', spaceToken(r), r)
  bindNum(node, 'paddingBottom', spaceToken(b), b)
  bindNum(node, 'paddingLeft', spaceToken(l), l)
}
async function shadow(node, key) { await node.setEffectStyleIdAsync(ES[key].id) }

// ---------- Auto Layout контейнер ----------
// box('H' | 'V', { name, fill, stroke, r, gap, p, align, justify, w, h, component })
function box(dir, o = {}) {
  let f
  if (o.component) {
    f = figma.createComponent()
    f.layoutMode = dir === 'H' ? 'HORIZONTAL' : 'VERTICAL'
    f.primaryAxisSizingMode = 'AUTO'
    f.counterAxisSizingMode = 'AUTO'
  } else {
    f = figma.createAutoLayout(dir === 'H' ? 'HORIZONTAL' : 'VERTICAL')
  }
  f.name = o.name || (dir === 'H' ? 'Row' : 'Stack')
  f.fills = []
  if (o.fill) setFill(f, o.fill, o.opacity)
  if (o.stroke) setStroke(f, o.stroke)
  if (o.r != null) setRadius(f, o.r)
  setGap(f, o.gap || 0)
  if (o.p != null) setPad(f, o.p)
  if (o.align) f.counterAxisAlignItems = o.align
  if (o.justify) f.primaryAxisAlignItems = o.justify
  if (o.wrap) f.layoutWrap = 'WRAP'
  if (o.w || o.h) {
    f.resize(o.w || Math.max(f.width, 1), o.h || Math.max(f.height, 1))
    f.layoutSizingHorizontal = o.w ? 'FIXED' : 'HUG'
    f.layoutSizingVertical = o.h ? 'FIXED' : 'HUG'
  }
  if (o.clip != null) f.clipsContent = o.clip
  return f
}

// Добавляет детей; mode: 'fill' — растянуть по ширине, 'grow' — по главной оси
function add(parent, ...children) {
  for (const child of children) if (child) parent.appendChild(child)
  return parent
}
function fillW(node) { node.layoutSizingHorizontal = 'FILL'; if (node.type === 'TEXT') node.textAutoResize = 'HEIGHT'; return node }
function fillH(node) { node.layoutSizingVertical = 'FILL'; return node }
function spacer(parent) {
  const s = figma.createFrame()
  s.name = 'Spacer'
  s.fills = []
  s.resize(1, 1)
  parent.appendChild(s)
  if (parent.layoutMode === 'HORIZONTAL') { s.layoutGrow = 1; s.layoutSizingVertical = 'FIXED' } else { s.layoutGrow = 1 }
  return s
}

// ---------- Текст ----------
async function txt(chars, style = 'Body', color = 'text', o = {}) {
  const t = figma.createText()
  t.fontName = F.regular
  t.characters = String(chars)
  await t.setTextStyleIdAsync(TS[style].id)
  setFill(t, color)
  t.name = o.name || String(chars).slice(0, 24)
  if (o.strike) t.textDecoration = 'STRIKETHROUGH'
  if (o.upper) t.textCase = 'UPPER'
  if (o.align) t.textAlignHorizontal = o.align
  if (o.w) { t.resize(o.w, t.height); t.textAutoResize = 'HEIGHT' }
  return t
}

// ---------- Иконки ----------
function makeIconComponent(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
  const vectorFrame = figma.createNodeFromSvg(svg)
  const c = figma.createComponent()
  c.name = 'Icon/' + name
  c.resize(24, 24)
  c.fills = []
  for (const child of [...vectorFrame.children]) {
    c.appendChild(child)
    child.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }
  }
  vectorFrame.remove()
  recolor(c, 'text')
  ICON[name] = c
  return c
}
function recolor(node, token) {
  const list = 'findAll' in node ? node.findAll((n) => 'strokes' in n && n.strokes.length > 0) : []
  for (const n of list) n.strokes = [solid(token)]
}
function icon(name, size = 18, token = 'text-2') {
  const inst = ICON[name].createInstance()
  inst.rescale(size / 24)
  inst.name = 'icon/' + name
  recolor(inst, token)
  return inst
}
function swapIcon(inst, name, token) {
  const nested = inst.findOne((n) => n.type === 'INSTANCE' && n.name.startsWith('icon/'))
  if (!nested) return
  nested.swapComponent(ICON[name])
  nested.name = 'icon/' + name
  if (token) recolor(nested, token)
}

// ---------- Варианты компонентов ----------
function combine(components, name, parent, cols) {
  const set = figma.combineAsVariants(components, parent)
  set.name = name
  const gap = 24
  const cw = Math.max(...components.map((c) => c.width))
  const ch = Math.max(...components.map((c) => c.height))
  components.forEach((c, i) => {
    c.x = gap + (i % cols) * (cw + gap)
    c.y = gap + Math.floor(i / cols) * (ch + gap)
  })
  const rows = Math.ceil(components.length / cols)
  set.resize(gap + Math.min(cols, components.length) * (cw + gap), gap + rows * (ch + gap))
  set.fills = [{ type: 'SOLID', color: hex('#FFFFFF') }]
  set.strokes = [{ type: 'SOLID', color: hex('#9747FF') }]
  set.dashPattern = [6, 4]
  set.cornerRadius = 12
  return set
}
// variant(set, { State: 'Hover' }) — найти нужный вариант в наборе
function variant(set, props) {
  return set.children.find((c) => Object.entries(props).every(([k, v]) => c.variantProperties[k] === v)) || set.children[0]
}
function inst(set, props = {}) {
  return (set.type === 'COMPONENT_SET' ? variant(set, props) : set).createInstance()
}
// Меняем текст внутри экземпляра: через свойство компонента или по имени слоя
function setText(instance, layerName, value) {
  const props = instance.componentProperties || {}
  const key = Object.keys(props).find((k) => k.split('#')[0] === layerName && props[k].type === 'TEXT')
  if (key) {
    try { instance.setProperties({ [key]: String(value) }); return } catch (e) { /* пробуем напрямую */ }
  }
  const node = instance.findOne((n) => n.type === 'TEXT' && n.name === layerName)
  if (node) node.characters = String(value)
  return node
}
// Текст во вложенном экземпляре: setNested(card, 'Type', 'Label', 'Практика')
function setNested(instance, childName, layerName, value) {
  const child = instance.findOne((n) => n.type === 'INSTANCE' && n.name === childName)
  if (child) setText(child, layerName, value)
}
function hide(instance, layerName) {
  const node = instance.findOne((n) => n.name === layerName)
  if (node) node.visible = false
}

const BADGES = {
  Neutral: ['surface-2', 'text-2', null], Accent: ['accent-soft', 'accent-text', 'layers'],
  Now: ['now-soft', 'now', 'clock'], Replacement: ['replacement-soft', 'replacement', 'arrow-right-left'],
  Room: ['room-soft', 'room', 'door-open'], Cancelled: ['cancelled-soft', 'cancelled', 'ban'],
}
const BADGE_TEXT = { Neutral: 'Лекция', Accent: 'Нечётная неделя', Now: 'Идёт сейчас', Replacement: 'Замена', Room: 'Другая аудитория', Cancelled: 'Отменено' }

async function logo(size = 24) {
  const t = await txt('SLOT.', 'H2', 'text', { name: 'Logo' })
  t.fontName = F.bold
  t.fontSize = size
  t.letterSpacing = { unit: 'PERCENT', value: -4 }
  t.lineHeight = { unit: 'PERCENT', value: 100 }
  t.setRangeFills(4, 5, [solid('accent')])
  return t
}

function iconButton(name, state = 'Default') {
  const b = inst(C.IconButton, { State: state })
  swapIcon(b, name, state === 'Hover' ? 'text' : 'text-2')
  return b
}

const NAV = [['Главная', 'house'], ['Расписание', 'calendar-days'], ['Поиск', 'search'], ['Изменения', 'refresh-ccw']]

function line() {
  const l = figma.createRectangle()
  l.name = 'Line'
  l.resize(10, 1)
  setFill(l, 'border')
  return l
}
function hideIcon(buttonInstance) {
  const props = buttonInstance.componentProperties
  const key = Object.keys(props).find((k) => k.startsWith('Show icon'))
  if (key) buttonInstance.setProperties({ [key]: false })
}

// Секция Figma вокруг фрейма (замена отдельной страницы на Starter-плане)
function sectionAround(page, node, name, x, y) {
  const section = figma.createSection()
  section.name = name
  page.appendChild(section)
  section.appendChild(node)
  node.x = 80
  node.y = 80
  section.resizeWithoutConstraints(node.width + 160, node.height + 160)
  section.x = x
  section.y = y
  return section
}

async function loadAll() {
  await ensureFonts()
  await ensureTokens()
  await ensureStyles()
}
