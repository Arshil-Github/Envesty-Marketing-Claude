// Reddit fetcher with a three-step priority:
//   1. OAuth (oauth.reddit.com) if REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET are set.
//      Best — full JSON, score + num_comments + everything.
//   2. RSS feed (always open) if no OAuth creds.
//      Works unauthenticated. No score / no num_comments.
//   3. The legacy public .json endpoint is dead from server IPs since mid-2025;
//      we don't try it.

const UA = 'envesty-research/1.0 (by /u/anon)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let cachedToken = null
async function getOAuthToken() {
  const id = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) return null
  if (cachedToken && cachedToken.expires_at > Date.now() + 30_000) return cachedToken.access_token
  const basic = Buffer.from(`${id}:${secret}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`reddit oauth -> ${res.status} ${await res.text()}`)
  const data = await res.json()
  cachedToken = { access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 }
  return cachedToken.access_token
}

async function fetchListingJSON({ subreddit, sort, limit, after, token }) {
  const params = new URLSearchParams({ limit: String(limit), raw_json: '1' })
  if (after) params.set('after', after)
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com'
  const headers = { 'User-Agent': UA }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${base}/r/${subreddit}/${sort}.json?${params}`, { headers })
  if (!res.ok) throw new Error(`reddit ${subreddit}/${sort} -> ${res.status}`)
  const json = await res.json()
  const children = (json?.data?.children || []).map((c) => c.data)
  return {
    posts: children.map((d) => ({
      id: d.id,
      subreddit: d.subreddit,
      title: d.title || '',
      body: d.selftext || '',
      author: d.author,
      url: `https://www.reddit.com${d.permalink}`,
      score: d.score,
      num_comments: d.num_comments,
      created_utc: d.created_utc,
      over_18: !!d.over_18,
      stickied: !!d.stickied,
      is_self: !!d.is_self,
      via: token ? 'oauth' : 'json',
    })),
    after: json?.data?.after || null,
  }
}

// Tiny Atom parser — Reddit's RSS is well-formed and shallow, so plain regex
// is fine here. Avoids pulling an XML dep.
function parseAtomEntries(xml) {
  const entries = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let m
  while ((m = entryRegex.exec(xml)) !== null) {
    entries.push(m[1])
  }
  return entries.map((body) => {
    const pick = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)
      const mm = body.match(r)
      return mm ? mm[1] : ''
    }
    const linkMatch = body.match(/<link[^/]*?href="([^"]+)"/)
    const idRaw = pick('id') // e.g. "t3_abc123"
    const id = idRaw.replace(/^t3_/, '')
    const contentHTML = pick('content')
    const html = decodeXML(contentHTML)
    const text = htmlToText(html)
    const authorName = (body.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) || [])[1] || ''
    const categoryTerm = (body.match(/<category[^/]*?term="([^"]+)"/) || [])[1] || ''
    return {
      id,
      subreddit: categoryTerm,
      title: decodeXML(pick('title')),
      body: text,
      author: authorName.replace(/^\/u\//, ''),
      url: linkMatch ? linkMatch[1] : '',
      score: 0,
      num_comments: 0,
      created_utc: Math.floor(new Date(pick('updated') || pick('published')).getTime() / 1000) || 0,
      over_18: false,
      stickied: false,
      is_self: !!text,
      via: 'rss',
    }
  })
}

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

// Back-compat alias
const decodeXML = decodeEntities

function htmlToText(html) {
  // Reddit RSS double-encodes: XML wraps HTML entities, so we decode twice.
  const decoded = decodeEntities(html)
  return decodeEntities(
    decoded
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

async function fetchListingRSS({ subreddit, sort, limit }) {
  // Reddit's RSS supports limit. It caps at 100.
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.rss?limit=${Math.min(limit, 100)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/atom+xml' } })
  if (!res.ok) throw new Error(`reddit rss ${subreddit}/${sort} -> ${res.status}`)
  const xml = await res.text()
  return { posts: parseAtomEntries(xml), after: null }
}

async function fetchListing(subreddit, sort = 'new', limit = 50, after = null) {
  const token = await getOAuthToken()
  if (token) {
    return fetchListingJSON({ subreddit, sort, limit, after, token })
  }
  // Unauth: RSS (after-pagination not supported — Reddit's RSS doesn't paginate).
  return fetchListingRSS({ subreddit, sort, limit })
}

async function fetchSubreddit(subreddit, { targetCount = 50, sorts = ['new'], minScore = 0 } = {}) {
  const out = []
  const seen = new Set()
  for (const sort of sorts) {
    let after = null
    let safety = 0
    while (out.length < targetCount && safety < 10) {
      safety++
      const { posts, after: nextAfter } = await fetchListing(subreddit, sort, 50, after)
      for (const p of posts) {
        if (seen.has(p.id)) continue
        if (p.stickied || p.over_18) continue
        // Only apply min_score when we actually have scores (JSON/OAuth path).
        if (p.via !== 'rss' && p.score < minScore) continue
        seen.add(p.id)
        out.push(p)
        if (out.length >= targetCount) break
      }
      if (!nextAfter) break // RSS path always falls out here
      after = nextAfter
      await sleep(1100)
    }
    if (out.length >= targetCount) break
  }
  return out
}

module.exports = { fetchSubreddit, fetchListing }
