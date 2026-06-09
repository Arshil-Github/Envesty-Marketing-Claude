---
name: envesty-system-control
description: Change Envesty's runtime configuration from chat — subreddit list, AI provider, output dimensions, brand kit edits. Triggered when the user says "add subreddit r/X", "switch ai provider to gemini", "set output ratio", "edit brand voice", or similar config commands.
---

# envesty-system-control

A safe wrapper around `config/*.json` and `brand/envesty_brand_kit.md`. Validates before writing.

## What this controls

| User says | What you change |
|---|---|
| "add subreddit r/saas with weight 0.8" | append to `config/subreddits.json` `.list` |
| "remove subreddit r/marketing" | filter `.list` |
| "switch ai provider to openai" | `config/ai-provider.json` `.provider` |
| "use gemini-2.5-pro" | `config/ai-provider.json` `.model` |
| "set output to 1080x1080" (square LinkedIn) | `config/system.json` `.output` |
| "set default slide count to 8" | `config/system.json` `.default_slide_count` |
| "update brand voice — add adjective 'incisive'" | edit `brand/envesty_brand_kit.md` directly |
| "what's our current config?" | read-only dump |

## Steps for config changes

1. Read the current state via GET:
   ```bash
   curl -s http://localhost:4001/api/config/subreddits
   curl -s http://localhost:4001/api/config/system
   curl -s http://localhost:4001/api/config/ai-provider
   ```

2. Make the minimum mutation needed. **Never** replace the whole object if the user asked for one field change.

3. Validate before write:
   - Subreddit names: lowercase, alphanumerics + underscore only, no `r/` prefix.
   - Weights: 0–2 range.
   - Provider: `gemini` or `openai`.
   - Model: non-empty string.
   - Output dimensions: integers 400–2400.

4. PUT the updated object:
   ```bash
   curl -s -X PUT http://localhost:4001/api/config/<key> \
     -H 'Content-Type: application/json' \
     -d @new.json
   ```

5. Confirm to the user with the diff (what was, what is). One line.

## Steps for brand kit edits

1. Read `brand/envesty_brand_kit.md`.
2. Apply the user's edit precisely — don't rewrite sections they didn't touch.
3. Save via the Edit tool.
4. If the user added new positioning copy that contradicts existing copy, flag the conflict and ask before merging.

## Refusals

- Don't add a subreddit you can't verify exists (do a quick `curl https://www.reddit.com/r/<name>/about.json` head-check).
- Don't switch AI provider if the required API key isn't in `.env`. Check `/api/health` for `has_gemini_key` / `has_openai_key` first.
