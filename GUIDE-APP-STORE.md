# 🍎 GUIDE APP STORE — Snowball Pro

> Guide complet pour publier Snowball Pro sur l'App Store (iPhone/iPad).
> Tout le côté technique est **déjà en place** dans ce repo (projet Capacitor,
> icônes, splash, config) — il reste les étapes Apple (compte, build, fiche).

---

## 1. Ce qui est prêt (fait dans ce chantier)

| Brique                                       | Où                                                  |
| -------------------------------------------- | --------------------------------------------------- |
| Projet natif iOS (Xcode)                     | `ios/` (généré par Capacitor 8)                     |
| Icône App Store 1024×1024                    | `ios/App/App/Assets.xcassets/AppIcon.appiconset/`   |
| Splash sombre (fond #12100e + boule or)      | `ios/App/App/Assets.xcassets/Splash.imageset/`      |
| Config Capacitor                             | `capacitor.config.ts` (appId `com.snowballpro.app`) |
| Build one-shot                               | `npm run ios:build` (build web → `cap sync ios`)    |
| Ouverture Xcode                              | `npm run ios:open`                                  |
| Ouverture directe du simulateur en natif     | `src/main.tsx` (redirection `#/app` en app native)  |
| Meta PWA iOS (icône, standalone, safe-areas) | `index.html` + `src/index.css`                      |
| Politique de confidentialité (page statique) | `public/privacy-policy.html` → servie par Vercel    |
| Build iOS automatisé (CI, sans Mac à jour)   | `.github/workflows/ios.yml`                         |

L'app **fonctionne telle quelle** dans la WebView : simulateur, Monte Carlo,
rente/retraite, objectif, rapport PDF, comptes locaux, FR/EN, thème clair/sombre,
localStorage persistant (WKWebView). Aucun serveur, aucune donnée envoyée.

---

## 2. Prérequis (obligatoires)

### 2.1 Compte Apple Developer — 99 $/an

1. Créer un compte sur https://developer.apple.com/programs/enroll/ (99 $/an, renouvellement automatique).
2. Il faut un **Apple ID** (gratuit) et des **coordonnées bancaires** valides.
3. L'activation du programme peut prendre de quelques heures à quelques jours.

### 2.2 Xcode 26 ou plus — ⚠️ VOTRE MAC ACTUEL NE PEUT PAS

Depuis le **28 avril 2026**, Apple exige que toute app soumise soit buildée avec
**Xcode 26+** (SDK iOS 26). Xcode 26 exige macOS récent (macOS 15 ou 26).

**Votre Mac actuel tourne sous macOS 12.7 (Monterey)** → impossible d'installer
Xcode 26 dessus. Trois options :

| Option                                          | Coût                   | Effort                                                                   |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| **A. Mac à jour** (macOS 15+/26 + Xcode 26)     | matériel               | le plus simple : `npm run ios:open`, build dans Xcode                    |
| **B. GitHub Actions** (workflow fourni)         | 0 € (public)           | génère le .ipa sur un runner macOS d'Apple, à téléverser via Transporter |
| **C. Build cloud** (Codemagic, Bitrise, Capgo…) | gratuits à petits prix | même principe que B, sans config                                         |

Le workflow B est fourni dans ce repo (`.github/workflows/ios.yml`) — voir §4.

### 2.3 Le reste

- Node 22+ ✅ (déjà installé)
- CocoaPods : **plus nécessaire** — Capacitor 8 utilise Swift Package Manager

---

## 3. Construire l'app

```bash
# 1. Build web + copie dans le projet natif
npm run ios:build

# 2. Sur un Mac avec Xcode 26 :
npm run ios:open          # ouvre Xcode sur ios/App/App.xcworkspace
```

Dans Xcode :

1. **Signing & Capabilities** → cocher « Automatically manage signing »,
   sélectionner votre équipe (Team).
2. Vérifier le **Bundle Identifier** : `com.snowballpro.app`
   (le nom de domaine inversé que vous avez déclaré, cf. §5.1).
3. Sélectionner un **simulateur iPhone** → ⌘R pour tester.
4. Pour tester sur un vrai iPhone : brancher l'appareil, autoriser le
   développement, ⌘R.

> ⚠️ La première compilation télécharge les dépendances Swift Package Manager
> (quelques minutes).

### Tester les points clés avant la soumission

- [ ] Ouverture → le simulateur s'affiche directement (pas la landing)
- [ ] Modification d'un réglage → le capital se recalcule
- [ ] Mode sombre/clair
- [ ] FR/EN
- [ ] Rapport PDF (bouton « Exporter » → « Rapport PDF » → « Enregistrer en PDF »)
- [ ] Création de compte + suppression de compte (menu compte)
- [ ] Mise en veille/reprise → les données persistent (localStorage)
- [ ] Mode avion → l'app fonctionne (100 % locale)

---

## 4. Option B — Build automatisé GitHub Actions (sans Mac à jour)

Le workflow `.github/workflows/ios.yml` :

1. Compile l'app web + `cap sync ios`
2. Archive et exporte le **.ipa** (App Store) sur un runner macOS avec Xcode 26
3. Dépose l'**.ipa** dans les **Artifacts** de l'action → vous le téléversez
   avec **Transporter** (gratuit, Mac) ou `xcrun altool`

### Secrets à configurer (Settings → Secrets and variables → Actions)

| Secret                            | Contenu                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `IOS_CERTIFICATE_BASE64`          | Certificat de distribution Apple **.p12** encodé en base64 (voir ci-dessous) |
| `IOS_CERTIFICATE_PASSWORD`        | Mot de passe du .p12                                                         |
| `IOS_PROVISIONING_PROFILE_BASE64` | Profil de provisioning **App Store** `.mobileprovision` en base64            |

### Créer le certificat + profil (depuis un Mac, une seule fois)

1. **Keychain Access** → Certificat Assistant → « Request a Certificate from a
   Certificate Authority » (enregistrer le .certSigningRequest)
2. https://developer.apple.com/account/resources/certificates →
   « Distribution » → créer, téléverser le .certSigningRequest →
   télécharger le .cer
3. Double-cliquer le .cer (l'ajoute au Keychain), puis **Exporter** le
   certificat en **.p12** (avec mot de passe)
4. `base64 -i Certificats.p12` → coller dans `IOS_CERTIFICATE_BASE64`
5. https://developer.apple.com/account/resources/profiles → « App Store
   Connect » → sélectionner l'app `com.snowballpro.app` → télécharger le
   `.mobileprovision` → `base64 -i AppStore_Profile.mobileprovision` → coller
6. Déclencher le workflow (bouton « Run workflow ») → télécharger l'**.ipa**
   dans les Artifacts
7. **Transporter** (App Store Connect → Téléchargements) : glisser l'**.ipa**

---

## 5. App Store Connect — la fiche produit

https://appstoreconnect.apple.com → « Mes Apps » → « + » → « Nouvelle app ».

### 5.1 Informations

| Champ             | Valeur                                                           |
| ----------------- | ---------------------------------------------------------------- |
| Nom               | Snowball Pro                                                     |
| Sous-titre        | Simulateur patrimonial français                                  |
| Langue principale | Français                                                         |
| Bundle ID         | `com.snowballpro.app` (à déclarer d'abord dans Certificates/IDs) |
| SKU               | `snowball-pro` (libre)                                           |

### 5.2 Fiche de la version (en français)

- **Description** :
  > Snowball Pro projette votre épargne avec les rendements réels du MSCI
  > World (1970-2025), applique la fiscalité française (CTO, PEA, AV, PER —
  > règles 2026) et mesure la robustesse de votre plan par Monte Carlo
  > (10 000 scénarios) et la rente/retraite (garde-fous Guyton-Klinger,
  > stress tests 1973, 2000, 2008). 100 % gratuit, 100 % local : vos données
  > ne quittent jamais votre appareil.
- **Mots-clés** : épargne,investissement,PEA,assurance-vie,retraite,Monte-Carlo,simulateur,bourse,fiscalité
- **Catégorie** : Finance
- **Classement** : 4+
- **URL de politique de confidentialité** : `https://snowball-pro.vercel.app/privacy-policy.html`
  (page fournie — ne pas la modifier sans relire : elle décrit fidèlement le
  fonctionnement 100 % local)

### 5.3 Captures d'écran (obligatoires, 1 à 10 par taille)

| Taille | Appareil             | Minimum   |
| ------ | -------------------- | --------- |
| 6,9"   | iPhone 16 Pro Max    | 1 capture |
| 6,5"   | iPhone 11 Pro Max    | 1 capture |
| 6,7"   | iPhone 14/15 Pro Max | 1 capture |

Préparer 4-6 captures par taille (simulateur → ⌘S) :

1. Écran d'accueil : le « nombre magique » (capital final + courbe)
2. Monte Carlo (P10/P50/P90)
3. Rente & retraite (taux de réussite)
4. Combien investir ?
5. Rapport PDF

### 5.4 Notes de revue (pour accélérer la validation)

> Application 100 % locale : toutes les données (simulations, comptes) sont
> stockées sur l'appareil (localStorage). Aucun compte en ligne, aucune donnée
> collectée. Les comptes créés dans l'app sont locaux et supprimables depuis
> le menu compte (mot de passe requis). Aucun achat intégré.

---

## 6. Particularités de l'app (à connaître pour la revue)

| Point                           | Statut                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Données personnelles collectées | **Aucune** (100 % local) — la politique de confidentialité le documente                                                          |
| Création de compte              | ✅ Locale, protégée par mot de passe (jamais envoyée)                                                                            |
| Suppression de compte           | ✅ Intégrée (menu compte → « Supprimer mon compte », double confirmation + mot de passe) — exigence Apple                        |
| Achats intégrés                 | Aucun (app gratuite)                                                                                                             |
| Compteur de visites             | GoatCounter (anonyme, sans cookie) sur la version web — **désactivé par défaut en natif** si hors-ligne, sans impact fonctionnel |
| Langues                         | Français + Anglais                                                                                                               |

---

## 7. Budget récapitulatif

| Poste                        | Coût                                               |
| ---------------------------- | -------------------------------------------------- |
| Apple Developer Program      | 99 $/an                                            |
| Hébergement du site (Vercel) | déjà en place                                      |
| Build CI (option B)          | 0 € (repo GitHub public) ou 4 $/mois si repo privé |

---

## 8. Checklist finale avant soumission

- [ ] `npm run ios:build` passe (build web + sync)
- [ ] L'app se lance sur simulateur, sans erreur console
- [ ] Test sur un vrai iPhone (connexion, veille/reprise, mode avion)
- [ ] Politique de confidentialité en ligne (URL vérifiée : HTTP 200)
- [ ] Captures d'écran 6,9"/6,5"/6,7" prêtes (6.9″ obligatoire en 2026)
- [ ] Fiche complète (description, mots-clés, catégorie, classement)
- [ ] Notes de revue renseignées
- [ ] Build .ipa téléversé (Transporter) et apparaissant dans App Store Connect
- [ ] « Submit for Review » 🚀

---

## 9. Après la publication

- **Vercel** : ajouter un lien « Télécharger sur l'App Store » sur la landing
  (badge Apple officiel) → canal de conversion web → iOS.
- **Mises à jour** : nouvelle version = `npm run ios:build`, bump du numéro de
  build dans Xcode (ou le workflow), re-upload via Transporter.
- **Android** : le même chantier Capacitor peut ajouter `npx cap add android`
  (Google Play, frais uniques 25 $) — le code web est déjà prêt.
