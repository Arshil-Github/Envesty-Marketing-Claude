---
name: envesty-skill-manager
description: Meta-skill for adding, editing, listing, and bundling Envesty skills. Triggered when the user says "add a new skill", "edit the reddit skill", "list skills", "bundle skills", or "ship skill X".
---

# envesty-skill-manager

Operates on `.claude/skills/`. Each skill lives in its own folder with a `SKILL.md` inside. To distribute, that folder is zipped into a `.skill` file.

## Invocation forms

- "List skills" → enumerate skill folders + descriptions.
- "Add a new skill called `envesty-X` that does Y" → scaffold a new folder.
- "Edit `envesty-reddit-research` to also produce a CSV" → modify an existing SKILL.md.
- "Bundle `envesty-render-carousel`" → produce a `.skill` zip in the project root.
- "Bundle all skills" → zip each one in turn.

## Skill folder layout

```
.claude/skills/<name>/
└── SKILL.md       # YAML frontmatter + body, see template below
```

## SKILL.md template

```markdown
---
name: <slug>
description: <one-sentence trigger summary including phrases that should fire this skill>
---

# <slug>

<One paragraph: what this skill does and when it runs.>

## Pre-conditions
- ...

## Invocation forms
- ...

## Steps
1. ...
2. ...

## Quality bar / notes
- ...
```

## Steps for adding a skill

1. Confirm the slug. Lowercase, hyphenated, prefixed with `envesty-`. Reject names that collide with an existing folder.

2. Read 1–2 existing skill files (`envesty-render-carousel/SKILL.md` is a good short reference; `envesty-generate-cycle/SKILL.md` is a longer one). Match the section structure.

3. Write `.claude/skills/<name>/SKILL.md` using the template above.

4. Confirm to the user with the path and the trigger sentence.

## Steps for bundling

1. Locate the source folder: `.claude/skills/<name>/`.

2. Produce a zip such that the archive contains `<name>/SKILL.md` (not just `SKILL.md` at the root):
   ```bash
   cd .claude/skills && zip -r ../../<name>.skill <name>/
   ```

3. Confirm with the output path and file size.

## Refusals

- Don't bundle a skill whose SKILL.md lacks a `name` or `description` frontmatter field.
- Don't delete a skill folder unless the user has confirmed by typing the slug exactly.
