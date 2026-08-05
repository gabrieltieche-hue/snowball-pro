import { AuthLayout } from "./AuthLayout"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

interface AuthScreenProps {
  mode: "login" | "register"
}

/** Écran d'authentification — connexion ou inscription selon la route. */
export function AuthScreen({ mode }: AuthScreenProps) {
  return mode === "login" ? (
    <AuthLayout title="Bienvenue" subtitle="Connectez-vous pour retrouver vos simulations.">
      <LoginForm />
    </AuthLayout>
  ) : (
    <AuthLayout title="Créez votre compte" subtitle="Vos simulations, isolées sur cet appareil — gratuit et sans engagement.">
      <RegisterForm />
    </AuthLayout>
  )
}
