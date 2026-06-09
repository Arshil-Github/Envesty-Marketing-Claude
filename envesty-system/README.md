# Envesty Marketing System

A local content engine for Envesty's LinkedIn presence. Combines:

- **Reddit research** — pulls signal from configurable subreddits, scores posts with an LLM, builds a digest.
- **Cycle generator** — uses your brand kit + Reddit digest + past-performance memory to plan a batch of content slots.
- **Carousel renderer** — turns each slot into a polished static carousel by rendering React templates and screenshotting them.
- **Template editor** — write / preview / save new React templates from inside the web app.
- **Asset library** — drop files into an inbox; tag and index them automatically.
- **Insights** — log post performance, surface what's working, feed it back into the next cycle.

The system is driven two ways:

1. **Web app** at `http://localhost:5273` — visual editor for everything above.
2. **Skills** (in `.claude/skills/`) — installable into Claude Code / Cowork so you can run the whole pipeline by chat.

## Quick start

```bash
# 1. Configure
cp .env.example .env
# fill in:
#   GEMINI_API_KEY or OPENAI_API_KEY  (for Reddit post scoring)
#   REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET  (Reddit blocks unauth'd server
#                                             requests with 403; create a
#                                             "script" app at
#                                             https://www.reddit.com/prefs/apps)

# 2. Launch
./open-envesty.command
```

First boot installs dependencies (~2 minutes; Puppeteer downloads Chromium).

## Configuration

All knobs live under `config/`:

| File | What it controls |
|---|---|
| `config/subreddits.json` | Which subreddits to mine, weights, filters |
| `config/system.json` | Output dimensions, default slide count, ports |
| `config/ai-provider.json` | `openai` or `gemini`, which model, temperature |

You can edit these by hand, through the Settings tab in the web app, or by asking Claude (`"add subreddit r/saas with weight 0.8"`).

## Folder layout

```
envesty-system/
├── brand/                  Brand kit (fill out envesty_brand_kit.md)
├── config/                 Subreddits, system, AI provider
├── content-queue/          Generated cycles (each cycle = N slots)
├── insights/               Reddit digests, performance rollups
├── memory/                 what-worked.json — append-only performance log
├── output/                 Rendered carousel PNGs
├── asset-library/          inbox/ → analyzed/ + assets.json
├── raw-scrapes/            Raw Reddit JSON dumps
├── tools/web-app/          Vite + Express unified app
└── .claude/skills/         Skill source folders (each has SKILL.md)
```

## Skills

Install any of these into Claude Code / Cowork to drive the system by chat. They live in `.claude/skills/<name>/SKILL.md`.

| Skill | Trigger |
|---|---|
| `envesty-reddit-research` | "fetch reddit", "scan reddit for X" |
| `envesty-generate-cycle` | "generate cycle", "plan next cycle" |
| `envesty-render-carousel` | "render slot 03" |
| `envesty-analyze-performance` | "log metrics", "what's working" |
| `envesty-asset-library` | "process new assets" |
| `envesty-system-control` | "add subreddit r/saas", "switch ai provider" |
| `envesty-template-scaffold` | "make a new template that…" |
| `envesty-skill-manager` | "list skills", "bundle skills" |

To distribute a skill, run the bundler:

```bash
cd .claude/skills
zip -r ../../envesty-reddit-research.skill envesty-reddit-research/
```

## Slot schema

Each content slot is a folder under `content-queue/YYYY-MM_cycle-NN/NN_slug/`:

```
NN_slug/
├── slot.json          # canonical slot data
├── carousel.md        # human-readable slide brief
├── caption.md         # post copy
└── notes.md           # context, sources
```

See `tools/web-app/SPEC.md` for the slot.json schema (also documented in-app).
