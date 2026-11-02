import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { getMessages, sendMessage, subscribeMessages, MAX_LEN } from './chatApi.js'

const fmtTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// enquiry: enquiry object (id, sender_id, owner_id, message, status, created_at). viewerRole: 'tenant' | 'owner'.
export default function ChatThread({ enquiry, viewerRole, user, title }) {
  const [msgs, setMsgs] = useState(null)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef(null)

  const load = useCallback(async () => { const m = await getMessages(enquiry); if (m) setMsgs(m); else setMsgs((x) => x || []) }, [enquiry])
  useEffect(() => {
    let dead = false
    const refresh = () => { if (!dead) load() }
    refresh()
    const off = subscribeMessages(enquiry, refresh)
    return () => { dead = true; off() }
  }, [enquiry, load])

  // The enquiry's first message is shown as the opening bubble of the thread.
  const all = [
    ...(enquiry.message ? [{ id: 'first', role: 'tenant', body: enquiry.message, created_at: enquiry.created_at }] : []),
    ...(msgs || []),
  ]
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight }, [all.length])

  const send = async (e) => {
    e?.preventDefault()
    if (busy) return
    setBusy(true); setErr('')
    const res = await sendMessage(enquiry, viewerRole, user, text)
    setBusy(false)
    if (!res.ok) return setErr(res.error)
    setText(''); load()
  }
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) send(e) }
  const other = viewerRole === 'owner' ? (enquiry.name || 'the seeker') : 'the owner'

  return (
    <div className="chat" aria-label={title || `Chat with ${other}`}>
      <div className="chat__head"><strong>{title || `Chat with ${other}`}</strong></div>
      <div className="chat__log" ref={logRef} role="log" aria-live="polite">
        {msgs === null ? <p className="muted chat__empty">Loading…</p> : all.length === 0 ? (
          <p className="muted chat__empty">No messages yet. Say hello and ask about availability, visiting time or food.</p>
        ) : all.map((m) => (
          <div key={m.id} className={`chat__msg ${m.role === viewerRole ? 'is-mine' : ''}`}>
            {m.body}
            <span className="chat__meta">{m.auto ? 'Demo auto-reply · ' : ''}{fmtTime(m.created_at)}</span>
          </div>
        ))}
      </div>
      <form className="chat__form" onSubmit={send}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows="1" maxLength={MAX_LEN} placeholder="Write a message…" aria-label="Message" />
        <button className="btn btn--primary" type="submit" disabled={busy || !text.trim()} aria-label="Send message"><Send size={16} /></button>
      </form>
      {err && <p className="warn" role="alert" style={{ margin: '0 12px 10px' }}>{err}</p>}
    </div>
  )
}
