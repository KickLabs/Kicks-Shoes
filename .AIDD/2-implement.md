# 2 - Implement

> **Prerequisite:** Read [README.md](./README.md) for framework structure and rules.
> `.AIDD/` must be at the **root repo** (same level as `.git/`). All paths below are relative to `<root-repo>/.AIDD/`.

---

## Flow

### Implement

1. Read approved docs in `changes/NNN-feature-name/`.
2. **Clarify & Confirm:** Ask any technical questions. ⛔ **STOP — Get approval before coding.**
3. Implement according to the docs.
4. Test per Acceptance Criteria and stated edge cases.
5. ⛔ **STOP — Wait for user to verify implementation works correctly.**

### Archive & Update

1. Identify which module in `docs/` this feature belongs to.
2. Choose how to merge into `docs/`:
   - **New module**: create `docs/[module-name]/` with README.md + files
   - **Extend existing module**: add file or subfolder to `docs/[module-name]/`, update README.md links. New subfolders also follow the 2-tier format (see Scaling Rule in [README.md](./README.md)).
3. **When updating `docs/`** (see format in [README.md](./README.md)):
   - **README.md = business overview** — only edit when the module adds/removes a major capability. Do not add code, file paths, or implementation details here.
   - **Technical content → detail files** — merge into the appropriate file (`architecture.md`, `api-endpoints.md`, ...). If no suitable file exists → create a new one and link from README.
   - **Merge into correct section** — find the right section in the detail file, do not append to end of file.
   - **Detail file too long (~80+ lines)** → split into additional files or subfolders.
4. Update related modules in `docs/` if cross-module impact.
5. **Update change docs with implementation lessons** — before archiving, update docs in `changes/NNN-feature-name/` with practical experience from the implementation process:
   - **Decisions changed** — which decisions changed from the original plan and why.
   - **Gotchas & Pitfalls** — unexpected issues encountered and how they were resolved.
   - **What worked well** — which approaches were effective and should be reused.
   - **Recommendations for next time** — suggestions for improvement in similar implementations.
   - Record in the `## Implementation Notes` section at the end of the change doc.
6. Move `changes/NNN-feature-name/` → `archived/NNN-feature-name/`.

---

## Rules

1. **Implement only.** Do not move or archive files during implementation step.
2. **Update cross-module docs** before archiving.
3. **Do not delete, only move** to `archived/`.
4. **Update docs/ README links** when adding new files or subfolders.

---

## Agent Operational Rules

1. **First Principles + 80/20** — solve from fundamentals; focus on the 20% that delivers 80% of value. Keep code simple, avoid over-engineering. Keep docs concise — only essential decisions, no verbose explanations.
2. **Clarify until clear** — ask questions until requirements are fully understood; summarize and get approval before drafting or making changes
3. **Context Mastery** — understand the repo structure, existing patterns, relevant docs before writing. Never assume.
4. **Never self-answer** — present questions and **WAIT** for user response. Do not assume answers or proceed without confirmation.