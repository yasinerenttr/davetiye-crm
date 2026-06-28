import { Mail, MapPin, Phone } from 'lucide-react'

function SiteFooter({ settings }) {
  return (
    <footer className="site-footer card">
      <div>
        <p className="eyebrow">{settings.companyName}</p>
        <p>{settings.footerDescription}</p>
      </div>
      <div className="footer-contact">
        <p><Mail size={14} /> {settings.email}</p>
        <p><Phone size={14} /> {settings.phone}</p>
        <p><MapPin size={14} /> {settings.address}</p>
      </div>
    </footer>
  )
}

export default SiteFooter
