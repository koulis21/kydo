'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (lat: number, lng: number, address: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

declare global {
  interface Window { google: any }
}

export default function PlacesInput({ value, onChange, onPlaceSelect, placeholder, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (document.getElementById('google-maps-script')) {
      setReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&language=el&region=GR&loading=async`
    script.async = true
    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google) return
    if (containerRef.current.querySelector('gmp-place-autocomplete')) return

    const el = document.createElement('gmp-place-autocomplete') as any
    el.setAttribute('country', 'gr')
    el.setAttribute('language', 'el')
    el.style.width = '100%'

    const input = document.createElement('input')
    input.placeholder = placeholder || 'π.χ. Γλυφάδα, Αθήνα'
    input.value = value
    input.style.cssText = 'width:100%;padding:10px 14px;border:1.5px solid var(--gray-m);border-radius:var(--rs);font-size:14px;outline:none;font-family:inherit'
    input.addEventListener('input', e => onChange((e.target as HTMLInputElement).value))
    el.appendChild(input)

    el.addEventListener('gmp-placeselect', async (e: any) => {
      const place = e.placePrediction.toPlace()
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
      const lat = place.location.lat()
      const lng = place.location.lng()
      const address = place.formattedAddress || place.displayName || ''
      onChange(address)
      onPlaceSelect(lat, lng, address)
    })

    containerRef.current.appendChild(el)
  }, [ready])

  return <div ref={containerRef} style={{ width: '100%' }} />
}