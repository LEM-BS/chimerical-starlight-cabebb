import { describe, expect, it } from 'vitest';

import {
  applyVat,
  calculateQuote,
  calculateVatFromGross,
  COMPLEXITY_OPTIONS,
  DISTANCE_BANDS,
  formatCurrency,
  SURVEYS,
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
    expect(applyVat(100)).toBe(100);
    expect(stripVat(120)).toBe(120);
    expect(calculateVatFromGross(120)).toBe(0);
    const gross = 535;
    const net = stripVat(gross);
    const vat = calculateVatFromGross(gross);
    expect(net + vat).toBe(gross);
    expect(net).toBe(gross / (1 + VAT_RATE));
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
    expect(result.base.gross).toBe(515);
    expect(result.total.gross).toBe(515);
    expect(result.total.net).toBe(515);
    expect(result.total.vat).toBe(0);
    expect(result.range).toEqual({ min: 485, max: 545 });
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
    expect(result.total.gross).toBe(840);
    expect(result.total.net).toBe(840);
    expect(result.total.vat).toBe(0);
    expect(result.range).toEqual({ min: 810, max: 870 });
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
      ['property-age', 5],
    ]);
    expect(result.adjustments.every((entry) => entry.amount.gross > 0)).toBe(true);
    expect(result.total.gross).toBe(530);
    expect(result.range).toEqual({ min: 500, max: 560 });
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
      ['property-type', 35],
      ['property-age', 50],
      ['distance', 25],
    ]);
    expect(result.total.gross).toBe(755);
    expect(result.range).toEqual({ min: 725, max: 785 });
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
      ['property-type', 35],
      ['property-age', 90],
      ['extra-bedrooms', 30],
      ['distance', 65],
    ]);
    expect(result.total.gross).toBe(1345);
    expect(result.range).toEqual({ min: 1295, max: 1395 });
  });
});

describe('specialist damp surveys', () => {
  it('lists all specialist damp surveys with updated labels', () => {
    const ids = ['timber-and-damp', 'damp-survey', 'damp-and-mould'] as const;
    const dampSurveys = SURVEYS.filter((survey) => ids.includes(survey.id as (typeof ids)[number]));
    expect(dampSurveys).toHaveLength(3);
    expect(dampSurveys.map((survey) => survey.label)).toEqual([
      'Timber and Damp Investigation',
      'Damp Survey',
      'Damp and Mould Survey',
    ]);
  });

  it('calculates quotes for Timber and Damp Investigation including travel scaling', () => {
    const result = calculateQuote({
      surveyType: 'timber-and-damp',
      propertyValue: 300000,
      bedrooms: 3,
      complexity: 'standard',
      distanceBandId: 'within-35-miles',
    });

    expect(result.survey.label).toBe('Timber and Damp Investigation');
    expect(result.base.gross).toBe(595);
    expect(result.adjustments.map((entry) => entry.id)).toEqual(['value', 'distance']);
    expect(result.adjustments.find((entry) => entry.id === 'distance')?.amount.gross).toBe(35);
    expect(result.total.gross).toBe(655);
    expect(result.range).toEqual({ min: 605, max: 705 });
  });

  it('applies value and complexity scaling for the Damp Survey', () => {
    const result = calculateQuote({
      surveyType: 'damp-survey',
      propertyValue: 600000,
      bedrooms: 2,
      complexity: 'period',
      distanceBandId: 'within-10-miles',
    });

    expect(result.survey.label).toBe('Damp Survey');
    expect(result.base.gross).toBe(495);
    expect(result.adjustments.map((entry) => entry.id)).toEqual(['complexity', 'value']);
    expect(result.adjustments.find((entry) => entry.id === 'complexity')?.amount.gross).toBe(25);
    expect(result.adjustments.find((entry) => entry.id === 'value')?.amount.gross).toBe(70);
    expect(result.total.gross).toBe(590);
    expect(result.range).toEqual({ min: 545, max: 635 });
  });

  it('captures mould-focused reporting adjustments for the Damp and Mould Survey', () => {
    const result = calculateQuote({
      surveyType: 'damp-and-mould',
      propertyValue: 220000,
      bedrooms: 2,
      complexity: 'extended',
      distanceBandId: 'within-20-miles',
    });

    expect(result.survey.label).toBe('Damp and Mould Survey');
    expect(result.base.gross).toBe(525);
    expect(result.adjustments.map((entry) => entry.id)).toEqual(['complexity', 'distance']);
    expect(result.adjustments.find((entry) => entry.id === 'distance')?.amount.gross).toBe(20);
    expect(result.total.gross).toBe(550);
    expect(result.range).toEqual({ min: 505, max: 595 });
  });
});
