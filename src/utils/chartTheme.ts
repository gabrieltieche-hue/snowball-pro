export function chartTheme(darkMode: boolean) {
  return {
    grid: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    tick: darkMode ? "#7A7265" : "#6B7280",
    text: darkMode ? "#F5F0E8" : "#1F2937",
    gains: darkMode ? "#E6C35C" : "#8A6A00",
    gainsAlt: darkMode ? "#B8960F" : "#7A5C00",
    invested: darkMode ? "#A09888" : "#6B7280",
    tax: darkMode ? "#E08A8A" : "#B04545",
  }
}
