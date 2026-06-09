---
name: envesty-analyze-performance
description: Log post performance and update the "what worked" memory. Triggered when the user says "log metrics", "what's working", "analyze last cycle", or pastes performance numbers.
---

# envesty-analyze-performance

Reads and writes `memory/what-worked.json` directly — no server needed. Writes performance rollups to `insights/`. Future cycle generation reads this memory and biases toward proven patterns.

---

## Step 0: Mode detection

Scan the user's message:
- If they pasted numbers, metrics, or a CSV → go straight to logging (skip intake Q1).
- If they just asked "what's working?" or "analyze" → read-only mode, skip all logging steps.
- Otherwise → show intake form.

---

## Step 1: Intake form

Ask using **AskUserQuestion** in one call:

**Q1** — header: `"What do you want to do?"`, multiSelect: false
- `Log metrics for a post` — I'll give you the numbers
- `See what's working` — read-only analysis, no logging
- `Full cycle analysis` — analyze all slots in a cycle

**Q2** — header: `"Which cycle?"`, multiSelect: false  
*(Show only if Q1 = "Log metrics" or "Full cycle analysis")*
- `Latest — <auto-detected name>`
- `Previous — <second-most-recent>`
- `Other`

After answers, confirm in one line: "Logging metrics for [cycle] — go ahead and give me the numbers" or "Analyzing [cycle] — pulling the data now."

---

## Step 2: Log metrics (if logging)

For each performance datum:

1. Resolve the slot_ref. If ambiguous, ask: "Which slot? Here are the slots in [cycle]:" — list slugs with topics. Use **AskUserQuestion** with the slot list as options.

2. Read `content-queue/<cycle>/<slot>/slot.json` to understand the slot's shape (template, pillar, hook style).

3. Write entry to `memory/what-worked.json` — read current file, append new entry, write back:
```jsonc
{
  "slot_ref": "<cycle>/<slot>",
  "posted_at": "YYYY-MM-DD",
  "metrics": {
    "impressions": 0,
    "engagement": 0,
    "saves": 0,
    "clicks": 0,
    "comments": 0
  },
  "patterns_observed": "specific: what shape/framing drove this result",
  "hypothesis_next": "what to try next based on this"
}
```

`patterns_observed` must be specific — "comparison template + before/after framing → high saves" not "did well."

---

## Step 3: Write rollup

After logging (or in full cycle analysis mode), write/update `insights/<YYYY-MM>_performance.md`:

- **Top 3 winners** — slot ref, metrics highlights, pattern that worked
- **Top 3 underperformers** — what didn't land and why
- **3 patterns to repeat** next cycle
- **1 thing to stop** doing

Keep it under one screen. If a rollup already exists for this month, replace it.

---

## Read-only mode ("what's working?")

Skip all logging and file writes. Read `memory/what-worked.json`, surface the top 5 patterns by engagement, and present as a brief:
```
Top patterns (last N entries):
1. [pattern] → avg X impressions, Y saves
2. ...

What to reuse next cycle: [2-3 actionable takeaways]
```

---

## Notes

- Write directly to `memory/what-worked.json` using the Read + Write tools. No server API needed.
- If the user pastes a LinkedIn CSV export, parse each row as a separate entry. Map LinkedIn's column names to the schema fields as best you can — ask if a column is ambiguous.
