import React, { useState, useMemo } from 'react';
import { CloudLightning, Zap, Info, TrendingUp, CloudRain, Droplets, Gauge, Wind, Thermometer } from 'lucide-react';

// ── Event type theme ──────────────────────────────────────────────────────────
const EVENT_CFG = {
  Cloudburst: {
    emoji: '🌧️', label: 'Cloudburst', severity: 'SEVERE',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.4)',
    badge:  'rgba(239,68,68,0.18)',
    text:   '#f87171',
    glow:   '0 0 28px rgba(239,68,68,0.18)',
    tagline: 'High-intensity rainfall · Saturated humidity · Low pressure',
  },
  Storm: {
    emoji: '⛈️', label: 'Storm', severity: 'MODERATE',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.4)',
    badge:  'rgba(245,158,11,0.18)',
    text:   '#fbbf24',
    glow:   '0 0 28px rgba(245,158,11,0.14)',
    tagline: 'Elevated rainfall · High humidity · Unstable pressure',
  },
  Normal: {
    emoji: '🌤️', label: 'Normal', severity: 'STABLE',
    bg:     'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.4)',
    badge:  'rgba(16,185,129,0.18)',
    text:   '#34d399',
    glow:   '0 0 28px rgba(16,185,129,0.10)',
    tagline: 'No significant extreme weather indicators detected',
  },
};

// ── Dynamic explanation lines ─────────────────────────────────────────────────
function getExplanation(type, rainfall, humidity, pressure, windSpeed, temperature) {
  const lines = [];
  if (type === 'Cloudburst') {
    if (rainfall >= 200) lines.push(`Rainfall is extreme at ${rainfall.toFixed(0)} mm — far beyond the cloudburst threshold.`);
    else lines.push(`Rainfall has reached ${rainfall.toFixed(0)} mm, crossing critical cloudburst thresholds.`);
    if (humidity >= 90)  lines.push(`Humidity is near-saturated at ${humidity.toFixed(0)}% — the atmosphere cannot absorb further moisture.`);
    else if (humidity >= 80) lines.push(`High humidity (${humidity.toFixed(0)}%) compounds moisture overload.`);
    if (pressure < 990)  lines.push(`Pressure has dropped sharply to ${pressure.toFixed(0)} hPa, driving violent uplift of moist air.`);
    else if (pressure < 1000) lines.push(`Low pressure (${pressure.toFixed(0)} hPa) is destabilising the air column.`);
    if (windSpeed > 30)  lines.push(`Wind at ${windSpeed.toFixed(1)} km/h is accelerating moisture convergence.`);
  } else if (type === 'Storm') {
    if (rainfall >= 100) lines.push(`Rainfall of ${rainfall.toFixed(0)} mm indicates active convective storm activity.`);
    else lines.push(`Moderate rainfall (${rainfall.toFixed(0)} mm) combined with instability suggests developing storm conditions.`);
    if (humidity >= 80)  lines.push(`High humidity (${humidity.toFixed(0)}%) indicates a moisture-laden atmosphere.`);
    else if (humidity >= 70) lines.push(`Humidity (${humidity.toFixed(0)}%) is sufficient to sustain storm activity.`);
    if (pressure < 1005) lines.push(`Pressure (${pressure.toFixed(0)} hPa) is below fair-weather levels, showing atmospheric instability.`);
    if (windSpeed > 20)  lines.push(`Winds of ${windSpeed.toFixed(1)} km/h are consistent with storm-level circulation.`);
    if (temperature > 30) lines.push(`Surface temperature of ${temperature.toFixed(1)}°C is fuelling convection.`);
  } else {
    lines.push(rainfall < 50 ? `Rainfall is low at ${rainfall.toFixed(0)} mm — no significant precipitation event detected.` : `Rainfall (${rainfall.toFixed(0)} mm) is present but below severe weather thresholds.`);
    if (humidity < 70) lines.push(`Humidity is moderate at ${humidity.toFixed(0)}%, indicating no moisture overload.`);
    if (pressure >= 1005) lines.push(`Pressure is stable at ${pressure.toFixed(0)} hPa — typical of undisturbed conditions.`);
    lines.push('No extreme weather indicators are present at this time.');
  }
  return lines;
}

// ── Per-factor impact rating ──────────────────────────────────────────────────
function getFactors(rainfall, humidity, pressure, windSpeed, temperature) {
  const hi  = { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',  text:'#f87171' };
  const mid = { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)', text:'#fbbf24' };
  const lo  = { bg:'rgba(16,185,129,0.10)', border:'rgba(16,185,129,0.3)', text:'#34d399' };

  return [
    {
      Icon: CloudRain, label: 'Rainfall', value: `${rainfall.toFixed(0)} mm`,
      impact: rainfall >= 200 ? 'Critical' : rainfall >= 150 ? 'Very High' : rainfall >= 80 ? 'High' : 'Low',
      c: rainfall >= 150 ? hi : rainfall >= 80 ? mid : lo,
    },
    {
      Icon: Droplets, label: 'Humidity', value: `${humidity.toFixed(0)}%`,
      impact: humidity >= 90 ? 'Saturated' : humidity >= 80 ? 'High' : humidity >= 70 ? 'Elevated' : 'Normal',
      c: humidity >= 80 ? hi : humidity >= 70 ? mid : lo,
    },
    {
      Icon: Gauge, label: 'Pressure', value: `${pressure.toFixed(0)} hPa`,
      impact: pressure < 990 ? 'Critical Drop' : pressure < 1000 ? 'Unstable' : pressure < 1008 ? 'Slightly Low' : 'Stable',
      c: pressure < 990 ? hi : pressure < 1005 ? mid : lo,
    },
    {
      Icon: Wind, label: 'Wind Speed', value: `${windSpeed.toFixed(1)} km/h`,
      impact: windSpeed > 40 ? 'Severe' : windSpeed > 20 ? 'Elevated' : windSpeed > 10 ? 'Moderate' : 'Calm',
      c: windSpeed > 40 ? hi : windSpeed > 20 ? mid : lo,
    },
    {
      Icon: Thermometer, label: 'Temperature', value: `${temperature.toFixed(1)}°C`,
      impact: temperature > 35 ? 'Very High' : temperature > 30 ? 'Warm' : temperature > 25 ? 'Mild' : 'Cool',
      c: temperature > 35 ? hi : temperature > 30 ? mid : lo,
    },
  ];
}

// ── Classification card component ─────────────────────────────────────────────
function EventClassificationCard({ eventType, rainfall, humidity, pressure, windSpeed, temperature }) {
  const cfg  = EVENT_CFG[eventType] || EVENT_CFG.Normal;
  const lines   = getExplanation(eventType, rainfall, humidity, pressure, windSpeed, temperature);
  const factors = getFactors(rainfall, humidity, pressure, windSpeed, temperature);

  return (
    <div className="animate-slide-up" style={{
      borderRadius: 16, border: `1px solid ${cfg.border}`,
      backgroundColor: cfg.bg, boxShadow: cfg.glow, overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${cfg.border}` }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#475569', margin: '0 0 10px' }}>
          Atmospheric Event Classification
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* big emoji badge */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            backgroundColor: cfg.badge, border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>{cfg.emoji}</div>

          <div style={{ flex: 1 }}>
            {/* event type + severity pill on same row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26,
                color: cfg.text, letterSpacing: '-0.5px', lineHeight: 1 }}>
                {cfg.label}
              </span>
              <span style={{
                fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '3px 9px', borderRadius: 6,
                backgroundColor: cfg.badge, border: `1px solid ${cfg.border}`, color: cfg.text,
              }}>{cfg.severity}</span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4 }}>{cfg.tagline}</p>
          </div>
        </div>
      </div>

      {/* ── Input summary row ── */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${cfg.border}`,
        display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { label: 'Rain',  val: `${rainfall.toFixed(0)} mm`     },
          { label: 'Hum',   val: `${humidity.toFixed(0)}%`        },
          { label: 'Press', val: `${pressure.toFixed(0)} hPa`     },
          { label: 'Wind',  val: `${windSpeed.toFixed(1)} km/h`   },
          { label: 'Temp',  val: `${temperature.toFixed(1)}°C`    },
        ].map(p => (
          <span key={p.label} style={{
            fontSize: 11, fontFamily: 'monospace',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7, padding: '4px 10px', color: '#94a3b8',
          }}>
            <span style={{ color: '#475569' }}>{p.label}: </span>{p.val}
          </span>
        ))}
      </div>

      {/* ── Why this classification ── */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${cfg.border}` }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#475569', margin: '0 0 10px' }}>
          Why this classification?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: cfg.text,
                flexShrink: 0, marginTop: 6 }} />
              <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key contributing factors ── */}
      <div style={{ padding: '14px 20px' }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#475569', margin: '0 0 10px' }}>
          Key Contributing Factors
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {factors.map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px', borderRadius: 9,
              backgroundColor: f.c.bg, border: `1px solid ${f.c.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <f.Icon size={13} color={f.c.text} />
                <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{f.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{f.value}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 8px', borderRadius: 5,
                  backgroundColor: f.c.bg, border: `1px solid ${f.c.border}`, color: f.c.text,
                }}>{f.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const HORIZONS = [
  { id: 'day', label: 'Next Day', sub: '24 hrs' },
  { id: 'week', label: 'Next Week', sub: '7 days' },
  { id: 'month', label: 'Next Month', sub: '30 days' },
  { id: 'year', label: 'Next Year', sub: '365 days' },
];

const RISK_STYLES = {
  low:      { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#34d399', bar: '#10b981' },
  moderate: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', bar: '#f59e0b' },
  high:     { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  text: '#f87171', bar: '#ef4444' },
};

function Slider({ label, rawLabel, unit, min, max, step = 1, value, onChange, warning }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</label>
          {rawLabel && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#334155', marginLeft: 6 }}>({rawLabel})</span>}
        </div>
        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: warning ? 'rgba(245,158,11,0.15)' : '#111e36', color: warning ? '#fbbf24' : '#cbd5e1' }}>
          {typeof value === 'number' ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', background: `linear-gradient(to right, #347ef8 ${pct}%, #172543 ${pct}%)` }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>{min}</span>
        <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>{max}</span>
      </div>
    </div>
  );
}

export default function PredictionPanel({ rawData }) {
  // Detect ERA5 by checking if the first row has t2m or sp columns
  const isERA5 = useMemo(() => {
    if (!rawData?.length) return false;
    const cols = Object.keys(rawData[0]).map(k => k.toLowerCase());
    return cols.includes('t2m') || cols.includes('sp') || cols.includes('u10');
  }, [rawData]);

  // Safely extract a numeric field from a raw CSV row, trying common name variants
  const getField = (row, ...keys) => {
    for (const k of keys) {
      const v = row[k] ?? row[k.toUpperCase()] ?? row[k.toLowerCase()];
      if (v !== undefined && v !== '') { const n = parseFloat(v); if (!isNaN(n)) return n; }
    }
    return NaN;
  };

  // Convert a raw CSV row into unified physical units (inline, no external dependency)
  const toNormed = (row) => {
    const rainfall    = getField(row, 'RAINFALL', 'rainfall');
    const humidity    = getField(row, 'humidity', 'HUMIDITY');
    // Temperature: t2m is Kelvin → °C; fallback to temperature column
    const t2m         = getField(row, 't2m');
    const temperature = !isNaN(t2m) ? t2m - 273.15 : getField(row, 'temperature', 'TEMPERATURE');
    // Pressure: sp is Pascals → hPa; fallback to pressure column
    // Guard: if value is still > 2000 after first conversion, it was double-encoded in Pa
    const sp          = getField(row, 'sp');
    const pressureRaw = !isNaN(sp) ? sp / 100 : getField(row, 'pressure', 'PRESSURE');
    const pressure    = pressureRaw > 2000 ? pressureRaw / 100 : pressureRaw;
    const u10         = getField(row, 'u10');
    const v10         = getField(row, 'v10');
    const windSpeed   = (!isNaN(u10) && !isNaN(v10))
      ? Math.sqrt(u10 * u10 + v10 * v10) * 3.6
      : getField(row, 'wind_speed', 'WIND_SPEED');
    return { rainfall, humidity, temperature, pressure, windSpeed };
  };

  // Compute averages from real data using inline conversion
  const dataDefaults = useMemo(() => {
    if (!rawData?.length) return null;
    const normed = rawData.map(toNormed);
    const avg = key => {
      const v = normed.map(r => r[key]).filter(v => !isNaN(v) && isFinite(v));
      return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null;
    };
    return { rainfall: avg('rainfall'), humidity: avg('humidity'), pressure: avg('pressure'), temperature: avg('temperature'), windSpeed: avg('windSpeed') };
  }, [rawData]);

  // Compute real min/max for slider ranges using inline conversion
  const dataRanges = useMemo(() => {
    if (!rawData?.length) return null;
    const normed = rawData.map(toNormed);
    const range = key => {
      const v = normed.map(r => r[key]).filter(v => !isNaN(v) && isFinite(v));
      if (!v.length) return null;
      return { min: Math.floor(Math.min(...v)), max: Math.ceil(Math.max(...v)) };
    };
    return { rainfall: range('rainfall'), humidity: range('humidity'), pressure: range('pressure'), temperature: range('temperature'), windSpeed: range('windSpeed') };
  }, [rawData]);

  const [horizon, setHorizon] = useState('day');
  const [rainfall,    setRainfall]  = useState(() => dataDefaults?.rainfall    ?? 180);
  const [humidity,    setHumidity]  = useState(() => dataDefaults?.humidity    ?? 85);
  const [pressure,    setPressure]  = useState(() => dataDefaults?.pressure    ?? 980);
  const [temperature, setTemp]      = useState(() => dataDefaults?.temperature ?? 25);
  const [windSpeed,   setWind]      = useState(() => dataDefaults?.windSpeed   ?? 20);
  const [result,      setResult]    = useState(null);
  const [loading,     setLoading]   = useState(false);

  const loadDefaults = () => {
    if (!dataDefaults) return;
    if (dataDefaults.rainfall    != null) setRainfall(+dataDefaults.rainfall.toFixed(1));
    if (dataDefaults.humidity    != null) setHumidity(+dataDefaults.humidity.toFixed(1));
    if (dataDefaults.pressure    != null) setPressure(+dataDefaults.pressure.toFixed(1));
    if (dataDefaults.temperature != null) setTemp(+dataDefaults.temperature.toFixed(1));
    if (dataDefaults.windSpeed   != null) setWind(+dataDefaults.windSpeed.toFixed(1));
  };

  const runPrediction = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send all slider values so the Haskell engine uses them directly
        // instead of falling back to dataset averages
        body: JSON.stringify({
          horizon,
          rainfall,
          humidity,
          pressure,
          temperature,
          windSpeed,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const rs = result ? RISK_STYLES[result.color] || RISK_STYLES.low : null;

  // Slider config — use real data ranges if available
  const sliders = [
    { key: 'rainfall',    label: 'Rainfall',     rawLabel: 'RAINFALL',  unit: 'mm',   val: rainfall,    set: setRainfall, min: dataRanges?.rainfall?.min    ?? 0,   max: dataRanges?.rainfall?.max    ?? 500, step: 1,   warning: rainfall > 200 },
    { key: 'humidity',    label: 'Humidity',     rawLabel: 'humidity',  unit: '%',    val: humidity,    set: setHumidity, min: dataRanges?.humidity?.min    ?? 10,  max: 100,                                 step: 0.5, warning: humidity > 85 },
    { key: 'pressure',    label: 'Pressure',     rawLabel: isERA5?'sp →':'pressure',  unit: 'hPa', val: pressure, set: setPressure, min: dataRanges?.pressure?.min && dataRanges.pressure.min < 2000 ? dataRanges.pressure.min : 870,  max: dataRanges?.pressure?.max && dataRanges.pressure.max < 2000 ? dataRanges.pressure.max : 1050, step: 1, warning: pressure < 950 },
    { key: 'temperature', label: 'Temperature',  rawLabel: isERA5?'t2m →':'temp',    unit: '°C',  val: temperature, set: setTemp, min: dataRanges?.temperature?.min ?? 10, max: dataRanges?.temperature?.max ?? 40, step: 0.5, warning: temperature > 32 },
    { key: 'windSpeed',   label: 'Wind Speed',   rawLabel: isERA5?'u10+v10 →':'wind_speed', unit: 'km/h', val: windSpeed, set: setWind, min: 0, max: dataRanges?.windSpeed?.max ?? 60, step: 0.5, warning: windSpeed > 30 },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Cloudburst Prediction</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {isERA5 ? 'ERA5 columns auto-converted — sliders use real dataset ranges.' : 'Configure feature inputs and select a prediction horizon.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Horizon */}
          <div className="card-glow" style={{ padding: 20 }}>
            <p className="label" style={{ marginBottom: 12 }}>Prediction Horizon</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {HORIZONS.map(h => (
                <button key={h.id} onClick={() => setHorizon(h.id)}
                  style={{ borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: `1px solid ${horizon===h.id?'rgba(52,126,248,0.5)':'#1e2f52'}`, backgroundColor: horizon===h.id?'rgba(29,94,237,0.15)':'transparent', cursor: 'pointer' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 12, color: horizon===h.id?'#59a3fc':'#64748b', margin:'0 0 2px' }}>{h.label}</p>
                  <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{h.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="card-glow" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p className="label">Feature Inputs</p>
              {dataDefaults && (
                <button onClick={loadDefaults} style={{ fontSize: 11, color: '#59a3fc', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={11} /> Load dataset averages
                </button>
              )}
            </div>
            {sliders.map(s => (
              <Slider key={s.key} label={s.label} rawLabel={s.rawLabel} unit={s.unit}
                min={s.min} max={s.max} step={s.step} value={s.val} onChange={s.set} warning={s.warning} />
            ))}
          </div>

          <button onClick={runPrediction} disabled={loading} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin"/> Calculating…</>
              : <><Zap size={17}/> Predict Cloudburst Risk</>}
          </button>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result ? (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderRadius: 16, border: `1px solid ${rs.border}`, padding: 24, textAlign: 'center', backgroundColor: rs.bg }}>
                <p className="label" style={{ marginBottom: 8 }}>Risk Level</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 9999, border: `2px solid ${rs.border}`, color: rs.text, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                  <CloudLightning size={20}/>{result.risk}
                </div>
                <p className="label" style={{ marginBottom: 4 }}>Probability Score</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 52, color: rs.text, margin: '0 0 16px', lineHeight: 1 }}>{result.probability}%</p>
                <div style={{ height: 12, backgroundColor: '#111e36', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 9999, backgroundColor: rs.bar, width: `${result.probability}%`, transition: 'width 1s ease' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#334155' }}>0%</span>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#334155' }}>100%</span>
                </div>
              </div>

              <div className="card-glow" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Info size={14} color="#59a3fc" style={{ flexShrink: 0, marginTop: 2 }}/>
                  <div>
                    <p className="label" style={{ marginBottom: 6 }}>Interpretation</p>
                    <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{result.interpretation}</p>
                  </div>
                </div>
              </div>

              <div className="card-glow" style={{ padding: 16 }}>
                <p className="label" style={{ marginBottom: 12 }}>Factor Weights</p>
                {[
                  { label: 'Rainfall',     value: rainfall,       max: 500, unit: 'mm',   weight: 38 },
                  { label: 'Humidity',     value: humidity,       max: 100, unit: '%',    weight: 27 },
                  { label: 'Low Pressure', value: 1013-pressure,  max: 143, unit: 'hPa', weight: 18 },
                  { label: 'Temperature',  value: temperature,    max: 40,  unit: '°C',  weight: 9  },
                  { label: 'Wind Speed',   value: windSpeed,      max: 60,  unit: 'km/h', weight: 8 },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#94a3b8' }}>{f.label}</span>
                      <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{typeof f.value==='number'?f.value.toFixed(1):f.value} {f.unit} <span style={{ color: '#334155' }}>({f.weight}%)</span></span>
                    </div>
                    <div style={{ height: 6, backgroundColor: '#111e36', borderRadius: 9999 }}>
                      <div style={{ height: '100%', borderRadius: 9999, backgroundColor: '#347ef8', width: `${Math.min(Math.max(f.value,0)/f.max*100,100)}%`, transition: 'width 0.5s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Atmospheric Event Classification card */}
              <EventClassificationCard
                eventType={result.eventType || 'Normal'}
                rainfall={result.rainfall ?? rainfall}
                humidity={result.humidity ?? humidity}
                pressure={result.pressure ?? pressure}
                windSpeed={result.windSpeed ?? windSpeed}
                temperature={result.temperature ?? temperature}
              />
            </div>
          ) : (
            <div className="card-glow" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#111e36', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudLightning size={28} color="#334155"/>
              </div>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#475569', margin: 0 }}>Awaiting Prediction</p>
                <p style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>Set your parameters and click Predict</p>
                {dataDefaults && <button onClick={loadDefaults} style={{ marginTop: 12, fontSize: 12, color: '#347ef8', background: 'none', border: '1px solid rgba(52,126,248,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Load dataset averages →</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
