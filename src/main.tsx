import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Élément #root introuvable")

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker (PWA/offline) : uniquement en production. En dev il
// mettrait en cache des assets intermédiaires et perturberait le HMR.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* SW indisponible (contexte non sécurisé, serveur statique…) */
    })
  })
}
