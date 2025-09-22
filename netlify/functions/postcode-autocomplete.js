const BASE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: BASE_HEADERS,
    };
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const params = new URLSearchParams();
  const incomingParams = event.queryStringParameters || {};

  for (const [key, value] of Object.entries(incomingParams)) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.set(key, String(value));
    }
  }

  const trimmedQuery = params.get('q')?.trim();

  if (!trimmedQuery) {
    return jsonResponse(400, { error: 'Query parameter "q" is required' });
  }

  params.set('q', trimmedQuery);

  const endpoint = new URL('https://api.postcodes.io/postcodes');
  endpoint.search = params.toString();

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return jsonResponse(res.status || 502, {
        status: data?.status ?? res.status,
        query: trimmedQuery,
        error: data?.error || 'Postcode autocomplete lookup failed',
      });
    }

    const result = Array.isArray(data?.result) ? data.result : [];
    const suggestions = result
      .map((entry) => entry?.postcode || entry)
      .filter(Boolean);

    return jsonResponse(res.status || 200, {
      status: data?.status ?? res.status,
      query: trimmedQuery,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
      result,
      suggestions,
    });
  } catch (error) {
    return jsonResponse(502, {
      error: 'Failed to reach postcode autocomplete service',
      details: error?.message,
    });
  }
};
