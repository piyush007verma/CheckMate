import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEMO_PROPERTIES } from '../data/properties.js'
import { readJSON, STORAGE_EVENT, DATA_EVENT } from '../lib/localStore.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const KEY = 'rentnest_demo_listings'

// De-duplicates concurrent fetches from multiple components.
let inflight = null
function fetchRemote() {
  if (!inflight) {
    inflight = supabase.from('properties').select('*').order('created_at', { ascending: false })
      .then((r) => { inflight = null; return r })
  }
  return inflight
}

// Always show everything: online listings (Supabase) + listings added in this browser + the built-in samples, de-duplicated by id.
// Previously, once Supabase had any row the samples were hidden, so adding one listing made all the others "disappear".
export function mergeProperties(remote, local) {
  const seen = new Set()
  const merged = []
  for (const p of [...(remote || []), ...(local || []), ...DEMO_PROPERTIES]) {
    const id = String(p.id)
    if (!seen.has(id)) { seen.add(id); merged.push(p) }
  }
  return merged
}

// Single source for property data.
// Merges Supabase rows (if any), locally added demo listings and the built-in sample listings. New listings are added, never replace.
export function useProperties() {
  const [local, setLocal] = useState(() => readJSON(KEY, []))
  const [remote, setRemote] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return
    try {
      const { data, error } = await fetchRemote()
      setRemote(error ? null : data)
    } catch { setRemote(null) }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const syncLocal = () => setLocal(readJSON(KEY, []))
    window.addEventListener(STORAGE_EVENT, syncLocal)
    window.addEventListener('storage', syncLocal)
    window.addEventListener(DATA_EVENT, load)
    return () => {
      window.removeEventListener(STORAGE_EVENT, syncLocal)
      window.removeEventListener('storage', syncLocal)
      window.removeEventListener(DATA_EVENT, load)
    }
  }, [load])

  return useMemo(() => ({
    properties: mergeProperties(remote, local),
    loading,
    source: remote && remote.length > 0 ? 'supabase' : 'demo',
  }), [local, remote, loading])
}

export function useProperty(id) {
  const { properties } = useProperties()
  return properties.find((p) => String(p.id) === String(id)) || null
}
