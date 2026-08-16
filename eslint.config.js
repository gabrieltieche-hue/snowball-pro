import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        caches: "readonly",
        fetch: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    // ios/ = projet natif généré par Capacitor (Swift + copie du build web,
    // dont public/sw.js qui n'est pas du code source à lint) ; dist/ = build.
    ignores: [
      "dist/",
      "node_modules/",
      "ios/",
      "*.config.*",
      ".freebuff/",
      ".github/skills/",
      ".agents/skills/",
      "scripts/",
    ],
  },
)
