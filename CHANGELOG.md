# CHANGELOG — Snowball Pro v5.1

> Simulation patrimoniale haut de gamme

---

## v6.20.0 — Landing : replay des krachs (2000/2008/2022) + manifeste « Ce que nous ne faisons pas »

Cinquième vague de la feuille de route landing (`IDEES-AMELIORATIONS-LANDING.md`) : les chantiers **n°5 (manifeste 5.2)** et **n°7 (replay des krachs 3.2 — l'élément signature)**. Après l'attaque (1.2), la preuve (2) et l'objectif inversé (4), place à l'émotion — « 2008, votre épargne perd 37 %… puis elle revient » — et à l'honnêteté par le refus.

### 🔄 Changements

- **Replay des krachs (3.2)** — nouvelle section signature « Vos 100 € face aux krachs » : sélecteur 2000/2008/2022 (radiogroup), courbe SVG animée (tracé or + aire dégradée, baseline « 100 € » en pointillés, dessin `pathLength` à chaque bascule) et chiffres **100 % dérivés du moteur** via la nouvelle fonction pure `replayCrashFrom` (`historical.ts`) : 100 € investis début d'année, valeur fin d'année sur le MSCI World Net Return EUR réel (dividendes nets réinvestis). Histoires réelles : **2008 −37,3 % (creux fin 2008), retour à l'équilibre en 2012** ; **2000 la décennie perdue — double krach (2000-02 puis 2008), creux à −45,8 %, retour seulement en 2013** ; **2022 −12,9 %, retour dès 2023**. Aucun chiffre en dur (tout passe par le moteur).
- **Manifeste « Ce que nous ne faisons pas » (5.2)** — nouvelle section juste après le tableau honnête : 5 refus assumés (rendement garanti, conseil en investissement, vente de données, compte obligatoire, publicité) en cartes ⚠ rouge doux, phrase de clôture « vérifiable dans le code » + ancre « Revoir le tableau honnête » → `#comparaison`. L'envers de l'attaque 1.2 — aucun simulateur français n'ose l'écrire.
- **i18n** — ~25 nouvelles clés FR→EN (replay + manifeste + légendes) ; `aria-label` des deux sections traduits.
- **Tests** — +7 : 5 pour `replayCrashFrom` (2008/2000/2022 avec les valeurs exactes de la série, hors-bornes → null, cohérence interne produit), 2 composants (replay : chiffres du moteur + bascule 2000, manifeste : 5 refus + ancre). Test héro adapté (deux SVG `role=img` désormais).
- Gate : typecheck ✓ lint ✓ tests ✓ format ✓ build ✓ (détecteur impeccable : 0 finding), vérifié en navigateur réel (FR + EN, 1440/390/320 px).
- Version 6.19.0 → **6.20.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.20.0`, footer landing v6.20.0, « Dernières éditions » v6.20.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), commit + déploiement Vercel (`vercel --prod`).

---

## v6.19.0 — Header épuré : un seul CTA doré + l'avertissement corrige tout seul

Mini-refonte du header validée par l'utilisateur (« IL Y A TROP DE BOUTONS ! ») : le CTA **« Nouvelle simulation »** était noyé entre deux boutons dorés (lui et « Exporter »), et le badge « 1 avertissement » ne disait pas où était le problème. Le header passe de **9 à 6 contrôles** avec 3 niveaux hiérarchiques clairs, et l'avertissement devient actionnable — il s'explique au clic et se corrige **tout seul**. Mode inline APEX + bundles process/ui-ux (TDD rouge/vert, auto-revue adverse), **425 tests**, gate 100 % vert, vérifié en navigateur réel.

### 🔄 Changements

- **Header minimaliste** — « Nouvelle simulation » devient l'**UNIQUE bouton doré** (Exporter perd sa couleur or qui le concurrençait) et légèrement agrandi ; Annuler/Rétablir passent en icônes seules (aria-labels conservés, tests intacts) ; Exporter, Partager, FR/EN, Comparer, Mode et Réinitialiser migrent dans le menu **« ⋯ »** converti en panneaux (sous-panneaux Export/Partage avec ← Retour, pattern du menu compte) ; **le thème Sombre/Clair reste visible** dans le header (décision utilisateur).
- **Avertissement actionnable** — le badge « 1 avertissement » devient une icône **⚠** discrète (ambre si avertissement, rouge si erreur) : infobulle au survol, **popover au clic** qui explique simplement chaque problème sur sa ligne (ligne cliquable) + bouton « Corriger automatiquement ».
- **Correction automatique** — le bouton corrige **tout seul** : `autoFixValidationErrors` (nouvelle fonction moteur pure) clamps les valeurs hors bornes et rétablit la cohérence âge/durée/retraite (ex. vérifié en navigateur : durée 25 → 32 pour un départ à 62 ans à 30 ans), appliqué en **un seul patch annulable** (⌘Z restaure tout), l'icône ⚠ disparaît et la projection se recalcule. Le bandeau d'erreur sous le header gagne aussi un bouton « Corriger automatiquement ».
- **Navigation vers l'erreur** — chaque ligne du popover ouvre la bonne section de réglages, scrolle jusqu'au champ et le met au focus (`validationTargets.ts` : mapping exhaustif champ → section/onglet + `focusRequest` prop de la Sidebar).
- **i18n** — nouvelles clés FR→EN (popover « Problèmes à corriger », boutons, panneaux Export/Partager).
- **Tests** — +7 : mapping champ→destination exhaustif (validationTargets), auto-fix moteur (clamp + cohérence), composants (popover ⚠, navigation/focus, auto-fix + undo) — **425/425**.
- Gate : typecheck ✓ lint ✓ **425/425 tests** ✓ format ✓ build ✓ (single-file 1,28 Mo ; binaires natifs `@tailwindcss/oxide` + `lightningcss` réparés dans node_modules, stubs iCloud) ; vérifié en navigateur réel : popover mobile sans débordement (correctif centrage), auto-fix durée 25 → 32, ⚠ disparu, Annuler activé.
- Version 6.18.0 → **6.19.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.19.0`, footer landing v6.19.0, « Dernières éditions » v6.19.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), commit + déploiement Vercel (`vercel --prod`).

---

## v6.18.0 — Landing : tableau honnête vs ProjectionLab/Finary/SEO, démo « objectif inversé », FAQ schema, page changelog

Quatrième vague de la feuille de route landing (`IDEES-AMELIORATIONS-LANDING.md`) : les chantiers **n°2 (comparaison), n°4 (objectif inversé), n°8 (FAQ schema) et n°9 (dernières éditions + changelog)**. La bande v6.17.0 attaquait le cluster taux fixe ; cette version apporte la preuve par les faits.

### 🔄 Changements

- **Section « Le tableau honnête » (1.4 + 4.2)** — tableau 4 colonnes × 6 critères (fiscalité FR, 100 ans d'historique, Monte Carlo, décumulation, gratuité, données 100 % locales) opposant Snowball Pro à ProjectionLab (100 % fiscalité US), Finary (agrégateur, pas de moteur de simulation) et les simulateurs SEO FR (rendement fixe). Cases honnêtes ✅/⚠/✕ avec légende explicite « partiel — à vérifier », note de vérification datée (17/08/2026), et maillage interne vers les 4 comparatifs détaillés `/alternatives/`. Aucun ✕ inventé : chaque ⚠ est assumé.
- **Démo « objectif inversé » (5.1)** — « Je veux 1 M€ → combien par mois ? » : deux curseurs réels (Objectif 100 k€–5 M€, Horizon 5–40 ans) branchés sur le VRAI solveur de l'app (`solveGoal`, rendement composé du scénario Central), jauge de difficulté, note honnête « calcul brut avant fiscalité et frais », et CTA **« Repartir de cette simulation »** qui écrit un deep-link `#s=…` — l'app s'ouvre avec l'objectif pré-chargé dans l'onglet « Combien investir ? » (vérifié e2e : objectif 1 000 000 € / 20 ans dans le curseur).
- **FAQ schema JSON-LD (4.1)** — bloc `FAQPage` dans `index.html` avec les 8 questions de la FAQ de la landing, réponses verbatim : le contenu devient citable par les AI answers (Google SGE, ChatGPT…).
- **« Dernières éditions » réduit + page changelog (2.4)** — la section passe de 13 à 3 cartes (4 avec la présente version), lien « Toutes les versions » vers une nouvelle page statique `public/changelog.html` générée depuis le CHANGELOG (51 versions, SEO-friendly, `llms.txt` + `sitemap.xml` + footer mis à jour).
- **i18n** — ~50 nouvelles clés FR→EN (comparaison, objectif, changelog, libellés de légende) ; `aria-label` de la section « Dernières évolutions » traduit (auto-revue).
- **Tests** (`src/__tests__/components.test.tsx`) : +3 — tableau honnête (3 concurrents cités, critères, maillage `/alternatives/`), objectif inversé (montant = `solveGoal`, CTA `#s=` décodable avec l'objectif), dernières éditions ≤ 4 + lien changelog — **418/418**.
- Gate : typecheck ✓ lint ✓ **418/418 tests** ✓ format ✓ build ✓ (détecteur impeccable : 0 finding ; binaire natif `lightningcss-darwin-x64` réparé dans node_modules, évincé par iCloud).
- Version 6.17.0 → **6.18.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.18.0`, footer landing v6.18.0, « Dernières éditions » v6.18.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), commit + déploiement Vercel (`vercel --prod`).

---

## v6.17.0 — Landing : la bande « attaque du cluster taux fixe » sous le héro

Premier chantier de la feuille de route landing (`IDEES-AMELIORATIONS-LANDING.md`, ordre de bataille n°1). Juste sous le héro, une bande plein-largeur oppose les simulateurs SEO français qui supposent un rendement fixe à la méthode Snowball Pro : 100 ans de vraie histoire rejouée, krachs inclus. **Décision utilisateur : aucun taux en dur** — la promesse porte sur la méthode, pas sur un chiffre (« Les autres simulateurs supposent un rendement fixe. Nous, on rejoue 100 ans de vraie histoire, krachs inclus. »). « Aléatoire » a été écarté : factuellement faux (le modèle concurrent est un taux fixe supposé) et plus risqué juridiquement. **409 tests**, gate 100 % vert, vérifié en navigateur réel (FR + EN, 1440/390/320 px, 0 overflow).

### 🔄 Changements

- **`src/components/Landing/LandingPage.tsx`** : bande « attaque du cluster taux fixe » (1.2) sous le héro — première phrase grise (leur monde), seconde en or display (notre monde), flèche (→ desktop / ↓ mobile) ; section `aria-label` traduite FR/EN ; `border-t` seul pour garder un filet unique avec la bande « Chiffres clés » (qui porte déjà son `border-y`).
- **`src/engine/i18n.ts`** : 2 clés FR→EN (bande) + carte « Dernières éditions » v6.17.0 + footer v6.17.0 (FR + EN).
- **Tests** (`src/__tests__/components.test.tsx`) : +1 test — la bande est rendue sous le héro, les deux phrases présentes **dans la bande** (region scoped via `within`), aucun « 5 % par an » cité — **409/409**.
- Gate : typecheck ✓ lint ✓ **409/409 tests** ✓ format ✓ build ✓ (détecteur impeccable : 0 finding).
- Version 6.16.0 → **6.17.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.17.0`, footer landing v6.17.0, « Dernières éditions » v6.17.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), commit + déploiement Vercel (`vercel --prod`).

---

## v6.16.0 — Onboarding guidé : tutoriel non-skippable + questionnaire « Nouvelle simulation » + bibliothèque multi-sims

Gros chantier d'activation pour les nouveaux utilisateurs (notamment ceux qui ne comprennent rien à la finance ou à internet). À la première visite, l'app affiche un **tutoriel non-skippable en 5 écrans** qui présente simplement l'outil, puis un bouton **« Lancer ma première simulation »** ouvre un **questionnaire guidé** (une question par écran, barre de progression) qui construit la simulation à la place d'une prise en main des réglages. Le questionnaire adapte ses questions en direct : capital en **Oui/Non** (la sous-question montant n'apparaît que si Oui), projet en **2 parties** (objectif → durée avec l'horizon conseillé pré-sélectionné), enveloppe avec **⭐ RECOMMANDÉ dynamique** (calculé à partir des réponses précédentes, explication fiscale en une phrase), âge d'arrêt de travail **conditionnel** (retraite ET liberté financière), puis **renommage final** avec nom par défaut intelligent et **snapshot auto-créé**. Le bandeau « Commencez ici » (QuickStart) est **supprimé** — remplacé par ce parcours. Un bouton **« Nouvelle simulation »** (dans l'ActionBar) relance le questionnaire vierge, avec un dialogue **« Sauvegarder et créer / Créer sans sauvegarder / Annuler »** si la simulation en cours a été modifiée. Enfin, un **vrai onglet « Mes simulations »** (bibliothèque : ouvrir, renommer inline, supprimer avec double-clic de confirmation) et les réglages sont **repliés par défaut** derrière un rail « Déplier les réglages avancés » (le mode Débutant/Avancé et tout l'existant restent accessibles). **408 tests**, gate 100 % vert, parcours validé en navigateur réel de bout en bout.

### 🔄 Changements

- **Moteur pur** (`src/engine/onboarding.ts`, nouveau) : `recommendEnvelope` (⭐ dynamique selon l'horizon), `buildInputsFromAnswers` (mappe les réponses du questionnaire sur les vrais champs du moteur), `defaultSimulationName` (« Liberté financière — 20 ans »), constantes d'options (projets, enveloppes, risques, montants). `snapshots.ts` gagne `renameSnapshot` + limite de 30 snapshots. Barrel `engine/index.ts` mis à jour.
- **Tutoriel** (`src/components/Onboarding/Tutorial.tsx`, nouveau) : 5 écrans non-skippables, garde `snowball_v5_onboarded` dans `localStorage` ; ne se déclenche que pour le **vrai nouveau visiteur** (aucun réglage existant, pas de `#s=`, pas de données de compte) — un visiteur qui arrive avec un lien partagé déjà rempli n'est pas bloqué.
- **Questionnaire** (`src/components/Onboarding/SimulationWizard.tsx`, nouveau) : wizard dynamique à étapes (8 questions fixes + sous-questions conditionnelles), flèche retour, champ « Autre » (âge, montants), halo or sur les options recommandées, récapitulatif + renommage avant le lancement.
- **Dialogue de sauvegarde** (`src/components/Onboarding/SaveSimulationDialog.tsx`, nouveau) : proposé quand la sim en cours est modifiée au clic sur « Nouvelle simulation » — snapshot puis wizard vierge, ou wizard vierge sans sauvegarder.
- **Onglet « Mes simulations »** (`src/components/Tabs/SimulationsTab.tsx`, nouveau) : simulation en cours + bibliothèque de snapshots (ouvrir = charger les inputs, renommer inline, supprimer avec double-clic de confirmation 3,5 s).
- **`src/App.tsx`** : branchement tutoriel → wizard → résultat, état `dirty`, dialogue de sauvegarde, onglet « Mes simulations », suppression du bandeau QuickStart ; la gestion de langue reste intacte (le flux est 100 % traduit FR/EN).
- **`src/components/Layout/Sidebar.tsx`** + `src/utils/sidebar.ts` : replié par défaut (`snowball_v62_sidebar`), rail « Déplier les réglages avancés » — tous les réglages restent accessibles en un clic.
- **`src/components/Layout/QuickStart.tsx`** : **supprimé** (remplacé par le questionnaire) ; imports nettoyés.
- **i18n** (`src/engine/i18n.ts`) : ~60 nouvelles clés FR/EN (tutoriel, questions, recommandations, dialogue, bibliothèque), 0 clé manquante.
- **Tests** : `engine.test.ts` (recommandations, `buildInputsFromAnswers`, nom par défaut, `renameSnapshot`, limite 30) + `components.test.tsx` (tutoriel premier visiteur vs lien partagé, wizard, dialogue, onglet) — **408/408**.
- Gate : typecheck ✓ lint ✓ **408/408 tests** ✓ i18n 0 clé manquante ✓ format ✓ build ✓.
- Version 6.15.0 → **6.16.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.16.0`, footer landing v6.16.0, « Dernières éditions » v6.16.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), commit + déploiement Vercel (`vercel --prod`).

---

## v6.15.0 — Mobile 100 % : résultat d'abord, zoom iOS corrigé, zones tactiles + socle app iOS (Capacitor)

Chantier mobile complet, mesuré en navigateur réel (Playwright, 320 → 430 px). Sur téléphone, l'app respecte enfin la promesse produit : **le résultat d'abord** — les onglets et le héro passent AVANT les réglages (la sidebar les suit), le bandeau « Commencez ici » passe de ~700 px à **275 px** (3 cartes en défilement snap), les champs de saisie montent à **16 px sur mobile** (plus de zoom automatique iOS au focus), les boutons de l'en-tête gagnent des **zones tactiles confortables**, et l'app gère les **zones de sécurité iPhone** (encoche, barre d'accueil) + les meta PWA iOS (« Ajouter à l'écran d'accueil »). En parallèle, le **socle d'une future app iOS** est posé (Capacitor 8, projet Xcode, icône 1024², splash sombre, redirection native, workflow CI, politique de confidentialité, guide de soumission) — la soumission App Store reste en attente à la demande de l'utilisateur. **401 tests**, gate 100 % vert.

### 🔄 Changements

- **`src/App.tsx`** : sur mobile, `main` (onglets + résultats) passe avant la sidebar via `order-1/order-2` (desktop inchangé : réglages à gauche, résultats à droite) — le capital final et la courbe sont visibles dès l'ouverture, les réglages en dessous.
- **`src/components/Layout/QuickStart.tsx`** : bandeau « Commencez ici » compact sur mobile — 3 cartes en ligne défilante (scroll-snap, 74 % de largeur) au lieu de 3 cartes empilées (~700 px → **275 px**) ; bouton « Utiliser ce profil » à ~40 px de haut ; croix de fermeture à zone tactile élargie.
- **Zoom iOS au focus** : `SmartInput.tsx` et `fields.tsx` (auth) passent en `text-base` (16 px) sur mobile (`sm:` inchangé) + filet de sécurité CSS global étendu à email/password/tel/url/search (`src/index.css`) — plus aucun champ < 16 px ne déclenche le zoom automatique de Safari.
- **Zones tactiles** : boutons de l'en-tête (ActionBar, ExportMenu, ShareMenu, LanguageToggle, AccountMenu, landing) en `py-2.5` sur mobile (~37 px), `HelpTip` agrandi, `py-1.5` → `py-2` au minimum — desktop inchangé.
- **iOS / PWA** (`src/index.css` + `index.html`) : `viewport-fit=cover`, meta `apple-mobile-web-app-*`, `apple-touch-icon`, safe-areas (`env(safe-area-inset-*)` sur les en-têtes sticky et le bas de page), `touch-action: manipulation` (plus de délai ni zoom au double-tap), `-webkit-text-size-adjust: 100%` (anti « font inflation » paysage).
- **Socle app iOS (Capacitor 8)** : `capacitor.config.ts` (appId `com.snowballpro.app`), projet Xcode généré `ios/` (icône App Store 1024×1024 + splash sombre #12100e générés par `scripts/generate-ios-assets.mjs`, LaunchScreen sombre), `src/main.tsx` redirige `#/` → `#/app` en contexte natif (l'app ouvre le simulateur, pas la landing), scripts `ios:build` / `ios:open`, workflow CI `.github/workflows/ios.yml` (Xcode 26, .ipa en artifact — le Mac local en macOS 12 ne peut pas builder), `public/privacy-policy.html` (page 100 % locale, exigence App Store), `GUIDE-APP-STORE.md` (guide de soumission complet).
- **Deps & gates** : `@capacitor/core` / `@capacitor/cli` / `@capacitor/ios` en devDependencies ; `eslint.config.js`, `.prettierignore` et `tsconfig.json` intègrent le projet natif (`ios/` ignoré des gates, `capacitor.config.ts` typechecké).
- Gate : typecheck ✓ lint ✓ **401/401 tests** ✓ i18n 0 clé manquante ✓ format ✓ build ✓ (dist 1 228 ko / 359 ko gzip).
- Version 6.14.0 → **6.15.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.15.0`, footer landing v6.15.0, « Dernières éditions » v6.15.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), commit + déploiement Vercel (`vercel --prod`).

---

## v6.14.0 — Distribution : 4 pages alternatives + page Tarifs, footer landing, guides autonomes

Suite de la brique distribution (v6.13.0) : le canal SEO s'étoffe avec **4 comparatifs honnêtes** face aux outils que les internautes français tapent déjà (Portfolio Visualizer, FireCalc, Networthify, Quantalys), une **page Tarifs « 100 % gratuit »**, et l'app pointe enfin vers ses pages statiques (rangée « Guides et comparatifs » dans le pied de page de la landing). Les CTA deep-link `#s=…` de toutes les pages publiques sont désormais **protégés par un test de régression** : un payload indécodable casserait la suite plutôt que d'ouvrir l'app avec les défauts en silence.

### 🔄 Changements

- **`public/alternatives/`** (nouveau) : `portfolio-visualizer.html`, `firecalc.html`, `networthify.html`, `quantalys.html` — comparatifs honnêtes (tableau de comparaison, « quand choisir l'un ou l'autre », FAQ), JSON-LD Article + FAQPage, canonical, OG, CSP identique à l'app, GoatCounter, CTA deep-link `#s=…` et liens croisés entre pages. Chaque page reconnaît ce que l'outil comparé fait mieux (ex. backtesting multi-actifs pour Portfolio Visualizer).
- **`public/pricing.html`** (nouveau) : « 100 % gratuit, pour toujours » — grille du plan gratuit, FAQ (financement, données, limites), CTA deep-link PEA. Remplace le brouillon orphelin `pricing.md` (supprimé). Ajoutée au sitemap et à `llms.txt`.
- **`src/components/Landing/LandingPage.tsx`** : rangée « Guides et comparatifs » dans le footer (3 guides + 4 alternatives + Tarifs) — l'app lie enfin ses pages statiques (distribution SEO) ; clés i18n FR/EN ajoutées (`src/engine/i18n.ts`).
- **`public/guides/`** : le CSS partagé `guides.css` est inliné à l'identique dans les 3 guides (pages 100 % autonomes — le chemin absolu `/guides/guides.css` cassait en preview locale) ; `guides.css` supprimé (orphelin).
- **`src/__tests__/public-pages.test.ts`** (nouveau, 12 tests) : chaque `#s=` des 8 pages publiques doit se décoder via `decodeInputsFromUrl` (le chemin exact de l'app) avec ses champs clés ; chaque URL du sitemap et de `llms.txt` doit correspondre à un fichier réellement servi.
- **`public/sitemap.xml`** : +5 URLs (4 alternatives + pricing, priority 0.7, monthly). **`public/llms.txt`** : +5 liens (AEO).
- **Prettier** : 8 pages publiques + 2 fichiers `src/` en dette (`ShareMenu.tsx`, `PatrimonialReport.tsx`) remis au style — `format:check` à zéro.
- Gate : typecheck ✓ lint ✓ **401/401 tests** (389 + 12) ✓ i18n 0 clé manquante ✓ format ✓ build ✓ (guides, alternatives et pricing copiés dans `dist/`).
- Version 6.13.1 → **6.14.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.14.0`, footer landing v6.14.0, « Dernières éditions » v6.14.0), CHANGELOG (cette entrée), MEMORY.md (entrée session), déploiement Vercel (`vercel --prod`).

---

## v6.13.1 — Correctifs : panneaux expérimentaux retirés avant publication, onglets nets sur mobile

Suite à la demande utilisateur (les panneaux « Et si vous changiez d'enveloppe ? » et « Quel levier compte le plus ? » jugés hors périmètre), les deux fonctionnalités expérimentales — **jamais publiées** — ont été retirées proprement du code avant le premier déploiement de la v6.13. Le reste de la release (partage, guides SEO, llms.txt) et le correctif mobile sont déployés.

### 🔄 Changements

- **Retrait des panneaux « Et si vous changiez d'enveloppe ? » et « Quel levier compte le plus ? »** : suppression des composants (`EnvelopeComparisonPanel.tsx`, `SensitivityPanel.tsx`), du moteur (`envelopeComparison.ts`, `sensitivity.ts`), des exports du barrel `engine/index.ts`, du branchement `SimulatorTab.tsx`, des clés i18n FR/EN et des tests associés (402 → **389 tests**). Fonctionnalités jamais déployées — aucun utilisateur impacté.
- **`src/components/Layout/TabBar.tsx`** : fix mobile — le `whitespace-nowrap` est retiré des libellés d'onglets : « Robustesse de votre plan » débordait horizontalement à 320 px (bug préexistant v6.11.2) ; le libellé passe à la ligne, **0 overflow** à 314 px.
- Gate : typecheck ✓ lint ✓ **389/389 tests** ✓ i18n 0 clé manquante ✓ build ✓ (dist 1 222 ko / 358 ko gzip).
- Version 6.13.0 → **6.13.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.13.1`, footer landing v6.13.1, « Dernières éditions » v6.13.1), CHANGELOG (cette entrée), MEMORY.md (entrée session), déploiement Vercel (`vercel --prod`).

---

## v6.13.0 — Distribution : partage en un clic (X, WhatsApp, LinkedIn), rapport PDF signé et 3 guides SEO long-tail

Brique « distribution » de la stratégie (canal SEO + boucle virale) : le produit est prêt depuis longtemps, c'est la visibilité qui manque. Trois leviers techniques implémentés : (1) **bouton « Partager » visible** dans l'en-tête — X (Twitter), WhatsApp, LinkedIn et copie du lien, chaque lien embarque le scénario pré-rempli (`#s=…` via `buildShareUrl`) + un **UTM par canal** (`utm_source=partage&utm_medium=x|whatsapp|linkedin|copie`) pour mesurer chaque source dans GoatCounter ; (2) **rapport PDF signé** — pied de rapport « Créé avec Snowball Pro » + URL du site + **lien du scénario partageable** : chaque rapport imprimé devient une publicité ; (3) **3 pages guides SEO** statiques (`public/guides/`) ciblant les requêtes long-tail françaises — « simulateur PEA », « PEA ou assurance vie », « calcul intérêts composés » — chacune avec données structurées (Article + FAQPage), CTA « Simulez votre scénario » en **lien profond pré-rempli** et GoatCounter. Sitemap + llms.txt mis à jour. **402 tests**, gate 100 % vert.

### 🔄 Changements

- **`src/components/Layout/ShareMenu.tsx`** (nouveau) : bouton « Partager » de l'en-tête — panneau 4 canaux (X / WhatsApp / LinkedIn / copie) ; liens construits sur `buildShareUrl(inputs)` avec UTM inséré AVANT le hash (`?utm_source=partage&utm_medium=…` + `#s=…` intact) ; état « Lien copié ! » ; fermeture au clic extérieur / Échap.
- **`src/components/Layout/ActionBar.tsx`** : le menu « Partager la simulation » (caché dans « ⋯ ») devient le bouton visible `ShareMenu` (le menu « ⋯ » ne contient plus que Comparer, mode, réinitialiser).
- **`src/App.tsx`** : `handleCopyLink`/`linkCopied` remplacés par le passage de `inputs={activeInputs}` à l'ActionBar (le lien est reconstruit à chaque ouverture — toujours à jour).
- **`src/components/Report/PatrimonialReport.tsx`** : pied de rapport — marque SNOWBALL PRO, « Créé avec Snowball Pro — simulez gratuitement votre propre projet d'épargne », URL du site et **lien partageable du scénario** (`buildShareUrl(inputs)`, sans UTM : c'est un artefact imprimé).
- **`src/engine/i18n.ts`** : nouvelles clés FR→EN (partage, pied de rapport), carte « Dernières éditions » v6.13.0 et footer v6.13.0 (FR + EN).
- **`public/guides/`** (nouveau) : `guides.css` (thème clair aligné sur l'app) + `simulateur-pea.html`, `pea-ou-assurance-vie.html`, `calcul-interets-composes.html` — pages statiques indexables, JSON-LD Article + FAQPage, canonical, OG, CSP identique à l'app, GoatCounter, CTA deep-link `/#s=…` (scénarios vérifiés décodables par le moteur).
- **`public/sitemap.xml`** : 3 URLs guides ajoutées (priority 0.7, monthly). **`public/llms.txt`** : liens guides ajoutés (AEO).
- **`src/__tests__/components.test.tsx`** : +4 tests partage — ouverture des 4 canaux, UTM + scénario décodable dans chaque lien (X, WhatsApp, LinkedIn), copie avec UTM « copie » + feedback, fermeture au clic extérieur.
- Gate : typecheck ✓ lint ✓ **402/402 tests** ✓ build ✓ (guides copiés dans `dist/`).
- Version 6.12.0 → **6.13.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.13.0`, footer landing v6.13.0, « Dernières éditions » v6.13.0), CHANGELOG (cette entrée), MEMORY.md (entrée session).

---

## v6.12.0 — L'application en anglais : un bouton FR/EN traduit toute l'app 🇬🇧

Demande utilisateur : _« je veux ajouter un bouton sur le site pour traduire dans plusieurs langues et rendre accessible à plus de gens. On met juste l'anglais. »_ Un bouton FR/EN (en-tête de l'app **et** de la landing) bascule l'intégralité de l'interface en anglais : simulateur, Monte Carlo, rente & retraite, objectif, comparaison, sidebar, graphiques, rapport PDF, landing et écrans de compte. Le formatage des montants suit la langue (€1,234.56 / 1,234,567.89 € au lieu de 1 234,56 € / 1 234 567,89 €), la préférence est persistée (`snowball_v5_lang`), et la langue du navigateur sert de défaut au premier passage. Le français reste la langue par défaut et l'architecture est prête pour d'autres langues. **385 tests**, gate 100 % vert.

### 🔄 Changements

- **`src/engine/i18n.ts`** (nouveau) : moteur de traduction pur — `tr(lang, texteFR, params?)` indexé par le texte français exact (fallback FR si la traduction manque), `Lang`, `LANG_LOCALE`, `interpolate`, `langCode` ; dictionnaire anglais de ~900 clés couvrant toute l'app.
- **`src/engine/formatting.ts`** : `fmtCurrency`/`fmtCompact`/`fmtPercent`/`fmtDecimal` acceptent un `lang` optionnel (défaut `fr` → rétrocompatible, les 373 tests existants intacts).
- **`src/engine/taxRules.ts`** : `fmtTaxPercent(rate, lang)` ; **`src/engine/taxes.ts`** : notes fiscales de `computeTaxBreakdown` localisées (`TaxNote.label` + `lang`).
- **`src/i18n.tsx`** (nouveau) : `LangProvider` + `useLang()` (retourne `tr`, `locale` et les formatters liés) ; sans provider, tout retombe en français — les tests qui montent un composant isolé restent verts. Injecté dans `Root.tsx` ; le `<html lang>` et le titre du document suivent la langue.
- **`src/components/shared/LanguageToggle.tsx`** (nouveau) : bouton FR/EN, placé dans l'ActionBar de l'app et l'en-tête de la landing.
- **~60 fichiers traduits** : App, Layout (Sidebar, TabBar, ActionBar, QuickStart, SnapshotPanel…), Forms, Simulation, Charts, les 5 onglets (Simulateur, Monte Carlo, Rente & Retraite, Objectif, Comparaison), le rapport PDF `PatrimonialReport`, la landing + HeroChart + Brand, et les écrans Auth (connexion/inscription/menu de compte). Les messages moteur (validation, auth) sont traduits à l'affichage pour ne pas casser les tests.
- **`src/__tests__/`** : nouveaux tests — i18n moteur (tr/interpolate/formatters FR-EN) et bascule de langue en composant (toggle + formatters + inscription localisée).
- **`scripts/i18n-check.mjs`** (nouveau) : vérifie que chaque clé utilisée existe dans le dictionnaire (couverture 100 %).
- **`LandingPage.tsx`** + `i18n.ts` : carte « Dernières éditions » v6.12.0 et footer v6.12.0 (FR + EN).
- Gate : typecheck ✓ lint ✓ **385/385 tests** ✓ build ✓.
- Version 6.11.2 → **6.12.0** (package.json, package-lock.json local, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.12.0`, footer landing FR/EN, « Dernières éditions »), CHANGELOG (cette entrée), MEMORY.md (entrée session).

---

## v6.11.2 — Panneau « Votre capital en détail » : échelles libellées sur chaque valeur + panneau resserré

Retour utilisateur : _« c'est trop étendu vers le bas, on comprend pas, c'est pas appliqué, je comprends pas ! sur le compte en 2045 / en euros d'aujourd'hui »_. La légende d'échelle partagée de l'en-tête (v6.9.0) ne rattachait pas les pastilles aux chiffres — elle est **supprimée** : chaque valeur porte désormais SON libellé (« 1,31 M€ sur le compte en 2045 » / « 864 713 € en euros d'aujourd'hui »), qui passe à la ligne (flex-wrap) en colonne étroite au lieu de tronquer. Le panneau est resserré verticalement (padding p-4/p-5, header mb-3, marges internes réduites) et les grands chiffres passent en text-lg/xl (taille augmentée, comme suggéré). **385 tests**, gate 100 % vert.

### 🔄 Changements

- **`SummaryStats.tsx`** : légende d'en-tête supprimée ; chaque `DualAmount` porte son échelle (`primaryLabelInline` + `size="lg"`) ; espacements resserrés (p-4/p-5, mb-3, icône mb-1.5, sous-texte mt-0.5, gains mt-2/pt-2, grille gap-y-4).
- **`DualAmount.tsx`** : nouvelles props optionnelles `primaryLabelInline` (libellé du grand chiffre en ligne, flex-wrap) et `size` ("md"/"lg") — rendu par défaut inchangé pour les autres usages (Hero, Sidebar, FiscalPanel) ; ligne secondaire en flex-wrap (le libellé ne tronque plus sur mobile).
- **`components.test.tsx`** : tests SummaryStats/DualAmount mis à jour (chaque échelle apparaît ≥ 1 fois par colonne) + test `primaryLabelInline`.
- **`LandingPage.tsx`** + `i18n.ts` : carte « Dernières éditions » v6.11.2 et footer v6.11.2 (FR + EN).
- Gate : typecheck ✓ lint ✓ **385/385 tests** ✓ build ✓.
- Version 6.11.1 → **6.11.2** (package.json, package-lock.json local, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.11.2`, footer landing FR/EN, « Dernières éditions »), CHANGELOG (cette entrée), MEMORY.md (entrée session).

---

## v6.11.1 — Favicon : une vraie icône .ico pour Google

L'app n'avait qu'une icône PNG haute résolution : Google exige un `favicon.ico` (16/32/48 px) pour afficher une icône dans les résultats de recherche. Ajout de `public/favicon.ico` (3 tailles embarquées) et de son lien dans `index.html` (PNG 192 px conservé pour les écrans haute densité). **373 tests**, gate 100 % vert, déployé.

### 🔄 Changements

- **`public/favicon.ico`** (nouveau) : icône 16/32/48 px (PNG RGBA embarqués), requise par Google pour l'icône dans les résultats de recherche.
- **`index.html`** : `<link rel="icon" href="/favicon.ico" sizes="32x32" />` ajouté en tête ; le PNG 192 px est conservé avec `sizes="192x192"`.
- **`LandingPage.tsx`** : « Dernières éditions » v6.11.1 en tête + footer v6.11.1.
- Gate : typecheck ✓ lint ✓ **373/373 tests** ✓ build ✓.
- Version 6.11.0 → **6.11.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.11.1`, footer landing, « Dernières éditions »), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.11.1).

---

## v6.11.0 — Inflation : l'hypothèse 2,1 % (cible BCE) explicitée, médiane 2,1 %

Retour utilisateur sur la véracité des trois taux (10,07 → 8,22 → 5,99) : audit complet — math interne vérifiée au centième (moyenne arithmétique 10,0655 %, composé 8,2196 %, réel Fisher 5,9938 %), série MSCI World Net EUR 1970-2025 recoupée année par année contre les rendements officiels USD convertis au change EUR/USD. Constat : le 5,99 % utilisait une hypothèse d'inflation forfaitaire 2,1 %, inférieure à la moyenne réelle 1970-2025 (4,05 %, INSEE). Analyse médiane : **la médiane de la période est exactement 2,10 %** — 2,1 % est donc l'hypothèse la plus naturelle (et prudente vs 1,87 % de moyenne depuis 1986) : **on la garde**, et on l'explique dans l'UI. **373 tests**, gate 100 % vert, vérifié en navigateur réel.

### 🔄 Changements

- **`Sidebar.tsx`** (panneau « Pourquoi ces chiffres ? ») : note explicite sous les trois taux — « Hypothèse d'inflation : 2,1 %/an (cible BCE), vs 4,0 % en moyenne réelle 1970-2025 — la médiane de la période est justement 2,1 %. »
- **`LandingPage.tsx`** (section Méthodologie) : même note enrichie (la moyenne est tirée vers le haut par les chocs des années 1970-1985) ; nouvelle entrée **FAQ « Pourquoi 2,1 % d'inflation et pas la moyenne réelle ? »** (médiane 2,1 %, chocs 1970-85 jusqu'à 13,7 % en 1974, moyenne 1,9 % depuis 1986) ; « Dernières éditions » + footer en v6.11.0.
- **Tests** : +3 assertions (note sidebar, note méthodologie, FAQ) — **373/373**.
- Gate : typecheck ✓ lint ✓ **373/373 tests** ✓ build ✓.
- Version 6.10.0 → **6.11.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.11.0`, footer landing v6.11.0, « Dernières éditions » v6.11.0 en tête), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.11.0).

---

## v6.10.0 — Graphiques : la valeur finale lisible sans hover, palette unifiée, légendes en chips

Suite de v6.9.0 — **release cumulée** : le panneau « Votre capital en détail » et ce lot partent ensemble (v6.9.0 n'ayant pas encore été livré). La courbe « Projection de votre capital » ne livrait sa conclusion qu'au survol : la valeur finale de chaque série (épargné, gains, impôts) s'affiche désormais **en bout de tracé**, sans hover, avec un point or sur « Gains ». Au passage, unification du vocabulaire visuel des graphiques : une seule palette partagée avec le camembert, légendes en chips, axes et infobulles harmonisés sur tous les onglets. **372 tests**, gate 100 % vert.

### 🔄 Changements

- **`EquityChart.tsx`** : **labels de fin de courbe** (`label` custom sur chaque Area/Line) — la valeur finale de chaque série est lisible sans hover ; point or sur « Gains » avec la variante texte profonde `gainsAlt` (#7a5807, WCAG AA 4.5:1 sur ivoire) ; marge droite élargie (`right: 64`) pour loger les labels hors du tracé sans rogner ; dégradés légèrement allégés.
- **Palette unifiée** (`chartTheme` + `CapitalAllocation.tsx`) : le camembert abandonne sa `PALETTE` locale pour les couleurs des courbes — mêmes concepts (épargné/gains), mêmes couleurs. Or de marque `gains` (#996f09 clair / #E3B341 sombre), `gainsAlt` (#7a5807 / #B8960F) ajouté pour le texte et l'échelle « euros d'aujourd'hui », gris acier `invested` standardisé (#5f6b7a / #9aa3af).
- **`LegendChip.tsx`** (nouveau composant partagé) : les légendes de graphique adoptent le vocabulaire badge de l'app (chip `bg-glass rounded-full`), swatch point plein (aires) ou trait pointillé (ligne impôts). Appliqué à EquityChart + ComparisonChart.
- **Axes & infobulles harmonisés** : `tickMargin` 8 et axes sans filets partout (Drawdown compris — grille verticale retirée) ; en-tête d'infobulle séparé par un filet (`border-b`) dans CustomTooltip, Equity, Comparison et Monte Carlo ; grille claire plus affirmée (0.06 → 0.08) ; `animate-scale-in` sur les cartes de graphique.
- **Tests** : assertions `chartTheme` mises à jour (grille 0.08, or #996f09, gainsAlt, invested) — toujours **372/372**.
- Gate : typecheck ✓ lint ✓ **372/372 tests** ✓ build ✓ (dist 1 117 ko / 322 ko gzip).
- Version 6.8.2 → **6.10.0** (release cumulée 6.9.0 + 6.10.0 ; package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.10.0`, footer landing v6.10.0, « Dernières éditions » v6.10.0 en tête), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.10.0).

---

## v6.9.0 — Synthèse : un panneau « Votre capital en détail » à la place des 4 cartes flottantes

Retour utilisateur : _« ça ne s'intègre pas très bien au reste du truc — c'est entre le patrimoine estimé et le graphique »_ (bundles /process + /ui-ux, diagnostic impeccable + APEX -axv). Les 4 cartes de `SummaryStats` étaient le **seul bloc de l'onglet sans titre ni conteneur** — posé entre deux grandes cartes glass titrées (héro et graphique), il se lisait comme un corps étranger. **372 tests**, gate 100 % vert, vérifié en navigateur réel (desktop + mobile).

### 🔄 Changements

- **`SummaryStats.tsx`** : le bloc devient **un panneau glass titré** (`SectionHeader` h2, icône PieChart) **« Votre capital en détail »** — l'anatomie de toutes les sections de l'onglet. Les 4 mesures (Valeur brute, Net fiscal, Impôt théorique, Total épargné) en **colonnes séparées par des filets verticaux** (`lg:divide-x`), fini les 4 boîtes flottantes : le rythme devient héro → panneau de détail → graphique.
- **Gains de la bourse** : la ligne grise en légende de la carte « Total épargné » devient une **vraie statistique en or** (`--color-value-gold`), avec « + » et **les deux échelles** (nominal + réel — plus d'ambiguïté silencieuse au toggle).
- **Répétition d'échelle supprimée** : « en euros d'aujourd'hui » ×4 → **légende partagée** dans l'en-tête du panneau (pastilles « sur le compte en 2045 » / « en euros d'aujourd'hui », échelle active mise en avant). `DualAmount` gagne `hideSecondaryLabel` + `prefix` (aria-label toujours complet).
- **`HeroResult.tsx`** : légende de la barre « Croissance » → « **Gains de la bourse** » avec « + » — un seul vocabulaire pour le même chiffre (héro, panneau, rapport).
- **`PatrimonialReport.tsx`** : la ligne gains de la carte « Total épargné » passe en or (même doctrine que l'app).
- **Tests** : 2 tests `DualAmount` (hideSecondaryLabel, prefix) + 1 test panneau `SummaryStats`.
- Gate : typecheck ✓ lint ✓ **372/372 tests** ✓ build ✓ (dist 1 117 ko / 322 ko gzip).
- Version : **livrée dans v6.10.0** (release cumulée — le bump 6.9.0 n'a pas été publié seul ; package.json, lock, `sw.js` `CACHE_VERSION`, footer landing et « Dernières éditions » portent v6.10.0).

---

## v6.8.2 — Landing : un seul rythme vertical (le « trou » en moins, partout)

Suite directe du retour _« supprime un peu ce trou au-dessus »_ : après la suppression de la bande vide sous l'en-tête (héro `pt-20` → `pt-14`, colonnes alignées en haut au lieu du centrage vertical qui poussait la colonne la plus courte vers le bas), uniformisation de **toute** la landing sur une seule échelle verticale. **369 tests**, gate 100 % vert, vérifié en navigateur réel (mesures DOM Playwright, desktop + mobile).

### 🔄 Changements

- **`LandingPage.tsx`** : les six sections (Fonctionnalités, Scénarios, Enveloppes, Méthodologie, Pour qui, FAQ), « Dernières évolutions » et l'appel final passent de paddings disparates (`py-16 sm:py-24`, `py-10 sm:py-14`, `py-20 sm:py-28`) à **un seul rythme `py-14 sm:py-20`** (56/80 px) — même respiration partout, 16 à 32 px de moins d'air entre chaque bloc ; héro `pb-16 sm:pb-20` → `pb-14 sm:pb-20` pour s'aligner sur les sections ; bande « Chiffres clés » conservée compacte (`py-10`, c'est un bandeau, pas une section). « Dernières éditions » : entrée **v6.8.2** en tête (v6.5.1 sortie pour garder 4 cartes), footer → v6.8.2.
- Gate : typecheck ✓ lint ✓ **369/369 tests** ✓ build ✓ (dist 1 113 ko / 321 ko gzip).
- Version 6.8.1 → **6.8.2** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.8.2`, footer landing v6.8.2), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.8.2).

---

## v6.8.1 — Héro : la question du lecteur, avec les mots du lecteur

Deux retours utilisateur successifs : _« je trouve qu'on comprend pas trop ça non ? »_, puis _« c mieux mais c toujours moyen, pas très clair, ça sonne mal »_. Diagnostic en profondeur (audit `clarify`) : ① « Combien votre épargne peut-elle **devenir** ? » — « devenir » prend « que/quoi », pas « combien » : une quantité se dit avec **valoir** ; ② « vraiment » = bouche-trou qui s'ajoute à « vraie histoire boursière » et « Des chiffres réels » (trois affirmations de vérité dans le même bloc, ton défensif) ; ③ le registre « mystère magique » contredit la promesse de la marque (« des chiffres réels, pas des promesses ») ; ④ la question sans horizon ne dit pas _quand_ — alors que la démo affiche exactement « 25 ans ». Le héro demande désormais « Combien peut valoir votre épargne dans 25 ans ? » (la démo à droite répond à cette question précise) et le sous-titre définit le terme de marque en une apposition : « Votre nombre magique, c'est le capital final de votre épargne — calculé sur 100 ans de vraie histoire boursière, krachs inclus. En 30 secondes, sans inscription, sur votre appareil. » **369 tests**, gate 100 % vert, vérifié en navigateur réel (desktop + mobile).

### 🔄 Changements

- **`LandingPage.tsx`** : h2 du héro → « Combien peut valoir votre épargne **dans 25 ans** ? » (accent doré sur « dans 25 ans », horizon = durée par défaut du moteur, celle de la carte démo) ; coupe typographique en **2 lignes équilibrées** sur tous les viewports (spans `block` + `aria-label` — un `<br>` brut aurait collé « épargnedans » dans le nom accessible) ; sous-titre → « Votre nombre magique, c'est le capital final de votre épargne — calculé sur 100 ans de vraie histoire boursière, krachs inclus. En 30 secondes, sans inscription, sur votre appareil. »
- **`components.test.tsx`** : assertion du héro mise à jour (nouveau titre + sous-titre contenant « nombre magique »).
- Gate : typecheck ✓ lint ✓ **369/369 tests** ✓ build ✓.
- Version 6.8.0 → **6.8.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.8.1`, footer landing v6.8.1), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.8.1).

---

## v6.8.0 — Activation « Commencez ici » + CRO landing + hiérarchie textuelle

Passage `/full` (bundles business + research + ui-ux + process) : recherche marché réelle, audit CRO de la landing, revue du design system, implémentation TDD + revue adverse. Quatre livrables, zéro changement moteur — **369 tests**, gate 100 % vert, vérifié en navigateur réel.

### 🚀 Activation — bandeau « Commencez ici » (`utils/quickStart.ts` + `components/Layout/QuickStart.tsx`)

- Le blocage d'activation n°1 (retrouvé dans les sessions utilisateur et confirmé par les concurrents, qui convertissent tous via des profils concrets nommés) : à l'ouverture, rien ne dit quoi saisir. Un bandeau **une seule fois** propose 3 profils prêts à l'emploi — Premiers pas (25 ans), Carrière (35 ans), Retraite (55 ans).
- **Résultat d'abord** : chaque carte affiche le capital final **calculé par le vrai moteur** (`runSimulation`, jamais un chiffre en dur) en double échelle (sur le compte + € d'aujourd'hui, philosophie app).
- **Un clic** applique le profil (réglages + enveloppe + fiscalité, enregistré dans l'historique → annulable). Le bandeau disparaît au premier réglage modifié ou au X, et ne revient jamais (clé `snowball_v5_quickstart_dismissed`). Il ne s'affiche pas pour un visiteur qui a déjà des réglages sauvegardés.
- **Source unique** : la landing (« Pour qui ») et l'app partagent `QUICKSTART_PROFILES` — mêmes situations, mêmes chiffres, aucune dérive.

### 🎯 CRO landing (`LandingPage.tsx`)

- **CTA orienté bénéfice** : les 3 CTA « Lancer la simulation » / « Lancer l'app » (header, héro, appel final) → **« Calculer mon nombre magique »** (un seul langage de bénéfice qui promet le résultat) ; CTA secondaire du héro « Créer un compte » (contradictoire avec « Sans inscription ») → **« Voir la méthode »** (ancre `#methode`), l'inscription restant dans le header.
- **Sous-titre du héro orienté bénéfice** : « Découvrez combien votre épargne peut vraiment devenir, krachs inclus — en 30 secondes, sans inscription, sur votre appareil » (les détails techniques — MSCI World, 10 000 scénarios, enveloppes — descendent dans les sections).
- **Preuve sociale factuelle** sous les CTA du héro : « Des chiffres réels, pas des promesses » — chaque nombre est calculé en direct par le moteur (aucun témoignage ni compteur inventé, conforme à PRODUCT.md).
- **CTA sticky mobile** : bandeau en bas d'écran après 480 px de scroll (masqué ≥ sm où le header suffit), hors de l'ordre de tabulation quand invisible, fond dégradé pour la lisibilité.
- **Nav** : lien « Pour qui » ajouté (header + footer) — la section existait sans être référencée.

### 💡 Confiance fiscale — taux 2026 dérivés du moteur

- La landing citait les taux **2025** (« PFU 30 % », « 17,2 % ») — contradictoires avec le moteur qui applique les règles 2026 (PFU 31,4 %, PEA 18,6 %, AV exclue à 17,2 %). Vérifiés contre 5+ sources indépendantes (LFSS 2026) : **le moteur était correct** ; seuls les libellés de la landing mentaient.
- Fix : les taux de la landing sont désormais **dérivés de `taxRules.ts`** (`getTaxRules`/`pfuRate`/`fmtTaxPercent`) — plus aucun taux en dur qui se périme.

### 🎨 Design tokens (`index.css`)

- `--color-text-dim` sombre `#a39a8c` → `#8d8578` : avant, quasi identique à `--color-text-muted` (#a09888) — la hiérarchie textuelle s'effondrait à un seul niveau. 5,3:1 sur la surface sombre (AA ✓) ; le mode clair était déjà correct, inchangé.

### 🧪 Tests & gate

- **+8 tests composants** (361 → 369) : rendu 3 profils avec capital moteur + double échelle, application au clic (réglages + fermeture + persistance), fermeture au X, disparition au premier réglage modifié, masqué pour visiteur connu ; nav « Pour qui », CTA sticky caché → visible après scroll, taux 2026 affichés / 2025 absents.
- Gate : typecheck ✓ lint ✓ **369/369 tests** ✓ build ✓ (dist 1,11 Mo / 321 ko gzip) · navigateur réel (landing + app, données locales restituées à l'identique) · console 0 erreur.
- Version 6.7.2 → **6.8.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.8.0`, footer landing v6.8.0, « Dernières éditions »), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.8.0).

---

## v6.7.2 — « Euros d'aujourd'hui » décoché par défaut (la valeur du compte d'abord)

Demande utilisateur : _« je veux que cette option NE SOIT PAS COCHÉE PAR DÉFAUT ! Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout »_. L'affichage démarre à nouveau sur les **euros courants** : le chiffre principal est ce qui sera réellement sur le compte. Le moteur calcule TOUJOURS les deux échelles — le toggle « Euros d'aujourd'hui » reste là pour mettre le pouvoir d'achat en avant, et la double échelle (`DualAmount`) continue d'afficher les deux montants partout. **361 tests**, gate 100 % vert.

### 🔄 Changements

- **`migration.ts`** : `DEFAULT_INPUTS.showReal = false` (avant `true`). Commentaires mis à jour. Migration v4 : fallback `showReal: s.showReal === true` — un choix v4 explicitement « true » reste respecté, sinon défaut (faux) comme pour un nouvel utilisateur.
- **Aucun autre changement** : `DualAmount`, `Sidebar`, cartes, graphiques et rapport affichent déjà les deux échelles simultanément (le libellé du toggle — « Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout » — décrit exactement le comportement conservé).
- **Tests** : défaut moteur `showReal = false`, migration v4 (undefined → faux, false → faux, true → vrai), toggle **décoché** au rendu d'App.
- Gate : typecheck ✓ lint ✓ **361/361 tests** ✓ build ✓.
- Version 6.7.1 → **6.7.2** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.7.2`, footer landing v6.7.2), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.7.2).

---

## v6.7.1 — Réglages repliables : rail d'icônes latéral style ChatGPT

Demande utilisateur : _« je souhaite pouvoir vraiment bien replier le menu des réglages — un vrai repli sur le côté avec des petites icônes pour les catégories, un truc style ChatGPT »_. Le repli v6.2 (résumé compact) devient un **vrai rail latéral de 76 px** : la grille se resserre (380 px → 76 px, transition `grid-template-columns` animée), le panneau se rétracte en une colonne d'icônes sticky et le contenu gagne ~300 px. Zéro changement moteur — **361 tests**, gate 100 % vert, vérifié en navigateur réel (Playwright : layout, peinture des tooltips, sticky, mobile).

### 🚀 Rail replié (`Sidebar.tsx` — refonte de la vue repliée)

- **Marque dorée** en tête de rail (clic = déplier, même affordance que le logo ChatGPT), séparateur, puis **une icône par catégorie** (Votre épargne, Pourquoi ces chiffres ?, Paramètres avancés, Compte d'investissement, Frais, Votre profil) — `SlidersHorizontal` pour « Paramètres avancés » (l'icône sliders de la maquette, distincte du `Settings2` de la marque).
- **Tooltips au survol** (desktop) calqués sur ChatGPT : bulle sombre à droite de l'icône (`group/rail` + `role="tooltip"`), `title` natif en relais sur mobile (rail horizontal).
- **Navigation par clic** : cliquer une icône déplie la sidebar, ouvre la section ciblée, la fait défiler dans la vue (`scroll-mt-24` sous l'en-tête sticky) et y place le focus clavier.
- **Section active surlignée** : l'icône de la section ouverte porte la pastille or (`bg-primary/15` + `ring-primary/40` + `shadow-gold`), état piloté par Sidebar (sections désormais contrôlées via `open`/`onOpenChange` sur `CollapsibleSection` — API additive, les autres usages Rente/Simulator/MonteCarlo inchangés).
- **Utilitaires en bas** : bouton snapshot avec **badge compteur** (le nombre de snapshots sauvés reste visible replié) + chevron de dépliage.
- **Sticky desktop** (`lg:sticky lg:top-24`, `z-30`) : le rail reste accessible pendant le scroll ; la vue dépliée garde le comportement v6.1 (non sticky — la sidebar de 2 200 px ne doit pas épingler ses sections basses).
- **Mobile** : rail horizontal compact (icônes 36 px, `overflow-x-auto` en filet de sécurité), aucun débordement vérifié à 390 px.
- **Persistance** : clé `snowball_v62_sidebar_collapsed` conservée, l'état remonte dans `App.tsx` (nouveau module `utils/sidebar.ts`, pattern `uiMode.ts`) car c'est App qui resserre la grille.

### 🏗 Décisions d'architecture

- **Une source de vérité `SECTIONS`** : les icônes/libellés du rail et les titres des accordéons dépliés ne peuvent plus diverger.
- **Rail sans `overflow-hidden`** (les tooltips débordent à droite) + `lg:overflow-visible` sur le conteneur (un `overflow-x-auto` faisait apparaître une scrollbar parasite au survol — trouvé et corrigé en revue adverse, vérifié par `elementFromPoint`).
- **Focus managé** : après la navigation rail → section, le focus suit (sinon il retombe sur `<body>` après le remontage).

### 🧪 Tests & gate

- **+1 test composant** (361 au total) : repli → rail d'icônes (aria-labels des catégories, contenu masqué, persistance localStorage `"1"`) → clic « Votre profil » → déplié + section ouverte + sections précédentes préservées.
- Gate : typecheck ✓ lint ✓ **361/361 tests** ✓ build ✓ (dist ~1,1 Mo / 319 ko gzip).
- Vérification navigateur (Playwright 1440 px + 390 px) : aside 76 px, `grid-template-columns` 76px/1292px, colonne empilée, sticky maintenu à `top:96` après scroll 700 px, tooltip peint au-dessus du contenu (ordre de peinture prouvé), badge compteur après sauvegarde, rail mobile sans débordement.
- Version 6.7.0 → **6.7.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.7.1`, footer landing v6.7.1), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.7.1).

---

## v6.7.0 — Objectif aligné sur le scénario Central + Rapport PDF patrimonial de synthèse

Deux idées de la feuille de route : (1) la calculatrice « Combien investir ? » gardait un défaut **10,07 %/an** (synchro OFF) alors que l'app applique par défaut le scénario **Central 8,22 %/an** — le « fix cohérence » promis dans MEMORY (piste laissée v6.5.2) ; (2) l'export PDF, jusque-là `window.print()` brut, devient un **vrai rapport patrimonial de synthèse** (PISTES V6.1 — idée 2 validée). **361 tests**, gate 100 % vert, vérifié en navigateur réel (preview + Playwright au format A4).

### 🎯 Fix — la calculatrice Objectif parle le langage du scénario principal

- **`migration.ts`** : `DEFAULT_INPUTS.goalAnnualReturn` passe de **0.1007 (10,07 %/an — moyenne arithmétique)** à **0.0822 (8,22 %/an — rendement géométrique composé du scénario Central)** + commentaire périmé (« aligné sur l'onglet principal ») corrigé. Les états STOCKÉS gardent leur valeur saisie (choix utilisateur respecté).
- **`GoalTab.tsx`** : note de référence « 8,22 % brut (scénario Central) » (au lieu de « 10,07 % brut (moyenne MSCI World) »), infobulle du curseur mise à jour, commentaires audit alignés.
- **Tests** : référence moteur (défaut < 10,07 %), curseur à 8,22, ligne « 8,22 % ← » unique dans la comparaison (déduplication taux courant 8,22 vs composé 8,2196), carte principale = ligne du tableau.

### 📄 Rapport PDF patrimonial (`components/Report/PatrimonialReport.tsx`, nouveau)

- **Vue imprimable dédiée** : montée à la demande au clic « Rapport PDF » (menu Exporter), rendue hors-écran à 794 px (≈ A4 96 dpi — Recharts mesure correctement son conteneur), puis `window.print()` après paint (double rAF, repli setTimeout). Une fois monté, il suit l'état courant (`rows`/`inputs`).
- **Page de garde** : marque, date de génération, « le nombre magique » (échelle du toggle, l'autre échelle en dessous), barre épargné/croissance, insight « multiplié par ~N », paramètres clés (capital, épargne, durée, enveloppe, scénario + taux, inflation).
- **Synthèse** : les 4 cartes du rapport alignées sur `SummaryStats` (échelle mise en avant + l'autre en sous-titre — une seule doctrine), rendement net XIRR / réel / multiple, **graphique de projection** (Recharts, échelle euros courants + courbe pouvoir d'achat en pointillés).
- **Fiscalité** : mêmes lignes que le `FiscalPanel` (`computeTaxBreakdown`, mêmes arguments) + taux effectif + note « estimation, liquidation théorique ».
- **Détail année par année** : tableau complet (année, versé, intérêts, capital, pouvoir d'achat) — imprimé intégralement (un `max-height` aurait clippé le détail : trouvé et corrigé en revue adverse).
- **Méthodologie + mentions** : 100 ans d'historique, scénario appliqué, fiscalité française, inflation (Fisher), Monte Carlo, disclaimer « non contractuel, 100 % local ».
- **Print CSS** (`index.css`) : `.app-shell` masqué, `.report-print-only` seul imprimé (position static, light forcé, `print-color-adjust: exact`), `@page A4` marges 14 mm, page de garde = page pleine (`break-after: page`), lignes de tableau insécables.
- **ExportMenu** : description « Rapport patrimonial de synthèse — imprimer ou enregistrer en PDF ».

### 🧪 Tests & gate

- **+2 tests composants** (361 au total) : rapport absent avant clic, monté au clic « Rapport PDF » avec `window.print` appelé (couverture, héro, XIRR, fiscalité, tableau, méthodologie).
- Gate : typecheck ✓ lint ✓ **361/361 tests** ✓ build ✓ (dist ~1,1 Mo / 319 ko gzip).
- Vérification navigateur : preview réelle (montage, cartes alignées sur l'app, console 0 erreur) + **Playwright à 794 px** (2 sections, 26 lignes de tableau, graphique rendu, **0 débordement** au format A4).
- Version 6.6.1 → **6.7.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.7.0`, footer landing v6.7.0), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.7.0).

---

## v6.6.1 — Titres uniformes : « Réglages » et « Votre patrimoine estimé » sur l'anatomie SectionHeader

Demande utilisateur : _« ces 2 titres ne sont pas à la même taille que les autres, ils respectent pas le style »_ — les titres « RÉGLAGES » (en-tête de la sidebar) et « VOTRE PATRIMOINE ESTIMÉ » (héro de l'onglet Projection) échappaient à l'anatomie de titre uniforme (v5.6.4) avec un mini-label 10 px muet. Correction : migration des deux titres sur le composant **`SectionHeader` niveau `card`** — barre dorée `w-1 h-5` + icône lucide 16 px + titre `font-extrabold uppercase tracking-[0.08em]` 13 px (14 px ≥ sm), le même rythme que « PROJECTION DE VOTRE CAPITAL » / « STATISTIQUES CLÉS ». Zéro changement moteur — **358 tests**, gate 100 % vert.

### 🏷 Composants

- **`Sidebar.tsx`** : l'en-tête « Réglages » devient `<SectionHeader level="card" icon={Settings2} title="Réglages">` — le badge de scénario (comparaison A/B) et le bouton replier/déplier sont conservés dans `trailing` (`className="mb-6 items-center"`).
- **`HeroResult.tsx`** : le libellé « Votre patrimoine estimé » devient `<SectionHeader level="card" as="span" icon={Wallet} title="Votre patrimoine estimé">` — badge « 25 ans · 2050 » en `trailing` ; le `h2` sr-only (hiérarchie de titres) est conservé.

### ✅ Vérifications

- Gate : typecheck ✓ lint ✓ **358/358 tests** ✓.
- Navigateur (dev) : styles calculés strictement identiques entre les 3 titres (13 px, poids 800, tracking 1,04 px, barre 20 px, icône 16 px) — clair + sombre, 0 erreur console.
- Version 6.6.0 → **6.6.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.6.1`, footer landing v6.6.1), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.6.1).
- Déploiement : `vercel --prod` → **https://snowball-pro.vercel.app**.

## v6.6.0 — Refonte de la landing : démo interactive du héro + méthodologie clarifiée

Demande utilisateur : _« fait une refonte de la landing page »_ puis _« C TOUT INVERSE, IN COMPREND RIEN, C MOCHE »_ sur la section Méthodologie. Refonte complète de la landing : le héro devient une **démo interactive exécutée par le vrai moteur** — bascule Prudent / Central / Optimiste, la courbe se redessine et le « nombre magique » (capital final) se recalcule en direct avec la décomposition épargné / croissance. La section Méthodologie est réordonnée selon le langage canonique de l'app (échelle **Brut → Composé → Réel**, chaque étape retire une seule chose) et le SEO est en place (données structurées, canonical, sitemap, robots, vérification Google, GoatCounter). Bump 6.5.2 → **6.6.0**. Zéro changement moteur (ancrages dorés intacts) — **358 tests**, gate 100 % vert.

### 🌐 Landing (`components/Landing/`)

- **Héro interactif** : sélecteur segmenté Prudent / Central / Optimiste avec les taux réels lus dans `getHistoricalDataset` (5,99 / 8,22 / 10,07 % — jamais en dur). `HeroChart` accepte désormais `rows` / `inputs` / `footer` pour être piloté par le parent (la démo recalcule sans recréer le composant) tout en restant autonome (démo par défaut).
- **Nombre magique** : capital final animé (compteur), « en € d'aujourd'hui », barre de décomposition **Épargné vs Croissance** — le résultat d'abord, comme promis dans PRODUCT.md.
- **Nouvelle accroche** : « Le nombre magique de votre épargne, calculé sur 100 ans de vraie histoire boursière ».
- **Méthodologie clarifiée** (retour utilisateur) : échelle descendante **Brut (10,07 % · Optimiste) → Composé (8,22 % · Central, défaut) → Réel (5,99 % · Prudent)** avec flèches « on retire la volatilité » puis « on retire l'inflation », badge « défaut » sur la ligne composée, titre « Pourquoi 10,07 % → 5,99 % ? ». Même vocabulaire que le panneau « Pourquoi ces chiffres ? » de la sidebar.
- **Chiffres clés avec icônes**, sections resserrées, contenu factuel intégralement conservé (scénarios, enveloppes, FAQ, profils, mentions).

### 🚀 SEO (`index.html` + `public/`)

- Données structurées `WebApplication` (schema.org), canonical, `sitemap.xml`, `robots.txt`, fichier de vérification Google, GoatCounter configuré (`gabriel322jsj222`).

### ✅ Vérifications

- Gate : typecheck ✓ lint ✓ **358/358 tests** ✓ (test landing mis à jour : nouveau titre « Pourquoi 10,07 % → 5,99 % ? ») build ✓.
- Navigateur (dev) : bascule de scénario 518 765 € → 365 411 € → 700 394 €, 0 erreur console ; section Méthodologie réordonnée vérifiée en texte réel.
- Version 6.5.2 → **6.6.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.6.0`), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.6.0).
- Déploiement : `vercel --prod` → **https://snowball-pro.vercel.app**.

## v6.5.2 — Clarté des taux : la chaîne brut → net de frais → réel est enfin visible (8,22 → 7,95 → 5,73)

Demande utilisateur : _« pourquoi quand je mets 8,22 %/an, ça me met 8 % et 5,7 % net ??? je crois que les rendements ne sont pas synchronisés, tout est différent partout »_. Audit moteur + vérification chiffrée : **aucune désynchronisation des calculs** — le XIRR 7,95 % = scénario 8,22 %/an brut − 0,25 %/an de frais (sans frais, le XIRR = 8,22 % pile, prouvé), et le réel 5,73 % = (1 + 7,95 %) ÷ (1 + 2,1 %) − 1. Mais l'**affichage était trompeur** : la carte « Rendement / an » disait « brut » alors que le XIRR est net de frais, les taux étaient arrondis à 1 décimale (« 8,0 % » pour 7,95), le taux appliqué (8,22 %/an brut) n'apparaissait nulle part dans les KPIs, et l'insight comparait au 10,07 % arithmétique (référence périmée depuis v6.4). Bump 6.5.1 → **6.5.2**. Zéro changement moteur (ancrages dorés intacts).

### 🖥 `KpiGrid` — la chaîne devient explicite

- **Ligne de chaîne sous « Statistiques clés »** : « Taux appliqué : **8,22 %/an brut** (scénario Central) → **7,95 % net de frais** → **5,73 % après inflation** » — dérivée du moteur (scénario + XIRR + réel), aucune valeur en dur.
- **Carte « Rendement / an » → « Rendement net / an »** : le XIRR est net de frais, l'étiquette « brut » qui faisait croire à une désynchronisation est supprimée ; sous-titre « net de tous vos frais, avant impôts et inflation ».
- **Carte « Après inflation »** : la **formule de Fisher avec les valeurs affichées** « (1 + 7,95 %) ÷ (1 + 2,10 %) − 1 = 5,73 % » — l'inflation est IMPLIQUÉE par les deux valeurs (exacte au centième dans toutes les configurations ; le test a attrapé un arrondi ratio/pourcentage qui affichait « 2,00 % → 5,83 % » à côté de « 5,73 % »). La mention confuse « référence historique réelle ≈ 5,99 %/an » est retirée.
- **2 décimales sur les deux cartes de taux** (7,95 % au lieu de « 8,0 % ») : la collision « 5,7 % = 5,7 % » (réel du Central = net de frais du Prudent) disparaît, chaque étage a son étiquette.

### 🔍 `AIInsightCard` — référence alignée sur le scénario courant

- L'insight comparait le XIRR à la moyenne arithmétique **10,07 %** (commentaire « c'est elle que la courbe lissée applique » devenu faux depuis v6.4) — il est désormais comparé au **taux brut du scénario choisi** : « proche du taux brut appliqué de 8,22 %/an (scénario Central) ». 2 décimales partout, « après frais » au lieu de « brut ».

### 🧪 Tests & gate

- **+5 tests composants** (358 au total) : chaîne complète Central (8,22 → 7,95 → 5,73), suivi du scénario (Optimiste 10,07 → 9,79 → 7,53), frais = 0 → brut = net de frais (le scénario est le seul levier), AIInsight (référence scénario + « XIRR après frais » en mode Avancé).
- Gate : typecheck ✓ lint ✓ **358/358 tests** ✓ build ✓ · détecteur impeccable **0 finding** · vérifié en navigateur réel (3 scénarios : chaînes exactes + formules Fisher cohérentes au centième, 0 erreur console).
- Version 6.5.1 → **6.5.2** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION`, titre index.html), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.5.2). Déploiement `vercel --prod`.

---

## v6.5.1 — Scénario de rendement : intégration fluide dans la sidebar

Retour utilisateur : _« cette nouvelle partie ne s'intègre pas très bien… supprime la sorte de trait entre durée et cette partie »_. Le sélecteur prudent / central / optimiste (déjà déplacé dans « Votre épargne ») s'intègre désormais naturellement à la section, sans rupture visuelle.

### 🎨 Intégration

- **`ScenarioSelector.tsx`** : le trait séparateur (`border-t`) entre « Durée » et « Scénario de rendement » est supprimé — simple espacement de 12 px, même rythme que « Tolérance au risque » du même panneau.
- **Cartes inactives allégées** (`bg-surface-50/60` au lieu du verre) : même langage que les cartes internes de la sidebar ; cartes légèrement plus compactes.
- Sémantique **radiogroup** conservée (roving tabindex, flèches ←/→/↑/↓/Home/End) — le héro de l'onglet Projection reste la première chose vue.

### 🔧 Hygiène de version

- Synchronisation v6.5.0 incomplète corrigée : `package-lock.json` (6.4.0 → 6.5.1) et `public/sw.js` `CACHE_VERSION` (`snowball-pro-v6.4.0` → `snowball-pro-v6.5.1`) étaient restés en retard.

### 🧪 Gate

- Typecheck ✓ lint ✓ **353/353 tests** ✓ build ✓ · vérifié en navigateur réel (sombre + clair : trait absent, cartes intégrées, bandeau médiane intact, 0 erreur console).
- Version 6.5.0 → **6.5.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION`, titre index.html), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.5.1). Déploiement `vercel --prod`.

---

## v6.5.0 — Audit honnêteté : les 30 points vérifiés et corrigés

Audit systématique des 30 points d'honnêteté (moteur, fiscalité, affichage) — chaque correction est couverte par un test ou une vérification navigateur. Deux nouveautés produit notables : un **mode Débutant / Avancé** (les notions techniques — XIRR, PFU, TMI, Fisher, Pástor–Stambaugh, Guyton–Klinger — sont masquées par défaut) et une **validation de cohérence âge / durée / retraite**. **353 tests**, gate 100 % vert, vérifié en navigateur réel (desktop + mobile, zéro erreur console).

### 🎛️ Mode Débutant / Avancé (audit item 12)

- **`Sidebar.tsx` / `ActionBar.tsx`** : bascule « Mode Débutant / Avancé » dans le nouveau menu « ⋯ » du header — la préférence persiste (`uiMode.ts`). En Débutant : XIRR, sélecteur PFU / barème TMI, formule de Fisher, Pástor–Stambaugh et Guyton–Klinger sont masqués (remplacés par des résumés clairs) ; en Avancé, tout redevient visible.

### 📊 Moteur & chiffres (items 1/3/8/11/13/22/24/27)

- **`decumulation.ts`** : `withdrawalsNetReal` — la rente en € d'aujourd'hui, déflatée comme le reste de l'app.
- **`validation.ts`** : cohérence âge actuel + durée vs âge de retraite (avertissement visible sur l'onglet Rente).
- **`migration.ts`** : enveloppe versionnée `{ version, inputs }` — lecture rétro-compatible, réécriture à la prochaine sauvegarde.
- **`taxRules.ts`** : inchangé — les taux 2026 (18,6 % social CTO / 17,2 % AV) étaient déjà corrects.

### 🖥️ Affichage honnête (items 2/4/5/6/7/10/15/16/17/19/20/30)

- **Rente** : capital à décumuler explicite (brut + net de sortie), bandeau risque en haut, couverture en € d'aujourd'hui, cartes P10/P50/P90 à double échelle (nominal + réel).
- **Objectif** : synchronisation avec le scénario principal (la durée et le rendement du Simulateur pilotent les cartes), tableau de comparaison dédupliqué (une seule ligne « 10,07 % ← »), P90 = 0 expliqué.
- **Méthodologie** : le panneau cite le scénario réellement appliqué (Central 8,22 %) au lieu de la moyenne arithmétique — plus de contradiction.
- **Calendrier des flux** : le total des impôts est remplacé par « — » (non cumulable : somme sans sens) ; le capital initial réconcilie le total versements.
- **Sidebar** : accordéons repliés par défaut, « Risque » → « Tolérance », âge / durée / retraite visibles.
- **Header** : actions secondaires (Comparer, Partager, mode, réinitialiser) dans le menu « ⋯ » ; « Se connecter » clarifié.

### 🧪 Tests

- `audit-fixes.test.ts` (20 nouveaux) : taux effectif du 1er retrait, réconciliation des retraits, validation d'âge, migration, percentiles. Tests composants mis à jour pour le mode Débutant/Avancé.

---

## v6.4.1 — Scénario de rendement dans les réglages : le résultat d'abord

Demande utilisateur : _« le Scénario de rendement gâche la vue, mets-le dans les réglages, dans Votre épargne »_. Le sélecteur prudent / central / optimiste quitte le haut de l'onglet Projection et rejoint la section **« Votre épargne »** de la sidebar, sous la durée — le héro ouvre désormais la vue sans écran de réglages. Zéro changement moteur : seule la couche d'affichage est déplacée.

### ↔️ Déplacement (même composant, même logique)

- **`ScenarioSelector.tsx`** : version compacte verticale (3 rangées radio label + taux, bandeau « médiane historique » conservé pour le scénario Central) — adaptée à la largeur de la sidebar (380 px), là où la grille 3 colonnes écrasait les cartes.
- **`Sidebar.tsx`** : le sélecteur s'insère dans « Votre épargne » (capital → mensualité → durée → scénario). Le texte de « Pourquoi ces chiffres ? » référence la nouvelle position (« le scénario choisi dans « Votre épargne » »).
- **`SimulatorTab.tsx`** : le sélecteur est retiré du haut de l'onglet — le héro « Votre patrimoine estimé » est la première chose vue (cohérent avec l'entonnoir v6 : le résultat d'abord).

### 🧪 Gate

- Typecheck ✓ lint ✓ tests ✓ · nouveau test composant : le sélecteur vit dans la sidebar, un clic sur Optimiste change la projection et retire le bandeau médiane (retour Central = bandeau restauré).

---

## v6.4.0 — Honnêteté des hypothèses : frais réalistes, projection médiane, rente nette, profil de risque

Checklist produit de l'utilisateur (« corrections prioritaires », 10 sections) passée au crible du moteur, puis implémentée en 3 paquets : (1) **honnêteté des hypothèses** — plus jamais 0 % de frais par défaut, projection centrale sur la médiane historique, Monte Carlo en euros réels ; (2) **rente nette + objectif inversé robuste** — le décaissement applique enfin la fiscalité des retraits et les frais de gestion, et l'objectif inversé calcule le versement pour P10/P50/P90 ; (3) **profil utilisateur** — âge, pensions, dépenses, tolérance au risque et alerte « plan trop risqué ». **Changement de paradigme moteur** : la projection par défaut passe de la moyenne arithmétique (10,07 %) au rendement géométrique composé (8,22 %) — le chiffre honnête (733 k€ → 519 k€ sur le scénario par défaut). **327 tests**, gate 100 % vert, vérifié en navigateur réel (desktop + mobile, zéro erreur console).

### 📉 Projection centrale sur la médiane historique (paquet 1)

- **3 scénarios de rendement** (`returnScenario` : `prudent` / `central` / `optimiste`) sur l'onglet Projection — les trois étages de l'échelle historique : réel composé 5,99 % (prudent), **géométrique composé 8,22 % (central, DÉFAUT)** et moyenne arithmétique 10,07 % (optimiste). Bandeau « Projection centrale basée sur la médiane historique, pas sur la meilleure moyenne ».
- **`simulation.ts`** : `returnForYear` lit le scénario (au lieu de la constante 10,07 %) — la courbe lissée reste constante, seule la référence change. `getHistoricalDataset` (avait déjà les 3 étages) reste la source de vérité.
- **Ancrages dorés régénérés** : le fichier golden fige désormais le scénario central + frais 0,25 % (`taxYear: 2025` conservé pour la rétrocompatibilité fiscale). Les tests « courbe lissée » et « formule fermée » fixent explicitement le scénario optimiste pour préserver leur sens.

### 💶 Frais réalistes par défaut (paquet 1)

- **0,25 %/an d'ETF et 0,75 %/an d'assurance-vie** par défaut (applications : ETF sur tous les comptes, enveloppe AV seulement sur l'AV — même logique que le moteur). Courtage et gestion pilotée restent à 0 (optionnels). Les états STOCKÉS conservent leurs frais saisis (choix des utilisateurs respecté).
- **`FeeImpact`** : état positif « 🎉 Aucun frais : votre croissance n'est pas rognée » quand tout est à 0, avec les défauts réalistes rappelés.

### 💶 Monte Carlo en euros réels (paquet 1)

- Chaque scénario calcule désormais DEUX échelles : nominal net d'impôts et **déflaté par l'inflation réellement rejouée** (`taxNet × real / nominal`). Nouvelles bandes `p10r`/`p50r`/`p90r` + **`successRateReal`** (proba d'atteindre l'objectif en pouvoir d'achat — toujours ≤ le taux nominal : 22,5 % vs 40,5 % sur le défaut).
- **UI** : toggle « Euros courants / Euros d'aujourd'hui » sur le graphique + carte « Chances d'atteindre votre objectif » qui montre les deux taux.

### 🏦 Rente nette — le décaissement applique enfin la fiscalité et les frais (paquet 2)

- **`decumulation.ts`** : chaque retrait est taxé au prorata du coût fiscal restant (base = les VERSEMENTS `investedNom`, pas le nominal — sinon les gains latents de l'accumulation n'étaient jamais taxés, revue adverse) : CTO (PFU ou barème), PEA (sociales seules après 5 ans), AV (abattement après 8 ans), PER (versements déductibles à la TMI + gains au PFU). Frais de gestion annuels sur l'encours, comme en accumulation. La rente reçue est NETTE (brut − impôt) ; le capital draine le brut.
- Nouveaux résultats : `withdrawalsNet`, `totalTaxPaid`, `totalFeesPaid`, `netInitialWithdrawal` — affichés dans le verdict (rente nette en moyenne, facture fiscale totale) au lieu de la divulgation « fiscalité non modélisée ».
- **Perf** : notes fiscales optionnelles (`noNotes`, boucle chaude) + saut du calcul après ruine → décaissement 2 000 runs = 665 ms (10 k ≈ 3 s).

### 🎯 Objectif inversé robuste (paquet 2)

- **Toggle « Utiliser mon scénario principal »** (`goalSync`) : l'onglet reprend le capital, la durée, l'épargne et le rendement du scénario courant du Simulateur — fin de la calculatrice indépendante à 10 k€.
- **Versement nécessaire pour P10/P50/P90 par bisection Monte-Carlo** (`solveGoalMonteCarlo` / `solveGoalMonteCarloAsync`) : combien épargner pour atteindre l'objectif en période difficile (P10), médiane (P50) et favorable (P90) — calculé sur VOTRE capital, vos frais, votre fiscalité. Tableau comparatif : les 3 taux de scénario sont marqués d'un badge (Prudent / Central / Optimiste).

### 👤 Profil utilisateur & risque (paquet 3)

- **Section « Votre profil »** dans la sidebar : âge actuel, âge de départ à la retraite, dépenses retraite (€/mois), autres revenus retraite (€/mois), tolérance au risque (prudent/équilibré/audacieux), perte maximale acceptée (% ).
- **Onglet Rente** : repère d'âge (« retraite à X ans · fin de rente à Y ans »), **couverture des dépenses** (rente nette + pensions vs dépenses, manque à gagner si < 100 %) et **alerte « plan trop risqué »** (pire repli historique réellement rejoué vs tolérance du profil — ambre si dépassé).

### ✏️ Libellés « impôt théorique » (paquet 1)

- Colonnes et cartes renommées : « Impôt théorique » (Calendrier des flux, carte de synthèse), « Après impôt théorique » (détail annuel), « Votre impôt théorique (si vente totale) » et « Total impôt théorique » (panneau fiscal) — l'impôt latent n'est jamais présenté comme payé (il l'était déjà en note, il l'est maintenant dans les en-têtes).

### 🧪 Gate

- Typecheck ✓ lint ✓ **327/327 tests** ✓ build ✓ (dist 1 052 kB / 307 kB gzip) · 18 nouveaux tests (scénarios, MC réel, fiscalité du décaissement, base fiscale, inversion MC, bornes du profil) · vérification Playwright : sélecteur de scénario + bandeau médiane, MC 10 k avec succès réel, rente nette + tolérance au risque après run, sync Goal active, inversion P10/P50/P90 au clic, section Profil, 0 erreur console, aucun débordement mobile (390 px).
- Version 6.3.0 → **6.4.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION = "snowball-pro-v6.4.0"`, titre index.html), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.4).

---

## v6.3.0 — Passe d'harmonisation design system : les couleurs parlent enfin le même langage

Suite d'un audit externe (50 détections, généré depuis des captures d'une version ≤ v6.1) : vérification visuelle en navigateur réel (phase B) puis correction des incohérences confirmées (phase A). L'audit contenait ~40 % de points déjà corrigés en v6.2 et quelques affirmations fausses (éliminées par mesure) ; le noyau restant — couleurs hors charte, rouge sémantique mal utilisé, alignements — est traité ici. **Zéro changement moteur** : uniquement la couche d'affichage. **308 tests**, gate 100 % vert, vérifié en navigateur réel (desktop 1440 + mobile 390, clair + sombre).

### 🎨 Rouge sémantique — le rouge ne signale plus que de vrais coûts

- **Frais et impôts à 0 € en neutre** (Calendrier des flux, Détail année par année, carte « Ce que les frais vous coûtent ») : avant, les colonnes étaient rouges même à 0,00 € — le rouge ne marque plus que les montants réellement payés.
- **« Krach simulé » et le bloc réglage « Partir en période difficile » en ambre** : c'est un scénario durci CHOSI par l'utilisateur, pas une erreur — le danger rouge est réservé aux échecs réels.
- **Carte verte « Objectif irréaliste » neutralisée** (onglet Combien investir ?) : la difficulté est portée par la pastille de couleur, plus par le fond de carte.

### 🎯 Onglet « Combien investir ? » rebrandé or

- **Fini l'indigo `#6366F1`** : sliders, cartes de résultat, ligne du tableau comparatif et surlignage passent sur les tokens or/ivoire de la charte.
- **Barre de progression sans arc-en-ciel** : le dégradé néon indigo/vert/ambre est remplacé par un dégradé or — le statut est porté par le pourcentage, pas par la couleur.

### 📊 Graphiques alignés sur les tokens (clair et sombre)

- P10/P90, médiane/moyenne de l'histogramme, barres de ruine et cartes de scénarios Monte Carlo : les hex « Tailwind par défaut » (`#4ADE80`, `#F87171`, `#60A5FA`) sont remplacés par `--color-success` / `--color-danger` / `--color-accent` — les couleurs s'adaptent désormais au thème.
- **Ligne objectif étiquetée « Objectif »** sur le graphique Monte Carlo (avant : un trait bleu muet) et passée en ambre.
- **Modèles de retrait de la Rente tokenisés** (menthe/bleu vif → succès/accent) ; les tons alpha hex `#XX18` deviennent `color-mix()` (les variables CSS n'acceptent pas le suffixe hex-alpha).

### 📐 Méthodologie & tableaux

- **Méthodologie alignée à gauche** : les longues explications n'ont plus un bord gauche en dents de scie.
- **Tableaux** (comparaison annuelle, calendrier des flux, détail annuel, comparatif d'objectif) : montants alignés à droite, zebra léger, totaux sur fond teinté, zéros en neutre.

### ✏️ Micro-texte & états

- **Badge « FIXE » → « Montant fixe »** à côté de la rente personnalisée.
- **CTA « Lancer » dans l'état vide Monte Carlo** : avant, il était en haut de l'onglet, à ~520 px de la zone vide — l'action vit maintenant là où l'utilisateur la cherche.

### 🐛 Bug visuel confirmé en vérification : débordement des champs de la sidebar

- Les saisies directes « Augmentation de votre épargne » et « Courtage sur chaque versement » dépassaient le bord droit de la sidebar (rognées par `overflow-hidden`, ~34 px) — dépendant de la largeur réelle de la police mono, donc invisible en dev rapide. Fix : label `flex-1` (s'enroule) + zone de saisie `shrink-0` dans `SliderInput`.

### 🎚️ Tokens

- **`--color-warning` clair assombri** (`#b8860b` → `#8a6508`) : le texte ambre sur crème passait sous le seuil AA (2,9:1) → **4,76:1** — bénéficie à tous les usages existants (Euros d'aujourd'hui, colonne « En € d'aujourd'hui »…).

### 🧪 Gate

- Typecheck ✓ lint ✓ **308/308 tests** ✓ build ✓ (dist 1 031 kB / 302 kB gzip) · vérification Playwright : overflow éliminé (scrollWidth = clientWidth), indigo à 0 occurrence, label « Objectif » rendu sur le graphe, bloc krach ambre après lancement, run Monte Carlo complet depuis l'état vide, 0 erreur console, aucun débordement mobile (390 px).
- Version 6.2.0 → **6.3.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION = "snowball-pro-v6.3.0"`, titre index.html), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.3).

---

## v6.2.0 — Nettoyage UI P0+P1 : fin du « tout au même poids »

Suite à la critique UX (hiérarchie visuelle, répétitions), chantier d'organisation de l'information sur l'onglet Rente + respiration de la sidebar + hiérarchie typographique. Zéro changement moteur : uniquement la présentation. **308 tests**, gate 100 % vert, vérifié en navigateur réel (desktop 1440 + mobile 375, clair + sombre, clavier).

### 🧹 Onglet Rente & Retraite — le « bordel » concentré

- **Doublon supprimé** : la section du bas « Aperçu — rente possible selon le taux de retrait » redonnait les 3 mêmes montants que les cartes « Modèle de retrait » (2 130 / 3 408 / 4 686 €… affichés deux fois sur le même écran). Les cartes de modèle sont LE comparatif — suppression pure.
- **% de survie dédoublonné** : il n'apparaît plus que dans le verdict et la carte KPI « La rente dure-t-elle ? ». La boîte « En clair » est reformulée (quand l'argent manque, année de ruine) sans re-citer le chiffre ; le paragraphe de précision dit « ce taux » sans le répéter.
- **Verdict aplati** : « Krach simulé » et « En clair » sortent du bloc vert (3 niveaux de boîtes imbriquées → 1).

### ↔️ Sidebar repliable (préférence mémorisée)

- Bouton chevron dans l'en-tête « Réglages » (aria-expanded, aria-controls) : plie/déplie TOUTE la sidebar. Repliée, elle devient un **résumé compact** (capital · épargne/mois · durée · enveloppe) + « Rouvrir les réglages » — la largeur de 380 px est rendue au contenu sur les onglets où l'on ne règle rien.
- État persisté en localStorage (`snowball_v62_sidebar_collapsed`), comme le thème. Remontage simple sans AnimatePresence : **robuste sous prefers-reduced-motion** (une sortie bloquée laissait le panneau vide — bug trouvé en vérification et corrigé).

### 🎚️ Hiérarchie typographique : token « carte secondaire »

- Nouveau token `.card-subtle` (fond quasi transparent, bordure adoucie, pas d'ombre) appliqué aux blocs de support partout : cartes de synthèse, Statistiques clés, jalons, frais (Projection) ; cartes KPI, paramètres statiques, histogrammes (Rente) ; résultats Monte Carlo et progression d'objectif (Goal). Le héro et le verdict gardent le verre — le résultat principal respire enfin.
- **Focus clavier dans la charte** : fini l'outline bleu qui jurait (I7 v6.1). Double anneau `var(--color-primary)` + liseré surface — or vif en sombre (#d4af37, lisible sur l'onglet or), or assombri en clair (#7c5e0a) — WCAG 2.4.7 conservé, sliders inclus.

### 🧪 Gate

- Typecheck ✓ lint ✓ **308/308 tests** ✓ · détecteur impeccable (scope layout) **0 finding** · vérification Playwright desktop+mobile : grille 2 colonnes, sidebar repli/dépli, focus clavier aux couleurs du thème (clair + sombre), doublon absent, verdict aplati, zéro scroll horizontal (1440 et 375), **0 erreur console**.
- Version 6.1.0 → **6.2.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION = "snowball-pro-v6.2.0"`), CHANGELOG (cette entrée), MEMORY.md (entrée session v6.2). **Déployé en production** : `vercel --prod` → https://snowball-pro.vercel.app.

---

## v6.1.0 — Landing page + comptes locaux : l'app a une porte d'entrée

Demande utilisateur : _« Je veux créer une landing page de présentation de l'app, un système de création de compte et de login, et tout le tralala. »_ Deux gros morceaux : une **landing de persuasion** (mode impeccable) qui prouve la valeur avec une **démo exécutée par le vrai moteur**, et un **système de comptes 100 % local** (inscription, connexion, session persistée, changement de mot de passe, suppression du compte) avec isolation des données par compte. Deux idées v6.1 de l'utilisateur (onglet « Retraite par objectif », rapport PDF) enregistrées dans MEMORY.md pour plus tard. **308 tests**, gate 100 % vert, vérifié en navigateur réel. Bump 6.0.0 → **6.1.0**. Pas de déploiement Vercel (validation utilisateur requise).

### 🌐 Landing page (`components/Landing/`)

- **Routeur hash** (`router.ts`, `Root.tsx`) : `#/` (landing, défaut) · `#/app` (simulateur) · `#/login` · `#/register` — les liens partagés `#s=…` continuent d'ouvrir DIRECTEMENT l'app (rétrocompatibilité totale).
- **Héro avec démo réelle** (`HeroChart.tsx`) : le graphique de la landing n'est PAS une maquette — il exécute `runSimulation(parseStoredInputs(null))` (réglages par défaut) et dessine la courbe d'équité en SVG pur (nominal + pouvoir d'achat), animée (pathLength, respecte reduced-motion). Chiffres réels : capital final, croissance %.
- **Sections** : chiffres clés (100 ans · 10 000 scénarios · 4 enveloppes · 100 % local), 6 fonctionnalités, 4 enveloppes fiscales (CTO/PEA/AV/PER), méthodologie à 3 étages (10,07 → 8,22 → 5,99 + Fisher), 3 étapes, FAQ accordéon (5 questions), appel final, footer avec disclaimer. Tout est factuel (issu du CHANGELOG) : aucune promesse de rendement, aucun témoignage inventé.
- **Thème partagé** : la landing respecte et pilote la préférence claire/sombre de l'app (même clé `snowball_v5_theme`, util partagé `utils/theme.ts` — revue adverse).
- `PRODUCT.md` créé (vérité produit, workflow impeccable).

### 🔐 Comptes & login (`src/auth/`)

- **Moteur pur** (`auth.ts`, `hash.ts`) : comptes stockés sous `snowball_v6_accounts`, mots de passe JAMAIS en clair — `sha256(sel:mot-de-passe)` avec sel aléatoire de 16 octets (SHA-256 JS pur, vérifié sur les vecteurs NIST ; limité à du local-first, documenté). Session `snowball_v6_session`, purgée si le compte disparaît (jamais de session orpheline). Validations françaises (email, 8 car. + lettre + chiffre, nom).
- **Store React** (`store.ts`) : `useSyncExternalStore` — App se remonte avec le bon espace de stockage à chaque connexion/déconnexion.
- **Isolation par compte** (`storage.ts`) : invité = clés historiques (`snowball_v5_settings`…, rétrocompatibilité v4/v5 préservée) ; connecté = clés préfixées `u:<id>:`. Les données de l'invité ne migrent pas vers un compte (choix documenté en FAQ). Le thème reste global.
- **UI** (`components/Auth/`) : `LoginForm`, `RegisterForm` (erreurs inline par champ, force du mot de passe, confirmation), `AccountMenu` dans l'en-tête de l'app (avatar initiales, nom, email, changer le mot de passe, se déconnecter, supprimer le compte — double confirmation + mot de passe, purge des données scopées), `AuthScreen`/`AuthLayout` (marque or, carte glass, note « données sur cet appareil »).
- **Partage/export inchangés** : les liens partagés et l'export fonctionnent avec ou sans compte.

### 🧪 Tests & gate

- **+71 tests** (308 au total) : 21 auth (SHA-256 NIST, registre/connexion/déconnexion, doublons, changement de mot de passe, suppression, purge de session orpheline, scoping invité/compte, storage défaillant) + composants (landing complète, démo du héro, FAQ, thème partagé, inscription → session → app, erreurs de confirmation, mauvais mot de passe, déconnexion depuis le menu, isolation des données par compte).
- Gate : typecheck ✓ lint ✓ **308/308 tests** ✓ build ✓ (dist 1 021 kB / 300 kB gzip) · détecteur impeccable **0 finding** · revue adverse (code-reviewer) : branding index.html/manifest, test de purge orpheline, `role="menu"` hors formulaires, `utils/theme.ts` partagé, `maxLength` 128 — tous traités.
- Vérifié en navigateur réel (desktop) : landing (démo 732 918 € calculée en direct), inscription, changement de mot de passe, déconnexion, reconnexion avec le nouveau mot de passe, retour landing, lien partagé `#s=…` → app avec état chargé + bandeau, console 0 erreur.
- Version : package.json, package-lock.json, `public/sw.js` (`CACHE_VERSION = "snowball-pro-v6.1.0"`), CHANGELOG, MEMORY.md.
- **Déployé en production** après validation utilisateur : `vercel --prod` → **https://snowball-pro.vercel.app** (HTTP 200, titre v6.1, landing complète, CACHE_VERSION v6.1.0 vérifiée).

---

## v6.0.0 — Refonte de la hiérarchie : le résultat d'abord (héro, entonnoir, onglets orientés besoin)

Plan v6 validé avec l'utilisateur (synthèse de 3 avis UX externes + audit interne) : le problème n'était pas le moteur mais la **hiérarchie de l'information** — trop de contenu au même niveau, l'insight clé noyé en bas. Zéro changement moteur dans cette couche : uniquement la présentation. Rien n'est supprimé : tout est déplacé derrière des couches.

### 🏆 Le héro — « le nombre magique » (`Simulation/HeroResult.tsx`, nouveau)

- **Grand chiffre du résultat** sur l'échelle du toggle « Euros d'aujourd'hui » (réel par défaut), en mono très grand — la première chose vue en ouvrant l'app.
- **L'autre échelle toujours visible** dessous (« sur le compte en 2050 » / « en euros d'aujourd'hui ») — même philosophie que DualAmount.
- **La décomposition qui manquait** : « dont X € épargnés + Y € générés par la croissance » avec barre de répartition visuelle + « votre épargne est multipliée par ~N ».
- **Insight central** : « La croissance de la bourse représente X % de votre capital final » — avant noyé tout en bas, maintenant dès l'ouverture.

### 🧭 Entonnoir du Simulateur (`Tabs/SimulatorTab.tsx`)

- Ordre v6 : **Héro → 4 cartes de synthèse (`SummaryStats`, rétrogradé depuis `App.tsx`) → graphique principal → Analyse & conseils (remonté juste après le graphe) → Statistiques clés → jalons + frais**.
- **Repliés par défaut** : Graphiques détaillés (drawdown + allocation), Fiscalité détaillée, Méthodologie, Calendrier des flux, tableau annuel.
- `KpiGrid` rétrogradé au niveau `card` : le héro est désormais LE niveau « page » de l'onglet.

### 🎛 Onglets orientés besoin (`App.tsx`)

- Simulateur → **« Projection »** · Monte Carlo → **« Robustesse de votre plan »** · Rente & Retraite · Objectif inversé → **« Combien investir ? »**. Les ids restent inchangés (persistance, tests, partage URL).

### 🛡 Confiance + aide contextuelle (Sprint 3)

- **Bandeau de fiabilité** dans les résultats Monte Carlo et Rente : « Basé sur X scénarios · 100 ans d'historique réel · fiscalité française incluse ».
- **Tooltips d'une ligne** (`HelpTip`) : P10/P50/P90 (cartes Monte Carlo), XIRR (Statistiques clés), PFU (CTO).
- **Sidebar allégée** : la carte « Rendement de la bourse » (échelle 10,07 → 8,22 → 5,99 + formule de Fisher) rejoint le panneau **« Pourquoi ces chiffres ? »**, replié par défaut — contenu intégral conservé (déplacement, pas suppression).
- **Fiabilité repliée par défaut** : « Fiabilité du modèle » (Monte Carlo) et « Fiabilité & sûreté des estimations » (Rente) s'ouvrent à la demande — les options restent toutes actives par défaut.

### 🧪 Tests & gate

- Test Sidebar adapté : le contenu Fisher est replié par défaut, puis présent **intégral** au dépliage.
- Gate : typecheck ✓ lint ✓ **237/237 tests** ✓ build ✓ · détecteur impeccable **0 finding** · vérifié en preview réelle (desktop + mobile 320 px, onglet Monte Carlo lancé de bout en bout).
- Le bump de version (package.json, sw.js `CACHE_VERSION`) et le déploiement Vercel restent à la main de l'utilisateur (pas de déploiement à cette étape).

---

## v5.7.2 — Formule de Fisher explicitée : pourquoi 5,99 % et pas 8,22 − 2,1 = 6,12 %

Demande utilisateur : _« quand je fais 8,22 − 2,1 j'arrive à 6,12 ! d'où vient ce 5,99 ? »_ — le piège classique : la soustraction simple est une approximation, la réalité est multiplicative (formule de Fisher). L'app l'explique désormais aux endroits où le chiffre apparaît. Bump 5.7.1 → **5.7.2**.

### 🧮 La formule, vérifiée par le moteur

- `R_réel = (1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %` contre `8,22 − 2,1 = 6,12 %` en soustraction simple. L'écart de **0,13 pt** = l'inflation appliquée au rendement déjà net (`6,12 × 2,1 %`) : l'inflation ronge aussi vos gains, pas seulement le capital de départ.
- C'est la même convention que le reste du moteur (`netReturn` = (1+géométrique)/(1+inflation)−1, `realReturn` KPI = (1+XIRR)/(1+inflation réelle)−1) : trois chemins, une seule formule.

### 🖥 UI — Fisher raconté où le chiffre apparaît

- **`Sidebar`** : nouvelle note sous l'échelle des rendements — « Pourquoi pas 6,12 % (8,22 − 2,1) ? C'est une approximation : la formule exacte (Fisher) est (1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 % — l'inflation rogne aussi vos gains, pas seulement votre capital de départ. »
- **`MethodologyPanel`** : la ligne « Rendement réel » cite la formule complète avec les chiffres réels de la série.

### 🧪 Tests & gate

- Test composant Sidebar enrichi (assertions « Pourquoi pas 6,12 % » et « formule exacte (Fisher) »).
- Gate : typecheck ✓ lint ✓ **224/224 tests** ✓ build ✓ · vérifié en preview réelle.

---

## v5.7.1 — Clarté des rendements : l'échelle 10,07 % → 8,22 % → 5,99 % enfin expliquée (plus de « double déduction » apparente)

Demande utilisateur : _« je vois des taux de rendement différents absolument partout, ça me fait très peur… je veux que l'utilisateur comprenne pourquoi on passe du 10 % par an à 5,99 % »_. Audit moteur + recherche : **aucune double déduction dans le moteur** — le problème était pédagogique. Trois taux coexistaient sans le chaînon manquant : la moyenne ARITHMÉTIQUE (10,07 %, appliquée par la courbe lissée) et le rendement RÉEL (5,99 %) étaient affichés, mais la moyenne GÉOMÉTRIQUE (8,22 %, krachs inclus) — l'étape qui explique la baisse — ne l'était jamais. Bump 5.7.0 → **5.7.1**.

### 🔬 Vérification moteur (GO DEEPER, aucune erreur trouvée)

- **La chaîne est mathématiquement saine** : `avgReturn = 10,0655 %` (arithmétique) → `compoundedReturn = 8,2196 %` (géométrique) → `netReturn = 5,9938 %` = (1 + 8,22 %)/(1 + 2,1 %) − 1. Chaque étage déduit UNE seule chose : la **volatilité** (drag arithmétique→géométrique ≈ 1,85 pt) puis l'**inflation** (2,1 %).
- **Inflation jamais déduite deux fois** : `historical.ts` (`netReturn` = (1+géométrique)/(1+inflation)−1), `kpis.ts` (`realReturn` = (1+XIRR)/(1+inflation réelle)−1) et `simulation.ts` (l'inflation ne sert qu'à l'échelle réelle, jamais au nominal) — trois chemins indépendants, chacun une seule correction.
- **Explication des deux « réels » différents (7,8 % vs 5,99 %)** : la courbe lissée applique 10,07 % chaque année SANS krachs → le rendement réel de votre projection (KPI) est plus favorable que la référence historique réelle (5,99 %) qui inclut les -37 % de 2008, -33 % de 2022… C'est voulu (courbe lissée) mais c'était incompréhensible sans l'expliquer.

### 📐 Moteur — `compoundedReturn` exposé (`historical.ts`, `types.ts`)

- `HistoricalDataset` expose désormais le **rendement composé (géométrique) nominal** (`compoundedReturn`, ≈ 8,22 %) entre `avgReturn` (brut) et `netReturn` (réel) — le chaînon manquant devient une donnée de premier ordre, documentée dans le type.

### 🖥 UI — échelle pédagogique à trois étages

- **`Sidebar`** : la carte « Rendement lissé » devient une **échelle à 3 lignes** (description list accessible) : « Brut (moyenne des années) 10,07 %/an » → « Composé (krachs inclus) 8,22 %/an » → « Réel (après inflation 2,1 %) 5,99 %/an » (la ligne réelle en or, mise en avant). Note explicative : _« Pourquoi 10,07 % → 5,99 % ? Chaque ligne retire une seule chose : la volatilité puis l'inflation… »_.
- **`MethodologyPanel`** : la ligne « Rendement » (un mur de texte) est découpée en 4 lignes claires : Rendement brut / Rendement composé / Rendement réel / Projection & Monte Carlo — la même histoire, racontée deux fois (carte + accordéon).
- **`KpiGrid`** : les sous-titres distinguent explicitement « de VOTRE projection » (XIRR brut 10,1 % ; réel 7,8 %) de la référence historique (5,99 %/an) — fini les deux chiffres « réels » sans explication.
- **`AIInsightCard`** : la comparaison XIRR fait référence à la « moyenne BRUTE » (arithmétique) — comparer un XIRR nominal à une moyenne composée réelle mélangerait les étages.

### 🧪 Tests & gate

- **+2 tests moteur** : échelle pédagogique complète (brut > composé > réel, netReturn = (1+composé)/(1+2,1%)−1, drag ≈ 1,85 pt, invariant vérifié sur sp500/nasdaq/cac40/gold) + test composant Sidebar mis à jour (les 3 lignes + « la volatilité » + « l'inflation »).
- Gate : typecheck ✓ lint ✓ **224/224 tests** ✓ build ✓ · vérifié en preview réelle (échelle + accordéon Méthodologie + KPI) · détecteur impeccable : **0 finding**.

---

## v5.7.0 — Overhaul UI/UX : en-tête global, onglets à icônes, cartes héro, design system affiné

Demande utilisateur : _« Améliore drastiquement l'interface et l'UI, l'UX, et tout ça… GO DEEPER »_. Refonte complète de la couche d'affichage (zéro changement moteur) : hiérarchie, motion, micro-interactions, cohérence — l'identité or/ivoire devient plus affirmée et l'app gagne un vrai squelette d'en-tête. Bump 5.6.4 → **5.7.0**.

### 🧭 En-tête global + ActionBar intégrée (`App.tsx`, `ActionBar.tsx`)

- **Nouvel en-tête sticky** (backdrop-blur + bordure fine) : emblème or avec icône Wallet, wordmark « SNOWBALL PRO » en Outfit, tagline — la barre d'actions (Annuler/Rétablir, Comparer, Partager, thème, Exporter) y est intégrée et reste accessible pendant tout le scroll.
- **Sidebar** : le logo y est retiré (la marque vit dans l'en-tête) — repère de section « Réglages » + badge de scénario en comparaison. Carte « Rendement lissé » avec halo radial, encart « Votre projet » avec icône Lightbulb (plus de `border-l-2`).
- **Bandeaux nettoyés** : lien partagé et erreurs de validation avec icônes lucide (fini 🔗 ⚠️ ✕).

### 🎛 Onglets à icônes animées (`TabBar.tsx`, `App.tsx`)

- Emojis 📈🎲💸🎯 remplacés par des icônes lucide (**LineChart · Dices · Banknote · Target**) ; la **pastille or glisse** entre les onglets (framer-motion `layoutId`, ressort) ; roving tabindex + flèches ←/→/Home/End conservés.

### 🏛 Design system (`index.css`)

- **`.glass`** : dégradé vertical (plus clair en haut) + **liseré lumineux interne** sur le bord haut — la profondeur sans ombre portée dure. Mode clair aligné (bordures et sheen adaptés).
- **`.card-interactive`** : élévation douce au survol (transform + ombre + bordure, vrai pointeur uniquement, pas de hover fantôme sur mobile).
- **`.btn-shine`** : balayage lumineux au survol des CTA or (Lancer MC, Lancer Rente, Exporter, Recharger).
- **Sliders** : rail 6 px arrondi avec la **partie parcourue remplie en or** (dégradé inline `linear-gradient`), pouce 18 px cerclé, fallback `color-mix` pour les navigateurs récents.
- **`.mono` en chiffres tabulaires** (`font-variant-numeric`) : les colonnes de montants s'alignent enfin.
- **Token `--color-success`** ajouté (l'état « Lien copié ! » s'affichait sans fond — classe inexistante) + scrollbars 6 px + fond d'ambiance à 3 halos radiaux.
- **Dernier `border-l-2` supprimé** (`ComparisonBar`, remplacé par un chip d'icône) — le « tell » des UIs générées disparaît.

### 🃏 Composants (émoticônes → icônes, hiérarchie)

- **`SummaryStats`** : cartes héro avec icône (TrendingUp, Landmark, Receipt, PiggyBank), liseré d'accent en haut, élévation au survol.
- **`KpiGrid`** : une icône par indicateur (8 icônes), pastille teintée, hover ; libellés et sous-titres inchangés.
- **`CollapsibleSection`** : l'icône entre dans une pastille or `bg-primary/10` (uniforme avec SectionHeader). **`Toggle`** : lueur or quand coché + bordure.
- **Emoji sweep** : GoalTab (💰→PiggyBank, 📈→TrendingUp), MonteCarloPanel (🎲→Dices), ErrorBoundary (😵→TriangleAlert, 🔄→RefreshCw), AIInsightCard (✦→point géométrique or), SmartInput/SliderInput (⚠️→AlertTriangle).

### 🧪 Tests & gate

- Aucun texte ni rôle modifié (223 tests existants inchangés et verts) ; gate : typecheck ✓ lint ✓ **223/223 tests** ✓ build ✓ · vérifié en preview réelle (desktop + mobile 320 px, thèmes clair/sombre, console propre) + détecteur impeccable : **0 finding**.

---

## v5.6.4 — Titres de section UNIFORMES sur tout le site : « Vos impôts » proportionné à « Statistiques clés »

Demande utilisateur : _« le titre de la partie des impôts doit être mieux proportionné par rapport aux statistiques clés… que tout soit uniforme sur le site, sublime, joli et cohérent »_. Avant, chaque carte et chaque graphique utilisaient son propre style de titre (10 px gris muet, `text-sm font-bold`, emoji 📈📊…) à côté de titres de section en extrabold — hiérarchie visuelle déséquilibrée. Bump 5.6.3 → **5.6.4**.

### 🧩 Composant unique `SectionHeader` (`shared/SectionHeader.tsx`)

- **Anatomie uniforme** : barre dorée `w-1 h-5 bg-primary` + icône lucide teintée or + titre `font-extrabold uppercase tracking-[0.08em]`, en 3 niveaux : `page` (grands titres, 16-18 px), `card` (titres de carte, 14-16 px) + `label` (mini-titres « Modèle de retrait » / « Paramètres »). Sous-titre aligné sous le texte, élément droit (pastille, légende, chevron), balise `h2`/`h3`/`span` selon le contexte.
- **`bare`** (revue adverse) : rend UNIQUEMENT du contenu phrasé (spans) pour les boutons d'accordéon — plus de `<div>` dans un `<button>` (HTML invalide).
- **`SectionTitle.tsx` supprimé** (code mort : seule la Rente avait un double local, remplacé par le composant partagé).

### 🏛 Surfaces unifiées (18 fichiers)

- **Simulateur** : `KpiGrid` (« Statistiques clés »), `FiscalPanel` (« Vos impôts » + enveloppe en sous-titre, `nowrap` + flex-wrap mobile), `FeeImpact`, `MilestoneTimeline`, `CapitalAllocation` (« D'où vient votre argent ? » + sous-titre), `AIInsightCard`, accordéons `CashflowCalendar` / `MethodologyPanel` / « Détail année par année ».
- **Graphiques** : `EquityChart`, `DrawdownChart` (icône danger), `ComparisonChart`, `MonteCarloChart` — emoji 📈📊 remplacés par des icônes lucide, légendes/pastilles en élément droit.
- **Onglets** : `MonteCarloPanel` (🎲 → icône dé), `GoalTab` (🎯 → icône cible, « Comparaison des scénarios » avec objectif en sous-titre), `RenteRetraiteTab` (titre page + Fiabilité & sûreté + Aperçu rente + accordéon crise + « Votre capital… » / « Distribution des capitaux finaux » + mini-titres via `label`).
- **Sidebar** : `CollapsibleSection` (barre dorée ajoutée — uniforme avec le contenu) et `SnapshotPanel` (💾 → icône Camera).
- **Détails impeccable** : suppression des `border-l-2` des bandeaux de résultats de la Rente (le « tell » des UIs générées par IA) — détecteur impeccable : **0 finding**.

### 🧪 Tests & gate

- **+5 tests composants** (223 au total) : SectionHeader (heading + barre `aria-hidden` + sous-titre + trailing, `label` via children, **mode `bare` sans `<div>/<p>`** — revue adverse) + FiscalPanel (titre « Vos impôts » séparé de l'enveloppe, suit le choix d'enveloppe).
- Gate : typecheck ✓ lint ✓ **223/223 tests** ✓ build ✓ · vérifié en preview réelle sur les 4 onglets (desktop + mobile 320 px, accordéons valides).

### ⚖️ Note ShadcnUI

ShadcnUI **non installé** : la v5 a délibérément retiré Radix (base de shadcn), le build est single-file et 223 tests verrouillent l'incumbent. L'uniformité demandée est livrée via un composant de design-system maison sur les tokens existants (le même principe que shadcn : tokens + primitives), sans nouvelle dépendance ni risque de régression.

---

## v5.6.3 — Audit complet qualité-UX-logique : virgule française partout, cohérence des chiffres, saisies bornées

Audit complet (navigateur réel + lecture moteur) : 8 constats corrigés + chasse aux virgules décimales anglaises résiduelles. Bump 5.6.1 → **5.6.3**.

### 🇫🇷 Virgule décimale française partout (BUG #1-4 + chasse)

- **Nouveau helper `fmtDecimal`** (`engine/formatting.ts`) : `12.5 → « 12,5 »` — source unique pour ne plus jamais laisser un point décimal anglais dans l'interface.
- **`MonteCarloPanel`** : « Précision : 43,3 % ± 1,0 pt » (au lieu de « 43.3 % ± 1.0 pt »).
- **`ExpenseForm`** : suffixes « 0,00%/an », « 0,00% par versement » (×4).
- **`CapitalAllocation`** : légende du camembert « 27,2 % / 72,8 % / 0,0 % ».
- **`RenteRetraiteTab`** : badges « TAUX 2,5 % », « TAUX 5,5 % » et tooltips des années de stress test.
- **Chasse (GO DEEPER)** : `MethodologyPanel` (inflation et frais affichés avec virgule).

### 📊 Cohérence des chiffres (BUG #5-6)

- **Objectif inversé — le taux courant devient une ligne du tableau** : la ligne « 10,07 % ← » (valeur exacte du curseur) affiche exactement le même montant que la carte principale — fini le « 1 142,34 € » à côté d'un « 10 % → 1 150,04 € » pour la même étiquette. Le libellé des cartes passe aussi en « 10,07%/an ».
- **Calendrier des flux — capital initial réconcilié** : nouvelle ligne « Capital initial / Aujourd'hui » en tête (remplace la ligne de base redondante « Année 0 ») ; le total « Versements » égale désormais la carte « Total épargné » (investiNom = capital initial + épargne mensuelle).

### ⌨️ Saisie directe avec retour visible (BUG #7-8)

- **`SmartInput`** : une valeur négative n'est plus rejetée en silence — message « Valeur négative non acceptée » + bordure rouge (auto-effacé après 3 s) ; les touches `-`/`+`/`e` sont bloquées en amont.
- **Clamp bornes réelles** : `SliderInput` accepte `hardMin`/`hardMax`/`allowNegative` → la saisie directe est clampée AU MÊME MONTANT que le calcul (ex. 999 999 999 € → « Limité au maximum (100 000 000) ») — plus de divergence silencieuse champ affiché / simulation. Plombé sur capital (100 M€), mensualité (200 k€), durée (80 ans), inflation (−10 % à 100 %, négatifs autorisés), simulations MC (100-10 000), TMI, années PEA/AV (50), frais (50 %), rendement Objectif.
- **`validation.ts`** : messages explicites (« limité à 100 M€ pour le calcul »…) et seuil mensualité aligné sur le clamp réel (200 k€).

### 🧪 Tests & gate

- **+6 tests** (218 au total) : `fmtDecimal`, SmartInput (négatif rejeté avec message, clamp max, saisie valide), GoalTab (ligne « 10,07 % » = carte principale), CashflowCalendar (ligne « Capital initial » + totaux = investedNom).
- Gate : typecheck ✓ lint ✓ **218/218 tests** ✓ + vérification navigateur des 8 fixes.

---

## Infra — Projet Vercel renommé : nouvelle URL de production

Le projet Vercel a été renommé de `v4` vers **`snowball-pro`** (API REST Vercel + redéploiement `vercel --prod`), sans changement de code ni de version. Aucun bump de version : 5.5.1 conservée.

- **Nouvelle URL de production : https://snowball-pro.vercel.app** (HTTP 200).
- L'ancienne URL `https://v4-three-beige.vercel.app` reste active (Vercel la garde en alias).
- `.vercel/project.json` synchronisé (`projectName: "snowball-pro"`).

---

## v5.6.0 — Courbe lissée du Simulateur + scénario « Partir en période difficile » (krach paramétrable)

Deux demandes utilisateur fusionnées : (1) _« un truc linéaire, pas une courbe aléatoire »_ — le Simulateur affichait les zigzags réels de l'historique ; (2) pouvoir tester _« et si le départ à la retraite tombait en pleine crise ? »_ au moment et à l'intensité de son choix, au lieu des seules fenêtres historiques fixes. Bump 5.5.1 → **5.6.0**.

### 📈 Simulateur : courbe lissée (rendement constant chaque année)

- **`simulation.ts`** : `runSimulation` applique désormais le rendement moyen de référence **MSCI World ≈ 10,07 %/an brut** chaque année — la même courbe, sans hasard ni zigzag. **Monte Carlo et la Rente, eux, continuent de rééchantillonner l'historique réel** (krachs et bull markets rejoués) : c'est leur raison d'être, seule la figure de référence du Simulateur devient constante.
- **`Sidebar.tsx`** : la carte devient **« Rendement lissé — 10,07 %/an brut »** (moyenne MSCI World, net d'inflation 8,22 %, « la même courbe chaque année, sans hasard »).
- **`MethodologyPanel.tsx`** : la ligne « Rendement » précise « taux constant … courbe lissée ; Monte Carlo & Rente rejouent l'historique réel ».
- **`AIInsightCard.tsx`** : la référence de comparaison devient la « moyenne de référence » (plus d'« indice rejoué »).
- **`DrawdownChart.tsx`** : avec un rendement constant, le capital ne baisse jamais — la ligne plate à 0 % est remplacée par un **message explicatif** (les baisses restent visibles dans les onglets Monte Carlo et Rente).

### 🚨 Scénario « Partir en période difficile » : krach déterministe choisi par l'utilisateur

- **Nouvelle option dans les paramètres de la Rente** (`RenteRetraiteTab`, OFF par défaut) : `crisisScenario` + `crisisStartOffset` (0-10 ans après le départ) + `crisisIntensity` (10-60 %). Le krach **REMPlACE** le rendement de l'année choisie dans **CHAQUE scénario Monte-Carlo** — c'est le « et si la bourse chutait juste à ce moment-là ? » appliqué à 100 % des cas, pas seulement au cas pessimiste (P10).
- **`decumulation.ts`** : le krach est appliqué mois par mois (`runDecumulationPath`), et le **garde-fou dynamique voit le rendement EFFECTIF de l'année** (le choc, pas le rendement d'origine) — la réduction de rente de 10 % se déclenche bien l'année suivant le krach (revue v5.6.0).
- **`runStressTest` ne superpose PAS le krach paramétrable** : ces fenêtres historiques SONT déjà des crises réelles (1973, 2000, 2008) — le compter deux fois fausserait le résultat.
- **Bandeau de transparence dans les résultats** : « Un krach de −X % frappe chaque scénario en année N de la retraite ». Bandeau « relancez » déclenché à leur bascule (`App.tsx` hash).
- **Stress tests historiques repliés par défaut** : la section « Et si vous partiez en pleine crise ? (1973 · 2000 · 2008) » ne s'impose plus à chaque visite — un en-tête repliable s'ouvre à la demande, avec un renvoi vers l'option paramétrable.

### 📊 Histogramme terminal enfin lisible

- **`math.ts` — `buildTerminalHistogram`** : axe adaptatif sur les cas NON NULS `max(p95, 3 × médiane)` au lieu du p99 (l'outlier de la fat tail n'écrase plus tout, une majorité de faillites ne réduit plus l'échelle à 1 €) + **bornes non linéaires (échelle √)** : la masse d'une distribution très asymétrique n'est plus concentrée dans les 10 % gauche du graphe.
- **`TerminalHistogram.tsx`** : repères médiane/moyenne positionnés sur la **même échelle √** que les classes ; barres vides visibles (traits fins) ; note de bas « au-delà de X € (queue droite) ».

### 🧹 Détails

- **`FiscalPanel.tsx`** : le badge du « Total des impôts » devient une pastille discrète (ne mange plus la ligne).
- **`validation.ts` / `migration.ts`** : `crisisStartOffset` (0-10, arrondi) et `crisisIntensity` (5-95 %) bornés au sanitize — un lien partagé malformé ne peut pas casser l'onglet Rente ; les 3 champs entrent dans les clés de persistance et le partage URL.

### Tests

- **+7 tests nets** (208 au total) : scénario crise OFF par défaut + persistance/URL, krach appliqué à l'année choisie dans chaque scénario (chemins bit-à-bit identiques avant le choc), impact persistant au-delà du krach sur une rente réelle, garde-fou qui coupe APRÈS l'année de krach ; courbe lissée (même rendement chaque année, indépendance de Monte Carlo) ; axe adaptatif de l'histogramme ; stress tests repliés par défaut + curseurs crise (composants).
- Gate : typecheck ✓ lint ✓ **208/208 tests** ✓ build ✓.

---

## v5.5.1 — Fiabilité & sûreté des estimations : incertitude des paramètres, 100 ans d'histoire, inflation stochastique, garde-fous et stress tests

Suite directe de la question utilisateur _« Pourquoi P50 = 2,67 M€ et P90 = 10,88 M€ ? (4× d'écart) »_ — l'écart est mathématiquement correct (volatilité réelle × √durée, rééchantillonnage par blocs), mais le modèle traitait la moyenne 10,07 % et l'inflation 2,1 % comme des **vérités connues**, ce qui rendait les percentiles et le « 95,8 % de survie » **trop confiants**. Deux volets : **honnêteté du modèle** (fiabilité) et **robustesse du plan** (sûreté). Les 4 options sont **ON par défaut** — chacune reste désactivable dans l'UI pour comparer.

### 🎲 Fiabilité (le moteur dit la vérité)

- **Incertitude des paramètres (Pástor–Stambaugh, Merton)** — `reliability.ts` (nouveau) : la moyenne et la volatilité du vivier sont des _estimations_, pas des vérités. Chaque scénario tire son régime `μ̃ ~ N(μ̂, σ̂/√n_eff)` et `σ̃ ~ σ̂·exp(η)` autour des estimations (taille effective = séries/bloc, le bootstrap ne crée pas d'information). `applyRegime` préserve la structure des blocs (krachs enchaînés) en décalant niveau et ampleur. **Élargit honnêtement P10/P90** : vérifié par test — P10 sans incertitude ≥ P10 avec incertitude.
- **Historique étendu : 100 ans** — `historical.ts` : série **S&P 500 SBBI 1926-1969** (dividendes réinvestis, vérifiée sur les ancrages 1929 ≈ −8,4 %, 1931 ≈ −43,3 %, 1933 ≈ +54 %) + MSCI World 1970-2025 = **100 ans de rendements réels** pour le rééchantillonnage. Les krachs de l'entre-deux-guerres sont rejoués. Le **Simulateur reste sur 1970-2025** (sa figure de référence 10,07 %/an est préservée).
- **Inflation stochastique** — `historical.ts` : série **inflation française réelle INSEE 1970-2025** (56 valeurs : 13,7 % en 1974, 0,0 % en 2015, 5,2 % en 2022) rejouée par blocs pour l'indexation de la rente, au lieu d'un taux fixe 2,1 % qui sous-estime les pires érosions. Independante des rendements (modélisation simple assumée).
- **Moyenne + intervalle de confiance + histogramme terminal** — `math.ts` : `wilsonScoreCI` (le « 95,8 % » vaut ±0,4 pt à 10 000 runs, ±4 pts à 100) et `buildTerminalHistogram` (30 classes sur [0, p99], la queue droite est absorbée dans la dernière classe). `runMonteCarlo` et `runDecumulation` exposent désormais `mean`, `successRateCI`/`survivalRateCI` et `terminalDistribution` — la **fat tail** que 3 lignes cachaient devient visible.

### 🛡 Sûreté (le plan résiste)

- **Garde-fous dynamiques (Guyton–Klinger)** — `decumulation.ts` : si l'année précédente a été négative, la rente de l'année suivante est réduite de 10 % et l'indexation sautée. **Sauve la majorité des cas de ruine** — vérifié par test : la rente 4 % qui meurt sur 1973 sans garde-fous **survit** avec. Le cœur mensuel `runDecumulationPath` est partagé entre Monte Carlo, variante asynchrone et stress tests (une seule implémentation).
- **Stress tests déterministes** — `decumulation.ts` : `STRESS_TEST_SCENARIOS` (1973, 2000, 2008) + `runStressTest` rejouent les **rendements contigus réels** de l'indice depuis l'année du scénario (aucun hasard), avec **l'inflation réelle de l'époque** alignée par année calendaire (1973-74 = 9-14 %). Affiche « et si vous partiez pile au début du choc pétrolier ? ».

### 🖥 UI

- **`TerminalHistogram.tsx`** (nouveau) : histogramme des capitaux finaux avec repères **médiane** (verte) et **moyenne** (bleue) — l'écart entre les deux EST la dissymétrie du modèle ; survol d'une classe = plage + nombre de cas + % ; classe 0 € surlignée en rouge pour la Rente (ruine).
- **`MonteCarloPanel`** : section « Fiabilité du modèle » (2 toggles : incertitude des paramètres, historique étendu) + intervalle de confiance du taux de succès (« 84,2 % ± 0,7 pt ») + histogramme terminal avec note pédagogique « planifiez sur la médiane, pas la moyenne ».
- **`RenteRetraiteTab`** : section « Fiabilité & sûreté » (4 toggles) + bandeau « ce 95,8 % n'est pas un point exact » avec l'intervalle de Wilson + histogramme terminal (0 € = rente stoppée) + **section stress tests** (3 cartes : verdict Survit/Épuisé, capital final, perte max, détail dépliable avec rendements réels rejoués et mini-graphe du capital).
- **`App.tsx`** : les 4 nouvelles options entrent dans le hash de fraîcheur du décaissement (le bandeau « relancez » se déclenche à leur bascule).

### Tests

- **+16 tests moteur** (historique étendu 100 ans et krachs 1929/1931/1933, inflation INSEE, sampleRegime/applyRegime/effectiveSampleSize, wilsonScoreCI dont 0 %/100 % unilatéral, histogramme terminal, stress tests déterministes dont le sauvetage par garde-fous, defaults 4 options ON + persistance, moyenne/CI/histogramme sur MC et Rente, inflation stochastique ≠ fixe).
- **+6 tests composants** (toggles MC et Rente cochés par défaut, updateInput, TerminalHistogram, stress tests rendus, CI affiché).
- **201 tests au total** · gate : typecheck ✓ lint ✓ build ✓.

---

## v5.5.0 — Option A : plus de « taux défini » ni de crise simulée — l'historique réel du MSCI World partout

Suite directe de la demande « Monte Carlo et Rente rejouent TOUJOURS l'historique réel » : l'app devient **100 % données réelles**. Le mode « Taux défini », le curseur de rendement, la volatilité et la crise synthétique sont supprimés — le Simulateur, Monte Carlo et la Rente rejouent tous les rendements réels du MSCI World 1970-2025 (krachs réels de 2000, 2008, 2022… et bull markets réels inclus).

### 🧭 Pourquoi (décision discutée et validée avec l'utilisateur)

Après le correctif « MC + Rente toujours en historique », le sélecteur « Comment évolue la bourse ? » ne pilotait plus QUE le Simulateur, et uniquement en « Taux défini ». Question légitime : _« à quoi sert le taux que l'utilisateur rentre au début ? »_ — réponse : plus à rien. Option A retenue : un seul modèle mental — _tu rentres ton épargne (capital, mensualité, durée, inflation), la bourse c'est la vraie histoire, pas un taux qu'on invente._

### ⚙️ Moteur

- **`types.ts`** : suppression de `returnMode`, `annualReturn`, `volatility` et des 6 champs crise (`crisisEnabled`, `crisisProfile`, `crisisYear`, `crisisAmplitude`, `crisisDuration`, `crisisAmplitude` legacy). `SimulationInputs` allégé.
- **`simulation.ts`** : `runSimulation` rejoue TOUJOURS les rendements réels (`annualReturnForYear` seul chemin) ; `sampledMonthlyReturn` sans volatilité ni choc de crise ; l'override Monte-Carlo conserve son rôle (blocs rééchantillonnés).
- **`historical.ts`** : nouvelle constante `MSCI_WORLD_AVG_RETURN = 0.1007` (source unique du repli de repli pour les fenêtres sans données).
- **`montecarlo.ts`** : `sampleHistoricalReturns` seul mode ; l'appel à `runSimulation` n'a plus besoin de forcer `returnMode/crisisEnabled` (champs supprimés).
- **`decumulation.ts`** : la Rente rééchantillonne toujours les rendements réels ; code mort stochastique supprimé.
- **`kpis.ts`** : `sharpe` vaut TOUJOURS 0 (plus de mode aléatoire gaussien — ratio sans objet) ; `solveGoal` utilise exclusivement `goalAnnualReturn` (l'onglet Objectif garde son propre curseur, défaut 10,07 % brut MSCI World).
- **`migration.ts`** : `annualReturn`/crise retirés des défauts, des clés numériques et du mapping v4 (les anciens champs stockés sont simplement ignorés) ; `parseStoredInputs` verrouille `historicalIndex = "msci-world"`.
- **`validation.ts`** : suppression des règles `annualReturn` (fourchette 7-12 %) et crise (> durée).
- **Suppressions** : `engine/crisis.ts`, `components/Forms/CrisisSelector.tsx`, `rng.gaussian` (Box-Muller), exports correspondants dans `engine/index.ts`.

### 🖥 UI

- **`Sidebar`** : la section « Comment évolue la bourse ? » et le curseur « Rendement annuel » sont remplacés par une carte **« MSCI World — historique réel »** (moyenne de la série : 10,07 %/an brut · 8,22 %/an net d'inflation ; mention que Simulateur, Monte Carlo et Rente rejouent les rendements réels). Section crise supprimée. `updateInputs` retiré des props (plus utilisé).
- **`GoalTab`** : le libellé de référence devient **« référence : 10,07 % brut (moyenne MSCI World) »** ; le curseur de l'onglet Objectif reste (il sert à calculer l'épargne mensuelle nécessaire), aligné sur le même défaut que le reste de l'app.
- **`MonteCarloPanel` / `AIInsightCard` / `MethodologyPanel` / `SimulatorTab`** : textes et hash de fraîcheur nettoyés des références au mode de rendement et à la crise.
- **`App.tsx`** : hash des paramètres de décaissement simplifié (champs supprimés).

### 🌍 « Euros d'aujourd'hui » COCHÉ par défaut (fusion v5.4.2)

À la demande de l'utilisateur, l'affichage démarre désormais sur les **vraies valeurs nettes d'inflation** : le toggle « Euros d'aujourd'hui » est **coché par défaut** (`DEFAULT_INPUTS.showReal = true`).

- **`migration.ts`** : `showReal = true` par défaut ; fallback v4 `showReal: s.showReal !== false` — un choix v4 explicitement « false » reste respecté, sinon on retombe sur le défaut (vrai).
- **Rappel moteur (invariant)** : le moteur calcule **TOUJOURS** les deux échelles (`nominal` + `real = capital / inflationIndex`, cf. `simulation.ts`) — le toggle ne choisit que laquelle est mise en avant. L'infobulle « ne saisissez jamais un taux déjà net d'inflation » est donc vraie **que l'option soit cochée ou non**.
- **Infobulle clarifiée** (`GoalTab`) : _« L'inflation est déduite automatiquement par le simulateur, QUE l'affichage soit en euros courants ou en euros d'aujourd'hui — ne saisissez jamais un taux déjà net d'inflation. »_
- **Tests** : défaut `showReal = true` (moteur), migration v4 (undefined → vrai, false → false, true → true), toggle coché au rendu d'App (composant).

### Tests

- **145 tests moteur + 24 tests composants** (typecheck ✓ lint ✓) : défauts sans taux/volatilité/mode, migration v4 sans rendement/crise, `parseStoredInputs` ignore les anciens champs, Sharpe = 0, temps de doublement = log(2)/log(1+XIRR), Rente déterministe pour une graine, GoalTab « référence 10,07 % brut », Sidebar note MSCI World + absence du curseur de rendement, **toggle « Euros d'aujourd'hui » coché par défaut**. **169 tests au total.**

---

## v5.4.1 — Rendement BRUT par défaut : 10,07 %/an (moyenne MSCI World) + clarté pédagogique

À la demande de l'utilisateur, l'app rend explicite le point le plus source de confusion : **le rendement saisi est TOUJOURS brut** (avant inflation — l'inflation est déduite séparément par le moteur, jamais saisie nette sous peine de double déduction).

- **Défaut de rendement = 10,07 %/an brut** (`migration.ts`) : moyenne arithmétique MSCI World 1970-2025 (déjà corrigée en v5.3.1). Aligné sur `annualReturn` **et** `goalAnnualReturn` (onglet Objectif Inversé) ; fallback v4 aligné (10,07 % au lieu de 8 %).
- **Libellés explicites « (% brut) »** : curseur principal (`Sidebar`) **et** onglet Objectif Inversé (`GoalTab`) affichent désormais « Rendement de la bourse (% brut) ».
- **Note sous le curseur** (les deux onglets) : _« Rendement brut (avant inflation) — taux recommandé : 7 à 12 %/an · défaut 10,07 %/an (moyenne MSCI World) »_.
- **Infobulle « ? »** (`HelpTip.tsx`, nouveau composant partagé + prop `help` sur `SliderInput`) : explique en une phrase la règle « brut avant inflation, ne saisissez jamais un taux déjà net ».
- **Avertissement hors fourchette** (`validation.ts`, constantes partagées `RECOMMENDED_RETURN_MIN/MAX` = 7 %/12 %) : warning sous le curseur + message dans la carte insight de la Sidebar expliquant le **risque de double déduction de l'inflation** si le taux saisi était déjà net.
- **Tests** : défaut 10,07 % > net d'inflation (8,22 %), validation silencieuse à 10,07 % et warning hors fourchette, tolérance d'arrondi assouplie sur un test existant. **167 tests au total.**

---

## v5.4.0 — Suppression du rendement des dividendes (MSCI World capitalisant)

Le curseur « Rendement des dividendes » est **supprimé** : l'indice MSCI World est un indice **capitalisant** (les dividendes sont réinvestis dans l'indice, rendement total) — un rendement de dividendes séparé additionné par-dessus les rendements historiques **comptait les dividendes deux fois** et sur-taxait. Nettoyage complet :

- **`Sidebar.tsx`** : curseur « Rendement des dividendes (%) » retiré (avec sa mention « versés chaque mois puis réinvestis ») — remplacé par un commentaire documentant la décision.
- **`simulation.ts`** : suppression de la mécanique mensuelle des dividendes (`priceReturn`, `grossDividend`, `divTax`) — le capital croît directement au rendement total du marché.
- **`taxes.ts`** : suppression de `dividendTaxRate()` et de l'abattement de 40 % sur les dividendes en barème CTO ; `computeTaxBreakdown` retrouve une signature à 6 paramètres (plus de `dividendsTaxPaid`).
- **`types.ts`** : champs retirés (`dividendYield`, `dividendsGross/Net`, `dividendTax`, `TaxBreakdown.dividendTax`).
- **UI alignée** : `FiscalPanel` (ligne « Impôts sur dividendes (déjà prélevés) »), `CashflowCalendar` (colonne « Dividendes nets »), `MethodologyPanel` (ligne fiscalité courante), CSV (`Impot Dividendes`), `MonteCarloPanel`, `CapitalAllocation` — tous nettoyés.
- **Migration** : `dividendYield` retiré de `DEFAULT_INPUTS` et des clés numériques (les états stockés qui le contiennent sont ignorés proprement).
- **Tests** : fixtures mises à jour, tests dividendes remplacés (CTO barème sans abattement 40 %, identité « brut − impôts = net » sans dividende). **161 tests au total.**

---

## v5.3.1 — Correction figure MSCI World : 10,62 % → 10,07 %/an (moyenne réellement calculée)

La carte « Historique » affichait une valeur codée en dur (10,62 %/an) qui ne correspondait pas à la série réellement rejouée. Correctif : la moyenne arithmétique est désormais **calculée** sur la série EUR 1970–2025 (**≈ 10,07 %/an brut**) ; le rendement net d'inflation reste la référence communiquée (8,22 %/an). Bump v5.3.1 partout (package.json, sw.js `CACHE_VERSION`, CHANGELOG).

---

## v5.3.0 — « Comment évolue la bourse ? » simplifié : 2 modes, MSCI World seul, « Aléatoire » supprimé

La section demandait le rendement annuel dans « Votre épargne », puis reposait la même question (« Constante ») : contradiction redondante. Ménage UX — il reste **2 modes clairs** : « Taux défini » (reprend le rendement annuel saisi ci-dessus) et « Historique » (réel, MSCI World uniquement). Le mode « Aléatoire » (gaussien ± volatilité) est retiré de l'interface ; le moteur conserve sa logique `random` en interne pour Monte Carlo.

### 🖥 UI

- **« Constante » → « Taux défini »** : la carte reprend explicitement le rendement annuel défini dans « Votre épargne » (sous-titre « reprend le rendement annuel ci-dessus ») — plus de double question.
- **Mode « Aléatoire » supprimé** de la sidebar, avec le curseur « Volatilité annuelle » qui ne s'affichait que pour lui.
- **« Historique » verrouillé sur le MSCI World** : le sélecteur d'indices (`BacktestSelector.tsx`, supprimé) disparaît — une carte affiche la **moyenne arithmétique calculée sur la série** : **10,07 %/an brut** et **8,22 %/an net d'inflation**, avec la série réellement rejouée (1970–2025).
- **`MethodologyPanel`** : rendement historique affiché avec les mêmes chiffres de référence (précision alignée sur la carte).

### ⚙️ Moteur

- **`historical.ts`** : le dataset MSCI World expose `avgReturn = 10,07 %` (moyenne calculée sur la série, plus de valeur codée en dur) et un nouveau champ `netReturn = 8,22 %` (référence communiquée) ; les autres indices conservent leurs moyennes calculées (netReturn dérivé à l'inflation forfaitaire 2,1 %).
- **`migration.ts`** : un état stocké ou partagé en URL contenant l'ancien mode « Aléatoire » est normalisé vers `fixed`, et l'indice historique est verrouillé sur `msci-world` (le partage de lien passe déjà par `parseStoredInputs`, donc couvert aussi).

### Tests

- **+3 tests** (moyenne calculée MSCI World 10,07/8,22, dérivation netReturn des autres indices, normalisation migration random→fixed + msci-world). **162 tests au total.**

---

## v5.2.4 — PEA : l'imposition suit enfin la durée de détention + paramètres avancés nettoyés

Correction de 3 problèmes signalés : le curseur « Années de détention du PEA » ne changeait AUCUN chiffre et le taux réduit (17,2 %) s'appliquait même pour un PEA détenu moins de 5 ans ; le réglage « Fiscalité en couple » apparaissait sur tous les comptes au lieu du seul PEA ; les paramètres avancés affichaient 3 modes d'inflation superflus (dont un qui chevauchait le libellé « Inflation annuelle » sur desktop).

### ⚙️ Moteur

- **PEA — la durée de détention change enfin les chiffres** : `taxYearsHeld` ajoutait la durée de projection (`peaYearsHeld + année`) → la somme dépassait presque toujours 5 ans et le taux réduit s'appliquait dès 0 an détenu, curseur sans effet (vérifié : 0→30 ans donnaient des résultats identiques). Le taux dépend désormais de la **détention actuelle** (le curseur) : moins de 5 ans → PFU 30 % (17,2 % + 12,8 % d'IR), au-delà → 17,2 % de cotisations seules. `FiscalPanel` aligné sur le même modèle (cohérent avec son propre libellé « vous liquidez aujourd'hui »).
- **Défaut Monte Carlo : 300 → 5 000 simulations** (`DEFAULT_INPUTS.mcRuns`).
- **Mode d'inflation personnalisé imposé** : les modes « Historique » et « Cyclique » sont supprimés de l'UI — `parseStoredInputs` normalise tout état stocké ou partagé vers `custom` (l'inflation est toujours le taux du curseur, défaut 2,1 %/an).

### 🖥 UI

- **Paramètres avancés** : suppression des 3 cartes de choix d'inflation (Personnalisée / Historique / Cyclique) — seule reste « Inflation annuelle (%) » à 2,1 % par défaut, librement modifiable ; l'encoche de saisie ne chevauche plus le libellé (espacement garanti sur `SliderInput`).
- **« Fiscalité en couple » réservé au PEA** : le toggle (plafond de versements PEA doublé à 300 k€) n'apparaît plus sur CTO, AV, PER et BRUT.
- **Curseur PEA pédagogique** : le libellé sous le slider reflète le régime appliqué — « moins de 5 ans : PFU 30 % » ou « au-delà de 5 ans : taux réduit (17,2 %) ».

### Tests

- **+7 tests** (PFU < 5 ans dans la simulation, taux réduit ≥ 5 ans, le curseur change les chiffres, défaut inflation 2,1 %, défaut Monte Carlo 5 000, normalisation `inflationMode`). **159 tests au total.**

---

## v5.2.3 — Audit profond v3 : la Rente applique enfin le krach + unités verrouillées partout

Audit moteur et UI en profondeur (lecture des 13 modules engine + composants, croisement des unités, revue adverse) : 1 bug moteur qui faussait la Rente, 1 KPI déconnecté de la simulation, et 3 écrans qui mélangeaient encore les unités.

### ⚙️ Moteur

- **C1 — La Rente ignorait le krach** : `decumulation.ts` n'appliquait que le `volMultiplier` de la crise — la bourse « tremblait » mais ne s'effondrait jamais (incohérent avec le Simulateur et Monte Carlo). Le `returnShock` est désormais appliqué mois par mois (neutralisé en mode historique, règle identique à `runSimulation`).
- **C2 — KPI « Après inflation » déconnecté de la simulation** : `realReturn` utilisait `(1+annualReturn)/(1+inflation)−1` (les inputs), faux dès que le mode était historique ou aléatoire. Il est maintenant calculé sur le **XIRR réellement simulé** déflaté par l'inflation RÉELLEMENT appliquée (dérivée du rapport nominal/réel cumulé de la projection).
- **C3 — Camembert ≠ carte** : `CapitalAllocation` affichait `totalTax` (dividendes inclus) quand les cartes et le graphique affichent l'**exit tax** (nominal − taxNet). Aligné sur la même base.

### 📏 Unités

- **`FiscalPanel`** : « Total des impôts » = exit tax (social + IR) — plus de double comptage des dividendes déjà prélevés chaque mois ; nouvelle ligne « Impôts sur dividendes (déjà prélevés) » ; taux effectif recalculé sur la base affichée.
- **`CashflowCalendar`** : colonne « Impôts » alignée sur l'exit tax (comme les cartes) et respect de `showReal` (déflation par année).
- **`FeeImpact`** : les frais affichés suivent `showReal` (déflatés en euros d'aujourd'hui).
- **`AIInsightCard`** : montant des gains déflaté quand `showReal` (et suppression d'une branche logiquement morte détectée en revue).

### Tests

- **+5 tests de non-régression** (krach sur la Rente, realReturn simulé, identité brut − impôts = net, interestsReal, déflation FeeImpact). **153 tests au total.**
- Revue adverse (code-reviewer) : 2 points intégrés (branche morte AIInsightCard, colonne Impôts du calendrier) + test tautologique nettoyé.

---

## v5.2.2 — Audit moteur v2 : 10 bugs corrigés, Rente asynchrone, a11y des graphiques

Deuxième passe d'audit en profondeur (test moteur + runtime Playwright + revue adverse) : corrections moteur, performance, accessibilité — et un fix bloquant de chaîne de build.

### 🚨 Critique — typecheck cassé (lucide-react)

- `lucide-react@^1.25.0` montait vers 1.28.0 qui **ne fournit plus `dist/lucide-react.d.ts`** → 20 erreurs TS7016, CI rouge. **Épinglé à `1.25.0` exact** (vérifié : types présents dans le tarball). `package.json` + `package-lock.json`.

### ⚙️ Moteur

- **B1 — Monte Carlo lent (130 s à 10k runs)** : `toLocaleDateString("fr-FR")` appelé dans la boucle chaude (`simulation.ts`) → **mémoïsé** via un cache module-level clé `(startYear, month)` (10 000×26 appels réduits à ~26).
- **B2 — Gel main-thread de la Rente (5,4 s à 10k)** : `decumulation.ts` réécrit — cœur partagé `runDecumulationRange` + **`runDecumulationAsync` chunké (150) avec `AbortController`** et `onProgress`, résultats bit-à-bit identiques au synchrone. `App.tsx` câblé en async avec garde anti-race ; `RenteRetraiteTab` : bouton « Calcul… X% » + barre de progression.
- **B3 — Crise doublée en mode historique** : `runSimulation` n'applique plus le choc synthétique quand `returnMode === "historical"` (les krachs réels sont déjà rejoués). UI alignée : Sidebar, recap Monte-Carlo, AIInsightCard, composante inflation stagflation neutralisée. Vérifié runtime : capital final inchangé à l'activation.
- **B4 — XIRR dégénéré (4 700 %/an)** : garde `finalValue <= 0 → 0` dans `computeXIRR`.
- **B5 — Onglet Objectif contradictoire** : `totalGains` clampé à 0 (plus de -400 k€) ; `achievable` cohérent avec `difficulty` (un objectif « impossible » n'est plus « atteignable »).
- **B6 — Retraits fantômes** : on ne retient que `min(retrait, capital disponible)` — la courbe de retraits ne grimpe plus après l'épuisement (+ retrait partiel exact au mois de ruine).
- **B7 — Rendement < -100 %** : `yearlyReturn`/`netYield` bornés à -1 (ratio).
- **B8 — Cache MC incomplet** : `inflationMode` ajouté à `inputsHash` → l'avertissement « relancez » se déclenche à la bascule custom/historique/cyclique.
- **B9 — Conventions drawdownPct** : signe/unité documentés dans `types.ts`.

### ♿ Accessibilité

- **`useChartA11y` corrigé** : Recharts ré-applique `role="application"` à chaque re-render après le montage — un simple `useEffect` ne tenait pas. Le hook utilise désormais un **`MutationObserver`** (converge, `aria-label` stable, observer nettoyé au démontage). Vérifié runtime : `role=img` stable au chargement ET après re-render.

### Tests

- **+9 tests de non-régression** (B2–B7 : async chunké + abort, crise historique, XIRR, solveGoal, retraits, clamps). **148 tests au total** (engine node + composants jsdom).
- Vérification runtime Playwright : **16/16 checks** (Rente historique, partage URL roundtrip, raccourcis ⌘Z/⌘⇧Z, stale warning, exports, snapshots 2-clics, dark mode, reduced-motion, console propre).

---

## v5.2.1 — Exports groupés + échelle « euros d'aujourd'hui » cohérente partout

Audit utilisateur : les 4 écrans qui affichaient des montants ne racontaient pas la même histoire selon le toggle « euros d'aujourd'hui ». Aucun changement de logique moteur — uniquement la couche d'affichage.

### 🗂 Exports regroupés dans un menu

- **Un seul bouton « Exporter »** (doré, avec chevron) remplace les trois boutons CSV / JSON / PDF de l'ActionBar. Au clic, un popup propose **Export CSV**, **Export JSON** et **Rapport PDF** (icône + description). Fermeture au clic extérieur ou à Échap ; `role=menu`/`menuitem` + `aria-expanded` (accessibilité). Nouveau composant `src/components/Layout/ExportMenu.tsx`.

### 📏 Échelle « euros d'aujourd'hui » cohérente sur tous les écrans

Le toggle `showReal` (euros d'aujourd'hui vs euros courants) était appliqué de façon inégale : la carte « Valeur brute » basculait, mais « Net fiscal » restait en euros courants → net (1 176 k€) affiché PLUS ÉLEVÉ que le brut (862 k€), absurde. Même incohérence entre la carte « Impôts » (176 k€) et le tooltip du graphique (303 k€).

- **`SummaryStats`** : libellé « Valeur brute » → **« Valeur réelle »** quand l'affichage est en euros d'aujourd'hui (plus de contradiction brut/inflation). Toutes les cartes suivent désormais la même échelle (`Net fiscal`, nouvelle carte **« Impôts »** qui remplace « Pouvoir d'achat » — doublon du Net fiscal dès que showReal est actif). Sous-texte « Impôts estimés (règles en vigueur) : -x € » supprimé (hérité du millésime fiscal retiré en v5.1.3).
- **`FiscalPanel`** : déflate ses montants quand showReal est actif (badge « € d'aujourd'hui ») et ajoute la ligne de synthèse **« Capital net (impôts déduits) »** — exactement la valeur de la carte « Net fiscal » : le panneau et les cartes racontent la même histoire. Paragraphe « règles fiscales en vigueur » simplifié.
- **`EquityChart`** : la courbe/tooltip « Impôts payés » est déflatée comme l'épargne et les gains (`buildEquitySeries`, fonction pure). Plus de tooltip à 303 458 € à côté d'une carte à 176 778 €.
- **`CapitalAllocation`** (camembert « D'où vient votre argent ? ») : la légende déflate aussi quand showReal est actif (prop `showReal`).
- **Helper partagé `deflationFactor(row)`** dans `engine/math.ts` : une seule source de vérité pour convertir euros courants → euros d'aujourd'hui (avant : facteur recalculé à l'identique dans 4 composants, source de dérive).

### Tests

- `buildEquitySeries` : 3 tests (déflation des impôts en showReal, euros courants sinon, zéro sans enveloppe fiscale).
- Menu Export : 2 tests composants (popup CSV/JSON/PDF, fermeture au clic extérieur).
- 148 tests au total (engine node + composants jsdom).

---

## v5.2.0 — Audit UI/UX : contraste WCAG AA, accessibilité, lisibilité, mobile

Correction intégrale du rapport d'audit UI/UX (2 critiques, 8 importants, 10 moyens) — aucun changement de logique moteur, uniquement la couche visuelle et l'accessibilité.

### 🟥 Critiques

- **C1 — Contraste or/sombre (WCAG AA)** : le texte blanc sur l'or `#d4af37` ne faisait que **2.1:1** en mode sombre. Nouvelle classe `.btn-gold-text` (texte sombre sur or en sombre → 8.6:1, blanc en clair) appliquée à « Rapport PDF », onglet actif, « Comparer » actif, « Lancer » (Monte Carlo & Rente), « Recharger ». Rail de toggle `.toggle-on` assombri (`#8a6d1f`) pour le point blanc (3:1 non-textuel).
- **C2 — Champs numériques sans nom accessible** : `SliderInput` — le `<input type=range>` porte désormais `id` (le `label htmlFor` fonctionne, le clic focus le slider) et la saisie directe `SmartInput` reçoit un `aria-label` (les 6 textboxes sont maintenant nommées).

### 🟧 Importants

- **I1 — Sidebar sticky supprimée** : haute de 2 225 px dépliée, elle épinglait ses sections basses (Frais, Snapshots) sous le pli pendant tout le scroll — elle suit désormais le document.
- **I2 — Crise au-delà de la durée** : `validateInputs` signale un warning `crisisYear > duration` (« elle ne sera pas appliquée »), le curseur « Année de la chute » est borné à la durée, et l'encart sidebar n'annonce plus un krach non simulé.
- **I3 — Contraste `text-dim`** : `#7a7265` → `#a39a8c` (sombre, 4.0→6.8:1) et `#8a847a` → `#6f6a5f` (clair, 3.3→4.9:1). Ticks Recharts alignés.
- **I4 — Tailles de police** : tous les textes à 8/9 px passent à 10 px (badges fiscal, en-têtes de table, chips), labels de sliders à 11 px, ticks de graphiques à 11 px — plus aucun élément à 8/9 px.
- **I5 — « Rapport PDF » en mode sombre** : le CSS `@media print` force désormais ticks/grille/courbes Recharts en encres sombres sur papier blanc.
- **I6 — Hiérarchie de titres** : `h1` sr-only en tête de page + graphiques principaux en `h2` (Projection, Baisses, Répartition, Comparaison).
- **I7 — Focus visible** : outline `#60a5fa` (clair) / `#1e40af` (sombre) — plus jamais or-sur-or invisible ; anneau de focus bleu sur les sliders (`:focus-visible`).
- **I8 — Surcharge de l'onglet Simulateur** : la table « Détail année par année » (26 lignes) est repliée par défaut.

### 🟨 Moyens

- **M1** — Tooltips tactiles : sur pointeur coarse (mobile), les tooltips Recharts passent en déclenchement au clic (`useIsCoarsePointer`).
- **M2** — Suppression de snapshot en deux temps : 1ᵉʳ clic arme la confirmation (3,5 s), le 2ᵉ supprime — plus de destruction par un simple tap.
- **M3** — `aria-label` sur la saisie du montant fixe de la Rente.
- **M4** — `prefers-reduced-motion` : coupe animations CSS + `<MotionConfig reducedMotion="user">` (framer-motion) dans `main.tsx`.
- **M5** — `title` sur les valeurs tronquées de `SummaryStats` (montant toujours lisible en survol).
- **M6** — ActionBar : retour à la ligne gauche-alignée sur mobile (`max-sm:justify-start`), espacement resserré.
- **M7** — Recharts `role="application"` remplacé par `role="img"` + `aria-label` non focusable (`useChartA11y`) — tabulation clavier nettoyée.
- **M8** — `backdrop-filter` 28/32 px → 16/20 px + fallback `@supports` (moins de jank au scroll).
- **M9** — Animations Recharts désactivées sur les graphes en direct (Épargne, Baisses) : plus de lag pendant le drag des sliders.
- **M10** — Bordures du mode clair renforcées (0.06 → 0.12/0.14/0.16) — fini le rendu délavé.

### Bruit

- Bornes min/max affichées sous chaque slider (cohérence avec l'onglet Rente).
- `SegmentedControl` : roving tabindex + flèches ←/→/Home/End (pattern radiogroup ARIA).
- Meta description + `theme-color` (clair/sombre) dans `index.html`.

### Divers

- Tests : +1 test moteur (crise > durée), test snapshot adapté à la confirmation 2 temps. Version 5.1.3 → 5.2.0 (package.json, sw.js `CACHE_VERSION`).

---

## v5.1.3 — Suppression du « Millésime fiscal » + fiscalité TMI/barème

- **Suppression du réglage « Millésime fiscal »** : le curseur 2020–2032 ne
  changeait AUCUN calcul — le moteur (`taxes.ts`) utilise des constantes fixes
  (17,2 % cotisations, 12,8 % IR, abattements AV 4 600/9 200 €) qui ne lisent
  jamais `fiscalYear`. Le champ ne servait qu'à afficher des libellés (« Règles
  2026 » → « Règles 2020 »). Retiré de `SimulationInputs`, de `NUMERIC_KEYS`,
  de `validateInputs`/`sanitizeInputs`, de la sidebar (section « Compte
  d'investissement » simplifiée) et du hash de fraîcheur Monte-Carlo (il
  provoquait des « relancez pour mettre à jour » inutiles).
- **Fiscalité CTO en barème progressif (TMI)** : nouveau champ `tmi` (tranche
  marginale d'imposition, 0–45 %) et `ctoTaxMode` (« pfu » par défaut ou
  « bareme »). En barème, les plus-values CTO sont taxées à la TMI avec
  abattement de 40 % sur les dividendes ; le PER applique la TMI à la sortie
  (abattement 10 %) et l'économie d'impôt à l'entrée est réinvestie ; les
  plafonds de primes AV (150/300 k€) et le taux 12,8 % au-delà sont modélisés.
- **Décaissement (Rente) réécrit** : rééchantillonnage par blocs des
  rendements historiques réels (identique au Monte-Carlo), cumul mensuel des
  retraits (indexation inflation prise en compte), 10 000 runs max.
- **Libellés harmonisés** : les panneaux affichent désormais « règles en
  vigueur » (FiscalPanel, MethodologyPanel, SummaryStats, DisclaimerBar) au
  lieu d'une année figée qui serait devenue fausse.
- **Service worker** : `CACHE_VERSION` bumpé à `snowball-pro-v5.1.3`.
- **Tests** : 133 tests (fixtures et bloc « millésime fiscal » mis à jour,
  - blocs TMI/barème, netYield, rééchantillonnage par blocs, + 10 tests
    composants jsdom dans `components.test.tsx` : undo/redo, comparaison A/B,
    snapshots, export CSV, ErrorBoundary, partage URL).

---

## v5.1.2 — Suppression « Mois de début » + corrections release

- **Suppression du réglage « Mois de début »** : le champ `startMonth` ne servait
  qu'à décaler les dates affichées (valeur par défaut = janvier). Retiré de
  `SimulationInputs`, de la migration v4→v5, de `NUMERIC_KEYS`, du moteur
  (`simulation.ts`) et de la sidebar (section « Calendrier » supprimée). Les
  projections recommencent toujours en janvier ; les réglages sauvegardés avec
  un mois non nul sont ignorés (aucun changement sur les montants calculés).
- **Service worker** : la purge de l'activation ne touche plus QUE les caches
  `snowball-pro-*` (avant, elle supprimait les caches des autres applications
  sur origine partagée) ; `CACHE_VERSION` bumpé à `snowball-pro-v5.1.2`.
- **Typecheck** : `/// <reference types="vite/client" />` dans `src/main.tsx`
  (résout l'erreur `ImportMeta.env`).
- **Lint** : `URL` ajouté aux globals du service worker dans `eslint.config.js`.
- **Tests** : assertion `escapeCsvCell` corrigée (préfixe `'` placé À
  L'INTÉRIEUR des guillemets, anti-injection OWASP) ; test ajouté « la
  projection démarre en janvier » ; timeouts Monte-Carlo élargis à 30 s.

---

## v5.1.1 — Durcissement sécurité (audit complet)

- **Dépendances** : `vite` 7.2.4 → 7.3.6 — élimine les 5 advisories connus
  (dont 3 High : bypass `server.fs.deny`, lecture de fichiers arbitraires via
  le WebSocket du dev server, path traversal Windows). `npm audit` = 0 vuln.
- **CSP** : meta Content-Security-Policy dans `index.html` (`default-src 'self'`,
  `script-src-attr 'none'`, `object-src 'none'`, `base-uri 'self'`, `frame-src
'none'`, fonts Google whitelistées). `script-src 'unsafe-inline'` est requis
  par le build single-file — commenté dans le HTML.
- **En-têtes Vercel** : nouveau `vercel.json` — `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, cache
  contrôlé pour `/` et `/sw.js`.
- **Service worker** : activé et sécurisé — cache versionné `snowball-pro-v5`,
  navigation network-first (plus jamais de version obsolète en cache),
  stale-while-revalidate pour les assets, purge des caches v4, `skipWaiting` +
  `clients.claim`, enregistrement en prod uniquement (`src/main.tsx`).
- **PWA** : icônes 192/512 générées, manifest + favicon câblés.
- **Dev server** : lié à `127.0.0.1` (les failles du dev server ne sont
  exploitables que depuis le réseau).
- **CSV** : `escapeCsvCell` (OWASP CSV Injection) appliqué à toutes les cellules
  de l'export.
- **CI** : actions épinglées par SHA (`checkout@11d5960a`, `setup-node@49933ea5`),
  `permissions: contents: read`, étape `npm audit --audit-level=high`.
- **Outillage tiers** : `.github/hooks/`, `.github/skills/` et `.agents/skills/`
  (code non vérifié, accès réseau/clés) exclus du dépôt (`.gitignore`) — à
  revoir ou retirer localement.
- **Confidentialité** : le disclaimer précise que les données restent en
  localStorage sur l'appareil (aucune transmission).
- **Données historiques** : série `msci-world` remplacée par le MSCI World Net
  Return **EUR** 1970-2025 (56 ans, dividendes réinvestis — recoupée justETF /
  Amundi / Curvo) au lieu de la série USD 1995+. Inflation forfaitaire à
  **2,1 %/an** (l'inflation historique réelle des années 70 faussait les
  moyennes) appliquée au dataset, au mode historique et au défaut app.
  Backtest et Monte-Carlo gagnent 25 années de données supplémentaires.
- **Hygiène** : `zustand` et `immer` supprimés des dépendances (0 import dans
  `src/`, vestiges de la v4 — cf. AGENTS.md qui les annonçait déjà retirés).
  Purge des caches du service worker ciblée sur `snowball-pro-*` uniquement
  (jamais les caches d'autres apps sur une origine partagée). Timeouts des
  tests Monte-Carlo élargis (30 s — machine lente).

---

## v5.1.0 — Réintroduction des fonctionnalités v4.1 (Comparaison, Undo/Redo, Snapshots)

- **Comparaison A/B** : mode comparateur restauré — bouton « Comparer » dans l'ActionBar, bannière
  « Mode Comparaison actif », panneau éditant le Scénario B (A figé au lancement), graphique
  comparé A vs B, résumé 3 cartes (A, B, écart +/–), tableau comparatif annuel. Les autres onglets
  (MC, Rente, Objectif) opèrent sur B. `compareScenarios` retypé (`ScenarioComparison`), nouveau
  `mergeComparisonSeries` (alignement des courbes, NaN = courbe incomplète).
- **Undo/Redo** : `src/engine/history.ts` (pile 20 entrées, valeurs précédentes stockées — l'undo
  v4.1 était un no-op), hook `useHistory`, boutons Annuler/Rétablir dans l'ActionBar, raccourcis
  ⌘Z / ⌘⇧Z / ⌘Y (et Ctrl sur Windows) via `useKeyboardShortcuts` (champs de saisie exclus, Ctrl+D
  pour le thème).
- **Snapshots** : `src/engine/snapshots.ts` (CRUD pur, limite 8), persistance
  `snowball_v5_snapshots` (migration best-effort depuis `snowball_pro_v41_state`), panneau
  « Snapshots » en bas de la Sidebar (sauvegarder / charger / supprimer).
- **Bugfix** : `FeeImpact` variable morte supprimée ; `.freebuff/` ignoré par ESLint et git.

### Refonte pédagogique de l'interface (langage débutant)

- **Objectif d'épargne** : onglet « Objectif inversé » renommé, cartes « Épargne mensuelle nécessaire »
  et « Rendement nécessaire » expliquées, progression rebaptisée « Avec votre épargne actuelle »
  (capital projeté affiché), tableau comparatif clarifié.
- **Monte Carlo** : P90/P50/P10 reformulés en « Bonne période de bourse / Scénario moyen / Période
  difficile » avec explications « 1 cas sur 10 », sous-titre explicatif du graphique, légende
  complète, jargon (sigma, loi normale) supprimé.
- **KPI** : labels réécrits sans jargon (Croissance/an, Gain par risque, Pire chute, Multiplié par,
  Pour doubler, Part épargne, Part des gains, Après inflation, Perdu en frais, Frais payés) + 10
  sous-titres explicatifs.
- **Graphiques & cartes** : titres pédagogiques (« D'où vient votre argent ? », « Les baisses de
  votre capital »), légendes « Année N », analyse et conseils reformulés (rendement visé explicite).
- **Sidebar** : sections « Votre épargne », « Comment évolue la bourse ? », « Et si la bourse
  s'effondrait ? », profils de crise « Krach éclair / Marché baissier / Stagnation + inflation »,
  labels de frais simplifiés.
- **Fiscal** : notes PFU/PS/IR et descriptions d'enveloppes réécrites en français clair (moteur
  `taxes.ts`, textes de sortie uniquement), tableau « En € d'aujourd'hui ».
- **Export CSV** : en-têtes lisibles (« Épargné (€) », « Capital (€) »…).

### Persistance

- `snowball_v5_settings` (A), `snowball_v5_settings_b` (B, rétabli au prochain lancement),
  `snowball_v5_snapshots`, `snowball_v5_theme`, `snowball_v5_sidebar`.

---

## v5.0 — Architecture & Stack Technique

- **Framework :** React 19.2 avec StrictMode + TypeScript 5.9 (strict)
- **Bundler :** Vite 7.2 + plugin `vite-plugin-singlefile` (tout inline dans un unique `index.html`)
- **CSS :** Tailwind CSS v4.1 via `@tailwindcss/vite` + variables CSS (thème doré `#d4af37`)
- **State :** état local React uniquement (`useState` dans `App.tsx`), persistance localStorage
- **Animations :** Framer Motion 12.42
- **Graphiques :** Recharts 3.9
- **Icônes :** Lucide React
- **Utilitaires :** `clsx` + `tailwind-merge` (`cn`)

> **Retirés en v5.0 :** Zustand (store mort), Radix UI, Chart.js, hooks store-based
> (useStorage, useKeyboardShortcuts, undo/redo, scénarios A/B), composants
> `ui/radix`, `ComparisonBar`, `index 2.css` (CSS legacy orphelin).

---

## Modules / Fichiers Sources

### `src/types.ts` — Modèle de données complet (`SimulationInputs`, `YearRow`, `DecumulationResult`…)

### `src/engine/` — Moteur de calcul patrimonial modulaire (13 modules)

- `math.ts` — FV, PMT, percentiles, drawdown, average, stddev
- `taxes.ts` — fiscalité française (CTO, PEA, AV, PER)
- `formatting.ts` — formateurs monétaires (€, M€, Md€)
- `rng.ts` — générateur aléatoire (mulberry32, Box-Muller)
- `historical.ts` — données historiques par indice (1995-2025)
- `crisis.ts` — profils de crise financière
- `simulation.ts` — moteur de projection année par année
- `montecarlo.ts` — simulations stochastiques
- `decumulation.ts` — phase de décaissement (rente)
- `kpis.ts` — indicateurs de performance
- `validation.ts` — validation et sanitisation des entrées
- `migration.ts` — `DEFAULT_INPUTS`, clés localStorage, mapping v4 → v5
- `history.ts` — pile undo/redo (ajout v5.1)
- `snapshots.ts` — CRUD snapshots (ajout v5.1)
- `comparison.ts` — série comparée A/B (ajout v5.1)
- `index.ts` — point d'entrée unique ré-exportant tout (via `src/engine.ts`)

### `src/App.tsx` — Coquille mince (~170 lignes)

- État local (`inputs`, `activeTab`, `decumResult`) + `runSimulation` mémoïsé
- Persistance : lit `snowball_v5_settings`, fallback migration depuis `snowball_v4_settings`
- Orchestration des 4 onglets (Simulateur, Monte Carlo, Rente & Retraite, Objectif), export CSV

### `src/components/` — 26 composants prop-based (aucun import store)

- `Layout/` — Sidebar, TabBar, ActionBar, DisclaimerBar
- `Tabs/` — SimulatorTab, MonteCarloPanel, RenteRetraiteTab, GoalTab
- `Charts/` — EquityChart, MonteCarloChart, DrawdownChart, CapitalAllocation
- `Forms/` — EnvelopeSelector, CrisisSelector, ExpenseForm, BacktestSelector
- `Simulation/` — KpiGrid, FiscalPanel, MilestoneTimeline, AmortissementTable, GoalProgress, FeeImpact, AIInsightCard
- `shared/` — SliderInput, SmartInput, Toggle, SectionTitle, CustomTooltip

### `src/utils/` — Utilitaires

- `cn.ts` — Fusion de classes Tailwind (clsx + tailwind-merge)
- `chartTheme.ts` — Thème Recharts (clair/sombre)

---

## Tests (92)

`src/__tests__/engine.test.ts` — math, formatting, fiscalité française, simulation, KPIs, goal solver, migration v4→v5, history (undo/redo), snapshots, comparaison A/B.

---

## Commandes

```bash
npm run dev         # Serveur de développement Vite
npm run build       # Build production (singlefile → dist/index.html)
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run test        # Vitest (133 tests : engine node + composants jsdom)
npm run format      # Prettier
```
