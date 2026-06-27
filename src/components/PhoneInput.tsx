// Reusable phone input with fixed +234 prefix.
// User types only the local digits — leading 0 is stripped automatically.
// onChange always returns a full E.164 string (+2348012345678) or empty string.

interface PhoneInputProps {
  value: string
  onChange: (e164: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  // Pass the same className you'd give to the <input> itself
  inputClassName?: string
  // Pass a custom prefix badge className (defaults to the dark card style)
  prefixClassName?: string
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '801 234 5678',
  required,
  disabled,
  inputClassName = 'input',
  prefixClassName,
}: PhoneInputProps) {
  // Derive the local portion to display (strip +234 or 234 or leading 0)
  const local = value.startsWith('+234')
    ? value.slice(4)
    : value.startsWith('234') && value.length > 3
      ? value.slice(3)
      : value.startsWith('0')
        ? value.slice(1)
        : value

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Keep only digit characters
    let digits = e.target.value.replace(/\D/g, '')
    // If user typed a leading 0 (local format), drop it
    if (digits.startsWith('0')) digits = digits.slice(1)
    onChange(digits ? `+234${digits}` : '')
  }

  const badgeClass = prefixClassName ??
    'flex items-center px-3 rounded-xl text-sm font-medium shrink-0 bg-white/04 border border-white/06 text-muted-foreground'

  return (
    <div className="flex gap-2">
      <span className={badgeClass}>+234</span>
      <input
        className={inputClassName}
        type="tel"
        inputMode="numeric"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  )
}

// Normalise a block of raw phone text (one per line or comma-separated)
// into E.164 numbers. Handles:
//   08012345678  →  +2348012345678
//   8012345678   →  +2348012345678
//   +2348012345678  →  +2348012345678 (unchanged)
export function normalizePhoneList(raw: string): { phoneNumber: string }[] {
  return raw
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const digits = s.replace(/\D/g, '')
      let e164: string
      if (digits.startsWith('234') && digits.length >= 13) e164 = `+${digits}`
      else if (digits.startsWith('0') && digits.length === 11) e164 = `+234${digits.slice(1)}`
      else if (digits.length === 10) e164 = `+234${digits}`
      else e164 = s // return as-is — backend will reject invalid
      return { phoneNumber: e164 }
    })
}
