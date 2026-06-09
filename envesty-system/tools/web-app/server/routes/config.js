const express = require('express')
const {
  getSubreddits,
  setSubreddits,
  getSystemConfig,
  setSystemConfig,
  getAIProvider,
  setAIProvider,
  getPainPoints,
  setPainPoints,
} = require('../lib/configStore')

const router = express.Router()

router.get('/subreddits', (_req, res) => res.json(getSubreddits()))
router.put('/subreddits', (req, res) => res.json(setSubreddits(req.body)))

router.get('/system', (_req, res) => res.json(getSystemConfig()))
router.put('/system', (req, res) => res.json(setSystemConfig(req.body)))

router.get('/ai-provider', (_req, res) => res.json(getAIProvider()))
router.put('/ai-provider', (req, res) => res.json(setAIProvider(req.body)))

router.get('/pain-points', (_req, res) => res.json(getPainPoints()))
router.put('/pain-points', (req, res) => res.json(setPainPoints(req.body)))

module.exports = router
