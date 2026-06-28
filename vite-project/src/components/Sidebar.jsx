import { LayoutDashboard, LogOut, Settings, UsersRound, MessageCircle, FileSpreadsheet } from 'lucide-react'

function Sidebar({ activePage, onChangePage, onLogout, t, companyName, pendingCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <p className="eyebrow">{t.saasAdmin}</p>
        <h2>{companyName}</h2>
      </div>

      <nav className="side-nav">
        <button className={activePage === 'dashboard' ? 'side-link active' : 'side-link'} onClick={() => onChangePage('dashboard')}>
          <LayoutDashboard size={16} /> {t.dashboard}
        </button>
        <button className={activePage === 'customers' ? 'side-link active' : 'side-link'} onClick={() => onChangePage('customers')}>
          <UsersRound size={16} /> {t.records}
          {pendingCount > 0 && <span className="side-link-badge">{pendingCount}</span>}
        </button>
        <button className={activePage === 'messages' ? 'side-link active' : 'side-link'} onClick={() => onChangePage('messages')}>
          <MessageCircle size={16} /> Mesajlar
        </button>
        <button className={activePage === 'reports' ? 'side-link active' : 'side-link'} onClick={() => onChangePage('reports')}>
          <FileSpreadsheet size={16} /> Finans & Raporlar
        </button>
        <button className={activePage === 'settings' ? 'side-link active' : 'side-link'} onClick={() => onChangePage('settings')}>
          <Settings size={16} /> {t.settings}
        </button>
      </nav>

      <button className="side-logout" onClick={onLogout}>
        <LogOut size={16} /> {t.logout}
      </button>
    </aside>
  )
}

export default Sidebar
