// path: src/pricing/engine.ts

/*
 * Pricing engine and shared helpers for the quote calculator.
 * Note:
 * - Level 1–3 bases come from SURVEY_FEE_BANDS (not SURVEYS[].baseFee).
 * - travelMultiplier now scales distance surcharge so per-survey travel tweaks reflect.
 */

export type SurveyType =
  | 'level1'
  | 'level2'
  | 'level3'
  | 'damp'
  | 'ventilation'
  | 'epc'
  | 'measured';

export type ComplexityType =
  | 'standard'
  | 'interwar'
  | 'extended'
  | 'extended-and-converted'
  | 'victorian'
  | 'period';

export type DistanceBandId =
  | 'within-10-miles'
  | 'within-20-miles'
  | 'within-35-miles'
  | 'within-50-miles'
  | 'over-50-miles';

export interface SurveyDefinition {
  id: SurveyType;
  label: string;
  summary: string;
  turnaround: string;
  highlights: string[];
  baseFee: number;
  valueWeight: number;
  bedroomsIncluded?: number;
  badge?: string;
  travelMultiplier?: number; // scales distance surcharge
}

export interface ComplexityOption {
  id: ComplexityType;
  label: string;
  adjustment: number;
  helper: string;
}

export interface DistanceBand {
  id: DistanceBandId;
  label: string;
  maxMiles: number;
  surcharge: number;
}

export type PropertyTypeId =
  | 'detached-house'
  | 'semi-detached-house'
  | 'end-terrace-house'
  | 'mid-terrace-house'
  | 'flat-apartment'
  | 'bungalow'
  | 'cottage'
  | 'maisonette'
  | 'other';

export type PropertyAgeId =
  | 'unknown'
  | 'new-build'
  | 'post-2000'
  | '1980-1999'
  | '1945-1979'
  | 'interwar'
  | 'victorian-edwardian'
  | 'pre-1900';

export type ExtensionStatusId = 'unknown' | 'no' | 'yes';

export interface SurveyFeeBand {
  minValue: number;
  maxValue: number;
  bedroomsIncluded: number;
  level1: number;
  level2: number;
  level3: number;
}

export interface ExtensionDetailsInput {
  extended?: boolean;
  converted?: boolean;
}

export interface QuoteRange {
  min: number;
  max: number;
}

export interface MoneyBreakdown {
  gross: number;
  net: number;
  vat: number;
}

export interface QuoteAdjustment {
  id: string;
  label: string;
  amount: MoneyBreakdown;
}

export interface QuoteInput {
  surveyType: SurveyType;
  propertyValue: number;
  bedrooms: number;
  complexity: ComplexityType;
  distanceBandId?: DistanceBandId | null;
  propertyType?: PropertyTypeId | 'terraced-house' | null;
  propertyAge?: PropertyAgeId | null;
  extensionStatus?: ExtensionStatusId | null;
  extensionDetails?: ExtensionDetailsInput | null;
}

export interface QuoteResult {
  survey: SurveyDefinition;
  complexity: ComplexityOption;
  distanceBand?: DistanceBand;
  base: MoneyBreakdown;
  adjustments: QuoteAdjustment[];
  total: MoneyBreakdown;
  range: QuoteRange;
}

export const VAT_RATE = 0.0;

export const SURVEYS: readonly SurveyDefinition[] = [
  {
    id: 'level1',
    label: 'RICS Level 1 Home Survey',
    baseFee: 350, // ignored for level surveys; adjust SURVEY_FEE_BANDS instead
    summary:
      'For modern flats or houses in good condition that need a concise overview.',
    turnaround: 'Report within 2–3 working days of the inspection.',
    valueWeight: 0.85,
    highlights: [
      'Traffic-light condition ratings with clear next steps.',
      'Focus on urgent defects and maintenance priorities.',
      'Includes a follow-up call to discuss the findings.',
    ],
  },
  {
    id: 'level2',
    label: 'RICS Level 2 Home Survey',
    baseFee: 475, // ignored for level surveys
    summary: 'Our most requested survey for conventional homes built after 1900.',
    turnaround: 'Report typically delivered 3–5 working days after inspection.',
    valueWeight: 1,
    highlights: [
      'Detailed inspection of the structure, services and finishes.',
      'Advice on repairs, maintenance and budgeting priorities.',
      'Dedicated surveyor to review the report with you.',
    ],
    badge: 'Most requested',
  },
  {
    id: 'level3',
    label: 'RICS Level 3 Building Survey',
    baseFee: 650, // ignored for level surveys
    summary:
      'Best suited to older, extended or complex properties needing deeper analysis.',
    turnaround: 'Allow 5–7 working days for the full written report.',
    valueWeight: 1.35,
    highlights: [
      'Comprehensive fabric analysis with photographic documentation.',
      'Defect diagnosis plus guidance on remedial works and specialists.',
      'Extended phone review to walk through priorities and options.',
    ],
    bedroomsIncluded: 2,
  },
  {
    id: 'damp',
    label: 'Specialist Damp & Timber Investigation',
    baseFee: 545,
    summary:
      'Independent moisture diagnosis with root-cause analysis and action plan.',
    turnaround: 'Report issued within 2–3 working days of the visit.',
    valueWeight: 0.65,
    highlights: [
      'Moisture profiling and timber checks without upselling treatments.',
      'Clear next steps to resolve condensation, rising damp or leaks.',
      'Optional verification visit once remedial work is complete.',
    ],
    bedroomsIncluded: 0,
    travelMultiplier: 0.75,
  },
  {
    id: 'ventilation',
    label: 'Ventilation & Condensation Assessment',
    baseFee: 525,
    summary:
      'Airflow testing and practical guidance for persistent condensation or mould.',
    turnaround: 'Report typically ready within 3–4 working days.',
    valueWeight: 0.7,
    highlights: [
      'Indoor air quality checks and ventilation performance review.',
      'Practical improvements tailored to the property layout.',
      'Advice on balancing heat recovery, trickle vents and extraction.',
    ],
    bedroomsIncluded: 0,
    travelMultiplier: 0.7,
  },
  {
    id: 'epc',
    label: 'EPC with Floorplan',
    baseFee: 180,
    summary:
      'Energy certificate and marketing-ready floorplan for sales or lettings.',
    turnaround: '48-hour turnaround is usually available.',
    valueWeight: 0.45,
    highlights: [
      'Digital EPC lodged with the national register.',
      'High-quality floorplans supplied as PDF and JPG files.',
      'Guidance on quick-win efficiency improvements.',
    ],
    bedroomsIncluded: 0,
    travelMultiplier: 0.55,
  },
  {
    id: 'measured',
    label: 'Measured Survey & Floorplans',
    baseFee: 395,
    summary: 'Laser-measured internal survey producing CAD-ready drawings.',
    turnaround: 'Drawings provided within 5–7 working days.',
    valueWeight: 0.95,
    highlights: [
      'Accurate measurements captured with professional equipment.',
      'Ideal for redesigns, extensions or compliance submissions.',
      'Includes PDF and DWG outputs with minor tweaks included.',
    ],
  },
] as const;

export const COMPLEXITY_OPTIONS: readonly ComplexityOption[] = [
  {
    id: 'standard',
    label: 'Standard construction',
    adjustment: 0,
    helper: 'Typical brick or block construction without major alterations.',
  },
  {
    id: 'interwar',
    label: 'Interwar era (1919–1944)',
    adjustment: 5,
    helper:
      'Homes from 1919–1944 that benefit from extra checks on cavities, insulation and services.',
  },
  {
    id: 'extended',
    label: 'Extended or converted',
    adjustment: 5,
    helper:
      'Includes a loft conversion or sizeable extension requiring additional inspection time.',
  },
  {
    id: 'extended-and-converted',
    label: 'Extended & converted',
    adjustment: 10,
    helper:
      'Both an extension and a conversion or multiple major alterations needing further analysis.',
  },
  {
    id: 'victorian',
    label: 'Victorian / Edwardian',
    adjustment: 15,
    helper:
      'Late 1800s or early 1900s homes with period detailing and known maintenance quirks.',
  },
  {
    id: 'period',
    label: 'Pre-1900 / non-standard',
    adjustment: 45,
    helper: 'Pre-1900 homes, listed buildings or properties with unusual materials.',
  },
] as const;

export const DISTANCE_BANDS: readonly DistanceBand[] = [
  { id: 'within-10-miles', label: '0–10 miles', maxMiles: 10, surcharge: 0 },
  { id: 'within-20-miles', label: '10–20 miles', maxMiles: 20, surcharge: 25 },
  { id: 'within-35-miles', label: '20–35 miles', maxMiles: 35, surcharge: 45 },
  { id: 'within-50-miles', label: '35–50 miles', maxMiles: 50, surcharge: 65 },
  {
    id: 'over-50-miles',
    label: '50+ miles',
    maxMiles: Number.POSITIVE_INFINITY,
    surcharge: 85,
  },
] as const;

const LEVEL_SURVEYS = ['level1', 'level2', 'level3'] as const;

export const SURVEY_FEE_BANDS: readonly SurveyFeeBand[] = [
  {
    minValue: 0,
    maxValue: 150_000,
    bedroomsIncluded: 2,
    level1: 350,
    level2: 475,
    level3: 650,
  },
  {
    minValue: 150_001,
    maxValue: 250_000,
    bedroomsIncluded: 2,
    level1: 370,
    level2: 495,
    level3: 700,
  },
  {
    minValue: 250_001,
    maxValue: 400_000,
    bedroomsIncluded: 2,
    level1: 390,
    level2: 545,
    level3: 735,
  },
  {
    minValue: 400_001,
    maxValue: 600_000,
    bedroomsIncluded: 2,
    level1: 410,
    level2: 595,
    level3: 825,
  },
  {
    minValue: 600_001,
    maxValue: 850_000,
    bedroomsIncluded: 2,
    level1: 625,
    level2: 825,
    level3: 995,
  },
  {
    minValue: 850_001,
    maxValue: 999_999,
    bedroomsIncluded: 2,
    level1: 795,
    level2: 995,
    level3: 1400,
  },
  {
    minValue: 1_000_000,
    maxValue: 1_500_000,
    bedroomsIncluded: 2,
    level1: 725,
    level2: 950,
    level3: 1500,
  }
] as const;

export const EXTRA_BEDROOM_SURCHARGE = 30;

const PROPERTY_TYPE_LABELS: Record<PropertyTypeId, string> = {
  'detached-house': 'Detached house',
  'semi-detached-house': 'Semi-detached house',
  'end-terrace-house': 'End-terrace house',
  'mid-terrace-house': 'Mid-terrace house',
  'flat-apartment': 'Flat / apartment',
  bungalow: 'Bungalow',
  cottage: 'Cottage',
  maisonette: 'Maisonette',
  other: 'Other / not listed',
};

export const PROPERTY_TYPE_ADJUSTMENTS: Record<PropertyTypeId, number> = {
  'detached-house': 35,
  'semi-detached-house': 20,
  'end-terrace-house': 15,
  'mid-terrace-house': 10,
  'flat-apartment': 0,
  bungalow: 25,
  cottage: 45,
  maisonette: 20,
  other: 30,
};

const PROPERTY_AGE_LABELS: Record<PropertyAgeId, string> = {
  unknown: 'Unknown',
  'new-build': 'New build (0–2 years)',
  'post-2000': '2000s onwards',
  '1980-1999': '1980s–1990s',
  '1945-1979': '1945–1970s',
  interwar: '1919–1944',
  'victorian-edwardian': 'Victorian / Edwardian',
  'pre-1900': 'Pre-1900',
};

export const PROPERTY_AGE_ADJUSTMENTS: Record<PropertyAgeId, number> = {
  unknown: 20,
  'new-build': 0,
  'post-2000': 0,
  '1980-1999': 5,
  '1945-1979': 10,
  interwar: 25,
  'victorian-edwardian': 50,
  'pre-1900': 90,
};

export const EXTENDED_CONVERTED_ADJUSTMENTS: Record<ExtensionStatusId, number> = {
  unknown: 0,
  no: 0,
  yes: 20,
};

const VALUE_TIERS: { limit: number; amount: number }[] = [
  { limit: 250_000, amount: 0 },
  { limit: 400_000, amount: 35 },
  { limit: 550_000, amount: 70 },
  { limit: 750_000, amount: 115 },
  { limit: 950_000, amount: 170 },
  { limit: Number.POSITIVE_INFINITY, amount: 240 },
];

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const toTwoDecimals = (value: number): number => Number(value.toFixed(2));

export const roundToNearestFive = (value: number): number => Math.round(value / 5) * 5;

export const parseCurrencyValue = (value: string | number): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric;
};

export const parseBedroomsValue = (value: string | number): number => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return 1;
    return Math.min(Math.round(value), 8);
  }
  const numeric = Number.parseInt(String(value).replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  return Math.min(numeric, 8);
};

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Math.max(0, roundToNearestFive(value)));

export const applyVat = (net: number, rate = VAT_RATE): number =>
  toTwoDecimals(net * (1 + rate));

export const stripVat = (gross: number, rate = VAT_RATE): number =>
  toTwoDecimals(gross / (1 + rate));

export const calculateVatFromGross = (gross: number, rate = VAT_RATE): number =>
  toTwoDecimals(gross - stripVat(gross, rate));

export const getSurveyById = (id: SurveyType): SurveyDefinition =>
  SURVEYS.find((survey) => survey.id === id) ?? SURVEYS[0];

export const getComplexityById = (id: ComplexityType): ComplexityOption =>
  COMPLEXITY_OPTIONS.find((option) => option.id === id) ?? COMPLEXITY_OPTIONS[0];

export const getDistanceBandById = (
  id: DistanceBandId | null | undefined,
): DistanceBand | null => {
  if (!id) return null;
  return DISTANCE_BANDS.find((band) => band.id === id) ?? null;
};

export const getDistanceBandForMiles = (distanceMiles: number): DistanceBand => {
  const clamped = Math.max(0, distanceMiles);
  for (const band of DISTANCE_BANDS) {
    if (clamped <= band.maxMiles) return band;
  }
  return DISTANCE_BANDS[DISTANCE_BANDS.length - 1];
};

const getValueAdjustment = (propertyValue: number, weight: number): number => {
  if (!(propertyValue > 0)) return 0;
  const tier =
    VALUE_TIERS.find((entry) => propertyValue <= entry.limit) ??
    VALUE_TIERS[VALUE_TIERS.length - 1];
  return roundToNearestFive(tier.amount * weight);
};

const toBreakdown = (gross: number): MoneyBreakdown => {
  const roundedGross = roundToNearestFive(gross);
  const net = stripVat(roundedGross);
  const vat = calculateVatFromGross(roundedGross);
  return { gross: roundedGross, net, vat };
};

const isLevelSurveyType = (id: SurveyType): id is (typeof LEVEL_SURVEYS)[number] =>
  (LEVEL_SURVEYS as readonly SurveyType[]).includes(id);

const findSurveyFeeBand = (propertyValue: number) => {
  const value = Number.isFinite(propertyValue) && propertyValue > 0 ? propertyValue : 0;
  return (
    SURVEY_FEE_BANDS.find((band) => value >= band.minValue && value <= band.maxValue) ??
    SURVEY_FEE_BANDS[SURVEY_FEE_BANDS.length - 1]
  );
};

const normalisePropertyType = (value: QuoteInput['propertyType']): PropertyTypeId | null => {
  if (!value) return null;
  const candidate = value === 'terraced-house' ? 'mid-terrace-house' : value;
  if (candidate in PROPERTY_TYPE_ADJUSTMENTS) return candidate as PropertyTypeId;
  return null;
};

const normalisePropertyAge = (value: QuoteInput['propertyAge']): PropertyAgeId | null => {
  if (!value) return null;
  if (value in PROPERTY_AGE_ADJUSTMENTS) return value as PropertyAgeId;
  return null;
};

const normaliseExtensionStatus = (value: QuoteInput['extensionStatus']): ExtensionStatusId => {
  if (value === 'yes' || value === 'no') return value;
  return 'unknown';
};

const SURVEY_RANGE_VARIANCE: Partial<Record<SurveyType, number>> = {
  level1: 25,
  level2: 30,
  level3: 50,
};

const getRangeVariance = (surveyType: SurveyType, roundedTotal: number): number => {
  const override = SURVEY_RANGE_VARIANCE[surveyType];
  if (typeof override === 'number') return roundToNearestFive(Math.max(0, override));
  return Math.max(30, roundToNearestFive(roundedTotal * 0.08));
};

/** Apply per-survey travel scaling so reduced multipliers reflect. */
const getDistanceSurcharge = (
  survey: SurveyDefinition,
  band: DistanceBand | undefined,
): number => {
  if (!band || band.surcharge <= 0) return 0;
  const multiplier = survey.travelMultiplier ?? 1; // why: enable per-survey travel tuning
  const scaled = band.surcharge * multiplier;
  return roundToNearestFive(scaled);
};

export const calculateQuote = ({
  surveyType,
  propertyValue,
  bedrooms,
  complexity,
  distanceBandId,
  propertyType,
  propertyAge,
  extensionStatus,
}: QuoteInput): QuoteResult => {
  const survey = getSurveyById(surveyType);
  const complexityOption = getComplexityById(complexity);
  const distanceBand = getDistanceBandById(distanceBandId ?? null) ?? undefined;

  const isLevelSurvey = isLevelSurveyType(survey.id);
  const band = isLevelSurvey ? findSurveyFeeBand(propertyValue) : null;

  const normalisedPropertyType = normalisePropertyType(propertyType);
  const normalisedPropertyAge = normalisePropertyAge(propertyAge);
  const normalisedExtension = normaliseExtensionStatus(extensionStatus);

  const adjustments: QuoteAdjustment[] = [];

  // Base fee selection:
  // - Level surveys: take from fee band (SURVEY_FEE_BANDS). SURVEYS[].baseFee is ignored here by design.
  // - Non-level: use SURVEYS[].baseFee directly.
  let baseGross = survey.baseFee;
  let bedroomsIncluded = survey.bedroomsIncluded ?? 3;

  if (isLevelSurvey && band) {
    const levelId = survey.id as (typeof LEVEL_SURVEYS)[number];
    baseGross = band[levelId];
    bedroomsIncluded = band.bedroomsIncluded;
  }

  let runningTotal = baseGross;

  // Complexity (scaled by valueWeight)
  if (complexityOption.adjustment !== 0) {
    const complexityAmount = roundToNearestFive(complexityOption.adjustment * survey.valueWeight);
    if (complexityAmount !== 0) {
      adjustments.push({
        id: 'complexity',
        label: complexityOption.label,
        amount: toBreakdown(complexityAmount),
      });
      runningTotal += complexityAmount;
    }
  }

  // Value tier scaling only for non-level surveys
  if (!isLevelSurvey) {
    const valueAdjustment = getValueAdjustment(propertyValue, survey.valueWeight);
    if (valueAdjustment !== 0) {
      adjustments.push({
        id: 'value',
        label:
          propertyValue >= 750_000 ? 'Higher value property review' : 'Property value scaling',
        amount: toBreakdown(valueAdjustment),
      });
      runningTotal += valueAdjustment;
    }
  }

  // Property type / age / extension only for level surveys
  if (isLevelSurvey && normalisedPropertyType) {
    const typeAmount = PROPERTY_TYPE_ADJUSTMENTS[normalisedPropertyType] ?? 0;
    if (typeAmount > 0) {
      adjustments.push({
        id: 'property-type',
        label: PROPERTY_TYPE_LABELS[normalisedPropertyType],
        amount: toBreakdown(typeAmount),
      });
      runningTotal += typeAmount;
    }
  }

  if (isLevelSurvey && normalisedPropertyAge) {
    const ageAmount = PROPERTY_AGE_ADJUSTMENTS[normalisedPropertyAge] ?? 0;
    if (ageAmount > 0) {
      adjustments.push({
        id: 'property-age',
        label: PROPERTY_AGE_LABELS[normalisedPropertyAge],
        amount: toBreakdown(ageAmount),
      });
      runningTotal += ageAmount;
    }
  }

  if (isLevelSurvey) {
    const extensionAmount = EXTENDED_CONVERTED_ADJUSTMENTS[normalisedExtension] ?? 0;
    if (extensionAmount > 0) {
      adjustments.push({
        id: 'extension',
        label: 'Extended/converted',
        amount: toBreakdown(extensionAmount),
      });
      runningTotal += extensionAmount;
    }
  }

  // Extra bedrooms
  if (bedroomsIncluded > 0) {
    const extraBedrooms = Math.max(0, bedrooms - bedroomsIncluded);
    if (extraBedrooms > 0) {
      const bedroomAmount = roundToNearestFive(extraBedrooms * EXTRA_BEDROOM_SURCHARGE);
      adjustments.push({
        id: 'extra-bedrooms',
        label: 'Extra bedrooms',
        amount: toBreakdown(bedroomAmount),
      });
      runningTotal += bedroomAmount;
    }
  }

  // Distance surcharge with per-survey scaling
  const scaledDistance = getDistanceSurcharge(survey, distanceBand);
  if (distanceBand && scaledDistance > 0) {
    adjustments.push({
      id: 'distance',
      label: distanceBand.label,
      amount: toBreakdown(scaledDistance),
    });
    runningTotal += scaledDistance;
  }

  const roundedBase = roundToNearestFive(baseGross);
  const roundedTotal = roundToNearestFive(runningTotal);

  const baseBreakdown = toBreakdown(roundedBase);
  const totalBreakdown = toBreakdown(roundedTotal);

  const variance = getRangeVariance(survey.id, roundedTotal);
  const range: QuoteRange = {
    min: Math.max(0, roundedTotal - variance),
    max: roundedTotal + variance,
  };

  return {
    survey,
    complexity: complexityOption,
    distanceBand,
    base: baseBreakdown,
    adjustments,
    total: totalBreakdown,
    range,
  };
};
