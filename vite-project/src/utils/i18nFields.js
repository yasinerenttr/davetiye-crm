export const FIELD_I18N = {
  full_name: {
    tr: { label: 'Musteri Ad Soyad', placeholder: 'Orn: Yasin Tatar' },
    en: { label: 'Customer Full Name', placeholder: 'Ex: Yasin Tatar' },
    ru: { label: 'Имя и фамилия клиента', placeholder: 'Пример: Yasin Tatar' },
    ar: { label: 'اسم العميل الكامل', placeholder: 'مثال: Yasin Tatar' },
  },
  tc_no: {
    tr: { label: 'TC No', placeholder: '11 haneli' },
    en: { label: 'National ID', placeholder: '11 digits' },
    ru: { label: 'ID номер', placeholder: '11 цифр' },
    ar: { label: 'رقم الهوية', placeholder: '11 رقمًا' },
  },
  phone: {
    tr: { label: 'Telefon', placeholder: '05xx xxx xx xx' },
    en: { label: 'Phone', placeholder: '05xx xxx xx xx' },
    ru: { label: 'Телефон', placeholder: '05xx xxx xx xx' },
    ar: { label: 'الهاتف', placeholder: '05xx xxx xx xx' },
  },
  address: {
    tr: { label: 'Adres', placeholder: 'Acik adres' },
    en: { label: 'Address', placeholder: 'Full address' },
    ru: { label: 'Адрес', placeholder: 'Полный адрес' },
    ar: { label: 'العنوان', placeholder: 'العنوان الكامل' },
  },
  product_price: {
    tr: { label: 'Urun Fiyati', placeholder: '0' },
    en: { label: 'Product Price', placeholder: '0' },
    ru: { label: 'Цена изделия', placeholder: '0' },
    ar: { label: 'سعر المنتج', placeholder: '0' },
  },
  deposit: {
    tr: { label: 'Hizmet Bedeli', placeholder: '0' },
    en: { label: 'Deposit', placeholder: '0' },
    ru: { label: 'Предоплата', placeholder: '0' },
    ar: { label: 'العربون', placeholder: '0' },
  },
  extra_fee: {
    tr: { label: 'Ekstra Ucret', placeholder: '0' },
    en: { label: 'Extra Fee', placeholder: '0' },
    ru: { label: 'Доплата', placeholder: '0' },
    ar: { label: 'رسوم إضافية', placeholder: '0' },
  },
  service_type: {
    tr: { label: 'Islem Tipi', placeholder: '' },
    en: { label: 'Service Type', placeholder: '' },
    ru: { label: 'Тип услуги', placeholder: '' },
    ar: { label: 'نوع الخدمة', placeholder: '' },
  },
  delivery_date: {
    tr: { label: 'Teslim Tarihi', placeholder: '' },
    en: { label: 'Delivery Date', placeholder: '' },
    ru: { label: 'Дата выдачи', placeholder: '' },
    ar: { label: 'تاريخ التسليم', placeholder: '' },
  },
  return_date: {
    tr: { label: 'Geri Donus Tarihi', placeholder: '' },
    en: { label: 'Return Date', placeholder: '' },
    ru: { label: 'Дата возврата', placeholder: '' },
    ar: { label: 'تاريخ الإرجاع', placeholder: '' },
  },
  fitting_1: {
    tr: { label: '1. Prova', placeholder: '' },
    en: { label: '1st Fitting', placeholder: '' },
    ru: { label: '1-я примерка', placeholder: '' },
    ar: { label: 'البروفة 1', placeholder: '' },
  },
  fitting_2: {
    tr: { label: '2. Prova', placeholder: '' },
    en: { label: '2nd Fitting', placeholder: '' },
    ru: { label: '2-я примерка', placeholder: '' },
    ar: { label: 'البروفة 2', placeholder: '' },
  },
  fitting_3: {
    tr: { label: '3. Prova', placeholder: '' },
    en: { label: '3rd Fitting', placeholder: '' },
    ru: { label: '3-я примерка', placeholder: '' },
    ar: { label: 'البروفة 3', placeholder: '' },
  },
  notes: {
    tr: { label: 'Notlar', placeholder: 'Olcu, tadilat, teslim notlari...' },
    en: { label: 'Notes', placeholder: 'Measurements, alterations, delivery notes...' },
    ru: { label: 'Примечания', placeholder: 'Размеры, правки, заметки по выдаче...' },
    ar: { label: 'ملاحظات', placeholder: 'المقاسات، التعديلات، ملاحظات التسليم...' },
  },
}

const SERVICE_OPTION_I18N = {
  Kiralik: { tr: 'Kiralik', en: 'Rental', ru: 'Прокат', ar: 'إيجار' },
  Satilik: { tr: 'Satilik', en: 'For Sale', ru: 'Продажа', ar: 'بيع' },
  Dikim: { tr: 'Dikim', en: 'Tailoring', ru: 'Пошив', ar: 'خياطة' },
  Hazirdan: { tr: 'Hazirdan', en: 'Ready-made', ru: 'Готовое', ar: 'جاهز' },
  'Ozel Dikim': { tr: 'Özel Dikim', en: 'Custom Tailoring', ru: 'Индивидуальный пошив', ar: 'خياطة مخصصة' },
}

export const localizeField = (field, language) => {
  const map = FIELD_I18N[field.id]
  if (!map || !map[language]) return field
  const localized = map[language]

  const options = Array.isArray(field.options)
    ? field.options.map((opt) => SERVICE_OPTION_I18N[opt]?.[language] || opt)
    : []

  return {
    ...field,
    label: localized.label,
    placeholder: localized.placeholder,
    options,
  }
}
