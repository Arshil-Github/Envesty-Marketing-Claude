const express = require('express')
const { renderCarousel } = require('../lib/screenshotter')
const { readSlot } = require('../lib/fileSystem')

const router = express.Router()

router.post('/carousel', async (req, res, next) => {
  try {
    const { cycle, slot } = req.body || {}
    if (!cycle || !slot) return res.status(400).json({ error: 'cycle and slot required' })
    const slotData = readSlot(cycle, slot)
    if (!slotData) return res.status(404).json({ error: 'slot not found' })
    const slides = slotData.slides || []
    if (!slides.length) return res.status(400).json({ error: 'slot has no slides' })

    const result = await renderCarousel({ cycle, slot, slides })
    res.json({ ok: true, ...result })
  } catch (e) {
    next(e)
  }
})

module.exports = router
