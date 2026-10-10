import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('careerProfession Boundary Enforcement', () => {
  const forbiddenImports = [
    'careerDasha',
    'd10/',
    'careerFinalSynthesis',
    'domain/timing',
    'transit',
    'AI'
  ];

  const modulePath = join(__dirname);

  // Dynamic enumeration: automatically include all .ts files in the directory
  const sourceFiles = readdirSync(modulePath)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'));

  for (const file of sourceFiles) {
    describe(file, () => {
      it('should not import from forbidden modules', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        for (const forbidden of forbiddenImports) {
          // Check for import statements
          const importPattern = new RegExp(
            `import.*from.*['"].*${forbidden}.*['"]`,
            'i'
          );
          expect(content).not.toMatch(importPattern);
        }
      });

      it('should not import from AI modules', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        // Check for AI-related imports (uppercase-only, case-sensitive)
        // Pattern matches standalone uppercase AI path segments only (e.g. '../AI/engine')
        // Does not match lowercase 'ai' or names like 'openai'/'ai-engine'
        // The 's' flag allows '.' to match newlines for multi-line import statements
        const aiPattern = /import\s+.*\s+from\s+['"][^'"]*\bAI\b[^'"]*['"]/s;
        expect(content).not.toMatch(aiPattern);
      });

      it('should not import from Dasha/event-timing modules used to establish a profession', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        // Check for Dasha imports
        const dashaPattern = /import.*from.*['"].*dasha.*['"]/i;
        expect(content).not.toMatch(dashaPattern);

        // Check for event-timing imports
        const timingPattern = /import.*from.*['"].*timing.*['"]/i;
        expect(content).not.toMatch(timingPattern);
      });

      it('should not import from raw horoscope/chart astrology calculation', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        // Check for direct horoscope/chart calculation imports
        // This module should only consume pre-computed outputs, not perform calculations
        const horoscopePattern = /import.*from.*['"].*horoscope.*['"]/i;
        expect(content).not.toMatch(horoscopePattern);

        const chartPattern = /import.*from.*['"].*chart.*['"]/i;
        expect(content).not.toMatch(chartPattern);
      });

      it('should not self-match the test file itself', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        // The test file should not import from itself
        const selfPattern = new RegExp(
          `import.*from.*['"].*${file}.*['"]`,
          'i'
        );
        expect(content).not.toMatch(selfPattern);
      });
    });
  }
});
