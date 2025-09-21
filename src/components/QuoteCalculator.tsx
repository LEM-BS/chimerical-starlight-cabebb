import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AREA_SUGGESTIONS, getAreasForOutcode, normaliseOutcode } from '../lib/areas';
import {
  calculateQuote,
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

const propertyValueFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

const formatRange = (range: QuoteRange): string => {
  if (range.min >= range.max) return formatCurrency(range.max);
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
  );

  const previousFormValuesRef = useRef({
    surveyType,
    propertyValueInput,
    bedroomsInput,
    complexity,
  });

  const matchedAreas = useMemo(
    () => (postcodeInput.trim().length > 0 ? getAreasForOutcode(postcodeInput) : []),
    [postcodeInput],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const outcodeParam = params.get('outcode');
    if (outcodeParam) setPostcodeInput(normaliseOutcode(outcodeParam));

    const surveyParam = params.get('survey');
    if (surveyParam && SURVEYS.some((option) => option.id === surveyParam)) {
      setSurveyType(surveyParam as SurveyType);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
          const message =
            (payload && typeof payload.error === 'string' && payload.error) || 'Unable to determine distance';
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

        if (band && !userSelectedBandRef.current) setDistanceBandId(band.id);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
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
    const prev = previousFormValuesRef.current;
    const changed =
      prev.surveyType !== surveyType ||
      prev.propertyValueInput !== propertyValueInput ||
      prev.bedroomsInput !== bedroomsInput ||
      prev.complexity !== complexity;

    if (!changed) return;

    previousFormValuesRef.current = { surveyType, propertyValueInput, bedroomsInput, complexity };
    if (submissionState !== 'idle') setSubmissionState('idle');
  }, [surveyType, propertyValueInput, bedroomsInput, complexity, submissionState]);

  const handleValueBlur = () => {
    if (propertyValue > 0) {
      setPropertyValueInput(propertyValueFormatter.format(Math.round(propertyValue)));
    } else {
      setPropertyValueInput('');
    }
  };

  const handleBedroomsBlur = () => setBedroomsInput(String(bedrooms));

  const handlePostcodeChange = (value: string) => {
    setPostcodeInput(value.toUpperCase());
    setUserSelectedBand(false);
    setDistanceError(null);
  };

  const handlePostcodeBlur = () => setPostcodeInput((current) => normaliseOutcode(current));

  const handleDistanceBandChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDistanceBandId(event.target.value as DistanceBandId);
    setUserSelectedBand(true);
  };

  const distanceStatusMessage = useMemo(() => {
    if (isLookingUpDistance) return 'Checking distance…';
    if (distanceError) return distanceError;

    if (distanceLookup && Number.isFinite(distanceLookup.miles)) {
      const miles = distanceLookup.miles.toFixed(1);
      const label = distanceLookup.band?.label ?? selectedDistanceBand?.label;
      return `Approx. ${miles} miles from CH5 4HS${label ? ` (${label})` : ''}.`;
    }

    if (postcodeInput.trim().length >= 3) return 'Enter a full postcode to refine the travel band.';
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
    if (submitting) return;

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
    data.set('survey-id', surveyType);
    data.set('complexity', selectedComplexity.label);
    data.set('complexity-id', complexity);
    data.set('property-value', propertyValue > 0 ? Math.round(propertyValue).toString() : 'Not provided');
    data.set('bedrooms', bedrooms.toString());
    data.set('distance-band', selectedDistanceBand?.label ?? 'Not specified');
    data.set('distance-band-id', selectedDistanceBand?.id ?? '');

    if (postcodeInput.trim()) data.set('postcode', postcodeInput.trim());

    if (distanceLookup) {
      if (Number.isFinite(distanceLookup.miles)) data.set('distance-miles', distanceLookup.miles.toString());
      if (Number.isFinite(distanceLookup.kilometres))
        data.set('distance-kilometres', distanceLookup.kilometres.toString());
    }

    data.set('guide-fee', formatCurrency(quote.total.gross));
    data.set('guide-range', formatRange(quote.range));
    data.set(
      'guide-adjustments',
      quote.adjustments
        .map((adj) => `${adj.label}: ${formatCurrency(adj.amount.gross)}`)
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

      if (BEACON_URL && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const payload = {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            notes: trimmedNotes,
            surveyType,
            propertyValue,
            bedrooms,
            complexity,
            distanceBandId: selectedDistanceBand?.id ?? null,
            distance: distanceLookup
              ? { miles: distanceLookup.miles, kilometres: distanceLookup.kilometres }
              : null,
            total: quote.total.gross,
            range: quote.range,
            adjustments: quote.adjustments.map((a) => ({
              id: a.id,
              label: a.label,
              amount: a.amount.gross,
            })),
            timestamp: new Date().toISOString(),
          };
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon(BEACON_URL, blob);
        } catch (be) {
          console.warn('Quote beacon failed', be);
        }
      }

      setSubmissionState('success');
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    } catch (err) {
      setSubmissionState('error');
      setSubmissionError(err instanceof Error ? err.message : 'Sorry, something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lem-quote-calculator" data-calculator data-submission-status={submissionState}>
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
                  An estimate is fine; this helps us gauge inspection time.
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
              <p
                className={`lem-quote-calculator__hint${distanceError ? ' lem-quote-calculator__hint--error' : ''}`}
                id={DISTANCE_STATUS_ID}
                aria-live="polite"
              >
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
                {['standard', 'extended', 'period'].map((id) => {
                  const opt = getComplexityById(id as ComplexityType);
                  return (
                    <option key={id} value={id}>
                      {opt.label}
                    </option>
                  );
                })}
              </select>
              <p className="lem-quote-calculator__hint" id={COMPLEXITY_HINT_ID}>
                {selectedComplexity.helper}
              </p>
            </div>
          </fieldset>

          <fieldset className="lem-quote-calculator__fieldset">
            <legend className="lem-quote-calculator__legend">Request