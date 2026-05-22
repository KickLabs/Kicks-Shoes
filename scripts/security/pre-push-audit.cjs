const { execSync } = require("node:child_process");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
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

function isLikelyTextFile(filePath) {
  return /\.(js|jsx|ts|tsx|json|yml|yaml|tf|md|txt|env|sh|ps1|dockerfile|cjs|mjs|sql)$/i.test(filePath) ||
    /(^|\/)Dockerfile(\.|$)/i.test(filePath);
}

const blockedFileRules = [
  { pattern: /(^|\\|\/)ket\.md$/i, reason: "Sensitive key file" },
  {
    pattern: /(^|\\|\/)\.env(\..+)?$/i,
    reason: "Environment secrets file",
    allow: /(^|\\|\/)\.env\.(example|template)$/i,
  },
  { pattern: /\.tfstate(\..+)?$/i, reason: "Terraform state file" },
  { pattern: /(^|\\|\/)terraform\.tfvars(\.json)?$/i, reason: "Terraform variables with secrets" },
  { pattern: /(^|\\|\/)\.aws(\\|\/|$)/i, reason: "AWS local credentials/config" },
];

const secretPatterns = [
  { pattern: /AKIA[0-9A-Z]{16}/, reason: "AWS access key" },
  { pattern: /ASIA[0-9A-Z]{16}/, reason: "AWS temporary access key" },
  { pattern: /AWS_SECRET_ACCESS_KEY\s*[:=]\s*[A-Za-z0-9/+]{20,}={0,2}/i, reason: "AWS secret key" },
  { pattern: /AWS_SESSION_TOKEN\s*[:=]\s*[A-Za-z0-9/+]{20,}={0,2}/i, reason: "AWS session token" },
  { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, reason: "Private key material" },
  { pattern: /AIza[0-9A-Za-z\-_]{35}/, reason: "Google API key" },
  { pattern: /ghp_[A-Za-z0-9]{36}/, reason: "GitHub personal access token" },
];

const stagedFiles = toLines(run("git diff --cached --name-only --diff-filter=ACMR"));
const trackedFiles = toLines(run("git ls-files"));

const upstreamFiles = toLines(run("git diff --name-only --diff-filter=ACMR @{u}...HEAD"));
const fallbackFiles = toLines(run("git diff --name-only --diff-filter=ACMR HEAD~1..HEAD"));
const scanCandidates = [...new Set([...stagedFiles, ...upstreamFiles, ...fallbackFiles])];

const blockedTracked = trackedFiles
  .map((file) => ({
    file,
    rule: blockedFileRules.find((rule) => {
      if (!rule.pattern.test(file)) return false;
      if (rule.allow && rule.allow.test(file)) return false;
      return true;
    }),
  }))
  .filter((item) => item.rule);

if (blockedTracked.length > 0) {
  console.error("\n[SECURITY] Blocked sensitive files are currently tracked by Git:\n");
  for (const item of blockedTracked) {
    console.error(`- ${item.file} (${item.rule.reason})`);
  }
  console.error("\nFix: remove from index and rotate leaked secrets if already pushed.");
  process.exit(1);
}

const blockedStaged = stagedFiles
  .map((file) => ({
    file,
    rule: blockedFileRules.find((rule) => {
      if (!rule.pattern.test(file)) return false;
      if (rule.allow && rule.allow.test(file)) return false;
      return true;
    }),
  }))
  .filter((item) => item.rule);

if (blockedStaged.length > 0) {
  console.error("\n[SECURITY] Push blocked: sensitive files found in staged changes:\n");
  for (const item of blockedStaged) {
    console.error(`- ${item.file} (${item.rule.reason})`);
  }
  process.exit(1);
}

const findings = [];
for (const file of scanCandidates) {
  if (!isLikelyTextFile(file)) continue;
  const abs = resolve(process.cwd(), file);
  if (!existsSync(abs)) continue;

  let content = "";
  try {
    content = readFileSync(abs, "utf8");
  } catch {
    continue;
  }

  for (const signature of secretPatterns) {
    if (signature.pattern.test(content)) {
      findings.push({ file, reason: signature.reason });
      break;
    }
  }
}

if (findings.length > 0) {
  console.error("\n[SECURITY] Push blocked: potential secrets detected in changed files:\n");
  for (const finding of findings) {
    console.error(`- ${finding.file} (${finding.reason})`);
  }
  console.error("\nAction: move secrets to AWS Secrets Manager or GitHub Secrets, then commit again.");
  process.exit(1);
}

console.log("[SECURITY] Secret audit passed.");
