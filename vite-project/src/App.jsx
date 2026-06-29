import { useEffect, useMemo, useState, useRef } from 'react'
import {
  CalendarDays, CheckCircle2, Download, FileText,
  Globe, Inbox, Mail, MessageCircle, Search, Send, UserRound, UsersRound, Link, FileSpreadsheet
} from 'lucide-react'
import './App.css'
import { ADMIN_CREDENTIALS, DEFAULT_COMPANY_SETTINGS, DEFAULT_FORM_FIELDS } from './constants'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import CustomerForm from './components/CustomerForm'
import StatusBadge from './components/StatusBadge'
import ContactSection from './components/ContactSection'
import SocialLinks from './components/SocialLinks'
import ContractClauses, { loadClauses, saveClauses } from './components/ContractClauses'
import { clearSession, loadCompanySettings, loadCustomers, loadSession, saveCompanySettings, saveCustomers, saveSession, loadMessages, saveMessages } from './utils/storage'
import { exportContractPdfBlob, exportExcel, exportPdf, generatePdfFromHtml } from './utils/exporters'
import { fetchSocialLinks, updateSocialLinks, getSupabaseClient } from './utils/supabase'
import { normalizeNumericInput } from './utils/formatters'
import { localizeField } from './utils/i18nFields'
import { PdfTemplate } from './components/PdfTemplate'



/* ── Sabitler ─────────────────────────────────────── */
const ADMIN_PATH = '/turgut'
const STORAGE_KEY = 'gelinlik_musterileri_v3'   // tek anahtar — hem form hem admin kullanır
const STATUSES = ['Bekliyor', 'Onaylandi', 'Gonderildi', 'Tamamlandi']
const STATUS_LABELS = { Bekliyor: 'Bekliyor', Onaylandi: 'Onaylandı', Gonderildi: 'Gönderildi', Tamamlandi: 'Tamamlandı' }
const ADMIN_TABS = [
  { id: 'pending', label: 'Bekleyen Talepler' },
  { id: 'drafts',  label: 'Onaylananlar' },
  { id: 'sent',    label: 'Gönderilenler' },
  { id: 'all',     label: '📁 Arşiv' },
]
const ADMIN_ONLY = new Set([
  'product_price','deposit','extra_fee',
  'service_type','delivery_date','return_date',
  'fitting_1','fitting_2','fitting_3',
])
const DICT = {
  tr: {
    companyName:'SZ HAUTE COUTURE', saasAdmin:'CRM Panel', dashboard:'Dashboard',
    records:'Teklif & Onay', settings:'Ayarlar', logout:'Çıkış Yap',
    adminLogin:'Admin Girişi', adminLoginSubtitle:'Paneli yönetmek için giriş yapın.',
    loginError:'Kullanıcı adı veya şifre hatalı.', username:'Kullanıcı Adı',
    password:'Şifre', login:'Giriş Yap',
    dynamicForm:'SATIŞ SÖZLEŞMESİ', dynamicSubtitle:'Talebiniz alınır, teklif satıcı tarafından hazırlanır.',
    totalRecords:'Toplam Talep', todayRecords:'Bugün Gelen', totalCustomers:'Toplam Müşteri',
    search:'Ad veya telefon ile ara...',
    submitLabel:'Talep Gönder',
    lang:'tr',
    contact:'İletişim', contactSubtitle:'Bize ulaşın.', openLocation:'Konumu Aç', name:'İsim', phone:'Telefon', email:'Mail', message:'Mesaj', send:'Gönder', sending:'Gönderiliyor...', messageSent:'Başarılı', messageError:'Hata'
  },
  en: {
    companyName:'SZ HAUTE COUTURE', saasAdmin:'CRM Panel', dashboard:'Dashboard',
    records:'Quote & Approve', settings:'Settings', logout:'Logout',
    adminLogin:'Admin Login', adminLoginSubtitle:'Login to manage the panel.',
    loginError:'Invalid username or password.', username:'Username',
    password:'Password', login:'Login',
    dynamicForm:'SALES CONTRACT', dynamicSubtitle:'Your request is received, a quote will be prepared.',
    totalRecords:'Total Requests', todayRecords:'Today', totalCustomers:'Total Customers',
    search:'Search by name or phone...',
    submitLabel:'Submit Request',
    lang:'en',
    contact:'Contact', contactSubtitle:'Reach out to us.', openLocation:'Open Location', name:'Name', phone:'Phone', email:'Email', message:'Message', send:'Send', sending:'Sending...', messageSent:'Success', messageError:'Error'
  }
}

/* ── Yardımcılar ──────────────────────────────────── */
const isToday = (d) => new Date(d).toDateString() === new Date().toDateString()

// localStorage'dan ham oku
function readRecords() {
  try { const p = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(p) ? p : [] }
  catch { return [] }
}

// localStorage'a yaz
function writeRecords(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// Yeni kayıt şablonu — sadece form verilerini alır
function makeRecord(formValues) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'Bekliyor',
    channel: '',
    footnote: '',
    values: { ...formValues },   // tüm form değerlerini kopyala
  }
}

function emptyForm(fields) {
  const v = {}
  fields.forEach(f => { v[f.id] = '' })
  return v
}

// Sosyal medya ikon butonu stili
const normalizeTurkishPhone = (rawPhone = '') => {
  let digits = String(rawPhone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.startsWith('90')) digits = digits.slice(2)
  if (digits.length !== 10) return ''
  return `+90${digits}`
}

/* ══════════════════════════════════════════════════ */
function App() {
  const isAdmin = window.location.pathname === ADMIN_PATH

  // ── State ───────────────────────────────────────────
  const [auth,       setAuth]       = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [activeTab,  setActiveTab]  = useState('pending')
  // Lazy init: localStorage'dan direkt oku — boş array yazılmaz
  const [customers,  setCustomers]  = useState(() => readRecords())
  const [messages,   setMessages]   = useState(() => loadMessages())
  const [formValues, setFormValues] = useState(emptyForm(DEFAULT_FORM_FIELDS))
  const [settings,   setSettings]   = useState(() => loadCompanySettings())
  const [search,     setSearch]     = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [toast,      setToast]      = useState('')
  const [waLoading,  setWaLoading]  = useState('') // '' = inactive, 'PDF hazırlanıyor...', 'WhatsApp açılıyor...' vb.

  const [lastSync,   setLastSync]   = useState(null)
  
  const [dbSocialLinks, setDbSocialLinks] = useState({ instagram_url: '', tiktok_url: '', facebook_url: '' })
  const [lang, setLang] = useState('tr')
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')

  const T = DICT[lang] || DICT.tr

  const pdfTemplateRef = useRef(null)

  /* Başlangıç yüklemesi — customers ve settings zaten lazy init ile geldi */
  useEffect(() => {
    setAuth(Boolean(loadSession()))
    let realtimeChannel = null

    // Farklı sekme/pencereden gelen değişiklikleri yakala
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setCustomers(readRecords())
        setLastSync(new Date())
      }
      if (e.key === STORAGE_KEYS.COMPANY_SETTINGS) {
        setSettings(loadCompanySettings())
      }
    }
    window.addEventListener('storage', handleStorage)

    // Supabase DB Social Links Fetch & Realtime
    const initDbLinks = async () => {
      const data = await fetchSocialLinks()
      if (data) {
        console.log('settings:', data)
        setDbSocialLinks(data)
        setSettings(prev => ({
          ...prev,
          instagram: data.instagram_url || prev.instagram || '',
          tiktok: data.tiktok_url || prev.tiktok || '',
          facebook: data.facebook_url || prev.facebook || '',
        }))
      }
      
      const supabase = getSupabaseClient()
      if (supabase) {
        realtimeChannel = supabase
          .channel('settings_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
            if (payload.new) {
              console.log('settings:', payload.new)
              setDbSocialLinks({
                instagram_url: payload.new.instagram_url || '',
                tiktok_url: payload.new.tiktok_url || '',
                facebook_url: payload.new.facebook_url || ''
              })
              setSettings(prev => ({
                ...prev,
                instagram: payload.new.instagram_url || '',
                tiktok: payload.new.tiktok_url || '',
                facebook: payload.new.facebook_url || '',
              }))
            }
          })
          .subscribe()
      }
    }
    initDbLinks()

    return () => {
      window.removeEventListener('storage', handleStorage)
      if (realtimeChannel) {
        const supabase = getSupabaseClient()
        supabase?.removeChannel(realtimeChannel)
      }
    }
  }, [])

  // --- MERKEZİ SUNUCU İLE VERİ SENKRONİZASYONU ---
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const res = await fetch('https://davetiye-crm.onrender.com/api/db', { credentials: 'omit' })
        if (!res.ok) return
        const db = await res.json()
        
        const localCustomers = readRecords()
        const localSettings = loadCompanySettings()
        const localClauses = loadClauses()
        const localMessages = loadMessages()

        // Eğer backend boşsa (Render restart atmışsa), PC'deki veriyi backend'e yükle
        if (Object.keys(db).length === 0) {
           if (localCustomers.length > 0 || localSettings.companyName !== 'SZ HAUTE COUTURE' || localMessages.length > 0) {
              await fetch('https://davetiye-crm.onrender.com/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customers: localCustomers, settings: localSettings, clauses: localClauses, messages: localMessages })
              }).catch(() => {})
           }
        } else {
           // Backend'de veri varsa, React State'e ve LocalStorage'a yaz
           if (db.customers && JSON.stringify(db.customers) !== JSON.stringify(localCustomers)) {
             setCustomers(db.customers)
             writeRecords(db.customers)
             setLastSync(new Date())
           }
           if (db.settings && JSON.stringify(db.settings) !== JSON.stringify(localSettings)) {
             setSettings(db.settings)
             saveCompanySettings(db.settings)
           }
           if (db.clauses && JSON.stringify(db.clauses) !== JSON.stringify(localClauses)) {
             saveClauses(db.clauses)
           }
           if (db.messages && JSON.stringify(db.messages) !== JSON.stringify(localMessages)) {
             setMessages(db.messages)
             saveMessages(db.messages)
           }
        }
      } catch (err) {
        // Yoksay
      }
    }
    
    // İlk açılışta ve her 3 saniyede bir senkronize et
    syncWithBackend()
    const timer = setInterval(syncWithBackend, 3000)
    return () => clearInterval(timer)
  }, [])

  /* customers her değişince localStorage'a ve Backend'e yaz */
  useEffect(() => {
    writeRecords(customers)
    if (customers.length > 0) {
      fetch('https://davetiye-crm.onrender.com/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers })
      }).catch(() => {})
    }
  }, [customers])

  /* messages her değişince localStorage'a ve Backend'e yaz */
  useEffect(() => {
    saveMessages(messages)
    if (messages.length > 0) {
      fetch('https://davetiye-crm.onrender.com/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      }).catch(() => {})
    }
  }, [messages])

  /* ayarlar her değişince localStorage'a ve Backend'e yaz */
  useEffect(() => {
    saveCompanySettings(settings)
    fetch('https://davetiye-crm.onrender.com/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    }).catch(() => {})
  }, [settings])



  /* Toast helper */
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  /* Hesaplananlar */
  const fields          = DEFAULT_FORM_FIELDS
  const localizedFields = useMemo(() => fields.map(f => localizeField(f, lang)), [lang])
  const selectedCustomer = customers.find(x => x.id === selectedId) || null
  const pendingCount    = customers.filter(c => c.status === 'Bekliyor').length

  const stats = useMemo(() => ({
    totalRecords:   customers.length,
    todayRecords:   customers.filter(c => isToday(c.createdAt)).length,
    totalCustomers: new Set(customers.map(c => `${c.values?.full_name||''}-${c.values?.phone||''}`)).size,
  }), [customers])

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = customers.filter(c => {
      if (activeTab === 'pending') return c.status === 'Bekliyor'
      if (activeTab === 'drafts')  return c.status === 'Onaylandi'
      if (activeTab === 'sent')    return c.status === 'Gonderildi' || c.status === 'Tamamlandi'
      if (activeTab === 'all')     return true  // Arşiv: hepsi görünür
      return true
    })
    if (!q) return list
    return list.filter(c =>
      String(c.values?.full_name||'').toLowerCase().includes(q) ||
      String(c.values?.phone||'').toLowerCase().includes(q)
    )
  }, [customers, search, activeTab])

  const tabCount = (id) => customers.filter(c => {
    if (id === 'pending') return c.status === 'Bekliyor'
    if (id === 'drafts')  return c.status === 'Onaylandi'
    if (id === 'sent')    return c.status === 'Gonderildi' || c.status === 'Tamamlandi'
    if (id === 'all')     return true
    return false
  }).length

  /* Login */
  const handleLogin = (u, p) => {
    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
      saveSession({ isAuthenticated: true, username: u, loggedInAt: new Date().toISOString() })
      setAuth(true)
      return true
    }
    return false
  }

  /* Müşteri formu gönder */
  const handleSubmit = () => {
    const nameOk  = String(formValues.full_name || '').trim()
    const phoneOk = String(formValues.phone     || '').trim()
    if (!nameOk || !phoneOk) { alert('Lütfen Ad Soyad ve Telefon alanlarını doldurun.'); return }

    const record = makeRecord(formValues)
    const freshCustomers = readRecords() // Taze datayı al (sekme çakışmasını önler)
    const updated = [record, ...freshCustomers]
    
    setCustomers(updated)
    writeRecords(updated)               // anında yaz
    setFormValues(emptyForm(fields))
    showToast('✅ Talebiniz alındı! En kısa sürede teklifiniz hazırlanacaktır.')
  }

  /* Admin patch */
  const patch = (id, diff) =>
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...diff, updatedAt: new Date().toISOString() } : c))

  const patchVal = (id, key, val) =>
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, values: { ...c.values, [key]: val }, updatedAt: new Date().toISOString() } : c))

  /* WhatsApp mesajı — Premium CRM Format */
  const fmtDate = (d) => {
    if (!d) return '—'
    try { return new Date(d + 'T00:00:00').toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' }) }
    catch { return d }
  }
  const fmtNum = (n) => (parseFloat(n)||0).toLocaleString('tr-TR')

  const buildWAMsg = (customerName = '') => {
    return `Merhaba ${customerName || 'Müşterimiz'},\nTeklif dosyanız hazırlanmıştır.\nPDF ekte yer almaktadır.`
  }

  const handleSend = async (c, type) => {
    setWaLoading('PDF hazırlanıyor...')
    try {
      const normalizedName = String(c.values?.full_name || 'Musteri')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '') || 'Musteri'
      const fileName = `${normalizedName}_Teklif.pdf`
      const { blob, download } = await generatePdfFromHtml(pdfTemplateRef, fileName)
      if (!blob || !(blob instanceof Blob) || blob.size === 0) {
        throw new Error('PDF hazır değil. Lütfen tekrar deneyin.')
      }

      if (type === 'WhatsApp') {
        const phone = normalizeTurkishPhone(c.values?.phone || '')
        if (!phone) {
          throw new Error('Geçerli müşteri telefonu bulunamadı. Numara +90 formatına uygun olmalı.')
        }

        const cleanPhone = phone.replace(/\D/g, '')
        const msgText = `Merhaba ${c.values?.full_name || 'Müşterimiz'},\n\nSözleşmeniz hazırlanmıştır.\nPDF ekte yer almaktadır.`

        // Mobilde: navigator.share ile PDF dosyasını doğrudan WhatsApp'a paylaş
        const pdfFile = new File([blob], fileName, { type: 'application/pdf' })
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [pdfFile] })

        if (canShareFiles) {
          try {
            await navigator.share({
              title: fileName,
              text: msgText,
              files: [pdfFile]
            })
            showToast('✅ PDF WhatsApp ile paylaşıldı!')
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              // Paylaşım iptal edilmediyse hata ver
              throw shareErr
            }
            showToast('ℹ️ Paylaşım iptal edildi.')
          }
        } else {
          // Masaüstü: PDF'i indir + WhatsApp Web'i aynı sekmede aç
          download()
          const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`
          window.open(waLink, 'sz_whatsapp') // aynı isimli pencere her seferinde tekrar kullanılır
          showToast('✅ PDF indirildi ve WhatsApp açıldı! İndirilen PDF dosyasını sohbete sürükleyin.')
        }

      } else {
        // Mail
        download()
        const subject = encodeURIComponent(`${settings.companyName} - Teklif Dosyası`)
        const body    = encodeURIComponent(buildWAMsg(c.values?.full_name))
        const email   = c.values?.email || settings.email
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self')
        showToast('✅ Mail uygulaması açıldı. İndirilen PDF dosyasını maile eklemeyi unutmayın.')
      }

      patch(c.id, { status:'Gonderildi', channel: type })
    } catch (error) {
      console.error(error)
      showToast('❌ Hata: ' + error.message)
    } finally {
      setWaLoading('')
    }
  }

  /* ── PUBLIC FORM ──────────────────────────────── */
  if (!isAdmin) {
    return (
      <div className="public-shell public-stack">
        {toast && (
          <div style={{ position:'fixed', top:20, right:20, zIndex:999, background:'#1a2e1a', border:'1px solid #51cf66', color:'#51cf66', padding:'12px 20px', borderRadius:12, fontWeight:600, maxWidth:340 }}>
            {toast}
          </div>
        )}
        <section className="public-card">
          <div className="public-head">
            <div>
              <p className="eyebrow">{settings.companyName}</p>
              <h1>{T.dynamicForm}</h1>
              <p className="muted">{T.dynamicSubtitle}</p>
            </div>
            <div className="lang-switch">
              <Globe size={14}/>
              <button className={lang === 'tr' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('tr')}>TR</button>
              <button className={lang === 'en' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
          <CustomerForm
            fields={localizedFields}
            formValues={formValues}
            readOnlyFieldIds={ADMIN_ONLY}
            requireConsent
            lang={lang}
            onChange={(id, val, type) => {
              const next = type === 'number' ? normalizeNumericInput(val) : val
              setFormValues(prev => ({ ...prev, [id]: next }))
            }}
            onSubmit={handleSubmit}
            submitLabel={T.submitLabel}
          />
        </section>

        <ContactSection
          settings={settings}
          t={T}
          onSystemSend={(msg) => {
            const newMessage = { ...msg, id: Date.now().toString(), date: new Date().toISOString(), status: 'unread' }
            const updated = [newMessage, ...messages]
            setMessages(updated)
            saveMessages(updated)
            showToast('✅ Mesajınız başarıyla iletildi.')
          }}
        />

        <SocialLinks
          settings={{
            ...settings,
            instagram: settings?.instagram || dbSocialLinks?.instagram_url || '',
            tiktok: settings?.tiktok || dbSocialLinks?.tiktok_url || '',
            facebook: settings?.facebook || dbSocialLinks?.facebook_url || '',
            whatsapp: settings?.whatsapp || dbSocialLinks?.whatsapp_url || '',
          }}
          onDisabledClick={(platform) => showToast(`📱 ${platform} lingini admin panelinden ayarlayabilirsiniz.`)}
        />
      </div>
    )
  }


  /* ── ADMIN LOGIN ──────────────────────────────── */
  if (!auth) return <LoginPage onLogin={handleLogin} t={T} />

  /* ── ADMIN PANEL ──────────────────────────────── */
  return (
    <div className="layout">
      <Sidebar
        activePage={activePage}
        onChangePage={setActivePage}
        onLogout={() => { clearSession(); setAuth(false) }}
        t={T}
        companyName={settings.companyName}
        pendingCount={pendingCount}
      />

      <div className="content">
        {/* Topbar */}
        <header className="topbar card">
          <div>
            <p className="eyebrow">{settings.companyName}</p>
            <h1>Teklif &amp; Onay CRM</h1>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right', fontSize:'.72rem', color:'var(--text-muted)', lineHeight:1.4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#51cf66', display:'inline-block', boxShadow:'0 0 6px #51cf66' }}/>
                <span>Otomatik güncelleme aktif</span>
              </div>
              {lastSync && <div>Son: {lastSync.toLocaleTimeString('tr-TR')}</div>}
            </div>
            <button className="btn" onClick={() => { const r = readRecords(); setCustomers(r); setLastSync(new Date()) }}>
              ↻ Yenile
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="stats-grid">
          <article className="stat-card card">
            <div className="stat-icon"><UsersRound size={18}/></div>
            <div><p>{T.totalRecords}</p><strong>{stats.totalRecords}</strong></div>
          </article>
          <article className="stat-card card">
            <div className="stat-icon"><CalendarDays size={18}/></div>
            <div><p>{T.todayRecords}</p><strong>{stats.todayRecords}</strong></div>
          </article>
          <article className="stat-card card">
            <div className="stat-icon"><UserRound size={18}/></div>
            <div><p>{T.totalCustomers}</p><strong>{stats.totalCustomers}</strong></div>
          </article>
        </section>

        {/* Dashboard */}
        {activePage === 'dashboard' && (
          <section className="card panel-card">
            <h2>Durum Özeti</h2>
            <div className="status-overview">
              {[
                { key:'Bekliyor',    label:'Bekliyor',   color:'var(--s-pending)',  bg:'var(--s-pending-bg)' },
                { key:'Onaylandi',   label:'Onaylandı',  color:'var(--s-approved)', bg:'var(--s-approved-bg)' },
                { key:'Gonderildi',  label:'Gönderildi', color:'var(--s-sent)',     bg:'var(--s-sent-bg)' },
                { key:'Tamamlandi',  label:'Tamamlandı', color:'var(--s-done)',     bg:'var(--s-done-bg)' },
              ].map(({ key, label, color, bg }) => (
                <div key={key} className="status-overview-card" style={{ background:bg, border:`1px solid ${color}33` }}>
                  <span className="s-label" style={{ color }}>{label}</span>
                  <span className="s-count" style={{ color }}>{customers.filter(c => c.status === key).length}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CRM */}
        {activePage === 'customers' && (
          <section className="card panel-card">
            <div className="crm-head">
              <div className="tab-row">
                {ADMIN_TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={activeTab === tab.id ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => { setActiveTab(tab.id); setSelectedId(null) }}
                  >
                    {tab.label}
                    {tabCount(tab.id) > 0 && <span className="tab-badge">{tabCount(tab.id)}</span>}
                  </button>
                ))}
              </div>
              <div className="search-row">
                <Search size={15}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={T.search}/>
              </div>
            </div>

            <div className="crm-grid">
              {/* Lead List */}
              <div className="lead-list">
                {filteredCustomers.length === 0 && (
                  <div className="deal-editor-empty" style={{ height:200 }}>
                    <Inbox size={36}/>
                    <span>Henüz kayıt bulunmuyor.</span>
                  </div>
                )}
                {filteredCustomers.map(item => (
                  <button
                    key={item.id}
                    className={selectedId === item.id ? 'lead-card active' : 'lead-card'}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div>
                      <strong>{item.values?.full_name || '-'}</strong>
                      <p>{item.values?.phone || '-'}</p>
                      {item.values?.service_type && <p style={{ fontSize:'.75rem', marginTop:2 }}>{item.values.service_type}</p>}
                    </div>
                    <div className="lead-card-meta">
                      <StatusBadge status={item.status}/>
                      <p className="lead-card-date">{new Date(item.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Deal Editor */}
              <div className="deal-editor">
                {!selectedCustomer && (
                  <div className="deal-editor-empty">
                    <FileText size={40}/>
                    <p>Düzenlemek için soldan bir talep seçin.</p>
                  </div>
                )}

                {selectedCustomer && (
                  <>
                    {/* Başlık */}
                    <h3>{selectedCustomer.values?.full_name || 'Müşteri'}</h3>
                    <p className="deal-editor-sub" style={{ marginBottom:14 }}>
                      {new Date(selectedCustomer.createdAt).toLocaleString('tr-TR')} · <StatusBadge status={selectedCustomer.status}/>
                    </p>

                    {/* Müşteri bilgileri (readonly gösterim) */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:14, background:'var(--bg-elevated)', borderRadius:10, padding:12, border:'1px solid var(--border-soft)' }}>
                      <div><p style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:2 }}>TC No</p><p style={{ fontSize:'.88rem' }}>{selectedCustomer.values?.tc_no || '-'}</p></div>
                      <div><p style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:2 }}>Telefon</p><p style={{ fontSize:'.88rem' }}>{selectedCustomer.values?.phone || '-'}</p></div>
                      <div><p style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:2 }}>2. Kişi (Yakını)</p><p style={{ fontSize:'.88rem' }}>{selectedCustomer.values?.contact2_name || '-'}</p></div>
                      <div><p style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:2 }}>2. Kişi Telefon</p><p style={{ fontSize:'.88rem' }}>{selectedCustomer.values?.contact2_phone || '-'}</p></div>
                      <div style={{ gridColumn:'1/-1' }}><p style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:2 }}>Adres</p><p style={{ fontSize:'.88rem' }}>{selectedCustomer.values?.address || '-'}</p></div>
                      {selectedCustomer.values?.notes && <div style={{ gridColumn:'1/-1' }}><p style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:2 }}>Müşteri Notu</p><p style={{ fontSize:'.88rem' }}>{selectedCustomer.values.notes}</p></div>}
                    </div>

                    {/* Fiyatlandırma */}
                    <div className="price-section">
                      <div className="price-section-title"><span>💰</span> Fiyatlandırma</div>
                      <div className="field-editor-grid">
                        <label>Ürün Fiyatı (TL)
                          <input value={selectedCustomer.values?.product_price||''} onChange={e => patchVal(selectedCustomer.id,'product_price', normalizeNumericInput(e.target.value))} placeholder="0"/>
                        </label>
                        <label>Hizmet Bedeli (TL)
                          <input value={selectedCustomer.values?.deposit||''} onChange={e => patchVal(selectedCustomer.id,'deposit', normalizeNumericInput(e.target.value))} placeholder="0"/>
                        </label>
                        <label>Ekstra Ücret (TL)
                          <input value={selectedCustomer.values?.extra_fee||''} onChange={e => patchVal(selectedCustomer.id,'extra_fee', normalizeNumericInput(e.target.value))} placeholder="0"/>
                        </label>
                        <label>İşlem Tipi
                          <select value={selectedCustomer.values?.service_type||''} onChange={e => patchVal(selectedCustomer.id,'service_type',e.target.value)}>
                            <option value="">Seçiniz</option>
                            <option value="Kiralik">Kiralık</option>
                            <option value="Satilik">Satılık</option>
                            <option value="Dikim">Dikim</option>
                            <option value="Hazirdan">Hazırdan</option>
                            <option value="Ozel Dikim">Özel Dikim</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    {/* Tarihler & Provalar */}
                    <div className="price-section" style={{ marginTop:10 }}>
                      <div className="price-section-title"><span>📅</span> Tarihler &amp; Provalar</div>
                      <div className="field-editor-grid">
                        <label>Teslim Tarihi<input type="date" value={selectedCustomer.values?.delivery_date||''} onChange={e => patchVal(selectedCustomer.id,'delivery_date',e.target.value)}/></label>
                        <label>Geri Dönüş<input type="date" value={selectedCustomer.values?.return_date||''} onChange={e => patchVal(selectedCustomer.id,'return_date',e.target.value)}/></label>
                        <label>1. Prova<input type="date" value={selectedCustomer.values?.fitting_1||''} onChange={e => patchVal(selectedCustomer.id,'fitting_1',e.target.value)}/></label>
                        <label>2. Prova<input type="date" value={selectedCustomer.values?.fitting_2||''} onChange={e => patchVal(selectedCustomer.id,'fitting_2',e.target.value)}/></label>
                        <label>3. Prova<input type="date" value={selectedCustomer.values?.fitting_3||''} onChange={e => patchVal(selectedCustomer.id,'fitting_3',e.target.value)}/></label>
                        <label>Durum
                          <select value={selectedCustomer.status} onChange={e => patch(selectedCustomer.id,{status:e.target.value})}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]||s}</option>)}
                          </select>
                        </label>
                        <label className="full-width">Notlar (admin)
                          <textarea rows={2} value={selectedCustomer.values?.notes||''} onChange={e => patchVal(selectedCustomer.id,'notes',e.target.value)} placeholder="Ölçü, tadilat notları..."/>
                        </label>
                        <label className="full-width">Dipnot (sözleşmede görünür)
                          <textarea rows={2} value={selectedCustomer.footnote||''} onChange={e => patch(selectedCustomer.id,{footnote:e.target.value})} placeholder="Müşteriye özel not..."/>
                        </label>
                      </div>
                    </div>

                    {/* Eylemler */}
                    <div className="actions" style={{ marginTop:14 }}>
                      <button className="btn btn-success" onClick={() => patch(selectedCustomer.id,{status:'Onaylandi'})}>
                        <CheckCircle2 size={15}/> Onayla
                      </button>
                      <button className="btn" onClick={async () => {
                        try {
                          const normalizedName = String(selectedCustomer.values?.full_name || 'Musteri')
                            .trim()
                            .replace(/\s+/g, '_')
                            .replace(/[^a-zA-Z0-9_]/g, '') || 'Musteri'
                          const fileName = `${normalizedName}_Teklif.pdf`
                          const { download } = await generatePdfFromHtml(pdfTemplateRef, fileName)
                          download()
                        } catch(e) {
                          showToast('❌ Hata: ' + e.message)
                        }
                      }}>
                        <Download size={15}/> PDF İndir
                      </button>
                      <button className="btn" onClick={() => exportExcel([selectedCustomer], localizedFields, `${(selectedCustomer.values?.full_name||'musteri').replace(/\s+/g,'_')}.xlsx`)}>
                        <FileText size={15}/> Excel İndir
                      </button>
                    </div>

                    {/* WhatsApp Mesaj Önizleme */}
                    {selectedCustomer.channel && (
                      <div style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', border: '1px solid #25D36633', background: 'var(--bg-elevated)' }}>
                        <div style={{ background: 'linear-gradient(135deg,#e8a33a,#8a5a19)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Link size={14} color="#fff" />
                          <span style={{ color:'#fff', fontWeight:700, fontSize:'.82rem' }}>Mesaj Önizleme</span>
                          <span style={{ marginLeft:'auto', fontSize:'.7rem', color:'#ffffffaa' }}>Müşteriye Gönderilecek Metin</span>
                        </div>
                        <pre style={{ whiteSpace:'pre-wrap', wordBreak:'break-word', fontFamily:'inherit', fontSize:'.77rem', lineHeight:1.75, padding:'12px 14px', margin:0, maxHeight:260, overflowY:'auto', color:'var(--text-main)' }}>
                          {buildWAMsg(selectedCustomer?.values?.full_name)}
                        </pre>
                      </div>
                    )}

                    {/* Gönderim */}
                    <div className="channel-row" style={{ marginTop: 12 }}>
                      <span className="channel-row-label">📤 Sözleşme Gönder</span>
                      <button className={selectedCustomer.channel==='WhatsApp' ? 'channel-btn active-wa' : 'channel-btn'} onClick={() => patch(selectedCustomer.id,{channel:'WhatsApp'})}>
                        <MessageCircle size={14}/> WhatsApp
                      </button>
                      <button className={selectedCustomer.channel==='Mail' ? 'channel-btn active-mail' : 'channel-btn'} onClick={() => patch(selectedCustomer.id,{channel:'Mail'})}>
                        <Mail size={14}/> Mail
                      </button>
                      <button
                        disabled={
                          !selectedCustomer.channel ||
                          !pdfTemplateRef.current ||
                          !!waLoading ||
                          false
                        }
                        onClick={() => handleSend(selectedCustomer, selectedCustomer.channel)}
                        style={{
                          marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:8,
                          padding:'9px 18px', borderRadius:10, border:'none', cursor: (
                            !selectedCustomer.channel ||
                            !pdfTemplateRef.current ||
                            !!waLoading ||
                            false
                          ) ? 'not-allowed' : 'pointer',
                          fontWeight:700, fontSize:'.85rem', transition:'all .25s',
                          background: selectedCustomer.channel==='WhatsApp' ? (waLoading ? '#128C7E' : '#25D366') : 'var(--bg-card)',
                          color: selectedCustomer.channel==='WhatsApp' ? '#fff' : 'var(--text-muted)',
                          boxShadow: selectedCustomer.channel==='WhatsApp' && !waLoading ? '0 4px 20px #25D36650' : 'none',
                          opacity: (
                            !selectedCustomer.channel ||
                            !pdfTemplateRef.current ||
                            !!waLoading ||
                            false
                          ) ? 0.75 : 1,
                        }}
                      >
                        {waLoading ? (
                          <>
                            <span style={{ width:13, height:13, border:'2px solid #ffffff55', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .65s linear infinite' }}/>
                            {waLoading}
                          </>
                        ) : (
                          <><Send size={14}/> {selectedCustomer.channel==='WhatsApp' ? 'WhatsApp Gönder' : 'Sözleşme Gönder'}</>
                        )}
                      </button>

                      <button className={selectedCustomer.status==='Tamamlandi' ? 'channel-btn active-done' : 'channel-btn'} onClick={() => patch(selectedCustomer.id,{status:'Tamamlandi'})}>
                        ✓ Tamamlandı
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Messages Tab */}
        {activePage === 'messages' && (
          <section className="card panel-card">
            <h2>Gelen Mesajlar</h2>
            <p className="muted" style={{ marginBottom: 20 }}>İletişim formundan gelen müşteri mesajları.</p>
            {messages.length === 0 ? (
              <div className="deal-editor-empty" style={{ height: 200 }}>
                <MessageCircle size={36} />
                <span>Henüz mesaj bulunmuyor.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--pub-gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {msg.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)' }}>{msg.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(msg.date).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`https://wa.me/${msg.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#25D366', borderColor: '#25D366', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14} /> WhatsApp</a>
                        {msg.email && <a href={`mailto:${msg.email}`} className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#e2e8f0', color: '#1e293b' }}>E-posta</a>}
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Finans & Raporlar (Kolay Excel) */}
        {activePage === 'reports' && (() => {
          const completedCustomers = customers.filter(c => ['Tamamlandi', 'Onaylandi', 'Gonderildi'].includes(c.status) && !c.hiddenInFinance)
          const getRevenue = (list) => list.reduce((acc, c) => {
            const v = c.values || {}
            const p = parseFloat(v.product_price) || 0
            const d = parseFloat(v.deposit) || 0
            const e = parseFloat(v.extra_fee) || 0
            return acc + p + d + e
          }, 0)

          const now = new Date()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
          startOfWeek.setHours(0,0,0,0)
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          // Filter by custom dates if provided
          let filteredList = completedCustomers
          if (reportStart) {
            filteredList = filteredList.filter(c => new Date(c.updatedAt || c.createdAt) >= new Date(reportStart))
          }
          if (reportEnd) {
            const endD = new Date(reportEnd)
            endD.setHours(23,59,59,999)
            filteredList = filteredList.filter(c => new Date(c.updatedAt || c.createdAt) <= endD)
          }

          const thisWeekCustomers = completedCustomers.filter(c => new Date(c.updatedAt || c.createdAt) >= startOfWeek)
          const thisMonthCustomers = completedCustomers.filter(c => new Date(c.updatedAt || c.createdAt) >= startOfMonth)

          const totalRev = getRevenue(completedCustomers)
          const weekRev = getRevenue(thisWeekCustomers)
          const monthRev = getRevenue(thisMonthCustomers)
          const customRev = getRevenue(filteredList)

          return (
            <section className="card panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Finans & Raporlar</h2>
                  <p className="muted">Onaylanan ve tamamlanan satışların cirosu.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      if(filteredList.length === 0) return;
                      if(window.confirm(`Emin misiniz? Filtrelenen tablodaki (${filteredList.length} adet) işlem finans raporundan silinecektir (Teklif & Onay listesinde kalmaya devam eder).`)) {
                        const filteredIds = new Set(filteredList.map(c => c.id))
                        const next = customers.map(c => filteredIds.has(c.id) ? { ...c, hiddenInFinance: true } : c)
                        setCustomers(next)
                        writeRecords(next)
                        showToast('✅ Tablodaki sözleşmeler finans raporundan silindi.')
                      }
                    }}
                    disabled={filteredList.length === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff6b6b', borderColor: '#ff6b6b' }}
                  >
                    Hepsini Sil
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => exportExcel(filteredList, localizedFields, `Finans_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <FileSpreadsheet size={16} /> Excel'e Aktar
                  </button>
                </div>
              </div>

              {/* Ciro Kartları */}
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                <article className="stat-card card" style={{ background: 'var(--s-done-bg)', border: '1px solid var(--s-done)' }}>
                  <div className="stat-icon" style={{ background: 'var(--s-done)', color: '#fff' }}>₺</div>
                  <div><p>Bu Hafta Ciro</p><strong>{weekRev.toLocaleString('tr-TR')} TL</strong></div>
                </article>
                <article className="stat-card card" style={{ background: 'var(--s-approved-bg)', border: '1px solid var(--s-approved)' }}>
                  <div className="stat-icon" style={{ background: 'var(--s-approved)', color: '#fff' }}>₺</div>
                  <div><p>Bu Ay Ciro</p><strong>{monthRev.toLocaleString('tr-TR')} TL</strong></div>
                </article>
                <article className="stat-card card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}>
                  <div className="stat-icon" style={{ background: 'var(--text-muted)', color: '#fff' }}>₺</div>
                  <div><p>Toplam Ciro</p><strong>{totalRev.toLocaleString('tr-TR')} TL</strong></div>
                </article>
              </div>

              {/* Kalıcı Liste */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Özet Tablo ({filteredList.length} İşlem)</h3>
                  
                  {/* Date Filter */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Takvim Filtresi:</span>
                    <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                    <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-soft)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                    {(reportStart || reportEnd) && (
                      <span style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--s-done)' }}>
                        Filtrelenen Ciro: {customRev.toLocaleString('tr-TR')} TL
                      </span>
                    )}
                  </div>
                </div>
                {filteredList.length === 0 ? (
                  <div className="deal-editor-empty" style={{ height: 150 }}>
                    <FileSpreadsheet size={32} />
                    <span>Seçili tarihlerde onaylanmış/tamamlanmış satış bulunmuyor.</span>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                        <tr>
                          <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Müşteri Adı</th>
                          <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>İşlem Tipi</th>
                          <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Tarih / Durum</th>
                          <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', textAlign: 'right', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>Toplam Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredList].sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).map(c => {
                          const v = c.values || {}
                          const p = parseFloat(v.product_price) || 0
                          const d = parseFloat(v.deposit) || 0
                          const e = parseFloat(v.extra_fee) || 0
                          const cT = p + d + e
                          return (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                              <td style={{ padding: '12px 20px' }}><strong>{v.full_name}</strong><br/><span style={{ color:'var(--text-muted)', fontSize:'.75rem' }}>{v.phone}</span></td>
                              <td style={{ padding: '12px 20px' }}>{v.service_type || '-'}</td>
                              <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>
                                {new Date(c.updatedAt || c.createdAt).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                <br/><span style={{ fontSize: '.7rem', color: c.status === 'Tamamlandi' ? 'var(--s-done)' : 'var(--s-approved)' }}>{c.status}</span>
                              </td>
                              <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 'bold' }}>{cT.toLocaleString('tr-TR')} TL</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )
        })()}

        {/* Ayarlar */}

        {activePage === 'settings' && (
          <section className="card panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Ayarlar</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  saveCompanySettings(settings);
                  showToast('✅ Tüm ayarlar kaydedildi!');
                }}
                style={{ padding: '10px 28px', fontSize: '1rem', fontWeight: 700 }}
              >
                💾 Tüm Ayarları Kaydet
              </button>
            </div>
            <div className="field-editor-grid">
              <label>Şirket Adı<input value={settings.companyName} onChange={e => setSettings(p => ({...p,companyName:e.target.value}))}/></label>
              <label>E-posta<input value={settings.email} onChange={e => setSettings(p => ({...p,email:e.target.value}))}/></label>
              <label>Telefon<input value={settings.phone} onChange={e => setSettings(p => ({...p,phone:e.target.value}))}/></label>
              <label>Adres<input value={settings.address} onChange={e => setSettings(p => ({...p,address:e.target.value}))}/></label>
              <label>Harita Linki<input value={settings.mapsLink || ''} onChange={e => setSettings(p => ({...p,mapsLink:e.target.value}))} placeholder="https://maps.app.goo.gl/..."/></label>
            </div>

            <div style={{ marginTop: 24, marginBottom: 24, padding: 16, border: '1px solid var(--border-soft)', borderRadius: 10 }}>
              <ContractClauses mode="admin" />
            </div>



            {/* Sosyal Medya */}
            <div style={{ marginTop: 24, padding: 24, border: '1px solid var(--border-soft)', borderRadius: 12, background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--pub-gold-light, rgba(212, 175, 55, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pub-gold)' }}>
                  <Link size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>Sosyal Medya Linkleri</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </label>
                  <input
                    value={settings.instagram || ''}
                    onChange={e => setSettings(p => ({...p, instagram: e.target.value}))}
                    placeholder="Kullanıcı adı veya profil linki"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M20.52 3.48A11.88 11.88 0 0012.04 0C5.41 0 .03 5.38.03 12c0 2.12.56 4.2 1.62 6.03L0 24l6.14-1.61A11.94 11.94 0 0012.04 24h.01c6.63 0 12.01-5.38 12.01-12 0-3.2-1.25-6.2-3.54-8.52zM12.05 21.8a9.8 9.8 0 01-4.99-1.37l-.36-.21-3.64.95.97-3.54-.24-.36a9.8 9.8 0 1117.98-5.26c0 5.4-4.39 9.79-9.8 9.79zm5.38-7.35c-.29-.14-1.73-.85-2-.95-.27-.1-.47-.14-.66.14-.2.29-.76.95-.93 1.15-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.66-1.59-.91-2.18-.24-.58-.48-.5-.66-.51h-.56c-.19 0-.51.07-.77.36-.27.29-1.03 1.01-1.03 2.46 0 1.44 1.05 2.84 1.19 3.04.14.19 2.06 3.14 4.99 4.4.7.3 1.25.48 1.67.61.7.22 1.34.19 1.85.12.56-.08 1.73-.71 1.97-1.4.24-.69.24-1.28.17-1.4-.07-.12-.26-.19-.55-.34z"/></svg>
                    WhatsApp
                  </label>
                  <input
                    value={settings.whatsapp || ''}
                    onChange={e => setSettings(p => ({...p, whatsapp: e.target.value}))}
                    placeholder="Örn: 905XXXXXXXXX"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  <span style={{ color: '#25D366', marginRight: 4 }}>✓</span>
                  Kaydettikten sonra ana sayfada anında güncellenir.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    saveCompanySettings(settings);
                    showToast('✅ Tüm ayarlar kaydedildi!');
                  }}
                  style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  💾 Kaydet
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <PdfTemplate 
        ref={pdfTemplateRef} 
        customer={selectedCustomer} 
        settings={settings} 
        fields={localizedFields} 
      />
    </div>
  )
}

export default App
