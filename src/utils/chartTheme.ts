export function chartTheme(darkMode: boolean) {
  return {
    grid: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.08)",
    // tick aligné sur --color-text-dim (WCAG AA 4.5:1) dans les deux thèmes
    tick: darkMode ? "#A39A8C" : "#6B7280",
    text: darkMode ? "#F5F0E8" : "#1F2937",
    // Palette unifiée avec CapitalAllocation (v6.10) : avant, le camembert
    // utilisait un gris acier et un or différents des courbes — mêmes
    // concepts (épargné/gains), deux couleurs. gainsAlt reste la variante
    // « euros d'aujourd'hui » et sert aussi de couleur texte profonde pour
    // les labels de fin (AA 4.5:1 sur ivoire).
    gains: darkMode ? "#E3B341" : "#996f09",
    gainsAlt: darkMode ? "#B8960F" : "#7a5807",
    invested: darkMode ? "#9aa3af" : "#5f6b7a",
    tax: darkMode ? "#E08A8A" : "#B04545",
  }
}
