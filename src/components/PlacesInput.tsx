'use client'

import { useEffect, useState } from 'react'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (lat: number, lng: number, address: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

declare global {
  interface Window { google: any }
}

function PlacesInputInner({ value, onChange, onPlaceSelect, placeholder, style }: Props) {
  const { ready, suggestions: { status, data }, setValue, clearSuggestions } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'gr' } },
    debounce: 300,
  })

  const [open, setOpen] = useState(false)

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChange(v)
    setValue(v)
    setOpen(true)
  }

  async function handleSelect(description: string) {
    setValue(description, false)
    clearSuggestions()
    onChange(description)
    setOpen(false)
    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = await getLatLng(results[0])
      onPlaceSelect(lat, lng, description)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder={placeholder || 'π.χ. Γλυφάδα, Αθήνα'}
        style={style || { width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && status === 'OK' && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--gray-m)',
          borderRadius: 'var(--rs)', boxShadow: 'var(--shadow)',
          zIndex: 9999, maxHeight: '200px', overflowY: 'auto',
        }}>
          {data.map(({ place_id, description }) => (
            <div
              key={place_id}
              onMouseDown={() => handleSelect(description)}
              style={{ padding: '10px 14px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid var(--gray-m)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-l)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              {description}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PlacesInput(props: Props) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (window.google) { setLoaded(true); return }
    if (document.getElementById('google-maps-script')) {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); setLoaded(true) }
      }, 100)
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&language=el&region=GR`
    script.async = true
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  if (!loaded) return (
    <input
      type="text"
      placeholder={props.placeholder || 'π.χ. Γλυφάδα, Αθήνα'}
      style={props.style || { width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
      onChange={e => props.onChange(e.target.value)}
      value={props.value}
    />
  )

  return <PlacesInputInner {...props} />
}