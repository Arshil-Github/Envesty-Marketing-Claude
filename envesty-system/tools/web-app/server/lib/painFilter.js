// Keyword prefilter — drops Reddit posts that don't mention any of Envesty's
// service areas (legal / technology / marketing / consultation). Runs before
// the AI scorer to keep the scoring cost down and the digest signal high.

const { getPainPoints } = require('./configStore')

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildMatcher(words) {
  if (!words?.length) return null
  // Word-boundary match, case-insensitive. Handles multi-word terms naturally.
  const pattern = '\\b(?:' + words.map(escapeRegex).join('|') + ')\\b'
  return new RegExp(pattern, 'i')
}

function tagPost(post, pillarMatchers, geoMatcher) {
  const hay = `${post.title}\n${post.body}`
  const matched_pillars = []
  for (const [pillar, rx] of Object.entries(pillarMatchers)) {
    if (rx && rx.test(hay)) matched_pillars.push(pillar)
  }
  const matched_geo = geoMatcher ? geoMatcher.test(hay) : false
  return { matched_pillars, matched_geo }
}

function applyPainFilter(posts) {
  const cfg = getPainPoints()
  const pillars = cfg.pillars || {}
  const matchers = {}
  for (const [name, words] of Object.entries(pillars)) {
    if (name === 'negative_geo' || name.startsWith('_')) continue
    matchers[name] = buildMatcher(words)
  }
  const geoMatcher = buildMatcher(pillars.negative_geo || [])
  const anyPillarConfigured = Object.values(matchers).some(Boolean)

  if (!anyPillarConfigured) {
    return { kept: posts.map((p) => ({ ...p, matched_pillars: [], matched_geo: false })), dropped: [] }
  }

  const kept = []
  const dropped = []
  for (const p of posts) {
    const tags = tagPost(p, matchers, geoMatcher)
    const passes = tags.matched_pillars.length > 0 && (!cfg.require_geo_match || tags.matched_geo)
    const enriched = { ...p, ...tags }
    if (passes) kept.push(enriched)
    else dropped.push(enriched)
  }
  return { kept, dropped }
}

module.exports = { applyPainFilter }
