// Secret / personal-data scan over tracked files (gitleaks is not installed on this machine).
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execSync('git ls-files -z', { encoding: 'utf8' }).split('\0').filter(Boolean);
const RULES = [
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{20,}/], ['OpenAI-style key', /\bsk-[A-Za-z0-9]{32,}/], ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/], ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/], ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Assigned secret', /\b(API_KEY|SECRET|PASSWORD|TOKEN)\s*=\s*['"]?(?!your-|<|\$\{|$)[A-Za-z0-9/+_-]{16,}/],
];
const problems = [];
for (const f of files) {
  if (/^(\.env(?!\.example)|data\/|\.orca\/)/.test(f) || /\.env\.local$/.test(f)) problems.push(`${f}: must not be tracked (env / local data)`);
  if (/\.(png|jpg|zst|tar|ico)$/.test(f)) continue;
  const text = readFileSync(f, 'utf8');
  for (const [name, re] of RULES) if (re.test(text)) problems.push(`${f}: possible ${name}`);
}
problems.forEach(p => console.log(p));
console.log(`secret scan: ${files.length} tracked files, ${problems.length} finding(s)`);
process.exit(problems.length ? 1 : 0);
