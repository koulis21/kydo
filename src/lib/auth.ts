// Lockout system
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

export function getLock() {
  try { return JSON.parse(localStorage.getItem('kydo_lock') || '{}') } catch { return {} }
}
export function isLocked(): boolean {
  const d = getLock()
  if (!d.until) return false
  if (Date.now() < d.until) return true
  localStorage.removeItem('kydo_lock')
  return false
}
export function remainingLock(): number {
  const d = getLock()
  return Math.max(0, Math.ceil((d.until - Date.now()) / 1000))
}
export function recordFail(): number {
  const d = getLock()
  const a = (d.attempts || 0) + 1
  localStorage.setItem('kydo_lock', JSON.stringify(
    a >= MAX_ATTEMPTS ? { attempts: a, until: Date.now() + LOCK_MS } : { attempts: a }
  ))
  return a
}
export function clearLock() {
  localStorage.removeItem('kydo_lock')
}
export function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  return m > 0 ? m + 'λ' : s + 'δ.'
}

// Password validation
export function isPwValid(v: string): boolean {
  return v.length >= 8 &&
    /[A-Z]/.test(v) &&
    /[0-9]/.test(v) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)
}

// Turnstile verification (server-side)
export async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  })
  const data = await res.json()
  return data.success === true
}

// Color & initials helpers
export function strToColor(s: string): string {
  const c = ['#0f6e56','#185fa5','#854f0b','#7a3060','#3b6d11','#6050b0','#b06a00','#2d6a8a']
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return c[Math.abs(h) % c.length]
}
export function getInitials(n: string): string {
  return (n || '').split(' ').map(x => x[0] || '').join('').toUpperCase().substring(0, 2) || '?'
}

// Distance calculation
export function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dL = (lat2 - lat1) * Math.PI / 180
  const dG = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dG/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Days helper
export const DAYS = ['Δε','Τρ','Τε','Πε','Πα','Σα','Κυ']
export function parseDays(days: string[]): number[] {
  if (!Array.isArray(days)) return [0,0,0,0,0,0,0]
  const m: Record<string,number> = {'Δε':0,'Τρ':1,'Τε':2,'Πε':3,'Πα':4,'Σα':5,'Κυ':6}
  const r = [0,0,0,0,0,0,0]
  days.forEach(d => { if (m[d] !== undefined) r[m[d]] = 1 })
  return r
}