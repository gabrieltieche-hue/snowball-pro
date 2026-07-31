import { useEffect } from "react"
import { useSimulationStore } from "../store"

const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0

export function useKeyboardShortcuts() {
  const undo = useSimulationStore(s => s.undo)
  const redo = useSimulationStore(s => s.redo)
  const toggleDarkMode = useSimulationStore(s => s.toggleDarkMode)

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
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      if (mod && e.key === "d") {
        e.preventDefault()
        toggleDarkMode()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, toggleDarkMode])
}
