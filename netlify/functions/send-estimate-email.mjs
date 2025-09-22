import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Resend } from 'resend';

const FALLBACK_FROM_EMAIL =
  'LEM Building Surveying <no-reply@lembuildingsurveying.co.uk>';

const normaliseEmailAddress = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const BASE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = {
  ...BASE_HEADERS,
  'Content-Type': 'application/json',
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(payload),
});

const slugify = (value, fallback) => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const slug = value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  return slug || fallback;
};

const parseAmount = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const cleaned = String(value).replace(/[^0-9.-]+/g, '');
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(value);
  } catch (error) {
    return null;
  }
};

const normaliseLineItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (item === null || item === undefined) {
        return null;
      }

      if (typeof item === 'string') {
        return { description: item, amount: null };
      }

      if (typeof item === 'number') {
        return { description: '', amount: item };
      }

      const description =
        item.description ?? item.label ?? item.title ?? item.name ?? '';

      const baseAmount =
        parseAmount(item.amount ?? item.price ?? item.total ?? item.value);

      const quantity =
        item.quantity !== undefined ? Number(item.quantity) : undefined;
      const unitPrice = parseAmount(item.unitPrice ?? item.unit_price);

      let amount = baseAmount;

      if (amount === null && unitPrice !== null) {
        const qty = Number.isFinite(quantity) ? quantity : 1;
        amount = unitPrice * qty;
      }

      const notes = item.notes ?? item.summary ?? undefined;

      return description || amount !== null
        ? {
            description: description ? String(description) : '',
            amount,
            notes: notes ? String(notes) : undefined,
            quantity: Number.isFinite(quantity) ? quantity : undefined,
          }
        : null;
    })
    .filter(Boolean);
};

const sumLineItems = (items) =>
  items.reduce(
    (total, item) => total + (typeof item.amount === 'number' ? item.amount : 0),
    0,
  );

const wrapText = (text, font, size, maxWidth) => {
  const content = String(text ?? '').trim();

  if (!content) {
    return [];
  }

  const paragraphs = content.split(/\r?\n+/);
  const lines = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let currentLine = words.shift();

    for (const word of words) {
      const testLine = `${currentLine} ${word}`;
      if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
        currentLine = testLine;
        continue;
      }

      lines.push(currentLine);
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    lines.push('');
  }

  if (lines.length && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
};

const computeValidUntil = (issueDate, explicitValidUntil, validForDays) => {
  const providedDate = parseDate(explicitValidUntil);
  if (providedDate) {
    return providedDate;
  }

  if (!issueDate || validForDays === null || validForDays === undefined) {
    return null;
  }

  const days = Number(validForDays);
  if (!Number.isFinite(days)) {
    return null;
  }

  const computed = new Date(issueDate);
  computed.setDate(computed.getDate() + days);
  return computed;
};

const mergeEstimateData = (payload) => {
  const base = { ...(payload.estimate ?? {}) };

  const fieldAliases = {
    clientName: ['clientName', 'name', 'customerName'],
    clientEmail: ['clientEmail', 'email'],
    propertyAddress: ['propertyAddress', 'address'],
    surveyType: ['surveyType'],
    lineItems: ['lineItems', 'items', 'fees'],
    extras: ['extras', 'optionalExtras', 'optionalItems'],
    adjustments: ['adjustments', 'discounts'],
    notes: ['notes'],
    turnaround: ['turnaround', 'leadTime'],
    total: ['total', 'grandTotal'],
    currency: ['currency'],
    issueDate: ['issueDate', 'issuedAt'],
    validUntil: ['validUntil', 'expiresOn'],
    validForDays: ['validForDays', 'validityDays'],
    reference: ['reference', 'estimateNumber', 'estimateId'],
    tax: ['tax', 'vat', 'vatAmount'],
    summary: ['summary', 'description'],
  };

  for (const [key, aliases] of Object.entries(fieldAliases)) {
    if (base[key] !== undefined) {
      continue;
    }

    for (const alias of aliases) {
      if (payload[alias] !== undefined) {
        base[key] = payload[alias];
        break;
      }
    }
  }

  return base;
};

const prepareEstimate = (payload) => {
  const rawEstimate = mergeEstimateData(payload);

  const currency = (rawEstimate.currency || 'GBP').toUpperCase();
  let currencyFormatter;

  try {
    currencyFormatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    });
  } catch (error) {
    currencyFormatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    });
  }

  const lineItems = normaliseLineItems(rawEstimate.lineItems);
  const extras = normaliseLineItems(
    rawEstimate.extras ?? rawEstimate.optionalExtras ?? rawEstimate.optionalItems,
  );
  const adjustments = normaliseLineItems(rawEstimate.adjustments);

  const subtotal = sumLineItems(lineItems);
  const adjustmentsTotal = sumLineItems(adjustments);
  const tax = parseAmount(rawEstimate.tax);

  let total = parseAmount(rawEstimate.total);
  if (total === null) {
    total = subtotal + adjustmentsTotal + (tax ?? 0);
  }

  const issueDate = parseDate(
    rawEstimate.issueDate ?? rawEstimate.issuedAt ?? rawEstimate.createdAt ?? new Date(),
  );
  const validForDays =
    rawEstimate.validForDays ?? rawEstimate.validityDays ?? rawEstimate.valid_for_days;
  const validUntil = computeValidUntil(issueDate, rawEstimate.validUntil, validForDays);

  return {
    raw: rawEstimate,
    currency,
    currencyFormatter,
    lineItems,
    extras,
    adjustments,
    subtotal,
    adjustmentsTotal,
    tax,
    total,
    issueDate,
    validForDays:
      validForDays !== undefined && validForDays !== null
        ? Number(validForDays)
        : undefined,
    validUntil,
    formatted: {
      issueDate: formatDate(issueDate),
      validUntil: formatDate(validUntil),
      subtotal: currencyFormatter.format(subtotal),
      adjustmentsTotal:
        adjustmentsTotal !== 0 ? currencyFormatter.format(adjustmentsTotal) : null,
      tax: tax !== null ? currencyFormatter.format(tax) : null,
      total: total !== null ? currencyFormatter.format(total) : null,
    },
  };
};

const createEmailText = (estimate, prepared, company) => {
  const name =
    estimate.clientName || estimate.customerName || estimate.name || 'there';
  const surveyType = estimate.surveyType || 'survey';
  const lines = [
    `Hello ${name},`,
    '',
    `Please find attached your ${surveyType.toLowerCase()} estimate.`,
  ];

  if (prepared.total !== null && prepared.formatted.total) {
    lines.push('', `Total: ${prepared.formatted.total}`);
  }

  if (estimate.turnaround) {
    lines.push('', `Turnaround: ${estimate.turnaround}.`);
  }

  if (prepared.validForDays) {
    const validity = prepared.validForDays;
    const validityText = prepared.formatted.validUntil
      ? `${validity} days (until ${prepared.formatted.validUntil})`
      : `${validity} days`;
    lines.push('', `This estimate is valid for ${validityText}.`);
  } else if (prepared.formatted.validUntil) {
    lines.push('', `This estimate is valid until ${prepared.formatted.validUntil}.`);
  }

  lines.push(
    '',
    'Let me know if you have any questions or if you would like to proceed.',
    '',
    'Kind regards,',
    company.name || 'LEM Building Surveying',
  );

  if (company.phone) {
    lines.push(company.phone);
  }

  if (company.email) {
    lines.push(company.email);
  }

  return lines.join('\n');
};

const buildEmailHtml = (text) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) =>
      `<p>${paragraph
        .split(/\n/)
        .map((line) => line.replace(/[&<>]/g, (char) => {
          if (char === '&') return '&amp;';
          if (char === '<') return '&lt;';
          if (char === '>') return '&gt;';
          return char;
        }))
        .join('<br />')}</p>`,
    )
    .join('');

const generateEstimatePdf = async (estimate, prepared, company, options = {}) => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let cursorY = height - margin;
  const maxWidth = width - margin * 2;

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ensureSpace = (requiredHeight) => {
    if (cursorY - requiredHeight < margin) {
      page = pdfDoc.addPage();
      cursorY = page.getHeight() - margin;
    }
  };

  const drawTextLine = (text, { font = regularFont, size = 12 } = {}) => {
    if (!text) {
      return;
    }

    const lineHeight = size + 4;
    ensureSpace(lineHeight);
    page.drawText(text, { x: margin, y: cursorY, font, size });
    cursorY -= lineHeight;
  };

  const drawParagraph = (
    text,
    { font = regularFont, size = 12, bullet = false } = {},
  ) => {
    const lineHeight = size + 4;
    const lines = wrapText(text, font, size, maxWidth - (bullet ? 14 : 0));

    for (const line of lines) {
      ensureSpace(lineHeight);
      if (bullet && line) {
        page.drawText('•', { x: margin, y: cursorY, font, size });
        page.drawText(line, {
          x: margin + 14,
          y: cursorY,
          font,
          size,
        });
      } else if (line) {
        page.drawText(line, { x: margin, y: cursorY, font, size });
      }
      cursorY -= lineHeight;
    }
  };

  const drawLineItem = (item) => {
    if (!item.description && item.amount === null) {
      return;
    }

    const amountText =
      typeof item.amount === 'number'
        ? prepared.currencyFormatter.format(item.amount)
        : item.amountText;

    const lines = wrapText(item.description || '', regularFont, 12, maxWidth - 110);

    if (lines.length === 0) {
      lines.push('');
    }

    const lineHeight = 16;

    for (const [index, line] of lines.entries()) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y: cursorY, font: regularFont, size: 12 });

      if (index === 0 && amountText) {
        const amountWidth = boldFont.widthOfTextAtSize(amountText, 12);
        page.drawText(amountText, {
          x: margin + maxWidth - amountWidth,
          y: cursorY,
          font: boldFont,
          size: 12,
        });
      }

      cursorY -= lineHeight;
    }

    if (item.notes) {
      drawParagraph(item.notes, { font: regularFont, size: 10 });
    }
  };

  const drawSectionTitle = (title) => {
    cursorY -= 6;
    drawTextLine(title, { font: boldFont, size: 14 });
  };

  const drawTotalRow = (label, value, { bold = false } = {}) => {
    const font = bold ? boldFont : regularFont;
    const lineHeight = 18;
    ensureSpace(lineHeight);
    page.drawText(label, { x: margin, y: cursorY, font, size: 12 });

    if (value) {
      const text = typeof value === 'number'
        ? prepared.currencyFormatter.format(value)
        : value;
      const textWidth = font.widthOfTextAtSize(text, 12);
      page.drawText(text, {
        x: margin + maxWidth - textWidth,
        y: cursorY,
        font,
        size: 12,
      });
    }

    cursorY -= lineHeight;
  };

  const headerLines = [];
  if (company.name) {
    headerLines.push(company.name);
  }
  if (company.tagline) {
    headerLines.push(company.tagline);
  }
  if (company.website || company.email || company.phone) {
    headerLines.push(
      [company.website, company.email, company.phone].filter(Boolean).join(' • '),
    );
  }
  if (company.address) {
    headerLines.push(company.address);
  }

  headerLines.forEach((line) => drawTextLine(line, { font: regularFont, size: 10 }));

  if (headerLines.length) {
    cursorY -= 6;
  }

  drawTextLine('Survey Estimate', { font: boldFont, size: 20 });

  if (estimate.reference) {
    drawTextLine(`Reference: ${estimate.reference}`, { font: regularFont, size: 12 });
  }

  if (prepared.formatted.issueDate) {
    drawTextLine(`Issued: ${prepared.formatted.issueDate}`, {
      font: regularFont,
      size: 12,
    });
  }

  if (prepared.formatted.validUntil) {
    drawTextLine(`Valid until: ${prepared.formatted.validUntil}`, {
      font: regularFont,
      size: 12,
    });
  }

  cursorY -= 10;

  if (estimate.clientName || estimate.clientEmail) {
    drawSectionTitle('Client');
    if (estimate.clientName) {
      drawTextLine(estimate.clientName, { font: regularFont, size: 12 });
    }
    if (estimate.clientEmail) {
      drawTextLine(estimate.clientEmail, { font: regularFont, size: 12 });
    }
    cursorY -= 6;
  }

  if (estimate.propertyAddress) {
    drawSectionTitle('Property');
    drawParagraph(estimate.propertyAddress, { font: regularFont, size: 12 });
    cursorY -= 6;
  }

  const details = [];
  if (estimate.surveyType) {
    details.push(`Survey type: ${estimate.surveyType}`);
  }
  if (estimate.turnaround) {
    details.push(`Turnaround: ${estimate.turnaround}`);
  }
  if (estimate.summary) {
    details.push(estimate.summary);
  }

  if (details.length) {
    drawSectionTitle('Details');
    details.forEach((line) => drawParagraph(line, { font: regularFont, size: 12 }));
    cursorY -= 6;
  }

  if (prepared.lineItems.length) {
    drawSectionTitle('Fees');
    prepared.lineItems.forEach((item) => drawLineItem(item));
  }

  if (prepared.adjustments.length) {
    cursorY -= 6;
    drawSectionTitle('Adjustments');
    prepared.adjustments.forEach((item) => drawLineItem(item));
  }

  if (prepared.extras.length) {
    cursorY -= 6;
    drawSectionTitle('Optional extras');
    prepared.extras.forEach((item) => drawLineItem(item));
  }

  cursorY -= 6;
  drawSectionTitle('Summary');
  drawTotalRow('Subtotal', prepared.formatted.subtotal);

  if (prepared.adjustments.length && prepared.formatted.adjustmentsTotal) {
    drawTotalRow('Adjustments', prepared.formatted.adjustmentsTotal);
  }

  if (prepared.formatted.tax) {
    drawTotalRow('Tax', prepared.formatted.tax);
  }

  if (prepared.formatted.total) {
    drawTotalRow('Total', prepared.formatted.total, { bold: true });
  }

  if (estimate.notes) {
    cursorY -= 6;
    drawSectionTitle('Notes');
    drawParagraph(estimate.notes, { font: regularFont, size: 11 });
  }

  if (company && (company.email || company.phone || company.website)) {
    cursorY -= 12;
    drawSectionTitle('Contact');
    if (company.email) {
      drawTextLine(company.email, { font: regularFont, size: 10 });
    }
    if (company.phone) {
      drawTextLine(company.phone, { font: regularFont, size: 10 });
    }
    if (company.website) {
      drawTextLine(company.website, { font: regularFont, size: 10 });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const filename = options.filename
    ? options.filename
    : `survey-estimate-${slugify(
        estimate.reference || estimate.clientName || Date.now().toString(),
        'lem-survey',
      ).toLowerCase()}.pdf`;

  return {
    filename,
    bytes: pdfBytes,
    base64: Buffer.from(pdfBytes).toString('base64'),
  };
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: BASE_HEADERS,
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  if (!event.body) {
    return jsonResponse(400, { error: 'Request body is required' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const toRecipientsRaw =
    payload.to ?? payload.recipient ?? payload.email ?? payload.clientEmail;
  const toRecipients = Array.isArray(toRecipientsRaw)
    ? toRecipientsRaw.filter(Boolean)
    : [toRecipientsRaw].filter(Boolean);

  if (!toRecipients.length) {
    return jsonResponse(400, { error: 'A recipient "to" address is required' });
  }

  const prepared = prepareEstimate(payload);
  const estimate = {
    ...prepared.raw,
    clientName:
      prepared.raw.clientName ?? payload.clientName ?? payload.name ?? 'Client',
    clientEmail: prepared.raw.clientEmail ?? payload.clientEmail ?? payload.email,
  };

  const defaultCompany = {
    name: process.env.COMPANY_NAME || 'LEM Building Surveying',
    email: process.env.COMPANY_EMAIL || null,
    phone: process.env.COMPANY_PHONE || null,
    website:
      process.env.COMPANY_WEBSITE || 'https://www.lembuildingsurveying.co.uk',
    address: process.env.COMPANY_ADDRESS || null,
  };

  const company = {
    ...defaultCompany,
    ...(estimate.company || {}),
    ...(payload.company || {}),
  };

  if (!company.email) {
    company.email = payload.replyTo || process.env.RESEND_FROM_EMAIL || null;
  }

  const pdf = await generateEstimatePdf(estimate, prepared, company, {
    filename: payload.filename,
  });

  const includePdfInResponse = payload.includePdf !== false;

  const subjectPrefix = company.name ? `${company.name} — ` : '';
  const subject =
    payload.subject ||
    `${subjectPrefix}${
      estimate.surveyType ? `${estimate.surveyType} ` : ''
    }Estimate${estimate.reference ? ` (${estimate.reference})` : ''}`;

  const emailText = payload.text || createEmailText(estimate, prepared, company);
  const emailHtml = payload.html || buildEmailHtml(emailText);

  const providedFromAddress = normaliseEmailAddress(payload.from);
  const envFromAddress = normaliseEmailAddress(process.env.RESEND_FROM_EMAIL);

  let fromAddress = providedFromAddress || envFromAddress;

  if (!fromAddress) {
    fromAddress = FALLBACK_FROM_EMAIL;

    if (!envFromAddress) {
      console.warn(
        `RESEND_FROM_EMAIL is not configured and no "from" address was provided. Using fallback sender "${FALLBACK_FROM_EMAIL}".`,
      );
    }
  }

  const cc = Array.isArray(payload.cc)
    ? payload.cc
    : payload.cc
    ? [payload.cc]
    : undefined;
  const bcc = Array.isArray(payload.bcc)
    ? payload.bcc
    : payload.bcc
    ? [payload.bcc]
    : undefined;

  const customerEmail =
    normaliseEmailAddress(estimate.clientEmail) ||
    normaliseEmailAddress(payload.clientEmail) ||
    normaliseEmailAddress(payload.email);

  const replyToCandidates = [
    customerEmail,
    normaliseEmailAddress(payload.replyTo),
    normaliseEmailAddress(company.email),
  ].filter(Boolean);

  let replyTo;
  for (const address of replyToCandidates) {
    if (address && address !== fromAddress) {
      replyTo = address;
      break;
    }
  }

  let emailResult;

  if (process.env.RESEND_API_KEY) {
    if (!fromAddress) {
      return jsonResponse(400, {
        error:
          'RESEND_API_KEY is configured but no "from" address was provided. Set the request "from" field or RESEND_FROM_EMAIL.',
      });
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const sendPayload = {
        from: fromAddress,
        to: toRecipients,
        subject,
        text: emailText,
        html: emailHtml,
        attachments: [
          {
            filename: pdf.filename,
            content: pdf.base64,
          },
        ],
      };

      if (cc?.length) {
        sendPayload.cc = cc;
      }

      if (bcc?.length) {
        sendPayload.bcc = bcc;
      }

      if (replyTo) {
        sendPayload.reply_to = replyTo;
      }

      const result = await resend.emails.send(sendPayload);

      if (result?.error) {
        throw new Error(result.error.message || 'Resend API error');
      }

      emailResult = {
        attempted: true,
        id: result?.data?.id || result?.id || null,
      };
    } catch (error) {
      return jsonResponse(502, {
        error: 'Failed to send estimate email',
        details: error?.message,
        pdf: includePdfInResponse
          ? { filename: pdf.filename, base64: pdf.base64 }
          : { filename: pdf.filename },
      });
    }
  } else {
    emailResult = {
      attempted: false,
      skipped: true,
      reason: 'RESEND_API_KEY is not configured. Email was not sent.',
    };
  }

  return jsonResponse(200, {
    message: 'Estimate generated',
    pdf: includePdfInResponse
      ? { filename: pdf.filename, base64: pdf.base64 }
      : { filename: pdf.filename },
    email: emailResult,
    totals: {
      currency: prepared.currency,
      subtotal: prepared.subtotal,
      tax: prepared.tax,
      total: prepared.total,
    },
  });
}
