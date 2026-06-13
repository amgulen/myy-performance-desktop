# Phase 3 Continuation Design

**Date:** 2026-06-13
**Status:** Approved direction from current project review

## Context

The repository now contains confirmed V1.1 requirements, design baseline documents, an Electron/React/TypeScript scaffold, and a small `core` slice for performance atom models and calculation admission. This means the project is no longer a pure pre-coding design repository. It is in Phase 3: coding preparation and controlled core validation.

The old wording in `AGENTS.md` and `CLAUDE.md` said the project was still before coding and should not contain `src/` or `package.json`. That conflicts with the confirmed 2026-05-25 baseline and the existing scaffold commit. The correct interpretation is:

- Keep the existing scaffold.
- Continue only within the approved V1 boundaries.
- Treat `core` and Excel validation as the first implementation track.
- Keep ABC real credentials, real response fields, final enabled rule versions, and final reconciliation as release blockers, not core development blockers.

## Recommended Approach

Use incremental Phase 3 development rather than deleting and recreating the project. The existing scaffold is thin, aligned with the target stack, and has passing tests. Deleting it would add churn without improving the business architecture.

The next development slice is ABC-first. The user explicitly prefers avoiding detours through prolonged Excel validation and wants the fastest usable path through direct ABC interface connection and query. Excel remains a fallback capability, but it is no longer the primary implementation path.

## Boundaries

The next slice may add:

- A small application-level ABC query service with an injectable ABC client boundary.
- A temporary mock ABC client for UI and workflow development until real AppId/AppSecret and actual response samples are available.
- Electron IPC methods for connection testing and query execution.
- An Apple-like ABC interface center screen with connection, query, raw response, and normalized preview areas.
- Normalized preview rows that preserve source trace fields and do not directly enter final calculation.

The next slice must not add:

- Hard-coded percentages, amounts, thresholds, weights, grades, penalties, or position coefficients.
- Real hospital rule values as active defaults.
- SQLite schema or persistence code.
- ABC real network calls before credentials, endpoint contract, and response samples are confirmed.
- Credential persistence or logging.
- Login, accounts, permissions, cloud services, mobile, doctor portal, or finance remote login.

## Architecture

`src/core/` remains platform-independent. The ABC-first slice adds `src/application/abc/` as the query/use-case boundary and uses Electron main/preload as the controlled local bridge. Renderer code must call the exposed IPC API rather than accessing Node, files, SQLite, or secrets directly.

The temporary mock client is a replaceable stand-in, not business truth. It exists only so the ABC interface center can be developed before real ABC credentials and response samples arrive.

## Testing

Application service behavior should be introduced test first. Verification for this slice is:

```powershell
npm.cmd run test
```

Where sandbox restrictions block Vitest config loading, the command may need to run outside the sandbox because the failure is environmental rather than a project failure.

## Handoff

Implementation should follow the plan in:

`docs/superpowers/plans/2026-06-13-core-foundation-next-slice.md`
