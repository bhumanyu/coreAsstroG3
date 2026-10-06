import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('career10h Boundary Enforcement', () => {
  const forbiddenImports = [
    'careerDasha',
    'careerD10',
    'careerExpression',
    'careerProfession',
    'careerFinalSynthesis',
    'domain/timing',
    'careerMechanism'
  ];

  const modulePath = join(__dirname);

  // Dynamic enumeration: automatically include all .ts files in the directory
  const sourceFiles = readdirSync(modulePath)
    .filter(file => file.endsWith('.ts') && file !== 'career10hBoundary.test.ts');

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

        // Check for AI-related imports (word-boundary, case-sensitive uppercase AI segment)
        const aiPattern = /import.*from.*['"][^'"]*\bAI\b[^'"]*['"]/;
        expect(content).not.toMatch(aiPattern);
      });
    });
  }
});
