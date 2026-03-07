import React, { useState, useMemo } from 'react';
import { CloudLightning, Zap, Info, TrendingUp } from 'lucide-react';
import { predictCloudburst, normaliseRow, detectSchema } from '../lib/prediction';

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
  const schema = rawData ? detectSchema(rawData) : 'standard';
  const isERA5 = schema === 'era5';

  // Compute averages from real data
  const dataDefaults = useMemo(() => {
    if (!rawData?.length) return null;
    const normed = rawData.map(normaliseRow);
    const avg = key => { const v = normed.map(r => r[key]).filter(v => !isNaN(v) && isFinite(v)); return v.length ? +(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : null; };
    return { rainfall: avg('rainfall'), humidity: avg('humidity'), pressure: avg('pressure'), temperature: avg('temperature'), windSpeed: avg('windSpeed') };
  }, [rawData]);

  // Compute real min/max for slider ranges
  const dataRanges = useMemo(() => {
    if (!rawData?.length) return null;
    const normed = rawData.map(normaliseRow);
    const range = key => { const v = normed.map(r=>r[key]).filter(v=>!isNaN(v)&&isFinite(v)); return v.length ? { min: Math.floor(Math.min(...v)), max: Math.ceil(Math.max(...v)) } : null; };
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

  const runPrediction = () => {
    setLoading(true); setResult(null);
    setTimeout(() => { setResult(predictCloudburst({ rainfall, humidity, pressure, temperature, windSpeed, horizon })); setLoading(false); }, 700);
  };

  const rs = result ? RISK_STYLES[result.color] : null;

  // Slider config — use real data ranges if available
  const sliders = [
    { key: 'rainfall',    label: 'Rainfall',     rawLabel: 'RAINFALL',  unit: 'mm',   val: rainfall,    set: setRainfall, min: dataRanges?.rainfall?.min    ?? 0,   max: dataRanges?.rainfall?.max    ?? 500, step: 1,   warning: rainfall > 200 },
    { key: 'humidity',    label: 'Humidity',     rawLabel: 'humidity',  unit: '%',    val: humidity,    set: setHumidity, min: dataRanges?.humidity?.min    ?? 10,  max: 100,                                 step: 0.5, warning: humidity > 85 },
    { key: 'pressure',    label: 'Pressure',     rawLabel: isERA5?'sp →':'pressure',  unit: 'hPa', val: pressure, set: setPressure, min: dataRanges?.pressure?.min ?? 870,  max: dataRanges?.pressure?.max ?? 1013, step: 1, warning: pressure < 950 },
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
