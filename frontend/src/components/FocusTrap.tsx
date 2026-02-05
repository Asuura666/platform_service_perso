import { useEffect, useRef, type ReactNode } from 'react'

type FocusTrapProps = {
  active: boolean
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const FocusTrap = ({ active, children }: FocusTrapProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !ref.current) return

    previousFocus.current = document.activeElement as HTMLElement
    const focusable = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !ref.current) return
      const elements = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (elements.length === 0) return

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [active])

  return <div ref={ref}>{children}</div>
}

export default FocusTrap
