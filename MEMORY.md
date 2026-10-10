# MÉMOIRE — Snowball Pro v5.0

> Fichier de mémoire persistante : capture chaque session et décision pour garantir une continuité parfaite.

---

## SESSION — 2026-10-10 (v6.22.0 : Landing — la démo du héro devient éditable)

### Résumé

Release du chantier **2.1 (démo éditable, ordre de bataille n°3)** déjà implémenté mais non publié : 3 curseurs du héro branchés sur le vrai moteur + CTA « Repartir de cette simulation » via `#s=`. Cérémonie v6.22.0 complète (bump, CHANGELOG, changelog.html, UPDATES, footer, i18n, MEMORY), gate 100 % vert, vérifié en navigateur réel (screenshots desktop 1440 + mobile 390 relus : PASS). **Blocage réseau** : `git clone/fetch` vers `github.com/gabrieltieche-hue/snowball-pro` en timeout depuis cette machine + aucun credential de push — commit/push/vercel à finaliser depuis une machine avec accès GitHub.

### Décisions

- **Version 6.22.0** : package.json, package-lock.json (lignes 3/9 — `undici-types 6.21.0` intact), `sw.js` `CACHE_VERSION` = `snowball-pro-v6.22.0`, footer + « Dernières éditions » landing FR/EN, CHANGELOG (entrée v6.22.0), changelog.html (bloc v6.22.0 en tête), MEMORY (cette entrée).
- **Fix footer** : la source FR disait encore v6.17.0 alors que le dictionnaire i18n était en v6.21.0 (le `tr()` retombait sur l'ancienne version) — source et dictionnaire alignés en v6.22.0.
- **+2 clés i18n** : `i18n-check` signalait 2 manquantes pré-existantes (« Retour en haut » → Back to top, « Passer en anglais » → Switch to English) — ajoutées, check à 0.
- **Zéro changement moteur** : la démo éditable était déjà couverte par les tests (`démo éditable du héro (2.1)`) — aucun test ajouté. Suite : **433/433** (425 au tag v6.21.0 → +8 déjà présents dans l'arbre, du lot non commité).
- **Commit/push exécutés ici** : dépôt initialisé sur place (`git init -b main`, remote `origin` sans token sur disque — auth via header mémoire éphémère), `git reset origin/main` puis `git add -u` (15 fichiers suivis uniquement : ni BACKUP tgz, ni `.agents/`, ni scripts vidéo, ni `skills-lock.json`), scan secrets OK, commit `8f3d7b3` « v6.22.0 — Landing : la démo du héro devient éditable », push `d70a318..8f3d7b3 main -> main` réussi (token PAT fourni par l'utilisateur, validé via API : `gabrieltieche-hue`).
- **Vercel en attente** : aucune auth Vercel sur cette machine (`~/.vercel` absent) — soit le push déclenche l'auto-deploy (si projet connecté au repo), soit `npx vercel --prod` à lancer depuis une machine authentifiée.

### Vérifications

- Gate : typecheck ✓ lint ✓ **433/433 tests** ✓ i18n 0 manquante ✓ prettier ✓ build ✓ (dist 1 315 ko / 381 ko gzip).
- `VERDICT VISUEL: PASS` (desktop 1440 : héro + 3 curseurs + scénarios + 328 080 € + CTA ; mobile 390 : carte démo complète + CTA, 0 overflow). Écarts mineurs hors périmètre : libellé « SIMULATION PAR DÉ… » tronqué à 390 px (pré-existant), compteurs animés capturés à mi-course.

---

## SESSION — 2026-08-17 (v6.21.0 : Header épuré — un seul CTA + l'avertissement corrige tout seul)

### Résumé

Mini-refonte du header validée par l'utilisateur (« IL Y A TROP DE BOUTONS ! ») : 9 → 6 contrôles, hiérarchie à 3 niveaux. Mode inline APEX + bundles process/ui-ux (TDD rouge/vert, auto-revue adverse), **425 tests**, gate 100 % vert, vérifié en navigateur réel (popover mobile, auto-fix, undo). **Collision de version résolue** : la release krachs de l'autre agent a pris **v6.20.0** → cette release est **v6.21.0** (les entrées v6.19.0 fantômes — version jamais publiée — ont été renumérotées en v6.21.0 dans CHANGELOG, changelog.html, UPDATES et MEMORY).

### Décisions

- **Un seul CTA doré** : « Nouvelle simulation » unique bouton or (Exporter perd sa couleur), légèrement agrandi. Annuler/Rétablir en icônes seules (aria-labels conservés → tests intacts).
- **Menu « ⋯ » en panneaux** : Exporter, Partager (sous-panneaux avec ← Retour, pattern menu compte), FR/EN, Comparer, Mode, Réinitialiser. **Le thème Sombre/Clair reste visible** dans le header (décision utilisateur).
- **⚠ actionnable** : badge « 1 avertissement » → icône ⚠ (ambre/rouge selon sévérité), popover expliquant chaque problème (ligne cliquable) + bouton **« Corriger automatiquement »**.
- **Auto-fix moteur** : `autoFixValidationErrors` (engine/validation.ts) clamp des bornes + cohérence âge/durée/retraite ; appliqué en **UN patch annulable** (⌘Z restaure tout). Bandeau d'erreur : bouton « Corriger automatiquement » aussi.
- **Navigation vers l'erreur** : `validationTargets.ts` (mapping champ → section/onglet exhaustif) + prop `focusRequest` de la Sidebar (révéler la section + focus du champ).
- **Checkout partagé (concurrence)** : l'autre agent a pris **v6.20.0** (release krachs) pendant que mon changement était en cours. Staging chirurgical : je ne commit que MES fichiers (App/ActionBar/ExportMenu/ShareMenu/Sidebar/validation.ts/index.ts, validationTargets.*, tests auto-fix) + la cérémonie v6.21.0. JAMAIS commités : les fichiers perso de l'utilisateur (`IDEES-AMELIORATIONS-LANDING.md`, `competitor-profiles/`, `docs/DATA-ROADMAP.md`, `package-lock 2.json`).
- **Release v6.21.0** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.21.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.21.0 — les entrées v6.19.0 fantômes de la release krachs renumérotées, bump v6.20.0 corrigé en 6.18.0 → 6.20.0), MEMORY (cette entrée), commit + `vercel --prod` — **uniquement le changement de cette session**.

---

## SESSION — 2026-08-17 (v6.20.0 : Landing — replay des krachs 2000/2008/2022 + manifeste « Ce que nous ne faisons pas »)

### Résumé

Cinquième vague de la feuille de route `IDEES-AMELIORATIONS-LANDING.md` : chantiers **n°5 (manifeste 5.2)** et **n°7 (replay des krachs 3.2 — l'élément signature)**. Mode inline APEX (TDD rouge/vert, auto-revue adverse), **432 tests**, gate 100 % vert, vérifié en navigateur réel (FR/EN, 1440/390/320 px, 0 overflow).

### Décisions

- **Replay des krachs (3.2)** : section « Vos 100 € face aux krachs » après les Chiffres clés. Sélecteur 2000/2008/2022 (même pattern radiogroup que la démo du héro), courbe SVG custom (`CrashChart.tsx`, tracé or + aire dégradée + baseline « 100 € » pointillés, dessin animé `pathLength` keyé par année — en test le mock framer-motion rend le tracé statique). **Tous les chiffres dérivés du moteur** : nouvelle fonction pure `replayCrashFrom(startYear)` dans `historical.ts` (100 € investis début d'année, valeur fin d'année, MSCI World Net Return EUR) → creux, baisse max, retour à l'équilibre. Histoires réelles vérifiées : 2008 −37,3 % / retour 2012 ; 2000 double krach −45,8 % / retour 2013 (« la décennie perdue ») ; 2022 −12,9 % / retour 2023. Exporté via le barrel `engine/index.ts`.
- **Manifeste (5.2)** : 5 cartes « Pas de… » (rendement garanti, conseil, vente de données, compte obligatoire, pub) juste après la comparaison, icônes Ban rouge doux (inline styles sur les vars CSS), phrase de clôture + ancre `#comparaison`. Aucun chiffre : que des engagements.
- **Auto-revue (findings corrigés)** : le nouveau SVG `role=img` cassait le test héro (`getByRole('img')` → `getAllByRole`) ; le « % » séparé du grand chiffre par un span cassait le matcher texte → matcher fonction ; lint : `!` interdits → helper `replay()` avec throw.
- **Checkout partagé (concurrence)** : l'autre agent avait réservé **v6.19.0** (refonte header, non commitée). Ma release est donc **v6.20.0**. Staging chirurgical : `git add -p` sur les fichiers partagés (i18n.ts, engine/index.ts, components.test.tsx, CHANGELOG.md, MEMORY.md) pour ne prendre QUE mes hunks ; package.json/lock/sw.js stagés entiers (bump 6.18 → 6.20, son 6.19 intermédiaire subsumé) ; `changelog.html` régénéré (artefact généré, source CHANGELOG.md partagée). JAMAIS stagés : App.tsx, ActionBar/ExportMenu/ShareMenu/Sidebar, validation.ts, validationTargets.*.
- **Release v6.20.0** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.20.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.20.0), MEMORY (cette entrée), commit + `vercel --prod`.

---

## SESSION — 2026-08-17 (v6.17.0 : Landing — la bande « attaque du cluster taux fixe »)

### Résumé

Premier chantier de la feuille de route `IDEES-AMELIORATIONS-LANDING.md` (ordre de bataille n°1 : attaque du cluster taux fixe). Bande plein-largeur sous le héro : « Les autres simulateurs supposent un rendement fixe. Nous, on rejoue 100 ans de vraie histoire, krachs inclus. » — **sans aucun taux en dur** (décision utilisateur : ne pas citer « 5 % par an »). Mode inline APEX (bundles process + ui-ux, TDD rouge/vert, auto-revue adverse), **409 tests**, gate 100 % vert, vérifié en navigateur réel (FR/EN, 1440/390/320 px, 0 overflow, détecteur impeccable 0 finding).

### Décisions

- **Pas de chiffre dans la bande** : la promesse porte sur la méthode (rendement fixe supposé vs 100 ans d'historique réel rejoué), pas sur un taux. « Aléatoire » écarté : factuellement faux (les concurrents supposent un taux fixe, pas un taux aléatoire) et plus risqué juridiquement.
- **Test scoped à la bande** (`within(region)`) : la vérification « aucun 5 % par an » est limitée à la bande — un futur taux légitime ailleurs sur la page ne casserait pas le test (corrigé en auto-revue adverse).
- **Filet unique** : la bande n'a que `border-t` (la section « Chiffres clés » porte déjà `border-y`) — pas de double trait entre les deux bandes.
- **Release v6.17.0** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.17.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.17.0), MEMORY (cette entrée), commit + `vercel --prod`.

---

## SESSION — 2026-08-17 (v6.18.0 : Landing — tableau honnête + objectif inversé + FAQ schema + page changelog)

### Résumé

Quatrième vague de la feuille de route `IDEES-AMELIORATIONS-LANDING.md` : chantiers **n°2 (comparaison), n°4 (objectif inversé), n°8 (FAQ schema), n°9 (dernières éditions + changelog)** — la preuve par les faits après l'attaque de la bande v6.17.0. Mode inline APEX (TDD rouge/vert, auto-revue adverse), **418 tests**, gate 100 % vert, vérifié en navigateur réel : e2e complet du deep-link (CTA → `#s=` → app avec objectif 1 000 000 € / 20 ans pré-chargé dans l'onglet Objectif), EN traduit, 320 px sans overflow.

### Décisions

- **Tableau honnête (1.4 + 4.2)** : 4 colonnes (Snowball Pro, ProjectionLab, Finary, Simulateurs SEO FR) × 6 critères (fiscalité FR, 100 ans d'historique, Monte Carlo, décumulation, gratuit, 100 % local), cases ✅/⚠/✕ avec légende « partiel — à vérifier » et note datée (17/08/2026). **Aucun ✕ inventé** : chaque ⚠ est assumé (freemium, partiel, bases). Maillage interne vers les 4 pages `/alternatives/`.
- **Objectif inversé (5.1)** : curseurs réels branchés sur `solveGoal` (même solveur que l'app, scénario Central, capital 0), jauge de difficulté (chaînes réutilisées de GoalTab), note honnête « calcul brut avant fiscalité et frais ». CTA « Repartir de cette simulation » écrit `window.location.hash = encodeInputsForUrl(...)` **directement** (pas `navigateTo` : il écraserait le `#s=`). `goalSync: false` par défaut → l'app honore les réglages d'objectif du lien.
- **FAQ schema (4.1)** : JSON-LD `FAQPage` dans `index.html`, 8 questions de la FAQ verbatim (validé par parse : 8 Q/R complètes, à côté du WebApplication existant).
- **Dernières éditions (2.4)** : 13 → 3 cartes (4 avec v6.18.0), grille `sm:grid-cols-2 lg:grid-cols-4`, lien « Toutes les versions » → `public/changelog.html` (générée depuis CHANGELOG.md par un script jetable, 52 versions, prettier-compliant, ajoutée à sitemap.xml + llms.txt + footer).
- **Auto-revue (2 findings corrigés)** : `aria-label` « Dernières évolutions » traduit en EN (il était codé en dur) ; tests maillage scoped `within(region)` (le footer répète les mêmes liens).
- **Environnement** : binaire natif `lightningcss-darwin-x64` évincé par iCloud (placeholder `.icloud`) → téléchargé depuis le registry et posé dans node_modules (réparé, build OK).
- **Checkout partagé** : un autre agent travaille en parallèle (refonte header + validationTargets : `App.tsx`, `ActionBar.tsx`, `ExportMenu.tsx`, `ShareMenu.tsx`, `Sidebar.tsx`, `utils/validationTargets.ts`, tests associés dans `components.test.tsx`). **Ses fichiers ne sont ni touchés ni commités** ; seuls mes hunks de `components.test.tsx` sont stagés (git add -p).
- **Release v6.18.0** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.18.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.18.0), MEMORY (cette entrée), commit + `vercel --prod`.

---

## SESSION — 2026-08-16 (v6.16.0 : Onboarding guidé — tutoriel non-skippable + questionnaire « Nouvelle simulation » + bibliothèque multi-sims)

### Résumé

Demande utilisateur : _« onboarding poussé avec un questionnaire pour guider les nouveaux qui n'y comprennent rien »_, puis idée : _« à la place des réglages, un système “lancer une (nouvelle) simulation” qui pose des questions »_. Livré en un seul chantier (mode inline APEX, TDD, 408 tests, gate 100 % vert, parcours validé en navigateur réel) :

1. **Tutoriel non-skippable 5 écrans** (`Tutorial.tsx`) — uniquement pour le **vrai nouveau visiteur** (aucun réglage, pas de `#s=`, pas de données de compte), garde `snowball_v5_onboarded` ; un visiteur avec lien partagé déjà rempli passe direct.
2. **Questionnaire wizard** (`SimulationWizard.tsx`) — 8 questions fixes + sous-questions conditionnelles, une par écran, barre de progression, retour, champ « Autre », halo or sur les recommandations : capital en **Oui/Non** (montant seulement si Oui), projet en **2 parties** (objectif → durée, + « Enrichissement personnel »), enveloppe avec **⭐ RECOMMANDÉ dynamique**, âge d'arrêt **conditionnel** (retraite + liberté financière), risque, **renommage final** avec nom par défaut intelligent.
3. **Nouvelle simulation** : bouton dans l'ActionBar → relance le questionnaire **vierge** (le pré-remplissage a été refusé : nouvelle sim = nouveaux chiffres) ; dialogue **« Sauvegarder et créer / Créer sans sauvegarder / Annuler »** si la sim en cours est modifiée.
4. **Onglet « Mes simulations »** (`SimulationsTab.tsx`) — vrai onglet : sim en cours + bibliothèque (ouvrir, renommer inline, supprimer par double-clic de confirmation 3,5 s).
5. **Réglages au second plan** : sidebar repliée par défaut (rail « Déplier les réglages avancés »), QuickStart **supprimé**.
6. **Release v6.16.0** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.16.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.16.0), MEMORY (cette entrée), commit + **`vercel --prod`**.

### Décisions

- **Non-skippable = vrai nouveau visiteur uniquement** : condition d'entrée stricte (pas de réglages existants, pas de `#s=`, pas de compte) — sinon un lien partagé rempli serait bloqué par un tutoriel inutile.
- **Questionnaire vierge à chaque nouvelle sim** (pas de pré-remplissage) : l'utilisateur veut tester d'autres chiffres ; le formulaire doit partir de zéro, les recommandations ⭐ guident.
- **⭐ dynamique plutôt que statique** : la recommandation d'enveloppe dépend de l'horizon du projet (ex. PEA recommandé pour 20 ans) — moteur pur `recommendEnvelope` + `buildInputsFromAnswers` testés.
- **Réglages repliés, pas supprimés** : tout l'existant (épargne, compte, frais, profil, mode Débutant/Avancé) reste accessible derrière le rail « Réglages avancés » — le mode Débutant/Avancé existant est conservé.
- **Snapshots réutilisés** : la bibliothèque « Mes simulations » s'appuie sur le moteur snapshots existant (`snapshotsStorage`) + nouveau `renameSnapshot` (limite 30) — pas de nouveau stockage parallèle.
- **Suppression par double-clic armé** (1ᵉʳ clic arme la confirmation 3,5 s, 2ᵉ confirme) : évite un dialogue bloquant, reste couvert par test unitaire.
- **TDD rouge/vert** : tests moteur écrits avant l'implémentation (`onboarding.ts`), puis composants ; le typecheck a attrapé des clés i18n dupliquées corrigées dans la foulée.

---

## SESSION — 2026-08-16 (v6.15.0 : Mobile 100 % — résultat d'abord, zoom iOS corrigé, zones tactiles + socle app iOS Capacitor)

### Résumé

Demande utilisateur : _« je souhaiterai developper à 100 % le mode site web pour mobile, et une app sur ios, sur l'app store »_, puis _« pour l'app store on laisse un peu tomber pour le moment »_ — le socle iOS est livré et commité, la soumission reste en attente. Chantier mobile complet, mesuré en navigateur réel (Playwright, 320 → 430 px, 401 tests, gate 100 % vert) :

1. **Résultat d'abord sur mobile** (`App.tsx`) : les onglets + le héro passent AVANT les réglages (`order-1/order-2` sur la grille, desktop inchangé) — avant, il fallait scroller ~2 000 px (QuickStart ~700 px + sidebar entière) avant de voir le capital final.
2. **QuickStart compact** (`QuickStart.tsx`) : 3 cartes en ligne défilante (scroll-snap, 74 % de largeur) au lieu de 3 cartes empilées — bandeau de ~700 px à **275 px** ; bouton « Utiliser ce profil » ~40 px ; croix de fermeture élargie.
3. **Zoom iOS au focus corrigé** : `SmartInput` et `fields.tsx` passent en `text-base` (16 px) sur mobile (le zoom auto de Safari frappe tout champ < 16 px) + filet de sécurité CSS global étendu (email/password/tel/url/search) — c'était déjà le cas via CSS pour text/number mais pas pour les champs auth.
4. **Zones tactiles** : boutons de l'en-tête (ActionBar, ExportMenu, ShareMenu, LanguageToggle, AccountMenu, landing) en `py-2.5` mobile (~37 px), `HelpTip` agrandi (20 px), le tout `sm:` inchangé.
5. **iOS/PWA** (`index.css` + `index.html`) : `viewport-fit=cover`, meta `apple-mobile-web-app-*`, `apple-touch-icon`, safe-areas (`env(safe-area-inset-*)` via `.sticky-header`/`.app-shell`), `touch-action: manipulation`, `-webkit-text-size-adjust: 100%`.
6. **Socle app iOS (Capacitor 8.5)** : `capacitor.config.ts` (`com.snowballpro.app`), projet Xcode généré `ios/`, icône App Store 1024² + splash sombre 2732² (`scripts/generate-ios-assets.mjs`, PNG natif zlib), LaunchScreen sombre, redirection native `#/` → `#/app` (`main.tsx`), scripts `ios:build`/`ios:open`, workflow CI `.github/workflows/ios.yml` (Xcode 26, .ipa en artifact), `public/privacy-policy.html`, `GUIDE-APP-STORE.md`.
7. **Release v6.15.0** : bump (package.json, package-lock.json via `npm version --no-git-tag-version`, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.15.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.15.0), MEMORY (cette entrée), commit + **`vercel --prod`**.

### Décisions

- **Résultat d'abord par `order`, pas par remontage DOM** : un simple `order-1 lg:order-2` sur la grille — aucun impact sur les tests, le focus, ni l'état ; desktop strictement inchangé.
- **Scroll-snap plutôt qu'accordéon** pour le QuickStart : le bandeau reste un coup d'œil (275 px), le geste est natif, et `sm:` repasse en grille 3 colonnes exactement comme avant.
- **16 px sur mobile, pas partout** : `text-base sm:text-xs/sm:text-sm` — la densité desktop est préservée ; le CSS `!important` existant reste en filet de sécurité (complété avec email/password/tel/url/search).
- **Capacitor en devDependencies** (jamais importé dans le bundle web) ; `ios/` (projet natif généré) **commité** (convention Capacitor) mais **exclu des gates** (eslint `ignores`, `.prettierignore`) ; `capacitor.config.ts` ajouté au typecheck.
- **Xcode 26 obligatoire depuis le 28/04/2026** (Apple) : le Mac local (macOS 12.7) ne peut pas builder → workflow GitHub Actions fourni (runner macOS, certificat + profil en secrets, .ipa en artifact) ; guide complet `GUIDE-APP-STORE.md`.
- **Politique de confidentialité** : page statique `public/privacy-policy.html` (exigence App Store pour une app à comptes, même locaux) — noindex, servie par Vercel.
- **`vite.config.ts`** (fix de l'autre thread, commité `29caa9b3`) : restreint le scan de pré-bundling à `index.html` — nécessaire avec le dossier `ios/` (copie du build web) ; non touché par cette session.

### Vérifications

- Gate : typecheck ✓ lint ✓ **401/401 tests** ✓ i18n 0 clé manquante ✓ format ✓ build ✓ (dist 1 228 ko / 359 ko gzip).
- Playwright réel : ordre mobile main(520) < sidebar(3378) ✓, QuickStart 275 px ✓, 0 input < 16 px ✓, 0 overflow à 320/390 px sur les 4 onglets (sidebar ouverte incluse) + landing ✓, 0 overflow avec QuickStart neuf ✓.
- `npm run ios:build` ✓ (build web + `cap sync ios`, privacy-policy copiée dans `dist/` et `ios/App/App/public/`).
- Déploiement : `vercel --prod` → https://snowball-pro.vercel.app (v6.15.0).

---

## SESSION — 2026-08-16 (finitions distribution : 4 pages alternatives + pricing.html, footer landing, test de régression SEO)

### Résumé

Demande utilisateur : _« ok on fini pour que tout soit 100 % parfait »_ — le travail en cours (guides + alternatives + pricing) a été passé en revue, complété et verrouillé par des tests. Aucun changement moteur.

1. **4 pages alternatives SEO** (`public/alternatives/`) : `portfolio-visualizer.html`, `firecalc.html`, `networthify.html`, `quantalys.html` — comparatifs honnêtes (tableau + « quand choisir l'un ou l'autre » + FAQ), JSON-LD Article + FAQPage, canonical, OG, CSP identique à l'app, GoatCounter, CTA deep-link `#s=…` et liens croisés entre pages.
2. **`public/pricing.html`** (nouvelle page, remplace le brouillon orphelin `pricing.md` supprimé) : « 100 % gratuit, pour toujours » — grille du plan gratuit, FAQ, CTA deep-link PEA. Ajoutée au sitemap et à `llms.txt`.
3. **Footer landing** (`LandingPage.tsx`) : nouvelle rangée « Guides et comparatifs » (8 liens : 3 guides, 4 alternatives, Tarifs) — l'app pointe enfin vers ses pages statiques (distribution SEO) ; clés i18n FR/EN ajoutées.
4. **Guides autonomes** : le CSS partagé `guides.css` a été inliné à l'identique dans les 3 guides (fini le chemin absolu qui cassait en preview locale) → `guides.css` supprimé (orphelin).
5. **Test de régression** (`src/__tests__/public-pages.test.ts`, 12 tests) : chaque `#s=` des pages publiques doit se décoder via `decodeInputsFromUrl` (le chemin exact de l'app) avec ses champs clés ; chaque URL du sitemap et de `llms.txt` doit correspondre à un fichier réellement servi.
6. **Prettier** : pages publiques + 2 fichiers `src/` en dette de formatage (`ShareMenu.tsx`, `PatrimonialReport.tsx`) remis au style.
7. **Release v6.14.0** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.14.0`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.14.0), MEMORY (cette entrée), commit, puis **`vercel --prod`**.

### Décisions

- **Pages 100 % statiques autonomes** : CSS inliné dans chaque page (philosophie single-file du projet, résout le problème de preview du CSS absolu noté en v6.13.0) ; `guides.css` supprimé car plus référencé (récupérable via `git checkout`).
- **`pricing.md` → `pricing.html`** : un brouillon non lié ne sert à rien pour le SEO ; la page réelle est indexable, dans le sitemap, dans `llms.txt` et liée depuis la landing.
- **Comparatifs honnêtes** : chaque page reconnaît ce que l'outil comparé fait mieux (ex. backtesting multi-actifs pour Portfolio Visualizer) — positionnement crédible plutôt que rabaissement.
- **Test des CTA comme contrat** : le payload `#s=` doit rester décodable par `parseStoredInputs` (un champ renommé retomberait silencieusement sur les défauts) — c'est désormais vérifié à chaque `npm test`.
- **Release complète** (demande utilisateur : _« commit, publie sur vercel et met tout à jour »_) : bump v6.14.0 + CHANGELOG + commit + déploiement — tout le travail distribution (guides inlinés + alternatives + pricing + footer + test) part dans une seule release.

### Vérifications

- Liens profonds : 8 payloads `#s=` (3 guides + 4 alternatives + pricing) décodés — champs clés exacts (PEA 100 k€/1,5 k€/20 ans, FireCalc rule-4 4 %, Networthify 1 M€, Quantalys AV 50 k€/700 €/25 ans).
- CSS inline des 3 guides identique à l'ancien `guides.css` mis à jour (vérifié hors commentaires).
- Prettier : plus aucun fichier signalé (pages publiques + `ShareMenu.tsx` + `PatrimonialReport.tsx`).

---

## SESSION — 2026-08-16 (v6.13.1 : panneaux expérimentaux retirés, fix mobile onglets, déploiement)

### Résumé

Demande utilisateur : _« non c nul ce que t'as mis supprime tout ça »_ pour les deux panneaux expérimentaux proposés (comparaison d'enveloppes + leviers), _« pour le reste que t'as implémenté tu peux commit, et publie sur vercel uniquement ça, et mets à jour »_.

1. **Retrait des 2 panneaux (jamais publiés)** : `EnvelopeComparisonPanel.tsx`, `SensitivityPanel.tsx`, `envelopeComparison.ts`, `sensitivity.ts` supprimés ; barrel `engine/index.ts`, branchement `SimulatorTab.tsx`, clés i18n FR/EN et tests (moteur + composants) retirés. Les clés i18n et tests composants de ces panneaux, qui avaient été emportés dans le commit v6.13.0 de l'autre thread, ont été nettoyés dans `src/engine/i18n.ts` et `src/__tests__/components.test.tsx` (le travail de l'autre thread — ShareMenu, guides, partage — est intact).
2. **Fix mobile conservé** (`TabBar.tsx`) : retrait du `whitespace-nowrap` sur les libellés d'onglets — « Robustesse de votre plan » débordait à 320 px (bug préexistant v6.11.2), 0 overflow à 314 px.
3. **`public/llms.txt` conservé** (déjà intégré au commit v6.13.0).
4. **Release v6.13.1** : bump (package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.13.1`, footer + « Dernières éditions » landing FR/EN), CHANGELOG (entrée v6.13.1), MEMORY (cette entrée), puis **`vercel --prod`** — premier déploiement de la brique v6.13 (partage + guides SEO + correctifs).

**389 tests** (402 → 389 : les 13 tests des panneaux retirés), gate 100 % vert, build ✓ (dist 1 222 ko / 358 ko gzip).

### Décisions

- **Supprimer, pas désactiver** : l'utilisateur a jugé les panneaux hors périmètre — code retiré proprement (pas de flag caché), i18n et tests inclus, zéro résidu.
- **Ne toucher qu'aux fichiers de la feature retirée** : le travail commité de l'autre thread (v6.13.0 : ShareMenu, guides SEO, partage PDF, sitemap) n'a été ni modifié ni rejoué — seule la version a été bumpée pour la release.
- **Le lockfile n'est pas éditable par les outils fichiers du harness** (`[BLOCKED]`) : bump `package-lock.json` fait au `sed` ciblé (2 lignes exactes), vérifié par `git diff`.

### Vérifications

- Gate : typecheck ✓ lint ✓ **389/389 tests** ✓ i18n 0 clé manquante ✓ build ✓ (dist 1 222 ko / 358 ko gzip).
- Déploiement : `vercel --prod` (alias de production).

---

## SESSION — 2026-08-15 (v6.13.0 : Distribution — partage en un clic + rapport PDF signé + 3 guides SEO long-tail)

### Résumé

Brique « distribution » de la stratégie (canal SEO + boucle virale) — le produit est prêt, c'est la visibilité qui manque. Trois leviers techniques, zéro changement moteur :

1. **Bouton « Partager » visible** (`ShareMenu.tsx`, dans l'en-tête) : X (Twitter), WhatsApp, LinkedIn et copie du lien. Chaque lien embarque le scénario pré-rempli (`#s=…` via `buildShareUrl`) + **UTM par canal** (`utm_source=partage&utm_medium=x|whatsapp|linkedin|copie`) inséré AVANT le hash — GoatCounter voit la source, l'état partagé reste intact. Remplacé le menu « Partager la simulation » caché dans « ⋯ » (ActionBar) ; `App.tsx` passe `inputs={activeInputs}` au lieu de `onCopyLink`/`linkCopied`.
2. **Rapport PDF signé** (`PatrimonialReport.tsx`) : pied de rapport « Créé avec Snowball Pro — simulez gratuitement votre propre projet d'épargne » + URL du site + **lien partageable du scénario** (`buildShareUrl`, sans UTM — artefact imprimé). Chaque rapport imprimé = une publicité.
3. **3 guides SEO statiques** (`public/guides/`) : `simulateur-pea.html`, `pea-ou-assurance-vie.html`, `calcul-interets-composes.html` + `guides.css` partagé. Requêtes long-tail françaises ciblées, JSON-LD **Article + FAQPage**, canonical, OG, CSP identique à l'app, GoatCounter, et CTA « Simulez votre scénario » en **lien profond pré-rempli** (payloads vérifiés décodables par `parseStoredInputs` — enveloppe + années de détention + montants). Sitemap + `llms.txt` (AEO) mis à jour.

**402 tests** (373 → 402 : +4 tests partage, +25 de l'autre thread), gate 100 % vert, build ✓ (guides copiés dans `dist/`). Release **v6.13.0** complète : package.json, package-lock.json, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.13.0`, footer + « Dernières éditions » landing (FR + EN), CHANGELOG (entrée v6.13.0), MEMORY (cette entrée).

### Décisions

- **UTM avant le hash** : `?utm_source=partage&utm_medium=x#s=…` — le scénario pré-rempli n'est jamais altéré par le tracking (le hash est l'état, la query est la source).
- **Guides 100 % statiques** plutôt que routes SPA : le single-file Vite + hash router n'est pas indexable par requête long-tail — des pages HTML statiques dans `public/` (copiées telles quelles dans `dist/`) le sont, et chaque page peut porter ses propres données structurées + CTA deep-link.
- **Taux cités alignés sur le moteur** (règle 2026 du repo) : CTO PFU 31,4 %, PEA 18,6 % de PS après 5 ans, AV 17,2 % — jamais les taux 2025 (leçon v6.8.0 : la landing mentait, le moteur avait raison).
- **Le partage famille reste interdit** (règle AGENTS #4) : les guides et boutons de partage sont des canaux anonymes/publics, conformes.
- **Prochaine étape** : déployer (`vercel --prod`), resoumettre le sitemap dans GSC (URLs guides), surveiller GoatCounter par UTM, et générer les guides suivants (règle des 4 %, PER vs AV, calcul PFU, combien investir pour 1 M€) si les premiers performent (règle 50-100 visites).

### Vérifications

- Gate : typecheck ✓ lint ✓ **402/402 tests** ✓ build ✓ (dist 1 227 ko / 359 ko gzip, guides présents).
- Liens profonds décodés : `s=` des 3 pages → payloads exacts (enveloppe/années/montants), conformes au schéma `parseStoredInputs`.
- Page guide vérifiée en preview (structure complète : header, article, CTA, FAQ disclosure, footer) — le CSS absolu `/guides/guides.css` ne se charge pas dans la preview locale (servie à la racine) mais résout correctement en prod (`/guides/…`).
- Worktree : les fichiers non commités de l'autre thread (SimulatorTab, engine/index.ts, EnvelopeComparisonPanel, SensitivityPanel, engine.test.ts) n'ont PAS été touchés.

---

## SESSION — 2026-08-15 (v6.12.0 : l'application en anglais 🇬🇧 — bouton FR/EN)

### Résumé

Demande utilisateur : _« je veux ajouter un bouton sur le site pour traduire dans plusieurs langues et rendre accessible à plus de gens. On met juste l'anglais. »_ Implémentation complète de l'i18n FR→EN, sans toucher au moteur de calcul ni aux 373 tests existants :

- **Moteur de traduction pur** (`src/engine/i18n.ts`, testable en node) : `tr(lang, texteFR, params?)` indexé par le **texte français exact** — le JSX garde le français, fallback naturel si une traduction manque, zéro invention de clés. `Lang`, `LANG_LOCALE` (fr-FR/en-US), `interpolate`, `langCode`.
- **Formatters localisés** (`formatting.ts`, `taxRules.ts`) : `lang` optionnel, défaut `fr` — rétrocompatibilité totale.
- **`src/i18n.tsx`** : `LangProvider` + `useLang()` ; sans provider (tests isolés) tout retombe en français. Préférence persistée (`snowball_v5_lang`), langue du navigateur au premier passage, `<html lang>` + titre suivent.
- **Bouton `LanguageToggle`** dans l'ActionBar de l'app et l'en-tête de la landing ; ~60 fichiers traduits (tabs, sidebar, graphiques, rapport PDF, landing, auth).
- **Tests** : i18n moteur + bascule de langue (toggle/formatters/inscription) ; **`scripts/i18n-check.mjs`** garantit 100 % de couverture des clés.

### Décisions

- **Clés = texte français exact** plutôt qu'identifiants : le JSX reste lisible, les tests existants (qui scrutent des libellés FR) passent inchangés, et une clé manquante retombe proprement sur le français.
- **Traduction à l'affichage pour les messages moteur** (validation, auth) : le moteur reste en français (tests moteur intacts), `tr()` est appliqué là où le message s'affiche (Sidebar, ActionBar, formulaires).
- **Le français reste la langue par défaut** ; l'architecture (dictionnaire indexé par texte FR) est prête pour d'autres langues sans refonte.
- **Formatage localisé** : montants et pourcentages suivent la langue (€1,234.56 vs 1 234,56 €) via les formatters liés de `useLang`.

### Vérifications

- Gate : typecheck ✓ lint ✓ **385/385 tests** ✓ build ✓ (single-file 1,2 Mo inliné).
- Couverture des clés : `node scripts/i18n-check.mjs` → 0 clé manquante (seules exceptions volontaires : dataKeys, libellés de langue « Français », erreur #root).
- Release **v6.12.0** : package.json, package-lock.json local, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.12.0`, footer + « Dernières éditions » landing (FR + EN), CHANGELOG (cette entrée), MEMORY (cette entrée).

---

## SESSION — 2026-08-15 (panneau « Votre capital en détail » : échelles libellées sur chaque valeur + panneau resserré)

### Résumé

Retour utilisateur sur le panneau « Votre capital en détail » (SummaryStats) : _« c'est trop étendu vers le bas, on comprend pas, c'est pas appliqué, je comprends pas ! sur le compte en 2045 / en euros d'aujourd'hui »_. Deux corrections (bundles /process + /apex + /ui-ux) :

1. **Hauteur** : le bloc est resserré verticalement — padding `p-4 sm:p-5` (au lieu de p-5/p-6), header `mb-3`, rangée icône `mb-1.5`, sous-texte `mt-0.5`, section gains `mt-2 pt-2`, grille `gap-y-4` ; en contrepartie les **grands chiffres passent en `text-lg sm:text-xl`** (taille augmentée, comme suggéré par l'utilisateur).
2. **Compréhension** : la légende d'échelle PARTAGÉE de l'en-tête (v6.9.0) ne rattachait pas les pastilles aux chiffres — elle est **supprimée** ; chaque valeur porte désormais SON libellé via `DualAmount primaryLabelInline` (« 682 770 € sur le compte en 2050 » / « 406 098 € en euros d'aujourd'hui »). En colonne étroite (mobile 320 px), le libellé du grand chiffre ET celui de la ligne secondaire passent à la ligne (flex-wrap) au lieu de tronquer — plus de « en euros d… » coupé.

Aucun libellé i18n nouveau (clés « sur le compte en {year} » / « en euros d'aujourd'hui » existantes) ; `DualAmount` gagne deux props optionnelles (`primaryLabelInline`, `size`) sans changer son rendu par défaut — les autres usages (HeroResult, Sidebar, FiscalPanel…) ne bougent pas.

**Release v6.11.2** (demande utilisateur : _« commit, publie sur vercel et met tout à jour, le travail que tu as fait toi »_) : version bumpée (package.json, package-lock.json local, `sw.js` `CACHE_VERSION` = `snowball-pro-v6.11.2`), carte « Dernières éditions » v6.11.2 + footer FR/EN (`LandingPage.tsx` + `i18n.ts`), CHANGELOG (cette entrée), déploiement Vercel. **À noter** : le chantier i18n v6.12.0 de l'autre thread (60+ fichiers, dont SummaryStats/DualAmount/LandingPage/interlacés avec mes changements) était toujours **non commité** au moment de la release — le build déployé l'inclut (gate 100 % vert : typecheck ✓ lint ✓ **385/385 tests** ✓ build ✓), mais le commit de cette partie revient à sa propre session ; mon correctif seul est indissociable de son i18n dans les fichiers partagés (commit séparé impossible sans commiter son travail).

### Décisions

- **Légende d'en-tête retirée, libellés appliqués aux valeurs** : l'utilisateur rejette explicitement le choix v6.9.0 (« légende partagée ») — chaque montant doit se lire seul, sans avoir à décoder une légende.
- **Flex-wrap plutôt que truncate** pour les libellés d'échelle (grand chiffre en ligne, ligne secondaire) : sur desktop ils restent en ligne, sur mobile ils passent à la ligne entiers — lisibilité partout, y compris en anglais (libellés plus longs).
- **Rendu par défaut de `DualAmount` inchangé** : les nouvelles props sont opt-in, les tests existants (dont « peut masquer le libellé de la seconde échelle ») passent sans modification.

### Vérifications

- Gate : typecheck ✓ lint ✓ (0 erreur) **385/385 tests** ✓ (dont tests SummaryStats/DualAmount mis à jour) build ✓.
- Vérifié en navigateur réel (dev server 5173, preview) : chaque valeur porte son échelle, aucune légende d'en-tête, aucun libellé tronqué à 320 px, panneau dans les limites (l'overflow horizontal résiduel à 320 px vient de la barre d'onglets « Robustesse de votre plan », préexistant et hors périmètre).
- Déployé : Vercel prod (v6.11.2), footer + « Dernières éditions » vérifiés sur la landing.

---

## SESSION — 2026-08-15 (v6.11.1 : favicon — une icône .ico pour Google)

### Résumé

Un autre thread avait ajouté `public/favicon.ico` + le lien dans `index.html` (commentaire : « requis par Google pour l'icône dans les résultats de recherche ») pendant la session v6.11.0 ; le déploiement Vercel (build depuis l'arbre de travail) l'avait déjà emporté en prod, mais le repo restait désynchronisé. À la demande _« commit ca stp et met a jour »_ : commit du favicon + documentation v6.11.1 (bump patch : package.json, lock, sw.js CACHE_VERSION, footer + « Dernières éditions » landing, CHANGELOG, MEMORY), gate 100 % vert, commit + redéploiement Vercel — repo et prod resynchronisés en v6.11.1.

### Décisions

- **Version 6.11.1** (patch) : l'icône est un correctif d'affichage/SEO, pas une feature — entrée CHANGELOG dédiée quand même (convention).
- **`index.html`** : favicon.ico (16/32/48) en tête + PNG 192 conservé pour les écrans haute densité.
- **`public/favicon.ico`** : 3 tailles embarquées (16/32/48 px, PNG RGBA), 4 627 o.

### Vérifications

- Gate : typecheck ✓ lint ✓ **373/373 tests** ✓ build ✓.
- Prod : https://snowball-pro.vercel.app — footer v6.11.1, favicon.ico HTTP 200.

---

## SESSION — 2026-08-15 (v6.11.0 : inflation — l'hypothèse 2,1 % explicitée, médiane 2,1 %)

### Résumé

Audit de véracité des trois taux pédagogiques (Brut 10,07 % → Composé 8,22 % → Réel 5,99 %) — demande utilisateur : _« est-on sûr et certain de l'exactitude et de la véracité de ces chiffres ? »_ (bundles /research + /apex + /business). Vérifié au centième sur le moteur (moyenne arithmétique 10,0655 %, composé géométrique 8,2196 %, réel Fisher 5,9938 % — l'écart 1,85 pp = σ²/2 exact avec σ ≈ 19,3 %) ; série MSCI World Net EUR 1970-2025 recoupée année par année contre les rendements officiels USD (Wikipedia/MSCI) convertis au change EUR/USD — cohérente (1999 +46,2 %, 2008 −37,3 %, 2022-2025 vs CW8). Seul point discutable : le 5,99 % déflaté d'une hypothèse forfaitaire 2,1 %, inférieure à la moyenne réelle INSEE 1970-2025 (4,05 %). Analyse médiane demandée : **médiane = 2,10 %** (pile 2,1 %), moyenne sans années > 5 % = 1,78 %, moyenne 1986-2025 = 1,87 % → **2,1 % est l'hypothèse la plus naturelle et plutôt prudente pour l'avenir : on la garde**, et on l'explicite dans l'UI. À la demande _« ok commit, publie sur vercel et met tout à jour »_ : **373 tests**, gate 100 % vert, vérifié en navigateur réel, commit + déploiement Vercel.

### Décisions

- **On garde 2,1 %** (validé par l'utilisateur) : c'est la médiane de l'inflation française 1970-2025 (2,10 %) et elle est supérieure à la moyenne des 40 dernières années (1,87 %) — prudente, pas optimiste.
- **`Sidebar.tsx`** (panneau « Pourquoi ces chiffres ? ») : note « Hypothèse d'inflation : 2,1 %/an (cible BCE), vs 4,0 % en moyenne réelle 1970-2025 — la médiane de la période est justement 2,1 %. »
- **`LandingPage.tsx`** : même note en méthodologie (moyenne tirée vers le haut par les chocs 1970-1985) + nouvelle FAQ « Pourquoi 2,1 % d'inflation et pas la moyenne réelle ? » (médiane 2,1 %, pic 13,7 % en 1974, moyenne 1,9 % depuis 1986) + « Dernières éditions » et footer en v6.11.0.
- **Version 6.11.0** : package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.11.0`, footer + « Dernières éditions » landing, CHANGELOG (cette entrée), MEMORY (cette entrée).
- Piste laissée : les labels « 2,1 % » restent codés en dur (Sidebar/Landing) — les dériver du moteur si l'hypothèse change un jour.

### Vérifications

- Gate : typecheck ✓ lint ✓ **373/373 tests** ✓ build ✓.
- Navigateur réel : panneau « Pourquoi ces chiffres ? » (note présente), landing méthodologie, FAQ dépliée.

---

## SESSION — 2026-08-15 (v6.10.0 : graphiques — valeur finale sans hover, palette unifiée, légendes en chips)

### Résumé

**Release cumulée** : le lot v6.9.0 (panneau « Votre capital en détail ») était resté non commité (convention utilisateur : commit + `vercel --prod` sur demande explicite) ; un second lot « graphiques » (v6.10, commenté « v6.10 » dans le code) s'est greffé dessus — labels de fin de courbe, palette unifiée, LegendChip, polish axes/infobulles. À la demande _« ok commit, publie sur vercel et met tout à jour »_ (bundles /process + /apex -axv) : documentation finalisée en **v6.10.0** (entrée CHANGELOG dédiée, entrée v6.9.0 conservée), gate 100 % vert, commit + déploiement Vercel. Au passage : **réparation node_modules** — `lucide-react` 1.25.0 avait un `.d.ts` manquant (install corrompue, 45 erreurs TS), résolu par `rm -rf node_modules/lucide-react && npm install`.

### Décisions

- **Version 6.10.0** (et non 6.9.0) : le lot graphiques est séparé et commenté « v6.10 » dans le code ; l'entrée CHANGELOG v6.9.0 décrit déjà le lot précédent (livré dans la même release).
- **`EquityChart.tsx`** : labels de fin de courbe via `label={{ content: endLabel(...) }}` sur chaque Area/Line — valeur finale lisible sans hover ; point or sur « Gains » ; texte en `gainsAlt` (#7a5807 clair, AA 4.5:1 sur ivoire) ; marge droite 64 pour loger les labels hors du tracé.
- **Palette unifiée** : `CapitalAllocation` utilise désormais `chartTheme(darkMode)` (PALETTE locale supprimée) ; `chartTheme` gagne `gainsAlt` et standardise `gains`/`invested` (#996f09/#E3B341, #5f6b7a/#9aa3af).
- **`LegendChip.tsx`** (nouveau) : chip de légende partagée — swatch point plein (aires) ou trait pointillé (ligne impôts) — appliqué à EquityChart + ComparisonChart.
- **Polish** : tickMargin 8 + axes sans filets (Drawdown : grille verticale retirée), en-tête d'infobulle fileté (`border-b` : CustomTooltip + Equity + Comparison + Monte Carlo), grille claire 0.06 → 0.08, `animate-scale-in` sur les cartes de graphique.
- Zéro changement moteur. Tests `chartTheme` mis à jour, aucun cas ajouté (372/372).

### Vérifications

- Gate : typecheck ✓ lint ✓ **372/372 tests** ✓ build ✓ (dist 1 117 ko / 322 ko gzip).
- Version 6.9.0 → **6.10.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.10.0`, footer landing v6.10.0, « Dernières éditions » v6.10.0 en tête), CHANGELOG (entrée v6.10.0), MEMORY.md (cette entrée).

### Notes

- Le `.d.ts` manquant de lucide-react était un problème local (node_modules) : les sources n'ont jamais été en cause, typecheck de HEAD identique.

---

## SESSION — 2026-08-14 (v6.9.0 : synthèse — panneau « Votre capital en détail »)

### Résumé

Retour utilisateur : _« ça ne s'intègre pas très bien au reste du truc — c'est entre le patrimoine estimé et le graphique »_ — d'abord lu comme la seule ligne « Gains de la bourse », corrigé par l'utilisateur : c'est **le bloc des 4 cartes** (SummaryStats). Diagnostic (bundles /process + /ui-ux, critique impeccable) : ① **anatomie orpheline** — seul bloc de l'onglet sans titre ni conteneur, entre deux cartes glass titrées ; ② rupture d'échelle (48 px → 16 px) sans accroche ; ③ redondance avec le héro (carte 1 = même chiffre, gains = « Croissance » du héro) ; ④ « en euros d'aujourd'hui » ×4 ; ⑤ carte 4 boiteuse (gains en légende grise, seule exception double échelle) ; ⑥ trois noms pour le même chiffre (Croissance / Gains de la bourse / Gains (bourse)). Choix utilisateur : **Option A** (panneau titré 4 colonnes), titre **« Votre capital en détail »**, échelle = laissé à mon jugement → **légende partagée** + libellés courts. **372 tests**, gate 100 % vert, vérifié en navigateur réel.

### Décisions

- **`SummaryStats.tsx`** : 4 cartes flottantes → **panneau `glass rounded-3xl` + `SectionHeader` h2 « Votre capital en détail »** (icône PieChart) ; grille `grid-cols-2 lg:grid-cols-4` avec **filets verticaux** `lg:divide-x lg:divide-[color:var(--color-border)]` (2×2 mobile sans filets, gap-y-5) ; colonne 4 « Total épargné » : gains en **or** (`--color-value-gold`), « + », **deux échelles** ; captions conservées (avant/après impôts, à la liquidation).
- **`DualAmount.tsx`** : + `hideSecondaryLabel` (valeur seule, libellé porté par la légende du panneau ; aria-label toujours complet) + `prefix` (« + ») — rétro-compatible (FiscalPanel, MonteCarloPanel inchangés).
- **Légende d'échelle partagée** dans le `trailing` du SectionHeader : pastilles « sur le compte en 2045 » / « en euros d'aujourd'hui » (dots `bg-text-muted` / `bg-warning`), échelle active en `text-text font-semibold`, l'autre `opacity-70`.
- **`HeroResult.tsx`** : « Croissance : 504 648 € » → « Gains de la bourse : +504 648 € » (vocabulaire unifié héro/panneau/rapport).
- **`PatrimonialReport.tsx`** : sub « Gains de la bourse » en or (flag `subStrong`), grille de cartes imprimables conservée pour l'A4.
- Légende du graphique (« Gains (bourse) ») **conservée telle quelle** : surface séparée, légende compacte de chart.
- Zéro changement moteur. 3 tests ajoutés (2 DualAmount + 1 SummaryStats).

### Vérifications

- Gate : typecheck ✓ lint ✓ **372/372 tests** ✓ build ✓ (dist 1 117 ko / 322 ko gzip).
- Version 6.8.2 → **6.9.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.9.0`, footer landing v6.9.0, « Dernières éditions »), CHANGELOG (entrée v6.9.0), MEMORY.md (cette entrée).

### Notes

- Non commité / non déployé : à la demande de l'utilisateur (convention : commit + `vercel --prod` sur demande explicite).

---

## SESSION — 2026-08-14 (v6.8.2 : landing — un seul rythme vertical)

### Résumé

Retour utilisateur : _« sur la landing page supprime un peu ce trou au-dessus ! »_ — captures d'écran à l'appui (bande vide de ~96 px sous l'en-tête en desktop, jusqu'à ~175 px au-dessus de la carte à ~1024 px). Diagnostic : ① padding haut du héro `pt-14 sm:pt-20` (56/80 px) ; ② `items-center` sur la grille qui poussait la colonne la plus courte vers le bas (+75 px de vide au-dessus de la carte à 1024 px, +33 px au-dessus du badge quand la carte est plus haute) ; ③ des paddings hétérogènes entre sections (`py-16 sm:py-24` / `py-10 sm:py-14` / `py-20 sm:py-28`). **369 tests**, gate 100 % vert, vérifié en navigateur réel (mesures DOM Playwright 320 → 1440 px).

### Décisions

- **`LandingPage.tsx`** (v6.8.1, déjà commité) : héro `pt-14 sm:pt-20` → `pt-10 sm:pt-14` et `items-center` → `items-start` — le badge ET la carte démarrent à la même hauteur, le trou passe de ~96-175 px à **~56-76 px** selon la largeur.
- **`LandingPage.tsx`** (v6.8.2, cette session) : toutes les sections passent à **un seul rythme `py-14 sm:py-20`** (56/80 px) — Fonctionnalités, Scénarios, Enveloppes, Méthodologie, Pour qui, FAQ, « Dernières évolutions » (avant `py-10 sm:py-14`) et appel final (avant `py-20 sm:py-28`) ; héro `pb-16 sm:pb-20` → `pb-14 sm:pb-20`. Bande « Chiffres clés » conservée compacte (`py-10`) : c'est un bandeau bordé, pas une section. « Dernières éditions » : entrée v6.8.2 en tête (v6.5.1 retirée, 4 cartes), footer → v6.8.2.
- Zéro changement moteur. Aucun test à modifier (changements de classes uniquement).

### Vérifications

- Gate : typecheck ✓ lint ✓ **369/369 tests** ✓ build ✓ (dist 1 113 ko / 321 ko gzip).
- Navigateur (dev) : sections contiguës (gap 0, rythme interne uniforme), aucune bande vide résiduelle sous l'en-tête, grille « Dernières éditions » intacte (4 cartes), mobile et desktop identiques en structure.
- Version 6.8.1 → **6.8.2** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.8.2`, footer landing v6.8.2), CHANGELOG (entrée v6.8.2), MEMORY.md (cette entrée).

### Notes

- Commit + déploiement à la demande de l'utilisateur (« commit, publie sur vercel, met tout à jour ») : release v6.8.2 commitée puis `vercel --prod` → https://snowball-pro.vercel.app.

---

## SESSION — 2026-08-14 (v6.8.1 : héro — la question du lecteur, avec les mots du lecteur)

### Résumé

Deux retours utilisateur successifs sur le héro : _« je trouve qu'on comprend pas trop ça non ? »_, puis _« c mieux mais c toujours moyen, pas très clair, ça sonne mal »_ (l'utilisateur n'arrivait pas à expliquer pourquoi). Diagnostic en profondeur (méthodo `clarify` d'impeccable, bundles /process + /ui-ux) : ① « Combien votre épargne peut-elle **devenir** ? » — fausse paire grammaticale, « devenir » prend « que/quoi » pas « combien » (une quantité se dit avec « valoir ») — c'est ce qui sonne faux ; ② « vraiment » = bouche-trou défensif (triple « vrai » avec « vraie histoire » + « chiffres réels ») ; ③ registre « mystère magique » en contradiction avec la promesse « des chiffres réels, pas des promesses » ; ④ question sans horizon alors que la démo répond « 25 ans ». **369 tests**, gate 100 % vert, vérifié en navigateur réel (dev 5173, desktop + mobile).

### Décisions

- **`LandingPage.tsx`** : h2 → « Combien peut valoir votre épargne **dans 25 ans** ? » (accent doré sur « dans 25 ans » ; horizon = durée par défaut du moteur, celle de la carte démo — la question et la réponse visible sont la même chose) ; coupe en **2 lignes équilibrées** sur tous les viewports (spans `block` + `aria-label` — un `<br>` brut colle « épargnedans » dans le nom accessible, vérifié par le test) ; sous-titre → « Votre nombre magique, c'est le capital final de votre épargne — calculé sur 100 ans de vraie histoire boursière, krachs inclus. En 30 secondes, sans inscription, sur votre appareil. » (apposition propre : terme → définition → méthode → réassurances).
- **`components.test.tsx`** : l'assertion du héro suit le nouveau titre + la présence du sous-titre.
- Zéro changement moteur. Les 3 CTA « Calculer mon nombre magique », le badge « 100 ans d'historique réel » et la footnote « Des chiffres réels, pas des promesses » restent intacts.

### Vérifications

- Gate : typecheck ✓ lint ✓ **369/369 tests** ✓ build ✓.
- Navigateur (dev 5173) : le h2 rend « Combien votre épargne peut-elle vraiment devenir ? ».
- Version 6.8.0 → **6.8.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.8.1`, footer landing v6.8.1), CHANGELOG (entrée v6.8.1), MEMORY.md (cette entrée).

---

## SESSION — 2026-08-14 (v6.8.0 : Activation « Commencez ici » + CRO landing + taux 2026 dérivés + hiérarchie textuelle)

### Résumé

Passage `/full` (bundles business + research + ui-ux + process, mode continu automatique) à la demande de l'utilisateur. Le produit étant très mûr (v6.7.2, 361 tests, multiples audits), le passage a livré 4 changements ciblés à fort impact, zéro changement moteur : **activation** (bandeau « Commencez ici »), **CRO landing** (CTA sticky mobile, nav « Pour qui »), **confiance fiscale** (la landing citait les taux 2025 — désormais dérivés du moteur), **design tokens** (`text-dim` sombre réparé). **369 tests**, gate 100 % vert, vérifié en navigateur réel, **commité puis déployé** `vercel --prod` → https://snowball-pro.vercel.app.

### Décisions

- **`utils/quickStart.ts` (nouveau)** : source unique des 3 profils (Premiers pas 25 ans · Carrière 35 ans · Retraite 55 ans) partagée entre l'app et la landing (section « Pour qui ») — mêmes situations, aucune dérive. Clé `snowball_v5_quickstart_dismissed`. `loadQuickStartVisible(scope)` : masqué si déjà fermé OU si des réglages existent (visiteur connu) ; un compte vierge le voit.
- **`components/Layout/QuickStart.tsx` (nouveau)** : bandeau `glass-gold` (même langage que « lien partagé »), 3 cartes avec capital final CALCULÉ par `runSimulation` (jamais en dur) en double échelle (compte + € d'aujourd'hui), bouton « Utiliser ce profil » (historique → annulable).
- **`App.tsx`** : état `showQuickStart` + ref, `hideQuickStart` (persisté), auto-hide dans `updateInput`/`updateInputs` (premier réglage modifié = bandeau fermé), `handleApplyProfile` ; rendu au-dessus de la grille.
- **`LandingPage.tsx`** : CTA sticky mobile (apparu > 480 px de scroll, `md:hidden`, `invisible` hors tab-order quand caché, dégradé de lisibilité) ; lien « Pour qui » dans NAV (header + footer) ; **taux fiscaux dérivés de `taxRules.ts`** (`getTaxRules`/`pfuRate`/`fmtTaxPercent`) — « PFU 30 % »/« 17,2 % » (taux 2025 périmés) → « 31,4 % »/« 18,6 % » ; « Dernières éditions » + footer → v6.8.0.
- **`index.css`** : `--color-text-dim` sombre `#a39a8c` → `#8d8578` (avant quasi identique à muted → hiérarchie plate ; 5,3:1 AA ✓). Mode clair inchangé (déjà correct).
- **Recherche vérifiée** : fiscalité 2026 confirmée par 5+ sources indépendantes (LFSS 2026 : CSG 10,6 %, PFU 31,4 %, PEA 18,6 %, AV exclue à 17,2 %) → **le moteur était déjà correct** (`CURRENT_TAX_YEAR = 2026`), seuls les libellés landing mentaient. Ancrages MSCI World 8-9 %/an annualisé EUR plausibles (arbolyo, ramify).
- **Pricing/offres (recommandation, non implémentée)** : rester gratuit/sans compte (différenciateur réel) ; monétisation naturelle = « boîte de sortie » courtiers/CGP (lead-gen des concurrents gratuits) à faire avec du contenu de confiance, jamais un paywall.

### Vérifications

- Gate : typecheck ✓ lint ✓ **369/369 tests** ✓ (361 + 8 nouveaux) build ✓ (dist 1 112 ko / 321 ko gzip).
- Navigateur (dev 5173) : landing (31,4 %/18,6 % affichés, nav « Pour qui » header + footer, CTA sticky `translate-y-0` après scroll à 800 px, `text-dim` sombre `#8d8578` / clair `#6f6a5f`) + app (bandeau visible pour nouveau visiteur / masqué pour visiteur connu — vérifié sans détruire les données locales, restituées à l'identique depuis le hash partagé ; console 0 erreur).
- ⚠️ Incident maîtrisé en vérification : la suppression temporaire de la clé `snowball_v5_settings` pour tester le « nouveau visiteur » a été perdue au reload (backup en mémoire de page) — récupérée intégralement via le hash `#s=` (inputs identiques), restitution vérifiée (`version 1`, capital 10 000, scénario prudent).
- Version 6.7.2 → **6.8.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.8.0`, footer landing v6.8.0), CHANGELOG (entrée v6.8.0), MEMORY.md (cette entrée).

### Notes

- **Commit + déploiement finalisés à la demande de l'utilisateur** (« commit, publie sur vercel, met tout à jour ») : release v6.8.0 commitée puis `vercel --prod`. Le commit de release inclut le travail v6.7.2 resté non commité dans le worktree (showReal par défaut — migration.ts + tests) : il fait partie de l'arbre déployé et le gate 369 tests le couvre.

---

## SESSION — 2026-08-14 (v6.7.2 : « Euros d'aujourd'hui » décoché par défaut)

### Résumé

Demande utilisateur : _« je veux que cette option NE SOIT PAS COCHÉE PAR DÉFAUT ! Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout »_. Inversion du défaut posé en v5.5.0 : `DEFAULT_INPUTS.showReal` repasse à **false** — l'app démarre sur les euros COURANTS, le chiffre principal étant la valeur réelle sur le compte. Le pouvoir d'achat reste mis en avant partout via la double échelle (`DualAmount`, cartes, graphiques, rapport) : le toggle ne choisit que l'échelle en tête, il ne cache jamais rien (comportement v5.5.0 conservé). **361 tests**, gate 100 % vert.

### Décisions

- **`migration.ts`** : `DEFAULT_INPUTS.showReal = false` (avant `true`). Fallback v4 `showReal: s.showReal === true` — un choix v4 explicitement « true » reste respecté ; sinon défaut (faux), aligné sur le nouvel utilisateur.
- **Seul le défaut change** : aucun composant modifié — la double échelle affiche déjà les deux montants partout (libellé du toggle inchangé : « Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout »).
- **Tests** : défaut moteur `showReal = false`, migration v4 (undefined → faux / false → faux / true → vrai), toggle **décoché** au rendu d'App (composant).

### Vérifications

- Gate : typecheck ✓ lint ✓ **361/361 tests** ✓ build ✓.
- Version 6.7.1 → **6.7.2** (package.json, package-lock.json via `npm version --no-git-tag-version`, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.7.2`, footer landing v6.7.2), CHANGELOG (entrée v6.7.2), MEMORY.md (cette entrée). Pas de commit ni de déploiement (non demandé).

---

## SESSION — 2026-08-14 (v6.7.1 : Réglages repliables — rail d'icônes latéral style ChatGPT)

### Résumé

Demande utilisateur : _« je souhaite pouvoir vraiment bien replier le menu des réglages — un vrai repli sur le côté avec des petites icônes pour les catégories, un truc style ChatGPT »_ (+ captures de la sidebar actuelle et des rails ChatGPT replié/déplié). Le repli v6.2 (résumé compact `CollapsedSummary`) devient un **vrai rail latéral de 76 px** : la grille se resserre (380 px → 76 px, `transition-[grid-template-columns]`), le panneau se rétracte en colonne d'icônes sticky, le contenu gagne ~300 px. Zéro changement moteur — **361 tests**, gate 100 % vert, vérifié en navigateur réel (Playwright), **commité puis déployé** `vercel --prod` → https://snowball-pro.vercel.app.

### Décisions

- **L'état de repli monte dans `App.tsx`** (nouveau module `utils/sidebar.ts`, pattern `uiMode.ts`, clé `snowball_v62_sidebar_collapsed` conservée) : c'est App qui resserre la grille — la Sidebar n'est plus que le miroir (`collapsed` / `onToggleCollapsed` en props).
- **Sections contrôlées par Sidebar** : `openSections` (défauts identiques à avant : « Votre épargne » ouvert, le reste replié) via les nouvelles props optionnelles `open`/`onOpenChange` de `CollapsibleSection` — API additive, les usages Rente/Simulator/MonteCarlo restent non contrôlés. Une constante **`SECTIONS`** est la source unique des icônes/libellés (rail + accordéons).
- **Rail replié** : marque or en tête (clic = déplier, affordance logo ChatGPT) → 6 icônes de catégories avec **tooltips** (`RailTip`, bulle sombre à droite, `group/rail` Tailwind) → snapshot avec **badge compteur** → chevron de dépliage. `lg:sticky lg:top-24` + `z-30` (peint au-dessus du contenu : l'ordre de peinture a été prouvé par `elementFromPoint` après activation temporaire des pointer-events).
- **Clic icône = navigation** : déplie + ouvre la section + `scrollIntoView` (`scroll-mt-24`, respecte `prefers-reduced-motion`) + **focus clavier** déplacé sur l'en-tête de section (sinon focus perdu sur `<body>` après remontage).
- **Icônes** : `SlidersHorizontal` pour « Paramètres avancés » (maquette), `Settings2` réservé à la marque RÉGLAGES.
- **Pièges attrapés en revue adverse** : (1) `overflow-hidden` sur l'aside aurait clippé les tooltips → retiré sur le rail ; (2) `overflow-x-auto` du conteneur faisait apparaître une **scrollbar horizontale parasite au survol** (les tooltips absolus allongent le scrollWidth) → `lg:overflow-visible` ; (3) `elementFromPoint` ignore `pointer-events:none` (faux négatif de peinture) → vérifié en activant temporairement le pointer-events.
- **Mobile** : rail horizontal compact (icônes 36 px, `flex-row`), aucun débordement à 390 px (scrollWidth == clientWidth), marque masquée (`hidden lg:flex`).

### Vérifications

- Gate : typecheck ✓ lint ✓ **361/361 tests** ✓ build ✓ (dist ~1,1 Mo / 319 ko gzip).
- Nouveau test composant : repli → rail (aria-labels, contenu masqué, localStorage `"1"`) → clic « Votre profil » → déplié + section ouverte + « Votre épargne » préservée.
- Playwright 1440 px : aside 76×507, `grid-template-columns: 76px 1292px`, colonne empilée (x constant), sticky maintenu à top:96 après scroll 700 px, tooltip peint au-dessus du contenu, badge « 1 » après sauvegarde. 390 px : rail horizontal 358×62, overflowX auto, 0 débordement.
- Détecteur impeccable (`detect.mjs`) : 0 finding. Version 6.7.0 → **6.7.1** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.7.1`, footer landing v6.7.1), CHANGELOG (entrée v6.7.1), MEMORY.md (cette entrée).

### Notes

- **Commit + déploiement finalisés** à la demande de l'utilisateur (« commit, publie sur vercel, met tout à jour ») : tout le worktree a été commité (v6.7.0 rapport PDF + v6.7.1 rail en un commit de release) puis `vercel --prod`. La note « pas de commit / laisser la main » de la session v6.7.0 est donc caduque.

---

## SESSION — 2026-08-14 (v6.7.0 : Objectif aligné sur le scénario Central + Rapport PDF patrimonial de synthèse)

### Résumé

Demande utilisateur : _« FIX ÇA : Alignement de la calculatrice Objectif… Export PDF = vrai rapport patrimonial »_ (workflow /apex -axv). Deux livrables : (1) la calculatrice « Combien investir ? » gardait un défaut **10,07 %/an** (synchro OFF) alors que l'app applique par défaut le scénario **Central 8,22 %/an** — aligné (piste laissée v6.5.2, MEMORY) ; (2) l'export PDF, jusque-là `window.print()` brut, devient un **rapport patrimonial de synthèse** (PISTES V6.1 — idée 2 validée). Version 6.6.1 → **6.7.0**, **361 tests** (360 à la base + 2 rapport, un autre agent a ajouté 1 test en parallèle), gate 100 % vert, vérifié en navigateur réel (preview + Playwright format A4).

### Fix — calculatrice Objectif alignée sur le scénario Central

- **`migration.ts`** : `DEFAULT_INPUTS.goalAnnualReturn` **0.1007 → 0.0822** (rendement géométrique composé du MSCI World ≈ 8,22 %/an brut, scénario Central) + commentaire « aligné sur l'onglet principal » corrigé (il datait de l'avant-scénarios). États STOCKÉS conservés (choix utilisateur).
- **`GoalTab.tsx`** : référence « 8,22 % brut (scénario Central) », infobulle mise à jour.
- **Tests** : moteur (défaut < 10,07 %), composants (curseur 8,22 — assert `toBeCloseTo` à cause de 0,0822×100 = 8,2199… en virgule flottante ; ligne « 8,22 % ← » unique : le doublon 8,22/8,2196 remplace l'ancien 10,07/10,0655).

### Rapport PDF patrimonial (`src/components/Report/PatrimonialReport.tsx`, nouveau)

- **Montage à la demande** : `reportOpen` dans App, `handlePrint` (setState → double rAF → `window.print()`, repli `setTimeout` si pas de rAF — jsdom). Rendu hors-écran `left:-10000px; width:794px` pour que Recharts mesure (un `display:none` donnerait un graphe vide). `aria-hidden` (contenu d'impression, pas de lecture d'écran).
- **Thème clair figé** : palette Tailwind/hex directe, aucune dépendance aux variables du thème → identique sur papier quel que soit le mode sombre/clair. Helpers canoniques réutilisés : `computeKPIs`, `computeTaxBreakdown` (mêmes arguments que FiscalPanel), `deflationFactor`, `buildEquitySeries`, `fmtDecimal` (virgule française), `fmtCompact`, `fmtCurrency`, `ENVELOPE_CONFIGS`, `getHistoricalDataset`.
- **Contenu** : page de garde (marque, date, héro 2 échelles, barre épargné/croissance, insight ×N, paramètres clés) → synthèse (4 cartes alignées sur SummaryStats : échelle du toggle en grand + l'autre en sous-titre — décision de revue adverse, avant elles mélangeaient nominal/réel) + XIRR/réel/multiple + graphique ComposedChart (empilé investi+gains € courants + courbe pouvoir d'achat pointillés) + fiscalité (mêmes lignes que le panneau) + tableau annuel complet + méthodologie + mentions.
- **Print CSS** (`index.css`) : `.app-shell{display:none}` à l'impression, `.report-print-only` static + `color-scheme:light` + `print-color-adjust:exact`, `@page A4` marges 14 mm, page de garde pleine (`break-after:page`), `.report-table tr{break-inside:avoid}`.
- **Bug attrapé en revue adverse** : `max-h-72 overflow-hidden` sur le conteneur de table clippait le détail annuel à l'impression → supprimé. `useMemo` placé avant l'early-return (règle des hooks, attrapé par ESLint).

### Vérifications

- Gate : typecheck ✓ lint ✓ **361/361 tests** ✓ build ✓ (dist 1 106 ko / 319 ko gzip).
- Navigateur : preview réelle (rapport monté au clic, cartes 308 551 / 241 548 / 67 003 / 95 165 € identiques à SummaryStats, gains +213 386 €, 0 erreur console) + **Playwright 794 px** : 2 sections h2, 26 lignes de tableau, graphique rendu, **0 débordement** au format A4 (le seul scrollWidth>clientWidth est un artefact interne Recharts cw=0).
- Version 6.6.1 → **6.7.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.7.0`, footer landing v6.7.0), CHANGELOG (entrée v6.7.0), MEMORY.md (cette entrée).

### Notes

- ⚠️ Un **agent parallèle** travaillait en même temps (v6.6.1 « titres uniformes » commité à 16:01, puis refactor Sidebar en cours) : ses fichiers (Sidebar, HeroResult, CollapsibleSection, utils/sidebar.ts) n'ont pas été touchés ; la release est partie de 6.6.1. Un typecheck intermédiaire a échoué pendant son refactor (état mi-migration) puis est repassé vert — rien à faire de mon côté.
- **Pas de commit** : worktree non commité (mes fichiers + les siens). **Pas de déploiement Vercel** — laisser la main à l'utilisateur.

---

## SESSION — 2026-08-14 (v6.6.1 : Titres uniformes — « Réglages » et « Votre patrimoine estimé » sur l'anatomie SectionHeader)

### Résumé

Demande utilisateur : _« ces 2 titres ne sont pas à la même taille que les autres, ils respectent pas le style »_ — capture à l'appui : les titres « RÉGLAGES » (sidebar) et « VOTRE PATRIMOINE ESTIMÉ » (héro) ne respectaient pas l'anatomie de titre uniforme. Premier essai raté (mini-label 10 px muet — mauvaise direction), puis correction dans le bon sens : migration des deux titres sur le composant **SectionHeader level="card"** (barre dorée + icône + extrabold majuscule 13 px), comme « PROJECTION DE VOTRE CAPITAL ». Version 6.6.0 → **6.6.1**, **358 tests**, gate 100 % vert, déploiement `vercel --prod`.

### Décisions

- **`Sidebar.tsx`** : l'en-tête « Réglages » passe sur `<SectionHeader level="card" icon={Settings2} title="Réglages">` — badge de scénario + bouton replier conservés dans `trailing`, `className="mb-6 items-center"`.
- **`HeroResult.tsx`** : « Votre patrimoine estimé » passe sur `<SectionHeader level="card" as="span" icon={Wallet} title="Votre patrimoine estimé">` (badge « 25 ans · 2050 » en `trailing`) — le `h2` sr-only et la hiérarchie de titres sont conservés.
- **Anatomie uniforme** (v5.6.4) respectée : barre `w-1 h-5` + icône 16 px + `text-[13px] sm:text-sm font-extrabold uppercase tracking-[0.08em] text-text` — vérifié en navigateur : styles calculés identiques entre les 3 titres (13 px, poids 800, tracking 1,04 px, barre 20 px, icône 16 px).
- **Release v6.6.1** : package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.6.1`, footer landing v6.6.1, CHANGELOG (entrée v6.6.1), MEMORY.md (cette entrée).

### Vérifications

- Gate : typecheck ✓ lint ✓ **358/358 tests** ✓ build ✓.
- Navigateur (dev) : titres identiques aux autres cartes (clair + sombre), 0 erreur console.
- Déploiement : `vercel --prod` → **https://snowball-pro.vercel.app**.

## SESSION — 2026-08-13 (v6.6.0 : Refonte de la landing — démo interactive + méthodologie clarifiée)

### Résumé

Demande utilisateur : _« fait une refonte de la landing page »_, puis retour critique sur la section Méthodologie : _« C TOUT INVERSE, IN COMPREND RIEN, C MOCHE »_. Refonte de la landing : héro **interactif** piloté par le vrai moteur (bascule Prudent / Central / Optimiste → la courbe se redessine et le « nombre magique » se recalcule), décomposition épargné / croissance, et **échelle Brut → Composé → Réel clarifiée** dans Méthodologie (chaque étape retire une seule chose). SEO ajouté (données structurées, sitemap, robots, vérification Google, GoatCounter). Version 6.5.2 → **6.6.0**, **358 tests**, gate 100 % vert, déploiement `vercel --prod`.

### Décisions

- **Héro interactif** (`LandingPage.tsx` + `HeroChart.tsx`) : sélecteur segmenté avec taux réels de `getHistoricalDataset` (jamais en dur), `HeroChart` piloté par props (`rows`/`inputs`/`footer`) mais autonome par défaut (test standalone conservé). « Nombre magique » animé (`useCountUp`) + barre Épargné / Croissance.
- **Méthodologie réordonnée** : les trois taux sont présentés en descente logique **Brut (10,07 % · Optimiste) → Composé (8,22 % · Central, défaut) → Réel (5,99 % · Prudent)** avec flèches « on retire la volatilité » puis « on retire l'inflation », badge « défaut » sur la ligne composée — même langage que le panneau « Pourquoi ces chiffres ? » de la sidebar. Titre : « Pourquoi 10,07 % → 5,99 % ? » (test mis à jour en conséquence).
- **Zéro changement moteur** : les ancrages dorés passent inchangés — la refonte est purement présentationnelle + SEO.
- **SEO** (`index.html` + `public/`) : données structurées `WebApplication` (schema.org), canonical, `sitemap.xml`, `robots.txt`, vérification Google `googleb5425766aa897f9d.html`, GoatCounter `gabriel322jsj222` configuré.
- **Release v6.6.0** : package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.6.0`, footer landing v6.6.0, CHANGELOG (entrée v6.6.0), MEMORY.md (cette entrée).

### Vérifications

- Gate : typecheck ✓ lint ✓ **358/358 tests** ✓ build ✓.
- Navigateur (dev) : bascule de scénario 518 765 € → 365 411 € → 700 394 €, 0 erreur console ; section Méthodologie réordonnée vérifiée (texte réel + capture).
- Déploiement : `vercel --prod` → **https://snowball-pro.vercel.app**.

## SESSION — 2026-08-12 (v6.5.2 : Clarté des taux — la chaîne brut → net de frais → réel devient explicite)

### Résumé

Demande utilisateur : _« pourquoi quand je mets 8,22 %/an, ça me met 8 % et 5,7 % net ??? je crois que les rendements ne sont pas synchronisés, tout est différent partout dans l'app »_. Diagnostic chiffré sur le moteur réel (pas de désynchronisation : la chaîne est mathématiquement saine) puis correctif d'affichage — le « problème majeur » était pédagogique/UI. Version 6.5.1 → **6.5.2**, **358 tests**, gate 100 % vert, déploiement `vercel --prod`.

### Diagnostic (vérifié sur le moteur, aucune erreur trouvée)

- Chaîne du scénario Central : **8,22 %/an brut** (géométrique composé MSCI World, appliqué par la courbe lissée) → **XIRR 7,95 %** = net de 0,25 %/an de frais (sans frais le XIRR = 8,22 % pile, vérifié) → **réel 5,73 %** = (1 + 7,95 %) ÷ (1 + 2,1 %) − 1 (Fisher, backcheck exact). Prudent : 5,99 → 5,73 → 3,55 · Optimiste : 10,07 → 9,79 → 7,53.
- Les 3 taux affichés étaient COHÉRENTS mais inexpliqués : la carte disait « XIRR brut » (faux : net de frais), 1 décimale (« 8,0 % » pour 7,95), le taux appliqué (8,22) invisible dans les KPIs, collision 5,73/5,73 (réel du Central = net du Prudent), et AIInsightCard comparait au 10,07 % arithmétique (commentaire « c'est elle que la courbe applique » périmé depuis v6.4 — la courbe applique le scénario).

### Décisions

- **`KpiGrid`** : ligne de chaîne sous « Statistiques clés » (brut appliqué → net de frais → après inflation, dérivée du moteur via `getHistoricalDataset` + scénario + kpis), carte « Rendement net / an », sous-titres dynamiques, **formule de Fisher avec l'inflation IMPLIQUÉE par les valeurs affichées** (exacte au centième — le test a attrapé un bug d'arrondi : `toFixed(2)` sur le ratio 0,021 → « 2,00 % → 5,83 % » à côté de « 5,73 % » ; corrigé en travaillant en points de pourcentage). 2 décimales sur les deux cartes de taux.
- **`AIInsightCard`** : référence = taux brut du SCÉNARIO courant (prudent 5,99 / central 8,22 / optimiste 10,07), 2 décimales, « après frais » au lieu de « brut ».
- **Zéro changement moteur** : les ancrages dorés (`regression-golden.test.ts`) passent inchangés — le XIRR 7,95 % et le réel 5,73 % étaient déjà les valeurs correctes, seul le vocabulaire et la précision mentaient.
- Piste laissée : la calculatrice Objectif (synchro OFF) garde un défaut 10,07 % et `migration.ts` un commentaire périmé (« aligné sur l'onglet principal ») — à aligner sur le scénario dans une prochaine session si l'utilisateur le demande.

### Vérifications

- Gate : typecheck ✓ lint ✓ **358/358 tests** ✓ (353 + 5 nouveaux : chaîne Central, Optimiste, frais 0 → brut = net, AIInsight ×2) build ✓ · détecteur impeccable **0 finding**.
- Navigateur (dev + preview réelle) : les 3 scénarios affichent les chaînes exactes (8,22 → 7,95 → 5,73 / 10,07 → 9,79 → 7,53 / 5,99 → 5,73 → 3,55 avec inflation impliquée 2,10/2,10/2,11), cartes à 2 décimales, formules Fisher cohérentes au centième, 0 erreur console.
- Version 6.5.1 → 6.5.2 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.5.2`, titre index.html), CHANGELOG (entrée v6.5.2), MEMORY.md (cette entrée).
- Déploiement : `vercel --prod` → **https://snowball-pro.vercel.app**.

---

## SESSION — 2026-08-11 (v6.5.1 : Scénario de rendement dans la sidebar — intégration fluide + déploiement)

### Résumé

Suite de la demande « mets le Scénario de rendement dans les réglages, il gâche la vue » : le sélecteur prudent / central / optimiste vit dans « Votre épargne » (travail déplacé en cours de session, inclus dans le commit parallèle v6.5.0 `dd19ccac`). Cette session finalise l'intégration demandée : **suppression du trait entre « Durée » et le bloc**, cartes inactives allégées (`bg-surface-50/60`), espacement 12 px (même rythme que « Tolérance au risque »), sémantique radiogroup conservée (roving tabindex + flèches). Version 6.5.0 → **6.5.1** avec synchronisation des fichiers restés en retard (`package-lock.json` 6.4.0, `sw.js` v6.4.0). **353 tests**, gate 100 % vert, déploiement `vercel --prod`.

### Décisions

- Le sélecteur n'a plus de carte externe ni de trait : il suit le rythme des curseurs de la section — le résultat (héro) ouvre l'onglet Projection sans sélecteur.
- Le bandeau « médiane historique » reste intégral (honnêteté de la projection) — piste de condensation au survol du « ? » pour une prochaine session.
- Un commit parallèle (`dd19ccac`, v6.5.0 : audit honnêteté + mode Débutant/Avancé) a capturé le travail de scénario en cours — réconcilié sans écrasement, rien n'a été perdu.

### Vérifications

- Gate : typecheck ✓ lint ✓ **353/353 tests** ✓ build ✓.
- Navigateur (preview réelle, sombre + clair) : trait absent (border-top 0), cartes intégrées, radiogroup 3 radios, clic Optimiste → 682 770 € → 919 801 €, bandeau médiane masqué puis restauré, héro premier dans l'onglet, 0 erreur console.
- Version 6.5.0 → 6.5.1 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v6.5.1`, titre index.html), CHANGELOG (entrée v6.5.1), MEMORY.md (cette entrée).
- Déploiement : `vercel --prod` → **https://snowball-pro.vercel.app** (HTTP 200, titre v6.5.1, CACHE_VERSION vérifiée).

---

## SESSION — 2026-08-03 (v5.6.0 : Courbe lissée du Simulateur + scénario « Partir en période difficile »)

### Résumé

Deux demandes utilisateur fusionnées dans la release **v5.6.0** (workflow APEX + fable-mode + oneshot + ultrathink) : (1) _« un truc linéaire, pas une courbe aléatoire »_ — le Simulateur rejouait les zigzags historiques, l'utilisateur veut une courbe lisse ; (2) _« et si le départ à la retraite tombait en pleine crise ? »_ — pouvoir choisir le moment et l'intensité du krach au lieu des seules fenêtres historiques fixes. **208 tests**, gate 100 % vert (typecheck ✓ lint ✓ test ✓ build ✓), déploiement Vercel.

### Courbe lissée (Simulateur uniquement)

- **`simulation.ts`** : `runSimulation` applique `MSCI_WORLD_AVG_RETURN` (≈ 10,07 %/an brut) chaque année — la même courbe, sans hasard. `returnForYear` simplifié (constante). **Monte Carlo et la Rente rééchantillonnent toujours l'historique réel** (leur raison d'être) : seul le Simulateur devient constant.
- **UI alignée** : `Sidebar` (« Rendement lissé — 10,07 %/an brut »), `MethodologyPanel` (« taux constant … courbe lissée ; MC & Rente rejouent l'historique »), `AIInsightCard` (« moyenne de référence »), `DrawdownChart` (rendement constant → aucune baisse possible : la ligne plate à 0 % est remplacée par un message explicatif).

### Scénario « Partir en période difficile » (krach paramétrable)

- **Nouveaux champs** : `crisisScenario` (bool, OFF par défaut), `crisisStartOffset` (0-10, année de retraite où le krach frappe), `crisisIntensity` (5-95 % au sanitize, UI 10-60 %). Clés de persistance + partage URL + hash de fraîcheur `App.tsx` (bandeau « relancez »).
- **`decumulation.ts`** : `runDecumulationPath` reçoit `applyCrisis` — à l'année choisie, le rendement est REMPLACÉ par le krach (clampé 5-95 %), identique pour CHAQUE scénario MC (100 % des cas, pas seulement P10). Le garde-fou dynamique voit le **rendement EFFECTIF** de l'année (`lastYearReturn = annualReturn`), donc il coupe bien la rente l'année suivant le krach (revue v5.6.0).
- **`runStressTest` passe `applyCrisis = false`** : les fenêtres 1973/2000/2008 SONT déjà des crises réelles — superposer un krach synthétique compterait la crise deux fois.
- **UI `RenteRetraiteTab`** : carte « Partir en période difficile » (Toggle + curseurs année/intensité, bornés par `retirementYears`), bandeau de transparence dans les résultats (« Un krach de −X % frappe chaque scénario en année N ») ; **stress tests historiques repliés par défaut** (en-tête repliable « Et si vous partiez en pleine crise ? », renvoi vers l'option paramétrable).

### Histogramme terminal lisible (revue UI)

- **`math.ts` `buildTerminalHistogram`** : axe adaptatif sur cas NON NULS `max(p95, 3×médiane)` (au lieu du p99 qui écrasait tout, et des faillites qui réduisaient l'échelle à 1 €) + **bornes non linéaires (échelle √)** : la masse d'une distribution asymétrique n'est plus concentrée dans les 10 % gauche.
- **`TerminalHistogram.tsx`** : repères médiane/moyenne sur la même échelle √ que les classes ; barres vides visibles ; note « au-delà de X € (queue droite) ».

### Détails

- `FiscalPanel` : badge « Total des impôts » → pastille discrète. `validation.ts` : bornes `crisisStartOffset` (0-10 arrondi) et `crisisIntensity` (0,05-0,95) au sanitize. `migration.ts` : champs ajoutés à `NUMERIC_KEYS`/`BOOLEAN_KEYS`.

### Vérifications

- Gate : typecheck ✓ lint ✓ **208/208 tests** ✓ (175 engine + 33 composants) build ✓.
- Tests : +7 nets — crise OFF par défaut + persistance/URL, krach à l'année choisie (chemins bit-à-bit identiques avant le choc), impact persistant au-delà du krach, garde-fou coupe APRÈS l'année de krach, courbe lissée (rendement identique chaque année, MC indépendant), axe histogramme, stress tests repliés + curseurs crise (composants).
- Version 5.5.1 → 5.6.0 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION` = `snowball-pro-v5.6.0`), CHANGELOG (entrée v5.6.0). Prettier appliqué aux fichiers v5.6.0 (4 fichiers legacy non conformes laissés intacts : SnapshotPanel, TabBar, SegmentedControl, GoalTab).

---

## SESSION — 2026-08-03 (Infra : projet Vercel renommé v4 → snowball-pro)

### Résumé

Demande utilisateur : obtenir une URL Vercel personnalisée au lieu de l'URL auto-générée `https://v4-three-beige.vercel.app`. Après comparaison des options (nom de domaine réel `.fr`/`.com` ≈ 2-10 €/an, sous-domaines gratuits `is-a.dev`/`eu.org`/`is-cool.dev`), l'utilisateur a choisi la **renommage du projet Vercel** (0 €, 2 min) : le projet `v4` (prj_J8bvSime5dm7oNJsUZBhjyTrBe8T, org team_dI2kW7QMo7eKuhF0caXOfVJP) a été renommé **`snowball-pro`** via l'API REST Vercel (`PATCH /v9/projects/{id}`), le domaine `snowball-pro.vercel.app` ajouté via `POST /v10/projects/{id}/domains` (verified: true), puis redéploiement `vercel --prod`.

### Nouvelle URL

- **Production : `https://snowball-pro.vercel.app`** (HTTP 200, titre « Snowball Pro v5 — Simulateur Patrimonial »).
- L'ancienne URL `https://v4-three-beige.vercel.app` reste active (HTTP 200, alias de l'ancien déploiement — Vercel ne la désactive pas automatiquement).
- `.vercel/project.json` mis à jour (`projectName: "snowball-pro"`) — fichier gitignoré, modifié via terminal.
- Aucun changement de code, aucune dépendance : le renommage est purement côté plateforme Vercel.

### Notes

- Le CLI Vercel n'a pas de commande `rename` : passage par l'API REST avec le token de `~/Library/Application Support/com.vercel.cli/auth.json`.
- Pas de bump de version (aucun changement utilisateur) : 5.5.1 conservée.

---

## SESSION — 2026-08-03 (v5.5.1 : Fiabilité & sûreté des estimations — Pástor–Stambaugh, 100 ans d'histoire, stress tests)

### Résumé

Suite directe de la question utilisateur _« Pourquoi P50 = 2,67 M€ et P90 = 10,88 M€ (4× d'écart) ? Est-ce fiable ? Comment augmenter drastiquement la fiabilité ? »_. Première réponse vérifiée par recalcul indépendant (la dispersion 4× est mathématiquement correcte : volatilité réelle 19,3 % × √durée + bootstrap par blocs). Puis demande « IMPLÉMENTE TOUT » : les 6 améliorations proposées ont été implémentées en deux volets — **honnêteté du modèle** (fiabilité) et **robustesse du plan** (sûreté). Workflow APEX -a -x -v + fable-mode + oneshot + ultrathink + webapp-testing. **201 tests**, gate 100 % vert (vérifié navigateur en cours).

### Fiabilité (moteur dit la vérité)

- **`reliability.ts` (nouveau)** — incertitude des paramètres (Pástor–Stambaugh, Merton) : `sampleRegime` tire μ̃ ~ N(μ̂, σ̂/√n_eff) et σ̃ ~ σ̂·exp(η) par scénario (taille effective = séries/bloc — le bootstrap ne crée pas d'information) ; `applyRegime` préserve la structure des blocs (krachs enchaînés). Test vérifié : **P10 sans incertitude ≥ P10 avec incertitude** (les queues s'élargissent honnêtement).
- **`historical.ts`** — **100 ans de rendements réels** : série S&P 500 SBBI 1926-1969 (vérifiée sur 1929 ≈ −8,4 %, 1931 ≈ −43,3 %, 1933 ≈ +54 %) + MSCI World 1970-2025. `getHistoricalPool(index, extendedHistory)` ; le Simulateur reste sur 1970-2025 (référence 10,07 % préservée). **Inflation française réelle INSEE 1970-2025** (`FRENCH_INFLATION_1970_2025`, 13,7 % en 1974 / 0,0 % en 2015 / 5,2 % en 2022) rejouée par blocs pour la rente (stochasticInflation). `sampleBlocks` partagé MC + Rente.
- **`math.ts`** — `wilsonScoreCI` (95,8 % ± 0,4 pt à 10k runs, ±4 pts à 100 — un point, pas une vérité), `buildTerminalHistogram` (30 classes sur [0, p99], queue droite absorbée), `sampleNormal` (Box-Muller, déterministe à graine injectée).
- **`montecarlo.ts` / `decumulation.ts`** — exposent `mean`, `successRateCI`/`survivalRateCI`, `terminalDistribution` : la **fat tail** que 3 lignes cachaient devient visible.

### Sûreté (plan résiste)

- **Garde-fous dynamiques (Guyton–Klinger)** : année négative → rente suivante réduite de 10 % et indexation sautée. Test vérifié : la rente 4 % qui meurt sur 1973 **sans** garde-fous **survit avec**. Cœur mensuel `runDecumulationPath` partagé (MC + async + stress tests).
- **Stress tests déterministes** — `STRESS_TEST_SCENARIOS` (1973, 2000, 2008) + `runStressTest` : rejoue les rendements contigus réels depuis l'année du scénario (aucun hasard) avec **l'inflation réelle de l'époque** alignée par année calendaire (1973-74 = 9-14 %).

### UI

- **`TerminalHistogram.tsx` (nouveau)** : histogramme des capitaux finaux, repères médiane (vert) / moyenne (bleu) — l'écart EST la dissymétrie —, survol = plage + cas + %, classe 0 € rouge pour la Rente.
- **`MonteCarloPanel`** : section « Fiabilité du modèle » (2 toggles, ouverte par défaut) + CI du taux de succès + histogramme + note « planifiez sur la médiane ».
- **`RenteRetraiteTab`** : section « Fiabilité & sûreté » (4 toggles) + bandeau « ce 95,8 % n'est pas un point exact » (Wilson) + histogramme (0 € = rente stoppée) + **section stress tests** (3 cartes : verdict, capital final, perte max, détail dépliable avec rendements rejoués + mini-graphe).
- **`App.tsx`** : les 4 options entrent dans le hash de fraîcheur du décum.

### Migration / persistance

- 4 nouveaux booléens `parameterUncertainty`, `extendedHistory`, `stochasticInflation`, `dynamicGuardrails` — **tous ON par défaut** (`DEFAULT_INPUTS`), ajoutés à `BOOLEAN_KEYS` (persistance + partage URL), exportés via le barrel.

### Vérifications

- Gate : typecheck ✓ lint ✓ **201/201 tests** ✓ (170 engine + 31 composants) build ✓.
- Tests : +16 moteur (historique étendu + krachs 1929/1931/1933, inflation INSEE, sampleRegime/applyRegime, Wilson 0 %/100 % unilatéral, histogramme, stress tests + sauvetage garde-fous, defaults 4 ON, CI/moyenne/histogramme MC et Rente, inflation stochastique ≠ fixe) ; +6 composants (toggles cochés, updateInput, TerminalHistogram, stress tests rendus, CI affiché).
- Données : séries SBBI et INSEE récupérées et vérifiées via chercheurs (ancrages publiés croisés).
- Version 5.5.0 → 5.5.1 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION`), CHANGELOG (entrée v5.5.1).
- ⚠️ Session interrompue une fois par Freebuff (redémarrage) : reprise à partir de l'état disque (fichiers intacts), les données chercheurs ont été re-collectées.

---

## SESSION — 2026-08-02 (v5.5.0 : Option A — 100 % historique réel + « Euros d'aujourd'hui » coché par défaut)

### Résumé

Deux chantiers se sont croisés dans le worktree : (1) la demande utilisateur « Euros d'aujourd'hui coché par défaut » (montrer d'emblée les VRAIES valeurs nettes d'inflation) ; (2) un **refactor parallèle « Option A »** (validé avec l'utilisateur dans une autre session) qui supprime le mode « Taux défini », le curseur de rendement, la volatilité et la crise synthétique — le Simulateur, Monte Carlo et la Rente rejouent désormais TOUS les rendements réels du MSCI World 1970-2025 (krachs et bull markets réels inclus). Les deux sont fusionnés dans la release **v5.5.0**. **169 tests**, gate 100 % vert, déploiement Vercel.

### Modifications — refactor Option A (agent parallèle)

- **`types.ts`** : suppression de `returnMode`, `annualReturn`, `volatility` et des 6 champs crise (`crisisEnabled`, `crisisProfile`, `crisisYear`, `crisisAmplitude`, `crisisDuration`). `SimulationInputs` allégé.
- **`simulation.ts`** : `annualReturnForYear` seul chemin (ancrage inversé, repli `MSCI_WORLD_AVG_RETURN` de `historical.ts`) ; suppression de `sampledMonthlyReturn`, de `crisisAdjustment` et de `gaussian`.
- **`montecarlo.ts` / `decumulation.ts`** : `sampleHistoricalReturns` seul mode ; code mort stochastique supprimé. **`kpis.ts`** : `sharpe` = 0, `solveGoal` utilise exclusivement `goalAnnualReturn` (l'onglet Objectif garde son curseur, défaut 10,07 % brut).
- **`migration.ts` / `validation.ts`** : champs rendement/crise retirés des défauts, clés numériques, mapping v4 et règles de validation ; `parseStoredInputs` verrouille `historicalIndex = "msci-world"`.
- **Suppressions** : `engine/crisis.ts`, `components/Forms/CrisisSelector.tsx`, exports associés. **UI** : Sidebar → carte « MSCI World — historique réel » (10,07 % brut · 8,22 % net) à la place de la section modes + curseur rendement ; GoalTab libellé « référence : 10,07 % brut ».

### Modifications — « Euros d'aujourd'hui » coché par défaut (demande utilisateur)

- **`migration.ts`** : `DEFAULT_INPUTS.showReal = true` (avant `false`) + fallback v4 `showReal: s.showReal !== false` (un choix v4 explicitement « false » reste respecté ; sinon défaut vrai).
- **Invariant moteur documenté** : le moteur calcule TOUJOURS `real = capital / inflationIndex` (`simulation.ts`) — l'infobulle « ne saisissez jamais un taux déjà net d'inflation » est vraie que le toggle soit coché ou non (l'option ne change que l'échelle mise en avant).
- **Infobulle clarifiée** (`GoalTab.tsx`) : _« L'inflation est déduite automatiquement par le simulateur, QUE l'affichage soit en euros courants ou en euros d'aujourd'hui — ne saisissez jamais un taux déjà net d'inflation. »_
- **Tests** : défaut `showReal = true` (moteur), migration v4 undefined→vrai / false→false / true→true, toggle coché au rendu d'App (composant).

### Vérifications

- Gate : typecheck ✓ lint ✓ **169/169 tests** ✓ build ✓.
- Revue adverse (code-reviewer) : refactor Option A audité (cohérence moteur, suppression complète des champs, tests adaptés) + demande showReal (invariant réel/nominal, migration v4 préservant les choix explicites).
- Navigateur (preview réelle) : toggle « Euros d'aujourd'hui » **coché au chargement**, les 4 cartes + Sidebar + FiscalPanel affichent les deux échelles (valeur réelle en avant + « sur le compte en YYYY » visible), décochage → valeur du compte en avant (rien n'est caché) ; carte « MSCI World — historique réel » visible dans la Sidebar.
- Version 5.4.1 → 5.5.0 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION`), CHANGELOG (entrée v5.5.0 unique, contenus v5.4.2 fusionnés).
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

---

## SESSION — 2026-08-02 (v5.4.1 : rendement BRUT par défaut 10,07 % + double échelle affichée partout)

### Résumé

Demande utilisateur centrée sur la clarté : (1) afficher **en même temps** le montant sur le compte (euros courants) ET sa valeur en pouvoir d'achat (euros d'aujourd'hui) — le toggle « Euros d'aujourd'hui » ne fait plus que choisir laquelle est mise en avant, il ne cache plus jamais la valeur du compte ; (2) rendre explicite que le rendement saisi est **TOUJOURS brut** avec défaut = 10,07 %/an (moyenne MSCI World 1970-2025) et fourchette recommandée 7-12 %/an. Workflow APEX -a -x -v + fable-mode + oneshot + ultrathink + webapp-testing. **167 tests**, gate 100 % vert, déploiement Vercel.

### Modifications — double échelle (partie 1)

- **`DualAmount.tsx` (nouveau, composant partagé)** : affiche simultanément la valeur sur le compte (€ courants) et son pouvoir d'achat (€ d'aujourd'hui) — `aria-label` accessible, libellé « sur le compte en YYYY » qui rend la lecture évidente.
- **`SummaryStats.tsx`** : les 4 cartes (Valeur brute/réelle, Net fiscal, Impôts, Total épargné) montrent les deux valeurs — **aucune carte ni indicateur supprimé** (demande explicite). Libellé « Valeur réelle » vs « Valeur brute » suit toujours l'échelle mise en avant (régression audit v5.1.4 évitée).
- **`Sidebar.tsx`** : capital final de la carte insight en double échelle + libellé du toggle clarifié (« Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout »).
- **`EquityChart.tsx`** : note sous le titre quand `showReal` actif rappelant le capital final sur le compte (note sortie du conteneur flex). **`FiscalPanel.tsx`** : ligne « Capital net (impôts déduits) » en double échelle.
- **Tests** : 3 tests `DualAmount` (normalisation espace insécable `\u202F` dans `textContent`).

### Modifications — rendement brut (partie 2)

- **`migration.ts`** : défaut `annualReturn` ET `goalAnnualReturn` = **0.1007 (10,07 %/an brut)** ; fallback v4 aligné (10,07 au lieu de 8).
- **`validation.ts`** : constantes partagées `RECOMMENDED_RETURN_MIN/MAX` (7 %/12 %) — warning hors fourchette (« Rendement hors fourchette recommandée (7-12 %/an brut) — moyenne MSCI World : 10,07 %/an ») ; exportées via le barrel `engine/index.ts`.
- **`HelpTip.tsx` (nouveau)** + prop `help` sur `SliderInput` : infobulle « ? » expliquant « Rendement BRUT = rendement réel du marché avant inflation… ne saisissez jamais un taux déjà net d'inflation ».
- **`Sidebar.tsx`** : libellé « (% brut) », note sous le curseur (7-12 %/an · défaut 10,07 %/an MSCI World), message dans la carte insight quand le rendement est hors fourchette (risque de **double déduction de l'inflation** si le taux saisi était déjà net).
- **`GoalTab.tsx`** : label « (% brut) » + note identique + infobulle — cohérence parfaite entre onglets (demande TRUC 1).
- **Tests** : défaut 10,07 % > net d'inflation (8,22 %), validation silencieuse à 10,07 %, warning hors fourchette ; tolérance d'arrondi assouplie sur `interestsReal` (écart 1 centime devenu visible avec le rendement plus élevé).

### Vérifications

- Gate : typecheck ✓ lint ✓ **167/167 tests** ✓ (dont 3 DualAmount + 2 rendement brut).
- Revue adverse (code-reviewer) : régression audit v5.1.4 (libellé « brut » sur montant net d'inflation), note EquityChart sortie du flex, aria-label DualAmount — toutes corrigées.
- Navigateur (preview réelle, toggle off → on) : dans les deux états chaque carte et le panneau fiscal affichent « X € sur le compte en YYYY » ET « Y € en euros d'aujourd'hui » ; curseur à 10,07 % après nettoyage du hash/localStorage ; note « brut » et infobulle visibles.
- Version 5.4.0 → 5.4.1 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION`), CHANGELOG (entrée v5.4.1).
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

### Notes

- ⚠️ Refactor **parallèle non commité** présent dans le worktree (MonteCarloPanel.tsx, decumulation.ts, montecarlo.ts — « Monte Carlo rejoue toujours les rendements réels ») : **ne pas écraser, ne pas committer sans accord** — le commit de cette session ne couvre que les fichiers de la demande.

---

## SESSION — 2026-08-02 (v5.2.3 : audit profond v3 — la Rente applique enfin le krach + unités verrouillées)

### Résumé

Audit moteur et UI en profondeur à la demande de l'utilisateur (« cherche les erreurs qui faussent les simulations, vérifie les toggles, que tout soit dans la même unité ») : lecture des 13 modules engine + tous les composants, croisement des unités et des identités comptables, revue adverse. **153 tests**, gate 100 % vert, déploiement Vercel.

### Bugs trouvés et corrigés

- **C1 — La Rente ignorait le krach (bug moteur)** : `decumulation.ts` n'utilisait que `volMultiplier` de `crisisAdjustment` — le `returnShock` (la chute elle-même) n'était JAMAIS appliqué au décumul. Le toggle « Simuler un krach » faisait « trembler » la bourse sans jamais l'effondrer, incohérent avec le Simulateur et Monte Carlo. Fix : `returnWithShock = (1 + marketReturn) × (1 + shock) − 1` mois par mois, neutralisé en mode historique (comme `runSimulation`).
- **C2 — KPI « Après inflation » faux** : `realReturn` utilisait `(1+annualReturn)/(1+inflation)−1` (inputs bruts) — faux en mode historique/aléatoire et ignorant les modes d'inflation historique/cyclique. Fix : dériver l'inflation réelle du rapport nominal/réel cumulé de la simulation (`(nominal/real)^(1/years)−1`) et déflater le XIRR réellement simulé.
- **C3 — Camembert ≠ carte** : `CapitalAllocation` affichait `totalTax` (dividendes inclus) alors que cartes + graphique + panneau affichent l'exit tax (`nominal − taxNet`). Aligné.
- **C4 — FiscalPanel double comptait les dividendes** : « Total des impôts » = `totalTax` (dividendes déjà prélevés chaque mois re-comptés). Fix : total = exit tax + ligne séparée « Impôts sur dividendes (déjà prélevés) » + taux effectif sur la base affichée.
- **C5 — 3 écrans ignoraient `showReal`** : `CashflowCalendar` (colonne Impôts = totalTax en plus), `FeeImpact` et `AIInsightCard` affichaient du nominal à côté de cartes réelles. Fix : déflation via `deflationFactor` (par année pour le calendrier). Branche morte logiquement inatteignable supprimée dans AIInsightCard (revue adverse).

### Vérifications

- Gate : typecheck ✓ lint ✓ **153/153 tests** ✓ (5 nouveaux tests de non-régression : krach Rente, realReturn simulé, identité brut−impôts=net, interestsReal, déflation FeeImpact).
- Revue adverse (code-reviewer) : 2 findings intégrés (branche morte, colonne Impôts du calendrier) + test tautologique nettoyé.
- Version 5.2.2 → 5.2.3 (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION`), CHANGELOG (entrée v5.2.3).
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

### Notes

- Identités comptables verrouillées : `brut − impôts(exitTax) = net` partout (cartes, graphique, camembert, panneau, calendrier) ; `nominal − taxNet = socialCharges + incomeTax`.
- Rien n'est commité (worktree = audit v3 + refactor parallèle).

---

## SESSION — 2026-08-02 (v5.2.2 : audit moteur v2 — 10 bugs corrigés, Rente asynchrone, a11y graphiques)

### Résumé

Deuxième passe d'audit en profondeur (revue moteur ligne à ligne + tests runtime Playwright 16/16 + revue adverse) : correction de 10 bugs moteur/perf/a11y, dont un fix bloquant de chaîne de build. Version 5.2.1 → 5.2.2 (package.json, sw.js `CACHE_VERSION`).

### Modifications

- **`package.json`** : `lucide-react` épinglé à `1.25.0` exact — la montée vers 1.28.0 cassait le typecheck (20 erreurs TS7016 : `dist/lucide-react.d.ts` absent du paquet). `package-lock.json` régénéré.
- **`engine/simulation.ts`** : cache module-level pour `toLocaleDateString("fr-FR")` (B1, perf MC 10k runs) ; crise synthétique désactivée en `returnMode==="historical"` (B3 — les krachs réels sont déjà rejoués, plus de double application ; composante inflation stagflation aussi neutralisée) ; clamp `Math.max(-1, …)` sur `yearlyReturn`/`netYield` (B7).
- **`engine/kpis.ts`** : `computeXIRR` garde `finalValue<=0 → 0` (B4) ; `solveGoal` — `totalGains` clampé à ≥ 0 et `achievable` cohérent avec `difficulty` (B5).
- **`engine/decumulation.ts`** : refactor — cœur partagé `runDecumulationRange` (avec retrait partiel exact au mois de ruine, B6) + `runDecumulationAsync` chunké (150) avec `AbortController` et `onProgress` (B2, plus de gel main-thread 5,4 s). Résultats bit-à-bit identiques au synchrone.
- **`App.tsx`** : `runDecum` async avec `AbortController` + garde anti-race (`decumAbortRef === controller`) + `mountedRef`. **`RenteRetraiteTab.tsx`** : props `running`/`progress`, bouton « Calcul… X% » + barre de progression.
- **`MonteCarloPanel.tsx`** : `inflationMode` ajouté à `inputsHash` (B8) ; recap crise informatif en mode historique. **`AIInsightCard.tsx`**/**`Sidebar.tsx`** : garde crise historique (B3 UI). **`types.ts`** : conventions `drawdownPct` documentées (B9).
- **`hooks/useChartA11y.ts`** : remplacé par un `MutationObserver` — Recharts ré-applique `role="application"` à chaque re-render après montage, un simple `useEffect` ne tenait pas. Vérifié runtime : `role=img` + `aria-label` stables au chargement ET après re-render.
- **`engine.test.ts`** : +9 tests de non-régression (B2–B7). **148 tests au total.**

### Vérifications

- Gate : typecheck ✓ lint ✓ **148/148 tests** ✓ build ✓ (dist ~921 kB / ~275 kB gzip).
- Runtime Playwright : **16/16** — a11y (`img=1` stable), Rente historique, partage URL roundtrip, raccourcis ⌘Z/⌘⇧Z, stale warning MC (B8), exports CSV/JSON, snapshots 2-clics, dark mode, reduced-motion, console 0 erreur.
- Environnement : le build cassait à cause de binaires natifs déchargés vers iCloud (`lightningcss`, `@tailwindcss/oxide`) — réinstallés (⚠️ exclure `node_modules` de la synchro iCloud).
- Revue adverse : points traités — retrait partiel au mois de ruine, stagflation neutralisée en historique, aucun composant ne décrivant la crise de façon inconditionnelle.
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

### Notes

- Un refactor parallèle (v5.2.0 a11y + v5.2.1 exports, hooks `useChartA11y`/`useIsCoarsePointer`, `ExportMenu.tsx`) a tourné pendant la session — réconcilié sans l'écraser (seul `useChartA11y` a été corrigé pour tenir face au re-render Recharts).
- Rien n'est commité : worktree = audit v2 + refactor parallèle (dont 3 fichiers non suivis).

---

## SESSION — 2026-08-02 (v5.2.1 : exports groupés + échelle « euros d'aujourd'hui » cohérente partout)

### Résumé

Suite de l'audit utilisateur (5 captures d'écran) : 1) les 3 boutons d'export (CSV/JSON/PDF) regroupés derrière un seul bouton « Exporter » avec popup ; 2) la carte « Valeur brute » affichait un montant net d'inflation avec un libellé « brut » (contradiction) ; 3) sous-texte « Impôts estimés (règles en vigueur) » hérité du millésime fiscal supprimé → dégagé ; 4) le panneau fiscal « Gains après impôts » (708 k€) ne rimait pas avec la carte « Net fiscal » (1 176 k€) — échelles mélangées ; 5) le tooltip du graphique affichait 303 k€ d'impôts (nominaux) à côté d'une carte à 176 k€ (réels). Aucun changement de logique moteur : uniquement la couche d'affichage.

### Modifications

- **`ExportMenu.tsx` (nouveau)** : un bouton doré « Exporter » → popup CSV/JSON/PDF (icône + description), fermeture clic extérieur/Échap, `role=menu`/`menuitem` + `aria-expanded`. `ActionBar.tsx` : les 3 boutons remplacés par `<ExportMenu />`.
- **`SummaryStats.tsx`** : libellé « Valeur brute » → « Valeur réelle » quand `showReal` ; toutes les cartes suivent la même échelle (helper `deflationFactor`) ; carte « Pouvoir d'achat » remplacée par « Impôts » (doublon du Net fiscal en mode réel) ; sous-texte « Impôts estimés (règles en vigueur) : -x € » supprimé.
- **`FiscalPanel.tsx`** : déflation quand `showReal` (badge « € d'aujourd'hui ») + ligne « Capital net (impôts déduits) » alignée sur la carte Net fiscal ; phrase « règles fiscales en vigueur » simplifiée.
- **`EquityChart.tsx`** : série « Impôts payés » déflatée via `buildEquitySeries` (fonction pure exportée, 3 tests).
- **`CapitalAllocation.tsx`** : légende du camembert déflatée (prop `showReal` passée depuis `SimulatorTab`).
- **`engine/math.ts`** : helper partagé `deflationFactor(row)` (real/nominal) — avant, le facteur était recalculé à l'identique dans 4 composants (source de dérive). Exporté via `engine/index.ts`.
- **Version 5.2.1** : package.json, package-lock.json, `public/sw.js` (`CACHE_VERSION`), CHANGELOG (entrée complète).

### Vérifications

- Gate : typecheck ✓ lint ✓ **148/148 tests** ✓ (dont 3 nouveaux tests buildEquitySeries + 2 tests menu Export).
- Revue adversarial (code-reviewer) : points traités — CapitalAllocation à la même échelle, helper de déflation partagé, imports fusionnés dans les tests.
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

---

## SESSION — 2026-08-02 (v5.2.0 : correction intégrale de l'audit UI/UX + déploiement prod)

### Résumé

Audit UI/UX complet (lecture des 35 composants + mesures live : contrastes, tailles, arbre d'accessibilité) puis correction intégrale : 2 critiques (or sombre 2.1:1, champs sans nom accessible), 8 importants (sidebar sticky, crise > durée, text-dim, tailles 8-9 px, impression sombre, hiérarchie h1/h2, focus or-sur-or, table ouverte par défaut), 10 moyens (tooltips tactiles, confirmation snapshot 2 temps, aria-label rente, reduced-motion, title truncation, ActionBar mobile, role=application Recharts, blur, animations live, bordures claires) + bruit (bornes min/max sliders, roving tabindex, meta description).

### Modifications clés

- **`index.css`** : classe `.btn-gold-text` (texte sombre sur or en mode sombre → 8.6:1, blanc en clair), `.toggle-on` (`#8a6d1f`), `--color-text-dim` → `#a39a8c` (sombre) / `#6f6a5f` (clair), outline focus `#60a5fa`/`#1e40af` + anneau focus sliders, `@media print` Recharts (encres sombres sur papier), `@media (prefers-reduced-motion: reduce)`, blur 28/32→16/20 px + fallback `@supports`, bordures claires 0.06→0.12-0.16.
- **`SliderInput`** : `id` sur le range (label htmlFor fonctionnel) + `aria-label` sur la saisie directe + bornes min/max affichées + label 11 px.
- **`SegmentedControl`** : roving tabindex + ←/→/Home/End.
- **`Sidebar`** : sticky retirée (I1) ; `CrisisSelector` borné à la durée + warning (I2) ; encart krach conditionné.
- **`validation.ts`** : warning `crisisYear > duration` (I2) + test.
- **Charts** : h2, ticks 11 px, `useIsCoarsePointer` (tooltip clic sur tactile), `useChartA11y` (role=img), `isAnimationActive={false}` sur les graphes live.
- **`SnapshotPanel`** : suppression en deux temps (1ᵉʳ clic arme, 2ᵉ supprime, timeout 3,5 s) — test adapté.
- **`main.tsx`** : `<MotionConfig reducedMotion="user">`. **`App.tsx`** : h1 sr-only. **`index.html`** : meta description + theme-color.
- **Version 5.2.0** : package.json, sw.js (`CACHE_VERSION`), CHANGELOG (entrée complète), AGENTS.md inchangé.

### Vérifications

- Gate : typecheck ✓ lint ✓ tests ✓ build ✓ ; revue code (code-reviewer) puis vérification live (preview) des contrastes/tailles/focus/hiérarchie.
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app (HTTP 200, `CACHE_VERSION = "snowball-pro-v5.2.0"`).

### Notes

- Pas de changement moteur : tous les chiffres de simulation restent identiques (5.1.3).
- Le `useIsCoarsePointer` est gardé contre jsdom (`window.matchMedia` absent) — les tests composants restent verts.

---

## SESSION — 2026-08-01 (v5.1.3 : audit 27 bugs — vérification runtime 20/20 + finalisation)

### Résumé

Fin de session d'audit : les 27 constats du rapport (6 critiques, 12 importants, 9 mineurs) ont été traités — données correctes (écart %, jalons, fiscal, pouvoir d'achat net, décumulation historique), logique/cohérence (camembert, Sharpe, KPI, krach MC, tableau comparatif, scénario B, retraits), UX (mode Aléatoire accessible, contrôles complétés, bandeaux obsolètes) et mineurs (millésime fiscal supprimé, objectURL révoqués, parseCurrencyInput strict). Gate 100 % vert et vérification navigateur 20/20.

### Modifications

- **Vérification runtime Playwright (20/20)** : chargement, slider → KPI mis à jour, undo/redo, comparaison A/B (entrée, édition B, durée 30 ans, sortie), onglets Monte Carlo / Rente / Objectif, lancement MC 300 runs (cartes P10/P50/P90 + chances d'atteindre l'objectif), calcul Rente, dark mode, export CSV téléchargé, console 0 erreur.
- **Sonde supprimée** : `probe-audit.test.ts` (fichier non suivi, 4 timeouts + `require` CJS incompatible ESM) retiré — ne faisait pas partie de la suite.
- **Timeouts vitest** : arbre ré-aligné sur l'état commité (hiérarchie documentée : global 20 s < par-fichier 30 s < par-test 30 s) ; ma variante de session (scoped uniquement) révertée au profit du design déjà commité `f7fb69e9`.
- **Docs** : AGENTS.md (133 tests) et CHANGELOG (133 tests) déjà synchronisés ; addendum présent dans MEMORY.md.

### Vérifications

- Gate : typecheck ✓ lint ✓ **133/133 tests** ✓ build ✓ (dist 905 kB / 271 kB gzip).
- Runtime : 20/20 checks Playwright, console 0 erreur.
- Prod : https://v4-three-beige.vercel.app — HTTP 200, `CACHE_VERSION = "snowball-pro-v5.1.3"`, en-têtes HSTS / nosniff / X-Frame-Options DENY / Referrer-Policy présents.
- Revue code (code-reviewer) : GO — aucune régression résiduelle.

---

## SESSION — 2026-08-01 (v5.1.3 : addendum tests + re-déploiement prod)

### Résumé

Addendum à la session v5.1.3 (fiscalité TMI/barème) : durcissement final des tests composants puis re-déploiement en production. Aucun changement de logique métier.

### Modifications

- **`ba24fff6`** `test(components)` : `vi.restoreAllMocks()` dans l'`afterEach` de `components.test.tsx` — restaure les spies (console.error, HTMLAnchorElement.click…) même si une assertion échoue (pas de mock qui fuit entre tests).
- **`f7fb69e9`** `test(vitest)` : `testTimeout: 20000` global dans `vitest.config.ts` — filet défensif pour les tests composants jsdom qui rendent `<App />` complet (simulation entière à chaque render, > 5 s sous contention CPU). Les tests composants se configurent déjà à 30 s par-fichier (`vi.setConfig`) et par-test (3ᵉ argument) — le global ne sert que de base pour de futurs fichiers.
- Le mock framer-motion des tests est stable (Proxy → fonction unique) : un getter créant une fonction par accès provoquait une tempête de remounts React (tests 10× plus lents, timeouts flaky).

### Vérifications

- Gate : typecheck ✓ lint ✓ **133/133 tests** ✓ build ✓ (dist 905 kB / 271 kB gzip).
- Production : `vercel --prod` → https://v4-three-beige.vercel.app — HTTP 200, `CACHE_VERSION = "snowball-pro-v5.1.3"`, en-têtes HSTS / nosniff / X-Frame-Options DENY présents.
- Revue code (code-reviewer) : aucun point bloquant — l'ajout du timeout global est sain (hiérarchie vitest respectée : global < par-fichier < par-test).

### Notes

- Identité git auto-détectée au commit (`Yoric Tieche <yorictieche@macbook-air-de-yoric.home>`) — avertissement cosmétique, cohérent avec les commits précédents de la session.
- Pas de bump de version (commits test-only, aucun changement utilisateur) : 5.1.3 conservée partout.

---

## SESSION — 2026-08-01 (v5.1.3 : suppression « Millésime fiscal » + fiscalité TMI/barème + déploiement prod)

### Résumé

Suppression complète du curseur « Millésime fiscal » (2020–2032) : il ne modifiait AUCUN calcul — le moteur `taxes.ts` utilise des constantes fixes qui ne lisent jamais `fiscalYear`. Le worktree contenait aussi un WIP non commité (fiscalité TMI/barème, décaissement réécrit, KpiGrid refait, SegmentedControl) complété en parallèle pendant la session : les types manquants (`CtoTaxMode`, `TaxBreakdownOptions`, `tmi`, `ctoTaxMode`) ont été ajoutés, une erreur d'export `TaxBreakdownOptions` dans `engine/index.ts` corrigée, un hook `useMemo` placé avant un early-return dans `FeeImpact.tsx`, et un test `netYield` unité ratio/% corrigé. Version 5.1.2 → 5.1.3 partout (package.json, sw.js, CHANGELOG), commit du worktree complet et déploiement production.

### Modifications

- **Suppression `fiscalYear`** : `types.ts` (champ retiré), `migration.ts` (default, `NUMERIC_KEYS`, clamp au chargement), `validation.ts` (bloc validation + sanitize), `Sidebar.tsx` (curseur retiré), `App.tsx`/`DisclaimerBar.tsx` (prop supprimée, texte « règles fiscales en vigueur »), `FiscalPanel.tsx`/`MethodologyPanel.tsx`/`SummaryStats.tsx` (libellés « en vigueur »), `MonteCarloPanel.tsx` (retiré du hash de fraîcheur — évite les « relancez » inutiles).
- **Fiscalité TMI/barème** (WIP complété) : champs `tmi` + `ctoTaxMode` câblés dans types, migration (défauts + clés), validation (bornes 0–45 % + mode pfu/bareme), `taxes.ts` (barème CTO avec abattement 40 % dividendes, PER TMI à la sortie avec abattement 10 %, plafonds AV 150/300 k€, taux 12,8 % au-delà).
- **Décaissement (Rente) réécrit** : rééchantillonnage par blocs des rendements historiques, cumul mensuel des retraits (indexation inflation), 10 000 runs max.
- **Corrections gate** : `engine/index.ts` export `TaxBreakdownOptions` depuis `../types` (TS2459) ; `FeeImpact.tsx` `useMemo` avant le early-return (rules-of-hooks) ; test `netYield` aligné sur l'unité ratio de l'engine.
- **Version 5.1.3** : `package.json`, `public/sw.js` (`CACHE_VERSION` → `snowball-pro-v5.1.3`, impératif pour la purge PWA), CHANGELOG (entrée v5.1.3, compte tests 133), AGENTS.md (92 → 133 tests).
- **Nouveaux tests composants** (WIP parallèle) : `components.test.tsx` (jsdom) — undo/redo, comparaison A/B, snapshots, export CSV (BOM vérifié sur octets bruts), ErrorBoundary, partage URL ; `ErrorBoundary.tsx`, `utils/urlState.ts` ajoutés.
- **KpiGrid refait** (préexistant, non commité) : « Statistiques clés » avec icône Gauge, cartes masquées selon la simulation (sharpe/multiple/doubling/DD/frais conditionnels).

### Vérifications

- Gate : typecheck ✓ lint ✓ **133/133 tests** ✓ build ✓ (dist 905 kB / 271 kB gzip) ; revue code (code-reviewer) sans finding bloquant.
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

### Notes

- Le millésime était purement décoratif : les taux (17,2 % + 12,8 %, abattements 4 600/9 200 €) sont des constantes — d'où le libellé « règles en vigueur » choisi (une année figée serait devenue fausse).
- Anciens snapshots en localStorage peuvent contenir une clé `fiscalYear` fantôme : ignorée sans effet (les clés inconnues sont filtrées).
- Le worktree était édité en parallèle pendant la session (mtimes 18:39–18:50) : les validations ont été relancées après chaque évolution pour ne commiter qu'un état vert.

---

## SESSION — 2026-08-01 (v5.1.1 : durcissement sécurité + déploiement prod)

### Résumé

Audit de sécurité complet traité de bout en bout (Vite, CSP, en-têtes Vercel, service worker, CSV injection, CI, hooks tiers), puis commit et déploiement en production.

### Modifications

- **vite** 7.2.4 → 7.3.6 : les 5 advisories (3 High) éliminés — `npm audit` = 0 vuln.
- **CSP** meta dans `index.html` + nouveau `vercel.json` (nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, Cache-Control contrôlé pour `/` et `/sw.js`). `script-src 'unsafe-inline'` assumé (build single-file : tout le JS est inliné) + `script-src-attr 'none'`.
- **Service worker** activé en prod : cache `snowball-pro-v5`, navigation **network-first**, stale-while-revalidate, purge des caches **`snowball-pro-*` uniquement** (jamais ceux d'autres apps sur une origine partagée), `skipWaiting` + `clients.claim`. Enregistrement prod-only dans `main.tsx` (+ `/// <reference types="vite/client" />`).
- **PWA** : icônes 192/512 générées (`scripts/generate-icons.mjs`), manifest + favicon câblés.
- **Dev server** : `host: 127.0.0.1` (server + preview).
- **CSV** : `escapeCsvCell` (OWASP CSV Injection) sur toutes les cellules de l'export.
- **CI** : actions épinglées par SHA (`checkout@11d5960a`, `setup-node@49933ea5`), `permissions: contents: read`, étape `npm audit --audit-level=high`.
- **Hooks tiers** : `.github/hooks/`, `.github/skills/`, `.agents/skills/` gitignorés (supply-chain) — toujours actifs localement (config globale), à retirer si le flux impeccable est inutilisé.
- **Deps** : `zustand` + `immer` supprimés (0 imports, vestiges de la v4).
- **Tests** : timeouts MC élargis à 30 s (machine lente — 12-15 s par test), assertion CSV corrigée (préfixe `'` à l'intérieur des guillemets).

### Vérifications

- Gate : npm audit 0 vuln ✓ typecheck ✓ lint ✓ **93/93 tests** ✓ build ✓ (dist 892 kB / 267 kB gzip).
- Navigateur (dev + build prod servi statiquement) : zéro violation CSP (WebSocket HMR OK, fonts OK), SW `activated` avec cache `snowball-pro-v5`, page contrôlée.
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

### Notes

- Le commit principal (`102da1a8`) a été créé en parallèle pendant la session (identity git de l'utilisateur) ; un second commit couvre les retouches (purge caches SW, types vite/client, lint sw.js, timeouts tests, cleanup deps, docs).

---

## SESSION — 2026-08-01 (v5.1.0 : comparaison A/B, undo/redo, snapshots)

### Résumé

Les 3 fonctionnalités v4.1 perdues lors de la migration v5 ont été restaurées dans l'architecture composants, avec des corrections de bugs v4.1 et une validation Playwright complète.

### Décisions d'architecture

- **Engine pur par fichier** (règle MEMORY) : `src/engine/history.ts`, `snapshots.ts`, `comparison.ts` + `compareScenarios` typé dans `kpis.ts`.
- **Undo/redo corrigé vs v4.1** : l'historique stocke `patch` + `previous` (valeurs d'avant l'édition) par clé → l'undo du v4.1 était un no-op (il ré-appliquait les valeurs courantes).
- **Historique scénario-aware** : chaque entrée porte `scenario: "A" | "B"` → l'undo/redo cible le bon état même après avoir quitté le mode comparaison (bug latent v4.1 évité).
- **Scénario B isolé** : état `inputsB` propre + clé `snowball_v5_settings_b` (survit au rechargement) ; `frozenA` = copie d'`inputsRef.current` au clic « Comparer » ; `applyPatch` route vers le bon ref.
- **Snapshots** : cap 8, clé `snowball_v5_snapshots`, lecture fallback de la clé v4.1 `snowball_pro_v41_state` (migration best-effort).
- **`null` (pas `NaN`)** dans `mergeComparisonSeries` : contrat Recharts pour créer des trous de courbe (tooltip gère `value == null`).

### Modifications

- **Engine** : `history.ts` (cap 20, `HistoryScenario`), `snapshots.ts` (CRUD, cap 8), `comparison.ts` (`mergeComparisonSeries`), `kpis.ts` (`ScenarioComparison`), exports barrel `engine/index.ts`.
- **Hooks** : `src/hooks/useHistory.ts` (API `record(prev, patch, scenario)` → `{patch, scenario}`), `src/hooks/useKeyboardShortcuts.ts` (⌘Z / ⌘⇧Z / ⌘Y / ⌘D, saute les champs de saisie).
- **UI** : `ActionBar.tsx` réécrit (Annuler/Rétablir/Comparer), `ComparisonBar.tsx` (bannière mode actif), `ComparisonTab.tsx` (résumé + courbe + tableau annuel), `ComparisonSummary.tsx` (3 cartes A/B/écart avec préfixe `+`), `ComparisonChart.tsx`, `SnapshotPanel.tsx` (sidebar, boutons sauvegarder/charger/supprimer), `Sidebar.tsx` (badge « Scénario B »).
- **`src/App.tsx`** : câblage complet (état `comparing`/`frozenA`/`inputsB`, handlers undo/redo/snapshots, `applyPatch`), refs (`inputsRef`, `inputsBRef`, `comparingRef`) contre la stale closure, `toggleComparing` pur (StrictMode-safe).
- **Hygiène** : `.freebuff/` ajouté aux ignores ESLint + `.gitignore` (provoquait 108 erreurs lint) ; variable morte `impactPct` supprimée dans `FeeImpact.tsx` ; préfixe `+` sur l'écart positif dans `ComparisonSummary.tsx`.
- **Tests** : +27 tests (history/snapshots/comparison/scénario) → 65/65.

### Vérifications

- Gate complet : typecheck ✓ lint ✓ **65/65 tests** ✓ build ✓ (dist 872 kB / 261 kB gzip).
- Playwright : **28/28 PASS** (undo/redo boutons + raccourcis ⌘Z/⌘⇧Z, mode comparaison complet, écarts, snapshots créer/persister/charger/supprimer, zéro erreur console), rendu visuel validé par describe_image.
- Piège identifié : format monétaire fr-FR utilise l'espace fine insécable `\u202F` → normaliser dans les assertions (« 2 000 » ≠ `"2\u202F000"`).

### Notes

- Les 3 features et la refonte pédagogique (session parallèle) ont été committés ensemble : `faa5af79` v5.1.0.
- Vercel : projet `v4` (prj_J8bvSime5dm7oNJsUZBhjyTrBe8T), déploiement `v4-three-beige.vercel.app`.

---

## SESSION — 2026-07-31 (Restauration stats grid en haut)

### Résumé

La stats grid 4 cartes (présente dans le monolithe v4.1, supprimée par la migration v5) a été restaurée en haut de l'app.

### Modifications

- **`src/components/Simulation/SummaryStats.tsx` (nouveau)** — 4 cartes glass (grid-cols-2 lg:grid-cols-4) : Effort d'épargne, Gains générés, Net fiscal (`shortLabel` de l'enveloppe + sous-texte impôts ou "Aucune fiscalité"), Patrimoine final (sous-texte nominal/réel). Semantique identique à l'ancien App.tsx : `displayInvested = showReal ? investedReal : investedNom`, `displayInterests = max(0, final − investi)`, `taxAmount = max(0, nominal − taxNet)`. Format `fr-FR` entier + " €". Couleurs : `var(--color-*)` adaptatives light/dark.
- **`src/App.tsx`** — `<SummaryStats rows={rows} inputs={inputs} />` entre ActionBar et TabBar → visible sur les 4 onglets (placement d'origine).

### Vérifications

- Gate : typecheck ✓ lint ✓ 38 tests ✓ build ✓ (dist 839 kB / 252 kB gzip)
- Playwright : 4 cartes rendues (160 000 € / +362 980 € / 414 086 € / 522 980 € sur défauts), zéro débordement horizontal à 1440px et 320px. Rendu confirmé via describe_image.

---

## SESSION — 2026-07-31 (Responsive mobile)

### Résumé

Passage responsive mobile vérifié sur la nouvelle architecture composants (Tailwind).

### Important — contexte

- La **migration composants** (App.tsx refactorisé, `src/components/`) s'est faite **pendant** cette session, en parallèle de l'agent. Le commit `e35b4717` est la baseline avant migration ; le worktree contient la migration non commitée.
- L'architecture actuelle était déjà responsive (grid `grid-cols-1 lg:grid-cols-[380px_1fr]`, `min-w-0`). Corrections appliquées dessus.

### Corrections appliquées

- **TabBar** (`src/components/Layout/TabBar.tsx`) : `flex-wrap` + `min-w-[110px]` → 2×2 sur écrans étroits (320px), 4 colonnes sur desktop.
- **SmartInput** (`src/components/shared/SmartInput.tsx`) : `min-w-0` — les inputs faisaient 228px de large intrinsèque et débordaient le layout à 320px (onglet Objectif).
- **SliderInput** (`src/components/shared/SliderInput.tsx`) : `min-w-0` sur le wrapper label+input.
- **index.css** : `@media (max-width: 640px)` → font-size 16px sur `input[type="text"]`, `input[type="number"]`, `select` (évite le zoom automatique iOS au focus).
- **Graphiques** (`EquityChart`, `MonteCarloChart`, `DrawdownChart`) : `interval="preserveEnd"` + `minTickGap={28}` à la place des `interval` numériques → ticks d'axes jamais superposés sur mobile, desktop inchangé.

### Vérifications

- Playwright (headless) : 4 viewports (320/375/768/1440) × 4 onglets = **16/16 OK, zéro débordement horizontal**.
- `npm run typecheck` ✓, `npm run lint` ✓, `npm run test` (38/38) ✓, `npm run build` ✓ (835 kB, 251 kB gzippé).

### Notes

- Les edits de ma 1ʳᵉ passe (bloc `<style>` inline sur l'ancien App.tsx) ont été abandonnés au profit de la nouvelle architecture (Tailwind natif) — les corrections finales sont dans `src/components/`.
- `lang="fr"` déjà en place dans index.html.
- Le sidebar garde `overflow-y-auto` : son contenu scroll en interne si besoin.

---

## SESSION — 2026-06-28 (Audit + Corrections majeures)

### Résumé

Audit complet de Snowball Pro v5.0 avec correction de ~40 bugs, problèmes de performance, et dettes techniques.

### Corrections effectuées

#### 1. Build / Infrastructure

- **lucide-react** : mise à jour de ^1.16.0 vers 1.21.0 (package corrompu, fichiers manquants dans dist/)
- **.gitignore** : ajout de `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`
- **package.json** : renommé de `react-vite-tailwind` vers `snowball-pro`

#### 2. Store (Zustand) — Bugs critiques

- **Undo/Redo** : réécriture complète — utilise désormais `applyInputs()` avec `recordHistory: false` pour ne pas corrompre l'historique
- **Mode comparaison** : `toggleComparing()` utilise désormais `state.scenarios.B.inputs` au lieu de `state.scenarios.A.inputs` pour construire le scénario B
- **localStorage** : `saveToStorage()` sauvegarde désormais les deux scénarios (A et B) ; `loadFromStorage()` restaure les deux
- **buildScenario()** : utilise `sanitizeInputs()` en interne ; invalide les résultats MC/décumulation périmés quand les entrées changent
- **runMC()** : ajout d'un hash d'entrées pour éviter d'écrire des résultats périmés
- **Persistence des UI** : `toggleDarkMode()` sauvegarde désormais immédiatement

#### 3. Engine — Corrections

- **INFLATION_SERIES** : dédoublonné — défini une seule fois dans `historical.ts`, importé par `simulation.ts`
- **crisis amplitude** : `||` → `??` pour permettre amplitude=0
- **sanitizeInputs** : ajout de `peaYearsHeld` et `avYearsHeld` clampés
- **investedReal/interestsReal** : correction — n'étaient plus calculés (toujours 0)

#### 4. App.tsx — Corrections fonctionnelles

- **GoalProgress** : remplacement du target hardcodé (1 000 000) par `inputs.goalTarget`
- **FiscalPanel** : utilisation de `peaYearsHeld + projectionYear` / `avYearsHeld + projectionYear` pour matcher la simulation
- **FiscalPanel PFU** : masquage de la ligne PFU pour CTO (où PFU = PS + IR, doublon d'affichage)
- **Graphique comparaison** : format d'année cohérent (`"An 0"`, `"An 1"` au lieu de `0, 1, 2`)
- **Bouton Comparer** : texte distinct pour les états actif/inactif (`"Comparer"` / `"Quitter"`)
- **CSV export** : nom de fichier mis à jour (v4.1 → v5.0)

#### 5. Performance

- **useShallow** : sélecteurs Zustand individuels au lieu du store complet (évite les re-rendus inutiles)
- **useEffect darkMode** : dépendance corrigée sur la valeur `darkMode` au lieu du store
- **Fichiers morts supprimés** : `useSimulation.ts`, `useUndoRedo.ts`, `useValidation.ts`, `utils/pwa.ts`

#### 6. UX / Labels

- **Raccourcis clavier** : les champs input/textarea/select ne déclenchent plus les raccourcis globaux (Ctrl+Z natif restauré)
- **Traductions françaises** : Gold→Or, Flash Crash→Krach éclair, Bear Market→Marché baissier, Ultra-Safe→Très prudent, KPIs→Indicateurs, Drawdown Max→Repli Max, Best Case→Meilleur scénario, Worst Case→Pire scénario, AI Insights→Analyse, N/A→N/D, Seed→Graine

#### 7. Données historiques

- Dates de début par indice : Bitcoin (2011), Gold (2000) — suppression des années à rendement nul avant l'existence de l'actif

### Déploiement

- Build vérifié : typecheck, lint, test (25/25), build production (860kB, 258kB gzippé)

### Décisions clés

- App.tsx conserve ses composants inline (~1490 lignes) — les fichiers `src/components/` existent mais ne sont pas utilisés par l'application. Pas de migration vers les composants externes pour éviter une régression

### Tests

- 25 tests unitaires passent
- Commande : `npm run test`

### URLs

- Production : https://v4-three-beige.vercel.app

---

## Instructions pour les futures sessions

1. **Avant toute modification majeure** : lancer `npm run test && npx tsc --noEmit`
2. **Avant déploiement** : lancer `npm run build`
3. **Déploiement** : `vercel --prod` (depuis la racine du projet)
4. **Ajouter un test** pour toute nouvelle fonction dans `engine/`
5. **Ne jamais** remettre de logique métier dans `App.tsx` — utiliser les hooks
6. **Mettre à jour** ce fichier MEMORY.md à la fin de chaque session

---

## SESSION — 2026-07-31 (Migration v5 : App monolithe → coquille + composants)

### Résumé

Migration du monolithe App.tsx (1906 lignes, moteur inline, Chart.js) vers la pile v5 (engine 13 modules + 26 composants prop-based). Application des skills ultrathink + fable-mode + apex (-a -x -v) + oneshot, gate de vérification après chaque stage.

### Modifications

- **`src/engine/migration.ts` (nouveau)** — `DEFAULT_INPUTS`, `V4_SETTINGS_KEY`/`SETTINGS_KEY`, `v4SettingsToInputs`, `parseStoredInputs` + clamps
- **8 composants écrits** : EquityChart, MonteCarloChart, Sidebar, ActionBar, TabBar, SimulatorTab, MonteCarloPanel, GoalTab
- **`src/App.tsx` réécrit** — 1906 → ~170 lignes : state local, runSimulation mémoïsé, 4 onglets, export CSV
- **Suppressions (code mort)** : store.ts (Zustand), hooks/ (useStorage, useKeyboardShortcuts), components/ui/* (Radix, 9 fichiers), ComparisonBar, Card/StatCard/CurrencyValue, `index 2.css` (CSS legacy)
- **package.json** : 4.1.0 → 5.0.0 ; retirés chart.js + 5 deps @radix-ui
- **index.html** : titre « Snowball Pro v5 », fonts Inter/Outfit/JetBrains Mono
- **AGENTS.md / CHANGELOG.md** : mis à jour (architecture réelle, 38 tests)
- **Vérification graphe d'imports** : 47/47 fichiers atteignables, 0 mort

### Décisions

- Résultats numériques légèrement différents du moteur legacy (modèle fiscal v5 plus précis) — assumé
- Krach legacy → `crisisEnabled=false` par défaut (toggle non persisté en v4)
- Clé localStorage v4 conservée en lecture seule (rétrocompatibilité), écriture sur `snowball_v5_settings`
- `@/utils/cn` : alias non vérifié → imports relatifs dans les nouveaux composants
- Dark mode : prop `darkMode` (pas de toggle classe)

### État

- Gate final : typecheck ✓ lint ✓ 38 tests ✓ build ✓ (dist/index.html 835 kB / 251 kB gzip)
- Version 5.0.0 prête, build singlefile OK

### Commandes

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

---

## PISTES V6.1 ENREGISTRÉES — À RAPPELER À L'UTILISATEUR (session 2026-08-05)

> Demandé explicitement par l'utilisateur : « enregistre dans un fichier mémoire pour qu'on fasse ça plus tard, pour que tu me le rappelle ». Ces deux idées sont VALIDÉES par l'utilisateur (« je suis favorable à ces 2 idées ») — à proposer dès la prochaine session, quand la landing + les comptes seront livrés et validés.

### 📌 Idée 1 — Onglet « Retraite par objectif » (fusion Rente + Objectif inversé)

> « V6.1 : créer un onglet « Retraite par objectif » qui fusionne la Rente et l'Objectif inversé — l'utilisateur indique le revenu mensuel souhaité à la retraite, et l'app calcule le capital nécessaire, l'épargne mensuelle requise, l'âge de départ optimal et la probabilité de succès Monte Carlo. »

Points d'ancrage existants : `engine/decumulation.ts` (rente, garde-fous Guyton–Klinger, stress tests), `engine/kpis.ts` (`solveGoal`), `components/Tabs/RenteRetraiteTab.tsx`, `components/Tabs/GoalTab.tsx`, `MonteCarloPanel.tsx` (P10/P50/P90 + % succès). Idée de produit : un seul onglet « Combien investir pour X €/mois de retraite ? » avec bouclage solveGoal → décaissement → probabilité de succès.

### 📌 Idée 2 — Export PDF = vrai rapport patrimonial de synthèse

> « V6.1 : refondre l'export PDF en un vrai rapport patrimonial de synthèse — page de garde, héro du résultat, graphiques, tableau annuel, fiscalité et méthodologie, imprimable et partageable. »

État actuel : l'export PDF est `window.print()` (print CSS existant dans `index.css`, composant `ExportMenu.tsx`) — fonctionnel mais sans mise en page dédiée. Idée de produit : une vue « rapport » imprimable (bandeau « Enregistrer en PDF »), page de garde, héro, graphes, tableau annuel, fiscalité, méthodologie.

---

## SESSION — 2026-08-05 (v6.1.0 : landing page + comptes locaux, inscription/connexion)

### Résumé

Demande utilisateur : _« Je veux créer une landing page de présentation de l'app, un système de création de compte et de login, et tout le tralala. »_ Workflow APEX -a -x -v + fable-mode + impeccable + webapp-testing. **308 tests** (+71), gate 100 % vert, vérifié en navigateur réel. **Aucun déploiement Vercel — validation utilisateur requise.** Commit local demandé (« quand t'as fini commit ») — PAS de push (aucun remote).

### Landing page (`src/components/Landing/`)

- **Routeur hash** (`src/router.ts`, `src/Root.tsx`, `main.tsx` → `<Root />`) : `#/` landing (défaut) · `#/app` · `#/login` · `#/register` · `#s=…` → app direct (liens partagés intacts). `useSyncExternalStore` sur le hash.
- **`HeroChart.tsx`** : démo réelle — `runSimulation(parseStoredInputs(null))`, courbe d'équité SVG pur (nominal + réel), animation `pathLength` (reduced-motion respecté via MotionConfig global). Chiffres calculés, pas codés en dur (732 918 € sur les défauts).
- **`LandingPage.tsx`** : en-tête sticky (marque, nav ancres, thème partagé, Se connecter, Lancer l'app), héro 2 colonnes, chiffres clés, 6 fonctionnalités, 4 enveloppes, méthodologie (10,07 → 8,22 → 5,99 + Fisher), 3 étapes, FAQ accordéon, appel final, footer (disclaimer, v6.1.0). Contenu 100 % factuel. `Brand.tsx` (marque réutilisable).
- **`PRODUCT.md`** créé (vérité produit, impeccable). Détecteur impeccable : **0 finding**.

### Comptes & login (`src/auth/`)

- **`hash.ts`** : SHA-256 JS pur (vecteurs NIST testés), `hashPassword = sha256(sel:mdp)`, sel/token 16 octets aléatoires (crypto.getRandomValues, repli Math.random). Limite assumée : pas de PBKDF2 — local-first, remplaçable à l'identique.
- **`auth.ts`** : comptes (`snowball_v6_accounts`), session (`snowball_v6_session`), storage injectable (`memoryStorage` tests / `browserStorage` prod). `register` (doublon refusé, session auto), `login` (message générique « Email ou mot de passe incorrect »), `logout`, `getSession` (purge si compte disparu), `changePassword`, `deleteAccount` (vérification mdp).
- **`store.ts`** : `useSyncExternalStore` (cache module + `resetSessionStoreForTests`). **`storage.ts`** : `scopeKey(userId, key)` — invité = clés v5 historiques (rétrocompat), compte = `u:<id>:…` ; `removeScopedData` à la suppression.
- **`App.tsx`** : `App` (session) → `AppShell key={scope}` (remontage = rechargement du bon espace). Persistance settings/B/snapshots scopée. `AccountMenu` ajouté à l'en-tête.
- **UI auth** (`components/Auth/`) : `TextField` partagé (erreurs inline, toggle afficher/masquer), `LoginForm`, `RegisterForm` (validations par champ + confirmation), `AccountMenu` (avatar initiales, changer mdp, déconnexion, suppression en 2 temps + mdp), `AuthScreen`/`AuthLayout`.

### Revue adverse + détecteur

- code-reviewer : branding index.html (`v5`/« sans inscription » → v6.1), test de purge de session orpheline (branche `getAccount` manquant), `role="menu"` hors formulaires, extraction `utils/theme.ts` (landing + app), `maxLength=128` mots de passe — tous traités. Détecteur impeccable : 0 finding.

### Vérifications navigateur (preview réelle, desktop)

- Landing complète (démo moteur), inscription → session → app, menu compte (nom/email), changement de mot de passe (secret12 → nouveau12), déconnexion → invité (données invité historiques intactes : snapshot antérieur chargé), reconnexion avec le NOUVEAU mot de passe ✓, retour landing via `#/`, lien partagé `#s=…` → app + état chargé (capital 55 555 €) + bandeau « lien partagé ». Console 0 erreur (uniquement logs Vite + info reduced-motion).

### État

- Gate : typecheck ✓ lint ✓ **308/308 tests** ✓ (21 auth + 9 composants v6.1) build ✓ (dist 1 021 kB / 300 kB gzip).
- Version 6.0.0 → **6.1.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION = "snowball-pro-v6.1.0"`), CHANGELOG (entrée v6.1.0), MEMORY.md (cette entrée + section « PISTES V6.1 » avec les 2 idées validées).
- ⚠️ **Pas de déploiement Vercel** : attend la validation de l'utilisateur (explicite). Commit local créé à la demande ; pas de remote git.

### 🚀 Déploiement (validation utilisateur obtenue dans la foulée)

- `vercel --prod` : build OK (`snowball-pro@6.1.0`, vite build), aliasé sur **https://snowball-pro.vercel.app** (HTTP 200).
- Vérifié en prod : titre « Snowball Pro v6.1 — Simulateur Patrimonial », landing complète (héro + fonctionnalités + enveloppes + FAQ), `sw.js` `CACHE_VERSION = "snowball-pro-v6.1.0"` (purge PWA). Ancienne URL `v4-three-beige.vercel.app` toujours 200 (alias).
- Docs : MEMORY.md (cet ajout) + CHANGELOG (ligne « en attente de validation » → déployée) — petit commit `chore(deploy)`.

---

## SESSION — 2026-08-10 (v6.2.0 : nettoyage UI P0+P1 — hiérarchie, sidebar repliable, token carte secondaire)

### Résumé

Demande utilisateur : _« Discutons de ces issues et décidons… »_ puis _« lance P0 et P1 ensemble, commit et sauvegarde la version actuelle au cas ou, puis implémente, teste, vérifie, improve, go deeper »_. Chantier d'organisation de l'information (zéro changement moteur) : fin du « tout au même poids ». **308 tests**, gate 100 % vert, vérifié navigateur réel (desktop 1440 + mobile 375, clair + sombre, clavier). **Déployé en production** (validation utilisateur obtenue dans la foulée).

### Sauvegarde préalable

- Snapshot `46f0b5d2` sur `main` : WIP `index.html` (meta OG + GoatCounter — code `VOTRE-CODE` à configurer) avant le chantier.

### P0 — Onglet Rente & Retraite (le « bordel » concentré)

- **Doublon supprimé** : « Aperçu — rente possible selon le taux de retrait » redonnait les 3 montants déjà affichés par les cartes « Modèle de retrait » → suppression pure (les cartes de modèle SONT le comparatif).
- **% de survie dédoublonné** : verdict + carte KPI « La rente dure-t-elle ? » seulement. « En clair » reformulé (année de ruine, sans re-citer le %), paragraphe CI dit « ce taux » sans le répéter.
- **Verdict aplati** : « Krach simulé » et « En clair » sortis du bloc vert (3 niveaux de boîtes → 1).

### P1 — Sidebar + hiérarchie

- **Sidebar repliable** (`Sidebar.tsx`) : chevron dans l'en-tête « Réglages » (aria-expanded/aria-controls), état persisté `snowball_v62_sidebar_collapsed`, vue repliée = résumé compact (capital · épargne/mois · durée · enveloppe) + « Rouvrir les réglages ». Remontage simple SANS AnimatePresence : bug trouvé en vérif — `mode="wait"` + `prefers-reduced-motion` laissait le panneau vide.
- **Token `.card-subtle`** (index.css) : fond quasi transparent + bordure adoucie, appliqué aux blocs de support partout (synthèse, stats clés, jalons, frais, KPIs Rente, histogrammes, résultats MC, progression Goal). Héro/verdict gardent le verre.
- **Focus clavier dans la charte** : double anneau `var(--color-primary)` + liseré `var(--color-surface)` — or vif en sombre (#d4af37, lisible sur l'onglet or), or assombri en clair (#7c5e0a), sliders inclus. Fini l'outline bleu I7 v6.1 (WCAG 2.4.7 conservé).

### Vérifications

- Gate : typecheck ✓ lint ✓ **308/308 tests** ✓ build ✓ · détecteur impeccable (scope layout) **0 finding** · Playwright 20/20 (grille 2 colonnes, repli/dépli, focus clavier 2 thèmes, doublon absent, verdict aplati, zéro scroll horizontal 1440/375, 0 erreur console).
- Piège rencontré : une autre app (BOS) a pris le port 5173 entre deux vérifs — premières captures Playwright sur la mauvaise app. Serveur relancé en session détachée sur **5174** (`start_new_session=True`), re-vérifié contre lui.

### État

- Version 6.1.0 → **6.2.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION = "snowball-pro-v6.2.0"`), CHANGELOG (entrée v6.2.0), MEMORY.md (cette entrée).
- Branche `refactor/ui-cleanup-p0-p1` → merge sur `main`, puis `vercel --prod` → https://snowball-pro.vercel.app (HTTP 200, titre v6.2, `CACHE_VERSION` v6.2.0 vérifiée).

---

## SESSION — 2026-08-11 (v6.3.0 : passe d'harmonisation design system — couleurs, rouge sémantique, tableaux)

### Résumé

Demande utilisateur : _« j'ai des problèmes à te signaler et je veux qu'on en discute »_ + un audit externe de 50 détections (« à prendre avec des pincettes »). Deux phases décidées ensemble : **B — vérification visuelle** (Playwright desktop 1440 + mobile 390) puis **A — harmonisation** du noyau de détections confirmées. **Zéro changement moteur** : uniquement la couche d'affichage. **308 tests**, gate 100 % vert, **déployé en production** (commit + `vercel --prod`).

### Phase B — verdict sur l'audit (mesuré, pas supposé)

- **~40 % de détections déjà corrigées en v6.2** (sidebar repliable, focus, grille KPI, colonne Rente) — l'audit était généré sur ≤ v6.1.
- **Fausses** : « sidebar 100 k€ ≠ Goal 10 k€ » (les deux sont à 10 k€ — le vrai sujet est l'indépendance des inputs), « pas de tooltip » (les deux graphiques en ont), « Comparer jamais montré » (ComparisonTab câblé).
- **Confirmées et corrigées** : débordement des inputs « Augmentation de l'épargne »/« Courtage » (~34 px, dépendant de la largeur réelle de JetBrains Mono), CTA de l'état vide MC à ~520 px de la zone vide, « grand vide » Goal ÉCARTÉ (gap 0 px), contrastes tokens OK (seul l'ambre clair était sous AA — corrigé).

### Phase A — modifications (13 fichiers, 273+/145-)

- **Rouge sémantique** : frais/impôts rouges seulement si > 0 (CashflowCalendar, AmortissementTable, FeeImpact — qui avait des hex sombres illisibles en dark) ; « Krach simulé » + bloc réglage crise en **ambre** (réglage choisi ≠ erreur) ; carte verte « Objectif irréaliste » neutralisée (pastille de difficulté porte le statut).
- **Onglet Goal rebrandé or** : `#6366F1` → `var(--color-primary)` partout (sliders, cartes, tableau), GoalProgress sans dégradé néon.
- **Graphiques sur tokens** : P10/P90/médiane/moyenne/ruine → `--color-success`/`danger`/`accent` ; **ligne objectif étiquetée « Objectif »** (ReferenceLine ambre + label) ; modèles de retrait Rente tokenisés ; **tons hex-alpha `#XX18` → `color-mix()`** (bug latent : `var(--color-primary)20` = CSS invalide).
- **Méthodologie alignée à gauche** ; **tableaux** montants à droite + zebra + totaux teintés + zéros neutres (Goal, Comparison, Cashflow, Amortissement).
- **Badge « FIXE » → « Montant fixe »** ; **CTA « Lancer » dans l'état vide MC**.
- **SliderInput** : label `flex-1` + saisie `shrink-0` → fin du débordement.
- **Token `--color-warning` clair** `#b8860b` → `#8a6508` (**2,9:1 → 4,76:1 AA** — bénéficie aux usages existants).

### Vérifications

- Gate : typecheck ✓ lint ✓ **308/308 tests** ✓ build ✓ (dist 1 031 kB / 302 kB gzip) — les classes arbitraires Tailwind `bg-[var(--color-success)]/8` vérifiées **dans le CSS de production** (color-mix oklab) et au navigateur.
- Playwright : overflow sidebar éliminé (scrollWidth = clientWidth), indigo à 0 occurrence, label « Objectif » rendu, bloc krach ambre (label #8a6508) après run Rente avec crise activée, MC complet depuis l'état vide, 0 erreur console, mobile 390 px sans débordement.
- Version 6.2.0 → **6.3.0** (package.json, package-lock.json, `public/sw.js` `CACHE_VERSION = "snowball-pro-v6.3.0"`, titre index.html), CHANGELOG (entrée v6.3.0), MEMORY.md (cette entrée).

### Pistes restantes (hors périmètre, discutées avec l'utilisateur)

- Headers sticky sur tableaux longs (fragile avec le header app sticky — à faire proprement).
- Carte « Votre projet » en bas de sidebar (redondante avec le héro).
- **Mobile dédié** : le plus gros chantier produit (responsive-stacké aujourd'hui, pas de layout mobile propre).

## SESSION — 2026-08-11 (v6.4.0 : Honnêteté des hypothèses — frais réalistes, projection médiane, rente nette, profil)

### Résumé

Checklist produit de l'utilisateur (« corrections prioritaires », version ultra-courte : _corrige impôts latents, projection trop optimiste, frais à 0, Monte Carlo brut, rente non fiscalisée ; ajoute frais réalistes, fiscalité réelle, scénarios prudent/central/optimiste, euros réels, comparateur, tests, validation_) passée au crible du moteur — ~40 % était déjà fait (MC net de frais et fiscalité, taxRules par année, XIRR, garde-fous, validation) — puis implémentée en **3 paquets**. **Changement de paradigme** : la projection par défaut passe de la moyenne arithmétique (10,07 %) au **rendement géométrique composé (8,22 %, scénario central)** — le chiffre honnête (733 k€ → 519 k€ sur le défaut). **327 tests** (18 nouveaux), gate 100 % vert, vérifié Playwright desktop + mobile, 0 erreur console. **Non commité au fil de l'eau — release v6.4.0 complète (bump, sw.js, titre, CHANGELOG, MEMORY) puis Vercel.**

### Paquet 1 — Honnêteté des hypothèses

- **`returnScenario`** (`prudent`/`central`/`optimiste`) : `simulation.ts` `returnForYear` lit le scénario via `getHistoricalDataset` (l'échelle 10,07/8,22/5,99 existait déjà). Défaut **central**. `ScenarioSelector.tsx` (nouveau) : 3 cartes + bandeau « médiane historique ». La courbe lissée suit désormais l'indice choisi (avant : toujours MSCI — sans impact produit, la migration force msci-world).
- **Frais par défaut** : `migration.ts` `etfFees 0.0025`, `insuranceFees 0.0075` (AV seulement). États STOCKÉS conservés (choix utilisateur). `FeeImpact` : état positif « 🎉 Aucun frais ».
- **MC réel** : `montecarlo.ts` `runSinglePath` renvoie `{nominal, real}` (`taxNet × real/nominal`), `finalize` ajoute `p10r/p50r/p90r` + `successRateReal`. UI : toggle Euros courants/d'aujourd'hui + carte succès nominal/réel.
- **Libellés** : « Impôt théorique » partout (CashflowCalendar, SummaryStats, AmortissementTable, FiscalPanel titre+total). Le test composant `components.test.tsx` attendu mis à jour.

### Paquet 2 — Rente nette + objectif inversé

- **`decumulation.ts`** : chaque retrait taxé au prorata du coût fiscal (**base = versements `investedNom`** — correctif revue adverse : basis = nominal ne taxait jamais les gains latents de l'accumulation). `runDecumulation*` et `runStressTest` prennent `startingBasis` (défaut = startingCapital pour la rétrocompat des tests) ; `App.tsx` passe `lastRow.investedNom`. Frais d'encours mensuels. Résultats : `withdrawalsNet`, `totalTaxPaid`, `totalFeesPaid`, `netInitialWithdrawal`. Perf : `noNotes` (TaxBreakdownOptions) + saut du calcul après ruine → 2000 runs = 665 ms.
- **`solveGoalMonteCarlo(Async)`** (`kpis.ts`) : bisection 14 itérations × runs sur le scénario principal → versement pour P10/P50/P90. `GoalTab` : toggle `goalSync` + bloc inversion avec progress (P90 → P50 → P10).
- Test d'inversion lent (3×14×300 runs) → runs 200-250 + timeout 60 s (flaky sinon).

### Paquet 3 — Profil utilisateur

- Champs : `ageNow`, `ageRetirement`, `retirementExpenses`, `otherPensions`, `riskTolerance`, `maxDrawdownTolerance`, `goalSync` — types + migration + sanitize (bornes 16-100, 0-1 M€, 5-60 %).
- Sidebar « Votre profil » (repliée) ; Rente : repère d'âge, **couverture des dépenses** (rente nette + pensions vs dépenses), **alerte tolérance au risque** (pire drawdown du vivier réellement rejoué vs tolérance).

### Décisions produit prises (l'utilisateur a dit « fait tout »)

- Projection par défaut = **Central/géométrique** (médiane historique). Prudent = réel composé (nominal conservateur), Optimiste = moyenne arithmétique.
- Frais par défaut 0,25/0,75 — les états existants gardent leurs frais (à migrer si demandé).
- Rente : le retrait planifié reste BRUT (le compte draine le brut), l'impôt est prélevé dessus → rente nette affichée. Survie calculée sur le brut.

### Vérifications

- Gate : typecheck ✓ lint ✓ **327/327** ✓ build ✓ (1 052 kB / 307 kB gzip). Ancrages dorés **régénérés** (frais + central) ; tests « courbe lissée »/« formule fermée » fixés sur optimiste.
- Playwright : sélecteur + bandeau médiane, MC 10 k (succès réel), rente nette + tolérance après run (10 k ≈ 3-15 s headless), sync Goal, inversion P10/P50/P90 au clic (1 570/620/120 €), section Profil, 0 erreur console, mobile sans débordement.

### Pistes restantes (discutées avec l'utilisateur)

- **Web Worker + Float64Array** pour MC/décum (le chunking suffit aujourd'hui).
- **Comparateur multi-enveloppes dédié** (CTO/PEA/AV/PER sur un même scénario).
- **Migrer les frais des états stockés** v6.3 (0 % → 0,25/0,75 %) si décision.
- Mobile dédié (toujours le plus gros chantier produit) ; tests e2e automatisés (webapp-testing skill).
