---
name: envesty-render-carousel
description: Render a slot's slides to PNG images via the local Puppeteer pipeline. Triggered when the user says "render slot 03", "build the carousel for X", "screenshot the deck", or "render the latest cycle".
---

# envesty-render-carousel

Calls the local server's Puppeteer pipeline to screenshot carousel slides into PNGs. The server is required for this skill.

## Pre-conditions

- Server must be running on :4001 and Vite on :5273.
  ```bash
  curl -s http://localhost:4001/api/health
  ```
- If down, tell the user to run `./open-envesty.command` and stop.

---

## Step 0: Bypass detection

If the user explicitly named a cycle and slot (e.g. "render cycle-02 slot 03") → skip intake, resolve directly and render. If "all" was specified → skip slot question.

---

## Step 1: Intake form

Read available cycles from files:
```bash
ls envesty-system/content-queue/ | sort
```

Ask using **AskUserQuestion** in one call:

**Q1** — header: `"Which cycle?"`, multiSelect: false
- `Latest — <auto-detected name>` — most recently created cycle
- `Previous — <second-most-recent>` — cycle before that
- `Other` — user specifies

**Q2** — header: `"Which slots?"`, multiSelect: false
- `All slots` — render everything in the cycle
- `Unrendered only` — skip slots that already have PNGs in output/
- `Specific slots` — I'll tell you which ones

If Q2 = "Specific slots", follow up: "Which slots? (e.g. 01, 03, 05)"

### Detecting unrendered slots

For each slot in the cycle, check:
```bash
ls envesty-system/output/<cycle>/<slot>/carousel/ 2>/dev/null
```
A slot is unrendered if that path doesn't exist or is empty.

---

## Step 2: Render

For each resolved slot, POST to the generate endpoint:
```bash
curl -s -X POST http://localhost:4001/api/generate/carousel \
  -H 'Content-Type: application/json' \
  -d '{"cycle":"<cycle>","slot":"<slot>"}'
```
Takes ~2–6 seconds per slide. Run slots sequentially.

If a slot errors with "slot has no slides" or "slot not found": skip it, note the failure, continue.

---

## Step 3: Confirm

List rendered slots with their output paths and slide counts. Note any failures. If everything rendered, remind user they can review files at `output/<cycle>/`.

## Notes

- This skill never edits slide content. To change a slide, update slot.json first then re-render.
- Re-rendering a slot overwrites existing PNGs.
