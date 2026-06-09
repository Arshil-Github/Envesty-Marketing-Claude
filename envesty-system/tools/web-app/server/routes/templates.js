const express = require('express')
const fs = require('fs')
const path = require('path')
const { TEMPLATES_DIR } = require('../lib/paths')
const { ensureDir } = require('../lib/fileSystem')

const router = express.Router()

function nameToFile(name) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error('invalid template name')
  return path.join(TEMPLATES_DIR, `${name}.jsx`)
}

router.get('/', (_req, res, next) => {
  try {
    ensureDir(TEMPLATES_DIR)
    const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.jsx'))
    res.json({ templates: files.map((f) => ({ name: f.replace(/\.jsx$/, ''), file: f })) })
  } catch (e) {
    next(e)
  }
})

router.get('/:name', (req, res, next) => {
  try {
    const file = nameToFile(req.params.name)
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' })
    res.json({ name: req.params.name, source: fs.readFileSync(file, 'utf8') })
  } catch (e) {
    next(e)
  }
})

router.put('/:name', (req, res, next) => {
  try {
    const file = nameToFile(req.params.name)
    const source = req.body?.source
    if (typeof source !== 'string') return res.status(400).json({ error: 'source required' })
    ensureDir(TEMPLATES_DIR)
    fs.writeFileSync(file, source, 'utf8')
    res.json({ ok: true, name: req.params.name, bytes: source.length })
  } catch (e) {
    next(e)
  }
})

router.delete('/:name', (req, res, next) => {
  try {
    const file = nameToFile(req.params.name)
    if (fs.existsSync(file)) fs.unlinkSync(file)
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

module.exports = router
