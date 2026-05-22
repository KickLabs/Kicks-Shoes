# 1 - Research & Plan

> **Prerequisite:** Read [README.md](./README.md) for framework structure and rules.
> `.AIDD/` must be at the **root repo** (same level as `.git/`). All paths below are relative to `<root-repo>/.AIDD/`.

---

## When to Use

- New feature or major change
- Updating existing module (edit `docs/` directly, skip `changes/`)

---

## Flow

### Step 1: Research (Agent)

- Codebase context: relevant paths, files, functions
- Tech/stack constraints: versions, platform limits, current tooling
- External research (if needed): **must use web search** — never rely on training data for versions or library usage
- Present a summary of findings to user. ⛔ **STOP — Wait for user to acknowledge.**

### Step 2: Clarify (Agent ↔ User loop)

Ask and clarify with user **before writing any docs**. Baseline categories (add/remove as needed):
- Users & main use cases
- Dependencies / cross-module impact
- Data & lifecycle
- Edge cases & non-functional requirements
- Need separate detail files? (API contracts, data schemas, diagrams...)

**Interaction:** Agent presents questions → **WAIT for answer** → follow-up if needed → repeat until done.
⛔ **STOP — Do NOT proceed until user confirms "done" / "let's continue".**
⚠️ **NEVER self-answer questions.**

### Step 3: Create Change Proposal (Agent → User approval → Agent)

> ⚠️ All docs go into `changes/`, NOT `docs/`. The `docs/` folder is only updated during Phase 2 (Implement).

1. Create `changes/NNN-feature-name/` folder (auto-increment number). To determine next NNN:
   ```bash
   max=$({ ls .AIDD/archived/ 2>/dev/null; ls .AIDD/changes/ 2>/dev/null; } | grep -oP '^\d+' | sort -rn | head -1); printf "%03d" $(( ${max:-0} + 1 ))
   ```
2. **Propose document structure** — suggest one of:
   - **Single README.md** — small, clear-scope changes
   - **README.md + 1-2 detail files** — medium changes
   - **README.md + multiple detail files** — large/complex changes
3. Explain reasoning. ⛔ **STOP — Wait for user to approve structure.**
4. Write `changes/NNN-feature-name/README.md` (progressive disclosure format)
5. Add approved detail files, link from README.md
6. ⛔ **STOP — Present written docs to user for review.**

### Step 4: Review & Approve (User)

- Stakeholder reviews business-readable sections, Dev reviews technical sections
- Agent makes revisions if requested
- ⛔ **STOP — Get explicit "approved" before proceeding to Phase 2. Do NOT start implementation.**

---

## Rules

1. **Clarify before writing.** Do not create docs until requirements are understood.
2. **Progressive disclosure.** Business-readable top, technical-deep bottom.
3. **No file name restrictions.** Any `.md`, diagrams, schemas — just link from README.
4. **Research must include sources.** Codebase paths, external links, references.
5. **Cross-module impact.** If touching existing `docs/`, note in Dependencies.

---

## Agent Operational Rules

1. **First Principles + 80/20** — solve from fundamentals; focus on the 20% that delivers 80% of value. Keep code simple, avoid over-engineering. Keep docs concise — only essential decisions, no verbose explanations.
2. **Clarify until clear** — ask questions until requirements are fully understood; summarize and get approval before drafting or making changes
3. **Context Mastery** — understand the repo structure, existing patterns, relevant docs before writing. Never assume.
4. **Never self-answer** — present questions and **WAIT** for user response. Do not assume answers or proceed without confirmation.