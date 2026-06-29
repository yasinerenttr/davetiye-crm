import React, { forwardRef } from 'react'
import { formatDateTR } from '../utils/formatters'
import { LOGO_BASE64 } from '../logoBase64'
import { loadClauses } from './ContractClauses'

export const PdfTemplate = forwardRef(({ customer, settings, fields }, ref) => {
  if (!customer) return null

  const getVal = (id) => {
    const val = customer.values?.[id]
    const field = fields?.find(f => f.id === id)
    if (!val) {
      return field?.type === 'date' ? '.... / .... / 202..' : '-'
    }
    if (field?.type === 'date') return formatDateTR(val)
    return val
  }

  const product = parseFloat(customer.values?.product_price) || 0
  const deposit = parseFloat(customer.values?.deposit) || 0
  const extra = parseFloat(customer.values?.extra_fee) || 0
  const total = product + deposit + extra
  
  const fmtNum = (n) => (n||0).toLocaleString('tr-TR')
  const clauses = loadClauses()

  return (
    <div 
      style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}
    >
      <div 
        ref={ref}
        style={{
          width: '794px', /* A4 width in pixels at 96 DPI */
          minHeight: '1123px', /* Sabit A4 yüksekliği yerine minHeight - taşmaları engeller ve içeriğe göre uzar */
          background: '#ffffff', /* Acik/Beyaz arkaplan */
          color: '#333333',
          fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          padding: '50px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible'
        }}
      >
        {/* Cerceve (Siyah) */}
        <div style={{ position:'absolute', top: 15, left: 15, right: 15, bottom: 15, border: '1px solid #111111', pointerEvents: 'none' }} />
        <div style={{ position:'absolute', top: 20, left: 20, right: 20, bottom: 20, border: '2px solid #111111', opacity: 0.8, pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ borderBottom: '2px solid #111111', paddingBottom: '30px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <img src={LOGO_BASE64} alt="SZ Haute Couture" style={{ maxHeight: '110px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'grayscale(100%) brightness(0)' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#111111', fontSize: '18px', fontWeight: 800, marginBottom: '6px', letterSpacing: '2px', textTransform: 'uppercase' }}>SATIŞ SÖZLEŞMESİ</div>
            <div style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>Tarih: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}</div>
          </div>
        </div>

        {/* Icerik Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          
          {/* Sol Kolon - Musteri ve Teklif Bilgileri */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Musteri */}
            <div>
              <h2 style={{ color: '#111111', fontSize: '16px', borderBottom: '1px solid #dddddd', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
                MÜŞTERİ BİLGİLERİ
              </h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>Ad Soyad:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('full_name')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>Telefon:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('phone')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>TC No:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('tc_no')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>Adres:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{getVal('address')}</span>
                </div>
              </div>
            </div>

            {/* Teklif Detaylari */}
            <div>
              <h2 style={{ color: '#111111', fontSize: '16px', borderBottom: '1px solid #dddddd', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '1px' }}>
                KAYIT DETAYLARI
              </h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>İşlem Tipi:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('service_type')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>Teslim Tarihi:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('delivery_date')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>Geri Dönüş:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('return_date')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>1. Prova:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('fitting_1')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>2. Prova:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('fitting_2')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555555', fontSize: '14px' }}>3. Prova:</span>
                  <span style={{ color: '#111111', fontSize: '14px', fontWeight: 600 }}>{getVal('fitting_3')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sag Kolon - Fiyatlandirma */}
          <div>
            <div style={{ background: '#f8f8f8', border: '1px solid #dddddd', borderRadius: '8px', padding: '24px' }}>
              <h2 style={{ color: '#111111', fontSize: '16px', marginBottom: '20px', letterSpacing: '1px' }}>
                FİYATLANDIRMA
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555', fontSize: '15px' }}>Ürün Fiyatı:</span>
                  <span style={{ color: '#111111', fontSize: '16px', fontWeight: 600 }}>{fmtNum(product)} TL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555', fontSize: '15px' }}>Hizmet Bedeli:</span>
                  <span style={{ color: '#111111', fontSize: '16px', fontWeight: 600 }}>{fmtNum(deposit)} TL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#555555', fontSize: '15px' }}>Ekstra Ücret:</span>
                  <span style={{ color: '#111111', fontSize: '16px', fontWeight: 600 }}>{fmtNum(extra)} TL</span>
                </div>
                
                <div style={{ borderTop: '1px solid #cccccc', margin: '10px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#111111', fontSize: '18px', fontWeight: 700 }}>TOPLAM:</span>
                  <span style={{ color: '#111111', fontSize: '22px', fontWeight: 800 }}>{fmtNum(total)} TL</span>
                </div>
              </div>
            </div>
            
            {/* Durum block removed */}

          </div>
        </div>

        {/* Notlar */}
        {(customer.values?.notes || customer.footnote) && (
          <div style={{ marginTop: '30px', background: '#f9f9f9', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #111111' }}>
            <h3 style={{ color: '#111111', fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Notlar / Dipnot</h3>
            <p style={{ color: '#111111', fontSize: '12px', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
              {customer.footnote || customer.values?.notes}
            </p>
          </div>
        )}

        {/* Sözleşme Maddeleri */}
        {clauses && clauses.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#111111', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #111111', paddingBottom: '4px', fontWeight: 800 }}>Sözleşme Maddeleri</h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '16px', 
              color: '#111111', 
              fontSize: `${Math.max(7, 11 - Math.max(0, clauses.length - 8) * 0.4)}px`, 
              lineHeight: Math.max(1.1, 1.4 - Math.max(0, clauses.length - 8) * 0.05), 
              fontWeight: 500 
            }}>
              {clauses.map((clause, idx) => (
                <li key={idx} style={{ marginBottom: `${Math.max(1, 3 - Math.max(0, clauses.length - 8) * 0.3)}px` }}>{clause}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Spacer for pushing footer to bottom */}
        <div style={{ flex: 1, minHeight: '40px' }}></div>

        {/* Imzalar */}
        <div style={{ marginTop: '30px', marginBottom: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
          <div style={{ width: '200px', textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #111111', height: '40px', marginBottom: '10px' }}></div>
            <span style={{ color: '#111111', fontSize: '12px', fontWeight: 600 }}>Müşteri İmzası</span>
          </div>
          <div style={{ width: '200px', textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #111111', height: '40px', marginBottom: '10px' }}></div>
            <span style={{ color: '#111111', fontSize: '12px', fontWeight: 600 }}>Yetkili İmzası</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', borderTop: '2px solid #111111', paddingTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ color: '#111111', fontSize: '11px', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ color: '#111111', fontWeight: 800, letterSpacing: '0.5px', display: 'flex', gap: '12px' }}>
              {settings.instagram && <span>INSTAGRAM: @{settings.instagram.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\//g, '')}</span>}
              {settings.tiktok && <span>TIKTOK: @{settings.tiktok.replace(/https?:\/\/(www\.)?tiktok\.com\/@?/, '').replace(/\//g, '')}</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {settings.phone && <span>Tel: {settings.phone}</span>}
              {settings.whatsapp && <span>WhatsApp: {settings.whatsapp}</span>}
            </div>
            {settings.email && <div>E-posta: {settings.email}</div>}
            {settings.address && <div style={{ maxWidth: '400px', lineHeight: '1.4' }}>Adres: {settings.address}</div>}
          </div>
          <div style={{ color: '#111111', fontSize: '12px', textAlign: 'right', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {settings.companyName || 'SZ HAUTE COUTURE'}
          </div>
        </div>

      </div>
    </div>
  )
})

PdfTemplate.displayName = 'PdfTemplate'
