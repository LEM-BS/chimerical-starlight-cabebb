/*
 * Pricing engine and shared helpers for the quote calculator.
 */

export type SurveyType =
  | 'level1'
  | 'level2'
  | 'level3'
  | 'damp'
  | 'ventilation'
  | 'epc'
  | 'measured';

export type ComplexityType = 'standard' | 'extended' | 'period';

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
  travelMultiplier?: number;
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

export const VAT_RATE = 0.2;

export const SURVEYS: readonly SurveyDefinition[] = [
  {
    id: 'level1',
    label: 'RICS Level 1 Home Survey',
    baseFee: 375,
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
    baseFee: 535,
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
    baseFee: 800,
    summary: 'Best suited to older, extended or complex properties needing deeper analysis.',
    turnaround: 'Allow 5–7 working days for the full written report.',
    valueWeight: 1.35,
    highlights: [
      'Comprehensive fabric analysis with photographic documentation.',
      'Defect diagnosis plus guidance on remedial works and specialists.',
      'Extended phone review to walk through priorities and options.',
    ],
    bedroomsIncluded: 4,
  },
  {
    id: 'damp',
    label: 'Specialist Damp & Timber Investigation',
    baseFee: 545,
    summary: 'Independent moisture diagnosis with root-cause analysis and action plan.',
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
    summary: 'Airflow testing and practical guidance for persistent condensation or mould.',
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
    summary: 'Energy certificate and marketing-ready floorplan for sales or lettings.',
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
    id: 'extended',
    label: 'Extended / altered',
    adjustment: 70,
    helper: 'Includes loft conversions, sizeable extensions or multiple outbuildings.',
  },
  {
    id: 'period',
    label: 'Period / non-standard',
    adjustment: 130,
    helper: 'Pre-1900 homes, listed buildings or properties with unusual materials.',
  },
] as const;

export const DISTANCE_BANDS: readonly DistanceBand[] = [
  { id: 'within-10-miles', label: '0–10 miles', maxMiles: 10, surcharge: 0 },
  { id: 'within-20-miles', label: '10–20 miles', maxMiles: 20, surcharge: 12 },
  { id: 'within-35-miles', label: '20–35 miles', maxMiles: 35, surcharge: 22 },
  { id: 'within-50-miles', label: '35–50 miles', maxMiles: 50, surcharge: 38 },
  { id: 'over-50-miles', label: '50+ miles', maxMiles: Number.POSITIVE_INFINITY, surcharge: 55 },
] as const;

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

  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return numeric;
};

export const parseBedroomsValue = (value: string | number): number => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }

    return Math.min(Math.round(value), 8);
  }

  const numeric = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1;
  }

  return Math.min(numeric, 8);
};

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Math.max(0, roundToNearestFive(value)));

export const applyVat = (net: number, rate = VAT_RATE): number => toTwoDecimals(net * (1 + rate));

export const stripVat = (gross: number, rate = VAT_RATE): number =>
  toTwoDecimals(gross / (1 + rate));

export const calculateVatFromGross = (gross: number, rate = VAT_RATE): number =>
  toTwoDecimals(gross - stripVat(gross, rate));

export const getSurveyById = (id: SurveyType): SurveyDefinition =>
  SURVEYS.find((survey) => survey.id === id) ?? SURVEYS[0];

export const getComplexityById = (id: ComplexityType): ComplexityOption =>
  COMPLEXITY_OPTIONS.find((option) => option.id === id) ?? COMPLEXITY_OPTIONS[0];

export const getDistanceBandById = (id: DistanceBandId | null | undefined): DistanceBand | undefined =>
  (id ? DISTANCE_BANDS.find((band) => band.id === id) : undefined);

export const getDistanceBandForMiles = (distanceMiles: number): DistanceBand => {
  const clamped = Math.max(0, distanceMiles);
  for (const band of DISTANCE_BANDS) {
    if (clamped <= band.maxMiles) {
      return band;
    }
  }

  return DISTANCE_BANDS[DISTANCE_BANDS.length - 1];
};

const getValueAdjustment = (propertyValue: number, weight: number): number => {
  if (!(propertyValue > 0)) {
    return 0;
  }

  const tier = VALUE_TIERS.find((entry) => propertyValue <= entry.limit) ?? VALUE_TIERS[VALUE_TIERS.length - 1];
  return roundToNearestFive(tier.amount * weight);
};

const toBreakdown = (gross: number): MoneyBreakdown => {
  const roundedGross = roundToNearestFive(gross);
  const net = stripVat(roundedGross);
  const vat = calculateVatFromGross(roundedGross);

  return { gross: roundedGross, net, vat };
};

export const calculateQuote = ({
  surveyType,
  propertyValue,
  bedrooms,
  complexity,
  distanceBandId,
}: QuoteInput): QuoteResult => {
  const survey = getSurveyById(surveyType);
  const complexityOption = getComplexityById(complexity);
  const distanceBand = getDistanceBandById(distanceBandId ?? undefined);

  const adjustments: QuoteAdjustment[] = [];
  let runningTotal = survey.baseFee;

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

  const valueAdjustment = getValueAdjustment(propertyValue, survey.valueWeight);
  if (valueAdjustment !== 0) {
    adjustments.push({
      id: 'value',
      label: propertyValue >= 750_000 ? 'Higher value property review' : 'Property value scaling',
      amount: toBreakdown(valueAdjustment),
    });
    runningTotal += valueAdjustment;
  }

  const bedroomsIncluded = survey.bedroomsIncluded ?? 3;
  if (bedroomsIncluded > 0) {
    const extraBedrooms = Math.max(0, bedrooms - bedroomsIncluded);
    if (extraBedrooms > 0) {
      const bedroomAmount = roundToNearestFive(extraBedrooms * 32 * survey.valueWeight);
      adjustments.push({
        id: 'bedrooms',
        label: `${extraBedrooms} additional bedroom${extraBedrooms > 1 ? 's' : ''}`,
        amount: toBreakdown(bedroomAmount),
      });
      runningTotal += bedroomAmount;
    }
  }

  if (distanceBand && distanceBand.surcharge > 0) {
    const travelWeight = survey.travelMultiplier ?? survey.valueWeight;
    const travelAmount = roundToNearestFive(distanceBand.surcharge * travelWeight);
    if (travelAmount > 0) {
      adjustments.push({
        id: 'travel',
        label: `Travel (${distanceBand.label})`,
        amount: toBreakdown(travelAmount),
      });
      runningTotal += travelAmount;
    }
  }

  const roundedBase = roundToNearestFive(survey.baseFee);
  const roundedTotal = roundToNearestFive(runningTotal);

  const baseBreakdown = toBreakdown(roundedBase);
  const totalBreakdown = toBreakdown(roundedTotal);

  const variance = Math.max(30, roundToNearestFive(roundedTotal * 0.08));
  const range: QuoteRange = {
    min: Math.max(baseBreakdown.gross, roundedTotal - variance),
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
