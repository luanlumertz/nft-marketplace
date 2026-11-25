import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
export function SessionNotice() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const show = (event: Event) =>
      setMessage((event as CustomEvent<string>).detail)
    window.addEventListener('kurio:notice', show)
    return () => window.removeEventListener('kurio:notice', show)
  }, [])
  if (!message) return null
  return (
    <div
      role="alert"
      className="fixed top-20 left-1/2 z-70 flex w-[min(560px,calc(100%-32px))] -translate-x-1/2 items-start gap-4 rounded-xl border border-primary bg-card p-4 text-sm shadow-lg"
    >
      {message}
      <button
        onClick={() => setMessage('')}
        aria-label="Fechar aviso"
        className="ml-auto shrink-0 text-primary"
      >
        <X size={18} />
      </button>
    </div>
  )
}
