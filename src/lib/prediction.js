/**
 * Cloudburst Prediction Logic
 * Supports both standard column names AND ERA5 meteorological naming.
 *
 * ERA5 mappings (your real dataset):
 *   t2m  → temperature in Kelvin  (convert: K - 273.15 = °C)
 *   u10  → east-west wind (m/s)
 *   v10  → north-south wind (m/s)  → combined: sqrt(u10²+v10²) * 3.6 = km/h
 *   sp   → surface pressure in Pa  (convert: Pa / 100 = hPa)
 */

/** Resolve a field from a row, trying multiple name variants */
function resolveField(row, ...keys) {
  for (const k of keys) {
    const val = row[k] ?? row[k.toUpperCase()] ?? row[k.toLowerCase()];
    if (val !== undefined && val !== '') return parseFloat(val);
  }
  return NaN;
}

/** Normalise a raw dataset row into unified physical units */
export function normaliseRow(row) {
  const rainfall = resolveField(row, 'RAINFALL', 'rainfall');

  const humidity = resolveField(row, 'humidity', 'HUMIDITY', 'rh');

  // Temperature: t2m (Kelvin) or temperature (°C)
  let temperature = resolveField(row, 'temperature', 'TEMPERATURE', 'temp');
  if (isNaN(temperature)) {
    const t2m = resolveField(row, 't2m');
    if (!isNaN(t2m)) temperature = t2m - 273.15;
  }

  // Pressure: sp (Pa) or pressure (hPa)
  let pressure = resolveField(row, 'pressure', 'PRESSURE');
  if (isNaN(pressure)) {
    const sp = resolveField(row, 'sp');
    if (!isNaN(sp)) pressure = sp / 100;
  }

  // Wind speed: wind_speed (km/h) or u10+v10 (m/s → km/h)
  let windSpeed = resolveField(row, 'wind_speed', 'WIND_SPEED');
  if (isNaN(windSpeed)) {
    const u10 = resolveField(row, 'u10');
    const v10 = resolveField(row, 'v10');
    if (!isNaN(u10) && !isNaN(v10)) {
      windSpeed = Math.sqrt(u10 * u10 + v10 * v10) * 3.6; // m/s → km/h
    }
  }

  return {
    rainfall:    isNaN(rainfall)    ? 0    : rainfall,
    humidity:    isNaN(humidity)    ? 0    : humidity,
    temperature: isNaN(temperature) ? 25   : +temperature.toFixed(2),
    pressure:    isNaN(pressure)    ? 1013 : +pressure.toFixed(1),
    windSpeed:   isNaN(windSpeed)   ? 0    : +windSpeed.toFixed(2),
  };
}

/** Detect which column schema this dataset uses */
export function detectSchema(rows) {
  if (!rows?.length) return 'standard';
  const cols = Object.keys(rows[0]).map(k => k.toLowerCase());
  const hasERA5 = cols.includes('t2m') || cols.includes('sp') || cols.includes('u10');
  return hasERA5 ? 'era5' : 'standard';
}

export function predictCloudburst({ rainfall, humidity, pressure, temperature, windSpeed, horizon = 'day' }) {
  const r  = Number(rainfall   ?? 0);
  const h  = Number(humidity   ?? 0);
  const p  = Number(pressure   ?? 1013);
  const t  = Number(temperature ?? 25);
  const ws = Number(windSpeed  ?? 0);

  // Feature scoring (each 0–1) — calibrated for real Western Ghats cloudburst ranges
  const rainfallScore  = Math.min(r / 300, 1);           // real data goes up to 486 mm
  const humidityScore  = Math.max(0, (h - 50) / 50);
  const pressureScore  = Math.max(0, (1013 - p) / 30);
  const tempScore      = Math.min(Math.max((t - 20) / 20, 0), 1);
  const windScore      = Math.min(ws / 60, 1);

  const weights = { rainfall: 0.38, humidity: 0.27, pressure: 0.18, temp: 0.09, wind: 0.08 };
  let prob =
    rainfallScore  * weights.rainfall  +
    humidityScore  * weights.humidity  +
    pressureScore  * weights.pressure  +
    tempScore      * weights.temp      +
    windScore      * weights.wind;

  // Interaction boosts
  if (r > 150 && h > 80) prob += 0.12;
  if (p < 990  && r > 100) prob += 0.10;
  if (ws > 20  && r > 80)  prob += 0.06;  // lower wind threshold for ERA5 m/s derived values

  const horizonFactor = { day: 1.0, week: 0.88, month: 0.72, year: 0.55 };
  prob *= horizonFactor[horizon] ?? 1.0;
  prob = Math.max(0, Math.min(1, prob));

  const pct = Math.round(prob * 100);
  let risk, color, interpretation;
  if (pct >= 65) {
    risk = 'High'; color = 'high';
    interpretation = buildInterpretation('high', { r, h, p, t, ws });
  } else if (pct >= 35) {
    risk = 'Moderate'; color = 'moderate';
    interpretation = buildInterpretation('moderate', { r, h, p, t, ws });
  } else {
    risk = 'Low'; color = 'low';
    interpretation = buildInterpretation('low', { r, h, p, t, ws });
  }
  return { probability: pct, risk, color, interpretation };
}

function buildInterpretation(level, { r, h, p, t, ws }) {
  const parts = [];
  if (r  > 200) parts.push(`extreme rainfall (${r.toFixed(0)} mm)`);
  else if (r > 150) parts.push(`very high rainfall (${r.toFixed(0)} mm)`);
  else if (r > 80)  parts.push('elevated rainfall');
  if (h  > 85)  parts.push(`very high humidity (${h.toFixed(0)}%)`);
  else if (h > 70) parts.push(`elevated humidity (${h.toFixed(0)}%)`);
  if (p  < 995) parts.push(`low atmospheric pressure (${p.toFixed(0)} hPa)`);
  if (ws > 20)  parts.push(`strong winds (${ws.toFixed(1)} km/h)`);
  if (t  > 30)  parts.push(`warm surface temperature (${t.toFixed(1)}°C)`);

  if (parts.length === 0) return level === 'low'
    ? 'Current conditions are stable with no significant cloudburst indicators.'
    : 'Marginal conditions detected; monitor closely.';

  const joined = parts.join(', ');
  if (level === 'high')     return `⚠ Dangerous conditions: ${joined} — critical cloudburst risk.`;
  if (level === 'moderate') return `Caution: ${joined} are contributing to elevated cloudburst risk.`;
  return `Mild indicators (${joined}), but overall risk remains manageable.`;
}

export function computeDatasetStats(rows) {
  if (!rows?.length) return null;
  const schema = detectSchema(rows);
  const normed = rows.map(normaliseRow);

  const statFor = (arr) => {
    const valid = arr.filter(v => !isNaN(v) && isFinite(v));
    if (!valid.length) return null;
    const sum = valid.reduce((a, b) => a + b, 0);
    const mean = sum / valid.length;
    const sorted = [...valid].sort((a, b) => a - b);
    return {
      mean:   +mean.toFixed(2),
      min:    +sorted[0].toFixed(2),
      max:    +sorted[sorted.length - 1].toFixed(2),
      count:  valid.length,
    };
  };

  const stats = {
    RAINFALL:    statFor(normed.map(r => r.rainfall)),
    humidity:    statFor(normed.map(r => r.humidity)),
    temperature: statFor(normed.map(r => r.temperature)),
    pressure:    statFor(normed.map(r => r.pressure)),
    wind_speed:  statFor(normed.map(r => r.windSpeed)),
  };

  const cloudburstCol = Object.keys(rows[0]).find(k => k.toLowerCase() === 'cloudburst');
  let cloudburstRate = null;
  if (cloudburstCol) {
    const events = rows.filter(r => Number(r[cloudburstCol]) === 1).length;
    cloudburstRate = +((events / rows.length) * 100).toFixed(1);
  }

  return { stats, cloudburstRate, totalRows: rows.length, schema };
}

export function buildTimeSeriesData(rows, limit = 80) {
  const slice = rows.slice(-limit);
  return slice.map((r, i) => {
    const n = normaliseRow(r);
    return {
      index: i,
      time: r.TIME ?? r.time ?? r.DATE ?? r.date ?? `T${i}`,
      rainfall:    +n.rainfall.toFixed(1),
      humidity:    +n.humidity.toFixed(1),
      temperature: +n.temperature.toFixed(1),
      wind_speed:  +n.windSpeed.toFixed(1),
      pressure:    +n.pressure.toFixed(1),
      cloudburst:  Number(r.cloudburst ?? r.CLOUDBURST ?? 0),
    };
  });
}
