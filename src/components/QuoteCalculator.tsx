import type { FormEvent } from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

import {
  VAT_RATE,
  calculateQuote,
  describeOutcode,
  estimateDistanceFromOutcode,
  extractOutcode,
  matchOutcodes,
  normalisePostcode,
  surveyTypes,
  extraServiceList,
  type ExtraService,
  type OutcodeSuggestion,
  type QuoteBreakdown,
  type SurveyType,
} from '../lib/pricing';
import { getAreasForOutcode } from '../lib/areas';

const FORM_ENDPOINT_PREFIX = 'https://formspree.io/f/';
const DEFAULT_FORM_ID = 'xzzdqqqz';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const formatMiles = (distance: number) => `${distance.toFixed(1)} miles`;

const getInitialOutcodeFromLocation = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('outcode') ?? '';
};

const sendBeacon = (url: string, payload: Record<string, unknown>) => {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        /* noop */
      });
    }
  } catch (error) {
    console.error('Quote beacon failed', error);
  }
};

const sanitisePropertyValue = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitiseBedrooms = (value: string) => {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

interface QuoteCalculatorProps {
  formId?: string;
  emailBeaconUrl?: string;
  heading?: string;
  description?: string;
}

type SubmissionStatus = 'idle' | 'success' | 'error';

interface SubmissionResult {
  status: SubmissionStatus;
  message?: string;
}

const QuoteCalculator = ({
  formId = DEFAULT_FORM_ID,
  emailBeaconUrl = typeof import.meta !== 'undefined'
    ? import.meta.env.PUBLIC_QUOTE_BEACON ?? undefined
    : undefined,
  heading = 'Instant Survey Estimate',
  description = 'Enter a postcode and property details to generate an indicative fee. Submit the form to receive a tailored quote and availability from the surveyor.',
}: QuoteCalculatorProps) => {
  const idPrefix = useId();
  const fieldId = useCallback((suffix: string) => `${idPrefix}-${suffix}`, [idPrefix]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [postcodeInput, setPostcodeInput] = useState(() => getInitialOutcodeFromLocation());
  const [surveyType, setSurveyType] = useState<SurveyType>('level2');
  const [bedroomInput, setBedroomInput] = useState('3');
  const [propertyValueInput, setPropertyValueInput] = useState('250000');
  const [selectedExtras, setSelectedExtras] = useState<ExtraService[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionResult>({ status: 'idle' });

  const bedrooms = useMemo(() => sanitiseBedrooms(bedroomInput), [bedroomInput]);
  const propertyValue = useMemo(
    () => sanitisePropertyValue(propertyValueInput),
    [propertyValueInput],
  );

  const selectedOutcode = useMemo(
    () => extractOutcode(postcodeInput ?? '') ?? '',
    [postcodeInput],
  );

  const distanceMiles = useMemo(() => {
    if (!selectedOutcode) return null;
    return estimateDistanceFromOutcode(selectedOutcode);
  }, [selectedOutcode]);

  const quote = useMemo<QuoteBreakdown>(() => {
    return calculateQuote({
      surveyType,
      bedrooms,
      propertyValue,
      distanceMiles,
      extras: selectedExtras,
    });
  }, [surveyType, bedrooms, propertyValue, distanceMiles, selectedExtras]);

  const suggestionQuery = postcodeInput.trim();
  const rawSuggestions = useMemo(
    () => matchOutcodes(suggestionQuery, 6),
    [suggestionQuery],
  );

  const suggestions: OutcodeSuggestion[] = useMemo(() => {
    if (!selectedOutcode) {
      return rawSuggestions;
    }
    return rawSuggestions.filter((entry) => entry.outcode !== selectedOutcode);
  }, [rawSuggestions, selectedOutcode]);

  const shouldShowSuggestions =
    (suggestionQuery.length >= 2 || !selectedOutcode) && suggestions.length > 0;

  const outcodeDescription = useMemo(
    () => (selectedOutcode ? describeOutcode(selectedOutcode) : null),
    [selectedOutcode],
  );

  const areas = useMemo(
    () => (selectedOutcode ? getAreasForOutcode(selectedOutcode) : []),
    [selectedOutcode],
  );

  useEffect(() => {
    setSubmission((current) => {
      if (current.status === 'idle') {
        return current;
      }
      return { status: 'idle' };
    });
  }, [
    name,
    email,
    phone,
    surveyType,
    bedroomInput,
    propertyValueInput,
    postcodeInput,
    notes,
    selectedExtras,
  ]);

  const handleSelectSuggestion = useCallback((suggestion: OutcodeSuggestion) => {
    setPostcodeInput(suggestion.outcode);
  }, []);

  const toggleExtra = useCallback((extra: ExtraService) => {
    setSelectedExtras((current) => {
      if (current.includes(extra)) {
        return current.filter((item) => item !== extra);
      }
      return [...current, extra];
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;
      setSubmitting(true);
      setSubmission({ status: 'idle' });

      const normalisedPostcode = normalisePostcode(postcodeInput);
      const areasServed = selectedOutcode ? getAreasForOutcode(selectedOutcode) : [];
      const payloadExtras = selectedExtras.map((id) =>
        extraServiceList.find((extra) => extra.id === id)?.label ?? id,
      );

      const formData = new FormData();
      formData.set('name', name);
      formData.set('email', email);
      formData.set('contact', phone);
      formData.set('postcode', normalisedPostcode);
      if (selectedOutcode) {
        formData.set('outcode', selectedOutcode);
      }
      formData.set('survey-type', surveyType);
      formData.set('bedrooms', bedroomInput || String(bedrooms));
      formData.set('property-value', propertyValueInput || String(propertyValue));
      formData.set('calculated-quote', formatCurrency(quote.total));
      formData.set('quote-net', formatCurrency(quote.net));
      formData.set('quote-vat', formatCurrency(quote.vat));
      formData.set('quote-distance-band', quote.distanceBand.label);
      if (distanceMiles != null) {
        formData.set('quote-distance-miles', distanceMiles.toFixed(2));
      }
      formData.set(
        'quote-breakdown',
        JSON.stringify({
          base: quote.base,
          bedroomAdjustment: quote.bedroomAdjustment,
          valueAdjustment: quote.valueAdjustment,
          distanceSurcharge: quote.distanceSurcharge,
          extrasTotal: quote.extrasTotal,
        }),
      );
      if (areasServed.length) {
        formData.set('areas', areasServed.join(', '));
      }
      if (outcodeDescription) {
        formData.set('outcode-description', outcodeDescription);
      }
      if (payloadExtras.length) {
        formData.set('extras', payloadExtras.join(', '));
      }
      if (notes.trim()) {
        formData.set('message', notes.trim());
      }
      formData.set('_subject', 'LEM Building Surveying quote calculator');

      try {
        const response = await fetch(`${FORM_ENDPOINT_PREFIX}${formId}`, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Form submission failed (${response.status})`);
        }

        setSubmitting(false);
        setSubmission({
          status: 'success',
          message: 'Thanks! Your request has been sent. We will be in touch shortly.',
        });

        if (emailBeaconUrl) {
          sendBeacon(emailBeaconUrl, {
            name,
            email,
            phone,
            postcode: normalisedPostcode,
            outcode: selectedOutcode,
            surveyType,
            bedrooms,
            propertyValue,
            extras: payloadExtras,
            quoteTotal: quote.total,
            quoteNet: quote.net,
            vat: quote.vat,
          });
        }
      } catch (error) {
        console.error(error);
        setSubmitting(false);
        setSubmission({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Something went wrong. Please try again or email enquiries@lembuildingsurveying.co.uk.',
        });
      }
    },
    [
      emailBeaconUrl,
      formId,
      isSubmitting,
      name,
      email,
      phone,
      postcodeInput,
      selectedOutcode,
      surveyType,
      bedroomInput,
      bedrooms,
      propertyValueInput,
      propertyValue,
      quote,
      distanceMiles,
      notes,
      selectedExtras,
    ],
  );

  const distanceLabel = distanceMiles != null ? formatMiles(distanceMiles) : 'Unknown';

  return (
    <section className="quote-calculator" id="calculator">
      <div className="quote-calculator__intro">
        <h2>{heading}</h2>
        <p>{description}</p>
      </div>
      <div className="quote-calculator__layout">
        <form className="quote-calculator__form" onSubmit={handleSubmit} noValidate>
          <div className="quote-calculator__grid">
            <label className="quote-calculator__field" htmlFor={fieldId('name')}>
              <span className="quote-calculator__label">Name</span>
              <input
                id={fieldId('name')}
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="quote-calculator__field" htmlFor={fieldId('email')}>
              <span className="quote-calculator__label">Email</span>
              <input
                id={fieldId('email')}
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="quote-calculator__field" htmlFor={fieldId('phone')}>
              <span className="quote-calculator__label">Contact number</span>
              <input
                id={fieldId('phone')}
                name="contact"
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </label>
            <div className="quote-calculator__field">
              <label className="quote-calculator__label" htmlFor={fieldId('postcode')}>
                Postcode or area
              </label>
              <input
                id={fieldId('postcode')}
                name="postcode"
                value={postcodeInput}
                onChange={(event) => setPostcodeInput(event.target.value.toUpperCase())}
                placeholder="e.g. CH5 1AB or Connahs Quay"
                autoComplete="postal-code"
                required
              />
              {shouldShowSuggestions && (
                <ul className="quote-calculator__suggestions" role="listbox">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.outcode}>
                      <button
                        type="button"
                        className="quote-calculator__suggestion"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <span className="quote-calculator__suggestion-code">
                          {suggestion.outcode}
                        </span>
                        <span className="quote-calculator__suggestion-label">
                          {suggestion.label}
                        </span>
                        <span className="quote-calculator__suggestion-distance">
                          {formatMiles(suggestion.distanceMiles)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="quote-calculator__field" htmlFor={fieldId('survey-type')}>
              <span className="quote-calculator__label">Survey type</span>
              <select
                id={fieldId('survey-type')}
                name="survey-type"
                value={surveyType}
                onChange={(event) => setSurveyType(event.target.value as SurveyType)}
                required
              >
                {surveyTypes.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="quote-calculator__field" htmlFor={fieldId('bedrooms')}>
              <span className="quote-calculator__label">Bedrooms</span>
              <input
                id={fieldId('bedrooms')}
                inputMode="numeric"
                min={0}
                name="bedrooms"
                type="number"
                value={bedroomInput}
                onChange={(event) => setBedroomInput(event.target.value)}
              />
            </label>
            <label className="quote-calculator__field" htmlFor={fieldId('value')}>
              <span className="quote-calculator__label">Estimated property value (£)</span>
              <input
                id={fieldId('value')}
                inputMode="decimal"
                min={0}
                name="property-value"
                type="number"
                value={propertyValueInput}
                onChange={(event) => setPropertyValueInput(event.target.value)}
                step="1000"
              />
            </label>
          </div>

          <fieldset className="quote-calculator__extras">
            <legend>Optional extras</legend>
            {extraServiceList.map((extra) => {
              const checked = selectedExtras.includes(extra.id);
              return (
                <label key={extra.id} className="quote-calculator__checkbox">
                  <input
                    type="checkbox"
                    name="extras"
                    value={extra.id}
                    checked={checked}
                    onChange={() => toggleExtra(extra.id)}
                  />
                  <span>
                    <strong>{extra.label}</strong>
                    <br />
                    <small>
                      {extra.description} ({formatCurrency(extra.price)})
                    </small>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <label className="quote-calculator__field" htmlFor={fieldId('notes')}>
            <span className="quote-calculator__label">Additional information (optional)</span>
            <textarea
              id={fieldId('notes')}
              name="message"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <button className="quote-calculator__submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Sending…' : 'Request my tailored quote'}
          </button>

          {submission.status === 'success' && (
            <p className="quote-calculator__status quote-calculator__status--success">
              {submission.message}
            </p>
          )}
          {submission.status === 'error' && (
            <p className="quote-calculator__status quote-calculator__status--error">
              {submission.message}
            </p>
          )}
        </form>

        <aside className="quote-calculator__summary">
          <h3>Estimated total</h3>
          <p className="quote-calculator__total">{formatCurrency(quote.total)}</p>
          <p className="quote-calculator__note">
            Inclusive of VAT at {Math.round(VAT_RATE * 100)}%. Net fee {formatCurrency(quote.net)} +
            VAT {formatCurrency(quote.vat)}.
          </p>
          <dl className="quote-calculator__breakdown">
            <div>
              <dt>Base survey fee</dt>
              <dd>{formatCurrency(quote.base)}</dd>
            </div>
            {quote.bedroomAdjustment > 0 && (
              <div>
                <dt>Bedrooms adjustment</dt>
                <dd>{formatCurrency(quote.bedroomAdjustment)}</dd>
              </div>
            )}
            {quote.valueAdjustment > 0 && (
              <div>
                <dt>Property value band</dt>
                <dd>{formatCurrency(quote.valueAdjustment)}</dd>
              </div>
            )}
            {quote.distanceSurcharge > 0 && (
              <div>
                <dt>Travel supplement</dt>
                <dd>{formatCurrency(quote.distanceSurcharge)}</dd>
              </div>
            )}
            {quote.extrasTotal > 0 && (
              <div>
                <dt>Extras</dt>
                <dd>{formatCurrency(quote.extrasTotal)}</dd>
              </div>
            )}
          </dl>

          <div className="quote-calculator__meta">
            <p>
              <strong>Distance band:</strong> {quote.distanceBand.label}
              {distanceMiles != null && ` (${distanceLabel})`}
            </p>
            {areas.length > 0 && (
              <p>
                <strong>Local coverage:</strong>{' '}
                {areas.map((area, index) => (
                  <Fragment key={area}>
                    {area}
                    {index < areas.length - 1 ? ', ' : ''}
                  </Fragment>
                ))}
              </p>
            )}
            {outcodeDescription && (
              <p className="quote-calculator__outcode">{outcodeDescription}</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default QuoteCalculator;
