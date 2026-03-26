import { execFileSync, execSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export interface VersionBuild {
    binPath: string
    commitSha: string
    packageManager: "npm" | "pnpm" | "yarn"
    ref: string
    version: string
    worktreePath: string
}

const CACHE_DIR = path.join(os.tmpdir(), "fc-bench-cache")

function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

function getRepoRoot(): string {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim()
}

function resolveRef(ref: string): string {
    try {
        return execSync(`git rev-parse ${ref}`, { encoding: "utf-8" }).trim()
    } catch {
        // Try as remote ref
        return execSync(`git rev-parse origin/${ref}`, { encoding: "utf-8" }).trim()
    }
}

function detectPackageManager(dir: string): "npm" | "pnpm" | "yarn" {
    if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm"
    if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn"
    return "npm"
}

function getVersionFromPackageJson(dir: string): string {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"))
        return pkg.version || "unknown"
    } catch {
        return "unknown"
    }
}

/**
 * Builds a specific git ref into a worktree, installs deps, and compiles.
 * Results are cached by commit SHA — rebuild is skipped if cache exists.
 */
export function prepareVersion(ref: string, label: string): VersionBuild {
    const sha = resolveRef(ref)
    const shortSha = sha.slice(0, 8)
    const worktreePath = path.join(CACHE_DIR, `fc-bench-${label}-${shortSha}`)

    console.log(`[version-manager] Preparing ${label} (${ref} → ${shortSha})...`)

    // Check cache: if worktree exists and has a built lib/ directory, skip
    const binRunPath = path.join(worktreePath, "bin", "run")
    const libDir = path.join(worktreePath, "lib")

    if (fs.existsSync(binRunPath) && fs.existsSync(libDir)) {
        console.log(`[version-manager] Cache hit for ${label} at ${worktreePath}`)
        const pm = detectPackageManager(worktreePath)
        const version = getVersionFromPackageJson(worktreePath)
        return {
            binPath: binRunPath,
            commitSha: sha,
            packageManager: pm,
            ref,
            version,
            worktreePath,
        }
    }

    ensureDir(CACHE_DIR)

    // Remove stale worktree if it exists but isn't fully built
    if (fs.existsSync(worktreePath)) {
        console.log(`[version-manager] Removing stale worktree at ${worktreePath}`)
        try {
            execSync(`git worktree remove --force "${worktreePath}"`, { stdio: "pipe" })
        } catch {
            // If git worktree remove fails, manually clean up
            fs.rmSync(worktreePath, { force: true, recursive: true })
            try {
                execSync(`git worktree prune`, { stdio: "pipe" })
            } catch {
                // ignore
            }
        }
    }

    // Create worktree
    console.log(`[version-manager] Creating worktree for ${ref} at ${worktreePath}...`)
    execSync(`git worktree add "${worktreePath}" ${sha} --detach`, {
        encoding: "utf-8",
        stdio: "pipe",
    })

    const pm = detectPackageManager(worktreePath)
    const version = getVersionFromPackageJson(worktreePath)

    // Install dependencies
    console.log(`[version-manager] Installing deps with ${pm}...`)
    const installCmd = getInstallCommand(pm)
    execSync(installCmd, {
        cwd: worktreePath,
        encoding: "utf-8",
        env: { ...process.env, NODE_ENV: "development" },
        stdio: "pipe",
        timeout: 120_000,
    })

    // Build
    console.log(`[version-manager] Building TypeScript...`)
    try {
        execSync("npx tsc -b", {
            cwd: worktreePath,
            encoding: "utf-8",
            stdio: "pipe",
            timeout: 60_000,
        })
    } catch (error_: unknown) {
        const error = error_ as { stderr?: string }
        // TypeScript may report warnings but still produce output
        if (!fs.existsSync(libDir)) {
            console.error(
                `[version-manager] Build failed for ${label}:`,
                error.stderr?.slice(0, 500),
            )
            throw new Error(`Build failed for ${label} (${ref})`)
        }

        console.log(`[version-manager] Build completed with warnings for ${label}`)
    }

    console.log(`[version-manager] ${label} ready at ${worktreePath}`)

    return {
        binPath: binRunPath,
        commitSha: sha,
        packageManager: pm,
        ref,
        version,
        worktreePath,
    }
}

function getInstallCommand(pm: "npm" | "pnpm" | "yarn"): string {
    switch (pm) {
        case "pnpm": {
            return "pnpm install --frozen-lockfile"
        }

        case "yarn": {
            return "yarn install --frozen-lockfile"
        }

        case "npm": {
            return "npm install"
        }
    }
}

/**
 * Clean up all benchmark worktrees.
 */
export function cleanupWorktrees(): void {
    console.log("[version-manager] Cleaning up benchmark worktrees...")
    if (fs.existsSync(CACHE_DIR)) {
        const entries = fs.readdirSync(CACHE_DIR)
        for (const entry of entries) {
            if (entry.startsWith("fc-bench-")) {
                const fullPath = path.join(CACHE_DIR, entry)
                try {
                    execSync(`git worktree remove --force "${fullPath}"`, { stdio: "pipe" })
                } catch {
                    fs.rmSync(fullPath, { force: true, recursive: true })
                }
            }
        }

        try {
            execSync("git worktree prune", { stdio: "pipe" })
        } catch {
            // ignore
        }
    }

    console.log("[version-manager] Cleanup complete.")
}

/**
 * Get the node_modules size in MB for a built version.
 */
export function getNodeModulesSize(worktreePath: string): number {
    const nmPath = path.join(worktreePath, "node_modules")
    if (!fs.existsSync(nmPath)) return 0
    return getDirSizeMB(nmPath)
}

/**
 * Get the lib/ directory size in MB for a built version.
 */
export function getLibSize(worktreePath: string): number {
    const libPath = path.join(worktreePath, "lib")
    if (!fs.existsSync(libPath)) return 0
    return getDirSizeMB(libPath)
}

function getDirSizeMB(dir: string): number {
    let totalBytes = 0

    function walk(current: string): void {
        const entries = fs.readdirSync(current, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) {
                walk(fullPath)
            } else if (entry.isFile()) {
                totalBytes += fs.statSync(fullPath).size
            }
        }
    }

    walk(dir)
    return Math.round((totalBytes / (1024 * 1024)) * 100) / 100
}

/**
 * Count dependencies from a lock file or package.json.
 */
export function countDependencies(worktreePath: string): number {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(worktreePath, "package.json"), "utf8"))
        const deps = Object.keys(pkg.dependencies || {}).length
        const devDeps = Object.keys(pkg.devDependencies || {}).length
        return deps + devDeps
    } catch {
        return 0
    }
}

/**
 * Count source lines of TypeScript in src/.
 */
export function countSourceLines(worktreePath: string): number {
    const srcDir = path.join(worktreePath, "src")
    if (!fs.existsSync(srcDir)) return 0

    let totalLines = 0

    function walk(dir: string): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(fullPath)
            } else if (entry.isFile() && entry.name.endsWith(".ts")) {
                const content = fs.readFileSync(fullPath, "utf8")
                totalLines += content.split("\n").length
            }
        }
    }

    walk(srcDir)
    return totalLines
}
