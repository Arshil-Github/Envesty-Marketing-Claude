# Envesty Marketing System

A local AI-powered content engine for Envesty's LinkedIn and Instagram presence. The system is built to be run entirely through conversation with Claude — no manual file editing, no complex commands. You describe what you want, Claude handles the rest.

---

## How it works

Almost everything in this system runs through **Claude directly** — reading and writing files in this folder. There is no cloud service, no SaaS subscription, and no mandatory backend.

The local web server (`./open-envesty.command`) is optional and only needed for two specific tasks:
- **Rendering carousels** — screenshots slides to PNG via Puppeteer
- **Fetching Reddit** — makes authenticated API calls to Reddit

Everything else — generating content, writing scripts, analyzing performance, publishing to Notion, managing assets — runs purely through Claude.

---

## Prerequisites

| Requirement | Purpose | Required? |
|---|---|---|
| [Claude Desktop](https://claude.ai/download) with Cowork mode | Runs the skills | **Yes** |
| Gemini API key **or** OpenAI API key | Scores Reddit posts | Only for Reddit research |
| Reddit API credentials | Fetches Reddit posts without 403 | Only for Reddit research |
| Notion MCP connected in Claude | Publishes to Notion | Only for Notion publishing |
| Node.js 18+ | Runs the local web server | Only for rendering |

---

## Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd envesty-system
cp .env.example .env
```

Open `.env` and fill in the keys you need:

```env
# For Reddit research (scoring posts with AI)
GEMINI_API_KEY=your_key_here
# OR
OPENAI_API_KEY=your_key_here

# For fetching Reddit (required since 2023 — Reddit blocks unauthenticated server requests)
# Create a "script" app at https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

### 2. Install the skills

Each skill in `skill-bundles/` is a `.skill` file (installable zip). In Claude Desktop with Cowork:

1. Open the `Envesty-Marketing` folder in Cowork
2. For each `.skill` file in `skill-bundles/`, click **Save skill** to install it

Or install them all at once by dragging the folder into Claude's skills settings.

> **Tip:** The system works immediately after installing skills. You don't need to start the server unless you're rendering carousels or running Reddit research.

### 3. Fill in the brand kit

Open `envesty-system/brand/envesty_brand_kit.md` and ensure these sections are accurate:
- Company identity and stage
- Founders' names and LinkedIn handles
- Voice, tone, and forbidden phrases
- Content pillars and their target split
- Hook formulas
- CTA library

Claude reads this file before generating any content. **The Guardrails section is enforced automatically** — fabricated stats, stock-photo people, and unearned tenure claims will be rewritten before content is shown to you.

### 4. (Optional) Start the web server

Only needed for rendering and Reddit research:

```bash
./open-envesty.command
```

This installs dependencies on first run (~2 minutes, Puppeteer downloads Chromium), starts the Express API on `:4001` and Vite on `:5273`, then opens the browser.

### 5. (Optional) Connect Notion

To use `envesty-publish-notion`, add the Notion MCP to Claude via **Settings → Connections**. The skill will automatically find your databases by name.

---

## The content pipeline

The system runs a repeating loop. Claude knows where you are in it and will suggest the next step automatically.

```
1. RESEARCH     Weekly — pull Reddit signal → insights/
2. GENERATE     Create a content cycle → content-queue/
3. REVIEW       You read and approve in chat
4. RENDER       Turn carousels into PNGs → output/        [server required]
5. POST         You post to LinkedIn / Instagram
6. LOG METRICS  Paste your numbers → memory/
7. ANALYZE      Claude surfaces what worked → feeds next cycle
└── back to 1
```

Open the folder in Cowork and Claude will greet you with exactly where you stand in this loop.

---

## Skills

These are the available skills and the phrases that trigger them. You never need to remember exact commands — conversational descriptions work fine.

### `envesty-assistant`
**Pipeline status and daily brief.** The starting point for every session.

| Say this | What happens |
|---|---|
| "what's next" | Status check + single recommended action |
| "morning" / "help" / "status" | Full pipeline brief |
| "where are we" | Explicit pipeline status |
| "walk me through the system" | Onboarding mode — explains everything from scratch |

Claude reads the current state directly from files and tells you the earliest incomplete step.

---

### `envesty-generate-cycle`
**Plan and write a content cycle.** Generates carousels and reels, previews them for approval, then writes files.

| Say this | What happens |
|---|---|
| "generate cycle" / "make content for this week" | Full intake form → generate → preview |
| "generate cycle, no check" | Skips questions, uses defaults, goes straight to preview |
| "generate 7 Instagram reels" | Skips to relevant defaults |

**The intake form asks (in order):**
1. **Platform** — LinkedIn / Instagram / Both
2. **Cycle length** — 3, 5, or 7 days (= number of slots)
3. **Content mix** — all carousels / mostly carousels / even split / mostly reels
4. **Focus topics** — multi-select from compliance, founder story, pricing, market intel

After generating, Claude shows a **visual preview widget** in chat with all slots as cards. You can approve to publish or request changes. **Nothing is written to files until you approve.**

**Platform differences enforced automatically:**

| | LinkedIn | Instagram |
|---|---|---|
| Caption | Long-form, 150–400 words, 3–5 hashtags | Punchy 125-char opener, 10–20 hashtags |
| Carousel | 5–8 slides, 1080×1350 | 5–10 slides, swipe-tease each slide |
| Reel hook | 3-second window | 1–2 second window |
| Reel length | 30–90s | 15–60s |
| On-screen text | Supplementary | Critical (mute viewers) |

**"Both"** generates separate LinkedIn and Instagram captions in the same slot file.

---

### `envesty-publish-notion`
**Push a cycle to Notion.** One page per slot, routed to the correct database.

| Say this | What happens |
|---|---|
| "publish to Notion" | Cycle select → date scheduling → create pages |
| "publish cycle 02 to Notion" | Skips cycle selection |
| "mark slot 3 as ready to post" | Updates Status on the existing Notion page |

**Database routing (automatic):**
- LinkedIn slots → `New Post` database
- Instagram slots → `Instagram Schedule Database`
- "Both" slots → pages created in both databases

**Notion page properties set on publish:**

| Property | Value |
|---|---|
| Title | Slot topic |
| Post Date | Your scheduled date |
| Post Type | `Carousel` or `Reel` |
| Status | `Script Written` |

**Date scheduling options** (asked via clickable form):
- Auto-schedule from a start date (one slot per day)
- Start from today / tomorrow
- Set each date individually

Already-published slots are skipped automatically. Published state is tracked in `memory/notion-published.json`.

---

### `envesty-reddit-research`
**Pull signal from Reddit.** Requires the server and Reddit API credentials.

| Say this | What happens |
|---|---|
| "fetch reddit" / "run reddit research" | Intake → fetch → digest |
| "what is reddit saying about GST registration" | Targeted research |

**Intake asks:**
1. **Subreddit scope** — use configured list / add extras / custom list
2. **Post volume** — 25 (quick) / 50 (standard) / 100 (deep dive)

Produces a digest at `insights/<YYYY-MM>_reddit-digest.md` with top themes, content angles, and quick-win post ideas. If a digest exists for the current month, a new dated section is appended rather than overwriting.

**Configured subreddits** (edit in `config/subreddits.json` or say "add subreddit r/X"):

| Subreddit | Weight |
|---|---|
| r/Entrepreneur | 0.7 |
| r/smallbusiness | 0.7 |

---

### `envesty-render-carousel`
**Render carousel slides to PNG.** Requires the server running.

| Say this | What happens |
|---|---|
| "render the latest cycle" | Intake → render all slots |
| "render slot 03 of cycle 02" | Skips intake, renders directly |
| "render unrendered slots" | Only processes slots without existing PNGs |

**Intake asks:**
1. **Which cycle** — latest / previous / other
2. **Which slots** — all / unrendered only / specific

Output written to `output/<cycle>/<slot>/carousel/*.png`.

---

### `envesty-analyze-performance`
**Log metrics and surface what's working.** No server needed — writes directly to files.

| Say this | What happens |
|---|---|
| "what's working" | Read-only analysis, no file writes |
| "log metrics for slot 03: 12k impressions, 480 likes" | Appends to what-worked.json |
| *(paste a LinkedIn CSV export)* | Batch logging from export |
| "analyze last cycle" | Full cycle performance rollup |

**Intake asks:**
1. What to do — log metrics / see what's working / full cycle analysis
2. Which cycle (if logging or analyzing)

Logged patterns feed directly into the next cycle generation — Claude biases future content toward proven shapes.

---

### `envesty-asset-library`
**Process and index files dropped in the inbox.** No server needed.

| Say this | What happens |
|---|---|
| "process inbox" / "process new assets" | Classify and move all inbox files |
| "what's in the asset library" | Read-only listing by category |
| "re-tag filename.pdf" | Reprocess a single file |

Drop files into `asset-library/inbox/`, then run this skill. Each file is read, classified, and moved:

| Category | What goes here |
|---|---|
| `guides/` | How-to content — hook collections, reel delivery guides, script templates, caption formulas |
| `knowledge/` | Facts and context — compliance notes, market research, case studies, audience surveys |
| `misc/` | Anything that doesn't cleanly fit |

After processing, `asset-library/index.md` is rebuilt. **When generating content, Claude reads this index first**, picks relevant files by topic and content type, then reads those in full before writing anything.

---

### `envesty-system-control`
**Change configuration from chat.** No server needed for most changes.

| Say this | What changes |
|---|---|
| "add subreddit r/IndiaStartups with weight 0.8" | `config/subreddits.json` |
| "remove subreddit r/marketing" | `config/subreddits.json` |
| "switch AI provider to OpenAI" | `config/ai-provider.json` |
| "use gemini-2.5-pro" | `config/ai-provider.json` |
| "set output to 1080x1080" | `config/system.json` |
| "set default slide count to 8" | `config/system.json` |
| "update brand voice — add 'incisive' to adjectives" | `brand/envesty_brand_kit.md` |
| "what's our current config" | Read-only dump |

---

### `envesty-template-scaffold`
**Create a new React carousel slide template.** Requires the server to be running for the write step.

| Say this | What happens |
|---|---|
| "make a new template that looks like a big quote" | Intake → scaffold → write JSX |
| "add a comparison template with icons" | Skips intake if described in detail |

**Intake asks:**
1. **Slide content type** — stat / comparison / quote / story / CTA
2. **Visual weight** — bold & minimal / structured / conversational
3. **Template name** — auto-name or specify

Templates are written to `tools/web-app/src/templates/T<NN>_<Name>.jsx`. Vite HMR picks them up immediately.

**Existing templates:**

| Template | Slide type |
|---|---|
| `T01_Cover` | Opening cover with headline + subhead |
| `T02_BigStat` | Hero number with context |
| `T03_Comparison` | Before/after or side-by-side |
| `T04_Quote` | Pull quote with attribution |
| `T05_CTA` | Closing call to action |

---

### `envesty-skill-manager`
**Add, edit, or bundle skills.**

| Say this | What happens |
|---|---|
| "list skills" | Enumerate all skills with descriptions |
| "add a new skill called envesty-X that does Y" | Scaffold a new SKILL.md |
| "edit the reddit research skill to also produce a CSV" | Modify an existing SKILL.md |
| "bundle all skills" | Zip each skill into `skill-bundles/` |

---

## Configuration files

All configuration lives in `envesty-system/config/`:

### `config/system.json`
```json
{
  "post_type": "linkedin_static",
  "output": { "width": 1080, "height": 1350 },
  "default_slide_count": 6,
  "default_template": "T01_Cover",
  "ports": { "server": 4001, "vite": 5273 }
}
```

### `config/ai-provider.json`
```json
{
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "temperature": 0.3
}
```
Set `provider` to `openai` and update `model` to switch providers.

### `config/subreddits.json`
```json
{
  "list": [
    { "name": "Entrepreneur", "weight": 0.7, "filters": { "min_score": 10 } }
  ],
  "default_sorts": ["new", "top"],
  "default_target_count": 50
}
```

---

## Folder structure

```
envesty-system/
├── brand/
│   ├── envesty_brand_kit.md     ← Voice, guardrails, pillars, hooks, CTAs (edit this)
│   └── envesty_dossier.md       ← Market context and competitor notes
├── config/
│   ├── system.json              ← Output dimensions, ports, defaults
│   ├── ai-provider.json         ← Gemini or OpenAI, model, temperature
│   └── subreddits.json          ← Subreddits to research, weights, filters
├── content-queue/
│   └── YYYY-MM_cycle-NN/
│       └── NN_slug/
│           ├── slot.json        ← Canonical slot data (type, platform, slides/script)
│           ├── carousel.md      ← Slide-by-slide brief for carousels
│           ├── script.md        ← Spoken script for reels
│           └── caption.md       ← LinkedIn and/or Instagram captions
├── insights/
│   ├── YYYY-MM_reddit-digest.md ← Reddit research output
│   └── YYYY-MM_performance.md   ← Performance analysis rollups
├── memory/
│   ├── what-worked.json         ← Append-only performance log
│   └── notion-published.json    ← Tracks what's been pushed to Notion
├── output/
│   └── <cycle>/<slot>/carousel/ ← Rendered PNG files
├── asset-library/
│   ├── inbox/                   ← Drop files here for processing
│   ├── guides/                  ← How-to content (hooks, delivery, scripts)
│   ├── knowledge/               ← Reference material (compliance, research)
│   ├── misc/                    ← Everything else
│   ├── assets.json              ← Structured index of all processed files
│   └── index.md                 ← Claude's retrieval map (auto-rebuilt on process)
├── raw-scrapes/                 ← Raw Reddit JSON dumps
├── tools/web-app/               ← Vite + Express app (optional, for rendering)
│   └── src/templates/           ← React carousel templates (T01–T05 + custom)
├── .claude/
│   └── skills/                  ← Live skill source (SKILL.md per skill)
├── .env                         ← API keys (never commit this)
├── .env.example                 ← Key template
└── open-envesty.command         ← Starts the local server (double-click or zsh)
```

---

## Typical weekly workflow

```
Monday
  → "fetch reddit"
    Claude asks: configured list or custom? how many posts?
    → Produces insights/2026-06_reddit-digest.md

  → "generate content for this week"
    Claude asks: LinkedIn or Instagram? days? mix? topics?
    → Shows preview widget with all slots
    → You approve or request changes
    → Files written to content-queue/

Tuesday
  → "publish to Notion"
    Claude shows what's new vs already published
    Claude asks: auto-schedule or set dates individually?
    → Pages created in New Post (LinkedIn) or Instagram Schedule Database

Wednesday–Friday
  → Post from Notion to LinkedIn / Instagram

Following Monday
  → "log metrics — slot 01 got 14k impressions, 320 saves"
    or paste LinkedIn export CSV
  → "what's working?"
    → Claude surfaces top patterns, updates what-worked.json
  → Back to Reddit research
```

---

## Adding to the system

### Add a subreddit
```
"add subreddit r/IndiaStartups with weight 0.9"
```

### Add a new slide template
```
"make a new template — big timeline layout, three steps side by side"
```

### Add guides or knowledge
Drop files into `asset-library/inbox/` then say:
```
"process inbox"
```
Claude classifies, tags, and indexes each file. From that point, it's automatically referenced when generating relevant content.

### Add or modify a skill
```
"add a new skill called envesty-X that does Y"
"edit the reddit research skill to also export a CSV"
"bundle all skills"
```

---

## Notes

- **Never commit `.env`** — it contains API keys. It's already in `.gitignore`.
- The `memory/` folder is intentionally append-only. Don't delete `what-worked.json` or you lose the performance history that makes cycle generation smarter over time.
- The `brand/envesty_brand_kit.md` file is read before every content generation run. Keep it accurate — it's the single source of truth for voice, guardrails, and positioning.
- `asset-library/index.md` is rebuilt automatically each time the asset library skill runs. Don't edit it by hand.
