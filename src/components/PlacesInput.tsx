'use client'

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (lat: number, lng: number, address: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export default function PlacesInput({ value, onChange, placeholder, style }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'π.χ. Γλυφάδα, Αθήνα'}
      style={style || { width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
      autoComplete="off"
    />
  )
}