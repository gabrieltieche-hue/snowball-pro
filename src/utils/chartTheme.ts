export function chartTheme(darkMode: boolean) {
  return {
    grid: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)",
    // tick aligné sur --color-text-dim (WCAG AA 4.5:1) dans les deux thèmes
    tick: darkMode ? "#A39A8C" : "#6B7280",
    text: darkMode ? "#F5F0E8" : "#1F2937",
    // Palette unifiée avec CapitalAllocation (v6.10) : avant, le camembert
    // utilisait un gris acier et un or différents des courbes — mêmes
    // concepts (épargné/gains), deux couleurs. gainsAlt reste la variante
    // « euros d'aujourd'hui » et sert aussi de couleur texte profonde pour
    // les labels de fin (AA 4.5:1 sur ivoire).
    // v8 — courbes « excitantes » : or plus saturé/vif en clair (#a67c00 au
    // lieu du #996f09 boueux de la capture), glow assorti pour le halo.
    gains: darkMode ? "#F0C443" : "#a67c00",
    gainsAlt: darkMode ? "#B8960F" : "#7a5807",
    invested: darkMode ? "#a8b2c0" : "#5f6b7a",
    tax: darkMode ? "#F09292" : "#B04545",
    glowGains: darkMode ? "rgba(240,196,67,0.45)" : "rgba(166,124,0,0.35)",
    glowInvested: darkMode ? "rgba(168,178,192,0.25)" : "rgba(95,107,122,0.22)",
  }
}
