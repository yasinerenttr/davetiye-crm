import { LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { LOGO_BASE64 } from '../logoBase64'

function LoginPage({ onLogin, t }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!onLogin(username.trim(), password)) {
      setError(t.loginError)
    } else {
      setError('')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div className="brand-logo-icon" style={{ width: 48, height: 48, borderRadius: 12 }}>
            <img src={LOGO_BASE64} alt="SZ Logo" />
          </div>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>{t.companyName}</p>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{t.adminLogin}</h1>
          </div>
        </div>
        <p className="login-sub">{t.adminLoginSubtitle}</p>
        <form className="login-form" onSubmit={submit}>
          <label>
            {t.username}
            <div className="with-icon">
              <UserRound size={16} />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="turgut" autoComplete="username" />
            </div>
          </label>
          <label>
            {t.password}
            <div className="with-icon">
              <LockKeyhole size={16} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
            </div>
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-lg" type="submit">{t.login}</button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
