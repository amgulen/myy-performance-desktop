# ABC-First Interface Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the fastest usable V1 path around direct ABC interface connection and query, with raw response and normalized preview visible in the desktop app.

**Architecture:** Keep business calculation rules out of UI. Add a small `src/application/abc/` service with an injectable ABC client, expose only controlled methods through Electron preload, and render an Apple-like interface center in React. Use a mock ABC client only until real credentials and response samples are available.

**Tech Stack:** Electron, React, TypeScript, Vitest.

---

## File Structure

- Create: `src/application/abc/abc-query-service.ts`
  - Defines ABC config, endpoint type, query result, client contract, and standard preview mapping.
- Create: `src/application/abc/abc-query-service.test.ts`
  - Verifies connection delegation and staff response normalization.
- Create: `src/application/abc/mock-abc-client.ts`
  - Temporary development client that returns safe mock ABC-shaped responses without exposing secrets.
- Create: `src/application/abc/mock-abc-client.test.ts`
  - Verifies mock responses do not leak AppSecret and provide query-shaped data.
- Modify: `src/main/index.ts`
  - Registers controlled IPC handlers for ABC connection test and query.
- Modify: `src/preload/index.ts`
  - Exposes `window.abcApi.testConnection` and `window.abcApi.query`.
- Modify: `src/renderer/src/App.tsx`
  - Implements the selected ABC interface center screen.
- Modify: `src/renderer/src/styles.css`
  - Implements the Apple-like visual system from the selected concept.
- Modify: `src/renderer/src/env.d.ts`
  - Adds renderer-facing ABC API types.
- Modify: `tsconfig.node.json`
  - Includes `src/application/**/*.ts` in node-side typechecking.

## Task 1: Application ABC Query Boundary

- [x] Write failing service test for connection and staff query normalization.
- [x] Run focused test and confirm it fails because `abc-query-service` is missing.
- [x] Implement `createAbcQueryService`.
- [x] Run focused test and confirm it passes.

## Task 2: Mock ABC Client For Fast UI Development

- [x] Write failing mock client test.
- [x] Run focused test and confirm it fails because `mock-abc-client` is missing.
- [x] Implement mock client with staff-shaped ABC payload.
- [x] Run focused test and confirm it passes.

## Task 3: Electron Bridge

- [x] Register `abc:test-connection` and `abc:query` IPC handlers in main process.
- [x] Expose only `testConnection` and `query` through preload.
- [x] Add renderer type declarations.

## Task 4: Selected Apple-Like Interface Center

- [x] Copy selected concept to `docs/superpowers/assets/abc-interface-center-concept.png`.
- [x] Replace scaffold status screen with ABC interface center.
- [x] Add interactive endpoint tabs, connection test, query button, raw JSON, and normalized table.
- [x] Style the first screen with clean white/gray surfaces, restrained blue accent, compact panels, and readable Chinese typography.

## Task 5: Verification

- [ ] Run `npm.cmd run test`.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run build`.
- [ ] Start the local Electron/Vite dev server.
- [ ] Capture the rendered UI and compare it against `docs/superpowers/assets/abc-interface-center-concept.png`.
- [ ] Fix layout, spacing, readability, or interaction issues found during visual QA.
