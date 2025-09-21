import { describe, expect, it } from 'vitest';

import {
  VAT_RATE,
  calculateDistanceBand,
  calculateQuote,
  describeOutcode,
  estimateDistanceFromOutcode,
  extractOutcode,
  matchOutcodes,
  normalisePostcode,
} from './pricing';

describe('postcode utilities', () => {
  it('normalises postcode spacing and case', () => {
    expect(normalisePostcode(' ch5\t1ab ')).toBe('CH5 1AB');
    expect(normalisePostcode('cw60aa')).toBe('CW6 0AA');
  });

  it('extracts the outcode from full postcodes', () => {
    expect(extractOutcode('ch5 1ab')).toBe('CH5');
    expect(extractOutcode('CW60aa')).toBe('CW6');
    expect(extractOutcode('l1 2ab')).toBe('L1');
    expect(extractOutcode('not-a-postcode')).toBeNull();
  });
});

describe('distance helpers', () => {
  it('estimates distance from known outcodes', () => {
    expect(estimateDistanceFromOutcode('CH6')).toBeCloseTo(5.27, 2);
    expect(estimateDistanceFromOutcode('CW6')).toBeCloseTo(15.79, 2);
    expect(estimateDistanceFromOutcode('SY13')).toBeCloseTo(22.74, 2);
    expect(estimateDistanceFromOutcode('ZZ99')).toBeNull();
  });

  it('returns the correct distance band', () => {
    expect(calculateDistanceBand(4).id).toBe('local');
    expect(calculateDistanceBand(14).id).toBe('nearby');
    expect(calculateDistanceBand(28).id).toBe('regional');
    expect(calculateDistanceBand(48).id).toBe('extended');
    expect(calculateDistanceBand(undefined).id).toBe('extended');
  });
});

describe('outcode matching', () => {
  it('matches on outcode labels and aliases', () => {
    const results = matchOutcodes('tarporley');
    expect(results[0]?.outcode).toBe('CW6');
    expect(results.length).toBeGreaterThan(0);
  });

  it('falls back to local outcodes when query empty', () => {
    const results = matchOutcodes('');
    expect(results).toHaveLength(6);
    expect(results[0].outcode).toBe('CH5');
  });
});

describe('quote calculation', () => {
  it('calculates totals with VAT and extras', () => {
    const quote = calculateQuote({
      surveyType: 'level2',
      bedrooms: 3,
      propertyValue: 325_000,
      distanceMiles: 8,
      extras: ['valuation', 'thermal'],
    });

    expect(quote.base).toBe(475);
    expect(quote.bedroomAdjustment).toBe(45);
    expect(quote.valueAdjustment).toBe(35);
    expect(quote.distanceSurcharge).toBe(0);
    expect(quote.extrasTotal).toBe(235);
    expect(quote.net).toBe(790);
    expect(quote.vat).toBeCloseTo(quote.net * VAT_RATE, 5);
    expect(quote.total).toBe(948);
    expect(quote.distanceBand.id).toBe('local');
    expect(quote.appliedExtras.map((extra) => extra.id)).toEqual([
      'valuation',
      'thermal',
    ]);
  });

  it('applies fallback distance when not provided', () => {
    const quote = calculateQuote({
      surveyType: 'level1',
      bedrooms: 2,
      propertyValue: 800_000,
      distanceMiles: null,
      extras: [],
    });

    expect(quote.base).toBe(350);
    expect(quote.bedroomAdjustment).toBe(0);
    expect(quote.valueAdjustment).toBe(165);
    expect(quote.distanceSurcharge).toBe(55);
    expect(quote.net).toBe(570);
    expect(quote.total).toBe(684);
    expect(quote.distanceBand.id).toBe('extended');
  });

  it('describes known outcodes', () => {
    expect(describeOutcode('CH4')).toContain('Broughton');
    expect(describeOutcode('ZZ99')).toBeNull();
  });
});
