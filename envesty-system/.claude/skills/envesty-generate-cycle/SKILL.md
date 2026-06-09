---
name: envesty-generate-cycle
description: Plan and write the next content cycle — carousels and reels for LinkedIn and/or Instagram. Triggered when the user says "generate cycle", "plan next cycle", "make content for this week", "generate content", or similar.
---

# envesty-generate-cycle

Generates a new content cycle with a mix of carousels and reels for LinkedIn, Instagram, or both. Runs entirely through Claude — no server required. After generating, shows a preview artifact for approval before writing any files.

**If the user says "no check", "skip", "quick", or "just generate" anywhere in their message — set bypass=true and skip the intake form entirely.**

---

## Step 0: Bypass detection

Scan the user's message. If it contains: "no check", "skip intake", "skip questions", "quick", "just generate", "no questions" → bypass=true. Skip to Step 2. Default platform to LinkedIn if not mentioned.

---

## Step 1: Intake form (skip if bypass=true)

Use the **AskUserQuestion** tool with four questions in a single call. **Platform is always first.**

**Q1** — header: `"Platform"`, multiSelect: false
- `LinkedIn` — professional long-form, portrait carousels, technical captions
- `Instagram` — visual-first, square/portrait format, hashtag captions
- `Both` — generate platform-specific captions for each slot

**Q2** — header: `"Cycle length"`, multiSelect: false
- `3 days` — 3 content slots
- `5 days` — 5 content slots
- `7 days` — 7 content slots
- `Custom` — user will specify in follow-up

**Q3** — header: `"Content mix"`, multiSelect: false
- `All carousels` — every slot is a carousel
- `Mostly carousels` — 1 reel, rest carousels
- `Even split` — roughly 50/50 reels and carousels
- `Mostly reels` — 1 carousel, rest reels

**Q4** — header: `"Focus topics"`, multiSelect: true
- `Compliance & legal basics`
- `Founder story / POV`
- `Pricing & transparency`
- `Market intel & regulations`
- `Free choice` — I'll describe below

After receiving answers:
- If Q2 = Custom, ask a single follow-up: "How many slots total?"
- Calculate carousel/reel counts from Q3 + slot count.

Confirm in one line: *"Got it — [platform], [N] slots ([X carousels, Y reels]), focused on [topics]. Generating now…"*

---

## Step 2: Load context (always run, no server needed)

Read these files before generating anything:

1. `brand/envesty_brand_kit.md` — voice, guardrails, hook formulas, CTAs, pillars. **Guardrails are non-negotiable.**
2. `brand/envesty_dossier.md` — market context, competitor positioning.
3. Latest `insights/<YYYY-MM>_reddit-digest.md` — current audience signal. If none, proceed without it and note in preview.
4. `memory/what-worked.json` — top-performing patterns. Bias at least one slot toward proven shapes.
5. `config/system.json` — default_slide_count.

Determine the next cycle name:
```bash
ls envesty-system/content-queue/ | sort | tail -1
```
Increment cycle number (or use `01` if none exist). Format: `<YYYY-MM>_cycle-NN`.

Check last cycle's slots for topic repetition:
```bash
ls envesty-system/content-queue/<last-cycle>/
```

### 2b. Pull relevant guides and knowledge from the asset library

Read `asset-library/index.md`. Pick relevant files by topic and content type, read those in full.

- For reel slots → always check guides tagged: `reel`, `hook`, `delivery`, `script`, `on-camera`
- For Instagram slots → check guides tagged: `instagram`, `hashtag`, `caption`, `visual-hook`
- For any topic → check knowledge files matching the topic domain

Do not read every file. If the index is empty or missing, skip silently and note it in the preview.

---

## Step 3: Generate all content (in memory — do not write files yet)

Brainstorm 2× the required slot count, cull to the best N. Generate full content for each.

### Platform content rules

#### LinkedIn
- Captions: long-form (150–400 words), professional, data-specific. Minimal hashtags (3–5 max, at the end).
- Hooks: specific + professional — number-led, counter-narrative, or insider mechanic (see brand kit formulas).
- Carousel slides: 5–8 slides. Portrait 1080×1350.
- Reel hook window: 3 seconds. Duration target: 30–90s.

#### Instagram
- Captions: punchy opener (first 125 chars must hook before "more"), conversational, end with 10–20 relevant hashtags.
- Hashtag mix: 3–5 broad (`#startupindia`, `#entrepreneur`), 5–8 niche (`#pvtltd`, `#companyregistration`), 2–3 branded (`#envesty`).
- Hooks: visual/emotional, stop-the-scroll — the first slide must work as a standalone image in the feed.
- Carousel: every slide must tease the next ("swipe to see →"). 5–10 slides. Square 1080×1080 or portrait 1080×1350.
- Reel hook window: 1–2 seconds (tighter than LinkedIn). Duration target: 15–60s. On-screen text is critical — many watch on mute.
- CTAs: "Save this 🔖", "Share with a founder you know", "Drop a 💙 if this helped"

#### Both
- Generate a `caption_linkedin` and a `caption_instagram` in the slot — same core message, platform-adapted tone.
- `caption.md` will have both sections clearly labelled.

---

### slot.json schema

Add `platform` to meta. For "Both" platform, add both caption fields:

```jsonc
{
  "type": "carousel | reel",
  "platform": "linkedin | instagram | both",
  "meta": {
    "cycle": "<cycle-name>",
    "slot": "<NN_slug>",
    "topic": "string",
    "audience": "string from brand kit",
    "pillar": "education | founder | proof | transparency | market_intel",
    "template": "T01_Cover"   // carousel only
  },
  // carousel fields:
  "slides": [ ... ],
  // reel fields:
  "hook": "Opening line spoken on camera",
  "talking_points": [ "..." ],
  "on_screen_text": [ "..." ],
  "duration_target": "30s | 60s",
  // caption — use one of these:
  "caption": "Single-platform caption",
  // OR for Both:
  "caption_linkedin": "Long-form professional caption...",
  "caption_instagram": "Punchy opener...\n\n#startupindia #pvtltd #envesty",
  "hooks": ["alt hook 1", "alt hook 2", "alt hook 3"],
  "cta": "string from brand kit CTA library"
}
```

**carousel.md** — slide-by-slide brief (platform note at top if Instagram):
```
# <topic>
Platform: Instagram | LinkedIn | Both

**Slide 1 — Cover**
Headline: ...   [Instagram: must work standalone in feed]
Subhead: ...

**Slide 2 — ...**
[Instagram: tease next slide at bottom]
...
```

**script.md** (reel slots):
```
# <topic> — Reel Script
Platform: Instagram | LinkedIn | Both

**Hook (0–2s Instagram / 0–3s LinkedIn)**
[Spoken] ...
[On-screen text] ...

**Body**
- Point 1: ...
- Point 2: ...
[On-screen overlays] ...

**CTA**
[Spoken] ...
[On-screen] ...
```

**caption.md:**
```
# Caption

## LinkedIn
[long-form caption]

## Instagram
[punchy caption]

#hashtag1 #hashtag2 ...
```
*(Single section only if platform is not "Both")*

---

## Step 4: Preview artifact

Show all slots using the **show_widget** tool. Build an HTML preview widget:

```html
<!-- Header -->
<div>Cycle: <strong>[cycle-name]</strong> · [N] slots · [platform badge] · [X carousels, Y reels]</div>

<!-- One card per slot -->
<div class="slot-card">
  <div class="badges">
    <span class="badge-type">[CAROUSEL | REEL]</span>
    <span class="badge-platform">[LINKEDIN | INSTAGRAM | BOTH]</span>
  </div>
  <h3>[NN — topic]</h3>
  <div class="pillar">[pillar]</div>
  <!-- Carousel: hook headline + slide count -->
  <!-- Reel: hook line + duration -->
  <div class="caption-preview">[First 100 chars of caption…]</div>
</div>

<button onclick="sendPrompt('Approved — publish cycle to content queue')">✓ Approve & Publish</button>
<button onclick="sendPrompt('I want to make changes before publishing')">✗ Request Changes</button>
```

Style: dark background (#0c0e12), accent blue (#3d7bff), white text. Carousel badge blue, reel badge purple. LinkedIn platform badge teal, Instagram badge pink, Both badge gradient.

After widget: *"[N] slots ready for review — approve to publish or tell me what to change."*

---

## Step 5a: On approval

Write all files using the Write tool:
```
envesty-system/content-queue/<cycle>/<NN_slug>/slot.json
envesty-system/content-queue/<cycle>/<NN_slug>/carousel.md   (carousel only)
envesty-system/content-queue/<cycle>/<NN_slug>/script.md     (reel only)
envesty-system/content-queue/<cycle>/<NN_slug>/caption.md
```

Confirm: *"Published — [cycle-name], [N] slots written to content-queue."*

---

## Step 5b: On change request

Ask what to change. Apply, re-show the preview widget. Repeat until approved. Never write files until explicit approval.

---

## Quality bar

- Every headline earns its place — use brand kit hook formulas, not generic tips.
- Mix templates across carousel slots.
- At least 40% founder-led slots (first-person, Sushant or Mohit).
- Bias at least one slot toward top `what-worked.json` patterns.
- **Guardrails override everything.** No fabricated stats, no stock-photo people, no unearned scale claims.
- Instagram first slides must function as standalone feed images — visually complete, not dependent on a swipe.
- Instagram reel hooks must land in 1–2 seconds. LinkedIn reel hooks have 3.
