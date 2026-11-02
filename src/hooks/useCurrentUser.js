import { useAuth } from '../context/AuthContext.jsx'

// Returns the signed-in user ({id,name,email,role,demo}) or null.
export function useCurrentUser() {
  return useAuth().user
}
