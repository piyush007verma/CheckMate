import { supabase, isSupabaseConfigured } from './supabase.js'

const BUCKET = 'property-images'

// Demo mode: shrink to a JPEG data URL so it fits in localStorage.
function fileToDataUrl(file, maxW = 720, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const im = new Image()
      im.onerror = reject
      im.onload = () => {
        const scale = Math.min(1, maxW / im.width)
        const c = document.createElement('canvas')
        c.width = Math.round(im.width * scale)
        c.height = Math.round(im.height * scale)
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      im.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Returns an array of image URLs. Uses Supabase Storage when configured (UNTESTED until Phase 4), else data URLs.
export async function uploadPropertyImages(files, ownerId) {
  if (isSupabaseConfigured) {
    const urls = []
    for (const file of files) {
      const safe = file.name.replace(/[^\w.-]/g, '_')
      const path = `${ownerId}/${crypto.randomUUID()}-${safe}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
      if (error) throw error
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
    }
    return urls
  }
  return Promise.all(files.map((f) => fileToDataUrl(f)))
}
