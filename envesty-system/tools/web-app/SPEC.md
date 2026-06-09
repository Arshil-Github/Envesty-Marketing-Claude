# Slot Schema

Each content slot lives at `content-queue/<YYYY-MM>_cycle-NN/<NN_slug>/slot.json`.

```jsonc
{
  "meta": {
    "cycle": "2026-06_cycle-01",
    "slot": "01_slug",
    "topic": "string",
    "audience": "string",
    "pillar": "education | proof | story | culture | bts",
    "template": "T01_Cover"
  },
  "slides": [
    {
      "type": "cover",
      "template": "T01_Cover",
      "headline": "string",
      "subhead": "string",
      "body": "string",
      "image_ref": "asset-library/analyzed/<file>"
    }
  ],
  "caption": "string",
  "hooks": ["alt hook 1", "alt hook 2"],
  "cta": "string",
  "sources": ["url or asset ref"]
}
```

The `template` field on each slide must match a component name in `src/templates/`.
