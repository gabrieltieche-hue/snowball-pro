import path from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Sécurité : les vulnérabilités connues du dev server (lecture de fichiers
  // arbitraires) ne sont exploitables que si le serveur est joignable depuis
  // le réseau. Restriction au loopback — `npm run dev -- --host 0.0.0.0` pour
  // l'exposer volontairement (non recommandé).
  server: {
    host: "127.0.0.1",
  },
  preview: {
    host: "127.0.0.1",
  },
})
