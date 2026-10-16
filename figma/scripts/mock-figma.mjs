// Строгая заглушка Figma Plugin API для локальной проверки скриптов генерации.
// Она не рисует, а только проверяет: правильные ли свойства мы трогаем,
// загружены ли шрифты, верны ли правила Auto Layout (FILL/HUG) и т.д.
// Запуск: node mock-figma.mjs   (см. внизу файла)
import fs from 'node:fs'
import vm from 'node:vm'

let idCounter = 1
const nodesById = new Map()
const loadedFonts = new Set(['Inter|Regular'])
const fontKey = (f) => `${f.family}|${f.style}`
const AVAILABLE = ['Onest|Regular', 'Onest|Medium', 'Onest|SemiBold', 'Onest|Bold', 'JetBrains Mono|Medium', 'JetBrains Mono|SemiBold', 'Inter|Regular', 'Inter|Semi Bold']

const PROPS = new Set(`id type name parent children x y width height fills strokes strokeWeight strokeAlign strokeTopWeight strokeBottomWeight
strokeLeftWeight strokeRightWeight cornerRadius topLeftRadius topRightRadius bottomLeftRadius bottomRightRadius layoutMode primaryAxisSizingMode
counterAxisSizingMode primaryAxisAlignItems counterAxisAlignItems itemSpacing counterAxisSpacing paddingTop paddingRight paddingBottom paddingLeft
layoutWrap layoutSizingHorizontal layoutSizingVertical layoutGrow layoutAlign layoutPositioning clipsContent opacity visible effects
dashPattern constraints minHeight minWidth layoutGrids description componentPropertyReferences variantProperties mainComponent
characters fontName fontSize lineHeight letterSpacing textAutoResize textDecoration textCase textAlignHorizontal componentProperties
componentPropertyDefinitions flowStartingPoints reactions boundVariables placeholder`.split(/\s+/))

function assertColor(paints, where) {
  if (!Array.isArray(paints)) throw new Error(`${where}: paints must be array`)
  for (const p of paints) {
    if (p.type !== 'SOLID') continue
    const c = p.color
    if ('a' in c) throw new Error(`${where}: paint color must not have "a"`)
    for (const k of ['r', 'g', 'b']) if (!(c[k] >= 0 && c[k] <= 1)) throw new Error(`${where}: color out of range ${JSON.stringify(c)}`)
  }
}

function isAutoLayout(n) { return n && n.layoutMode && n.layoutMode !== 'NONE' }

class Node {
  constructor(type) {
    this.id = `${idCounter}:${idCounter++}`
    this.type = type
    this.name = type
    this.parent = null
    this.x = 0; this.y = 0; this.width = 100; this.height = 100
    this.fills = type === 'FRAME' || type === 'COMPONENT' ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }] : []
    this.strokes = []
    this.opacity = 1
    this.visible = true
    this.effects = []
    this.layoutMode = 'NONE'
    this.layoutPositioning = 'AUTO'
    this.componentPropertyReferences = null
    this.reactions = []
    if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'PAGE', 'GROUP', 'SECTION'].includes(type)) this.children = []
    nodesById.set(this.id, this)
  }
}

function wrap(node) {
  return new Proxy(node, {
    get(target, prop) {
      if (typeof prop === 'symbol') return target[prop]
      if (prop in METHODS) return METHODS[prop].bind(null, target)
      if (prop === 'children') return target.children ? target.children.map(wrap) : undefined
      if (prop === 'parent') return target.parent ? wrap(target.parent) : null
      if (prop === 'componentProperties') return componentProperties(target)
      if (prop === 'variantProperties') return variantProps(target)
      if (prop === 'componentPropertyDefinitions') {
        if (target.type === 'COMPONENT' && target.parent && target.parent.type === 'COMPONENT_SET') throw new Error('componentPropertyDefinitions on variant')
        return target._defs || {}
      }
      if (prop === 'characters' && target.type !== 'TEXT') throw new Error(`characters on ${target.type}`)
      if (prop === 'toJSON' || prop === 'then') return undefined
      if (!PROPS.has(prop) && !(prop in target)) throw new Error(`Unknown property read: ${prop} on ${target.type}`)
      return target[prop]
    },
    set(target, prop, value) {
      if (!PROPS.has(prop)) throw new Error(`Unknown property set: ${prop} on ${target.type}`)
      if (prop === 'fills' || prop === 'strokes') assertColor(value, `${target.name}.${prop}`)
      if (prop === 'description' && !['COMPONENT', 'COMPONENT_SET'].includes(target.type)) throw new Error(`description on ${target.type}`)
      if (prop === 'characters') {
        if (target.type !== 'TEXT') throw new Error('characters on non-text')
        if (!loadedFonts.has(fontKey(target.fontName))) throw new Error(`Cannot write to node with unloaded font ${fontKey(target.fontName)}`)
      }
      if (prop === 'fontName' && !loadedFonts.has(fontKey(value))) throw new Error(`unloaded font ${fontKey(value)}`)
      if (prop === 'layoutSizingHorizontal' || prop === 'layoutSizingVertical') {
        if (!['FIXED', 'HUG', 'FILL'].includes(value)) throw new Error(`${prop}: bad value ${value}`)
        if (value === 'FILL' && !isAutoLayout(target.parent)) throw new Error(`FILL can only be set on children of auto-layout frames (${target.name})`)
        if (value === 'HUG' && !(isAutoLayout(target) || (target.type === 'TEXT' && isAutoLayout(target.parent)))) throw new Error(`HUG invalid on ${target.name}`)
      }
      if ((prop === 'primaryAxisSizingMode' || prop === 'counterAxisSizingMode') && !['FIXED', 'AUTO'].includes(value)) throw new Error(`${prop}: ${value}`)
      if (prop === 'layoutPositioning' && value === 'ABSOLUTE' && !isAutoLayout(target.parent)) throw new Error('ABSOLUTE needs auto-layout parent')
      if (prop === 'layoutGrow' && !target.parent) throw new Error(`layoutGrow before append on ${target.name}`)
      if (prop === 'textAutoResize' && target.type !== 'TEXT') throw new Error('textAutoResize on non-text')
      if (prop === 'componentPropertyReferences') {
        for (const key of Object.values(value)) if (!findDefs(target)[key]) throw new Error(`unknown property ref ${key}`)
      }
      if (prop === 'flowStartingPoints') for (const f of value) if (!nodesById.has(f.nodeId)) throw new Error('bad flow node')
      target[prop] = value
      return true
    },
  })
}

function findDefs(node) {
  let n = node
  while (n) {
    if (n.type === 'COMPONENT_SET') return n._defs || {}
    if (n.type === 'COMPONENT' && !(n.parent && n.parent.type === 'COMPONENT_SET')) return n._defs || {}
    n = n.parent
  }
  return {}
}
function variantProps(node) {
  if (!(node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET')) return null
  return Object.fromEntries(node.name.split(',').map((p) => p.trim().split('=')))
}
function componentProperties(node) {
  if (node.type !== 'INSTANCE') return undefined
  const main = raw(node.mainComponent)
  const owner = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main
  const defs = owner._defs || {}
  return Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, { type: d.type, value: (node._values || {})[k] ?? d.defaultValue }]))
}

function deepClone(src, asInstance) {
  const copy = new Node(asInstance ? 'INSTANCE' : src.type === 'INSTANCE' ? 'INSTANCE' : src.type === 'COMPONENT' ? 'FRAME' : src.type)
  for (const [k, v] of Object.entries(src)) {
    if (['id', 'parent', 'children', 'type', '_defs'].includes(k)) continue
    copy[k] = typeof v === 'object' && v !== null && k !== 'mainComponent' ? structuredClone(v) : v
  }
  if (asInstance) copy.mainComponent = wrap(src)
  if (src.children) {
    copy.children = []
    for (const child of src.children) {
      const c = deepClone(child, false)
      c.parent = copy
      copy.children.push(c)
    }
  }
  return copy
}

function walk(node, fn) {
  for (const child of node.children || []) { fn(child); walk(child, fn) }
}

function detachFromParent(node) {
  if (node.parent) {
    const list = node.parent.children
    list.splice(list.indexOf(node), 1)
    node.parent = null
  }
}

const METHODS = {
  appendChild(target, child) { const c = raw(child); detachFromParent(c); c.parent = target; target.children.push(c) },
  insertChild(target, index, child) { const c = raw(child); detachFromParent(c); c.parent = target; target.children.splice(index, 0, c) },
  remove(target) { detachFromParent(target); nodesById.delete(target.id) },
  resize(target, w, h) {
    if (!(w > 0 && h > 0)) throw new Error(`resize invalid ${w}x${h} on ${target.name}`)
    target.width = w; target.height = h
    if (isAutoLayout(target)) { target.primaryAxisSizingMode = 'FIXED'; target.counterAxisSizingMode = 'FIXED' }
  },
  resizeWithoutConstraints(target, w, h) { if (target.type !== 'SECTION') throw new Error('rWC only tested on sections'); target.width = w; target.height = h },
  rescale(target, s) { target.width *= s; target.height *= s },
  findOne(target, fn) { let found = null; walk(target, (n) => { if (!found && fn(wrap(n))) found = wrap(n) }); return found },
  findAll(target, fn) { const out = []; walk(target, (n) => { if (!fn || fn(wrap(n))) out.push(wrap(n)) }); return out },
  findAllWithCriteria(target, { types }) { const out = []; walk(target, (n) => { if (types.includes(n.type)) out.push(wrap(n)) }); return out },
  clone(target) { const c = deepClone(target, false); c.parent = target.parent; target.parent.children.push(c); return wrap(c) },
  createInstance(target) {
    if (target.type !== 'COMPONENT') throw new Error('createInstance on ' + target.type)
    const c = deepClone(target, true)
    figmaApi.currentPage.appendChild(wrap(c))
    return wrap(c)
  },
  swapComponent(target, comp) {
    if (target.type !== 'INSTANCE') throw new Error('swap on non-instance')
    const fresh = deepClone(raw(comp), true)
    target.children = fresh.children
    for (const c of target.children) c.parent = target
    target.mainComponent = comp
  },
  detachInstance(target) { if (target.type !== 'INSTANCE') throw new Error('detach on non-instance'); target.type = 'FRAME'; return wrap(target) },
  addComponentProperty(target, name, type, defaultValue) {
    if (!(target.type === 'COMPONENT_SET' || (target.type === 'COMPONENT' && target.parent?.type !== 'COMPONENT_SET'))) throw new Error('addComponentProperty on variant')
    if (type === 'TEXT' && typeof defaultValue !== 'string') throw new Error('TEXT default must be string')
    const key = `${name}#${idCounter++}:0`
    target._defs = { ...(target._defs || {}), [key]: { type, defaultValue } }
    return key
  },
  setProperties(target, values) {
    const props = componentProperties(target)
    for (const k of Object.keys(values)) if (!props[k]) throw new Error(`setProperties: unknown ${k}`)
    target._values = { ...(target._values || {}), ...values }
  },
  async setTextStyleIdAsync(target, id) { if (target.type !== 'TEXT') throw new Error('text style on non-text'); const st = styles.get(id); if (!st) throw new Error('bad style'); if (!loadedFonts.has(fontKey(st.fontName))) throw new Error('style font not loaded'); target.fontName = st.fontName },
  async setEffectStyleIdAsync(target, id) { if (!styles.get(id)) throw new Error('bad effect style') },
  setBoundVariable(target, field, variable) {
    const ok = ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius', 'counterAxisSpacing', 'width', 'height']
    if (!ok.includes(field)) throw new Error('setBoundVariable field ' + field)
    if (!variable || !variable.id) throw new Error('bad variable')
  },
  setRangeFills(target, start, end, paints) { if (start < 0 || end > target.characters.length || start >= end) throw new Error(`bad range ${start}-${end} in "${target.characters}"`); assertColor(paints, 'range') },
  setExplicitVariableModeForCollection(target, collection, modeId) { if (!collection.modes.find((m) => m.modeId === modeId)) throw new Error('bad mode') },
  async setReactionsAsync(target, reactions) { for (const r of reactions) for (const a of r.actions) if (!nodesById.has(a.destinationId)) throw new Error('bad destination'); target.reactions = reactions },
  async screenshot() { return 'png' },
  async loadAsync(target) { if (target.type !== 'PAGE') throw new Error('loadAsync on non-page') },
}
function raw(n) { return nodesById.get(n.id) }

const styles = new Map()
const collections = []
const variables = []

function createNode(type, props = {}) { const n = new Node(type); Object.assign(n, props); const w = wrap(n); if (type !== 'PAGE') figmaApi.currentPage.appendChild(w); return w }

const rootNode = new Node('DOCUMENT')
rootNode.children = []
const firstPage = new Node('PAGE')
firstPage.name = 'Page 1'
firstPage.parent = rootNode
rootNode.children.push(firstPage)

const figmaApi = {
  root: wrap(rootNode),
  currentPage: wrap(firstPage),
  createPage() { if (rootNode.children.length >= 3) throw new Error('Starter plan: 3 pages'); const p = new Node('PAGE'); p.parent = rootNode; rootNode.children.push(p); return wrap(p) },
  async setCurrentPageAsync(page) { figmaApi.currentPage = page; pageSwitches++ },
  createFrame: () => createNode('FRAME'),
  createSection: () => createNode('SECTION'),
  createAutoLayout(dir = 'HORIZONTAL', props) {
    if (typeof dir === 'object') { props = dir; dir = 'HORIZONTAL' }
    const n = createNode('FRAME', { layoutMode: dir, primaryAxisSizingMode: 'AUTO', counterAxisSizingMode: 'AUTO', layoutSizingHorizontal: 'HUG', layoutSizingVertical: 'HUG' })
    if (props) Object.assign(n, props)
    return n
  },
  createComponent: () => createNode('COMPONENT'),
  createText: () => createNode('TEXT', { fontName: { family: 'Inter', style: 'Regular' }, characters: '' }),
  createRectangle: () => createNode('RECTANGLE'),
  createEllipse: () => createNode('ELLIPSE'),
  createNodeFromSvg(svg) {
    if (!svg.startsWith('<svg')) throw new Error('bad svg')
    const f = createNode('FRAME')
    const count = (svg.match(/<(path|circle|rect|line|polyline)/g) || []).length
    for (let i = 0; i < count; i++) {
      const v = new Node('VECTOR'); v.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; v.parent = raw(f); raw(f).children.push(v)
    }
    return f
  },
  combineAsVariants(nodes, parent) {
    if (!nodes.length) throw new Error('empty variants')
    const names = new Set()
    for (const n of nodes) {
      if (n.type !== 'COMPONENT') throw new Error('combine non-component')
      if (!/^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/.test(n.name)) throw new Error('bad variant name ' + n.name)
      if (names.has(n.name)) throw new Error('duplicate variant ' + n.name)
      names.add(n.name)
    }
    const set = new Node('COMPONENT_SET')
    raw(parent).children.push(set); set.parent = raw(parent)
    for (const n of nodes) { const r = raw(n); detachFromParent(r); r.parent = set; set.children.push(r) }
    return wrap(set)
  },
  async listAvailableFontsAsync() { return AVAILABLE.map((k) => { const [family, style] = k.split('|'); return { fontName: { family, style } } }) },
  async loadFontAsync(font) { if (!AVAILABLE.includes(fontKey(font))) throw new Error('font not available ' + fontKey(font)); loadedFonts.add(fontKey(font)) },
  async getLocalTextStylesAsync() { return [...styles.values()].filter((s) => s.type === 'TEXT') },
  async getLocalEffectStylesAsync() { return [...styles.values()].filter((s) => s.type === 'EFFECT') },
  createTextStyle() {
    const s = { id: 'S:' + idCounter++, type: 'TEXT', name: '' }
    const p = new Proxy(s, { set(t, k, v) { if (!['name', 'fontName', 'fontSize', 'lineHeight', 'letterSpacing'].includes(k)) throw new Error('text style prop ' + k); if (k === 'fontName' && !loadedFonts.has(fontKey(v))) throw new Error('style font not loaded'); if ((k === 'lineHeight' || k === 'letterSpacing') && typeof v !== 'object') throw new Error(k + ' must be object'); t[k] = v; return true } })
    styles.set(s.id, p); return p
  },
  createEffectStyle() { const s = { id: 'S:' + idCounter++, type: 'EFFECT', name: '' }; styles.set(s.id, s); return s },
  async getNodeByIdAsync(id) { const n = nodesById.get(id); return n ? wrap(n) : null },
  variables: {
    async getLocalVariableCollectionsAsync() { return collections },
    async getLocalVariablesAsync() { return variables },
    createVariableCollection(name) {
      const c = { id: 'VC:' + idCounter++, name, modes: [{ modeId: 'm1', name: 'Mode 1' }], renameMode(id, n) { this.modes.find((m) => m.modeId === id).name = n }, addMode(n) { if (this.modes.length >= 1) throw new Error('Limited to 1 modes only'); const id = 'm' + (this.modes.length + 1); this.modes.push({ modeId: id, name: n }); return id } }
      collections.push(c); return c
    },
    createVariable(name, collection, type) {
      if (!['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(type)) throw new Error('bad var type')
      const v = { id: 'V:' + idCounter++, name, variableCollectionId: collection.id, resolvedType: type, scopes: ['ALL_SCOPES'], setValueForMode(m, val) { if (type === 'COLOR' && !('a' in val)) throw new Error('color var needs a'); if (type === 'FLOAT' && typeof val !== 'number') throw new Error('float') } }
      variables.push(v); return v
    },
    setBoundVariableForPaint(paint, field, v) { if (field !== 'color' || !v) throw new Error('bind paint'); return { ...paint, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } } },
  },
}
let pageSwitches = 0

export async function run(file) {
  pageSwitches = 0
  const code = fs.readFileSync(file, 'utf8')
  const fn = new vm.Script(`(async () => {\n${code}\n})()`, { filename: file })
  const result = await fn.runInNewContext({ figma: figmaApi, console, structuredClone, Promise, Object, Array, Math, String, Error, JSON, Set, Map, Number })
  if (pageSwitches > 1) throw new Error('more than one page switch: ' + pageSwitches)
  return result
}

if (process.argv[2]) {
  for (const file of process.argv.slice(2)) {
    const result = await run(file)
    console.log(`\n=== ${file} OK ===`)
    console.log(JSON.stringify(result, null, 1).slice(0, 2500))
  }
}
