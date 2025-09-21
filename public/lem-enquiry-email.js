(function () {
  const ENDPOINT = '/.netlify/functions/send-estimate-email';
  const SURVEY_INFO = {
    'level-1': {
      label: 'RICS Level 1 Home Survey',
      turnaround: 'Report within 2–3 working days of the inspection.',
    },
    level1: {
      label: 'RICS Level 1 Home Survey',
      turnaround: 'Report within 2–3 working days of the inspection.',
    },
    'level-2': {
      label: 'RICS Level 2 Home Survey',
      turnaround: 'Report typically delivered 3–5 working days after inspection.',
    },
    level2: {
      label: 'RICS Level 2 Home Survey',
      turnaround: 'Report typically delivered 3–5 working days after inspection.',
    },
    'level-3': {
      label: 'RICS Level 3 Building Survey',
      turnaround: 'Allow 5–7 working days for the full written report.',
    },
    level3: {
      label: 'RICS Level 3 Building Survey',
      turnaround: 'Allow 5–7 working days for the full written report.',
    },
    damp: {
      label: 'Specialist Damp & Timber Investigation',
      turnaround: 'Report issued within 2–3 working days of the visit.',
    },
    'damp-timber': {
      label: 'Specialist Damp & Timber Investigation',
      turnaround: 'Report issued within 2–3 working days of the visit.',
    },
    ventilation: {
      label: 'Ventilation & Condensation Assessment',
      turnaround: 'Report typically ready within 3–4 working days.',
    },
    epc: {
      label: 'EPC with Floorplan',
      turnaround: '48-hour turnaround is usually available.',
    },
    measured: {
      label: 'Measured Survey & Floorplans',
      turnaround: 'Drawings provided within 5–7 working days.',
    },
    unsure: {
      label: 'Survey advice requested',
      turnaround: null,
    },
  };

  const currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  });

  const truthy = (value) => Boolean(value);

  function normaliseSurveyKey(value) {
    if (!value) return '';
    return String(value).trim().toLowerCase().replace(/\s+/g, '-');
  }

  function lookupSurveyInfo(value) {
    const key = normaliseSurveyKey(value);
    return SURVEY_INFO[key] || null;
  }

  function pick(form, name) {
    if (!name) return '';
    const elements = form.elements;
    if (!elements) return '';
    const item = elements.namedItem(name);
    if (!item) return '';
    if (item instanceof RadioNodeList) {
      return (item.value || '').toString().trim();
    }
    if ('value' in item) {
      return (item.value || '').toString().trim();
    }
    return '';
  }

  function pickFirst(form, names) {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      const value = pick(form, name);
      if (value) return value;
    }
    return '';
  }

  function parseAmount(value) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/[^0-9.-]+/g, '');
    if (!cleaned) return null;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  }

  function pickNumber(form, names) {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      const raw = pick(form, name);
      if (!raw) continue;
      const numeric = parseAmount(raw);
      if (numeric !== null) return numeric;
    }
    return null;
  }

  function collectQuoteDetails(form) {
    const reference =
      pickFirst(form, ['estimate-reference', 'quote-reference', 'quoteId']) ||
      `ENQ-${Date.now().toString(36).toUpperCase()}`;

    const subtotal = pickNumber(form, ['estimate-subtotal', 'subtotal']);
    const vat = pickNumber(form, ['estimate-vat', 'vat']);
    const totalCandidate = pickNumber(form, ['estimate-total', 'quote-total', 'total']);
    const total =
      totalCandidate !== null
        ? totalCandidate
        : subtotal !== null && vat !== null
        ? subtotal + vat
        : null;

    const guideRangeText = pickFirst(form, ['estimate-range', 'guide-range']);
    const travelBand = pickFirst(form, ['distance-band', 'travelBand', 'travel-band']);
    const distanceMiles = pickNumber(form, ['distance-miles', 'distanceMiles']);
    const distanceKilometres = pickNumber(form, ['distance-kilometres', 'distanceKm']);
    const adjustmentsText = pickFirst(form, ['estimate-adjustments', 'guide-adjustments']);

    const adjustments = [];
    if (adjustmentsText && adjustmentsText.toLowerCase() !== 'none') {
      adjustmentsText.split(/;+/).forEach((entry) => {
        const trimmed = entry.trim();
        if (!trimmed) return;
        const match = trimmed.match(/^(.*?)(?:\s*[:=]\s*)?([£0-9.,-]+)$/);
        if (match) {
          const label = match[1] ? match[1].trim() : trimmed;
          const amount = parseAmount(match[2]);
          adjustments.push({ description: label || trimmed, amount });
        } else {
          adjustments.push({ description: trimmed, amount: null });
        }
      });
    }

    return {
      reference,
      subtotal,
      vat,
      total,
      guideRangeText,
      travelBand,
      distanceMiles,
      distanceKilometres,
      adjustments,
    };
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) return '';
    try {
      return currencyFormatter.format(value);
    } catch (error) {
      return `£${Number(value).toFixed(2)}`;
    }
  }

  function buildPayload(form) {
    const email = pickFirst(form, ['email', '_replyto']);
    if (!email) return null;

    const name = pickFirst(form, ['name', 'full_name', 'full-name']);
    const phone = pickFirst(form, ['phone', 'tel', 'telephone']);
    const postcode = pickFirst(form, ['postcode', 'post_code', 'property-postcode']);
    const address = pickFirst(form, ['address', 'property-address']);
    const contactMethod = pickFirst(form, ['contact-method', 'preferred-contact']);
    const bedroomsRaw = pickFirst(form, ['bedrooms', 'number-of-bedrooms']);
    const bedrooms = bedroomsRaw || '';
    const propertyValue = pickNumber(form, ['property-value', 'property_value']);
    const details = pickFirst(form, ['details', 'notes', 'message', 'additional-notes']);

    const surveyRaw = pickFirst(form, ['survey-type', 'surveyType', 'service']);
    const surveyInfo = lookupSurveyInfo(surveyRaw);
    const surveyLabel = surveyInfo?.label || surveyRaw || 'Survey enquiry';

    const quote = collectQuoteDetails(form);

    const baseDescription =
      quote.subtotal !== null || quote.total !== null
        ? surveyLabel
        : `${surveyLabel} — confirmed fee to follow`;

    const lineItems = [
      {
        description: baseDescription,
        amount: quote.subtotal !== null ? quote.subtotal : quote.total,
      },
    ];

    const notesLines = [
      address ? `Property address: ${address}` : '',
      !address && postcode ? `Postcode or area: ${postcode}` : '',
      surveyLabel ? `Survey type: ${surveyLabel}` : '',
      propertyValue !== null ? `Estimated property value: ${formatCurrency(propertyValue)}` : '',
      bedrooms ? `Bedrooms: ${bedrooms}` : '',
      contactMethod ? `Preferred contact: ${contactMethod}` : '',
      quote.travelBand ? `Travel/time band: ${quote.travelBand}` : '',
      quote.distanceMiles !== null
        ? `Approx. distance from CH5 4HS: ${quote.distanceMiles.toFixed(1)} miles${
            quote.distanceKilometres !== null
              ? ` (${quote.distanceKilometres.toFixed(1)} km)`
              : ''
          }`
        : '',
      quote.guideRangeText ? `Guide range: ${quote.guideRangeText}` : '',
      details ? `Client notes: ${details}` : '',
      'This estimate is for guidance only. A Director will review the enquiry and confirm the final fee.',
    ].filter(truthy);

    const reference = quote.reference;
    const subjectParts = [reference];
    if (postcode) subjectParts.push(postcode);
    const subjectSuffix = subjectParts.length ? ` — ${subjectParts.join(' — ')}` : '';

    const estimate = {
      reference,
      clientName: name || 'Client',
      clientEmail: email,
      propertyAddress: address || postcode || undefined,
      surveyType: surveyLabel,
      turnaround: surveyInfo?.turnaround || undefined,
      summary: 'Request for a confirmed fee submitted via the enquiry page.',
      lineItems,
      adjustments: quote.adjustments,
      subtotal: quote.subtotal !== null ? quote.subtotal : undefined,
      tax: quote.vat !== null ? quote.vat : undefined,
      total: quote.total !== null ? quote.total : undefined,
      validForDays: 14,
      notes: notesLines.join('\n'),
    };

    if (quote.guideRangeText && !estimate.summary?.includes('Guide range')) {
      estimate.summary = `${estimate.summary} Guide range provided: ${quote.guideRangeText}.`;
    }

    return {
      to: email,
      replyTo: email,
      subject: `Request for confirmed fee${subjectSuffix}`,
      clientName: name || undefined,
      clientEmail: email,
      postcode: postcode || undefined,
      estimate,
      filename: `lem-estimate-${reference}.pdf`,
      form: {
        name: name || null,
        email,
        phone: phone || null,
        postcode: postcode || null,
        address: address || null,
        contactMethod: contactMethod || null,
        surveyType: surveyRaw || null,
        surveyLabel,
        propertyValue: propertyValue !== null ? propertyValue : null,
        bedrooms: bedrooms || null,
        notes: details || null,
        quote,
        source: 'enquiry-form',
      },
      metadata: {
        submittedAt: new Date().toISOString(),
      },
    };
  }

  function isEligibleForm(form) {
    if (!form || !(form instanceof HTMLFormElement)) return false;
    if (form.dataset && form.dataset.lemEnquiry === 'false') return false;
    if (form.dataset && form.dataset.lemEnquiry === 'true') return true;
    if (form.classList.contains('enquiry-form')) return true;
    const action = form.getAttribute('action') || '';
    return /formspree\.io\/f\//i.test(action);
  }

  function sendEstimate(form) {
    try {
      const payload = buildPayload(form);
      if (!payload) return;
      const body = JSON.stringify(payload);

      const fallback = () => {
        if (typeof fetch !== 'function') return;
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {
          /* swallow */
        });
      };

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const blob = new Blob([body], { type: 'application/json' });
          const sent = navigator.sendBeacon(ENDPOINT, blob);
          if (!sent) {
            fallback();
          }
        } catch (error) {
          fallback();
        }
      } else {
        fallback();
      }
    } catch (error) {
      // ignore background failures
    }
  }

  document.addEventListener(
    'submit',
    (event) => {
      const target = event.target;
      if (!target || !(target instanceof HTMLFormElement)) {
        return;
      }
      if (!isEligibleForm(target)) {
        return;
      }
      sendEstimate(target);
    },
    true,
  );
})();
