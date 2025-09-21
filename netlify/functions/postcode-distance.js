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

const HOME_BASE = {
  latitude: 53.210058,
  longitude: -3.053622,
  postcode: 'CH5 4HS',
};

const DISTANCE_BANDS = [
  { id: 'within-10-miles', label: '0-10 miles', maxMiles: 10 },
  { id: 'within-20-miles', label: '10-20 miles', maxMiles: 20 },
  { id: 'within-35-miles', label: '20-35 miles', maxMiles: 35 },
  { id: 'within-50-miles', label: '35-50 miles', maxMiles: 50 },
  { id: 'over-50-miles', label: '50+ miles', maxMiles: Infinity },
];

const EARTH_RADIUS_MILES = 3958.7613;

const responseWithCors = (statusCode, body) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

const sanitisePostcode = (value) => value.trim().toUpperCase();

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceMiles = (from, to) => {
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);

  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
};

const determineBand = (distanceMiles) => {
  let previousMax = 0;

  for (const band of DISTANCE_BANDS) {
    if (distanceMiles <= band.maxMiles) {
      return {
        id: band.id,
        label: band.label,
        minMiles: Number(previousMax.toFixed(2)),
        maxMiles:
          band.maxMiles === Infinity ? null : Number(band.maxMiles.toFixed(2)),
      };
    }

    previousMax = band.maxMiles;
  }

  return {
    id: 'over-50-miles',
    label: '50+ miles',
    minMiles: Number(previousMax.toFixed(2)),
    maxMiles: null,
  };
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    const parseError = new Error('Invalid response from postcode service');
    parseError.cause = error;
    parseError.statusCode = 502;
    throw parseError;
  }

  return { res, data };
};

const geocodeLocation = async (input) => {
  const normalised = sanitisePostcode(input);

  if (!normalised) {
    const error = new Error('Postcode or outcode is required');
    error.statusCode = 400;
    throw error;
  }

  const postcodeQuery = normalised.replace(/\s+/g, '');
  const outcodeQuery = normalised.split(' ')[0];

  try {
    const { res, data } = await fetchJson(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcodeQuery)}`,
    );

    if (res.ok && data?.result) {
      const { latitude, longitude } = data.result;
      return {
        latitude,
        longitude,
        locationType: 'postcode',
        query: postcodeQuery,
        raw: data.result,
      };
    }

    if (res.status !== 404) {
      const error = new Error(data?.error || 'Unable to geocode postcode');
      error.statusCode = res.status || 502;
      throw error;
    }
  } catch (error) {
    if (error?.statusCode && error.statusCode !== 404) {
      throw error;
    }
  }

  const { res, data } = await fetchJson(
    `https://api.postcodes.io/outcodes/${encodeURIComponent(outcodeQuery)}`,
  );

  if (res.ok && data?.result) {
    const { latitude, longitude } = data.result;
    return {
      latitude,
      longitude,
      locationType: 'outcode',
      query: outcodeQuery,
      raw: data.result,
    };
  }

  const error = new Error(data?.error || 'Unable to geocode location');
  error.statusCode = res.status || 502;
  throw error;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: BASE_HEADERS,
    };
  }

  if (event.httpMethod !== 'GET') {
    return responseWithCors(405, { error: 'Method Not Allowed' });
  }

  const postcode = event.queryStringParameters?.postcode;

  if (!postcode) {
    return responseWithCors(400, { error: 'Query parameter "postcode" is required' });
  }

  try {
    const target = await geocodeLocation(postcode);
    const distanceMiles = Number(
      haversineDistanceMiles(HOME_BASE, target).toFixed(2),
    );
    const distanceKilometres = Number((distanceMiles * 1.60934).toFixed(2));

    const band = determineBand(distanceMiles);

    return responseWithCors(200, {
      query: postcode,
      reference: HOME_BASE.postcode,
      locationType: target.locationType,
      coordinates: {
        latitude: target.latitude,
        longitude: target.longitude,
      },
      distance: {
        miles: distanceMiles,
        kilometres: distanceKilometres,
      },
      band,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 502;
    return responseWithCors(statusCode, {
      error: error?.message || 'Unexpected error determining distance',
    });
  }
};
