import { useCallback, useRef, useState } from "react"
import { createHistory, pushHistory, redoHistory, undoHistory } from "../engine"
import type { HistoryScenario, HistoryStack } from "../engine"
import type { SimulationInputs } from "../types"

export function useHistory() {
  const [stack, setStack] = useState<HistoryStack>(createHistory)
  const stackRef = useRef<HistoryStack>(stack)

  const record = useCallback(
    (previousInputs: SimulationInputs, patch: Partial<SimulationInputs>, scenario: HistoryScenario) => {
      const next = pushHistory(stackRef.current, previousInputs, patch, scenario)
      stackRef.current = next
      setStack(next)
    },
    [],
  )

  const undo = useCallback(() => {
    const result = undoHistory(stackRef.current)
    if (!result) return null
    stackRef.current = result.stack
    setStack(result.stack)
    return { patch: result.patch, scenario: result.scenario }
  }, [])

  const redo = useCallback(() => {
    const result = redoHistory(stackRef.current)
    if (!result) return null
    stackRef.current = result.stack
    setStack(result.stack)
    return { patch: result.patch, scenario: result.scenario }
  }, [])

  return {
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
    record,
    undo,
    redo,
  }
}
