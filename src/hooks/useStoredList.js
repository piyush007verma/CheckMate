import { useEffect, useState, useCallback } from 'react'

const EVT = 'rentnest:storage'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}

// Shared localStorage-backed list of ids, kept in sync across components and tabs.
export function useStoredList(key, max = Infinity) {
  const [list, setList] = useState(() => read(key))

  useEffect(() => {
    const sync = () => setList(read(key))
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [key])

  // Returns false if the list is full and the id could not be added.
  const toggle = useCallback((id) => {
    const cur = read(key)
    let next
    if (cur.includes(id)) next = cur.filter((x) => x !== id)
    else {
      if (cur.length >= max) return false
      next = [...cur, id]
    }
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* storage unavailable */ }
    window.dispatchEvent(new Event(EVT))
    return true
  }, [key, max])

  const clear = useCallback(() => {
    try { localStorage.setItem(key, '[]') } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT))
  }, [key])

  return { list, toggle, clear, has: (id) => list.includes(id) }
}

export const useFavorites = () => useStoredList('rentnest_favorites')
export const useCompare = () => useStoredList('rentnest_compare', 3)
