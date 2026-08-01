import { useEffect } from "react"

const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0

interface UseKeyboardShortcutsOptions {
  onUndo: () => void
  onRedo: () => void
  onToggleDarkMode: () => void
}

export function useKeyboardShortcuts({ onUndo, onRedo, onToggleDarkMode }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      if (isInput) return

      const mod = isMac ? e.metaKey : e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault()
        onUndo()
      }
      if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault()
        onRedo()
      }
      if (mod && key === "d") {
        e.preventDefault()
        onToggleDarkMode()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onUndo, onRedo, onToggleDarkMode])
}
