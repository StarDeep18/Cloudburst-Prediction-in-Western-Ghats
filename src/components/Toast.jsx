import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ toasts, remove }) {
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} remove={remove} />)}
    </div>
  );
}

function ToastItem({ toast, remove }) {
  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, remove]);

  const isError = toast.type === 'error';
  return (
    <div className="animate-slide-up" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 280, maxWidth: 380, backgroundColor: '#111e36', border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(52,126,248,0.3)'}`, borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      {isError ? <XCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle size={18} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />}
      <p style={{ fontSize: 13, color: '#e2e8f0', flex: 1, margin: 0 }}>{toast.message}</p>
      <button onClick={() => remove(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, marginLeft: 4 }} onMouseEnter={e => e.currentTarget.style.color='#fff'} onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
        <X size={14} />
      </button>
    </div>
  );
}
