const path = require('path')

// envesty-system/ root
const ROOT = path.resolve(__dirname, '../../../..')

module.exports = {
  ROOT,
  CONFIG_DIR: path.join(ROOT, 'config'),
  BRAND_DIR: path.join(ROOT, 'brand'),
  CONTENT_QUEUE: path.join(ROOT, 'content-queue'),
  INSIGHTS_DIR: path.join(ROOT, 'insights'),
  MEMORY_DIR: path.join(ROOT, 'memory'),
  OUTPUT_DIR: path.join(ROOT, 'output'),
  ASSET_LIBRARY: path.join(ROOT, 'asset-library'),
  RAW_SCRAPES: path.join(ROOT, 'raw-scrapes'),
  SKILLS_DIR: path.join(ROOT, '.claude', 'skills'),
  WEB_APP: path.join(ROOT, 'tools', 'web-app'),
  TEMPLATES_DIR: path.join(ROOT, 'tools', 'web-app', 'src', 'templates'),
}
