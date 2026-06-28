import { useState } from 'react'
import { MessageCircle, MapPin, Phone, Mail } from 'lucide-react'

function ContactSection({ settings, t, onSystemSend }) {
  const [contact, setContact] = useState({ name: '', phone: '', email: '', message: '' })

  const onChange = (field) => (e) => setContact((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSystemSend = (e) => {
    e.preventDefault()
    if (onSystemSend) {
      onSystemSend(contact)
      setContact({ name: '', phone: '', email: '', message: '' })
    }
  }

  const handleMailSend = (e) => {
    e.preventDefault()
    const text = `*Yeni İletişim Formu Mesajı*\n\n👤 *İsim:* ${contact.name}\n📞 *Telefon:* ${contact.phone}\n📧 *Mail:* ${contact.email || '-'}\n💬 *Mesaj:* ${contact.message}`
    const subject = encodeURIComponent('Yeni İletişim Formu Mesajı')
    const body = encodeURIComponent(text)
    const targetEmail = String(settings.email || '').trim()

    if (!targetEmail) {
      alert('Firma e-posta adresi ayarlardan tanımlanmamış.')
      return
    }

    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_self')
    setContact({ name: '', phone: '', email: '', message: '' })
  }

  return (
    <section className="card contact-card">
      <div className="contact-meta">
        <h2>{t.contact}</h2>
        <p className="muted">{t.contactSubtitle}</p>
        <p><Phone size={16} /> {settings.phone}</p>
        <p><MapPin size={16} /> {settings.address}</p>
        {(() => {
          let mapUrl = settings.mapsLink || settings.address || '';
          if (mapUrl && !mapUrl.startsWith('http://') && !mapUrl.startsWith('https://')) {
            mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapUrl)}`;
          }
          return mapUrl ? (
            <a className="btn" href={mapUrl} target="_blank" rel="noreferrer">{t.openLocation}</a>
          ) : null;
        })()}
      </div>

      <form className="contact-form">
        <label>
          {t.name}
          <input value={contact.name} onChange={onChange('name')} placeholder={t.name} required />
        </label>
        <label>
          {t.phone}
          <input value={contact.phone} onChange={onChange('phone')} placeholder={t.phone} required />
        </label>
        <label className="full-width">
          {t.email} (Opsiyonel)
          <input type="email" value={contact.email} onChange={onChange('email')} placeholder="mail@example.com" />
        </label>
        <label className="full-width">
          {t.message}
          <textarea value={contact.message} onChange={onChange('message')} placeholder={t.message} rows={4} required />
        </label>
        
        <div className="full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={(e) => {
              if (!contact.name || !contact.phone || !contact.message) {
                alert('Lütfen isim, telefon ve mesaj alanlarını doldurun.');
                return;
              }
              handleSystemSend(e);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          >
            <MessageCircle size={18} /> Mesaj Gönder
          </button>
          <button 
            type="button"
            className="btn" 
            onClick={(e) => {
              if (!contact.name || !contact.phone || !contact.message) {
                alert('Lütfen isim, telefon ve mesaj alanlarını doldurun.');
                return;
              }
              handleMailSend(e);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#1e293b', borderColor: '#cbd5e1' }}
          >
            <Mail size={18} /> Mail Gönder
          </button>
        </div>
      </form>
    </section>
  )
}

export default ContactSection
