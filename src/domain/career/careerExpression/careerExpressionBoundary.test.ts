import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('careerExpression Boundary Enforcement', () => {
  const forbiddenImports = [
    'careerDasha',
    'careerD10',
    'd10/',
    'careerFinalSynthesis',
    'domain/timing',
    'transit',
    'profession',
    'ai'
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

      it('should not import from legacy careerExpression.ts (unless deliberately consumed)', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        // Check for legacy careerExpression import (the file in parent directory)
        // Allow imports from './' (current directory) but not from '../careerExpression'
        const legacyImportPattern = /import.*from.*['"]\.\.\/careerExpression['"]/;
        expect(content).not.toMatch(legacyImportPattern);
      });

      it('should not import from AI modules', () => {
        const filePath = join(modulePath, file);
        const content = readFileSync(filePath, 'utf-8');

        // Check for AI-related imports
        const aiPattern = /import.*from.*['"].*ai.*['"]/i;
        expect(content).not.toMatch(aiPattern);
      });
    });
  }
});
