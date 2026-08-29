import { describe, expect, it } from 'vitest';
import { classifyQuestion } from './questionClassifier';

describe('questionClassifier (CW-07)', () => {
  it('classifies WHAT_IF counterfactual questions', () => {
    expect(classifyQuestion('What if my ascendant was in Aries?')).toBe('WHAT_IF');
    expect(classifyQuestion('what if Saturn were in the 10th house?')).toBe('WHAT_IF');
    expect(classifyQuestion('Suppose Jupiter was debilitated in Capricorn')).toBe('WHAT_IF');
    expect(classifyQuestion('Assuming my birth time was 10 minutes earlier')).toBe('WHAT_IF');
    expect(classifyQuestion('If I had Mars in 1st house what would happen')).toBe('WHAT_IF');
  });

  it('classifies DASHA_CHALLENGE period questions', () => {
    expect(classifyQuestion('Is my current Rahu Mahadasha creating career problems?')).toBe('DASHA_CHALLENGE');
    expect(classifyQuestion('How does Saturn antardasha affect this outcome?')).toBe('DASHA_CHALLENGE');
    expect(classifyQuestion('Will this Vimshottari period challenge my finances?')).toBe('DASHA_CHALLENGE');
    expect(classifyQuestion('Why is my bhukti causing obstacles?')).toBe('DASHA_CHALLENGE');
  });

  it('classifies DIVISIONAL_CHALLENGE questions (D10 / D2)', () => {
    expect(classifyQuestion('Does D10 confirm my profession?')).toBe('DIVISIONAL_CHALLENGE');
    expect(classifyQuestion('Why does Dashamsha show conflict?')).toBe('DIVISIONAL_CHALLENGE');
    expect(classifyQuestion('Is D2 Hora supporting wealth accumulation?')).toBe('DIVISIONAL_CHALLENGE');
    expect(classifyQuestion('How does the divisional chart modify this?')).toBe('DIVISIONAL_CHALLENGE');
  });

  it('classifies TIMING_CHALLENGE questions (Transits)', () => {
    expect(classifyQuestion('Is current Saturn transit delaying my promotion?')).toBe('TIMING_CHALLENGE');
    expect(classifyQuestion('When will Jupiter gochara trigger wealth?')).toBe('TIMING_CHALLENGE');
    expect(classifyQuestion('What is the timing of this effect?')).toBe('TIMING_CHALLENGE');
  });

  it('classifies WHY_NOT negative inquiry questions', () => {
    expect(classifyQuestion('Why am I not rich yet?')).toBe('WHY_NOT');
    expect(classifyQuestion("Why isn't my business succeeding?")).toBe('WHY_NOT');
    expect(classifyQuestion('Why is my career challenged?')).toBe('WHY_NOT');
    expect(classifyQuestion("Why didn't this yoga manifest?")).toBe('WHY_NOT');
    expect(classifyQuestion('Why no wealth indicated in early years?')).toBe('WHY_NOT');
  });

  it('classifies WHY positive inquiry questions', () => {
    expect(classifyQuestion('Why is career indicated to be strong?')).toBe('WHY');
    expect(classifyQuestion('Why does Jupiter give high wealth?')).toBe('WHY');
    expect(classifyQuestion('Explain why this Raja Yoga forms')).toBe('WHY');
    expect(classifyQuestion('How come the 10th house is prominent?')).toBe('WHY');
  });

  it('classifies MANIFESTATION_CHALLENGE questions', () => {
    expect(classifyQuestion('What is my concrete career manifestation?')).toBe('MANIFESTATION_CHALLENGE');
    expect(classifyQuestion('Why does my wealth stream manifest slowly?')).toBe('MANIFESTATION_CHALLENGE');
    expect(classifyQuestion('Does chart show concrete industry role?')).toBe('MANIFESTATION_CHALLENGE');
  });

  it('falls back to GENERAL_CHALLENGE for generic queries', () => {
    expect(classifyQuestion('Are there any challenges in my chart?')).toBe('GENERAL_CHALLENGE');
    expect(classifyQuestion('What are the main obstacles?')).toBe('GENERAL_CHALLENGE');
  });

  it('returns UNKNOWN for empty question', () => {
    expect(classifyQuestion('')).toBe('UNKNOWN');
    expect(classifyQuestion('   ')).toBe('UNKNOWN');
  });
});
