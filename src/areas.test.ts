import { describe, expect, it } from 'vitest';

import { getAreasForOutcode } from './lib/areas';

describe('getAreasForOutcode', () => {
  it('returns expected areas for CH5 outcode', () => {
    const areas = getAreasForOutcode('CH5');
    expect(areas.map((area) => area.id)).toEqual([
      'connahs-quay',
      'shotton',
      'queensferry',
      'hawarden',
      'ewloe',
      'deeside',
    ]);
  });

  it('normalises full postcodes to match their outcodes', () => {
    const fromOutcode = getAreasForOutcode('CH5');
    const fromPostcode = getAreasForOutcode('CH5 4HS');

    expect(fromPostcode.map((area) => area.id)).toEqual(fromOutcode.map((area) => area.id));
  });
});
