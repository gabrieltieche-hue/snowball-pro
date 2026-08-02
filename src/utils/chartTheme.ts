export function chartTheme(darkMode: boolean) {
  return {
    grid: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    // tick aligné sur --color-text-dim (WCAG AA 4.5:1) dans les deux thèmes
    tick: darkMode ? "#A39A8C" : "#6B7280",
    text: darkMode ? "#F5F0E8" : "#1F2937",
    gains: darkMode ? "#E6C35C" : "#8A6A00",
    gainsAlt: darkMode ? "#B8960F" : "#7A5C00",
    invested: darkMode ? "#A09888" : "#6B7280",
    tax: darkMode ? "#E08A8A" : "#B04545",
  }
}
