/**
 * POST /api/track — records a visit.
 * Coordinates: phone GPS when provided; else Cloudflare IP.
 * Place labels: reverse-geocode GPS (accurate) when possible; else Cloudflare IP (approximate).
 */
async function reverseGeocodeFromGps(lat, lng) {
  const u =
    'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
    encodeURIComponent(lat) +
    '&longitude=' +
    encodeURIComponent(lng) +
    '&localityLanguage=en';
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) return null;
  const j = await r.json();
  return {
    country: j.countryCode || null,
    city: j.city || j.locality || null,
    locality: j.locality || null,
    region: j.principalSubdivision || null,
    postal_code: j.postcode || null,
    continent: j.continent || null,
  };
}

function placeFromBody(body) {
  if (!body || (!body.city && !body.locality && !body.country && !body.postal_code)) return null;
  return {
    country: body.country || null,
    city: body.city || null,
    locality: body.locality || null,
    region: body.region || null,
    postal_code: body.postal_code || null,
    continent: body.continent || null,
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const cf = request.cf || {};

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}

  const ipLat = cf.latitude != null ? Number(cf.latitude) : null;
  const ipLng = cf.longitude != null ? Number(cf.longitude) : null;
  const gpsLat = body.gps_latitude != null ? Number(body.gps_latitude) : null;
  const gpsLng = body.gps_longitude != null ? Number(body.gps_longitude) : null;
  const gpsOk =
    gpsLat != null &&
    gpsLng != null &&
    Number.isFinite(gpsLat) &&
    Number.isFinite(gpsLng) &&
    gpsLat >= -90 &&
    gpsLat <= 90 &&
    gpsLng >= -180 &&
    gpsLng <= 180;

  let placeSource = null;
  let place = null;

  if (gpsOk) {
    place = placeFromBody(body);
    if (place) {
      placeSource = body.place_source === 'gps_geocode' ? 'gps_geocode' : 'gps_geocode';
    } else {
      place = await reverseGeocodeFromGps(gpsLat, gpsLng);
      placeSource = place ? 'gps_geocode' : 'gps_only';
    }
  }

  if (!place) {
    place = {
      country: cf.country || null,
      city: cf.city || null,
      locality: cf.city || null,
      region: cf.region || null,
      postal_code: cf.postalCode || null,
      continent: cf.continent || null,
    };
    placeSource = ipLat != null || cf.country ? 'ip' : null;
  }

  const row = {
    host: body.host || null,
    path: body.path || null,
    campaign: body.campaign || null,
    country: place.country,
    city: place.city,
    locality: place.locality,
    region: place.region,
    postal_code: place.postal_code,
    continent: place.continent,
    timezone: cf.timezone || null,
    latitude: gpsOk ? gpsLat : ipLat,
    longitude: gpsOk ? gpsLng : ipLng,
    gps_latitude: gpsOk ? gpsLat : null,
    gps_longitude: gpsOk ? gpsLng : null,
    location_source: gpsOk ? 'gps' : ipLat != null ? 'ip' : null,
    place_source: placeSource,
    colo: cf.colo || null,
    user_agent: request.headers.get('User-Agent') || body.user_agent || null,
    referrer: request.headers.get('Referer') || body.referrer || null,
    device_type: body.device_type || null,
  };

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: 'tracking_not_configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const res = await fetch(url + '/rest/v1/download_link_visits', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ ok: false, error: 'db_insert_failed', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
