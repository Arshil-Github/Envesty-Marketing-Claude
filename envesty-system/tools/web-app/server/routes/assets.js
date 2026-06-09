const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { ASSET_LIBRARY } = require('../lib/paths')
const { ensureDir } = require('../lib/fileSystem')

const router = express.Router()
const upload = multer({ dest: path.join(ASSET_LIBRARY, 'inbox') })

function readIndex() {
  const p = path.join(ASSET_LIBRARY, 'assets.json')
  if (!fs.existsSync(p)) return { entries: [] }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeIndex(data) {
  fs.writeFileSync(path.join(ASSET_LIBRARY, 'assets.json'), JSON.stringify(data, null, 2) + '\n')
}

router.get('/', (_req, res, next) => {
  try {
    ensureDir(path.join(ASSET_LIBRARY, 'inbox'))
    ensureDir(path.join(ASSET_LIBRARY, 'analyzed'))
    const inbox = fs.readdirSync(path.join(ASSET_LIBRARY, 'inbox'))
    const index = readIndex()
    res.json({ inbox, index })
  } catch (e) {
    next(e)
  }
})

router.post('/upload', upload.array('files', 20), (req, res, next) => {
  try {
    const files = (req.files || []).map((f) => {
      const target = path.join(ASSET_LIBRARY, 'inbox', f.originalname)
      fs.renameSync(f.path, target)
      return f.originalname
    })
    res.json({ ok: true, files })
  } catch (e) {
    next(e)
  }
})

router.post('/record', (req, res, next) => {
  try {
    const entry = req.body
    if (!entry || !entry.filename) return res.status(400).json({ error: 'filename required' })
    const inbox = path.join(ASSET_LIBRARY, 'inbox', entry.filename)
    const analyzed = path.join(ASSET_LIBRARY, 'analyzed', entry.filename)
    ensureDir(path.join(ASSET_LIBRARY, 'analyzed'))
    if (fs.existsSync(inbox)) fs.renameSync(inbox, analyzed)
    const index = readIndex()
    const enriched = { ...entry, recorded_at: new Date().toISOString() }
    index.entries = index.entries.filter((e) => e.filename !== entry.filename)
    index.entries.push(enriched)
    writeIndex(index)
    res.json({ ok: true, entry: enriched })
  } catch (e) {
    next(e)
  }
})

module.exports = router
