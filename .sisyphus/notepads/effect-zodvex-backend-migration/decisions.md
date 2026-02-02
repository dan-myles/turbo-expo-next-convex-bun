# Architectural Decisions

## [2026-02-02T02:15:00Z] Migration Strategy

### Decision: Full restructure (not incremental)

**Rationale**: User explicitly requested full migration to match gamestock v2 structure. No `v2/` folder - replace current structure entirely.

### Decision: No automated tests required

**Rationale**: User preference is manual-only verification. However, we'll add `@effect/vitest` as optional scaffolding for future test additions.

### Decision: snake_case file naming

**Rationale**: Gamestock v2 uses `snake_case` for all backend files. This is the canonical pattern for this architecture.

### Decision: Keep zodvex at Convex boundary

**Rationale**: zodvex provides type-safe args/returns validation and custom context extension. Effect handles business logic, zodvex handles Convex integration.

### Decision: Use new-style Ctx services (not legacy Db/Auth)

**Rationale**: Gamestock v2 has both patterns, but Ctx services (Query, AuthQuery, etc.) are marked as "preferred for new code". We'll use these for the migration.

### Decision: Simple task module (no auth needed)

**Rationale**: Current tasks are public (no user ownership). We'll use `Query` and `Mutation` services, not `AuthQuery`/`AuthMutation`.

### Decision: HTTP example only (not production)

**Rationale**: User requested "example-only" HTTP setup. Keep minimal - health check + webhook example.

## Current State Analysis

### Frontend Callers
- Only 1 file: `apps/web/src/routes/index.tsx`
- Current: `api.modules.task.queries.list`
- Will become: `api.functions.task.list`

### Current Backend Structure
```
packages/backend/src/
  lib/
    middleware.ts    # Basic zodvex builders
    errors.ts        # neverthrow-style (unused)
    logger.ts        # Simple logger
    env.ts           # Environment vars
  modules/task/
    queries.ts       # 1 query: list
    mutations.ts     # 3 mutations: create, toggle, remove
  tables/
    tasks.ts         # zodTable definition
  schema.ts          # Schema imports
```

### Target Structure
```
packages/backend/src/
  services/
    ctx.ts           # Query, Mutation services
    index.ts         # Barrel export
  errors/
    common.ts        # DatabaseError, StorageError
    index.ts         # Barrel export
  lib/
    middleware.ts    # Extended with internal variants
    validators.ts    # Barrel export for frontend
  modules/task/
    list.validators.ts + list.ts
    create.validators.ts + create.ts
    toggle.validators.ts + toggle.ts
    remove.validators.ts + remove.ts
  functions/
    task.ts          # Handler wiring
  http/
    http_errors.ts   # HTTP error taxonomy
    router.ts        # Hono router example
  tables/
    tasks.ts         # Keep as-is (already zodTable)
  schema.ts          # Keep as-is
  http.ts            # Convex HTTP entrypoint
```

### Files to Remove After Migration
- `lib/errors.ts` (replaced by errors/common.ts)
- `lib/logger.ts` (not used in gamestock pattern)
- `modules/task/queries.ts` (replaced by functions/task.ts)
- `modules/task/mutations.ts` (replaced by functions/task.ts)

### Files to Keep
- `lib/env.ts` (still useful)
- `tables/tasks.ts` (already correct pattern)
- `schema.ts` (already correct pattern)

## Task 1: Inventory & Mapping (2026-02-01)

### Current Backend Inventory

#### Entrypoints & Public Convex Functions

| Current Path | Function Name | Type | Args | Returns | Target Path |
|---|---|---|---|---|---|
| `modules/task/queries.ts` | `list` | query | `{}` | `Doc<"tasks">[]` | `functions/task.ts:list` |
| `modules/task/mutations.ts` | `create` | mutation | `{ text: string }` | `Id<"tasks">` | `functions/task.ts:create` |
| `modules/task/mutations.ts` | `toggle` | mutation | `{ id: Id<"tasks"> }` | `void` | `functions/task.ts:toggle` |
| `modules/task/mutations.ts` | `remove` | mutation | `{ id: Id<"tasks"> }` | `void` | `functions/task.ts:remove` |

#### Generated API Paths (Current)

```
api.modules.task.queries.list
api.modules.task.mutations.create
api.modules.task.mutations.toggle
api.modules.task.mutations.remove
```

#### Generated API Paths (Target)

```
api.functions.task.list
api.functions.task.create
api.functions.task.toggle
api.functions.task.remove
```

### File-by-File Migration Mapping

#### Lib Files

| Current | Target | Action | Notes |
|---|---|---|---|
| `lib/middleware.ts` | `lib/middleware.ts` | Update | Add `internalQuery`, `internalMutation`, `internalAction` builders; add `authQuery`/`authMutation` with custom ctx |
| `lib/errors.ts` | ❌ Remove | Delete | Replaced by `errors/common.ts` with Effect `Data.TaggedError` |
| `lib/logger.ts` | ❌ Remove | Delete | Not used in gamestock pattern |
| `lib/env.ts` | `lib/env.ts` | Keep | No changes needed |
| (new) | `lib/validators.ts` | Create | Barrel export for task validators + inferred types |

#### Module Files

| Current | Target | Action | Notes |
|---|---|---|---|
| `modules/task/queries.ts` | ❌ Remove | Delete | Replaced by `modules/task/list.validators.ts` + `modules/task/list.ts` |
| `modules/task/mutations.ts` | ❌ Remove | Delete | Replaced by individual validator + effect files |
| (new) | `modules/task/list.validators.ts` | Create | Zod schema for list query args |
| (new) | `modules/task/list.ts` | Create | Effect.fn("task.list") implementation |
| (new) | `modules/task/create.validators.ts` | Create | Zod schema for create mutation args |
| (new) | `modules/task/create.ts` | Create | Effect.fn("task.create") implementation |
| (new) | `modules/task/toggle.validators.ts` | Create | Zod schema for toggle mutation args |
| (new) | `modules/task/toggle.ts` | Create | Effect.fn("task.toggle") implementation |
| (new) | `modules/task/remove.validators.ts` | Create | Zod schema for remove mutation args |
| (new) | `modules/task/remove.ts` | Create | Effect.fn("task.remove") implementation |

#### Tables & Schema

| Current | Target | Action | Notes |
|---|---|---|---|
| `tables/tasks.ts` | `tables/tasks.ts` | Keep | Already uses zodTable pattern; no changes |
| `schema.ts` | `schema.ts` | Keep | Already correct; just update imports if needed |

#### New Service Layer

| Current | Target | Action | Notes |
|---|---|---|---|
| (none) | `services/ctx.ts` | Create | Query, Mutation, Action context services (Effect Context.Tag + Layer) |
| (none) | `services/index.ts` | Create | Barrel export for services |

#### New Error Layer

| Current | Target | Action | Notes |
|---|---|---|---|
| (none) | `errors/common.ts` | Create | DatabaseError, StorageError using Data.TaggedError |
| (none) | `errors/index.ts` | Create | Barrel export for errors |

#### New Functions Layer

| Current | Target | Action | Notes |
|---|---|---|---|
| (none) | `functions/task.ts` | Create | Convex handlers wiring validators → Effect → zodvex middleware |

#### New HTTP Layer

| Current | Target | Action | Notes |
|---|---|---|---|
| (none) | `http/http_errors.ts` | Create | Typed HTTP errors + error_to_response converter |
| (none) | `http/router.ts` | Create | Hono router example (health + webhook) |
| (none) | `http.ts` | Create | Convex httpRouter entrypoint |

### Test Tooling Status

**Current**: `package.json` has `"test": "echo 'NO TEST SUITE CONFIGURED'"`

**After Migration**: No automated tests required (manual-only). Optional: add `@effect/vitest` as scaffolding for future test additions.

### Frontend Callers to Update

**File**: `apps/web/src/routes/index.tsx`

**Current Usage**:
```typescript
api.modules.task.queries.list
api.modules.task.mutations.create
api.modules.task.mutations.toggle
api.modules.task.mutations.remove
```

**Target Usage**:
```typescript
api.functions.task.list
api.functions.task.create
api.functions.task.toggle
api.functions.task.remove
```

### Dependencies to Add

- `effect` - Effect library for business logic
- `hono` - HTTP framework for example router
- `@effect/vitest` (optional) - Testing scaffolding

### Summary

- **4 public Convex functions** → migrated to `functions/task.ts` with validators + Effect modules
- **8 new module files** → 4 validator files + 4 Effect implementation files
- **3 new service files** → ctx.ts + services/index.ts
- **2 new error files** → common.ts + errors/index.ts
- **3 new HTTP files** → http_errors.ts + router.ts + http.ts
- **3 files to remove** → old queries.ts, mutations.ts, lib/errors.ts, lib/logger.ts
- **2 files to keep** → tables/tasks.ts, schema.ts, lib/env.ts
- **1 file to update** → lib/middleware.ts (extend with internal + auth variants)
- **1 file to create** → lib/validators.ts (barrel export)
- **1 frontend file to update** → apps/web/src/routes/index.tsx (API paths)

