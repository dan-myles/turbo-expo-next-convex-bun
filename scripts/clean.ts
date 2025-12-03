#!/usr/bin/env bun
import { existsSync } from "node:fs"
import { join } from "node:path"
import { intro, log, outro, spinner } from "@clack/prompts"
import { $ } from "bun"

interface CleanResult {
  name: string
  success: boolean
  deleted: string[]
  error?: unknown
}

interface PackageJson {
  name?: string
  scripts?: {
    clean?: string
  }
}

async function checkTurboInstalled(): Promise<boolean> {
  try {
    await $`turbo --version`.quiet()
    return true
  } catch {
    return false
  }
}

async function getWorkspaces(): Promise<string[]> {
  const rootPackage = (await Bun.file("package.json").json()) as PackageJson & {
    workspaces?: { packages?: string[] }
  }
  const workspacePatterns = rootPackage.workspaces?.packages ?? []

  const workspaces: string[] = []
  for (const pattern of workspacePatterns) {
    const globPattern = pattern.replace(/\/\*$/, "")
    const result = await $`find ${globPattern} -maxdepth 1 -type d`.quiet()
    const dirs = result.stdout.toString().trim().split("\n").filter(Boolean)

    for (const dir of dirs) {
      if (existsSync(join(dir, "package.json"))) {
        workspaces.push(dir)
      }
    }
  }

  return workspaces
}

async function parseCleanTargets(workspacePath: string): Promise<string[]> {
  const packageJsonPath = join(workspacePath, "package.json")

  if (!existsSync(packageJsonPath)) {
    return []
  }

  const packageJson = (await Bun.file(packageJsonPath).json()) as PackageJson
  const cleanScript = packageJson.scripts?.clean

  if (!cleanScript) {
    return []
  }

  const match = cleanScript.match(/git clean -xdf (.+)/)
  if (!match) {
    return []
  }

  return match[1]?.split(/\s+/).filter(Boolean)!
}

async function checkExistingPaths(
  workspacePath: string,
  targets: string[],
): Promise<string[]> {
  const existing: string[] = []

  for (const target of targets) {
    const fullPath = join(workspacePath, target)
    if (existsSync(fullPath)) {
      existing.push(target)
    }
  }

  return existing
}

async function runCleanTask(
  name: string,
  command: string[],
  workspacePath?: string,
): Promise<CleanResult> {
  let deleted: string[] = []

  if (workspacePath) {
    const targets = await parseCleanTargets(workspacePath)
    deleted = await checkExistingPaths(workspacePath, targets)
  }

  try {
    await $`${command}`.quiet()
    return { success: true, name, deleted }
  } catch (error) {
    return { success: false, name, deleted: [], error }
  }
}

function formatCleanResults(results: CleanResult[], hasTurbo: boolean): void {
  const hasFailures = results.some((r) => !r.success)

  if (hasFailures) {
    log.error("Some clean tasks failed!")
    return
  }

  const maxNameLength = Math.max(...results.map((r) => r.name.length))
  const padding = 2

  const rows = results.map((result) => {
    const name = result.name.padEnd(maxNameLength + padding)
    const status = result.success ? "✓" : "✗"
    const deleted =
      result.deleted.length > 0
        ? result.deleted.join(", ")
        : "nothing to delete"

    return `${status}  ${name}  ${deleted}`
  })

  log.message("")
  rows.forEach((row) => log.message(row))
  log.message("")

  if (!hasTurbo) {
    log.info(
      "Note: Turbo was not installed, so workspace cleaning was skipped.",
    )
  }
}

async function main(): Promise<void> {
  intro("🧹 Repository Clean")

  const s = spinner()
  s.start("Checking for Turbo installation")

  const hasTurbo = await checkTurboInstalled()

  if (hasTurbo) {
    s.stop("Turbo detected - will clean workspaces")
  } else {
    s.stop("Turbo not found - skipping workspace clean")
  }

  let workspaces: string[] = []

  if (hasTurbo) {
    const s2 = spinner()
    s2.start("Scanning workspaces...")
    workspaces = await getWorkspaces()
    s2.stop(`Found ${workspaces.length} workspaces`)
  }

  const s3 = spinner()
  s3.start("Running clean operations...")

  try {
    const results: CleanResult[] = []

    // Clean root
    const rootTargets = ["dist", "node_modules", ".cache", ".turbo/cache"]
    const rootDeleted = await checkExistingPaths(".", rootTargets)
    await $`bun run clean:root`.quiet()
    results.push({ success: true, name: "Root Clean", deleted: rootDeleted })

    // Clean workspaces
    if (hasTurbo) {
      for (const workspace of workspaces) {
        const packageJson = (await Bun.file(
          join(workspace, "package.json"),
        ).json()) as PackageJson
        const workspaceName = packageJson.name ?? workspace

        const targets = await parseCleanTargets(workspace)
        const deleted = await checkExistingPaths(workspace, targets)

        if (targets.length > 0) {
          const result = await $`cd ${workspace} && bun run clean`.quiet()
          results.push({
            success: result.exitCode === 0,
            name: workspaceName,
            deleted,
          })
        }
      }
    }

    s3.stop("Clean operations completed")

    formatCleanResults(results, hasTurbo)

    const hasFailures = results.some((r) => !r.success)

    if (hasFailures) {
      outro("❌ Clean operation completed with errors")
      process.exit(1)
    } else {
      outro("✅ Repository successfully cleaned!")
    }
  } catch (error) {
    s3.stop("Clean operation failed")
    log.error(`Unexpected error during clean: ${error}`)
    process.exit(1)
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Clean operation cancelled.")
  process.exit(0)
})

main().catch((error: unknown) => {
  console.error("\n💥 Unexpected error:", error)
  process.exit(1)
})
