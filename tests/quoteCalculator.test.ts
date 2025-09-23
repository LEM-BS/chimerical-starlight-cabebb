import { describe, expect, it } from 'vitest';

import { extractPostcodeFromAddress } from '../src/components/QuoteCalculator';

describe('extractPostcodeFromAddress', () => {
  it('returns the full postcode when the address ends with a separated inward code', () => {
    expect(extractPostcodeFromAddress('10 High Street, Mold CH7 1AA')).toBe('CH7 1AA');
  });

  it('returns the outward code when only the prefix is present', () => {
    expect(extractPostcodeFromAddress('Apartment 3, Example House, CH7')).toBe('CH7');
  });

  it('normalises lowercase postcodes', () => {
    expect(extractPostcodeFromAddress('lower-case ch7 1aa')).toBe('CH7 1AA');
  });

  it('falls back to an empty string when no postcode can be detected', () => {
    expect(extractPostcodeFromAddress('10 High Street, Mold')).toBe('');
  });
});
