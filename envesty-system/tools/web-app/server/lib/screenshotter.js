const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const { getSystemConfig } = require('./configStore')
const { outputDirFor } = require('./fileSystem')

const VITE_BASE = process.env.VITE_BASE || 'http://localhost:5273'

async function renderCarousel({ cycle, slot, slides }) {
  const sys = getSystemConfig()
  const { width, height } = sys.output

  const outDir = outputDirFor(cycle, slot)

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const written = []
  try {
    const page = await browser.newPage()
    await page.setViewport({ width, height, deviceScaleFactor: 1 })

    for (let i = 0; i < slides.length; i++) {
      const slideNum = String(i + 1).padStart(2, '0')
      const url = `${VITE_BASE}/export/${encodeURIComponent(cycle)}/${encodeURIComponent(slot)}/${slideNum}`
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.evaluate(() => document.fonts && document.fonts.ready)
      const filePath = path.join(outDir, `slide-${slideNum}.png`)
      await page.screenshot({ path: filePath, type: 'png' })
      written.push(filePath)
    }
  } finally {
    await browser.close()
  }

  return { outDir, slides: written }
}

module.exports = { renderCarousel }
