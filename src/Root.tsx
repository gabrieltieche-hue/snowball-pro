/**
 * Racine de l'application — routeur par hash :
 * landing (#/, par défaut) · app (#/app, #s=…) · login · register.
 * Les comptes ne changent pas la route : App gère seule le scope de
 * stockage selon la session (voir auth/store.ts).
 */
import App from "./App"
import { AuthScreen } from "./components/Auth/AuthScreen"
import { LandingPage } from "./components/Landing/LandingPage"
import { useHashView } from "./router"

export default function Root() {
  const view = useHashView()

  if (view === "login") return <AuthScreen mode="login" />
  if (view === "register") return <AuthScreen mode="register" />
  if (view === "app") return <App />
  return <LandingPage />
}
