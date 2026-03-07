import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { computeDatasetStats, buildTimeSeriesData, detectSchema } from '../lib/prediction';
import { Droplets, Thermometer, Wind, Activity, ArrowUpRight, Info } from 'lucide-react';

const CT = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#0b1628', border: '1px solid #1e2f52', borderRadius: 10, padding: '8px 12px' }}>
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 600, margin: 0 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  );
};

const ERA5_MAPPING = [
  { raw: 't2m',  mapped: 'temperature', unit: 'K → °C',   note: '−273.15' },
  { raw: 'sp',   mapped: 'pressure',    unit: 'Pa → hPa',  note: '÷ 100' },
  { raw: 'u10',  mapped: 'wind (EW)',   unit: 'm/s → km/h', note: '×3.6' },
  { raw: 'v10',  mapped: 'wind (NS)',   unit: 'm/s → km/h', note: '×3.6' },
];

export default function OverviewPanel({ rawData, onNavigate }) {
  const stats  = useMemo(() => computeDatasetStats(rawData), [rawData]);
  const ts     = useMemo(() => buildTimeSeriesData(rawData || [], 40), [rawData]);
  const schema = rawData ? detectSchema(rawData) : 'standard';

  if (!rawData) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '80px 0 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 24, backgroundColor: '#111e36', marginBottom: 24 }}>
            <span style={{ fontSize: 40 }}>⛈</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 32, color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>Western Ghats<br />Cloudburst Prediction</h1>
          <p style={{ color: '#64748b', maxWidth: 440, margin: '0 auto 12px', lineHeight: 1.6 }}>Upload your CSV dataset to begin. The dashboard auto-detects ERA5 column names.</p>
          <p style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', maxWidth: 500, margin: '0 auto 32px' }}>Supports: RAINFALL, humidity, t2m, u10, v10, sp — or — rainfall, humidity, temperature, wind_speed, pressure</p>
          <button onClick={() => onNavigate('upload')} className="btn-primary" style={{ fontSize: 15, padding: '12px 24px' }}>
            <ArrowUpRight size={16} /> Get Started → Upload Dataset
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { icon: '📤', title: 'CSV Upload', desc: 'ERA5 column names auto-detected and converted.' },
            { icon: '🧠', title: 'Prediction', desc: 'Rule-based model estimates cloudburst probability.' },
            { icon: '📊', title: 'Visualize', desc: 'Interactive charts for rainfall, humidity & risk.' },
            { icon: '🗺️', title: 'Risk Map', desc: 'Geo-map with your actual lat/lon data points.' },
          ].map(f => (
            <div key={f.title} className="card-glow" style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#fff', fontSize: 14, margin: '0 0 4px' }}>{f.title}</p>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Overview</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Summary of your uploaded dataset</p>
        </div>
        {stats?.cloudburstRate != null && (
          <div className="card-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
            <Activity size={14} color="#f87171" />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#fff', fontSize: 14 }}>{stats.cloudburstRate}%</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>cloudburst rate</span>
          </div>
        )}
      </div>

      {/* ERA5 Schema Banner */}
      {schema === 'era5' && (
        <div style={{ backgroundColor: 'rgba(52,126,248,0.08)', border: '1px solid rgba(52,126,248,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Info size={15} color="#59a3fc" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: '#59a3fc', margin: '0 0 6px' }}>ERA5 Dataset Detected — Columns Auto-Converted</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ERA5_MAPPING.map(m => (
                <span key={m.raw} style={{ fontSize: 11, fontFamily: 'monospace', backgroundColor: 'rgba(52,126,248,0.12)', border: '1px solid rgba(52,126,248,0.2)', borderRadius: 6, padding: '3px 8px', color: '#93c5fd' }}>
                  <span style={{ color: '#64748b' }}>{m.raw}</span> → {m.mapped} <span style={{ color: '#475569' }}>({m.note})</span>
                </span>
              ))}
              <span style={{ fontSize: 11, fontFamily: 'monospace', backgroundColor: 'rgba(52,126,248,0.12)', border: '1px solid rgba(52,126,248,0.2)', borderRadius: 6, padding: '3px 8px', color: '#93c5fd' }}>
                <span style={{ color: '#64748b' }}>u10+v10</span> → wind speed <span style={{ color: '#475569' }}>(√(u²+v²))</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Records', value: stats?.totalRows?.toLocaleString() ?? '—', sub: 'observations', color: '#59a3fc', Icon: Activity },
          { label: 'Avg Rainfall',  value: stats?.stats?.RAINFALL?.mean    != null ? `${stats.stats.RAINFALL.mean} mm`    : '—', sub: `max ${stats?.stats?.RAINFALL?.max    ?? '—'} mm`,   color: '#38bdf8', Icon: Droplets },
          { label: 'Avg Humidity',  value: stats?.stats?.humidity?.mean    != null ? `${stats.stats.humidity.mean}%`      : '—', sub: `max ${stats?.stats?.humidity?.max    ?? '—'}%`,     color: '#34d399', Icon: Thermometer },
          { label: 'Avg Temp',      value: stats?.stats?.temperature?.mean != null ? `${stats.stats.temperature.mean}°C`  : '—', sub: `range ${stats?.stats?.temperature?.min ?? '—'}–${stats?.stats?.temperature?.max ?? '—'}°C`, color: '#fbbf24', Icon: Wind },
        ].map(k => (
          <div key={k.label} className="card-glow" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="label">{k.label}</p>
              <k.Icon size={15} color={k.color} />
            </div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', margin: '0 0 2px' }}>{k.value}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Second row: pressure + wind */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: schema==='era5' ? 'Avg Pressure (sp)' : 'Avg Pressure', value: stats?.stats?.pressure?.mean != null ? `${stats.stats.pressure.mean} hPa` : '—', sub: `range ${stats?.stats?.pressure?.min ?? '—'}–${stats?.stats?.pressure?.max ?? '—'} hPa`, color: '#a78bfa' },
          { label: schema==='era5' ? 'Avg Wind (u10+v10)' : 'Avg Wind Speed', value: stats?.stats?.wind_speed?.mean != null ? `${stats.stats.wind_speed.mean} km/h` : '—', sub: `max ${stats?.stats?.wind_speed?.max ?? '—'} km/h`, color: '#fb923c' },
        ].map(k => (
          <div key={k.label} className="card-glow" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="label">{k.label}</p>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: k.color, backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 6 }}>derived</span>
            </div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', margin: '0 0 2px' }}>{k.value}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card-glow" style={{ padding: 20 }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 16 }}>Rainfall Trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={ts} margin={{ top: 2, right: 2, bottom: 2, left: 0 }}>
              <defs><linearGradient id="mini-rf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#347ef8" stopOpacity={0.4}/><stop offset="95%" stopColor="#347ef8" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis hide/><YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={40} unit="mm"/>
              <Tooltip content={<CT />}/>
              <Area type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#347ef8" fill="url(#mini-rf)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card-glow" style={{ padding: 20 }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 16 }}>Humidity & Temperature (°C)</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={ts.slice(-20)} margin={{ top: 2, right: 2, bottom: 2, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis hide/><YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={30}/>
              <Tooltip content={<CT />}/>
              <Bar dataKey="humidity" name="Humidity (%)" fill="#38bdf8" radius={[2,2,0,0]}/>
              <Bar dataKey="temperature" name="Temp (°C)" fill="#fbbf24" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Run Prediction',  desc: 'Estimate cloudburst risk using your dataset features', nav: 'predict' },
          { label: 'View Charts',     desc: 'Explore rainfall, humidity & risk visualizations',     nav: 'visualize' },
          { label: 'Open Risk Map',   desc: 'Plot your actual lat/lon data points on the map',      nav: 'map' },
        ].map(a => (
          <button key={a.nav} onClick={() => onNavigate(a.nav)} style={{ padding: 16, borderRadius: 16, border: '1px solid #172543', backgroundColor: '#0b1628', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#347ef8'; e.currentTarget.style.backgroundColor='rgba(29,94,237,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#172543'; e.currentTarget.style.backgroundColor='#0b1628'; }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#fff', margin: '0 0 4px' }}>{a.label}</p>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px' }}>{a.desc}</p>
            <ArrowUpRight size={13} color="#334155" />
          </button>
        ))}
      </div>
    </div>
  );
}
