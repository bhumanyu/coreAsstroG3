import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const gate0Root = dirname(fileURLToPath(import.meta.url));
process.chdir(resolve(gate0Root, '../..'));
const { runParity } = await import('./dist/run-parity.mjs');
runParity();
