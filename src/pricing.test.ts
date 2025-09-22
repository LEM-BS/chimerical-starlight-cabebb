import { describe, expect, it } from 'vitest';

import {
  applyVat,
  calculateQuote,
  calculateVatFromGross,
  COMPLEXITY_OPTIONS,
  DISTANCE_BANDS,
  formatCurrency,
  getDistanceBandById,
  getDistanceBandForMiles,
  getSurveyById,
  parseBedroomsValue,
  parseCurrencyValue,
  roundToNearestFive,
  stripVat,
  VAT_RATE,
} from './lib/pricing';

describe('pricing helpers', () => {
  it('parses currency strings safely', () => {
    expect(parseCurrencyValue('£275,500')).toBe(275500);
    expect(parseCurrencyValue('GBP 98,750.99')).toBeCloseTo(98750.99);
    expect(parseCurrencyValue('not-a-number')).toBe(0);
    expect(parseCurrencyValue(-40)).toBe(0);
  });

  it('parses bedroom counts with sensible limits', () => {
    expect(parseBedroomsValue('4 bedrooms')).toBe(4);
    expect(parseBedroomsValue('12')).toBe(8);
    expect(parseBedroomsValue('studio')).toBe(1);
    expect(parseBedroomsValue(0)).toBe(1);
  });

  it('formats currency and rounds to the nearest five pounds', () => {
    expect(roundToNearestFive(447)).toBe(445);
    expect(formatCurrency(447)).toBe('£445');
  });

  it('performs VAT maths consistently', () => {
    expect(applyVat(100)).toBeCloseTo(120);
    expect(stripVat(120)).toBeCloseTo(100);
    expect(calculateVatFromGross(120)).toBeCloseTo(20);
    const gross = 535;
    const net = stripVat(gross);
    const vat = calculateVatFromGross(gross);
    expect(net + vat).toBeCloseTo(gross);
    expect(net).toBeCloseTo(gross / (1 + VAT_RATE));
  });
});

describe('distance band helpers', () => {
  it('finds a distance band by identifier', () => {
    expect(getDistanceBandById('within-35-miles')).toEqual(DISTANCE_BANDS[2]);
    expect(getDistanceBandById(null)).toBeNull();
  });

  it('selects the correct band for a mileage figure', () => {
    expect(getDistanceBandForMiles(0).id).toBe('within-10-miles');
    expect(getDistanceBandForMiles(19.9).id).toBe('within-20-miles');
    expect(getDistanceBandForMiles(74).id).toBe('over-50-miles');
  });
});

describe('quote engine', () => {
  it('calculates a baseline quote without adjustments', () => {
    const result = calculateQuote({
      surveyType: 'level2',
      propertyValue: 250000,
      bedrooms: 3,
      complexity: 'standard',
      distanceBandId: 'within-10-miles',
    });

    expect(result.survey).toEqual(getSurveyById('level2'));
    expect(result.complexity).toEqual(COMPLEXITY_OPTIONS[0]);
    expect(result.adjustments).toHaveLength(0);
    expect(result.base.gross).toBe(545);
    expect(result.total.gross).toBe(545);
    expect(result.total.net).toBeCloseTo(454.17);
    expect(result.total.vat).toBeCloseTo(90.83);
    expect(result.range).toEqual({ min: 515, max: 575 });
  });

  it('applies value, bedroom, complexity and travel adjustments', () => {
    const result = calculateQuote({
      surveyType: 'level2',
      propertyValue: 800000,
      bedrooms: 5,
      complexity: 'period',
      distanceBandId: 'over-50-miles',
    });

    expect(result.adjustments.map((entry) => entry.id)).toEqual([
      'complexity',
      'extra-bedrooms',
      'distance',
    ]);
    expect(result.total.gross).toBe(940);
    expect(result.total.net).toBeCloseTo(783.33);
    expect(result.total.vat).toBeCloseTo(156.67);
    expect(result.range).toEqual({ min: 910, max: 970 });
  });

  it('applies property metadata surcharges for a mid-terrace 1980s home', () => {
    const result = calculateQuote({
      surveyType: 'level2',
      propertyValue: 185000,
      bedrooms: 3,
      complexity: 'standard',
      distanceBandId: 'within-10-miles',
      propertyType: 'mid-terrace-house',
      propertyAge: '1980-1999',
    });

    expect(result.adjustments.map((entry) => [entry.id, entry.amount.gross])).toEqual([
      ['property-type', 10],
      ['property-age', 10],
    ]);
    expect(result.adjustments.every((entry) => entry.amount.gross > 0)).toBe(true);
    expect(result.total.gross).toBe(565);
    expect(result.range).toEqual({ min: 535, max: 595 });
  });

  it('applies extension and distance surcharges for a Victorian detached home', () => {
    const result = calculateQuote({
      surveyType: 'level2',
      propertyValue: 425000,
      bedrooms: 4,
      complexity: 'standard',
      distanceBandId: 'within-20-miles',
      propertyType: 'detached-house',
      propertyAge: 'victorian-edwardian',
      extensionStatus: 'yes',
    });

    expect(result.adjustments.map((entry) => [entry.id, entry.amount.gross])).toEqual([
      ['property-type', 55],
      ['property-age', 65],
      ['extension', 75],
      ['distance', 25],
    ]);
    expect(result.total.gross).toBe(865);
    expect(result.range).toEqual({ min: 835, max: 895 });
  });

  it('totals the larger surcharges for a complex level 3 survey', () => {
    const result = calculateQuote({
      surveyType: 'level3',
      propertyValue: 645000,
      bedrooms: 5,
      complexity: 'standard',
      distanceBandId: 'within-50-miles',
      propertyType: 'detached-house',
      propertyAge: 'pre-1900',
      extensionStatus: 'yes',
    });

    expect(result.adjustments.map((entry) => [entry.id, entry.amount.gross])).toEqual([
      ['property-type', 55],
      ['property-age', 95],
      ['extension', 75],
      ['extra-bedrooms', 30],
      ['distance', 65],
    ]);
    expect(result.total.gross).toBe(1445);
    expect(result.range).toEqual({ min: 1395, max: 1495 });
  });
});
