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
import { LangProvider } from "./i18n"

export default function Root() {
  const view = useHashView()
  const surface = (
    <>
      {view === "login" && <AuthScreen mode="login" />}
      {view === "register" && <AuthScreen mode="register" />}
      {view === "app" && <App />}
      {view === "landing" && <LandingPage />}
    </>
  )
  // i18n (v6.12) : le provider langue englobe TOUTES les surfaces (landing,
  // app, auth) — le bouton FR/EN fonctionne partout et la préférence persiste.
  return <LangProvider>{surface}</LangProvider>
}
