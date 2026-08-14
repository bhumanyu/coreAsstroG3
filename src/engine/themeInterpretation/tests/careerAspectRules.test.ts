import { describe, it, expect } from 'vitest';
import { careerAspectRules } from '../rules/career/careerAspectRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet } from '../../../types';

describe('careerAspectRules', () => {
  it('triggers aspect rule when 10th house receives aspects', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          10: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.JUPITER],
                  sourceHouse: 4,
                  aspectType: 'FULL'
                }
              ]
            }
          }
        }
      } as any
    };

    const rule = careerAspectRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const evList = res.evidence as any[];
    expect(evList.length).toBe(1);
    expect(evList[0].evidenceFamily).toBe('ASPECT');
  });

  it('returns false when no aspects are present', () => {
    const context: ThemeInterpretationContext = {};
    const rule = careerAspectRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });
});
