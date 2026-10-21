import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../src/release.ts', import.meta.url)
const source = readFileSync(file, 'utf8')
const match = source.match(/v(\d+)\.(\d+)\.(\d+)-prod/)
if (!match) {
  console.error('Release label is missing from src/release.ts')
  process.exit(1)
}

const major = Number(match[1])
const minor = Number(match[2])
const patch = Number(match[3]) + 1
const label = `v${major}.${minor}.${patch}-prod`
const next = source.replace(match[0], label)
writeFileSync(file, next)
console.log(label)
