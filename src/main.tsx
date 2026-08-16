/// <reference types="vite/client" />

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MotionConfig } from "framer-motion"
import "./index.css"
import Root from "./Root"

// App native (Capacitor) : une app ouvre le SIMULATEUR, pas la landing —
// l'utilisateur a déjà été convaincu par l'App Store. On redirige vers #/app
// avant le premier rendu (le hash router de Root en tient compte).
// window.Capacitor est injecté par Capacitor à l'exécution (absent du web).
declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean }
  }
}
if (window.Capacitor?.isNativePlatform?.()) {
  const hash = window.location.hash
  if (!hash || hash === "#" || hash === "#/") {
    window.location.replace("#/app")
  }
}

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Élément #root introuvable")

createRoot(rootEl).render(
  <StrictMode>
    {/* M4 — prefers-reduced-motion : framer-motion coupe les animations
        (whileTap, ressorts) pour les utilisateurs qui les refusent. */}
    <MotionConfig reducedMotion="user">
      <Root />
    </MotionConfig>
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
