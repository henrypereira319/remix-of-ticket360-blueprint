# AGENTS.md

## Project mission

Build a credible ticketing platform inspired by Ticket360 and Sympla.

Current product pillars:

- public event discovery
- event detail and seat-map flows
- checkout with seat holds
- orders, payments and ticket issuance
- account, wallet and support
- organizer and platform operations

## Current architectural direction

The codebase is no longer just a local prototype. The active direction is to make the real backend the primary source of truth while preserving the current frontend contracts.

Agents should optimize for:

- remote-first data flows
- stable frontend contracts
- server-owned business rules
- desktop and mobile parity
- operational clarity in the Obsidian vault

## Read this before large changes

Start here:

1. `progress.txt`
2. `checklist-roadmap.md`
3. `ticket/Welcome.md`
4. the closest note under `ticket/`

Useful repo anchors:

- `src/` for frontend app surfaces
- `server/http/` for the HTTP/BFF layer
- `server/domain/` for business logic
- `server/db/` for schema and migrations
- `docs/` for product references and comparisons

## Non-negotiable working rules

### 1. Obsidian is mandatory

Every meaningful project change must be reflected in the Obsidian vault under `ticket/`.

Required behavior:

- If you change any file outside `ticket/`, also update at least one Markdown note inside `ticket/` in the same commit.
- Changes to `ticket/.obsidian/workspace.json` do not count as documentation.
- Prefer updating the note closest to the work:
  - `ticket/02 - Projeto/Estado Atual.md`
  - `ticket/04 - Operacao/Proximos Passos.md`
  - or an area-specific note for the feature you touched
- If the change affects milestone progress, completion level or execution order, also update `progress.txt` and `checklist-roadmap.md`.

### 2. Do not hide business logic in the client

If a rule is commercially or operationally sensitive, it belongs on the server or must at least have an explicit server-facing contract.

### 3. Do not regress mobile while improving desktop

Every relevant UI change must consider both desktop and mobile experiences. This project does not treat mobile as a late adaptation.

### 4. Do not silently lean on fake local state when a backend domain exists

If the real backend already supports the domain, new work should prefer the backend path. Local fallback is acceptable only when intentional and documented.

## Frontend expectations

When changing frontend behavior:

- preserve existing route contracts unless the task explicitly changes them
- verify `idle`, `loading`, `success`, `empty`, `retryable error` and `hard failure` where relevant
- keep sticky CTAs, purchase clarity and event metadata readable on mobile
- avoid introducing design drift between discovery, PDP, checkout and account
- treat performance as a feature, especially around seat maps and heavy media

When changing visual design:

- prefer intentional hierarchy over generic UI
- maintain consistency with the surrounding surface
- keep accessibility and touch targets in mind

## Backend and contract expectations

When touching backend or shared flows:

- preserve or explicitly migrate the frontend-facing contract
- keep order, payment, inventory and ticket states internally consistent
- avoid duplicate sources of truth across browser and server
- add or extend smoke coverage when a critical path changes

## Verification expectations

Use the smallest meaningful verification for the scope of the change.

Common commands:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run backend:http:smoke`
- `npm run backend:flow:smoke`
- `npm run obsidian:check`

If you do not run a relevant check, say so clearly.

## Commit and documentation guard

This repository uses a pre-commit check that blocks commits with project changes when no Obsidian Markdown note is staged alongside them.

Agents should also avoid staging local-editor noise unless intentional, especially:

- `ticket/.obsidian/workspace.json`

## Definition of done

A change is not fully done when code alone is updated.

Before considering work complete, make sure:

- the implementation is in place
- the most relevant validation was run or explicitly deferred
- the Obsidian vault was updated
- `progress.txt` and `checklist-roadmap.md` were updated when warranted
- the next operator can understand what changed and what remains
