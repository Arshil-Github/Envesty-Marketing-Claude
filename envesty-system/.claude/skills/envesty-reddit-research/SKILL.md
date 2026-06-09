---
name: envesty-reddit-research
description: Pull and analyze Reddit posts from configured subreddits. Triggered when the user says "fetch reddit", "scan reddit for X", "run reddit research", or "what is reddit saying about Y".
---

# envesty-reddit-research

Drives the Envesty server's Reddit pipeline — fetches posts, scores them, and produces a digest under `insights/`. The server is required for this skill (Reddit fetch + AI scoring). Everything else runs through Claude.

## Pre-conditions

- The Envesty server must be running. Check: `curl -s http://localhost:4001/api/health`
- If down, tell the user to run `./open-envesty.command` and stop.
- If the server returns a `403` from Reddit: the user needs `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` in `.env`. Tell them and stop — never fabricate posts.

---

## Step 0: Bypass detection

If the user said "quick", "just run", "no questions", or specified subreddits and count explicitly → skip the intake form and use what was given (fill in defaults for anything missing).

---

## Step 1: Intake form

Read the current subreddit list first:
```bash
cat envesty-system/config/subreddits.json
```

Then ask using **AskUserQuestion** in one call:

**Q1** — header: `"Subreddit scope"`, multiSelect: false
- `Configured list` — use subreddits already in config (`<show names>`)
- `Add extras` — use configured list plus some I'll specify
- `Custom list` — ignore config, I'll tell you which subs to use

**Q2** — header: `"Post volume"`, multiSelect: false
- `Quick scan — 25 posts` — fast, good for a topic check
- `Standard — 50 posts` — default, balanced
- `Deep dive — 100 posts` — more signal, takes longer

If Q1 = "Add extras" or "Custom list", ask a follow-up: "Which subreddits? (e.g. r/saas, r/IndiaStartups)" — plain text.

---

## Step 2: Fetch

Build the request from the intake answers.

With configured list:
```bash
curl -s -X POST http://localhost:4001/api/reddit/fetch \
  -H 'Content-Type: application/json' \
  -d '{"target_count": <count>, "score": true}'
```

With custom/extra subreddits:
```bash
curl -s -X POST http://localhost:4001/api/reddit/fetch \
  -H 'Content-Type: application/json' \
  -d '{"subreddits": [{"name":"<sub1>"},{"name":"<sub2>"}], "target_count": <count>, "score": true}'
```

The server fetches → scores via Gemini/OpenAI → writes raw JSON to `raw-scrapes/<timestamp>.json`.

---

## Step 3: Analyze and write digest

1. From the response, identify top 10 posts by `relevance_score`. Group by recurring `tags`.
2. Read `brand/envesty_brand_kit.md` for positioning context.
3. If a digest already exists for this month (`insights/<YYYY-MM>_reddit-digest.md`), append a new dated section. Otherwise create fresh.

Write `insights/<YYYY-MM>_reddit-digest.md` containing:
- Date, subreddits used, post count.
- **Top 5 themes** — each with: 1-line problem statement, 2–3 example post titles + URLs, suggested LinkedIn angle.
- **3–5 quick-win content ideas** that could become carousels or reels this week.
- **"Getting boring" section** — themes appearing but feeling stale or generic.

---

## Step 4: Confirm

One-line summary + top 3 themes. Note if AI scoring fell back to Claude's judgment.

## Notes

- Never store API keys or secrets in the digest. Raw JSON in `raw-scrapes/` is the canonical record.
- If AI scoring fails inside the server, score posts yourself and note the fallback in the digest.
