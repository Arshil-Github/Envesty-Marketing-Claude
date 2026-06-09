---
name: envesty-template-scaffold
description: Create a new React carousel slide template from a verbal description. Triggered when the user says "make a new template that looks like…", "scaffold a template for X", "add a quote-style template", or "I need a new slide design".
---

# envesty-template-scaffold

Writes a new JSX file under `tools/web-app/src/templates/T<NN>_<Name>.jsx`. Vite HMR picks it up immediately. Requires the server running for the write step, but the intake and design work happens first.

---

## Step 0: Bypass detection

If the user described the template in detail (slide type, layout, visual style) → skip intake and proceed with what was given.

---

## Step 1: Intake form

Ask using **AskUserQuestion** in one call:

**Q1** — header: `"Slide content type"`, multiSelect: false
- `Stat / big number` — hero number with supporting context (e.g. "₹8,500 — full incorporation cost")
- `Comparison` — before/after or side-by-side contrast (e.g. "Agency vs Envesty")
- `Quote / testimonial` — pull quote with attribution
- `Story / narrative` — text-forward, sequential point layout
- `CTA / closing` — call to action, sign-off slide

**Q2** — header: `"Visual weight"`, multiSelect: false
- `Bold & minimal` — large type, dark background, high contrast
- `Structured / data-forward` — clear hierarchy, numbers prominent
- `Conversational` — lighter, more paragraph-like, approachable

**Q3** — header: `"Template name"`, multiSelect: false
- `Auto-name it` — Claude picks a descriptive PascalCase name
- `I'll name it` — user provides name in follow-up

If Q3 = "I'll name it", ask: "What should it be called? (PascalCase, e.g. BigQuote or TimelineStep)"

---

## Step 2: Read existing templates for reference

List existing templates from the filesystem (no server needed):
```bash
ls envesty-system/tools/web-app/src/templates/
```

Pick 1–2 existing templates closest to the requested type and read them in full for style reference. Match: indentation, Tailwind class patterns, `export-stage` wrapper, wordmark placement.

---

## Step 3: Determine template number

From the file list, find the highest existing T-number and increment by 1. Format: `T<NN>_<PascalName>.jsx`.

---

## Step 4: Write the template

Write the JSX file directly using the Write tool to:
`envesty-system/tools/web-app/src/templates/T<NN>_<PascalName>.jsx`

Required conventions:
- Default export only. Component name = filename without extension.
- Signature: `({ slot, slide })` — do not change this.
- Root element: `className="export-stage"` for full-bleed screenshot.
- Tailwind classes only — no external CSS imports.
- Guard all optional fields: `{slide.subhead && <p>...</p>}`
- Include the "Envesty" wordmark subtly in a corner.
- Fill the configured output dimensions — read `config/system.json` for the ratio.

Data fields by type:
- Stat: `slide.stat`, `slide.subhead`, `slide.headline`
- Comparison: `slide.headline`, `slide.left { label, body }`, `slide.right { label, body }`
- Quote: `slide.headline`, `slide.attribution`
- Story: `slide.headline`, `slide.body`
- CTA: `slide.headline`, `slide.body`, `slot.cta`

---

## Step 5: Confirm

Tell the user:
- Template name and file path
- Which data fields it uses (so they know what to put in slot.json)
- "Preview it in the Template Editor tab — select any slot and switch the template to `<name>`"

---

## Quality bar

- Body text must be readable at render resolution — minimum 16px equivalent in Tailwind (`text-base` or larger).
- Typography must look good at 1080×1350 (portrait LinkedIn default). Test mentally.
- Don't duplicate an existing template's exact layout. Check the reference files.
