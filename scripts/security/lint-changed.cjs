const { execSync, spawnSync } = require("node:child_process");

function run(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

function toLines(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items)];
}

function getChangedFiles() {
  const stagedFiles = toLines(run("git diff --cached --name-only --diff-filter=ACMR"));
  if (stagedFiles.length > 0) {
    return stagedFiles;
  }

  const hasUpstream = Boolean(run("git rev-parse --abbrev-ref --symbolic-full-name @{u}"));
  if (hasUpstream) {
    return toLines(run("git diff --name-only --diff-filter=ACMR @{u}...HEAD"));
  }

  return toLines(run("git diff --name-only --diff-filter=ACMR HEAD~1..HEAD"));
}

function toBackendPath(file) {
  if (!file.startsWith("backend/")) return null;
  return file.slice("backend/".length);
}

function toFrontendPath(file) {
  if (!file.startsWith("frontend/")) return null;
  return file.slice("frontend/".length);
}

function isLintableSource(file) {
  return /\.(js|jsx|ts|tsx|cjs|mjs)$/i.test(file);
}

function runEslintForProject(projectPath, files, label) {
  if (files.length === 0) {
    console.log(`[LINT-CHANGED] No ${label} source files changed.`);
    return;
  }

  const npmCmd = "npm";
  const args = ["exec", "eslint", "--", "--max-warnings=0", ...files];

  console.log(`[LINT-CHANGED] Linting ${label} files:`);
  for (const file of files) {
    console.log(`- ${file}`);
  }

  const result = spawnSync(npmCmd, args, {
    stdio: "inherit",
    cwd: projectPath,
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`[LINT-CHANGED] Failed to run eslint for ${label}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const changedFiles = getChangedFiles();
const lintableFiles = changedFiles.filter(isLintableSource);

const backendFiles = unique(
  lintableFiles
    .map(toBackendPath)
    .filter(Boolean),
);

const frontendFiles = unique(
  lintableFiles
    .map(toFrontendPath)
    .filter(Boolean),
);

if (backendFiles.length === 0 && frontendFiles.length === 0) {
  console.log("[LINT-CHANGED] No backend/frontend source changes detected. Skipping lint.");
  process.exit(0);
}

runEslintForProject("backend", backendFiles, "backend");
runEslintForProject("frontend", frontendFiles, "frontend");

console.log("[LINT-CHANGED] Changed-file lint passed.");
