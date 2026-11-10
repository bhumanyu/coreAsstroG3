import { spawnSync } from 'node:child_process';

// E2E journeys rely on the dev preset profiles inside BirthFormModal.
// Production builds hide them unless VITE_SHOW_PRESETS=true is set at build time.
const result = spawnSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_SHOW_PRESETS: 'true' }
});
process.exit(result.status ?? 1);
