const express = require('express')
const fs = require('fs')
const path = require('path')
const { MEMORY_DIR, INSIGHTS_DIR } = require('../lib/paths')
const { ensureDir } = require('../lib/fileSystem')

const router = express.Router()
const MEMORY_FILE = path.join(MEMORY_DIR, 'what-worked.json')

function readMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return { entries: [] }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'))
}

function writeMemory(data) {
  ensureDir(MEMORY_DIR)
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2) + '\n')
}

router.get('/memory', (_req, res, next) => {
  try {
    res.json(readMemory())
  } catch (e) {
    next(e)
  }
})

router.post('/memory', (req, res, next) => {
  try {
    const entry = req.body
    if (!entry || !entry.slot_ref) return res.status(400).json({ error: 'slot_ref required' })
    const mem = readMemory()
    mem.entries.push({ ...entry, logged_at: new Date().toISOString() })
    writeMemory(mem)
    res.json({ ok: true, count: mem.entries.length })
  } catch (e) {
    next(e)
  }
})

router.get('/digests', (_req, res, next) => {
  try {
    ensureDir(INSIGHTS_DIR)
    const files = fs.readdirSync(INSIGHTS_DIR).filter((f) => f.endsWith('.md')).sort()
    res.json({ files })
  } catch (e) {
    next(e)
  }
})

router.get('/digests/:file', (req, res, next) => {
  try {
    const p = path.join(INSIGHTS_DIR, req.params.file)
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' })
    res.json({ name: req.params.file, content: fs.readFileSync(p, 'utf8') })
  } catch (e) {
    next(e)
  }
})

router.put('/digests/:file', (req, res, next) => {
  try {
    ensureDir(INSIGHTS_DIR)
    const p = path.join(INSIGHTS_DIR, req.params.file)
    fs.writeFileSync(p, req.body?.content || '', 'utf8')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

module.exports = router
