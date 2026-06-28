function StatusBadge({ status }) {
  const map = {
    'Bekliyor': 'Bekliyor',
    'Onaylandi': 'Onaylandi',
    'Gonderildi': 'Gonderildi',
    'Tamamlandi': 'Tamamlandi',
  }
  const cls = map[status] || 'Bekliyor'
  return <span className={`status-badge ${cls}`}>{status}</span>
}

export default StatusBadge
