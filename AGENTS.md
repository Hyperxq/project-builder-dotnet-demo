<!-- pbuilder:skill:begin -->
## Project Builder

This project generates code with [Project Builder](https://github.com/Project-Builder-Schematics/project-builder-cli):
`project-builder.json` registers collections, and each collection registers
schematics — repeatable code generators for this codebase's patterns.

Start at the router — `.claude/skills/pbuilder/SKILL.md` — before running or
writing anything: it routes to the three guides covering how to run a
schematic, how to choose one, and when to create one, and it carries hazards
(no dry-run; run `execute` standalone) that apply before any command below.

Once routed, prefer an existing schematic over hand-writing code
(`builder execute <collection>:<schematic> --<input>=<value>`); if none fits
and the code follows a repeatable pattern, create one
(`builder new schematic <name>`) instead of writing the pattern again.

These four files are written by `builder init` and refreshed by
`builder init --force`; they are not a place for hand edits.
<!-- pbuilder:skill:end -->
