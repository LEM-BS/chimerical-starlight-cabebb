import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getAreasForOutcode, normaliseOutcode } from '../lib/areas';
import {
  calculateQuote,
  formatCurrency,
  getComplexityById,
  getDistanceBandById,
  getSurveyById,
  parseBedroomsValue,
  parseCurrencyValue,
  SURVEYS,
  type ComplexityType,
  type DistanceBandId,
  type ExtensionStatusId,
  type PropertyAgeId,
  type PropertyTypeId,
  type QuoteInput,
  type QuoteRange,
  type SurveyType,
} from '../lib/pricing';

const SURVEY_HINT_ID = 'quote-survey-hint';
const VALUE_HINT_ID = 'quote-value-hint';
const BEDROOM_HINT_ID = 'quote-bedroom-hint';
const ADDRESS_HINT_ID = 'quote-address-hint';
const DISTANCE_STATUS_ID = 'quote-distance-status';
const CONTACT_HINT_ID = 'quote-contact-hint';
const CONTACT_STATUS_ID = 'quote-contact-status';

const CONTACT_SECTION_HEADING_ID = 'quote-contact-heading';
const PROPERTY_SECTION_HEADING_ID = 'quote-property-heading';
const SURVEY_SECTION_HEADING_ID = 'quote-survey-preferences-heading';
const NOTES_SECTION_HEADING_ID = 'quote-additional-info-heading';

const FULL_POSTCODE_PATTERN = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/;
const OUTWARD_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export const extractPostcodeFromAddress = (address: string): string => {
  if (!address) return '';

  const tailTokens = address
    .toUpperCase()
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(-4);

  if (tailTokens.length === 0) return '';

  let outwardFallback = '';

  const evaluate = (raw: string, allowOutwardFallback: boolean): string | null => {
    const normalised = normaliseOutcode(raw);
    if (!normalised) return null;

    const fullMatch = normalised.match(FULL_POSTCODE_PATTERN);
    if (fullMatch) {
      return `${fullMatch[1]} ${fullMatch[2]}`;
    }

    if (allowOutwardFallback && !outwardFallback && OUTWARD_POSTCODE_PATTERN.test(normalised)) {
      outwardFallback = normalised;
    }

    return null;
  };

  for (let index = tailTokens.length - 1; index >= 0; index -= 1) {
    const current = tailTokens[index];

    if (index > 0) {
      const combined = evaluate(`${tailTokens[index - 1]}${current}`, false);
      if (combined) return combined;
    }

    const single = evaluate(current, true);
    if (single) return single;
  }

  return outwardFallback;
};

const PROPERTY_TYPE_OPTIONS: ReadonlyArray<{ id: PropertyTypeId; label: string }> = [
  { id: 'detached-house', label: 'Detached house' },
  { id: 'semi-detached-house', label: 'Semi-detached house' },
  { id: 'mid-terrace-house', label: 'Mid-terrace house' },
  { id: 'end-terrace-house', label: 'End-terrace house' },
  { id: 'flat-apartment', label: 'Flat / apartment' },
  { id: 'bungalow', label: 'Bungalow' },
  { id: 'cottage', label: 'Cottage' },
  { id: 'maisonette', label: 'Maisonette' },
  { id: 'other', label: 'Other / not listed' },
];

const PROPERTY_AGE_OPTIONS: ReadonlyArray<{ id: PropertyAgeId; label: string }> = [
  { id: 'unknown', label: 'Unknown' },
  { id: 'new-build', label: 'New build (0–2 years)' },
  { id: 'post-2000', label: '2000s onwards' },
  { id: '1980-1999', label: '1980s–1990s' },
  { id: '1945-1979', label: '1945–1970s' },
  { id: 'interwar', label: '1919–1944' },
  { id: 'victorian-edwardian', label: 'Victorian / Edwardian' },
  { id: 'pre-1900', label: 'Pre-1900' },
];

const EXTENSION_STATUS_OPTIONS: ReadonlyArray<{ id: ExtensionStatusId; label: string }> = [
  { id: 'unknown', label: 'Unknown' },
  { id: 'no', label: 'No' },
  { id: 'yes', label: 'Yes' },
];

const FORM_ENDPOINT = import.meta.env.PUBLIC_QUOTE_FORM_ENDPOINT?.trim() || 'https://formspree.io/f/xzzdqqqz';
const BEACON_URL = import.meta.env.PUBLIC_QUOTE_BEACON_URL?.trim() ?? '';

const propertyValueFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

const formatRange = (range: QuoteRange): string => {
  if (range.min >= range.max) return formatCurrency(range.max);
  return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
};

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

const QuoteCalculator = (): ReactElement => {
  const [surveyType, setSurveyType] = useState<SurveyType>('level2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyTypeId>('detached-house');
  const [propertyAge, setPropertyAge] = useState<PropertyAgeId>('unknown');
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatusId>('unknown');
  const [extensionTypes, setExtensionTypes] = useState({ extended: false, converted: false });
  const [propertyValueInput, setPropertyValueInput] = useState('250000');
  const [bedroomsInput, setBedroomsInput] = useState('3');
  const [complexity, setComplexity] = useState<ComplexityType>('standard');
  const [distanceBandId, setDistanceBandId] = useState<DistanceBandId>('within-20-miles');

  const [distanceLookup, setDistanceLookup] = useState<DistanceLookupState | null>(null);
  const [isLookingUpDistance, setIsLookingUpDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const selectedSurvey = useMemo(() => getSurveyById(surveyType), [surveyType]);
  const selectedComplexity = useMemo(() => getComplexityById(complexity), [complexity]);
  const propertyValue = useMemo(() => parseCurrencyValue(propertyValueInput), [propertyValueInput]);
  const bedrooms = useMemo(() => parseBedroomsValue(bedroomsInput), [bedroomsInput]);
  const selectedDistanceBand = useMemo(() => getDistanceBandById(distanceBandId), [distanceBandId]);
  const { extended: hasExtended, converted: hasConverted } = extensionTypes;
  const hasExtensionDetailSelection = hasExtended || hasConverted;
  const requiresExtendedComplexity = extensionStatus === 'yes';
  const hasExtensionDetail = extensionStatus === 'yes' && (hasExtended || hasConverted);
  const hasBothExtensionDetails = extensionStatus === 'yes' && hasExtended && hasConverted;

  const extensionSummary = useMemo(() => {
    if (extensionStatus !== 'yes') {
      if (extensionStatus === 'no') return 'no';
      return 'unknown';
    }

    if (hasExtended && hasConverted) return 'extended and converted';
    if (hasExtended) return 'extended';
    if (hasConverted) return 'converted';
    return 'yes (details not specified)';
  }, [extensionStatus, hasConverted, hasExtended]);

  const quoteInput = useMemo<QuoteInput>(
    () => ({
      surveyType,
      propertyValue,
      bedrooms,
      complexity,
      distanceBandId,
      propertyType,
      propertyAge,
      extensionStatus,
      extensionDetails: { extended: hasExtended, converted: hasConverted },
    }),
    [
      surveyType,
      propertyValue,
      bedrooms,
      complexity,
      distanceBandId,
      propertyType,
      propertyAge,
      extensionStatus,
      hasExtended,
      hasConverted,
    ],
  );

  const quote = useMemo(() => calculateQuote(quoteInput), [quoteInput]);

  const previousFormValuesRef = useRef({
    surveyType,
    propertyValueInput,
    bedroomsInput,
    complexity,
    postcodeInput,
    propertyType,
    propertyAge,
    extensionStatus,
    hasExtended,
    hasConverted,
    propertyAddress,
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
    if (extensionStatus !== 'yes' && (hasExtended || hasConverted)) {
      setExtensionTypes({ extended: false, converted: false });
    }
  }, [extensionStatus, hasConverted, hasExtended]);

  useEffect(() => {
    const candidateComplexities: ComplexityType[] = ['standard'];

    if (propertyAge === 'pre-1900') {
      candidateComplexities.push('period');
    } else if (propertyAge === 'victorian-edwardian') {
      candidateComplexities.push('victorian');
    } else if (propertyAge === 'interwar') {
      candidateComplexities.push('interwar');
    }

    if (hasBothExtensionDetails) {
      candidateComplexities.push('extended-and-converted');
    } else if (hasExtensionDetail || requiresExtendedComplexity) {
      candidateComplexities.push('extended');
    }

    let nextComplexity = candidateComplexities[0];
    for (const candidate of candidateComplexities) {
      const bestOption = getComplexityById(nextComplexity);
      const candidateOption = getComplexityById(candidate);
      if (candidateOption.adjustment >= bestOption.adjustment) {
        nextComplexity = candidateOption.id;
      }
    }

    if (complexity !== nextComplexity) setComplexity(nextComplexity);
  }, [
    complexity,
    hasBothExtensionDetails,
    hasExtensionDetail,
    propertyAge,
    requiresExtendedComplexity,
  ]);

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

        if (band) setDistanceBandId(band.id);
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
      prev.complexity !== complexity ||
      prev.postcodeInput !== postcodeInput ||
      prev.propertyType !== propertyType ||
      prev.propertyAge !== propertyAge ||
      prev.extensionStatus !== extensionStatus ||
      prev.hasExtended !== hasExtended ||
      prev.hasConverted !== hasConverted ||
      prev.propertyAddress !== propertyAddress;

    if (!changed) return;

    previousFormValuesRef.current = {
      surveyType,
      propertyValueInput,
      bedroomsInput,
      complexity,
      postcodeInput,
      propertyType,
      propertyAge,
      extensionStatus,
      hasExtended,
      hasConverted,
      propertyAddress,
    };
    if (submissionState !== 'idle') setSubmissionState('idle');
  }, [
    surveyType,
    propertyValueInput,
    bedroomsInput,
    complexity,
    postcodeInput,
    propertyType,
    propertyAge,
    extensionStatus,
    hasExtended,
    hasConverted,
    propertyAddress,
    submissionState,
  ]);

  const handleValueBlur = () => {
    if (propertyValue > 0) {
      setPropertyValueInput(propertyValueFormatter.format(Math.round(propertyValue)));
    } else {
      setPropertyValueInput('');
    }
  };

  const handleBedroomsBlur = () => setBedroomsInput(String(bedrooms));

  const handlePropertyAddressChange = (value: string) => {
    setPropertyAddress(value);
    const extracted = extractPostcodeFromAddress(value);
    const nextPostcode = extracted ? normaliseOutcode(extracted) : '';
    setPostcodeInput(nextPostcode);
    if (extracted) setDistanceError(null);
  };

  const distanceStatusMessage = useMemo(() => {
    if (isLookingUpDistance) return 'Checking coverage…';
    if (distanceError) return distanceError;

    if (distanceLookup && Number.isFinite(distanceLookup.miles)) {
      return 'We cover this area. Travel is calculated automatically.';
    }

    if (postcodeInput.trim().length >= 3)
      return 'Add the full postcode to the address so we can confirm coverage.';
    return ' ';
  }, [distanceError, distanceLookup, isLookingUpDistance, postcodeInput]);

  const contactStatusMessage =
    submissionState === 'success'
      ? 'Thanks! We will confirm your fee shortly.'
      : submissionState === 'error'
      ? submissionError
      : null;

  const contactStatusIcon =
    contactStatusMessage && submissionState === 'success'
      ? (
          <span className="lem-quote-calculator__status-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" focusable="false">
              <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M7 10.5 9.2 12.7 13.25 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )
      : contactStatusMessage && submissionState === 'error'
      ? (
          <span className="lem-quote-calculator__status-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" focusable="false">
              <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 6.25v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="13.75" r="0.75" fill="currentColor" />
            </svg>
          </span>
        )
      : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (extensionStatus === 'yes' && !hasExtensionDetailSelection) {
      const firstDetailInput = form.querySelector<HTMLInputElement>('input[name="extension-detail-extended"]');
      if (firstDetailInput) {
        firstDetailInput.setCustomValidity('Select at least one extension detail.');
        firstDetailInput.reportValidity();
        firstDetailInput.setCustomValidity('');
        firstDetailInput.focus();
      }
      setSubmissionState('error');
      setSubmissionError('Select at least one extension detail so we can confirm the surcharge.');
      return;
    }

    const data = new FormData(form);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedNotes = notes.trim();
    const trimmedAddress = propertyAddress.trim();
    const trimmedPostcode = postcodeInput.trim();
    const propertyTypeOption = PROPERTY_TYPE_OPTIONS.find((option) => option.id === propertyType);
    const propertyAgeOption = PROPERTY_AGE_OPTIONS.find((option) => option.id === propertyAge);
    const extensionStatusOption = EXTENSION_STATUS_OPTIONS.find((option) => option.id === extensionStatus);

    data.set('name', trimmedName);
    data.set('email', trimmedEmail);
    data.set('phone', trimmedPhone);
    data.set('notes', trimmedNotes);
    data.set('property-address', trimmedAddress);
    data.set('postcode', trimmedPostcode);
    data.set('property-type', propertyTypeOption?.label ?? propertyType);
    data.set('property-type-id', propertyType);
    data.set('property-age', propertyAgeOption?.label ?? propertyAge);
    data.set('property-age-id', propertyAge);
    data.set('extension-status', extensionStatusOption?.label ?? extensionStatus);
    data.set('extension-status-id', extensionStatus);
    data.set('extension-summary', extensionSummary);
    data.set('extension-detail-extended', hasExtended ? 'yes' : 'no');
    data.set('extension-detail-converted', hasConverted ? 'yes' : 'no');

    data.set('survey-type', selectedSurvey.label);
    data.set('survey-id', surveyType);
    data.set('complexity', selectedComplexity.label);
    data.set('complexity-id', complexity);
    data.set('property-value', propertyValue > 0 ? Math.round(propertyValue).toString() : 'Not provided');
    data.set('bedrooms', bedrooms.toString());
    data.set('distance-band', selectedDistanceBand?.label ?? 'Not specified');
    data.set('distance-band-id', selectedDistanceBand?.id ?? '');

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
            propertyAddress: trimmedAddress,
            postcode: trimmedPostcode,
            surveyType,
            propertyValue,
            bedrooms,
            complexity,
            propertyType: {
              id: propertyType,
              label: propertyTypeOption?.label ?? propertyType,
            },
            propertyAge: {
              id: propertyAge,
              label: propertyAgeOption?.label ?? propertyAge,
            },
            extension: {
              status: extensionStatus,
              label: extensionStatusOption?.label ?? extensionStatus,
              summary: extensionSummary,
              extended: hasExtended,
              converted: hasConverted,
            },
            distanceBandId: selectedDistanceBand?.id ?? null,
            distanceBandLabel: selectedDistanceBand?.label ?? null,
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
            <legend className="lem-quote-calculator__legend">Request your confirmed fee</legend>

            <div
              className="lem-quote-calculator__section"
              role="region"
              aria-labelledby={CONTACT_SECTION_HEADING_ID}
            >
              <h3
                id={CONTACT_SECTION_HEADING_ID}
                className="lem-quote-calculator__section-heading"
                tabIndex={0}
              >
                Contact details
              </h3>

              <div className="lem-quote-calculator__field">
                <label htmlFor="contact-name">Full name</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="lem-quote-calculator__field-grid">
                <div className="lem-quote-calculator__field">
                  <label htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="lem-quote-calculator__field">
                  <label htmlFor="contact-phone">Phone number (optional)</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div
              className="lem-quote-calculator__section"
              role="region"
              aria-labelledby={PROPERTY_SECTION_HEADING_ID}
            >
              <h3
                id={PROPERTY_SECTION_HEADING_ID}
                className="lem-quote-calculator__section-heading"
                tabIndex={0}
              >
                Property details
              </h3>

              <div className="lem-quote-calculator__field">
                <label htmlFor="property-address">Property address</label>
                <textarea
                  id="property-address"
                  name="property-address"
                  rows={3}
                  value={propertyAddress}
                  onChange={(event) => handlePropertyAddressChange(event.target.value)}
                  autoComplete="street-address"
                  placeholder="e.g. 10 High Street, Chester CH7 1AA"
                  aria-describedby={`${ADDRESS_HINT_ID} ${DISTANCE_STATUS_ID}`}
                />
                <p className="lem-quote-calculator__hint" id={ADDRESS_HINT_ID}>
                  Include the full address and postcode so we can check coverage.
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

              <div className="lem-quote-calculator__field-grid">
                <div className="lem-quote-calculator__field">
                  <label htmlFor="property-type">Property type</label>
                  <select
                    id="property-type"
                    name="property-type"
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value as PropertyTypeId)}
                  >
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lem-quote-calculator__field">
                  <label htmlFor="property-age">Approximate age</label>
                  <select
                    id="property-age"
                    name="property-age"
                    value={propertyAge}
                    onChange={(event) => setPropertyAge(event.target.value as PropertyAgeId)}
                  >
                    {PROPERTY_AGE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lem-quote-calculator__field">
                <label htmlFor="extension-status">Extended or converted?</label>
                <select
                  id="extension-status"
                  name="extension-status"
                  value={extensionStatus}
                  onChange={(event) => setExtensionStatus(event.target.value as ExtensionStatusId)}
                >
                  {EXTENSION_STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="lem-quote-calculator__hint">
                  Let us know about major alterations so we can adjust inspection time.
                </p>
                {extensionStatus === 'yes' ? (
                  <div className="lem-quote-calculator__option-list" role="group" aria-label="Extension details">
                    <label>
                      <input
                        type="checkbox"
                        name="extension-detail-extended"
                        value="yes"
                        checked={hasExtended}
                        onChange={(event) =>
                          setExtensionTypes((prev) => ({ ...prev, extended: event.target.checked }))
                        }
                      />
                      <span>Extended</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="extension-detail-converted"
                        value="yes"
                        checked={hasConverted}
                        onChange={(event) =>
                          setExtensionTypes((prev) => ({ ...prev, converted: event.target.checked }))
                        }
                      />
                      <span>Converted</span>
                    </label>
                  </div>
                ) : null}
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
                  <label htmlFor="bedrooms">Number of bedrooms</label>
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
            </div>

            <div
              className="lem-quote-calculator__section"
              role="region"
              aria-labelledby={SURVEY_SECTION_HEADING_ID}
            >
              <h3
                id={SURVEY_SECTION_HEADING_ID}
                className="lem-quote-calculator__section-heading"
                tabIndex={0}
              >
                Survey preferences
              </h3>

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
            </div>

            <div
              className="lem-quote-calculator__section"
              role="region"
              aria-labelledby={NOTES_SECTION_HEADING_ID}
            >
              <h3
                id={NOTES_SECTION_HEADING_ID}
                className="lem-quote-calculator__section-heading"
                tabIndex={0}
              >
                Additional information
              </h3>

              <div className="lem-quote-calculator__field">
                <label htmlFor="contact-notes">Notes (optional)</label>
                <textarea
                  id="contact-notes"
                  name="notes"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  aria-describedby={CONTACT_HINT_ID}
                />
                <p className="lem-quote-calculator__hint" id={CONTACT_HINT_ID}>
                  Tell us about access, timescales or anything else we should know. We usually reply within an hour.
                </p>
              </div>
            </div>

            <div className="lem-quote-calculator__cta">
              <button type="submit" className="cta-button" disabled={submitting} aria-describedby={CONTACT_STATUS_ID}>
                {submitting ? 'Sending…' : 'Send enquiry'}
              </button>
              <p className="lem-quote-calculator__hint lem-quote-calculator__status" id={CONTACT_STATUS_ID} aria-live="polite">
                {contactStatusIcon}
                <span className="lem-quote-calculator__status-text">{contactStatusMessage ?? ' '}</span>
              </p>
            </div>
          </fieldset>

        </form>

        <aside className="lem-quote-calculator__result" aria-live="polite">
          {selectedSurvey.badge ? (
            <span className="lem-quote-calculator__badge">{selectedSurvey.badge}</span>
          ) : null}

          <div>
            <span className="lem-quote-calculator__label">Estimated fee</span>
            <p className="lem-quote-calculator__figure">{formatCurrency(quote.total.gross)}</p>
            <span className="lem-quote-calculator__range">Typically {formatRange(quote.range)}</span>
            <p className="lem-quote-calculator__turnaround">{selectedSurvey.turnaround}</p>
          </div>

          <div>
            <span className="lem-quote-calculator__label">Included as standard</span>
            <ul className="lem-quote-calculator__highlights">
              {selectedSurvey.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="lem-quote-calculator__disclaimer">
            Estimate assumes {selectedComplexity.label.toLowerCase()} and typical access. Travel adjustments are applied
            automatically once we confirm your location. We'll confirm a fixed fee after reviewing your enquiry.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default QuoteCalculator;
