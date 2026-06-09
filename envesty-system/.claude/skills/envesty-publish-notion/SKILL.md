---
name: envesty-publish-notion
description: Publish a generated content cycle to Notion — one page per slot. Triggered when the user says "publish to notion", "send to notion", "push cycle to notion", "add to notion", or after approving a generated cycle and wanting to schedule it.
---

# envesty-publish-notion

Publishes slots from a generated cycle to Notion. Creates one page per slot, routes each to the correct database based on platform, and tracks published state locally.

**Routing rule (default, no override needed):**
- `platform: linkedin` → LinkedIn content database ("New Post")
- `platform: instagram` → Instagram Schedule Database
- `platform: both` → creates pages in **both** databases

Runs through Claude + Notion MCP. No local server needed.

## Available Notion MCP tools

Use these exact tool names:
- `notion-search` — find databases and pages by keyword
- `notion-fetch` — retrieve a page or database by ID
- `notion-create-pages` — create one or more pages in a database
- `notion-update-page` — update properties on an existing page
- `notion-get-users` — get workspace users (for assignee fields if needed)

## LinkedIn database schema ("New Post")

| Property | Type | Values |
|---|---|---|
| Title (name) | title | Slot topic |
| Post Date | date | Scheduled LinkedIn post date |
| Post Type | select | `Carousel` or `Reel` |
| Status | select | `Not started`, `Script Written`, `Ready to post`, `Posted`, `Dropped` |

New LinkedIn slots → **Status: Script Written**

## Instagram database schema ("Instagram Schedule Database")

Discover the exact property names at runtime using `notion-fetch` on the database ID. Map these fields:
- Title → slot topic
- Post Date → scheduled date
- Post Type → `Carousel` or `Reel`
- Status → `Not started` (or closest equivalent found in the database)
- Any other properties → leave blank on first publish

## Local tracking file

`memory/notion-published.json` — prevents duplicates and enables status updates:
```jsonc
{
  "entries": [
    {
      "slot_ref": "2026-06_cycle-02/01_legal-agreements",
      "platform": "linkedin | instagram | both",
      "linkedin_page_id": "xxx",          // if platform is linkedin or both
      "linkedin_url": "https://notion.so/...",
      "instagram_page_id": "xxx",         // if platform is instagram or both
      "instagram_url": "https://notion.so/...",
      "status": "Script Written",
      "post_date": "2026-06-12",
      "published_at": "2026-06-09"
    }
  ]
}
```

If this file doesn't exist, create it with `{ "entries": [] }`.

---

## Step 0: Bypass / inline invocation

If the user just approved a generated cycle and immediately said "publish to Notion" — the cycle is already known. Skip cycle selection in Step 1.

---

## Step 1: Find databases and identify cycle

### 1a. Find Notion databases

Use `notion-search` to locate both databases. Search for "New Post" to find the LinkedIn database, and "Instagram Schedule" to find the Instagram database. Extract and store both database IDs.

If a database can't be found, ask the user: "I couldn't find the [LinkedIn/Instagram] database in Notion. What's it called?" Then search again with their answer.

### 1b. Identify the cycle

If the user didn't specify, use **AskUserQuestion**:

**Q: "Which cycle do you want to publish?"**, header: `"Cycle"`
- `Latest — <auto-detected name>`
- `Previous — <second-most-recent>`
- `Other`

Read all `content-queue/<cycle>/*/slot.json` files to get the slot list and their platforms.

### 1c. Check what's already published

Read `memory/notion-published.json`. Cross-reference against cycle slots.

Show status before proceeding:
```
Cycle: 2026-06_cycle-02 (5 slots)

LinkedIn posts:
• 01_legal-agreements  [Carousel] → not published
• 02_sushant-story     [Reel]     → not published
• 03_envesty-pricing   [Carousel] → already published June 10 ✓

Instagram posts:
• 04_gstin-reveal      [Carousel] → not published
• 05_noida-17days      [Reel]     → not published

4 slots to publish. Continue?
```

Group by platform in the display.

---

## Step 2: Schedule dates

For unpublished slots, ask using **AskUserQuestion**:

**Q: "How do you want to set post dates?"**, header: `"Scheduling"`
- `Auto-schedule from a date` — one slot per day, I'll pick the start date
- `Start from today` — first slot today, one per day
- `Start from tomorrow` — first slot tomorrow, one per day
- `Set each date individually`

If "Auto-schedule from a date": follow up with plain text — "What date should the first slot go out? (e.g. June 12)"

If "Set each date individually": for each unpublished slot use **AskUserQuestion** — options: Today / Tomorrow / Day after tomorrow / Other.

For slots with `platform: both` — ask once and apply the same date to both the LinkedIn and Instagram pages.

---

## Step 3: Build page content for each slot

Read files for each slot being published:
- `content-queue/<cycle>/<slot>/slot.json`
- `content-queue/<cycle>/<slot>/caption.md`
- `content-queue/<cycle>/<slot>/carousel.md` (carousels)
- `content-queue/<cycle>/<slot>/script.md` (reels)

### LinkedIn page body

```
## Caption
[LinkedIn caption from caption.md — use caption_linkedin section if platform=both]

## Slides  (carousel)
[carousel.md content]

## Script  (reel)
[script.md content]

## Alt Hooks
[hooks from slot.json, one per line]

## Meta
Cycle: <cycle> | Slot: <slot> | Pillar: <pillar>
```

### Instagram page body

```
## Caption
[Instagram caption from caption.md — use caption_instagram section if platform=both]

## Hashtags
[hashtags extracted from the Instagram caption]

## Slides / Script
[carousel.md or script.md content]

## Meta
Cycle: <cycle> | Slot: <slot> | Pillar: <pillar>
```

---

## Step 4: Create pages in Notion

Use `notion-create-pages` to create each page.

For LinkedIn slots: create in LinkedIn database. Properties:
```json
{
  "Name": "<topic>",
  "Post Date": "<scheduled date>",
  "Post Type": "Carousel" or "Reel",
  "Status": "Script Written"
}
```

For Instagram slots: create in Instagram Schedule Database. Map to whatever property names were discovered in Step 1a.

For `platform: both` slots: create in both databases in sequence.

If a page creation fails: note it, continue, report at the end.

---

## Step 5: Update local tracking

After all pages are created, update `memory/notion-published.json` — append one entry per slot with IDs, URLs, dates, and platform.

---

## Step 6: Confirm

```
Published to Notion:

LinkedIn (New Post):
• 01_legal-agreements  → June 10  [link]
• 02_sushant-story     → June 11  [link]

Instagram (Instagram Schedule):
• 04_gstin-reveal      → June 12  [link]
• 05_noida-17days      → June 13  [link]

Already published (skipped): 03_envesty-pricing
```

---

## Updating status later

When user says "mark [slot] as ready to post / posted / dropped":
1. Read `notion-published.json` to find the page ID(s).
2. Use `notion-update-page` to set the Status property.
3. Update the local tracking entry.
4. Confirm: "Updated [slot] → [status]" with link.

---

## Notes

- Never create duplicate pages — always check `notion-published.json` first.
- If Notion MCP tools aren't available, say: "Notion isn't connected. Add the Notion MCP in Settings → Connections."
- Platform routing is automatic from `slot.json`. The user only needs to override if they explicitly want a slot in a different database.
