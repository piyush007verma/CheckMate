// Roommate profile data access. Supabase when configured, localStorage demo otherwise.
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js'
import { readJSON, writeJSON, notifyDataChanged } from '../../lib/localStore.js'

const KEY = 'rentnest_my_roommate'
const FIELDS = ['display_name', 'age', 'occupation', 'city', 'locality', 'budget_min', 'budget_max', 'sharing_type', 'sleep', 'smoking', 'diet', 'social', 'bio', 'move_in']

export async function getMyProfile(user) {
  if (!user) return null
  if (isSupabaseConfigured) {
    const { data } = await supabase.from('roommate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    return data || null
  }
  const mine = readJSON(KEY, null)
  return mine && mine.user_id === user.id ? mine : null
}

// Returns { ok, error? }
export async function saveMyProfile(user, form) {
  const row = {}
  FIELDS.forEach((f) => { row[f] = form[f] === '' ? null : form[f] })
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('roommate_profiles').upsert({ ...row, user_id: user.id, is_active: true }, { onConflict: 'user_id' })
    if (error) return { ok: false, error: error.message }
    notifyDataChanged()
    return { ok: true }
  }
  const ok = writeJSON(KEY, { ...row, id: 'mine', user_id: user.id })
  return ok ? { ok: true } : { ok: false, error: 'Could not save in this browser (storage full or blocked).' }
}

export async function deleteMyProfile(user) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('roommate_profiles').delete().eq('user_id', user.id)
    if (!error) notifyDataChanged()
    return !error
  }
  try { localStorage.removeItem(KEY) } catch { return false }
  window.dispatchEvent(new Event('rentnest:storage'))
  return true
}

// Other people's profiles from Supabase (own profile excluded). Empty array if none / not configured.
export async function listRemoteRoommates(userId) {
  if (!isSupabaseConfigured) return []
  let q = supabase.from('roommate_profiles').select('*').eq('is_active', true).order('created_at', { ascending: false })
  if (userId) q = q.neq('user_id', userId)
  const { data, error } = await q
  return error ? [] : data.map((r) => ({ ...r, locality: r.locality || '', occupation: r.occupation || 'Not specified', age: r.age || '' }))
}
