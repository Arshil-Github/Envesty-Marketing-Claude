---
name: envesty-assistant
description: Pipeline status assistant and daily brief. Triggered when the user says "what's next", "morning", "help", "status", "where are we", "what should I work on", or opens the project fresh with no specific task in mind.
---

# envesty-assistant

The entry point for anyone on the Envesty team. Reads pipeline state directly from files, presents a concise status brief, and guides the user to the next action. No server required.

The server is only needed for two things: **Reddit fetching** and **carousel rendering**. Everything else — generating content, analyzing performance, managing config, processing assets — runs entirely through Claude reading and writing files.

## Invocation forms

- "What's next?" → brief + single recommended action
- "Morning" / "Hey" / "Help" → full daily brief
- "Where are we in the pipeline?" → pipeline status
- "What should I work on?" → recommendation based on state
- "Walk me through the system" → onboarding mode (see below)

## Steps

### 1. Read pipeline state from files (no server needed)

```bash
# Latest cycle name and slots
ls envesty-system/content-queue/ | sort | tail -1
ls envesty-system/content-queue/$(ls envesty-system/content-queue/ | sort | tail -1)/

# Research freshness
ls envesty-system/insights/ 2>/dev/null

# Performance memory
cat envesty-system/memory/what-worked.json

# Rendered output (which slots have PNGs)
ls envesty-system/output/ 2>/dev/null
```

### 2. Evaluate each pipeline stage

| Stage | How to evaluate | Needs server? |
|---|---|---|
| Research | insights/<YYYY-MM>_reddit-digest.md exists this month? | No (read file) |
| Generate | Cycle folder exists for current month in content-queue/? | No |
| Review | carousel.md present in each slot? (Written at generate time) | No |
| Render | output/<cycle>/<slot>/carousel/ directories exist per slot? | No (check folder) |
| Post | Cannot verify — happens outside the system | — |
| Log metrics | memory/what-worked.json has entries for latest cycle? | No |
| Analyze | insights/<YYYY-MM>_performance.md exists this month? | No |

### 3. Present the brief

```
Pipeline status — <today's date>

Cycle:     <latest cycle name> (<N> slots)
Research:  fresh (date) OR none this month
Render:    all rendered OR <N> slots pending
Metrics:   logged OR Cycle XX unlogged

Next: <one clear action>
```

### 4. Hand off to the right skill

| Earliest gap | What to offer |
|---|---|
| No research this month | "Run Reddit research?" → envesty-reddit-research (needs server) |
| No cycle this month | "Generate the next content cycle?" → envesty-generate-cycle |
| Slots unrendered | "Render the pending carousels?" → envesty-render-carousel (needs server) |
| Unlogged metrics | "Log metrics from your last posts?" → envesty-analyze-performance |
| No performance rollup | "Analyze what worked?" → envesty-analyze-performance read-only |
| Everything current | "All good — want to get ahead on the next cycle?" |

One action only. If user says yes, invoke the skill directly.

When handing off to a server-dependent skill, mention it upfront: "This one needs the server running — want me to check first, or do you already have it up?"

---

## Onboarding mode

If the user says "walk me through this", "I'm new", or "explain the system":

1. What this is: Envesty's LinkedIn content engine. A repeating loop: research what Indian founders are talking about, generate carousel content, render it, post it, log what worked, repeat.

2. How it works: Almost everything runs through Claude directly — reading and writing files in this folder. You don't need the web server running unless you want to render carousels (PNGs) or pull fresh Reddit data.

3. The pipeline, plain terms:
   - Research: Claude pulls Reddit signal from relevant communities and builds a digest of content angles.
   - Generate: Claude uses the digest, brand kit, and past performance to write a batch of LinkedIn carousel posts (a "cycle").
   - Render: The local server renders each carousel to PNG images (server required for this step only).
   - Log metrics: Paste impressions/saves/engagement and Claude remembers what worked.
   - Analyze: Claude surfaces patterns to sharpen the next cycle.

4. How to work with me: Just talk naturally. "Make content for this week", "what's performing well", "add a new subreddit", "render the latest carousels" — I'll handle the rest.

---

## Notes

- Never block a session because the server is down. Pipeline state is readable from files alone.
- Only bring up the server if the user's task is Reddit research or rendering.
- If the user is clearly mid-task ("render slot 3"), skip the brief and just do the task.
