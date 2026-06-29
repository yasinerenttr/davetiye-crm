import { createClient } from '@supabase/supabase-js'
import { loadCompanySettings } from './storage'

export const getSupabaseClient = () => {
  const settings = loadCompanySettings()
  
  if (!settings.supabaseUrl || !settings.supabaseKey) {
    return null
  }

  return createClient(settings.supabaseUrl, settings.supabaseKey)
}

export const uploadPdfToSupabase = async (pdfBlob, fileName) => {
  const settings = loadCompanySettings()
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase ayarlari eksik. Lutfen ayarlardan Supabase URL ve Key giriniz.')
  }

  const bucketName = settings.supabaseBucket || 'teklifler'
  const filePath = `${Date.now()}_${fileName}`

  // 1. Upload the file
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (error) {
    throw new Error(`Supabase yukleme hatasi: ${error.message}`)
  }

  // 2. Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

export const fetchSocialLinks = async () => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('settings')
    .select('instagram_url, tiktok_url, facebook_url, whatsapp_url')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Supabase fetch error:', error.message)
    return null
  }
  return data
}

export const updateSocialLinks = async (links) => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('settings')
    .update({
      instagram_url: links.instagram || null,
      tiktok_url: links.tiktok || null,
      facebook_url: links.facebook || null,
      whatsapp_url: links.whatsapp || null
    })
    .eq('id', 1)

  if (error) {
    console.error('Supabase update error:', error.message)
    return false
  }
  return true
}
