// Tiny localStorage JSON helpers. writeJSON notifies same-tab listeners via a custom event.
export const STORAGE_EVENT = 'rentnest:storage'

export function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v ?? fallback
  } catch { return fallback }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(STORAGE_EVENT))
    return true
  } catch { return false } // quota exceeded or storage blocked
}

// Fired after remote (Supabase) writes so data hooks refetch.
export const DATA_EVENT = 'rentnest:data'
export const notifyDataChanged = () => window.dispatchEvent(new Event(DATA_EVENT))
