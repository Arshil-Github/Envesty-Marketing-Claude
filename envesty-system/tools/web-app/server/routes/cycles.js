const express = require('express')
const { listCycles, listSlots, readSlot, writeSlot } = require('../lib/fileSystem')

const router = express.Router()

router.get('/', (_req, res, next) => {
  try {
    const cycles = listCycles().map((c) => ({ name: c, slots: listSlots(c) }))
    res.json({ cycles })
  } catch (e) {
    next(e)
  }
})

router.get('/:cycle/:slot', (req, res, next) => {
  try {
    const data = readSlot(req.params.cycle, req.params.slot)
    if (!data) return res.status(404).json({ error: 'not found' })
    res.json({ slot: data })
  } catch (e) {
    next(e)
  }
})

router.put('/:cycle/:slot', (req, res, next) => {
  try {
    const saved = writeSlot(req.params.cycle, req.params.slot, req.body)
    res.json({ ok: true, slot: saved })
  } catch (e) {
    next(e)
  }
})

module.exports = router
