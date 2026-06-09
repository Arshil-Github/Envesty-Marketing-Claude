---
name: envesty-asset-library
description: Process files dropped in the asset library inbox — classify each into guides/, knowledge/, or misc/, tag it, and update the index. Triggered when the user says "process new assets", "process inbox", "what's in the asset library", "tag my files", or "check the inbox".
---

# envesty-asset-library

Walks `asset-library/inbox/`, reads each file, classifies it into the right category, moves it, and keeps `index.md` and `assets.json` up to date. Runs entirely through Claude — no server needed.

## Folder structure

```
asset-library/
├── inbox/       ← drop zone — files land here
├── guides/      ← how-to content: hooks, delivery, scriptwriting, frameworks
├── knowledge/   ← reference material: compliance, market research, audience notes
├── misc/        ← anything that doesn't cleanly fit guides or knowledge
├── analyzed/    ← legacy folder (kept for backward compat — do not move files here going forward)
├── assets.json  ← structured index of all processed files
└── index.md     ← human-readable retrieval map (Claude reads this when generating content)
```

## Classification rules

**→ guides/** if the file is instructional or prescriptive — it teaches how to do something:
- Hook collections, opener libraries, headline formulas
- Reel delivery guides, on-camera tips, scriptwriting templates
- Content frameworks, post structures, storytelling patterns
- Editing guides, caption formulas, CTA playbooks

**→ knowledge/** if the file is factual or contextual — it contains information to draw on:
- Compliance references (GST, ROC, MCA, startup law)
- Market research, competitor analysis, audience surveys
- Case studies, client stories, real project timelines
- Industry reports, news summaries, regulation notes
- Brand notes, positioning research, ICP descriptions

**→ misc/** if it doesn't clearly fit either:
- Raw screenshots without context
- Duplicate or outdated versions of existing files
- Files you can't read or categorise confidently

If in doubt between guides and knowledge, ask yourself: *"Does this teach a method, or does it provide facts?"* Methods → guides. Facts → knowledge.

## Invocation forms

- "Process new assets" / "Process inbox" → run end to end on all inbox files
- "What's in the asset library?" → read-only: list entries from assets.json + index.md by category
- "Re-tag [filename]" → reprocess a single file without scanning the full inbox

## Steps

### 1. List the inbox
```bash
ls envesty-system/asset-library/inbox/
```
If inbox is empty, tell the user and stop.

### 2. For each file in inbox

**Read it** using the Read tool. Path: `envesty-system/asset-library/inbox/<filename>`. Images and PDFs are readable directly.

**Produce:**
- `category` — `guides`, `knowledge`, or `misc` (classification rules above)
- `description` — one sentence: what this file actually contains (not what the filename implies)
- `tags` — 3–8 lowercase strings useful for retrieval (be specific: "hook-formulas" beats "hooks")
- `type` — e.g. `text/markdown`, `pdf/guide`, `image/screenshot`, `text/notes`
- `usable_for` — list from: `reels`, `carousels`, `compliance`, `founder-story`, `pricing`, `market-intel`, `general`

**If a file fails to read** (corrupt, unsupported format): classify as `misc`, description: "could not read", tags: ["unreadable"]. Still move it and log it.

### 3. Move each file to its category folder
```bash
mv envesty-system/asset-library/inbox/<filename> envesty-system/asset-library/<category>/<filename>
```

### 4. Update assets.json

Read the current `asset-library/assets.json`, append the new entry, write it back:
```jsonc
{
  "filename": "<filename>",
  "category": "guides | knowledge | misc",
  "path": "<category>/<filename>",
  "description": "...",
  "tags": ["...", "..."],
  "type": "...",
  "usable_for": ["...", "..."],
  "added": "<YYYY-MM-DD>"
}
```

### 5. Rebuild index.md

Read the full `assets.json` entries list. Regenerate `asset-library/index.md` from scratch using this template:

```markdown
# Asset Library Index

> This file is the retrieval layer for Claude. When generating content, read this index first,
> identify which files are relevant to the task, then read those files in full.

Last updated: <YYYY-MM-DD>

---

## Guides
*How-to references — delivery frameworks, hook collections, scriptwriting patterns, content formulas.*

| File | What's inside |
|---|---|
| guides/<filename> | <description> |
...

---

## Knowledge
*Facts, context, reference material — compliance, research, case studies, audience insights.*

| File | What's inside |
|---|---|
| knowledge/<filename> | <description> |
...

---

## Misc
| File | What's inside |
|---|---|
| misc/<filename> | <description> |
...
```

Omit sections that have no entries (don't show an empty Misc section).

### 6. Confirm to the user

Summary in this format:
```
Processed <N> files:
• guides/   → <list of filenames>
• knowledge/ → <list of filenames>
• misc/      → <list of filenames> (if any)

Index updated. Claude will now pull from these when generating content.
```

If any files were unreadable, list them separately.

---

## Read-only mode ("what's in the asset library?")

Skip all move/write steps. Just read `asset-library/index.md` and present it cleanly, grouped by category. Note the total file count and the last-updated date.

## Re-tag mode ("re-tag <filename>")

1. Find the file in its current location (check guides/, knowledge/, misc/ in that order).
2. Re-read and re-classify it.
3. Move it to the new category if different.
4. Update its entry in assets.json and rebuild index.md.
5. Confirm: "Moved <filename> from <old> to <new>."

---

## Quality bar

- Tags must be retrieval-useful. "document" is useless. "reel-hook, opening-line, pattern-interrupt" is useful.
- Descriptions must describe the actual content, not the filename. If a file is called "guide_v3_FINAL.pdf" but contains 50 hook formulas for reels, description = "50 hook formulas for reels, grouped by emotion type."
- Never overwrite an existing file in the destination folder — if a file with the same name already exists, append `_2` to the incoming filename before moving.
