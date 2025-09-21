export const VAT_RATE = 0.2;

export interface DistanceBand {
  id: string;
  label: string;
  minDistance: number;
  maxDistance: number;
  surcharge: number;
}

const DISTANCE_BANDS: DistanceBand[] = [
  {
    id: 'local',
    label: 'Local (0–10 miles)',
    minDistance: 0,
    maxDistance: 10,
    surcharge: 0,
  },
  {
    id: 'nearby',
    label: 'Nearby (10–20 miles)',
    minDistance: 10,
    maxDistance: 20,
    surcharge: 20,
  },
  {
    id: 'regional',
    label: 'Regional (20–35 miles)',
    minDistance: 20,
    maxDistance: 35,
    surcharge: 35,
  },
  {
    id: 'extended',
    label: 'Extended (35+ miles)',
    minDistance: 35,
    maxDistance: Number.POSITIVE_INFINITY,
    surcharge: 55,
  },
];

const DEFAULT_DISTANCE_BAND = DISTANCE_BANDS[DISTANCE_BANDS.length - 1];

export const distanceBands = [...DISTANCE_BANDS];

export const BASE_LOCATION = {
  outcode: 'CH5',
  label: 'Connah’s Quay & Deeside',
  latitude: 53.204347497391296,
  longitude: -3.041531686086955,
};

export interface SurveyPricingTier {
  label: string;
  basePrice: number;
  bedroomPremium: number;
}

export const SURVEY_PRICING: Record<string, SurveyPricingTier> = {
  level1: {
    label: 'Level 1 — Condition Report',
    basePrice: 350,
    bedroomPremium: 30,
  },
  level2: {
    label: 'Level 2 — HomeBuyer Survey',
    basePrice: 475,
    bedroomPremium: 45,
  },
  level3: {
    label: 'Level 3 — Building Survey',
    basePrice: 650,
    bedroomPremium: 65,
  },
  damp: {
    label: 'Independent Damp Survey',
    basePrice: 275,
    bedroomPremium: 20,
  },
};

export type SurveyType = keyof typeof SURVEY_PRICING;

export interface ExtraServiceConfig {
  label: string;
  description: string;
  price: number;
}

export const EXTRA_SERVICES: Record<string, ExtraServiceConfig> = {
  valuation: {
    label: 'RICS Market Valuation',
    description: 'Formal valuation carried out alongside the survey.',
    price: 140,
  },
  thermal: {
    label: 'Thermal Imaging Scan',
    description: 'Infrared assessment highlighting heat loss and insulation issues.',
    price: 95,
  },
  damp: {
    label: 'Independent Damp Report',
    description: 'Expanded moisture diagnostics with salt analysis and recommendations.',
    price: 110,
  },
};

export type ExtraService = keyof typeof EXTRA_SERVICES;

interface PropertyValueBand {
  maxValue: number;
  addition: number;
}

const PROPERTY_VALUE_BANDS: PropertyValueBand[] = [
  { maxValue: 275_000, addition: 0 },
  { maxValue: 400_000, addition: 35 },
  { maxValue: 550_000, addition: 75 },
  { maxValue: 750_000, addition: 110 },
  { maxValue: Number.POSITIVE_INFINITY, addition: 165 },
];

export const propertyValueBands = [...PROPERTY_VALUE_BANDS];

export interface QuoteOptions {
  surveyType: SurveyType;
  bedrooms: number;
  propertyValue: number;
  distanceMiles?: number | null;
  extras?: ExtraService[];
}

export interface QuoteBreakdown {
  base: number;
  bedroomAdjustment: number;
  valueAdjustment: number;
  distanceSurcharge: number;
  extrasTotal: number;
  net: number;
  vat: number;
  total: number;
  distanceBand: DistanceBand;
  appliedExtras: Array<{ id: ExtraService; label: string; price: number }>;
}

export interface OutcodeMetadata {
  outcode: string;
  label: string;
  latitude: number;
  longitude: number;
  priority: number;
  areas: string[];
}

export interface OutcodeSuggestion extends OutcodeMetadata {
  distanceMiles: number;
}

const OUTCODE_METADATA: Record<string, OutcodeMetadata> = {
  CH5: {
    outcode: 'CH5',
    label: 'Connah’s Quay, Shotton & Deeside',
    latitude: 53.204347497391296,
    longitude: -3.041531686086955,
    priority: 0,
    areas: [
      'Connah’s Quay',
      'Connahs Quay',
      "Connah's Quay",
      'Shotton',
      'Queensferry',
      'Sealand',
      'Hawarden',
      'Ewloe',
      'Sandycroft',
      'Garden City',
      'Penyffordd',
      'Mancot',
      'Deeside',
    ],
  },
  CH6: {
    outcode: 'CH6',
    label: 'Flint, Oakenholt & Bagillt',
    latitude: 53.249369818385595,
    longitude: -3.1444829977578497,
    priority: 1,
    areas: ['Flint', 'Oakenholt', 'Bagillt', 'Pentre Halkyn', 'Flint Mountain'],
  },
  CH7: {
    outcode: 'CH7',
    label: 'Buckley, Mold & Northop',
    latitude: 53.17003717969733,
    longitude: -3.1321611967213103,
    priority: 1,
    areas: [
      'Buckley',
      'Mold',
      'Northop',
      'Northop Hall',
      'Sychdyn',
      'New Brighton',
      'Penyffordd',
      'Drury',
      'Alltami',
    ],
  },
  CH4: {
    outcode: 'CH4',
    label: 'Broughton, Saltney & Kinnerton',
    latitude: 53.16547435043666,
    longitude: -2.947423124454147,
    priority: 1,
    areas: [
      'Broughton',
      'Saltney',
      'Higher Kinnerton',
      'Lower Kinnerton',
      'Dodleston',
      'Pulford',
      'Bretton',
      'Curzon Park',
      'Handbridge',
      'Lache',
    ],
  },
  CH3: {
    outcode: 'CH3',
    label: 'Waverton, Boughton & Vicars Cross',
    latitude: 53.164654851351365,
    longitude: -2.819672681981981,
    priority: 1,
    areas: [
      'Waverton',
      'Boughton',
      'Vicars Cross',
      'Guilden Sutton',
      'Saighton',
      'Tarvin',
      'Christleton',
      'Huntington',
      'Aldford',
      'Farndon',
      'Tattenhall',
      'Huxley',
    ],
  },
  CH2: {
    outcode: 'CH2',
    label: 'Hoole, Upton & Newton',
    latitude: 53.21805359788968,
    longitude: -2.86898953692849,
    priority: 1,
    areas: ['Hoole', 'Upton', 'Newton', 'Mickle Trafford', 'Moston'],
  },
  CH1: {
    outcode: 'CH1',
    label: 'Chester City, Blacon & Saughall',
    latitude: 53.202623356537856,
    longitude: -2.909792639698939,
    priority: 1,
    areas: ['Chester', 'Blacon', 'Sealand', 'Saughall', 'City Centre'],
  },
  CH8: {
    outcode: 'CH8',
    label: 'Holywell, Greenfield & Halkyn',
    latitude: 53.282993727138674,
    longitude: -3.2463595265486744,
    priority: 2,
    areas: ['Holywell', 'Greenfield', 'Mostyn', 'Halkyn', 'Pentre Halkyn', 'Carmel'],
  },
  CW6: {
    outcode: 'CW6',
    label: 'Tarporley, Kelsall & Bunbury',
    latitude: 53.16219869244601,
    longitude: -2.666821534172662,
    priority: 2,
    areas: ['Tarporley', 'Kelsall', 'Bunbury', 'Utkinton', 'Cotebrook', 'Tilstone Fearnall'],
  },
  LL12: {
    outcode: 'LL12',
    label: 'Rossett, Marford & Gresford',
    latitude: 53.087830759864715,
    longitude: -2.9889996967305543,
    priority: 2,
    areas: ['Rossett', 'Marford', 'Gresford', 'Llay', 'Cefn-y-bedd'],
  },
  LL13: {
    outcode: 'LL13',
    label: 'Holt, Farndon & Wrexham South',
    latitude: 53.03439246775747,
    longitude: -2.9587070827718907,
    priority: 2,
    areas: ['Holt', 'Farndon', 'Marchwiel', 'Bangor-on-Dee', 'Abenbury'],
  },
  LL14: {
    outcode: 'LL14',
    label: 'Ruabon, Rhos & Cefn Mawr',
    latitude: 52.99118173896352,
    longitude: -3.0531495690978923,
    priority: 3,
    areas: ['Ruabon', 'Rhosllanerchrugog', 'Johnstown', 'Cefn Mawr', 'Acrefair'],
  },
  LL11: {
    outcode: 'LL11',
    label: 'Brymbo, Gwersyllt & Pentre Broughton',
    latitude: 53.06358892366995,
    longitude: -3.0363657733230496,
    priority: 3,
    areas: ['Brymbo', 'Gwersyllt', 'Tanyfron', 'Pentre Broughton'],
  },
  CH65: {
    outcode: 'CH65',
    label: 'Ellesmere Port Town Centre',
    latitude: 53.27740971289539,
    longitude: -2.9019708953771244,
    priority: 3,
    areas: ['Ellesmere Port', 'Whitby', 'Overpool', 'Stanney Oaks'],
  },
  CH66: {
    outcode: 'CH66',
    label: 'Great Sutton & Little Sutton',
    latitude: 53.27759118319832,
    longitude: -2.937158060728748,
    priority: 3,
    areas: ['Great Sutton', 'Little Sutton', 'Childer Thornton', 'Ledsham'],
  },
  CH64: {
    outcode: 'CH64',
    label: 'Neston, Parkgate & Willaston',
    latitude: 53.2882811604361,
    longitude: -3.0475894937694665,
    priority: 3,
    areas: ['Neston', 'Parkgate', 'Little Neston', 'Willaston', 'Burton'],
  },
  CH60: {
    outcode: 'CH60',
    label: 'Heswall & Gayton',
    latitude: 53.32650133188723,
    longitude: -3.096076598698483,
    priority: 4,
    areas: ['Heswall', 'Gayton', 'Lower Heswall'],
  },
  CH61: {
    outcode: 'CH61',
    label: 'Thingwall, Pensby & Irby',
    latitude: 53.3491502870813,
    longitude: -3.1019839162679457,
    priority: 4,
    areas: ['Thingwall', 'Pensby', 'Irby', 'Barnston'],
  },
  CH62: {
    outcode: 'CH62',
    label: 'Bromborough, Spital & Port Sunlight',
    latitude: 53.334181898780514,
    longitude: -2.9815520414634147,
    priority: 4,
    areas: ['Bromborough', 'Spital', 'Port Sunlight'],
  },
  CH63: {
    outcode: 'CH63',
    label: 'Bebington & Thornton Hough',
    latitude: 53.34426920777646,
    longitude: -3.0125221227217507,
    priority: 4,
    areas: ['Bebington', 'Higher Bebington', 'Thornton Hough', 'Clatterbridge'],
  },
  WA6: {
    outcode: 'WA6',
    label: 'Frodsham & Helsby',
    latitude: 53.272597193846195,
    longitude: -2.724793174358977,
    priority: 3,
    areas: ['Frodsham', 'Helsby', 'Kingsley', 'Alvanley'],
  },
  WA7: {
    outcode: 'WA7',
    label: 'Runcorn & Sandymoor',
    latitude: 53.33067586653512,
    longitude: -2.7030976226166956,
    priority: 4,
    areas: ['Runcorn', 'Sandymoor', 'Norton', 'Preston Brook'],
  },
  WA8: {
    outcode: 'WA8',
    label: 'Widnes & Cronton',
    latitude: 53.37312734766118,
    longitude: -2.741418227560046,
    priority: 4,
    areas: ['Widnes', 'Cronton', 'Hough Green', 'Ditton'],
  },
  SY14: {
    outcode: 'SY14',
    label: 'Malpas, Tilston & Threapwood',
    latitude: 53.03142412356321,
    longitude: -2.7681025172413807,
    priority: 4,
    areas: ['Malpas', 'Tilston', 'Threapwood', 'No Man’s Heath', 'Shocklach'],
  },
  SY13: {
    outcode: 'SY13',
    label: 'Whitchurch & Border Villages',
    latitude: 52.95203578774124,
    longitude: -2.6896400215664036,
    priority: 5,
    areas: ['Whitchurch', 'Prees Heath', 'Ash', 'Alkington'],
  },
};

const OUTCODE_LIST: OutcodeMetadata[] = Object.values(OUTCODE_METADATA);

const EARTH_RADIUS_MILES = 3958.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function haversineDistanceMiles(
  startLat: number,
  startLon: number,
  targetLat: number,
  targetLon: number,
): number {
  const dLat = toRadians(targetLat - startLat);
  const dLon = toRadians(targetLon - startLon);
  const rLat1 = toRadians(startLat);
  const rLat2 = toRadians(targetLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

const distanceCache = new Map<string, number>();

function distanceFromBase(outcode: string): number {
  const cached = distanceCache.get(outcode);
  if (typeof cached === 'number') {
    return cached;
  }

  const meta = OUTCODE_METADATA[outcode];
  if (!meta) {
    return Number.POSITIVE_INFINITY;
  }

  const distance = haversineDistanceMiles(
    BASE_LOCATION.latitude,
    BASE_LOCATION.longitude,
    meta.latitude,
    meta.longitude,
  );
  const rounded = roundToTwoDecimals(distance);
  distanceCache.set(outcode, rounded);
  return rounded;
}

export function getOutcodeMetadata(outcode: string): OutcodeMetadata | undefined {
  return OUTCODE_METADATA[normaliseOutcode(outcode)];
}

export function calculateDistanceBand(distanceMiles?: number | null): DistanceBand {
  if (!Number.isFinite(distanceMiles ?? NaN)) {
    return DEFAULT_DISTANCE_BAND;
  }

  const safeDistance = Math.max(0, Number(distanceMiles));
  for (const band of DISTANCE_BANDS) {
    if (safeDistance >= band.minDistance && safeDistance <= band.maxDistance) {
      return band;
    }
  }

  return DEFAULT_DISTANCE_BAND;
}

function bedroomAdjustmentFor(type: SurveyType, bedrooms: number): number {
  const config = SURVEY_PRICING[type];
  const safeBedrooms = Number.isFinite(bedrooms) ? Math.max(0, Math.floor(bedrooms)) : 0;
  const premiumableBedrooms = Math.max(0, safeBedrooms - 2);
  return premiumableBedrooms * config.bedroomPremium;
}

function propertyValueAdjustment(propertyValue: number): number {
  const safeValue = Number.isFinite(propertyValue) ? Math.max(0, propertyValue) : 0;
  for (const band of PROPERTY_VALUE_BANDS) {
    if (safeValue <= band.maxValue) {
      return band.addition;
    }
  }
  return 0;
}

function extrasBreakdown(extras: ExtraService[] | undefined) {
  const uniqueExtras = [...new Set(extras ?? [])];
  const applied: Array<{ id: ExtraService; label: string; price: number }> = [];
  let total = 0;

  for (const id of uniqueExtras) {
    const config = EXTRA_SERVICES[id];
    if (!config) continue;
    total += config.price;
    applied.push({ id, label: config.label, price: config.price });
  }

  return { applied, total };
}

function roundToTwoDecimals(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculateQuote(options: QuoteOptions): QuoteBreakdown {
  const survey = SURVEY_PRICING[options.surveyType];
  if (!survey) {
    throw new Error(`Unsupported survey type: ${options.surveyType}`);
  }

  const base = survey.basePrice;
  const bedroomAdjustment = bedroomAdjustmentFor(options.surveyType, options.bedrooms);
  const valueAdjustment = propertyValueAdjustment(options.propertyValue);

  const distanceBand = calculateDistanceBand(options.distanceMiles);
  const distanceSurcharge = distanceBand.surcharge;

  const { applied: appliedExtras, total: extrasTotal } = extrasBreakdown(options.extras);

  const net = roundToTwoDecimals(
    base + bedroomAdjustment + valueAdjustment + distanceSurcharge + extrasTotal,
  );
  const vat = roundToTwoDecimals(net * VAT_RATE);
  const total = roundToTwoDecimals(net + vat);

  return {
    base,
    bedroomAdjustment: roundToTwoDecimals(bedroomAdjustment),
    valueAdjustment: roundToTwoDecimals(valueAdjustment),
    distanceSurcharge: roundToTwoDecimals(distanceSurcharge),
    extrasTotal: roundToTwoDecimals(extrasTotal),
    net,
    vat,
    total,
    distanceBand,
    appliedExtras,
  };
}

export function normalisePostcode(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return '';
  const collapsed = trimmed.replace(/\s+/g, '');
  if (collapsed.length <= 3) {
    return collapsed;
  }
  const outward = collapsed.slice(0, collapsed.length - 3);
  const inward = collapsed.slice(-3);
  return `${outward} ${inward}`;
}

const OUTCODE_PATTERN = /^([A-Z]{1,2}\d[A-Z\d]?)/;

export function extractOutcode(postcode: string): string | null {
  const normalised = normalisePostcode(postcode);
  const match = normalised.match(OUTCODE_PATTERN);
  if (!match) {
    return null;
  }
  return match[1] ?? null;
}

function normaliseOutcode(outcode: string): string {
  return outcode.trim().toUpperCase();
}

export function estimateDistanceFromOutcode(outcode: string): number | null {
  const normalised = normaliseOutcode(outcode);
  if (!OUTCODE_METADATA[normalised]) {
    return null;
  }
  return distanceFromBase(normalised);
}

export function describeOutcode(outcode: string): string | null {
  const meta = getOutcodeMetadata(outcode);
  return meta?.label ?? null;
}

export function matchOutcodes(query: string, limit = 6): OutcodeSuggestion[] {
  const cleanedQuery = query.trim().toLowerCase();
  const baseList = OUTCODE_LIST.map((meta) => ({
    meta,
    distance: distanceFromBase(meta.outcode),
  }));

  if (!cleanedQuery) {
    return baseList
      .sort((a, b) => {
        if (a.meta.priority !== b.meta.priority) {
          return a.meta.priority - b.meta.priority;
        }
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return a.meta.outcode.localeCompare(b.meta.outcode);
      })
      .slice(0, limit)
      .map(({ meta, distance }) => ({ ...meta, distanceMiles: distance }));
  }

  const results: Array<{ meta: OutcodeMetadata; distance: number; rank: number }> = [];

  for (const { meta, distance } of baseList) {
    const haystacks = [meta.outcode, meta.label, ...meta.areas].map((value) =>
      value.toLowerCase(),
    );
    let bestIndex = Number.POSITIVE_INFINITY;
    let matched = false;

    for (const text of haystacks) {
      const index = text.indexOf(cleanedQuery);
      if (index !== -1) {
        matched = true;
        if (index < bestIndex) {
          bestIndex = index;
        }
      }
    }

    if (!matched) continue;

    results.push({ meta, distance, rank: bestIndex });
  }

  results.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (a.meta.priority !== b.meta.priority) {
      return a.meta.priority - b.meta.priority;
    }
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return a.meta.outcode.localeCompare(b.meta.outcode);
  });

  return results.slice(0, limit).map(({ meta, distance }) => ({
    ...meta,
    distanceMiles: distance,
  }));
}

export const outcodeData = OUTCODE_LIST.map((meta) => ({
  ...meta,
  distanceMiles: distanceFromBase(meta.outcode),
}));

export const surveyTypes: Array<{ id: SurveyType; label: string }> = Object.entries(
  SURVEY_PRICING,
).map(([id, config]) => ({
  id: id as SurveyType,
  label: config.label,
}));

export const extraServiceList = Object.entries(EXTRA_SERVICES).map(([id, config]) => ({
  id: id as ExtraService,
  ...config,
}));
