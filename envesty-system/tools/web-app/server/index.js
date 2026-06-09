const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') })

const express = require('express')
const cors = require('cors')

const redditRoutes = require('./routes/reddit')
const generateRoutes = require('./routes/generate')
const templatesRoutes = require('./routes/templates')
const assetsRoutes = require('./routes/assets')
const cyclesRoutes = require('./routes/cycles')
const insightsRoutes = require('./routes/insights')
const configRoutes = require('./routes/config')

const { getSystemConfig } = require('./lib/configStore')

const app = express()
const PORT = Number(process.env.PORT || 4001)

app.use(cors({ origin: ['http://localhost:5273', 'http://localhost:5174'] }))
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'envesty',
    has_gemini_key: !!process.env.GEMINI_API_KEY,
    has_openai_key: !!process.env.OPENAI_API_KEY,
  })
})

app.use('/api/reddit', redditRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/templates', templatesRoutes)
app.use('/api/assets', assetsRoutes)
app.use('/api/cycles', cyclesRoutes)
app.use('/api/insights', insightsRoutes)
app.use('/api/config', configRoutes)

app.use((err, _req, res, _next) => {
  console.error('[envesty]', err)
  res.status(500).json({ error: String(err.message || err) })
})

app.listen(PORT, () => {
  const sys = getSystemConfig()
  console.log('')
  console.log('  Envesty — API server')
  console.log(`  http://localhost:${PORT}/api/health`)
  console.log(`  output ${sys.output.width}x${sys.output.height}`)
  console.log('')
})
