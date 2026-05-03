'use client'

import { useState, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (lat: number, lng: number, address: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

interface Suggestion {
  placePrediction: {
    placeId: string
    text: { text: string }
  }
}

export default function PlacesInput({ value, onChange, onPlaceSelect, placeholder, style }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchSuggestions(input: string) {
    if (!input || input.length < 2) { setSuggestions([]); setOpen(false); return }
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setOpen(true)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSelect(suggestion: Suggestion) {
    const text = suggestion.placePrediction.text.text
    const placeId = suggestion.placePrediction.placeId
    onChange(text)
    setSuggestions([])
    setOpen(false)
    try {
      const res = await fetch(`/api/places?placeId=${placeId}`)
      const data = await res.json()
      if (data.location) {
        onPlaceSelect(data.location.latitude, data.location.longitude, text)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChange(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fetchSuggestions(v), 300)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        placeholder={placeholder || 'π.χ. Γλυφάδα, Αθήνα'}
        style={style || {
          width: '100%', padding: '10px 14px',
          border: '1.5px solid var(--gray-m)',
          borderRadius: 'var(--rs)', fontSize: '14px',
          outline: 'none', fontFamily: 'inherit'
        }}
        autoComplete="off"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--gray-m)',
          borderRadius: 'var(--rs)', boxShadow: '0 4px 16px rgba(0,0,0,.12)',
          zIndex: 9999, maxHeight: '200px', overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(s)}
              style={{ padding: '10px 14px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid var(--gray-m)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-l)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              📍 {s.placePrediction.text.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}