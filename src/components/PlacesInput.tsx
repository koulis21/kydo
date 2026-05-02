'use client'

import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (lat: number, lng: number, address: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
  }
}

export default function PlacesInput({ value, onChange, onPlaceSelect, placeholder, className, style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function initAutocomplete() {
      if (!inputRef.current || !window.google) return
      if (autocompleteRef.current) return

      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'gr' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['geocode'],
      })

      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (place.geometry) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const address = place.formatted_address || place.name || ''
          onPlaceSelect(lat, lng, address)
          onChange(address)
        }
      })

      autocompleteRef.current = ac
    }

    if (window.google) {
      initAutocomplete()
      return
    }

    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,marker&language=el&region=GR&v=beta`
      script.async = true
      script.defer = true
      script.onload = initAutocomplete
      document.head.appendChild(script)
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          initAutocomplete()
        }
      }, 100)
    }
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'π.χ. Γλυφάδα, Αθήνα'}
      className={className || 'form-input'}
      style={style}
      autoComplete="off"
    />
  )
}