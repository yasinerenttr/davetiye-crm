import { DEFAULT_COMPANY_SETTINGS, DEFAULT_FORM_FIELDS, STORAGE_KEYS } from '../constants'

export const loadCustomers = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveCustomers = (customers) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
}

export const loadMessages = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveMessages = (msgs) => {
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs))
}

export const loadFormFields = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.FORM_FIELDS)
  if (!raw) return DEFAULT_FORM_FIELDS

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FORM_FIELDS
  } catch {
    return DEFAULT_FORM_FIELDS
  }
}

export const saveFormFields = (fields) => {
  localStorage.setItem(STORAGE_KEYS.FORM_FIELDS, JSON.stringify(fields))
}

export const loadCompanySettings = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS)
  if (!raw) return DEFAULT_COMPANY_SETTINGS

  try {
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_COMPANY_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_COMPANY_SETTINGS
  }
}

export const saveCompanySettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(settings))
}

export const loadSession = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed?.isAuthenticated ? parsed : null
  } catch {
    return null
  }
}

export const saveSession = (session) => {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
}

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.SESSION)
}
