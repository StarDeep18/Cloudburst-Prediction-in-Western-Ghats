import React from 'react';
import { LayoutDashboard, Upload, BarChart2, CloudLightning, Map, ChevronRight } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Overview',   icon: LayoutDashboard },
  { id: 'upload',    label: 'Dataset',    icon: Upload },
  { id: 'predict',   label: 'Prediction', icon: CloudLightning },
  { id: 'visualize', label: 'Charts',     icon: BarChart2 },
  { id: 'map',       label: 'Risk Map',   icon: Map },
];

export default function Sidebar({ active, onChange, hasData }) {
  return (
    <aside style={{
      width: 224, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      backgroundColor: '#0b1628', borderRight: '1px solid #172543',
      display: 'flex', flexDirection: 'column', overflowY: 'auto'
    }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #172543' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#1d5eed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(29,94,237,0.4)' }}>⛈</div>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2, margin: 0 }}>Cloudburst</p>
            <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.2, margin: 0 }}>Western Ghats · MVP</p>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p className="label" style={{ padding: '0 8px', marginBottom: 12 }}>Navigation</p>
        {navItems.map(({ id, label, icon: Icon }) => {
          const locked = (id === 'predict' || id === 'visualize' || id === 'map') && !hasData;
          const isActive = active === id;
          return (
            <button key={id} onClick={() => !locked && onChange(id)} disabled={locked}
              title={locked ? 'Upload a dataset first' : undefined}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', cursor: locked ? 'not-allowed' : 'pointer', backgroundColor: isActive ? 'rgba(29,94,237,0.15)' : 'transparent', color: isActive ? '#59a3fc' : locked ? '#334155' : '#94a3b8', fontSize: 14, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', textAlign: 'left', fontWeight: isActive ? 600 : 400 }}
              onMouseEnter={e => { if (!locked && !isActive) { e.currentTarget.style.backgroundColor = '#111e36'; e.currentTarget.style.color = '#e2e8f0'; } }}
              onMouseLeave={e => { if (!locked && !isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={13} color="#347ef8" />}
              {locked && <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>locked</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #172543' }}>
        <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#334155', margin: 0 }}>v1.0 · MVP Prototype</p>
        <p style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>Kerala / Karnataka Region</p>
      </div>
    </aside>
  );
}
