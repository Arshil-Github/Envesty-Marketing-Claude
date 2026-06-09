// Provider-agnostic LLM wrapper. Dispatches to Gemini or OpenAI per config.
// Used only by Reddit analysis — content/cycle generation happens in Claude
// via skills, not here.

const fs = require('fs')
const path = require('path')
const { getAIProvider } = require('./configStore')
const { BRAND_DIR } = require('./paths')

async function callGemini({ apiKey, model, prompt, temperature }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, responseMimeType: 'application/json' },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`gemini -> ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callOpenAI({ apiKey, model, prompt, temperature }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`openai -> ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json?.choices?.[0]?.message?.content || ''
}

async function analyze(prompt) {
  const cfg = getAIProvider()
  const provider = cfg.provider || 'gemini'
  const temperature = cfg.temperature ?? 0.3

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY missing — set it in .env or switch ai-provider.json')
    const model = cfg.model || 'gemini-2.5-flash'
    const text = await callGemini({ apiKey, model, prompt, temperature })
    return safeParseJSON(text)
  }
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY missing — set it in .env or switch ai-provider.json')
    const model = cfg.model || 'gpt-4o-mini'
    const text = await callOpenAI({ apiKey, model, prompt, temperature })
    return safeParseJSON(text)
  }
  throw new Error(`unknown provider: ${provider}`)
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {}
    }
    return { raw: text }
  }
}

function readBrandContext() {
  const p = path.join(BRAND_DIR, 'envesty_brand_kit.md')
  if (!fs.existsSync(p)) return ''
  return fs.readFileSync(p, 'utf8')
}

// Score posts grounded in Envesty's four service pillars. Each post that
// reaches this function has already passed the keyword prefilter, so the AI
// is only asked to rank signal among already-relevant candidates.
async function scorePosts(posts) {
  if (!posts.length) return []
  const brand = readBrandContext()

  const prompt = `You are scoring Reddit posts for an Indian B2B services company called Envesty. Envesty helps first-time Indian founders, solo entrepreneurs, and MSMEs — based in Noida — across four pillars:

  1. LEGAL — company incorporation (Pvt Ltd, LLP), GST registration & filings, TDS, ROC/MCA compliance, MOA/AOA, founder agreements, trademarks, DPDP Act compliance, legal advisory.
  2. TECHNOLOGY — websites, SaaS MVPs, AI/automation, UI/UX design, replacing dev-shop/freelancer pain.
  3. MARKETING — social, performance ads, SEO, growth hacks, email, brand positioning, founder-led LinkedIn.
  4. CONSULTATION — idea validation, business model, fundraising prep (angel/seed/Startup India), market expansion, fractional co-founder support.

A post is RELEVANT if it expresses a pain point, frustration, question, or unmet need that Envesty could plausibly help with. A post is NOT relevant if it's promotion of someone else's product, AMA, news headline, generic motivation, or pain in a domain Envesty doesn't serve (e.g. consumer purchase advice, medical, dating).

Brand context (use for nuance):
${brand.slice(0, 2500) || '(brand kit empty)'}

For each post return JSON with:
  - id: the post id (unchanged)
  - relevance_score: integer 0–10 (10 = textbook Envesty client question; 0 = unrelated)
  - pillar: which of legal | technology | marketing | consultation best matches, or "none"
  - india_signal: boolean — does the post mention India, Indian context, INR, Indian regulator, or an Indian city
  - problem_summary: one sentence in plain English stating the founder's actual pain
  - tags: 3–6 lowercase keywords (e.g. ["gst-registration", "first-mvp", "pricing-confusion"])
  - content_angle: one sentence on how this could become a LinkedIn carousel for Envesty
  - should_use: boolean — true only if relevance_score >= 6 AND pillar != "none"

Respond strictly as: { "scored": [ {...one object per post...} ] }.

Posts:
${posts.map((p) => `id=${p.id}\nr/${p.subreddit} | ${p.title}\n${(p.body || '').slice(0, 800)}\n---`).join('\n')}`

  const out = await analyze(prompt)
  return out.scored || []
}

module.exports = { analyze, scorePosts }
