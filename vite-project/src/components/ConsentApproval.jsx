import { ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'

function ConsentApproval({ accepted, onChange, error, lang = 'tr' }) {
  const [modalType, setModalType] = useState('')

  const closeModal = () => setModalType('')

  return (
    <>
      <div className={`consent-card ${accepted ? 'active' : ''}`}>
        <div className="consent-head">
          <ShieldCheck size={16} />
          <span>{lang === 'en' ? 'Consent and Terms' : 'Onay ve KVKK/Hüküm'}</span>
        </div>

        <label className="consent-checkline">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="consent-text">
            {lang === 'en' ? 'I confirm that I have read and accepted the terms in this contract and that the information I have provided is correct. This electronic consent serves as my signature.' : 'Bu sözleşmede yer alan şartları okuduğumu, kabul ettiğimi ve verdiğim bilgilerin doğru olduğunu onaylıyorum. Elektronik ortamda verilen bu onay, tarafım adına imza yerine geçer.'}
          </span>
        </label>

        <div className="consent-links">
          <button type="button" className="consent-link" onClick={() => setModalType('kvkk')}>
            {lang === 'en' ? 'Privacy Policy' : 'KVKK'}
          </button>
          <span>{lang === 'en' ? 'and' : 've'}</span>
          <button type="button" className="consent-link" onClick={() => setModalType('terms')}>
            {lang === 'en' ? 'Terms of Use' : 'Kullanım Şartları'}
          </button>
        </div>

        {error && <p className="consent-error">{lang === 'en' ? 'You must accept the terms to continue.' : 'Devam etmek için sözleşmeyi kabul etmelisiniz.'}</p>}
      </div>

      {modalType && (
        <div className="consent-modal-backdrop" onClick={closeModal}>
          <div className="consent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="consent-modal-head">
              <h3>{modalType === 'kvkk' ? (lang === 'en' ? 'Privacy Policy' : 'KVKK Aydınlatma Metni') : (lang === 'en' ? 'Terms of Use' : 'Kullanım Şartları')}</h3>
              <button type="button" className="consent-close" onClick={closeModal} aria-label="Kapat">
                <X size={16} />
              </button>
            </div>
            <div className="consent-modal-body">
              {modalType === 'kvkk' ? (
                <p>
                  {lang === 'en' ? 'Your personal data is processed for the purpose of evaluating your request, preparing a quote, and communicating with you. Your data is used only in relevant service processes and is protected in accordance with applicable legislation.' : 'Kişisel verileriniz, talebinizin değerlendirilmesi, teklif hazırlanması ve sizinle iletişime geçilmesi amacıyla işlenir. Verileriniz yalnızca ilgili hizmet süreçlerinde kullanılır ve yürürlükteki mevzuata uygun şekilde korunur.'}
                </p>
              ) : (
                <p>
                  {lang === 'en' ? 'By submitting this form, you accept that the information provided is correct and you approve receiving informational communication regarding the quote and service process electronically. The responsibility arising from providing misleading or incomplete information belongs to you.' : 'Bu form ile iletilen bilgilerin doğru olduğunu kabul eder, teklif ve hizmet sürecine ilişkin bilgilendirme iletişimini elektronik ortamda almayı onaylarsınız. Yanıltıcı veya eksik bilgi verilmesinden doğacak sorumluluk tarafınıza aittir.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ConsentApproval
