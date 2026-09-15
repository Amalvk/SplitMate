const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const inrFormatterWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Convert a rupee amount (e.g. from a form input) to integer paise. */
export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * 100)
}

/** Convert integer paise to a rupee float, for display/computation only — never for further paise math. */
export function minorToRupees(minor: number): number {
  return minor / 100
}

/** Format integer paise as an INR currency string, e.g. ₹2,400.50 */
export function formatINR(minor: number, opts?: { whole?: boolean }): string {
  const rupees = minorToRupees(minor)
  return opts?.whole ? inrFormatterWhole.format(rupees) : inrFormatter.format(rupees)
}

/** Parse a free-text rupee amount ("1,200", "1200.50", "₹500") into integer paise, or null if invalid. */
export function parseRupeesInput(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '')
  if (cleaned === '' || Number.isNaN(Number(cleaned))) return null
  const value = Number(cleaned)
  if (value < 0) return null
  return rupeesToMinor(value)
}

/**
 * Distribute `totalMinor` across `weights` (proportional shares) using the largest-remainder
 * method, guaranteeing the results sum to exactly totalMinor with no floating-point drift.
 */
export function distributeByWeight(totalMinor: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights)
  const totalWeight = ids.reduce((sum, id) => sum + weights[id], 0)
  if (totalWeight <= 0) return Object.fromEntries(ids.map((id) => [id, 0]))

  const raw = ids.map((id) => ({ id, exact: (totalMinor * weights[id]) / totalWeight }))
  const floors = raw.map((r) => ({ id: r.id, floor: Math.floor(r.exact), remainder: r.exact - Math.floor(r.exact) }))

  let allocated = floors.reduce((sum, f) => sum + f.floor, 0)
  let leftover = totalMinor - allocated

  const byRemainderDesc = [...floors].sort((a, b) => b.remainder - a.remainder)
  const result: Record<string, number> = {}
  for (const f of floors) result[f.id] = f.floor

  for (let i = 0; i < byRemainderDesc.length && leftover > 0; i++, leftover--) {
    result[byRemainderDesc[i].id] += 1
  }

  return result
}

/** Split totalMinor evenly across participantIds, assigning leftover paise to the first participants in order. */
export function distributeEqually(totalMinor: number, participantIds: string[]): Record<string, number> {
  const n = participantIds.length
  if (n === 0) return {}
  const base = Math.floor(totalMinor / n)
  let leftover = totalMinor - base * n
  const result: Record<string, number> = {}
  for (const id of participantIds) {
    result[id] = base + (leftover > 0 ? 1 : 0)
    if (leftover > 0) leftover--
  }
  return result
}
