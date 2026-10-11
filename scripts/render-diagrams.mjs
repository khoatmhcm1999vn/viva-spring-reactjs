// Render every Mermaid source in docs/architecture/*.mmd to SVG and PNG.
//
//   node scripts/render-diagrams.mjs            # render all diagrams
//   node scripts/render-diagrams.mjs system     # only files whose name contains "system"
//
// Uses @mermaid-js/mermaid-cli through npx with a PINNED version, so nothing has to
// be installed globally and nothing is added to frontend/package.json (that file is
// the Vercel build input; pulling Puppeteer/Chromium into it would slow every deploy).
// The first run downloads the CLI and a headless Chrome into the npx cache.
//
// No shell is involved: arguments are passed as argv, never concatenated into a
// command string. On Windows, npx is a .cmd shim that Node refuses to spawn without a
// shell (EINVAL since the 2024 CVE fix), so we run npm's own npx-cli.js with the
// current node binary instead.
//
// Override the CLI with MMDC_BIN=<path to a local mmdc executable or mmdc .js file>.

import { spawnSync } from 'node:child_process';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MERMAID_CLI_VERSION = '12.0.0';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'docs', 'architecture');
const configFile = path.join(sourceDir, 'mermaid.config.json');
const outputs = [
  { ext: 'svg', dir: path.join(repoRoot, 'docs', 'diagrams', 'svg'), extra: [] },
  // Scale 2 keeps PNG text legible when the image is embedded in slides or docs.
  { ext: 'png', dir: path.join(repoRoot, 'docs', 'diagrams', 'png'), extra: ['-s', '2'] },
];

/** Resolve how to launch mmdc without going through a shell. */
function resolveLauncher() {
  const override = process.env.MMDC_BIN;
  if (override) {
    return override.endsWith('.js') || override.endsWith('.mjs')
      ? { cmd: process.execPath, prefix: [override] }
      : { cmd: override, prefix: [] };
  }

  const npxArgs = ['--yes', '--package', `@mermaid-js/mermaid-cli@${MERMAID_CLI_VERSION}`, 'mmdc'];
  const nodeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npx-cli.js'), // Windows installer layout
    path.join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js'), // POSIX layout
  ];
  const npxCli = candidates.find((candidate) => existsSync(candidate));
  if (npxCli) {
    return { cmd: process.execPath, prefix: [npxCli, ...npxArgs] };
  }
  if (process.platform !== 'win32') {
    return { cmd: 'npx', prefix: npxArgs };
  }
  console.error('Cannot locate npx-cli.js next to node. Set MMDC_BIN to a local mmdc.');
  process.exit(1);
}

if (!existsSync(sourceDir)) {
  console.error(`Missing directory: ${sourceDir}`);
  process.exit(1);
}

const filter = process.argv[2];
const inputs = readdirSync(sourceDir)
  .filter((file) => file.endsWith('.mmd'))
  .filter((file) => !filter || file.includes(filter))
  .sort();

if (inputs.length === 0) {
  console.error(filter ? `No .mmd diagram matches "${filter}".` : 'No .mmd diagrams found.');
  process.exit(1);
}

for (const { dir } of outputs) mkdirSync(dir, { recursive: true });

const launcher = resolveLauncher();
const configArgs = existsSync(configFile) ? ['-c', configFile] : [];
const results = [];

for (const file of inputs) {
  const src = path.join(sourceDir, file);
  for (const { ext, dir, extra } of outputs) {
    const dest = path.join(dir, file.replace(/\.mmd$/, `.${ext}`));
    const args = [...launcher.prefix, '-i', src, '-o', dest, '-b', 'white', ...configArgs, ...extra];
    const result = spawnSync(launcher.cmd, args, { stdio: 'inherit', cwd: repoRoot });
    const ok = result.status === 0 && !result.error;
    if (result.error) console.error(result.error.message);
    results.push({ file, ext, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${file} -> ${path.relative(repoRoot, dest)}`);
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} renders passed.`);
process.exit(failed.length ? 1 : 0);
