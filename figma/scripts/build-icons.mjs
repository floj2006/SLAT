// Собирает SVG иконок Lucide (из frontend/node_modules) в figma/scripts/icons.generated.js,
// чтобы в Figma были те же иконки, что и в React.
// Запуск из папки frontend:  node ../figma/scripts/build-icons.mjs
import fs from 'node:fs'
import path from 'node:path'

const names = ['house', 'calendar-days', 'search', 'refresh-ccw', 'shield-check', 'moon', 'sun',
  'chevron-left', 'chevron-right', 'chevron-down', 'plus', 'pencil', 'trash-2', 'x', 'user',
  'map-pin', 'clock', 'arrow-right', 'circle-check', 'circle-alert', 'log-out', 'coffee',
  'users', 'door-open', 'book-open', 'arrow-right-left', 'ban', 'layers', 'search-x', 'lock']

const dir = path.resolve('node_modules/lucide-react/dist/esm/icons')
const icons = {}
for (const name of names) {
  const source = fs.readFileSync(path.join(dir, `${name}.js`), 'utf8')
  const nodes = [...source.matchAll(/\[\s*"(\w+)",\s*\{([^}]*)\}\s*\]/g)].map(([, tag, attrs]) => {
    const parts = [...attrs.matchAll(/(\w+): "([^"]*)"/g)].filter(([, k]) => k !== 'key')
    return `<${tag} ${parts.map(([, k, v]) => `${k}="${v}"`).join(' ')}/>`
  })
  icons[name] = nodes.join('')
}
const out = `const ICONS = ${JSON.stringify(icons)};\n`
fs.writeFileSync(path.resolve('../figma/scripts/icons.generated.js'), out)
console.log('icons:', Object.keys(icons).length, 'bytes:', out.length)
