import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../hooks/useStoredList.js'
import { supabase, isSupabaseConfigured } from './supabase.js'
import { readJSON, writeJSON } from './localStore.js'
import { isUuid } from '../features/owner/listingsApi.js'

const KEY = 'rentnest_favorites'

// Mirrors favourites to the Supabase `favorites` table (real uuid properties, signed-in users only).
// Renders nothing. In demo mode (no Supabase) favourites stay in localStorage.
export default function FavoritesSync() {
  const { user } = useAuth()
  const fav = useFavorites()
  const remote = useRef(null) // Set of property ids known to be on the server
  const uid = user?.id

  // On login: pull server favourites and merge them into local storage.
  useEffect(() => {
    remote.current = null
    if (!isSupabaseConfigured || !uid) return undefined
    let dead = false
    supabase.from('favorites').select('property_id').eq('user_id', uid).then(({ data, error }) => {
      if (dead || error) return
      const ids = (data || []).map((r) => r.property_id)
      remote.current = new Set(ids)
      const local = readJSON(KEY, [])
      const merged = [...new Set([...local, ...ids])]
      if (merged.length !== local.length) writeJSON(KEY, merged)
    })
    return () => { dead = true }
  }, [uid])

  // On change: push additions and removals.
  useEffect(() => {
    if (!isSupabaseConfigured || !uid || !remote.current) return
    const want = new Set(fav.list.filter(isUuid))
    const have = remote.current
    const add = [...want].filter((x) => !have.has(x))
    const del = [...have].filter((x) => !want.has(x))
    if (!add.length && !del.length) return
    remote.current = want
    if (add.length) supabase.from('favorites').insert(add.map((property_id) => ({ user_id: uid, property_id }))).then(({ error }) => { if (error) console.error(error) })
    if (del.length) supabase.from('favorites').delete().eq('user_id', uid).in('property_id', del).then(({ error }) => { if (error) console.error(error) })
  }, [fav.list, uid])

  return null
}
