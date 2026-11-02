import { parseJsonLoose } from './parseSearch.js'
import { askGemini } from '../../lib/gemini.js'

// Rule-based picks: score by saved favourites (category, budget, city), then current filters.
export function ruleRecommend(properties, favIds, filters = {}, n = 3) {
  const favs = properties.filter((p) => favIds.includes(p.id))
  const catCount = {}; const cityCount = {}
  favs.forEach((p) => { catCount[p.category] = (catCount[p.category] || 0) + 1; cityCount[p.city] = (cityCount[p.city] || 0) + 1 })
  const topCat = filters.category || Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const avg = favs.length ? favs.reduce((s, p) => s + p.monthly_rent, 0) / favs.length : 0
  const budget = filters.maxRent && filters.maxRent < 60000 ? filters.maxRent : avg * 1.15

  return properties
    .filter((p) => p.available && !favIds.includes(p.id))
    .map((p) => {
      let score = 0; const why = []
      if (topCat && p.category === topCat) { score += 40; why.push(filters.category ? 'matches your chosen category' : 'is similar to places you saved') }
      if (topCity && p.city === topCity) { score += 25; why.push(`is in ${p.city}, where you saved`) }
      if (budget) {
        if (p.monthly_rent <= budget) { score += 25 - Math.min(15, Math.round((budget - p.monthly_rent) / budget * 20)); why.push('fits your budget range') }
        else score -= 20
      }
      score += Math.min(10, (p.amenities?.length || 0))
      return { property: p, score, reason: why.length ? `Picked because it ${why.slice(0, 2).join(' and ').replace(/^matches/, 'matches')}.` : 'A popular available listing to get you started.' }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

export async function getPicks(properties, favIds, filters) {
  const rule = ruleRecommend(properties, favIds, filters)
  const slim = properties.filter((p) => p.available).slice(0, 25).map((p) => ({
    id: p.id, title: p.title, city: p.city, category: p.category, type: p.property_type, rent: p.monthly_rent, bedrooms: p.bedrooms, amenities: p.amenities,
  }))
  const prefs = {
    saved: properties.filter((p) => favIds.includes(p.id)).map((p) => ({ title: p.title, city: p.city, category: p.category, rent: p.monthly_rent })),
    category: filters.category || null, maxRent: filters.maxRent || null,
  }
  const ai = await askGemini('recommend', { preferences: prefs, listings: slim })
  if (ai.ok) {
    const parsed = parseJsonLoose(ai.text)
    if (Array.isArray(parsed)) {
      const picks = parsed.map((x) => {
        const property = properties.find((p) => String(p.id) === String(x?.id))
        return property && !favIds.includes(property.id) ? { property, reason: String(x.reason || '').slice(0, 220) || 'Recommended for you.' } : null
      }).filter(Boolean).slice(0, 3)
      if (picks.length) return { picks, source: 'Gemini' }
    }
  }
  return { picks: rule, source: 'rule-based' }
}

// Description summary. Fallback = first two sentences.
export async function summarizeDescription(text) {
  const ai = await askGemini('summarize', { description: text })
  if (ai.ok && ai.text.trim()) return { text: ai.text.trim(), source: 'Gemini' }
  const sentences = String(text).match(/[^.!?]+[.!?]+/g) || [String(text)]
  return { text: sentences.slice(0, 2).join(' ').trim(), source: 'rule-based' }
}
