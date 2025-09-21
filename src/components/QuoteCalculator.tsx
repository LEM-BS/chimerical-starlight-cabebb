import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SurveyType =
  | 'level1'
  | 'level2'
  | 'level3'
  | 'damp'
  | 'ventilation'
  | 'epc'
  | 'measured';

type ComplexityType = 'standard' | 'extended' | 'period';

interface SurveyOption {
  value: SurveyType;
  label: string;
  baseFee: number;
  summary: string;
  turnaround: string;
  valueWeight: number;
  highlights: string[];
  bedroomsIncluded?: number;
  badge?: string;
}

interface ComplexityOption {
  value: ComplexityType;
  label: string;
  adjustment: number;
  helper: string;
}

interface AdjustmentDetail {
  label: string;
  amount: number;
}

interface QuoteRange {
  min: number;
  max: number;
}

interface QuoteEstimate {
  baseFee: number;
  total: number;
  adjustments: AdjustmentDetail[];
  range: QuoteRange;
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface SubmissionState {
  status: SubmissionStatus;
  message: string;
}

const SURVEY_OPTIONS: SurveyOption[] = [
  {
    value: 'level1',
    label: 'RICS Level 1 Home Survey',
    baseFee: 325,
    summary: 'For modern flats or houses in good condition that need a concise overview.',
    turnaround: 'Report within 2–3 working days of the inspection.',
    valueWeight: 0.85,
    highlights: [
      'Traffic-light condition ratings with clear next steps.',
      'Focus on urgent defects and maintenance priorities.',
      'Includes a follow-up call to discuss the findings.',
    ],
  },
  {
    value: 'level2',
    label: 'RICS Level 2 Home Survey',
    baseFee: 465,
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
    value: 'level3',
    label: 'RICS Level 3 Building Survey',
    baseFee: 695,
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
    value: 'damp',
    label: 'Specialist Damp & Timber Investigation',
    baseFee: 285,
    summary: 'Independent moisture diagnosis with root-cause analysis and action plan.',
    turnaround: 'Report issued within 2–3 working days of the visit.',
    valueWeight: 0.65,
    highlights: [
      'Moisture profiling and timber checks without upselling treatments.',
      'Clear next steps to resolve condensation, rising damp or leaks.',
      'Optional verification visit once remedial work is complete.',
    ],
    bedroomsIncluded: 0,
  },
  {
    value: 'ventilation',
    label: 'Ventilation & Condensation Assessment',
    baseFee: 225,
    summary: 'Airflow testing and practical guidance for persistent condensation or mould.',
    turnaround: 'Report typically ready within 3–4 working days.',
    valueWeight: 0.7,
    highlights: [
      'Indoor air quality checks and ventilation performance review.',
      'Practical improvements tailored to the property layout.',
      'Advice on balancing heat recovery, trickle vents and extraction.',
    ],
    bedroomsIncluded: 0,
  },
  {
    value: 'epc',
    label: 'EPC with Floorplan',
    baseFee: 155,
    summary: 'Energy certificate and marketing-ready floorplan for sales or lettings.',
    turnaround: '48-hour turnaround is usually available.',
    valueWeight: 0.45,
    highlights: [
      'Digital EPC lodged with the national register.',
      'High-quality floorplans supplied as PDF and JPG files.',
      'Guidance on quick-win efficiency improvements.',
    ],
    bedroomsIncluded: 0,
  },
  {
    value: 'measured',
    label: 'Measured Survey & Floorplans',
    baseFee: 345,
    summary: 'Laser-measured internal survey producing CAD-ready drawings.',
    turnaround: 'Drawings provided within 5–7 working days.',
    valueWeight: 0.95,
    highlights: [
      'Accurate measurements captured with professional equipment.',
      'Ideal for redesigns, extensions or compliance submissions.',
      'Includes PDF and DWG outputs with minor tweaks included.',
    ],
  },
];

const COMPLEXITY_OPTIONS: ComplexityOption[] = [
  {
    value: 'standard',
    label: 'Standard construction',
    adjustment: 0,
    helper: 'Typical brick or block construction without major alterations.',
  },
  {
    value: 'extended',
    label: 'Extended / altered',
    adjustment: 70,
    helper: 'Includes loft conversions, sizeable extensions or multiple outbuildings.',
  },
  {
    value: 'period',
    label: 'Period / non-standard',
    adjustment: 130,
    helper: 'Pre-1900 homes, listed buildings or properties with unusual materials.',
  },
];

const VALUE_TIERS: { limit: number; amount: number }[] = [
  { limit: 250_000, amount: 0 },
  { limit: 400_000, amount: 35 },
  { limit: 550_000, amount: 70 },
  { limit: 750_000, amount: 115 },
  { limit: 950_000, amount: 170 },
  { limit: Number.POSITIVE_INFINITY, amount: 240 },
];

const SURVEY_HINT_ID = 'quote-survey-hint';
const VALUE_HINT_ID = 'quote-value-hint';
const BEDROOM_HINT_ID = 'quote-bedroom-hint';
const COMPLEXITY_HINT_ID = 'quote-complexity-hint';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const roundToNearestFive = (value: number): number => Math.round(value / 5) * 5;

const parseCurrencyValue = (value: string): number => {
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return numeric;
};

const parseBedroomsValue = (value: string): number => {
  const numeric = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 1;
  }

  return Math.min(numeric, 8);
};

const formatCurrency = (value: number): string => currencyFormatter.format(Math.max(0, roundToNearestFive(value)));

const getValueAdjustment = (propertyValue: number, weight: number): number => {
  if (!(propertyValue > 0)) {
    return 0;
  }

  const tier = VALUE_TIERS.find((entry) => propertyValue <= entry.limit) ?? VALUE_TIERS[VALUE_TIERS.length - 1];
  return roundToNearestFive(tier.amount * weight);
};

const calculateEstimate = (
  option: SurveyOption,
  propertyValue: number,
  bedrooms: number,
  complexity: ComplexityOption,
): QuoteEstimate => {
  let total = option.baseFee;
  const adjustments: AdjustmentDetail[] = [];

  if (complexity.adjustment !== 0) {
    const complexityAmount = roundToNearestFive(complexity.adjustment * option.valueWeight);
    if (complexityAmount !== 0) {
      adjustments.push({ label: complexity.label, amount: complexityAmount });
      total += complexityAmount;
    }
  }

  const valueAdjustment = getValueAdjustment(propertyValue, option.valueWeight);
  if (valueAdjustment !== 0) {
    adjustments.push({
      label: propertyValue >= 750_000 ? 'Higher value property review' : 'Property value scaling',
      amount: valueAdjustment,
    });
    total += valueAdjustment;
  }

  const bedroomsIncluded = option.bedroomsIncluded ?? 3;
  if (bedroomsIncluded > 0) {
    const extraBedrooms = Math.max(0, bedrooms - bedroomsIncluded);
    if (extraBedrooms > 0) {
      const bedroomAmount = roundToNearestFive(extraBedrooms * 32 * option.valueWeight);
      adjustments.push({
        label: `${extraBedrooms} additional bedroom${extraBedrooms > 1 ? 's' : ''}`,
        amount: bedroomAmount,
      });
      total += bedroomAmount;
    }
  }

  const roundedTotal = roundToNearestFive(total);
  const roundedBase = roundToNearestFive(option.baseFee);
  const variance = Math.max(30, roundToNearestFive(roundedTotal * 0.08));

  return {
    baseFee: roundedBase,
    total: roundedTotal,
    adjustments,
    range: {
      min: Math.max(roundedBase, roundedTotal - variance),
      max: roundedTotal + variance,
    },
  };
};

const formatRange = ({ min, max }: QuoteRange): string => {
  if (min >= max) {
    return formatCurrency(Math.max(min, max));
  }

  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
};

const QuoteCalculator = (): JSX.Element => {
  const [surveyType, setSurveyType] = useState<SurveyType>('level2');
  const [propertyValueInput, setPropertyValueInput] = useState('250000');
  const [bedroomsInput, setBedroomsInput] = useState('3');
  const [complexity, setComplexity] = useState<ComplexityType>('standard');
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle', message: '' });

  const previousFormValuesRef = useRef({
    surveyType,
    propertyValueInput,
    bedroomsInput,
    complexity,
  });

  const selectedOption = useMemo(
    () => SURVEY_OPTIONS.find((option) => option.value === surveyType) ?? SURVEY_OPTIONS[0],
    [surveyType],
  );

  const complexityOption = useMemo(
    () => COMPLEXITY_OPTIONS.find((option) => option.value === complexity) ?? COMPLEXITY_OPTIONS[0],
    [complexity],
  );

  const propertyValue = useMemo(() => parseCurrencyValue(propertyValueInput), [propertyValueInput]);
  const bedrooms = useMemo(() => parseBedroomsValue(bedroomsInput), [bedroomsInput]);

  const estimate = useMemo(
    () => calculateEstimate(selectedOption, propertyValue, bedrooms, complexityOption),
    [selectedOption, propertyValue, bedrooms, complexityOption],
  );

  useEffect(() => {
    const previousValues = previousFormValuesRef.current;
    const hasChanged =
      previousValues.surveyType !== surveyType ||
      previousValues.propertyValueInput !== propertyValueInput ||
      previousValues.bedroomsInput !== bedroomsInput ||
      previousValues.complexity !== complexity;

    if (!hasChanged) {
      return;
    }

    previousFormValuesRef.current = {
      surveyType,
      propertyValueInput,
      bedroomsInput,
      complexity,
    };

    setSubmission((current) =>
      current.status === 'idle' ? current : { status: 'idle', message: '' },
    );
  }, [surveyType, propertyValueInput, bedroomsInput, complexity]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleValueBlur = () => {
    if (propertyValue > 0) {
      setPropertyValueInput(Math.round(propertyValue).toLocaleString('en-GB'));
    } else {
      setPropertyValueInput('');
    }
  };

  const handleBedroomsBlur = () => {
    setBedroomsInput(String(bedrooms));
  };

  return (
    <div
      className="lem-quote-calculator"
      data-calculator
      data-submission-status={submission.status}
    >
      <div className="lem-quote-calculator__layout">
        <form className="lem-quote-calculator__form" onSubmit={handleSubmit} noValidate>
          <fieldset className="lem-quote-calculator__fieldset">
            <legend className="lem-quote-calculator__legend">Tell us about the property</legend>

            <div className="lem-quote-calculator__field">
              <label htmlFor="survey-type">Survey or service</label>
              <select
                id="survey-type"
                value={surveyType}
                onChange={(event) => setSurveyType(event.target.value as SurveyType)}
                aria-describedby={SURVEY_HINT_ID}
              >
                {SURVEY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="lem-quote-calculator__hint" id={SURVEY_HINT_ID}>
                {selectedOption.summary}
              </p>
            </div>

            <div className="lem-quote-calculator__field-grid">
              <div className="lem-quote-calculator__field">
                <label htmlFor="property-value">Estimated property value (£)</label>
                <input
                  id="property-value"
                  inputMode="numeric"
                  min="0"
                  step="1000"
                  name="property-value"
                  value={propertyValueInput}
                  onChange={(event) => setPropertyValueInput(event.target.value)}
                  onBlur={handleValueBlur}
                  aria-describedby={VALUE_HINT_ID}
                  placeholder="e.g. 275000"
                  autoComplete="off"
                />
                <p className="lem-quote-calculator__hint" id={VALUE_HINT_ID}>
                  An estimate is fine—this helps us gauge inspection time.
                </p>
              </div>

              <div className="lem-quote-calculator__field">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  id="bedrooms"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  name="bedrooms"
                  value={bedroomsInput}
                  onChange={(event) => setBedroomsInput(event.target.value)}
                  onBlur={handleBedroomsBlur}
                  aria-describedby={BEDROOM_HINT_ID}
                />
                <p className="lem-quote-calculator__hint" id={BEDROOM_HINT_ID}>
                  Include loft rooms used as bedrooms.
                </p>
              </div>
            </div>

            <div className="lem-quote-calculator__field">
              <label htmlFor="complexity">Property complexity</label>
              <select
                id="complexity"
                value={complexity}
                onChange={(event) => setComplexity(event.target.value as ComplexityType)}
                aria-describedby={COMPLEXITY_HINT_ID}
              >
                {COMPLEXITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="lem-quote-calculator__hint" id={COMPLEXITY_HINT_ID}>
                {complexityOption.helper}
              </p>
            </div>
          </fieldset>
        </form>

        <section className="lem-quote-calculator__result" aria-live="polite">
          {selectedOption.badge && (
            <span className="lem-quote-calculator__badge">{selectedOption.badge}</span>
          )}
          <header className="lem-quote-calculator__result-header">
            <span className="lem-quote-calculator__label">Guide fee</span>
            <p className="lem-quote-calculator__figure">{formatCurrency(estimate.total)}</p>
            <span className="lem-quote-calculator__range">Typical range: {formatRange(estimate.range)}</span>
            <p className="lem-quote-calculator__turnaround">{selectedOption.turnaround}</p>
          </header>

          <dl className="lem-quote-calculator__breakdown">
            <div className="lem-quote-calculator__breakdown-row">
              <dt>Base fee</dt>
              <dd>{formatCurrency(estimate.baseFee)}</dd>
            </div>
            {estimate.adjustments.map((adjustment) => (
              <div className="lem-quote-calculator__breakdown-row" key={adjustment.label}>
                <dt>{adjustment.label}</dt>
                <dd>{formatCurrency(adjustment.amount)}</dd>
              </div>
            ))}
            <div className="lem-quote-calculator__breakdown-row lem-quote-calculator__breakdown-row--total">
              <dt>Guide total</dt>
              <dd>{formatCurrency(estimate.total)}</dd>
            </div>
          </dl>

          <ul className="lem-quote-calculator__highlights">
            {selectedOption.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>

          <p className="lem-quote-calculator__disclaimer">
            These guide fees include VAT and reflect typical inspection and reporting time. We’ll confirm a fixed quote once we
            review the full property details.{' '}
            {propertyValue === 0
              ? 'Add an estimated property value to refine the range.'
              : 'Combination services or larger portfolios can be priced together on request.'}
          </p>

          <div className="lem-quote-calculator__cta">
            <a className="cta-button hero-contrast" href="/enquiry.html">
              Request your confirmed quote
            </a>
            <a className="inline-link" href="tel:07378732037">
              Call 07378 732 037
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuoteCalculator;
