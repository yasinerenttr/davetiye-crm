/**
 * ContractClauses — İki modlu bileşen
 *
 * mode="admin"  → Admin paneli: madde ekle/sil/sırala
 * mode="public" → Ana sayfa: maddeler listesi + zorunlu onay checkbox
 */

import { useState, useRef, useEffect } from 'react'
import { FileText, Plus, Trash2, GripVertical, ScrollText } from 'lucide-react'

/* ── localStorage key ───────────────────────────────── */
const CL_KEY = 'contract_clauses_v1'

const DEFAULT_CLAUSES = [
  'Ürün teslim sonrası iade edilemez.',
  'Kiralama süresi aşılırsa ek ücret uygulanır.',
  'Ürüne verilen hasar müşteriye aittir.',
  'Teslim tarihi değişikliği en az 3 gün önceden bildirilmelidir.',
  'Hizmet Bedeli iadesi yapılmamaktadır.',
  'Sözleşmenin hiç veya gereği gibi ifa edilememesi, 3.kişilerle akit yapılmak istenmesi veya alımdan/kiralamadan vazgeçilmek istenmesi durumunda; alıcı sözleşmede adı geçen şirkete ürünün toplam tutarının tamamına karşılık gelen meblağı cayma bedeli olarak ödemeyi kabul ve taahhüt eder.',
]

export function loadClauses() {
  try {
    const raw = localStorage.getItem(CL_KEY)
    if (!raw) return DEFAULT_CLAUSES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CLAUSES
  } catch {
    return DEFAULT_CLAUSES
  }
}

export function saveClauses(list) {
  localStorage.setItem(CL_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent('clausesUpdated'))
  // Backend'e senkronize et
  fetch('https://davetiye-crm.onrender.com/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clauses: list })
  }).catch(() => {})
}

/* ══════════════════════════════════════════════════════
   ADMIN MODU — madde yönetimi
══════════════════════════════════════════════════════ */
function AdminEditor() {
  const [clauses, setClauses] = useState(loadClauses)
  const [input, setInput] = useState('')
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const inputRef = useRef(null)

  const add = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const next = [...clauses, trimmed]
    setClauses(next)
    saveClauses(next)
    setInput('')
    inputRef.current?.focus()
  }

  const remove = (idx) => {
    const next = clauses.filter((_, i) => i !== idx)
    setClauses(next)
    saveClauses(next)
  }

  const reset = () => {
    setClauses(DEFAULT_CLAUSES)
    saveClauses(DEFAULT_CLAUSES)
  }

  /* Drag & Drop sıralama */
  const handleDragStart = (idx) => setDragging(idx)
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx) }
  const handleDrop = (idx) => {
    if (dragging === null || dragging === idx) { setDragging(null); setDragOver(null); return }
    const next = [...clauses]
    const [moved] = next.splice(dragging, 1)
    next.splice(idx, 0, moved)
    setClauses(next)
    saveClauses(next)
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="cc-admin-wrap">
      <div className="cc-admin-header">
        <ScrollText size={16} />
        <span>Sözleşme Maddeleri</span>
        <span className="cc-badge">{clauses.length} madde</span>
      </div>

      <p className="cc-admin-hint">
        🛈 Bu maddeler müşteri formunda görünür ve kullanıcı onayı gerekmektedir. <br />
        Sürükleyerek sırayı değiştirebilirsiniz.
      </p>

      {/* Madde ekle */}
      <div className="cc-add-row">
        <textarea
          ref={inputRef}
          className="cc-add-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Yeni madde yazın... (Shift+Enter alt satır, Enter ile ekle)"
          maxLength={1000}
          rows={3}
          style={{ resize: 'vertical' }}
        />
        <button
          type="button"
          className="cc-add-btn"
          onClick={add}
          disabled={!input.trim()}
        >
          <Plus size={15} /> Ekle
        </button>
      </div>

      {/* Liste */}
      <ul className="cc-list">
        {clauses.map((clause, idx) => (
          <li
            key={idx}
            className={`cc-item ${dragging === idx ? 'cc-dragging' : ''} ${dragOver === idx ? 'cc-dragover' : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragging(null); setDragOver(null) }}
          >
            <GripVertical size={14} className="cc-grip" />
            <span className="cc-num">{idx + 1}.</span>
            <span className="cc-text">{clause}</span>
            <button
              type="button"
              className="cc-del-btn"
              onClick={() => remove(idx)}
              title="Sil"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
        {clauses.length === 0 && (
          <li className="cc-empty">Henüz madde eklenmedi.</li>
        )}
      </ul>

      {/* Reset */}
      <button type="button" className="cc-reset-btn" onClick={reset}>
        ↺ Varsayılan maddelere dön
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   PUBLIC MODU — müşteri görünümü + onay checkbox
══════════════════════════════════════════════════════ */
function PublicView({ accepted, onChange, error, lang }) {
  const [clauses, setClauses] = useState(loadClauses)

  useEffect(() => {
    const refresh = () => setClauses(loadClauses())
    window.addEventListener('clausesUpdated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('clausesUpdated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <div className={`cc-public-wrap ${accepted ? 'cc-public-accepted' : ''}`}>
      <div className="cc-public-header">
        <FileText size={17} />
        <span>{lang === 'en' ? 'Contract Clauses' : 'Sözleşme Maddeleri'}</span>
        <span className="cc-badge cc-badge-pub">{lang === 'en' ? 'Set by Seller' : 'Satıcı Tarafından Belirlendi'}</span>
      </div>

      {/* Maddeler */}
      <ol className="cc-pub-list">
        {clauses.map((clause, idx) => (
          <li key={idx} className="cc-pub-item">
            <span className="cc-pub-num">{idx + 1}</span>
            <span className="cc-pub-text">{clause}</span>
          </li>
        ))}
      </ol>

      {/* Onay checkbox */}
      <label className={`cc-pub-check-row ${error ? 'cc-check-error' : ''}`}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={e => onChange(e.target.checked)}
          className="cc-checkbox"
        />
        <span className="cc-check-text">
          {lang === 'en' ? 'I have read and accept all the contract clauses above.' : 'Yukarıdaki tüm sözleşme maddelerini okudum ve kabul ediyorum.'}
        </span>
      </label>

      {error && (
        <p className="cc-error-msg">
          ⚠️ {lang === 'en' ? 'You must accept the contract clauses to continue.' : 'Devam etmek için sözleşme maddelerini kabul etmeniz gerekmektedir.'}
        </p>
      )}
    </div>
  )
}

/* ── Ana export ─────────────────────────────────────── */
export default function ContractClauses({ mode = 'public', accepted, onChange, error, lang = 'tr' }) {
  if (mode === 'admin') return <AdminEditor />
  return <PublicView accepted={accepted} onChange={onChange} error={error} lang={lang} />
}
