import type { CapacitorConfig } from "@capacitor/cli"

/**
 * Configuration Capacitor — l'app iOS empaquète le build web (dist/) dans une
 * WebView WKWebView. L'application reste 100 % locale : aucun plugin réseau,
 * localStorage persisté par WKWebView, le hash router fonctionne tel quel.
 *
 * Build : `npm run build` puis `npx cap sync ios` (copie dist/ → ios/App/App/public).
 * Ouverture Xcode : `npx cap open ios` (macOS + Xcode 26 requis).
 */
const config: CapacitorConfig = {
  appId: "com.snowballpro.app",
  appName: "Snowball Pro",
  webDir: "dist",
  // La page d'accueil native ouvre le simulateur (#/app) — voir src/main.tsx.
  // iOS uniquement pour l'instant (l'app Android suivrait le même chemin).
}

export default config
