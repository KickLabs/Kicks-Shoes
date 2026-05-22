# AIDD - AI-Driven Development Docs

> Lightweight framework for organizing project documentation.
> Designed for multi-audience readability and scalability.

---

## Location

`.AIDD/` **must be placed at the root repo** (same level as `.git/`).

```
<root-repo>/
├── .git/
├── .AIDD/          ← here
├── backend/
├── frontend/
└── ...
```

> All paths in this framework are relative to `<root-repo>/.AIDD/`.

---

## Structure

```
.AIDD/
├── README.md                      # This file - framework overview
├── 1-research-plan.md             # Phase 1 workflow
├── 2-implement.md                 # Phase 2 workflow
├── docs/                          # Source of truth (group by module)
├── changes/                       # Proposals & drafts
└── archived/                      # Implemented history
```

## Directory Roles

| Folder | Role | Lifecycle |
|--------|------|-----------|
| `docs/` | Source of truth. Current state of the system. | Living, always up-to-date |
| `changes/` | Proposals, drafts, research. Work-in-progress. Naming: `NNN-feature-name/` (auto-increment, AI generates or user suggests). | Temporary, until approved & implemented |
| `archived/` | Implemented proposals. Historical reference. | Permanent, read-only |

---

## `docs/` Organization

### Project-Level Docs

`docs/_project/` contains project-level documentation (cross-cutting, not tied to any specific module):

```
docs/_project/
├── business.md           # Business scenario & business case
├── architecture.md       # System architecture & tech stack
└── roadmap.md            # Features, milestones & future vision
```

> Release Notes live at root repo: `CHANGELOG.md`.

### Module Docs

Group by **module** (mirrors system architecture). Each module is a folder.

```
docs/
├── backend/
│   ├── README.md              # Business overview (non-technical)
│   ├── architecture.md        # Technical: stack, file tree, config
│   ├── api-endpoints.md       # Technical: API contracts
│   └── data-schema.md         # Technical: data models
├── frontend/
│   ├── README.md              # Business overview
│   ├── architecture.md        # Technical: stack, structure, routing
│   └── components.md          # Technical: component catalog
└── agent/
    ├── README.md              # Business overview
    ├── gemini-acp/            # Sub-feature (complex → subfolder)
    │   ├── README.md
    │   └── acp-protocol.md
    └── cache-layer.md         # Sub-feature (simple → file)
```

### Scaling Rule

When adding a feature/integration to a module:
- **Simple** → add a single `.md` file to the module folder
- **Complex** → add a subfolder with `README.md` + supporting files
- Update the module's `README.md` with links → done

Subfolders follow the same 2-tier format: `README.md` = business overview, detail files = technical. If a subfolder is small enough, a single README.md can cover both — the agent should ask the user before deciding.

No restrictions on file names, file types, or quantity. Just link from `README.md`.

### Doc Format by Audience

#### Module docs (`docs/`) — 2-tier structure

**`README.md` = Business overview** — for PM, PO, Stakeholders. No code, file trees, or config.

| Section | Content |
|---------|---------|
| Summary | 1-2 sentences: what this module does |
| Capabilities | List main capabilities (bullet points, non-technical) |
| Key Flows | Main flows described in business language (user does X → system returns Y) |
| Detail Files | Links to technical files below |

**Detail files = Technical** — for Dev, Tech Lead. Free-form naming, technical content.

| Example File | Content |
|--------------|---------|
| `architecture.md` | Stack, file tree, config, how to run |
| `api-endpoints.md` | API contracts, request/response schemas |
| `components.md` | Component catalog, wireframes, state management |
| `data-schema.md` | Data models, relationships, lifecycle |

Business users read `README.md` → understand what the module does. Devs read detail files → enough to implement.

#### Change docs (`changes/`, `archived/`) — technical-first, business-anchored

Primary audience is Dev, but must include Goals at the top to anchor to business value.

| Section | Audience | Content |
|---------|----------|---------|
| Summary | Everyone | 1-2 sentences describing the change |
| Goals | Business + Dev | Business objectives — why we're doing this, how to measure success |
| Acceptance Criteria | Dev, QA | Verification checklist — technical language OK |
| Decisions | Dev | Trade-offs already decided (Q&A table) |
| Technical Approach | Dev | Architecture, code snippets, file changes |
| Edge Cases | Dev | Exception handling |

PM reads Summary + Goals → knows we're on the right track. Dev reads 100% → enough to implement.

---

## Workflow: 2 Phases

```
Phase 1                    Gate              Phase 2
Research & Plan ──→ [changes/] ──→ Approve ──→ Implement
                                                  │
                              Update docs/ ←──────┘
                              Move to archived/
```

| Phase | Input | Output | Detail |
|-------|-------|--------|--------|
| 1. Research & Plan | Idea / requirement | Docs in `changes/` | See [1-research-plan.md](./1-research-plan.md) |
| 2. Implement | Approved docs | Code + updated `docs/` | See [2-implement.md](./2-implement.md) |
