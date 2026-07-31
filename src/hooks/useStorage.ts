import { useEffect, useRef } from "react"
import { useSimulationStore } from "../store"

export function useStorage() {
  const loadFromStorage = useSimulationStore(s => s.loadFromStorage)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadFromStorage()
  }, [loadFromStorage])
}
