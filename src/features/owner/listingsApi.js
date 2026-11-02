// Listing + enquiry data access. Supabase when configured, localStorage demo otherwise.
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js'
import { readJSON, writeJSON, notifyDataChanged } from '../../lib/localStore.js'

const KEY = 'rentnest_demo_listings'
const ENQ = 'rentnest_demo_enquiries'

export const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s))
const getLocal = () => readJSON(KEY, [])

// Returns true on success, false on failure.
export async function saveListing(property) {
  if (isSupabaseConfigured) {
    const { id, created_at, ...row } = property // eslint-disable-line no-unused-vars
    const write = (r) => (isUuid(id) ? supabase.from('properties').update(r).eq('id', id) : supabase.from('properties').insert(r))
    let { error } = await write(row)
    // Older databases may not have the newer `pg_for` column yet (re-run supabase/schema.sql). Save without it rather than failing.
    if (error && /pg_for/.test(`${error.message} ${error.details || ''}`)) {
      const { pg_for, ...rest } = row // eslint-disable-line no-unused-vars
      ;({ error } = await write(rest))
    }
    if (error) { console.error(error); return false }
    notifyDataChanged()
    return true
  }
  const list = getLocal()
  const i = list.findIndex((p) => p.id === property.id)
  if (i >= 0) list[i] = property
  else list.unshift(property)
  return writeJSON(KEY, list)
}

// Listings added in demo mode have ids like "local-123" (not uuids), so they live in localStorage even when Supabase is on.
// Returns true only if something was really deleted.
export async function deleteListing(id) {
  if (isSupabaseConfigured && isUuid(id)) {
    // .select() returns the deleted rows, so a delete blocked by RLS (0 rows, no error) is not reported as success.
    const { data, error } = await supabase.from('properties').delete().eq('id', id).select('id')
    if (error) { console.error(error); return false }
    if (!data || data.length === 0) return false
    notifyDataChanged()
    return true
  }
  const before = getLocal()
  if (!before.some((p) => p.id === id)) return false
  return writeJSON(KEY, before.filter((p) => p.id !== id))
}

export async function setAvailability(id, available) {
  if (isSupabaseConfigured && isUuid(id)) {
    const { data, error } = await supabase.from('properties').update({ available }).eq('id', id).select('id')
    if (error || !data?.length) return false
    notifyDataChanged()
    return true
  }
  return writeJSON(KEY, getLocal().map((p) => (p.id === id ? { ...p, available } : p)))
}

// Send an enquiry. Real DB only for real (uuid) properties; demo properties always use local storage.
// Returns { ok, remote, enquiry } where enquiry is what the chat needs (id, sender_id, owner_id, message, status, created_at).
export async function submitEnquiry(property, form, user) {
  if (isSupabaseConfigured && isUuid(property.id)) {
    if (!user) return { ok: false, needsLogin: true }
    const { data, error } = await supabase.from('enquiries').insert({
      property_id: property.id, sender_id: user.id, name: form.name, phone: form.phone, message: form.message || null,
    }).select('id, property_id, sender_id, name, phone, message, status, created_at').single()
    if (error) { console.error(error); return { ok: false, remote: true } }
    return { ok: true, remote: true, enquiry: { ...data, owner_id: property.owner_id, property_title: property.title } }
  }
  const enquiry = {
    id: `enq-${Date.now()}`, property_id: property.id, property_title: property.title, owner_id: property.owner_id, sender_id: user?.id || null,
    ...form, status: 'new', created_at: new Date().toISOString(),
  }
  const list = readJSON(ENQ, [])
  list.unshift(enquiry)
  return { ok: writeJSON(ENQ, list), remote: false, enquiry }
}

const localEnquiries = () => readJSON(ENQ, [])

// Enquiries received by the owner. Includes demo (local) enquiries so sample/demo listings still work when Supabase is on.
export async function getEnquiries(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('enquiries')
      .select('id, property_id, sender_id, name, phone, message, status, created_at, properties(title, owner_id)')
      .order('created_at', { ascending: false })
    const remote = error ? [] : data
      .filter((e) => e.properties?.owner_id === userId) // RLS also returns enquiries the user sent
      .map((e) => ({ ...e, owner_id: e.properties.owner_id, property_title: e.properties?.title || 'Property' }))
    return [...remote, ...localEnquiries().filter((e) => e.owner_id === userId)]
  }
  return localEnquiries()
}

export async function setEnquiryStatus(id, status) {
  if (isSupabaseConfigured && isUuid(id)) {
    const { error } = await supabase.from('enquiries').update({ status }).eq('id', id)
    if (!error) notifyDataChanged()
    return !error
  }
  return writeJSON(ENQ, localEnquiries().map((e) => (e.id === id ? { ...e, status } : e)))
}

// Enquiries the signed-in user has sent (dashboard), remote + local demo ones.
export async function getSentEnquiries(userId) {
  const local = localEnquiries().filter((e) => e.sender_id && e.sender_id === userId)
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('enquiries')
      .select('id, property_id, sender_id, name, phone, message, status, created_at, properties(title, owner_id)')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
    const remote = error ? [] : data.map((e) => ({ ...e, owner_id: e.properties?.owner_id, property_title: e.properties?.title || 'Property' }))
    return [...remote, ...local]
  }
  return local
}
