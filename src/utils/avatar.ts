const AVATAR_COLORS = [
  '#0d9488',
  '#2563eb',
  '#a855f7',
  '#eb6834',
  '#d97706',
  '#dc2626',
  '#16a34a',
  '#e11d8f',
  '#0891b2',
  '#7c3aed',
]

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Deterministic color pick so the same name always renders the same avatar color. */
export function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}
