# Effect + Zodvex Backend Migration (Gamestock v2 Structure)

## Context

### Original Request
- Use `../../work/gamestock/packages/backend/src/v2` as the reference architecture.
- Migrate this repo’s `packages/backend` to match that structure and patterns (no `v2/` folder here).
- Bring in Effect (effect.ts) + typed errors + service DI.
- Keep zodvex at the Convex boundary for typesafe args/returns and custom ctx.
- Adopt `snake_case` file naming for backend.
- OK to change Convex function paths/identifiers.
- Copy/adapt gamestock backend `AGENTS.md` into this repo.
- Add an example `http.ts` showing a Hono-based pattern (example-only).

### Interview Summary
- **Migration style**: full restructure; not incremental.
- **Convex function paths**: allowed to change.
- **File naming**: adopt `snake_case` across `packages/backend`.
- **Testing preference**: manual-only verification (no automated tests required).

### Metis Review
- Unable to run Metis in this environment (tool returned Unauthorized). Plan includes extra guardrails and explicit acceptance criteria to compensate.

---

## Work Objectives

### Core Objective
Reorganize `packages/backend` to match the gamestock v2 backend architecture, using Effect for business logic + DI, zodvex for Convex boundary validation, and a domain-driven module structure, while keeping everything typesafe.

### Concrete Deliverables
- New backend directory layout under `packages/backend/src/`:
  - `services/`, `errors/`, `lib/`, `modules/`, `functions/`, `http/`, `tables/`, `schema.ts`
- Existing functionality (current `tasks` table + task CRUD) migrated into:
  - `modules/task/*.validators.ts` + `modules/task/*.ts` (Effect)
  - `functions/task.ts` (Convex handlers)
- `lib/middleware.ts` updated to match gamestock’s zodvex + custom ctx patterns.
- Effect services for Convex contexts (query/mutation/action + auth/admin variants as needed).
- Typed error taxonomy using `Data.TaggedError`.
- Updated `packages/backend/AGENTS.md` aligned with gamestock backend rules + this repo’s monorepo rules.
- Example HTTP setup:
  - `http/http_errors.ts` with typed HTTP errors + conversion helper
  - `src/http.ts` Convex HTTP entrypoint (canonical)
  - Hono-based router example integrated in a minimal, idiomatic way (example-only).

### Definition of Done
- `packages/backend` builds and typechecks.
- Convex dev server starts successfully.
- Manual verification confirms task CRUD works via the new function paths.
- Repository lint/format checks pass for backend package.

### Must Have
- All public Convex functions use zodvex new-style `{ args, returns, handler }`.
- Business logic is implemented in Effect modules (not inside handlers).
- Backend filenames are `snake_case`.

### Must NOT Have (Guardrails)
- No partial “half v1 / half v2” architecture once migration is complete.
- No silent type loosening (avoid `any`, unsafe casts; only use `as unknown as` in tightly scoped test mocks if needed).
- No leaving dead/duplicate entrypoints behind (remove or forward intentionally).
- Don’t add broad abstractions beyond what exists in gamestock v2; copy the patterns, don’t invent a new framework.

---

## Verification Strategy

### Test Decision
- **User wants automated tests**: NO (manual-only)

### Manual QA (required for every task)
- Typecheck: `bun run typecheck`
- Build: `bun run build`
- Backend lint/format: `bun run lint` and `bun run format` (or repo equivalents)
- Convex dev: `bun run dev` (verify it starts and loads functions)
- Function smoke checks: use Convex dashboard “run function” or `bunx convex run` (if available) to invoke migrated functions.

Note: Even though automated tests aren’t required, the plan includes an optional “test infrastructure” task to match gamestock’s v2 approach and make future refactors safer.

---

## Target Structure (to match gamestock v2)

Implement this under `packages/backend/src/` (no `v2/` folder):

```
src/
  services/
  errors/
  lib/
  modules/
  functions/
  http/
  tables/
  schema.ts
  _generated/
```

---

## TODOs

- [x] 1. Inventory current backend and map to target layout

  **What to do**:
  - Enumerate current entrypoints and paths:
    - `packages/backend/src/modules/**`
    - `packages/backend/src/lib/**`
    - `packages/backend/src/tables/**`
    - `packages/backend/src/schema.ts`
  - Identify current public Convex function identifiers that will change.
  - Identify any existing test tooling/scripts in `packages/backend/package.json`.

  **Parallelizable**: YES (with 2)

  **References**:
  - `packages/backend/ARCHITECTURE.md` - current structure expectations
  - `../../work/gamestock/packages/backend/src/v2` - target structure

  **Acceptance Criteria**:
  - Written mapping notes added into the migration PR description (or a temporary notes section in the plan as comments for executor).


- [x] 2. Add/verify required dependencies and tooling for Effect + Hono

  **What to do**:
  - Add Effect dependencies to `packages/backend/package.json` similar to gamestock.
  - Add Hono dependency for the HTTP example.
  - Optional (recommended even if “manual-only”): add `@effect/vitest` so tests can be added later with a known pattern.
  - Ensure workspace/tooling is aligned with Bun and strict TS.

  **Suggested commands** (executor may adjust to repo conventions):
  - `bun add effect hono`
  - `bun add -d @effect/vitest vitest` (optional scaffolding)

  **Must NOT do**:
  - Don’t change repo-wide tooling unless required; keep changes scoped to `packages/backend` where possible.

  **Parallelizable**: YES (with 1)

  **References**:
  - `../../work/gamestock/packages/backend/package.json` - dependency set (Effect + @effect/vitest patterns)
  - `packages/backend/package.json` - current dependency baseline

  **Acceptance Criteria**:
  - `bun install` completes.
  - `bun run typecheck` succeeds (or only fails due to in-progress migration changes in later tasks).


- [x] 3. Create target directories and migrate file naming to `snake_case`

  **What to do**:
  - Create `src/services`, `src/errors`, `src/lib`, `src/modules`, `src/functions`, `src/http`.
  - Rename/move existing files into new locations using `snake_case`.
  - Update imports accordingly (prefer workspace alias conventions already used by backend).

  **Must NOT do**:
  - Don’t keep duplicate copies of modules in both old and new locations.

  **Parallelizable**: NO (foundation for subsequent tasks)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/modules/user/current.validators.ts` - naming and file split
  - `../../work/gamestock/packages/backend/src/v2/functions/user.ts` - handler wiring layout
  - `packages/backend/src/convex.json` or `packages/backend/convex.json` - confirm Convex entry root

  **Acceptance Criteria**:
  - Repository compiles far enough to allow iterative work (may not fully typecheck yet).
  - All backend files under `packages/backend/src/` follow `snake_case` (excluding generated files).


- [x] 4. Implement Effect service layer (Context.Tag + Layer) aligned to gamestock

  **What to do**:
  - Add `src/services/ctx.ts` implementing the core Convex context services:
    - Query/Mutation/Action ctx services
    - AuthQuery/AuthMutation (+ optional Admin/Internal variants as needed)
  - Add `src/services/db.ts`, `src/services/storage.ts` (if applicable), etc., matching gamestock patterns.
  - Ensure `.live(ctx)` Layer constructors mirror gamestock usage.

  **Parallelizable**: NO (required by modules)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/services/ctx.ts` - canonical ctx services
  - `../../work/gamestock/packages/backend/src/v2/services/db.ts` - Db service pattern

  **Acceptance Criteria**:
  - `bun run typecheck` passes for newly added services in isolation.


- [x] 5. Implement typed error taxonomy using `Data.TaggedError`

  **What to do**:
  - Add `src/errors/common.ts` (e.g. DatabaseError, StorageError) and `src/errors/index.ts` barrel.
  - Add any user-facing errors needed for current modules (even if minimal for tasks).
  - Migrate existing error utilities to either:
    - be removed in favor of TaggedError, or
    - be kept only if still used outside Effect modules.

  **Parallelizable**: YES (with 6)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/errors/common.ts`
  - `../../work/gamestock/packages/backend/src/v2/errors/user.ts`

  **Acceptance Criteria**:
  - New errors compile and can be imported by modules.


- [x] 6. Rebuild zodvex middleware layer to match gamestock patterns

  **What to do**:
  - Update/create `src/lib/middleware.ts`:
    - `query`, `mutation`, `action` via zodvex builders
    - `authQuery`/`authMutation` via `zCustom*Builder` + `customCtx`
  - Export ctx types using `ExtractCtx<typeof authQuery>` pattern.
  - Ensure handler signatures align with gamestock’s usage.

  **Parallelizable**: YES (with 5)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/lib/middleware.ts`
  - `../../work/gamestock/packages/backend/src/lib/middleware.ts` (legacy baseline)
  - `packages/backend/src/lib/middleware.ts` (current baseline)

  **Acceptance Criteria**:
  - At least one trivial `query` can be defined using the middleware without TS errors.


- [ ] 7. Migrate tasks table + schema wiring (keep zodvex)

  **What to do**:
  - Ensure `src/tables/tasks.ts` follows the zodvex `zodTable` pattern.
  - Ensure `src/schema.ts` imports tables similarly to current.
  - Ensure any table-related imports are updated after file renames.

  **Parallelizable**: NO (required by task module)

  **References**:
  - `packages/backend/src/tables/tasks.ts` (current)
  - `../../work/gamestock/packages/backend/src/tables/users.ts` (zodTable usage)

  **Acceptance Criteria**:
  - Convex generates `_generated` types without schema errors when running dev.


- [ ] 8. Migrate task module to validators → Effect → handler pattern

  **What to do**:
  - Create `src/modules/task/` endpoints using gamestock naming:
    - `list.validators.ts` + `list.ts`
    - `create.validators.ts` + `create.ts`
    - `remove.validators.ts` + `remove.ts`
    - `toggle.validators.ts` + `toggle.ts`
  - Each `*.ts` implements business logic as Effect:
    - `Effect.fn("task.list")`, etc.
    - pull services from appropriate ctx (Query/Mutation)
    - use `Effect.tryPromise` for DB calls with DatabaseError mapping
  - Create `src/functions/task.ts` wiring Convex endpoints via zodvex middleware.
  - Remove old `src/modules/task/queries.ts` and `src/modules/task/mutations.ts` (or keep as temporary forwarders only if needed).

  **Parallelizable**: NO (depends on 4, 6, 7)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/modules/user/current.ts` - Effect module shape
  - `../../work/gamestock/packages/backend/src/v2/modules/user/current.validators.ts` - validator file conventions
  - `../../work/gamestock/packages/backend/src/v2/functions/user.ts` - handler wiring via zodvex + Effect.runPromise
  - `packages/backend/src/modules/task/queries.ts` - existing behavior to preserve
  - `packages/backend/src/modules/task/mutations.ts` - existing behavior to preserve

  **Acceptance Criteria**:
  - `bun run typecheck` passes for the new module files.
  - Manual smoke test:
    - Start Convex: `bun run dev`
    - Invoke migrated functions (new paths) to:
      - create a task
      - list tasks
      - toggle a task
      - remove a task
    - Verify expected changes in the tasks table.


- [ ] 9. Add `lib/validators.ts` barrel exports for frontend consumption

  **What to do**:
  - Create `src/lib/validators.ts` that re-exports task validators + types.
  - Follow gamestock’s pattern of exporting both schemas and inferred types.

  **Parallelizable**: YES (after 8)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/lib/validators.ts`

  **Acceptance Criteria**:
  - Frontend can import validator types from backend package (compile-time check).


- [ ] 10. Add HTTP example using Hono + Convex httpAction

  **What to do**:
  - Create `src/http/http_errors.ts` with typed HTTP errors + `error_to_response` converter (gamestock style).
  - Create an example Hono router module (e.g. `src/http/router.ts`) with 1-2 example routes:
    - GET `/health`
    - POST `/webhook/example`
  - Wire Convex HTTP entrypoint at `packages/backend/src/http.ts`:
    - create Convex `httpRouter`
    - mount a Hono app/router
    - return `Response` objects
  - Keep this as “example-only” but compiling and runnable.

  **Must NOT do**:
  - Don’t introduce production auth/security assumptions; keep minimal.

  **Parallelizable**: YES (after 2)

  **References**:
  - `../../work/gamestock/packages/backend/src/v2/http/http_errors.ts`
  - `../../work/gamestock/packages/backend/src/v2/http/handlers/*` - example handler organization

  **Acceptance Criteria**:
  - Manual verification:
    - Run `bun run dev`
    - Hit the `/health` route and receive 200 OK
    - POST to `/webhook/example` and receive a deterministic JSON response


- [ ] 11. Update all callers of Convex functions to new paths

  **What to do**:
  - Find all usages of old generated API paths (e.g. `api.modules.task.*`).
  - Update them to match the new `functions/task.ts` exports (e.g. `api.functions.task.*` or whatever Convex generates given the final file layout).
  - Re-run Convex codegen by starting dev and ensure apps compile.

  **Parallelizable**: NO (depends on 8)

  **References**:
  - `packages/backend/src/_generated/api.d.ts` - authoritative generated API surface
  - `apps/**` - any frontend clients calling Convex

  **Acceptance Criteria**:
  - App(s) that depend on Convex compile and can invoke the migrated functions successfully.


- [ ] 12. Update `packages/backend/AGENTS.md` to match gamestock backend guidance (adapted)

  **What to do**:
  - Replace or heavily rewrite `packages/backend/AGENTS.md` to match gamestock’s backend rules:
    - snake_case filenames
    - 3-layer endpoint pattern
    - Effect.fn + Effect.gen usage
    - Data.TaggedError error taxonomy
    - zodvex middleware builders
    - (Optional) @effect/vitest patterns, even if manual-only today
  - Ensure compatibility with this repo’s root `AGENTS.md` conventions.

  **Parallelizable**: YES

  **References**:
  - `../../work/gamestock/packages/backend/AGENTS.md`
  - `packages/backend/AGENTS.md` (current)
  - `AGENTS.md` (repo root)

  **Acceptance Criteria**:
  - Document explicitly calls out the new canonical structure and patterns.


- [ ] 13. Cleanup: remove old structure, validate end-to-end

  **What to do**:
  - Remove obsolete directories/files from the old layout.
  - Ensure `convex.json` points at the correct functions root (should remain `src/`).
  - Run the repo’s standard checks and ensure backend passes.

  **Parallelizable**: NO

  **References**:
  - `packages/backend/convex.json`
  - `packages/backend/src/_generated/*` (generated output; never edit manually)

  **Acceptance Criteria**:
  - `bun run typecheck` passes
  - `bun run build` passes
  - `bun run dev` starts cleanly


---

## Commit Strategy
- Commit 1: “chore(backend): add effect + hono deps and scaffolding”
- Commit 2: “refactor(backend): adopt gamestock-style structure + snake_case”
- Commit 3: “refactor(backend): migrate task module to validators/effect/handler”
- Commit 4: “docs(backend): align AGENTS.md with new backend architecture”

---

## Success Criteria
- Backend code matches gamestock v2 organization and patterns (minus `v2/` naming).
- No remaining “old style” Convex modules.
- Manual smoke tests validate main behavior.
