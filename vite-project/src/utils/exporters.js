import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { formatDateTR } from './formatters'

const printableValue = (field, value) => {
  if (!value) return '-'
  if (field.type === 'date') return formatDateTR(value)
  return String(value)
}

const buildContractDoc = (customer, fields, companyName = 'SZ HAUTE COUTURE') => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // Background
  doc.setFillColor(13, 13, 18)
  doc.rect(0, 0, 210, 297, 'F')

  // Gold border
  doc.setDrawColor(232, 163, 58)
  doc.setLineWidth(0.8)
  doc.rect(8, 8, 194, 281)
  doc.setLineWidth(0.3)
  doc.rect(10, 10, 190, 277)

  // Header bar
  doc.setFillColor(30, 25, 10)
  doc.rect(8, 8, 194, 28, 'F')

  // Company name
  doc.setTextColor(232, 163, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(companyName, 16, 20)

  // Subtitle
  doc.setTextColor(160, 152, 128)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('SATIS SOZLESMESI', 16, 27)

  // Doc title on right
  doc.setTextColor(232, 163, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('SOZLESME', 194, 20, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 152, 128)
  doc.text(new Date(customer.createdAt).toLocaleDateString('tr-TR'), 194, 27, { align: 'right' })

  // Divider gold line
  doc.setDrawColor(232, 163, 58)
  doc.setLineWidth(0.5)
  doc.line(16, 40, 194, 40)

  let y = 50

  // Section: Musteri Bilgileri
  doc.setFillColor(30, 25, 10)
  doc.rect(16, y - 5, 178, 8, 'F')
  doc.setTextColor(232, 163, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('MUSTERI BILGILERI', 18, y)
  y += 10

  const infoFields = ['full_name', 'tc_no', 'phone', 'address']
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  fields.forEach((field) => {
    if (!infoFields.includes(field.id)) return
    const val = printableValue(field, customer.values?.[field.id])
    doc.setTextColor(160, 152, 128)
    doc.text(`${field.label}:`, 18, y)
    doc.setTextColor(240, 236, 228)
    doc.text(val, 75, y)
    y += 7
  })

  y += 4

  // Section: Teklif Detaylari
  doc.setFillColor(30, 25, 10)
  doc.rect(16, y - 5, 178, 8, 'F')
  doc.setTextColor(232, 163, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('KAYIT DETAYLARI', 18, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  const priceFields = ['service_type', 'delivery_date', 'return_date', 'fitting_1', 'fitting_2', 'fitting_3']
  fields.forEach((field) => {
    if (!priceFields.includes(field.id)) return
    const val = printableValue(field, customer.values?.[field.id])
    doc.setTextColor(160, 152, 128)
    doc.text(`${field.label}:`, 18, y)
    doc.setTextColor(240, 236, 228)
    doc.text(val, 75, y)
    y += 7
  })

  y += 4

  // Section: Fiyatlandirma (gold box)
  doc.setFillColor(40, 32, 10)
  doc.setDrawColor(232, 163, 58)
  doc.setLineWidth(0.4)
  doc.roundedRect(16, y - 4, 178, 34, 3, 3, 'FD')
  doc.setTextColor(232, 163, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('FIYATLANDIRMA', 18, y + 2)
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const priceData = [
    ['Urun Fiyati', customer.values?.product_price || '0'],
    ['Hizmet Bedeli', customer.values?.deposit || '0'],
    ['Ekstra Ucret', customer.values?.extra_fee || '0'],
  ]
  const total = priceData.reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0)

  priceData.forEach(([label, val]) => {
    doc.setTextColor(160, 152, 128)
    doc.text(`${label}:`, 20, y)
    doc.setTextColor(240, 236, 228)
    doc.text(`${val} TL`, 100, y)
    y += 7
  })

  y += 4

  // Total
  doc.setFillColor(50, 38, 8)
  doc.rect(16, y - 5, 178, 10, 'F')
  doc.setTextColor(232, 163, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOPLAM:', 18, y + 1)
  doc.text(`${total.toLocaleString('tr-TR')} TL`, 194, y + 1, { align: 'right' })
  y += 14

  // Notes
  if (customer.footnote || customer.values?.notes) {
    doc.setFillColor(20, 18, 10)
    doc.roundedRect(16, y - 4, 178, 22, 3, 3, 'F')
    doc.setTextColor(232, 163, 58)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('NOTLAR / DIPNOT:', 18, y + 2)
    doc.setTextColor(160, 152, 128)
    doc.setFont('helvetica', 'normal')
    const noteText = customer.footnote || customer.values?.notes || ''
    const splitNote = doc.splitTextToSize(noteText, 170)
    doc.text(splitNote, 18, y + 9)
    y += 28
  }

  // Durum
  doc.setTextColor(160, 152, 128)
  doc.setFontSize(8)
  doc.text(`Durum: ${customer.status || 'Bekliyor'}`, 18, y)
  doc.text(`Kanal: ${customer.channel || '-'}`, 100, y)
  y += 20

  // Signature line
  doc.setDrawColor(60, 50, 30)
  doc.setLineWidth(0.4)
  doc.line(18, y, 88, y)
  doc.line(120, y, 190, y)
  doc.setTextColor(100, 90, 70)
  doc.setFontSize(7)
  doc.text('Musteri Imzasi', 18, y + 4)
  doc.text('Yetkili Imzasi', 120, y + 4)

  // Footer
  doc.setDrawColor(50, 40, 15)
  doc.line(16, 270, 194, 270)
  doc.setTextColor(80, 70, 50)
  doc.setFontSize(7)
  doc.text(companyName, 16, 275)
  doc.text(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`, 194, 275, { align: 'right' })

  return doc
}

export const exportContractPdfBlob = (customer, fields, companyName = 'SZ HAUTE COUTURE') => {
  if (!customer || !fields?.length) return new Blob()
  const doc = buildContractDoc(customer, fields, companyName)
  return doc.output('blob')
}

export const exportPdf = (customer, fields, companyName = 'SZ HAUTE COUTURE') => {
  if (!customer || !fields?.length) return
  const doc = buildContractDoc(customer, fields, companyName)
  const fileName = `${String(customer.values?.full_name || 'musteri').replace(/\s+/g, '_')}_sozlesme.pdf`
  doc.save(fileName)
}

export const exportExcel = (customers, fields, fileName = 'gelinlik_musteriler.xlsx') => {
  if (!fields?.length) return
  const rows = customers.map((c) => {
    const row = {}
    fields.forEach((f) => { row[f.label] = printableValue(f, c.values?.[f.id]) })
    row['Durum'] = c.status || 'Bekliyor'
    row['Kanal'] = c.channel || '-'
    row['Kayit Tarihi'] = new Date(c.createdAt).toLocaleString('tr-TR')
    return row
  })
  const sheet = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Musteriler')
  XLSX.writeFile(wb, fileName)
}

export const generatePdfFromHtml = async (elementRef, fileName = 'teklif.pdf') => {
  if (!elementRef.current) throw new Error('PDF sablonu bulunamadi')
  
  // Create canvas from element
  const canvas = await html2canvas(elementRef.current, {
    scale: 2, // higher resolution
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  // Calculate dimensions for A4
  const imgData = canvas.toDataURL('image/jpeg', 1.0)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  const pageHeight = pdf.internal.pageSize.getHeight()

  let finalWidth = pdfWidth
  let finalHeight = pdfHeight

  // Eğer PDF yüksekliği 1 sayfadan uzunsa, tam 1 sayfaya sığacak şekilde küçült
  if (pdfHeight > pageHeight) {
    const ratio = pageHeight / pdfHeight
    finalWidth = pdfWidth * ratio
    finalHeight = pageHeight
  }

  const xOffset = (pdfWidth - finalWidth) / 2

  pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, finalHeight)
  
  return {
    blob: pdf.output('blob'),
    download: () => pdf.save(fileName)
  }
}

export const exportDailyReportPdf = (customers = [], fields = [], companyName = 'SZ HAUTE COUTURE', customDate = null) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const reportDate = customDate ? new Date(customDate) : new Date()
  const dateStr = reportDate.toLocaleDateString('tr-TR')
  const dateIso = reportDate.toISOString().split('T')[0]

  const activeCustomers = customers.filter(c => !c.isDeleted)
  const todayCustomers = activeCustomers.filter(c => {
    const d = c.createdAt || c.updatedAt
    if (!d) return false
    return new Date(d).toISOString().split('T')[0] === dateIso
  })

  // Target list: if today's customers exist, focus on today; otherwise report all active records
  const listToReport = todayCustomers.length > 0 ? todayCustomers : activeCustomers

  // Calculate totals
  const totalRev = listToReport.reduce((acc, c) => {
    const v = c.values || {}
    return acc + (parseFloat(v.product_price) || 0) + (parseFloat(v.deposit) || 0) + (parseFloat(v.extra_fee) || 0)
  }, 0)

  const pendingCount = listToReport.filter(c => c.status === 'Bekliyor').length
  const approvedCount = listToReport.filter(c => c.status === 'Onaylandi').length
  const sentCount = listToReport.filter(c => c.status === 'Gonderildi').length
  const doneCount = listToReport.filter(c => c.status === 'Tamamlandi').length

  // Header Banner
  doc.setFillColor(15, 23, 42) // Dark blue slate
  doc.rect(0, 0, 210, 38, 'F')

  doc.setTextColor(234, 179, 8) // Yellow Gold
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(companyName.toUpperCase(), 14, 16)

  doc.setTextColor(248, 250, 252)
  doc.setFontSize(11)
  doc.text('GUNLUK CRM VE FINANS OZET RAPORU', 14, 25)

  doc.setTextColor(203, 213, 225)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Tarih: ${dateStr} | Rapor Tipi: ${todayCustomers.length > 0 ? 'Bugunun Kayitlari' : 'Genel Ozet'}`, 14, 32)
  doc.text(`Olusturulma: ${new Date().toLocaleTimeString('tr-TR')}`, 196, 32, { align: 'right' })

  // Gold accent bar
  doc.setFillColor(234, 179, 8)
  doc.rect(0, 38, 210, 2, 'F')

  let y = 48

  // Overview Cards
  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, y, 182, 26, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('GENEL OZET VE CIRO', 18, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`Toplam Islem: ${listToReport.length} adet`, 18, y + 15)
  doc.text(`Bekleyen: ${pendingCount} | Onaylanan: ${approvedCount} | Gonderilen: ${sentCount} | Tamamlanan: ${doneCount}`, 18, y + 21)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(16, 185, 129) // Emerald green
  doc.text(`Toplam Ciro: ${totalRev.toLocaleString('tr-TR')} TL`, 190, y + 16, { align: 'right' })

  y += 34

  // Table Header
  doc.setFillColor(30, 41, 59)
  doc.rect(14, y, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)

  doc.text('MUSTERI AD SOYAD', 18, y + 5.5)
  doc.text('TELEFON', 75, y + 5.5)
  doc.text('ISLEM TIPI', 115, y + 5.5)
  doc.text('DURUM', 145, y + 5.5)
  doc.text('TUTAR', 192, y + 5.5, { align: 'right' })

  y += 8

  // Table Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  if (listToReport.length === 0) {
    doc.setTextColor(100, 116, 139)
    doc.text('Bu tarihte kayitli islem bulunmamaktadir.', 18, y + 8)
  } else {
    listToReport.forEach((c, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      const v = c.values || {}
      const p = parseFloat(v.product_price) || 0
      const d = parseFloat(v.deposit) || 0
      const e = parseFloat(v.extra_fee) || 0
      const itemTotal = p + d + e

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y, 182, 7, 'F')
      }

      doc.setTextColor(15, 23, 42)
      const nameStr = String(v.full_name || '-').slice(0, 28)
      doc.text(nameStr, 18, y + 4.8)

      doc.setTextColor(71, 85, 105)
      doc.text(String(v.phone || '-'), 75, y + 4.8)
      doc.text(String(v.service_type || '-').slice(0, 18), 115, y + 4.8)
      doc.text(String(c.status || 'Bekliyor'), 145, y + 4.8)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(`${itemTotal.toLocaleString('tr-TR')} TL`, 192, y + 4.8, { align: 'right' })
      doc.setFont('helvetica', 'normal')

      doc.setDrawColor(241, 245, 249)
      doc.line(14, y + 7, 196, y + 7)

      y += 7
    })
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(226, 232, 240)
  doc.line(14, pageHeight - 12, 196, pageHeight - 12)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(`${companyName} CRM - Otomatik Gunluk PDF Raporu`, 14, pageHeight - 7)
  doc.text(`Sayfa 1`, 196, pageHeight - 7, { align: 'right' })

  const safeDate = dateStr.replace(/\./g, '_')
  const fileName = `${safeDate}_Gunluk_CRM_Raporu.pdf`
  doc.save(fileName)
}

