// Собирает скрипты для запуска в Figma: icons + lib + часть → dist/*.js
// Запуск из папки frontend (там лежит esbuild):  node ../figma/scripts/bundle.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve('package.json'))
const esbuild = require('esbuild')

const read = (name) => fs.readFileSync(path.join(here, name), 'utf8')
const builds = {
  'part1.js': ['icons.generated.js', 'lib.js', 'part1-foundations-components.js'],
  'part2.js': ['icons.generated.js', 'lib.js', 'part2-screens.js', 'part3-prototype.js'],
}
fs.mkdirSync(path.join(here, 'dist'), { recursive: true })
for (const [out, files] of Object.entries(builds)) {
  const source = `async function __slot() {\n${files.map(read).join('\n')}\nreturn await main()\n}`
  const { code } = esbuild.transformSync(source, { minify: true, lineLimit: 160, charset: 'utf8' })
  const final = code + '\nreturn await __slot()\n'
  fs.writeFileSync(path.join(here, 'dist', out), final)
  console.log(out, final.length, 'chars')
}
