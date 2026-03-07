import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend } from 'recharts';
import { buildTimeSeriesData, detectSchema } from '../lib/prediction';
import { BarChart2, TrendingUp, Droplets, Wind, Thermometer } from 'lucide-react';

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#0b1628', border: '1px solid #1e2f52', borderRadius: 10, padding: '8px 12px' }}>
      {label && <p style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>{String(label).slice(0,12)}</p>}
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 600, margin: 0 }}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1):p.value}</p>)}
    </div>
  );
};

function ChartCard({ title, sub, icon: Icon, children, extra }) {
  return (
    <div className="card-glow" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} color="#59a3fc"/>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff', margin: 0 }}>{title}</p>
            {sub && <p style={{ fontSize: 10, color: '#475569', margin: 0, fontFamily: 'monospace' }}>{sub}</p>}
          </div>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

const tickFmt = (ts, total) => (i) => (i % Math.ceil(total / 8) === 0 ? String(ts).slice(0,10) : '');

export default function VisualizationPanel({ rawData }) {
  const [rainfallView, setRainfallView] = useState('area');
  const schema = detectSchema(rawData);
  const isERA5 = schema === 'era5';
  const ts = useMemo(() => buildTimeSeriesData(rawData, 100), [rawData]);

  const scatterData = useMemo(() => ts.map(d => ({ rainfall: d.rainfall, humidity: d.humidity, cloudburst: d.cloudburst })), [ts]);
  const riskTimeline = useMemo(() => ts.map(d => {
    const score = Math.min(100, Math.round((d.rainfall/350)*38 + Math.max(0,(d.humidity-50)/50)*27 + Math.max(0,(1013-d.pressure)/40)*18));
    return { ...d, riskScore: score };
  }), [ts]);
  const tempWind = useMemo(() => ts.map(d => ({ time: d.time, temp: d.temperature, wind: d.wind_speed })), [ts]);

  const maxRainfall = ts.length ? Math.max(...ts.map(d => d.rainfall)).toFixed(1) : 0;
  const avgHumidity = ts.length ? (ts.reduce((a,d) => a+d.humidity,0)/ts.length).toFixed(1) : 0;
  const cloudburstEvents = ts.filter(d => d.cloudburst===1).length;

  const nTick = Math.ceil(ts.length / 8);
  const xTickFmt = (v, i) => (i % nTick === 0 ? String(v).slice(0,10) : '');

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Visualizations</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {isERA5 ? 'ERA5 columns converted: t2m→°C, sp→hPa, u10+v10→km/h' : 'Explore patterns in your dataset.'}
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Data Points', value: ts.length.toLocaleString(), unit: 'records' },
          { label: 'Cloudburst Events', value: cloudburstEvents, unit: 'events (label=1)' },
          { label: 'Peak Rainfall', value: maxRainfall, unit: 'mm' },
          { label: 'Avg Humidity', value: avgHumidity, unit: '%' },
        ].map(s => (
          <div key={s.label} className="card-glow" style={{ padding: 16 }}>
            <p className="label" style={{ marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', margin: '4px 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{s.unit}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Rainfall trend */}
        <ChartCard title="Rainfall Over Time" sub="RAINFALL column (mm)" icon={TrendingUp}
          extra={
            <div style={{ display: 'flex', gap: 6 }}>
              {['area','bar'].map(v=>(
                <button key={v} onClick={()=>setRainfallView(v)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textTransform: 'capitalize', backgroundColor: rainfallView===v?'rgba(52,126,248,0.2)':'transparent', color: rainfallView===v?'#59a3fc':'#64748b', fontWeight: rainfallView===v?600:400 }}>{v}</button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={200}>
            {rainfallView==='area'
              ? <AreaChart data={ts} margin={{top:5,right:5,bottom:5,left:0}}>
                  <defs><linearGradient id="rfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#347ef8" stopOpacity={0.3}/><stop offset="95%" stopColor="#347ef8" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={xTickFmt}/><YAxis tick={{fontSize:10,fill:'#64748b'}} unit=" mm" width={50}/>
                  <Tooltip content={<CT/>}/><ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="4 4" label={{value:'200mm',fill:'#f59e0b',fontSize:10}}/>
                  <Area type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#347ef8" fill="url(#rfGrad)" strokeWidth={2} dot={false}/>
                </AreaChart>
              : <BarChart data={ts} margin={{top:5,right:5,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={xTickFmt}/><YAxis tick={{fontSize:10,fill:'#64748b'}} unit=" mm" width={50}/>
                  <Tooltip content={<CT/>}/><ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="4 4"/>
                  <Bar dataKey="rainfall" name="Rainfall (mm)" radius={[2,2,0,0]}>{ts.map((d,i)=><Cell key={i} fill={d.rainfall>250?'#ef4444':d.rainfall>180?'#f59e0b':'#347ef8'}/>)}</Bar>
                </BarChart>
            }
          </ResponsiveContainer>
        </ChartCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Humidity vs Rainfall scatter */}
          <ChartCard title="Humidity vs Rainfall" sub="humidity vs RAINFALL" icon={Droplets}>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{top:5,right:5,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="rainfall" name="Rainfall" unit=" mm" tick={{fontSize:10,fill:'#64748b'}} type="number"/>
                <YAxis dataKey="humidity" name="Humidity" unit="%" tick={{fontSize:10,fill:'#64748b'}}/>
                <Tooltip cursor={{strokeDasharray:'3 3'}} content={<CT/>}/>
                <Scatter name="Obs" data={scatterData}>
                  {scatterData.map((d,i)=><Cell key={i} fill={d.cloudburst===1?'#ef4444':'#347ef8'} fillOpacity={0.6}/>)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}/> cloudburst=1</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#347ef8', display: 'inline-block' }}/> other</span>
            </div>
          </ChartCard>

          {/* Risk score timeline */}
          <ChartCard title="Estimated Risk Score" sub="derived from all features" icon={BarChart2}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={riskTimeline} margin={{top:5,right:5,bottom:5,left:0}}>
                <defs><linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={xTickFmt}/><YAxis tick={{fontSize:10,fill:'#64748b'}} domain={[0,100]} unit="%" width={40}/>
                <Tooltip content={<CT/>}/>
                <ReferenceLine y={65} stroke="#ef4444" strokeDasharray="4 4" label={{value:'High',fill:'#ef4444',fontSize:10}}/>
                <ReferenceLine y={35} stroke="#f59e0b" strokeDasharray="4 4" label={{value:'Mod',fill:'#f59e0b',fontSize:10}}/>
                <Area type="monotone" dataKey="riskScore" name="Risk %" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Temperature + Wind (ERA5 derived) */}
        <ChartCard title={isERA5 ? 'Temperature (t2m, K→°C) & Wind Speed (u10+v10, m/s→km/h)' : 'Temperature & Wind Speed'} sub={isERA5 ? 'ERA5 converted values' : ''} icon={Wind}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={tempWind} margin={{top:5,right:30,bottom:5,left:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="time" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={xTickFmt}/>
              <YAxis yAxisId="left" tick={{fontSize:10,fill:'#64748b'}} unit="°C" width={45}/>
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:'#64748b'}} unit="km/h" width={55}/>
              <Tooltip content={<CT/>}/><Legend/>
              <Line yAxisId="left"  type="monotone" dataKey="temp" name="Temp (°C)"      stroke="#fbbf24" strokeWidth={1.5} dot={false}/>
              <Line yAxisId="right" type="monotone" dataKey="wind" name="Wind (km/h)"    stroke="#a78bfa" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Humidity trend */}
        <ChartCard title="Humidity Over Time" sub="humidity column (%)" icon={Thermometer}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={ts} margin={{top:5,right:5,bottom:5,left:0}}>
              <defs><linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={xTickFmt}/><YAxis tick={{fontSize:10,fill:'#64748b'}} unit="%" width={40} domain={[0,105]}/>
              <Tooltip content={<CT/>}/><ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 4" label={{value:'High',fill:'#f59e0b',fontSize:10}}/>
              <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#34d399" fill="url(#humGrad)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
