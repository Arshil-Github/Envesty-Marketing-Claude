const express = require('express')
const fs = require('fs')
const path = require('path')

const { fetchSubreddit } = require('../lib/redditClient')
const { scorePosts } = require('../lib/aiAnalyzer')
const { applyPainFilter } = require('../lib/painFilter')
const { getSubreddits } = require('../lib/configStore')
const { RAW_SCRAPES } = require('../lib/paths')
const { ensureDir } = require('../lib/fileSystem')

const router = express.Router()

router.post('/fetch', async (req, res, next) => {
  try {
    const cfg = getSubreddits()
    const subs = req.body?.subreddits?.length
      ? req.body.subreddits
      : cfg.list.map((s) => (typeof s === 'string' ? { name: s } : s))
    const targetCount = req.body?.target_count || cfg.default_target_count || 50
    const sorts = req.body?.sorts || cfg.default_sorts || ['new']
    const wantScore = req.body?.score !== false
    const wantPrefilter = req.body?.prefilter !== false

    const all = []
    const fetchErrors = []
    for (const s of subs) {
      const name = s.name || s
      const minScore = s.filters?.min_score || 0
      try {
        const posts = await fetchSubreddit(name, { targetCount, sorts, minScore })
        all.push(...posts)
      } catch (e) {
        fetchErrors.push({ subreddit: name, error: e.message })
      }
    }

    // Keyword prefilter — drop posts that don't mention any Envesty service area
    const { kept, dropped } = wantPrefilter
      ? applyPainFilter(all)
      : { kept: all.map((p) => ({ ...p, matched_pillars: [], matched_geo: false })), dropped: [] }

    let scored = []
    let scoringError = null
    if (wantScore && kept.length) {
      try {
        scored = await scorePosts(kept.slice(0, 60))
      } catch (e) {
        scoringError = e.message
        console.warn('[reddit] scoring failed:', e.message)
      }
    }
    const byId = new Map(scored.map((s) => [s.id, s]))
    const enrichedKept = kept.map((p) => ({ ...p, ...(byId.get(p.id) || {}) }))

    // Sort kept posts by relevance_score desc when present
    enrichedKept.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))

    ensureDir(RAW_SCRAPES)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outFile = path.join(RAW_SCRAPES, `${stamp}.json`)
    const payload = {
      fetched_at: stamp,
      stats: {
        raw_count: all.length,
        kept_count: enrichedKept.length,
        dropped_count: dropped.length,
        scored_count: scored.length,
        fetch_errors: fetchErrors,
        scoring_error: scoringError,
      },
      posts: enrichedKept,
      dropped: dropped.map((p) => ({ id: p.id, subreddit: p.subreddit, title: p.title })),
    }
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2))

    res.json({
      ok: true,
      count: enrichedKept.length,
      raw_count: all.length,
      dropped_count: dropped.length,
      scoring_error: scoringError,
      fetch_errors: fetchErrors,
      file: outFile,
      posts: enrichedKept,
    })
  } catch (e) {
    next(e)
  }
})

router.get('/posts', (_req, res, next) => {
  try {
    ensureDir(RAW_SCRAPES)
    const files = fs.readdirSync(RAW_SCRAPES).filter((f) => f.endsWith('.json')).sort()
    const latest = files[files.length - 1]
    if (!latest) return res.json({ posts: [], file: null })
    const data = JSON.parse(fs.readFileSync(path.join(RAW_SCRAPES, latest), 'utf8'))
    res.json({ posts: data.posts || [], file: latest, stats: data.stats })
  } catch (e) {
    next(e)
  }
})

router.get('/scrapes', (_req, res, next) => {
  try {
    ensureDir(RAW_SCRAPES)
    const files = fs.readdirSync(RAW_SCRAPES).filter((f) => f.endsWith('.json')).sort()
    res.json({ files })
  } catch (e) {
    next(e)
  }
})

module.exports = router
