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
