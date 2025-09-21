import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AREA_SUGGESTIONS, getAreasForOutcode, normaliseOutcode } from '../lib/areas';
import {
  calculateQuote,
  COMPLEXITY_OPTIONS,
  DISTANCE_BANDS,
  formatCurrency,
  getComplexityById,
  getDistanceBandById,
  getSurveyById,
  parseBedroomsValue,
  parseCurrencyValue,
  SURVEYS,
  type ComplexityType,
  type DistanceBandId,
  type QuoteRange,
  type SurveyType,
} from '../lib/pricing';
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
const POSTCODE_HINT_ID = 'quote-postcode-hint';
const TRAVEL_HINT_ID = 'quote-travel-hint';
const DISTANCE_STATUS_ID = 'quote-distance-status';
const CONTACT_HINT_ID = 'quote-contact-hint';
const CONTACT_STATUS_ID = 'quote-contact-status';
const POSTCODE_SUGGESTIONS_ID = 'quote-postcode-suggestions';

const FORM_ENDPOINT = import.meta.env.PUBLIC_QUOTE_FORM_ENDPOINT?.trim() || 'https://formspree.io/f/xzzdqqqz';
const BEACON_URL = import.meta.env.PUBLIC_QUOTE_BEACON_URL?.trim() ?? '';

const propertyValueFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
});

const formatRange = (range: QuoteRange): string => {
  if (range.min >= range.max) {
    return formatCurrency(range.max);
  }

  return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
};

const formatVat = (value: number): string => `£${value.toFixed(2)}`;

interface DistanceLookupState {
  query: string;
  miles: number;
  kilometres: number;
  locationType?: string;
  band?: {
    id: DistanceBandId;
    label: string;
  };
}

const QuoteCalculator = (): JSX.Element => {
  const [surveyType, setSurveyType] = useState<SurveyType>('level2');
  const [propertyValueInput, setPropertyValueInput] = useState('250000');
  const [bedroomsInput, setBedroomsInput] = useState('3');
  const [complexity, setComplexity] = useState<ComplexityType>('standard');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [distanceBandId, setDistanceBandId] = useState<DistanceBandId>('within-20-miles');
  const [userSelectedBand, setUserSelectedBand] = useState(false);
  const userSelectedBandRef = useRef(userSelectedBand);

  const [distanceLookup, setDistanceLookup] = useState<DistanceLookupState | null>(null);
  const [isLookingUpDistance, setIsLookingUpDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    userSelectedBandRef.current = userSelectedBand;
  }, [userSelectedBand]);

  const selectedSurvey = useMemo(() => getSurveyById(surveyType), [surveyType]);
  const selectedComplexity = useMemo(() => getComplexityById(complexity), [complexity]);
  const propertyValue = useMemo(() => parseCurrencyValue(propertyValueInput), [propertyValueInput]);
  const bedrooms = useMemo(() => parseBedroomsValue(bedroomsInput), [bedroomsInput]);
  const selectedDistanceBand = useMemo(() => getDistanceBandById(distanceBandId), [distanceBandId]);

  const quote = useMemo(
    () =>
      calculateQuote({
        surveyType,
        propertyValue,
        bedrooms,
        complexity,
        distanceBandId,
      }),
    [surveyType, propertyValue, bedrooms, complexity, distanceBandId],
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

  const matchedAreas = useMemo(
    () => (postcodeInput.trim().length > 0 ? getAreasForOutcode(postcodeInput) : []),
    [postcodeInput],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const outcodeParam = params.get('outcode');
    if (outcodeParam) {
      setPostcodeInput(normaliseOutcode(outcodeParam));
    }

    const surveyParam = params.get('survey');
    if (surveyParam && SURVEYS.some((option) => option.id === surveyParam)) {
      setSurveyType(surveyParam as SurveyType);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const query = postcodeInput.trim();
    if (query.length < 3) {
      setDistanceLookup(null);
      setDistanceError(null);
      setIsLookingUpDistance(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLookingUpDistance(true);

      try {
        const response = await fetch(
          `/.netlify/functions/postcode-distance?postcode=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = (payload && typeof payload.error === 'string' && payload.error) ||
            'Unable to determine distance';
          throw new Error(message);
        }

        const bandId = payload?.band?.id as DistanceBandId | undefined;
        const band = bandId ? getDistanceBandById(bandId) : undefined;

        const lookup: DistanceLookupState = {
          query: payload?.query ?? query,
          miles: typeof payload?.distance?.miles === 'number' ? payload.distance.miles : Number.NaN,
          kilometres:
            typeof payload?.distance?.kilometres === 'number' ? payload.distance.kilometres : Number.NaN,
          locationType: payload?.locationType,
          band: band
            ? { id: band.id, label: band.label }
            : bandId
            ? { id: bandId, label: payload?.band?.label ?? bandId }
            : undefined,
        };

        setDistanceLookup(lookup);
        setDistanceError(null);

        if (band && !userSelectedBandRef.current) {
          setDistanceBandId(band.id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setDistanceLookup(null);
        setDistanceError(error instanceof Error ? error.message : 'Unable to determine distance');
      } finally {
        setIsLookingUpDistance(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [postcodeInput]);
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
      setPropertyValueInput(propertyValueFormatter.format(Math.round(propertyValue)));
    } else {
      setPropertyValueInput('');
    }
  };

  const handleBedroomsBlur = () => {
    setBedroomsInput(String(bedrooms));
  };

  const handlePostcodeChange = (value: string) => {
    setPostcodeInput(value.toUpperCase());
    setUserSelectedBand(false);
    setDistanceError(null);
  };

  const handlePostcodeBlur = () => {
    setPostcodeInput((current) => normaliseOutcode(current));
  };

  const handleDistanceBandChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDistanceBandId(event.target.value as DistanceBandId);
    setUserSelectedBand(true);
  };

  const distanceStatusMessage = useMemo(() => {
    if (isLookingUpDistance) {
      return 'Checking distance…';
    }

    if (distanceError) {
      return distanceError;
    }

    if (distanceLookup && Number.isFinite(distanceLookup.miles)) {
      const miles = distanceLookup.miles.toFixed(1);
      const label = distanceLookup.band?.label ?? selectedDistanceBand?.label;
      return `Approx. ${miles} miles from CH5 4HS${label ? ` (${label})` : ''}.`;
    }

    if (postcodeInput.trim().length >= 3) {
      return 'Enter a full postcode to refine the travel band.';
    }

    return ' ';
  }, [distanceError, distanceLookup, isLookingUpDistance, postcodeInput, selectedDistanceBand]);

  const contactStatusMessage =
    submissionState === 'success'
      ? 'Thanks! We will confirm your quote shortly.'
      : submissionState === 'error'
      ? submissionError
      : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedNotes = notes.trim();

    data.set('name', trimmedName);
    data.set('email', trimmedEmail);
    data.set('phone', trimmedPhone);
    data.set('notes', trimmedNotes);

    data.set('survey-type', selectedSurvey.label);
    data.set('survey-id', selectedSurvey.id);
    data.set('complexity', selectedComplexity.label);
    data.set('complexity-id', selectedComplexity.id);
    data.set('property-value', propertyValue > 0 ? Math.round(propertyValue).toString() : 'Not provided');
    data.set('bedrooms', bedrooms.toString());
    data.set('distance-band', selectedDistanceBand?.label ?? 'Not specified');
    data.set('distance-band-id', selectedDistanceBand?.id ?? '');

    if (postcodeInput.trim()) {
      data.set('postcode', postcodeInput.trim());
    }

    if (distanceLookup) {
      if (Number.isFinite(distanceLookup.miles)) {
        data.set('distance-miles', distanceLookup.miles.toString());
      }
      if (Number.isFinite(distanceLookup.kilometres)) {
        data.set('distance-kilometres', distanceLookup.kilometres.toString());
      }
    }

    data.set('guide-fee', formatCurrency(quote.total.gross));
    data.set('guide-range', formatRange(quote.range));
    data.set(
      'guide-adjustments',
      quote.adjustments
        .map((adjustment) => `${adjustment.label}: ${formatCurrency(adjustment.amount.gross)}`)
        .join('; ') || 'None',
    );

    setSubmissionState('idle');
    setSubmissionError(null);

    try {
      setSubmitting(true);
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          (payload && typeof payload.error === 'string' && payload.error) ||
          'Sorry, something went wrong. Please email us directly.';
        throw new Error(message);
      }

      const contactSnapshot = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        notes: trimmedNotes,
      };

      setSubmissionState('success');
      setSubmissionError(null);

      if (BEACON_URL && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const payload = {
            ...contactSnapshot,
            surveyType,
            propertyValue,
            bedrooms,
            complexity,
            distanceBandId: selectedDistanceBand?.id ?? null,
            distance: distanceLookup
              ? {
                  miles: distanceLookup.miles,
                  kilometres: distanceLookup.kilometres,
                }
              : null,
            total: quote.total.gross,
            range: quote.range,
            adjustments: quote.adjustments.map((adjustment) => ({
              id: adjustment.id,
              label: adjustment.label,
              amount: adjustment.amount.gross,
            })),
            timestamp: new Date().toISOString(),
          };

          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon(BEACON_URL, blob);
        } catch (error) {
          console.warn('Quote beacon failed', error);
        }
      }

      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    } catch (error) {
      setSubmissionState('error');
      setSubmissionError(error instanceof Error ? error.message : 'Sorry, something went wrong.');
    } finally {
      setSubmitting(false);
    }
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
                name="survey-type"
                value={surveyType}
                onChange={(event) => setSurveyType(event.target.value as SurveyType)}
                aria-describedby={SURVEY_HINT_ID}
              >
                {SURVEYS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="lem-quote-calculator__hint" id={SURVEY_HINT_ID}>
                {selectedSurvey.summary}
              </p>
            </div>

            <div className="lem-quote-calculator__field-grid">
              <div className="lem-quote-calculator__field">
                <label htmlFor="property-value">Estimated property value (£)</label>
                <input
                  id="property-value"
                  name="property-value"
                  inputMode="numeric"
                  min="0"
                  step="1000"
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
                  name="bedrooms"
                  inputMode="numeric"
                  min="1"
                  step="1"
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
              <label htmlFor="property-postcode">Postcode or area</label>
              <input
                id="property-postcode"
                name="postcode"
                list={POSTCODE_SUGGESTIONS_ID}
                value={postcodeInput}
                onChange={(event) => handlePostcodeChange(event.target.value)}
                onBlur={handlePostcodeBlur}
                autoComplete="postal-code"
                aria-describedby={`${POSTCODE_HINT_ID} ${DISTANCE_STATUS_ID}`}
                placeholder="e.g. CH5 4HS or CH7"
              />
              <p className="lem-quote-calculator__hint" id={POSTCODE_HINT_ID}>
                Select a suggestion to auto-complete the travel distance.
              </p>
              <p className={`lem-quote-calculator__hint${distanceError ? ' lem-quote-calculator__hint--error' : ''}`} id={DISTANCE_STATUS_ID} aria-live="polite">
                {distanceStatusMessage}
              </p>
              {matchedAreas.length > 0 && (
                <p className="lem-quote-calculator__hint">
                  Serving {matchedAreas.map((area) => area.label).join(', ')}.
                </p>
              )}
            </div>

            <div className="lem-quote-calculator__field">
              <label htmlFor="travel-band">Travel distance</label>
              <select
                id="travel-band"
                name="travel-band"
                value={distanceBandId}
                onChange={handleDistanceBandChange}
                aria-describedby={TRAVEL_HINT_ID}
              >
                {DISTANCE_BANDS.map((band) => (
                  <option key={band.id} value={band.id}>
                    {band.label}
                  </option>
                ))}
              </select>
              <p className="lem-quote-calculator__hint" id={TRAVEL_HINT_ID}>
                Travel adjustments are added automatically when required.
              </p>
            </div>

            <div className="lem-quote-calculator__field">
              <label htmlFor="complexity">Property complexity</label>
              <select
                id="complexity"
                name="complexity"
                value={complexity}
                onChange={(event) => setComplexity(event.target.value as ComplexityType)}
                aria-describedby={COMPLEXITY_HINT_ID}
              >
                {COMPLEXITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="lem-quote-calculator__hint" id={COMPLEXITY_HINT_ID}>
                {selectedComplexity.helper}
              </p>
            </div>
          </fieldset>

          <fieldset className="lem-quote-calculator__fieldset">
            <legend className="lem-quote-calculator__legend">Request a confirmed quote</legend>

            <div className="lem-quote-calculator__field-grid">
              <div className="lem-quote-calculator__field">
                <label htmlFor="quote-name">Your name</label>
                <input
                  id="quote-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="lem-quote-calculator__field">
                <label htmlFor="quote-email">Email</label>
                <input
                  id="quote-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="lem-quote-calculator__field">
                <label htmlFor="quote-phone">Phone (optional)</label>
                <input
                  id="quote-phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="lem-quote-calculator__field">
              <label htmlFor="quote-notes">Property notes</label>
              <textarea
                id="quote-notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                aria-describedby={CONTACT_HINT_ID}
                placeholder="Share any access notes or preferred inspection dates"
              />
              <p className="lem-quote-calculator__hint" id={CONTACT_HINT_ID}>
                We respond within an hour with a fixed fee, availability and next steps.
              </p>
            </div>

            <div className="lem-quote-calculator__cta">
              <button type="submit" className="cta-button hero-contrast" disabled={submitting}>
                {submitting ? 'Sending your details…' : 'Email me a confirmed quote'}
              </button>
              <p className={`lem-quote-calculator__hint${submissionState === 'error' ? ' lem-quote-calculator__hint--error' : ''}`} id={CONTACT_STATUS_ID} aria-live="polite">
                {contactStatusMessage || ' '}
              </p>
            </div>
          </fieldset>
        </form>

        <section className="lem-quote-calculator__result" aria-live="polite">
          {selectedSurvey.badge && (
            <span className="lem-quote-calculator__badge">{selectedSurvey.badge}</span>
          )}
          <header className="lem-quote-calculator__result-header">
            <span className="lem-quote-calculator__label">Guide fee</span>
            <p className="lem-quote-calculator__figure">{formatCurrency(quote.total.gross)}</p>
            <span className="lem-quote-calculator__range">Typical range: {formatRange(quote.range)}</span>
            <p className="lem-quote-calculator__turnaround">{selectedSurvey.turnaround}</p>
            <p className="lem-quote-calculator__hint">Includes {formatVat(quote.total.vat)} VAT.</p>
            {selectedDistanceBand && (
              <p className="lem-quote-calculator__hint">
                Travel band: {selectedDistanceBand.label}
                {distanceLookup && Number.isFinite(distanceLookup.miles)
                  ? ` · approx. ${distanceLookup.miles.toFixed(1)} miles from CH5 4HS`
                  : ''}
              </p>
            )}
          </header>

          <dl className="lem-quote-calculator__breakdown">
            <div className="lem-quote-calculator__breakdown-row">
              <dt>Base fee</dt>
              <dd>{formatCurrency(quote.base.gross)}</dd>
            </div>
            {quote.adjustments.map((adjustment) => (
              <div className="lem-quote-calculator__breakdown-row" key={adjustment.id}>
                <dt>{adjustment.label}</dt>
                <dd>{formatCurrency(adjustment.amount.gross)}</dd>
              </div>
            ))}
            <div className="lem-quote-calculator__breakdown-row lem-quote-calculator__breakdown-row--total">
              <dt>Guide total</dt>
              <dd>{formatCurrency(quote.total.gross)}</dd>
            </div>
          </dl>

          <ul className="lem-quote-calculator__highlights">
            {selectedSurvey.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>

          <p className="lem-quote-calculator__disclaimer">
            These guide fees include VAT and reflect typical inspection and reporting time. We’ll confirm a fixed quote once we
            review the full property details.{' '}
            {propertyValue === 0
              ? 'Add an estimated property value and postcode to refine the range.'
              : 'Combination services or larger portfolios can be priced together on request.'}
          </p>

          <div className="lem-quote-calculator__cta">
            <a className="cta-button hero-contrast" href="/enquiry.html">
              Prefer to use the full enquiry form
            </a>
            <a className="inline-link" href="tel:07378732037">
              Call 07378 732 037
            </a>
          </div>
        </section>
      </div>

      <datalist id={POSTCODE_SUGGESTIONS_ID}>
        {AREA_SUGGESTIONS.map((suggestion) => (
          <option key={suggestion.id} value={suggestion.outcode}>
            {suggestion.label}
          </option>
        ))}
      </datalist>
    </div>
  );
};

export default QuoteCalculator;
