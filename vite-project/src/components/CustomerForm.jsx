import { Lock } from 'lucide-react'
import { useState } from 'react'
import ConsentApproval from './ConsentApproval'
import ContractClauses from './ContractClauses'

function CustomerForm({
  fields,
  formValues,
  onChange,
  onSubmit,
  submitLabel = 'Kaydet',
  readOnlyFieldIds = new Set(),
  requireConsent = false,
  lang = 'tr',
}) {
  const isRO = (id) => readOnlyFieldIds?.has?.(id)

  const [consentAccepted,  setConsentAccepted]  = useState(false)
  const [consentError,     setConsentError]     = useState(false)
  const [clausesAccepted,  setClausesAccepted]  = useState(false)
  const [clausesError,     setClausesError]     = useState(false)

  const renderInput = (field) => {
    const ro = isRO(field.id)

    if (field.type === 'textarea') {
      return (
        <textarea
          value={formValues[field.id] || ''}
          onChange={(e) => !ro && onChange(field.id, e.target.value, field.type)}
          placeholder={ro ? '— Satıcı tarafından doldurulacak —' : field.placeholder || ''}
          rows={3}
          required={field.required}
          readOnly={ro}
          style={ro ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
        />
      )
    }

    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : []
      return (
        <select
          value={formValues[field.id] || ''}
          onChange={(e) => !ro && onChange(field.id, e.target.value, field.type)}
          required={field.required}
          disabled={ro}
          style={ro ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
        >
          <option value="">{ro ? '— Satıcı seçecek —' : 'Seçiniz'}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }

    return (
      <input
        type={field.type}
        value={formValues[field.id] || ''}
        onChange={(e) => !ro && onChange(field.id, e.target.value, field.type)}
        placeholder={ro ? '— Satıcı tarafından doldurulacak —' : field.placeholder || ''}
        required={field.required}
        readOnly={ro}
        style={ro ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
      />
    )
  }

  const hasNotesField = fields.some((f) => f.id === 'notes')

  const handleSubmit = () => {
    let ok = true
    if (requireConsent && !consentAccepted) { setConsentError(true);  ok = false }
    if (requireConsent && !clausesAccepted) { setClausesError(true);  ok = false }
    if (!ok) return
    setConsentError(false)
    setClausesError(false)
    onSubmit()
  }

  return (
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      {fields.map((field) => (
        <label key={field.id} className={field.type === 'textarea' ? 'full-width' : ''}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {field.label}
            {isRO(field.id) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: 'var(--pub-gold)', opacity: 0.75, fontWeight: 600 }}>
                <Lock size={9} /> Satıcı dolduracak
              </span>
            )}
          </span>
          {renderInput(field)}

          {/* KVKK onayı — notes alanının hemen altında */}
          {field.id === 'notes' && requireConsent && (
            <ConsentApproval
              accepted={consentAccepted}
              onChange={(next) => { setConsentAccepted(next); if (next) setConsentError(false) }}
              error={consentError}
              lang={lang}
            />
          )}
        </label>
      ))}

      {/* KVKK — notes alanı yoksa forma ekle */}
      {requireConsent && !hasNotesField && (
        <div className="full-width">
          <ConsentApproval
            accepted={consentAccepted}
            onChange={(next) => { setConsentAccepted(next); if (next) setConsentError(false) }}
            error={consentError}
            lang={lang}
          />
        </div>
      )}

      {/* ── Sözleşme Maddeleri ── KVKK'nın hemen altında */}
      {requireConsent && (
        <div className="full-width">
          <ContractClauses
            mode="public"
            accepted={clausesAccepted}
            onChange={(next) => { setClausesAccepted(next); if (next) setClausesError(false) }}
            error={clausesError}
            lang={lang}
          />
        </div>
      )}

      {/* Gönder butonu */}
      <div className="full-width">
        <button
          className="btn btn-primary btn-lg"
          type="submit"
          disabled={requireConsent && (!consentAccepted || !clausesAccepted)}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export default CustomerForm
