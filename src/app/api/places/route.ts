import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { input } = await request.json()

  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_KEY!,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['gr'],
      languageCode: 'el',
    }),
  })

  const data = await res.json()
  console.log('Places API response:', JSON.stringify(data))
  return NextResponse.json({ suggestions: data.suggestions || [] })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('placeId')

  if (!placeId) return NextResponse.json({ error: 'No placeId' }, { status: 400 })

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_KEY!,
      'X-Goog-FieldMask': 'location',
    },
  })

  const data = await res.json()
  return NextResponse.json(data)
}