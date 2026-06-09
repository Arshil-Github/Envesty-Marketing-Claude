const fs = require('fs')
const path = require('path')
const { CONTENT_QUEUE, OUTPUT_DIR } = require('./paths')

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function listCycles() {
  if (!fs.existsSync(CONTENT_QUEUE)) return []
  return fs
    .readdirSync(CONTENT_QUEUE)
    .filter((n) => /^\d{4}-\d{2}_cycle-\d{2}$/.test(n))
    .sort()
}

function listSlots(cycle) {
  const dir = path.join(CONTENT_QUEUE, cycle)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((n) => fs.statSync(path.join(dir, n)).isDirectory())
    .sort()
}

function readSlot(cycle, slot) {
  const p = path.join(CONTENT_QUEUE, cycle, slot, 'slot.json')
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeSlot(cycle, slot, data) {
  const dir = path.join(CONTENT_QUEUE, cycle, slot)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, 'slot.json'), JSON.stringify(data, null, 2) + '\n', 'utf8')
  return data
}

function outputDirFor(cycle, slot) {
  const dir = path.join(OUTPUT_DIR, cycle, slot, 'carousel')
  ensureDir(dir)
  return dir
}

module.exports = { ensureDir, listCycles, listSlots, readSlot, writeSlot, outputDirFor }
