export const formatDateTR = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

export const normalizeNumericInput = (value) => {
  if (value === '') return ''
  return value.replace(/[^\d.,]/g, '').replace(',', '.')
}
