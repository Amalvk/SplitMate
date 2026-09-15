import { useRef } from 'react'
import { cn } from '@/utils/cn'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export function OtpInput({ length = 6, value, onChange, disabled, error }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  function setDigit(index: number, digit: string) {
    const chars = value.split('')
    chars[index] = digit
    const next = chars.join('').slice(0, length)
    onChange(next)
    if (digit && index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      e.preventDefault()
      onChange(pasted)
      refs.current[Math.min(pasted.length, length - 1)]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ''}
          onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={cn(
            'h-12 w-10 sm:h-14 sm:w-12 rounded-lg border text-center text-xl font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-background',
            error ? 'border-destructive' : 'border-input',
          )}
        />
      ))}
    </div>
  )
}
