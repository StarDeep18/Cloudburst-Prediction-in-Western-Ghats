import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import OverviewPanel from './components/OverviewPanel';
import UploadPanel from './components/UploadPanel';
import PredictionPanel from './components/PredictionPanel';
import VisualizationPanel from './components/VisualizationPanel';
import RiskMap from './components/RiskMap';

let toastCounter = 0;

export default function App() {
  const [page, setPage]     = useState('dashboard');
  const [rawData, setRaw]   = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleData = useCallback((data) => {
    setRaw(data);
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <OverviewPanel rawData={rawData} onNavigate={setPage} />;
      case 'upload':     return <UploadPanel onData={handleData} addToast={addToast} />;
      case 'predict':    return <PredictionPanel rawData={rawData} />;
      case 'visualize':  return <VisualizationPanel rawData={rawData} />;
      case 'map':        return <RiskMap rawData={rawData} />;
      default:           return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#060d1a', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar active={page} onChange={setPage} hasData={!!rawData} />

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Top bar */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'rgba(6,13,26,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #172543', padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748b' }}>
            <span style={{ textTransform: 'capitalize' }}>{page === 'dashboard' ? 'Overview' : page}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {rawData && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'monospace', backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', padding: '3px 10px', borderRadius: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                {rawData.length.toLocaleString()} rows loaded
              </span>
            )}
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569' }}>Western Ghats Predictor</span>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: '32px' }}>
          {renderPage()}
        </div>
      </main>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
