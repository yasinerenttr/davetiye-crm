import React, { useEffect, useState } from 'react';

export default function WhatsAppConnection() {
  const [status, setStatus] = useState('LOADING');
  const [qr, setQr] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('https://davetiye-crm.onrender.com/api/whatsapp/status');
      const data = await res.json();
      setStatus(data.status);
      
      if (data.status === 'QR_READY') {
        const qrRes = await fetch('https://davetiye-crm.onrender.com/api/whatsapp/qr');
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQr(qrData.qr);
        }
      } else {
        setQr(null);
      }
    } catch (err) {
      console.error(err);
      setStatus('OFFLINE');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('WhatsApp oturumunu kapatmak istediğinize emin misiniz? Sistemin yeniden başlatılıp yeni QR kod üretmesi birkaç saniye sürebilir.')) return;
    
    setIsLoggingOut(true);
    setStatus('INITIALIZING'); // Optimistic UI update
    
    try {
      await fetch('https://davetiye-crm.onrender.com/api/whatsapp/logout', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error(err);
      alert('Oturum kapatılırken hata oluştu.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', padding: 24, borderRadius: 16, marginTop: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 0C5.41 0 .03 5.38.03 12c0 2.12.56 4.2 1.62 6.03L0 24l6.14-1.61A11.94 11.94 0 0012.04 24h.01c6.63 0 12.01-5.38 12.01-12 0-3.2-1.25-6.2-3.54-8.52zM12.05 21.8a9.8 9.8 0 01-4.99-1.37l-.36-.21-3.64.95.97-3.54-.24-.36a9.8 9.8 0 1117.98-5.26c0 5.4-4.39 9.79-9.8 9.79z"/></svg>
        </div>
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>WhatsApp Sunucu Bağlantısı</h3>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 12, height: 12, borderRadius: '50%', 
            background: status === 'READY' || status === 'AUTHENTICATED' ? '#25D366' : status === 'OFFLINE' ? '#ff4d4f' : '#faad14',
            boxShadow: `0 0 8px ${status === 'READY' || status === 'AUTHENTICATED' ? '#25D366' : status === 'OFFLINE' ? '#ff4d4f' : '#faad14'}`
          }}></div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Bağlantı Durumu</div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {status === 'READY' ? 'Bağlı ve Hazır' : 
               status === 'AUTHENTICATED' ? 'Kimlik Doğrulandı...' : 
               status === 'QR_READY' ? 'QR Kod Okutulması Bekleniyor' : 
               status === 'INITIALIZING' ? 'Sunucu Başlatılıyor...' : 
               status === 'OFFLINE' ? 'Sunucu Çevrimdışı' : status}
            </strong>
          </div>
        </div>
        
        {(status === 'READY' || status === 'AUTHENTICATED' || isLoggingOut) && (
          <button 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            style={{ 
              padding: '8px 16px', background: 'rgba(255, 77, 79, 0.08)', color: '#ff4d4f', border: '1px solid rgba(255, 77, 79, 0.25)', 
              borderRadius: '8px', cursor: isLoggingOut ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600,
              transition: 'all 0.2s ease', opacity: isLoggingOut ? 0.6 : 1
            }}
            onMouseOver={(e) => { if(!isLoggingOut) { e.currentTarget.style.background = '#ff4d4f'; e.currentTarget.style.color = '#fff'; } }}
            onMouseOut={(e) => { if(!isLoggingOut) { e.currentTarget.style.background = 'rgba(255, 77, 79, 0.08)'; e.currentTarget.style.color = '#ff4d4f'; } }}
          >
            {isLoggingOut ? 'Oturum Kapatılıyor...' : 'Oturumu Kapat'}
          </button>
        )}
      </div>

      {status === 'OFFLINE' && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255, 77, 79, 0.05)', borderLeft: '3px solid #ff4d4f', borderRadius: '0 8px 8px 0' }}>
          <p style={{ fontSize: '0.85rem', color: '#ff4d4f', margin: 0, fontWeight: 500 }}>
            Node.js backend sunucusuna ulaşılamıyor. Lütfen terminalden sunucuyu çalıştırdığınızdan emin olun.
          </p>
        </div>
      )}

      {status === 'QR_READY' && qr && (
        <div style={{ marginTop: 24, textAlign: 'center', background: 'var(--bg-input)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--border-medium)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 16, fontWeight: 500 }}>
            Aşağıdaki QR kodu WhatsApp uygulamanızdan <strong style={{color: '#25D366'}}>Bağlı Cihazlar</strong> menüsüne girerek okutun:
          </p>
          <img src={qr} alt="WhatsApp QR Code" style={{ width: 260, height: 260, border: '6px solid #ffffff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
        </div>
      )}
    </div>
  );
}
