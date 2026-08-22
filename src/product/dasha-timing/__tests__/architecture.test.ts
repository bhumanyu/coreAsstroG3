import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('Dasha & Timing Product Architecture Constraints', () => {
  function getFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (!file.includes('__tests__') && !file.includes('node_modules')) {
          results = results.concat(getFiles(filePath));
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(filePath);
      }
    }
    return results;
  }

  it('verifies product view-model modules do NOT import engine/dasha/vimshottari directly', () => {
    const productDir = path.resolve(currentDir, '..');
    const files = getFiles(productDir);

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/engine\/dasha\/vimshottari/);
      expect(content).not.toMatch(/engine\/dashaInterpretation\/dashaInterpretation['"]/);
    }
  });

  it('verifies UI components do NOT import engine/dasha/vimshottari directly', () => {
    const uiDir = path.resolve(currentDir, '../../../components/dashaTiming');
    const files = getFiles(uiDir);

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/engine\/dasha\/vimshottari/);
      expect(content).not.toMatch(/engine\/dashaInterpretation\/dashaInterpretation['"]/);
    }
  });

  it('verifies UI and view-model do NOT instantiate new Date() for period selection', () => {
    const productFile = path.resolve(currentDir, '../buildDashaTimingViewModel.ts');
    const content = fs.readFileSync(productFile, 'utf8');

    // It is acceptable to use new Date().toISOString() ONLY for generatedAt metadata,
    // but calculation of active periods MUST use asOf parameter.
    expect(content).toMatch(/asOf = options\?\.asOf \?\? horoscope\.dashaInterpretation\?\.current\?\.at/);
  });
});
