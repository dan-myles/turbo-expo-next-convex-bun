# Monorepo Project

This is an Bun monorepo with TypeScript. The project uses bun workspaces for package management.
The project uses Turborepo for task local & remote caching. Every submodule of this monorepo,
may include its own `AGENTS.md` file, which you must adhere to.

## Project Structure

- `packages/` - Contains all workspace packages (backend, etc.)
- `apps/` - Application definitions split by service, (web, native, etc)
- `tooling/` - ESLint, Typescript and Prettier shared configuration files
- `scripts/` - Shared script folder for repository management

> NOTES: Packages are normally not deployed to the cloud. Convex as a package in
> `packages/backend` _is_ deployed, since it exports types it will reside in
> `packages/` however, it is a cloud app. In general all submodules
> in `apps/` are deployed, and `packages/` not.

## Code Standards

- Use TypeScript with strict mode enabled
- Backend code goes in `packages/backend/` and is written for Convex
- Import shared modules using workspace names, ie. `@acme/backend`
- Be careful of circular dependencies, `apps` may rely on `packages`, not the other way around
- Prefer single word variable/function names
- Avoid `try {} catch() {}` where possible, prefer to let exceptions bubble up
- Avoid `else` statements where possible
- Do not make useless helper functions, inline functionality unless the function is reusable or composable
- Prefer early returns over nested `if` statements
