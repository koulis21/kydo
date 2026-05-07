import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limiter — resets per serverless instance lifecycle
// For production-grade limiting across all instances, use Upstash Redis
const rlMap = new Map<string, { count: number; resetAt: number }>()

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function allow(ip: string, limit: number): boolean {
  const now = Date.now()
  const entry = rlMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rlMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = getIP(request)
  if (!allow(ip, 20)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { input } = await request.json()

  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_SERVER_KEY!,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['gr'],
    }),
  })

  const data = await res.json()
  console.log('Places API response:', JSON.stringify(data))
  return NextResponse.json({ suggestions: data.suggestions || [] })
}

export async function GET(request: NextRequest) {
  const ip = getIP(request)
  if (!allow(ip, 10)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('placeId')

  if (!placeId) return NextResponse.json({ error: 'No placeId' }, { status: 400 })

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_SERVER_KEY!,
      'X-Goog-FieldMask': 'location',
    },
  })

  const data = await res.json()
  return NextResponse.json(data)
}