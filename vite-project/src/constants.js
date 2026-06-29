export const STORAGE_KEYS = {
  CUSTOMERS: 'gelinlik_musterileri_v3',
  SESSION: 'gelinlik_admin_session',
  FORM_FIELDS: 'gelinlik_form_fields_v1',
  COMPANY_SETTINGS: 'company_settings_v1',
  MESSAGES: 'davetiye_messages_v1',
}

export const ADMIN_CREDENTIALS = {
  username: 'turgut',
  password: '123456turgut',
}

export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'date', label: 'Date' },
]

export const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'SZ HAUTE COUTURE',
  email: 'info@hautecouture.com',
  phone: '+90 5xx xxx xx xx',
  address: 'Istanbul, Turkiye',
  mapsLink: 'https://maps.google.com',
  footerDescription: 'SZ HAUTE COUTURE gelinlik ve couture tasarimlarinda premium deneyim sunar.',
  emailJsServiceId: '',
  emailJsTemplateId: '',
  emailJsPublicKey: '',
  instagram: '',
  tiktok: '',
  facebook: '',
  whatsapp: '',
  supabaseUrl: '',
  supabaseKey: '',
  supabaseBucket: 'teklifler',
  logoText: 'HC',
}

export const DEFAULT_FORM_FIELDS = [
  { id: 'full_name', label: 'Musteri Ad Soyad', placeholder: 'Orn: Yasin Tatar', type: 'text', required: true, options: [] },
  { id: 'tc_no', label: 'TC No', placeholder: '11 haneli', type: 'text', required: false, options: [] },
  { id: 'phone', label: 'Musteri Telefon', placeholder: '05xx xxx xx xx', type: 'text', required: true, options: [] },
  { id: 'contact2_name', label: '2. Kisi Ad Soyad (Yakini)', placeholder: 'Ulasilamazsa aranacak kisi', type: 'text', required: false, options: [] },
  { id: 'contact2_phone', label: '2. Kisi Telefon', placeholder: '05xx xxx xx xx', type: 'text', required: false, options: [] },
  { id: 'address', label: 'Adres', placeholder: 'Acik adres', type: 'textarea', required: false, options: [] },
  { id: 'product_price', label: 'Urun Fiyati', placeholder: '0', type: 'number', required: false, options: [] },
  { id: 'deposit', label: 'Hizmet Bedeli', placeholder: '0', type: 'number', required: false, options: [] },
  { id: 'extra_fee', label: 'Ekstra Ucret', placeholder: '0', type: 'number', required: false, options: [] },
  {
    id: 'service_type',
    label: 'Islem Tipi',
    placeholder: '',
    type: 'select',
    required: false,
    options: ['Kiralik', 'Satilik', 'Dikim', 'Hazirdan', 'Ozel Dikim'],
  },
  { id: 'delivery_date', label: 'Teslim Tarihi', placeholder: '', type: 'date', required: false, options: [] },
  { id: 'return_date', label: 'Geri Donus Tarihi', placeholder: '', type: 'date', required: false, options: [] },
  { id: 'fitting_1', label: '1. Prova', placeholder: '', type: 'date', required: false, options: [] },
  { id: 'fitting_2', label: '2. Prova', placeholder: '', type: 'date', required: false, options: [] },
  { id: 'fitting_3', label: '3. Prova', placeholder: '', type: 'date', required: false, options: [] },
  { id: 'notes', label: 'Notlar', placeholder: 'Olcu, tadilat, teslim notlari...', type: 'textarea', required: false, options: [] },
]
