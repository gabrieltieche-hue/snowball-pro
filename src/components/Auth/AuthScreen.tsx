import { useLang } from "../../i18n"
import { AuthLayout } from "./AuthLayout"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

interface AuthScreenProps {
  mode: "login" | "register"
}

/** Écran d'authentification — connexion ou inscription selon la route. */
export function AuthScreen({ mode }: AuthScreenProps) {
  const { tr } = useLang()
  return mode === "login" ? (
    <AuthLayout title={tr("Bienvenue")} subtitle={tr("Connectez-vous pour retrouver vos simulations.")}>
      <LoginForm />
    </AuthLayout>
  ) : (
    <AuthLayout
      title={tr("Créez votre compte")}
      subtitle={tr("Vos simulations, isolées sur cet appareil — gratuit et sans engagement.")}
    >
      <RegisterForm />
    </AuthLayout>
  )
}
