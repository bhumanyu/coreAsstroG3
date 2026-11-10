import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

export default async function globalSetup(): Promise<void> {
  try {
    await access(resolve(process.cwd(), 'dist', 'index.html'));
  } catch {
    throw new Error(
      'Production build is missing. Run npm run build before starting browser acceptance.'
    );
  }
}
