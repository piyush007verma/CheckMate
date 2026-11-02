// Rule-based compatibility score (0-100). Used always; Gemini only adds an explanation.
// Weights: budget 30, location 25, sharing type 15, lifestyle 30.
export const DEFAULT_PREFS = {
  city: 'Mohali', locality: '', budgetMin: 5000, budgetMax: 12000,
  sharing: 'Any', sleep: 'flexible', smoking: 'no', diet: 'any', social: 'balanced',
}

const LABELS = { early: 'early riser', night: 'night owl', flexible: 'flexible sleeper', quiet: 'quiet', balanced: 'balanced', social: 'social' }

export function scoreMatch(me, r) {
  const good = [], concerns = []

  // Budget (30)
  const lo = Math.max(me.budgetMin, r.budget_min)
  const hi = Math.min(me.budgetMax, r.budget_max)
  let budget = 0
  if (hi >= lo) {
    const span = Math.max(1, Math.min(me.budgetMax - me.budgetMin, r.budget_max - r.budget_min))
    budget = Math.round(20 + 10 * Math.min(1, (hi - lo) / span))
    good.push('Budgets overlap')
  } else if (lo - hi <= 2000) {
    budget = 8
    concerns.push('Budgets are slightly apart')
  } else concerns.push('Budgets do not overlap')

  // Location (25)
  let location = 0
  const sameCity = me.city && me.city.toLowerCase() === r.city.toLowerCase()
  if (sameCity) {
    location += 15
    good.push(`Both looking in ${r.city}`)
    const a = me.locality.trim().toLowerCase(), b = r.locality.toLowerCase()
    if (a && (b.includes(a) || a.includes(b))) { location += 10; good.push(`Same area (${r.locality})`) }
  } else concerns.push(`Different city (${r.city})`)

  // Sharing type (15)
  let sharing = 0
  if (me.sharing === 'Any' || me.sharing === r.sharing_type) { sharing = 15; good.push(`Both open to: ${r.sharing_type.toLowerCase()}`) }
  else { sharing = 4; concerns.push(`Prefers ${r.sharing_type.toLowerCase()}`) }

  // Lifestyle (30)
  let lifestyle = 0
  if (me.sleep === r.sleep) { lifestyle += 8; good.push(`Both ${LABELS[r.sleep]}s`.replace('flexible sleepers', 'flexible sleepers')) }
  else if (me.sleep === 'flexible' || r.sleep === 'flexible') lifestyle += 5
  else concerns.push('Different sleep schedules')

  if (me.smoking === r.smoking) { lifestyle += 8; if (r.smoking === 'no') good.push('Both non-smoking') }
  else concerns.push('Smoking preferences differ')

  if (me.diet === 'any' || r.diet === 'any' || me.diet === r.diet) { lifestyle += 6; good.push('Compatible food habits') }
  else { lifestyle += 2; concerns.push('Different food habits') }

  if (me.social === r.social) { lifestyle += 8; good.push(`Both ${LABELS[r.social]} at home`) }
  else if (me.social === 'balanced' || r.social === 'balanced') lifestyle += 4
  else concerns.push('Different social styles')

  const score = Math.min(100, budget + location + sharing + lifestyle)
  return { score, good, concerns, breakdown: { budget, location, sharing, lifestyle } }
}

export function rankMatches(me, roommates) {
  return roommates.map((r) => ({ roommate: r, ...scoreMatch(me, r) })).sort((a, b) => b.score - a.score)
}

export function explainRule(r, m) {
  const g = m.good.slice(0, 3).join(', ').toLowerCase()
  const c = m.concerns.slice(0, 2).join(', ').toLowerCase()
  let t = `${r.display_name} is a ${m.score}% match.`
  if (g) t += ` Strengths: ${g}.`
  if (c) t += ` Worth discussing: ${c}.`
  return t
}

export function summaryRule(ranked) {
  const top = ranked.slice(0, 3)
  if (top.length === 0) return 'No profiles to compare yet.'
  const names = top.map((m) => `${m.roommate.display_name} (${m.score}%)`).join(', ')
  return `Your strongest matches are ${names}. ${explainRule(top[0].roommate, top[0])}`
}
