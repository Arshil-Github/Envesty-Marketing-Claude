const fs = require('fs')
const path = require('path')
const { CONFIG_DIR } = require('./paths')

function readJSON(name, fallback) {
  const p = path.join(CONFIG_DIR, name)
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJSON(name, data) {
  const p = path.join(CONFIG_DIR, name)
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return data
}

function getSubreddits() {
  return readJSON('subreddits.json', { list: [], default_sorts: ['new'], default_target_count: 50 })
}
function setSubreddits(data) {
  return writeJSON('subreddits.json', data)
}
function getSystemConfig() {
  return readJSON('system.json', {
    post_type: 'linkedin_static',
    output: { width: 1080, height: 1350 },
    default_slide_count: 6,
    default_template: 'T01_Cover',
    ports: { server: 4001, vite: 5273 },
  })
}
function setSystemConfig(data) {
  return writeJSON('system.json', data)
}
function getAIProvider() {
  return readJSON('ai-provider.json', { provider: 'gemini', model: 'gemini-2.5-flash', temperature: 0.3 })
}
function setAIProvider(data) {
  return writeJSON('ai-provider.json', data)
}
function getPainPoints() {
  return readJSON('pain-points.json', { pillars: {}, require_geo_match: false })
}
function setPainPoints(data) {
  return writeJSON('pain-points.json', data)
}

module.exports = {
  getSubreddits,
  setSubreddits,
  getSystemConfig,
  setSystemConfig,
  getAIProvider,
  setAIProvider,
  getPainPoints,
  setPainPoints,
}
