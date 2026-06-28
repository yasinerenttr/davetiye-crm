import { FileDown, FileSpreadsheet, Pencil, Trash2 } from 'lucide-react'
import { formatDateTR } from '../utils/formatters'

function formatFieldValue(field, value) {
  if (!value) return '-'
  if (field.type === 'date') return formatDateTR(value)
  return String(value)
}

function CustomerTable({ customers, fields, onEdit, onDelete, onExportPdf, onExportExcel }) {
  if (customers.length === 0) {
    return <p className="empty-state">Kayit bulunamadi.</p>
  }

  return (
    <div className="table-wrap">
      <table className="customer-table">
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.id}>{field.label}</th>
            ))}
            <th>Kayit Tarihi</th>
            <th>Islemler</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              {fields.map((field) => (
                <td key={field.id}>{formatFieldValue(field, customer.values?.[field.id])}</td>
              ))}
              <td>{formatDateTR(customer.createdAt)}</td>
              <td>
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => onEdit(customer)} title="Duzenle">
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn danger" onClick={() => onDelete(customer.id)} title="Sil">
                    <Trash2 size={15} />
                  </button>
                  <button className="icon-btn" onClick={() => onExportPdf(customer)} title="PDF indir">
                    <FileDown size={15} />
                  </button>
                  <button className="icon-btn" onClick={() => onExportExcel([customer], fields, `${customer.values?.full_name || 'musteri'}_kaydi.xlsx`)} title="Excel indir">
                    <FileSpreadsheet size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CustomerTable
