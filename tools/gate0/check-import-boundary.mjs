// Gate-0 import-boundary check: verifies no runtime/production module under
// src/ (or scripts/, except this harness's own tree) imports anything under
// tools/gate0/. Offline tooling only — not part of the shipped bundle.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
const scanRoots = ['src', 'scripts', 'app', 'pages', 'components', 'lib', 'server'];
const needle = /tools[\\/]gate0|gate0[\\/]/;
const importPattern = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]/g;

const violations = [];
let scanned = 0;

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) yield p;
  }
}

for (const scanRoot of scanRoots) {
  const abs = join(root, scanRoot);
  for (const file of walk(abs)) {
    scanned++;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(importPattern)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (spec && needle.test(spec)) {
        violations.push(`${relative(root, file)} -> ${spec}`);
      }
    }
  }
}

// Also verify the generated fixture file (shipped to production) contains no
// tools/gate0 imports — it must only reference runtime validation modules.
const generated = join(root, 'src/engine/validation/calculationReferenceFixtures.generated.ts');
try {
  const text = readFileSync(generated, 'utf8');
  for (const m of text.matchAll(importPattern)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (spec && needle.test(spec)) {
      violations.push(`generated fixture -> ${spec}`);
    }
  }
} catch { /* generated file absent — nothing to check */ }

console.log(`scanned ${scanned} files under ${scanRoots.join(', ')}`);
if (violations.length > 0) {
  console.error('IMPORT-BOUNDARY VIOLATIONS:');
  for (const v of violations) console.error('  ' + v);
  process.exit(1);
}
console.log('OK: no runtime/production imports from tools/gate0/.');
