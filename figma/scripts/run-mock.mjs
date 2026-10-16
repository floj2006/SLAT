// Проверка собранных скриптов на заглушке: node run-mock.mjs
import { run } from './mock-figma.mjs'
for (const file of ['dist/part1.js', 'dist/part2.js']) {
  try {
    const result = await run(file)
    console.log(`OK ${file}:`, JSON.stringify(result).slice(0, 1200))
  } catch (e) {
    console.log(`ERR ${file}:`, e.message)
    console.log(e.stack.split('\n').filter((l) => l.includes('at ')).slice(0, 5).join('\n'))
    process.exit(1)
  }
}
