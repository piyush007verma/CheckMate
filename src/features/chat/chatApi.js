// Chat between a seeker and a property owner, one thread per enquiry.
// Supabase (table `messages`) for real enquiries, localStorage for demo enquiries.
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js'
import { readJSON, writeJSON, STORAGE_EVENT } from '../../lib/localStore.js'
import { isUuid, setEnquiryStatus } from '../owner/listingsApi.js'

const KEY = 'rentnest_demo_messages'
export const MAX_LEN = 2000

// Real thread = Supabase configured AND the enquiry itself lives in the database.
export const isRemoteEnquiry = (enq) => isSupabaseConfigured && isUuid(enq.id)
// Built-in sample listings have no human behind them, so demo threads get a clearly labelled auto-reply.
const isSampleOwner = (enq) => String(enq.owner_id || '').startsWith('demo-owner')

const allLocal = () => readJSON(KEY, [])

// Returns messages oldest-first as { id, role: 'tenant'|'owner', body, created_at, auto? }.
export async function getMessages(enq) {
  if (isRemoteEnquiry(enq)) {
    const { data, error } = await supabase.from('messages').select('id, sender_id, body, created_at').eq('enquiry_id', enq.id).order('created_at', { ascending: true })
    if (error) { console.error(error); return null }
    return data.map((m) => ({ id: m.id, role: m.sender_id === enq.sender_id ? 'tenant' : 'owner', body: m.body, created_at: m.created_at }))
  }
  return allLocal().filter((m) => m.enquiry_id === enq.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

// role: the sender's side of the conversation. Returns { ok, error? }.
export async function sendMessage(enq, role, user, text) {
  const body = String(text || '').trim().slice(0, MAX_LEN)
  if (!body) return { ok: false, error: 'Type a message first.' }
  if (isRemoteEnquiry(enq)) {
    if (!user) return { ok: false, error: 'Please log in to send messages.' }
    const { error } = await supabase.from('messages').insert({ enquiry_id: enq.id, sender_id: user.id, body })
    if (error) { console.error(error); return { ok: false, error: 'Could not send. Please try again.' } }
    if (role === 'owner' && enq.status === 'new') setEnquiryStatus(enq.id, 'contacted')
    return { ok: true }
  }
  const msg = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, enquiry_id: enq.id, role, body, created_at: new Date().toISOString() }
  if (!writeJSON(KEY, [...allLocal(), msg])) return { ok: false, error: 'Could not save the message (browser storage is full or blocked).' }
  if (role === 'owner' && enq.status === 'new') setEnquiryStatus(enq.id, 'contacted')
  if (role === 'tenant' && isSampleOwner(enq)) {
    setTimeout(() => {
      writeJSON(KEY, [...allLocal(), {
        id: `msg-${Date.now()}-auto`, enquiry_id: enq.id, role: 'owner', auto: true, created_at: new Date().toISOString(),
        body: 'Thanks for your message! This is a sample listing, so this reply is automatic. On a real listing the owner would answer here.',
      }])
    }, 1200)
  }
  return { ok: true }
}

// Calls onChange() whenever the thread may have changed. Returns an unsubscribe function.
export function subscribeMessages(enq, onChange) {
  if (isRemoteEnquiry(enq)) {
    const channel = supabase.channel(`messages-${enq.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `enquiry_id=eq.${enq.id}` }, onChange)
      .subscribe()
    const poll = setInterval(onChange, 10000) // fallback if Realtime is not enabled for the table
    return () => { clearInterval(poll); supabase.removeChannel(channel) }
  }
  window.addEventListener(STORAGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => { window.removeEventListener(STORAGE_EVENT, onChange); window.removeEventListener('storage', onChange) }
}
