import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
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
  const sourceFiles = [
    'career10HFoundationTypes.ts',
    'career10HFoundationUtils.ts',
    'career10HStructuralAnalyzer.ts',
    'defaultCareer10HFoundation.ts',
    'career10LFoundationTypes.ts',
    'career10LCondition.ts',
    'career10LRelationships.ts',
    'defaultCareer10LFoundation.ts',
    'career10HFoundation.test.ts',
    'career10LFoundation.test.ts'
  ];

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

        // Check for AI-related imports
        const aiPattern = /import.*from.*['"].*ai.*['"]/i;
        expect(content).not.toMatch(aiPattern);
      });
    });
  }
});
