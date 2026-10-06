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

        // Check for AI-related imports (word-boundary, case-sensitive uppercase AI segment)
        // Current pattern /\bAI\b/ matches standalone uppercase AI path segments only (e.g. '../AI/engine')
        // It deliberately does not match lowercase 'ai' or names like 'openai'/'ai-engine'
        // If a broader policy is intended, update the regex to /['"][^'"]*\b(?:ai|AI)\b[^'"]*['"]/
        // The 's' flag allows '.' to match newlines for multi-line import statements
        const aiPattern = /import\s+.*\s+from\s+['"][^'"]*\bAI\b[^'"]*['"]/s;
        expect(content).not.toMatch(aiPattern);
      });
    });
  }
});
