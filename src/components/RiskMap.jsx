import React, { useMemo } from 'react';
import { MapPin, Info } from 'lucide-react';

const LAT_MIN=8, LAT_MAX=21, LON_MIN=73, LON_MAX=78, W=420, H=520;
function toXY(lat,lon){const x=((lon-LON_MIN)/(LON_MAX-LON_MIN))*W;const y=H-((lat-LAT_MIN)/(LAT_MAX-LAT_MIN))*H;return[+x.toFixed(1),+y.toFixed(1)];}

const GHATS_OUTLINE=[[8.1,77.5],[8.5,77.3],[9.0,77.1],[9.5,76.9],[10.0,76.7],[10.5,76.5],[11.0,76.4],[11.5,76.3],[12.0,75.9],[12.5,75.5],[13.0,75.2],[13.5,74.9],[14.0,74.6],[14.5,74.3],[15.0,74.1],[15.5,74.0],[16.0,73.9],[16.5,73.8],[17.0,73.9],[17.5,73.9],[18.0,73.8],[18.5,73.8],[19.0,73.7],[19.5,73.6],[20.0,73.5],[20.5,73.5],[20.5,75.5],[20.0,76.0],[19.5,76.5],[19.0,77.0],[18.0,77.5],[17.0,77.8],[16.0,77.5],[15.0,77.0],[14.0,76.5],[13.0,76.8],[12.0,77.0],[11.0,77.4],[10.0,77.6],[9.0,77.8],[8.5,77.9],[8.1,77.5]].map(([la,lo])=>toXY(la,lo).join(',')).join(' ');
const STATIONS=[{lat:10.8,lon:76.0,label:'Palakkad'},{lat:12.4,lon:75.7,label:'Coorg'},{lat:17.9,lon:73.6,label:'Mahabaleshwar'},{lat:11.4,lon:76.7,label:'Ooty'},{lat:13.5,lon:75.1,label:'Agumbe'},{lat:10.1,lon:77.1,label:'Munnar'}];
const RISK_ZONES=[{lat:10.5,lon:76.3,radius:30,level:'high',rainfall:180},{lat:12.4,lon:75.5,radius:25,level:'high',rainfall:162},{lat:13.5,lon:75.0,radius:22,level:'moderate',rainfall:110},{lat:15.1,lon:74.0,radius:20,level:'moderate',rainfall:95},{lat:17.9,lon:73.7,radius:18,level:'low',rainfall:60},{lat:11.3,lon:76.8,radius:20,level:'high',rainfall:155},{lat:9.5,lon:77.0,radius:15,level:'moderate',rainfall:105}];
const LEVEL_COLOR={high:{fill:'rgba(239,68,68,0.35)',stroke:'#ef4444'},moderate:{fill:'rgba(245,158,11,0.3)',stroke:'#f59e0b'},low:{fill:'rgba(16,185,129,0.25)',stroke:'#10b981'}};

export default function RiskMap({ rawData }) {
  const dataPoints = useMemo(() => {
    if (!rawData?.length) return [];
    return rawData.filter(r=>r.LATITUDE&&r.LONGITUDE).slice(0,200).map(r=>{
      const lat=parseFloat(r.LATITUDE??r.latitude),lon=parseFloat(r.LONGITUDE??r.longitude),rain=parseFloat(r.RAINFALL??r.rainfall??0);
      if(isNaN(lat)||isNaN(lon))return null;
      const level=rain>150?'high':rain>80?'moderate':'low';
      const [x,y]=toXY(lat,lon);
      return{x,y,lat,lon,rain,level};
    }).filter(Boolean);
  },[rawData]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Risk Map</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Rainfall intensity and cloudburst risk across the Western Ghats region.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        <div className="card-glow" style={{ padding: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} color="#59a3fc" />
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff', margin: 0 }}>Western Ghats Region</p>
            </div>
            {dataPoints.length > 0 && <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#59a3fc' }}>{dataPoints.length} data pts</span>}
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#060d1a', border: '1px solid #172543' }}>
            <svg viewBox={`-20 -20 ${W+40} ${H+40}`} style={{ width: '100%', height: 'auto', maxHeight: 480, display: 'block' }}>
              <rect x="-20" y="-20" width={W+40} height={H+40} fill="#060d1a"/>
              {[8,10,12,14,16,18,20].map(lat=>{const[,y]=toXY(lat,LON_MIN);return<line key={lat} x1={-10} x2={W+10} y1={y} y2={y} stroke="#172543" strokeWidth={0.5}/>;})}
              {[73,74,75,76,77,78].map(lon=>{const[x]=toXY(LAT_MIN,lon);return<line key={lon} x1={x} x2={x} y1={-10} y2={H+10} stroke="#172543" strokeWidth={0.5}/>;})}
              <polygon points={GHATS_OUTLINE} fill="#0b1628" stroke="#1e2f52" strokeWidth={1.5}/>
              {dataPoints.length===0&&RISK_ZONES.map((z,i)=>{const[x,y]=toXY(z.lat,z.lon);const c=LEVEL_COLOR[z.level];return(<g key={i}><circle cx={x} cy={y} r={z.radius} fill={c.fill} stroke={c.stroke} strokeWidth={1}/><text x={x} y={y+4} textAnchor="middle" fontSize={9} fill={c.stroke} fontFamily="monospace">{z.rainfall}mm</text></g>);})}
              {dataPoints.map((p,i)=>{const c=LEVEL_COLOR[p.level];return(<circle key={i} cx={p.x} cy={p.y} r={4} fill={c.fill} stroke={c.stroke} strokeWidth={1}><title>{`Lat:${p.lat.toFixed(2)}, Lon:${p.lon.toFixed(2)} — ${p.rain.toFixed(1)}mm`}</title></circle>);})}
              {STATIONS.map((s,i)=>{const[x,y]=toXY(s.lat,s.lon);return(<g key={i}><circle cx={x} cy={y} r={3} fill="#347ef8" stroke="#1e3a8a" strokeWidth={1}/><text x={x+5} y={y+4} fontSize={8} fill="#64748b" fontFamily="DM Sans">{s.label}</text></g>);})}
              <text x={W-15} y={25} fontSize={11} fill="#64748b" textAnchor="middle" fontFamily="DM Sans">N</text>
              <line x1={W-15} y1={28} x2={W-15} y2={42} stroke="#64748b" strokeWidth={1}/>
              <polygon points={`${W-15},28 ${W-18},38 ${W-15},35 ${W-12},38`} fill="#64748b"/>
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-glow" style={{ padding: 16 }}>
            <p className="label" style={{ marginBottom: 12 }}>Risk Levels</p>
            {['high','moderate','low'].map(level=>(
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${LEVEL_COLOR[level].stroke}`, backgroundColor: LEVEL_COLOR[level].fill, flexShrink: 0 }}/>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px', textTransform: 'capitalize' }}>{level}</p>
                  <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{level==='high'?'>150 mm':level==='moderate'?'80–150 mm':'<80 mm'}</p>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid #172543' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#347ef8', border: '2px solid #1e3a8a', flexShrink: 0 }}/>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>Weather Station</p>
                <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>Monitoring point</p>
              </div>
            </div>
          </div>

          <div className="card-glow" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={13} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="label" style={{ marginBottom: 6 }}>Map Notes</p>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  {dataPoints.length>0 ? `Plotting ${dataPoints.length} coordinates from your dataset. Color = rainfall intensity.` : 'Showing default risk zones for key sub-regions. Upload a CSV with LATITUDE/LONGITUDE to plot your actual data.'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-glow" style={{ padding: 16 }}>
            <p className="label" style={{ marginBottom: 8 }}>High-Risk Sub-Regions</p>
            {['Coorg / Kodagu','Palakkad Gap','Agumbe (Karnataka)','Silent Valley','Munnar Hills'].map(r=>(
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 }}/>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
