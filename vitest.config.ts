import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    // Les tests composants rendent <App /> complet en jsdom : chaque render
    // lance une simulation entière et dépasse le défaut de 5 s (observé
    // jusqu'à ~9 s). Timeout global relevé pour éliminer la flakiness.
    testTimeout: 20000,
  },
})
