import React, { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, Table, ChevronDown, ChevronUp } from 'lucide-react';

const EXPECTED_COLS = ['TIME','LATITUDE','LONGITUDE','RAINFALL','humidity','temperature','wind_speed','pressure'];

export default function UploadPanel({ onData, addToast }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { addToast('Please upload a valid .csv file.', 'error'); return; }
    setLoading(true);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        setLoading(false);
        if (!result.data || result.data.length === 0) { addToast('CSV appears to be empty.', 'error'); return; }
        const cols = Object.keys(result.data[0]);
        const missing = EXPECTED_COLS.filter(c => !cols.some(k => k.toLowerCase() === c.toLowerCase()));
        const info = { rows: result.data.length, columns: cols, preview: result.data.slice(0, 10), all: result.data, fileName: file.name, missing };
        setParsed(info);
        onData(result.data);
        if (missing.length > 0) addToast(`Uploaded with ${missing.length} missing column(s): ${missing.join(', ')}`, 'error');
        else addToast(`✓ Dataset loaded — ${result.data.length.toLocaleString()} rows`, 'success');
      },
      error: (err) => { setLoading(false); addToast('Failed to parse CSV: ' + err.message, 'error'); }
    });
  }, [onData, addToast]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }, [processFile]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Dataset Upload</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Upload a CSV with cloudburst observation data for analysis and prediction.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? '#347ef8' : '#1e2f52'}`, borderRadius: 16, padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer', backgroundColor: dragging ? 'rgba(52,126,248,0.06)' : '#0b1628', transition: 'all 0.2s', marginBottom: 24 }}
        onMouseEnter={e => { if (!dragging) e.currentTarget.style.borderColor = '#347ef8'; }}
        onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = '#1e2f52'; }}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #1e2f52', borderTopColor: '#347ef8' }} className="animate-spin" />
            <p style={{ color: '#64748b', fontSize: 14 }}>Parsing dataset…</p>
          </div>
        ) : (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: dragging ? 'rgba(52,126,248,0.15)' : '#111e36', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} color={dragging ? '#59a3fc' : '#475569'} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>{dragging ? 'Drop to upload' : 'Drag & drop your CSV here'}</p>
              <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>or click to browse files</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {EXPECTED_COLS.map(c => (
                <span key={c} style={{ fontSize: 11, fontFamily: 'monospace', backgroundColor: '#111e36', color: '#64748b', padding: '3px 8px', borderRadius: 6, border: '1px solid #1e2f52' }}>{c}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {parsed && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Rows', value: parsed.rows.toLocaleString() },
              { label: 'Columns', value: parsed.columns.length },
              { label: 'File', value: parsed.fileName, small: true },
              { label: 'Status', value: parsed.missing.length === 0 ? 'Valid' : 'Partial', color: parsed.missing.length === 0 ? '#34d399' : '#fbbf24' },
            ].map(s => (
              <div key={s.label} className="card-glow" style={{ padding: 16 }}>
                <p className="label" style={{ marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: s.small ? 13 : 20, color: s.color || '#fff', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Column coverage */}
          <div className="card-glow" style={{ padding: 16 }}>
            <p className="label" style={{ marginBottom: 12 }}>Column Coverage</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXPECTED_COLS.map(c => {
                const found = parsed.columns.some(k => k.toLowerCase() === c.toLowerCase());
                return (
                  <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'monospace', padding: '6px 10px', borderRadius: 8, border: `1px solid ${found ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, backgroundColor: found ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', color: found ? '#34d399' : '#f87171' }}>
                    {found ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                    {c}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          <div className="card-glow" style={{ overflow: 'hidden' }}>
            <button onClick={() => setShowPreview(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: showPreview ? '1px solid #172543' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Table size={14} color="#475569" />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff' }}>Data Preview</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>(first 10 rows)</span>
              </div>
              {showPreview ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
            </button>
            {showPreview && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 11, fontFamily: 'monospace', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(17,30,54,0.8)' }}>
                      {parsed.columns.map(c => (
                        <th key={c} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', borderRight: '1px solid #172543' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #172543', backgroundColor: i % 2 === 0 ? '#0b1628' : 'rgba(17,30,54,0.4)' }}>
                        {parsed.columns.map(c => (
                          <td key={c} style={{ padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', borderRight: '1px solid rgba(23,37,67,0.5)' }}>{row[c] ?? '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
