# Idées d'amélioration — Landing page Snowball Pro

> **Date** : 2026-08-17 (mise à jour : triage utilisateur intégré)
> **Source** : analyse de la landing (`src/components/Landing/LandingPage.tsx`), des profils concurrents
> (`competitor-profiles/`), de `PRODUCT.md`, `MEMORY.md`, `index.html` (SEO) et `public/llms.txt`.
> **Statut** : suggestions annotées des décisions utilisateur. ✅ = validé (à implémenter),
> ❌ = refusé, 🗓️ = validé mais plus tard. **Tous les points sont désormais tranchés.** Rien n'est encore implémenté.

---

## Cadrage (décision utilisateur)

> **« Il faut plus développer la landing page de manière générale. »** La landing est un chantier à
> étoffer en priorité, pas seulement à retoucher. Toutes les idées validées ci-dessous vont dans ce sens.

---

## Diagnostic express

La landing est déjà **au-dessus de la moyenne du marché FR** : héro avec vraie démo
(moteur réel, pas une maquette), pédagogie de l'incertitude, zéro chiffre inventé, FAQ
solide, deep-links `#s=` vers les pages statiques. Le problème n'est pas la qualité :
**c'est que personne ne sait encore quelle catégorie vous créez.** Les concurrents l'ont
compris différemment (ProjectionLab = « modeling sandbox » américain, Finary = « tout votre
patrimoine au même endroit », Snowball Analytics = « analytics pour investisseurs sérieux »).

Le résumé concurrentiel (`competitor-profiles/_summary.md`) le dit noir sur blanc : le trio
**« fiscalité FR + historique réel + Monte Carlo » est unique, mais la catégorie n'existe pas
dans l'esprit du marché**. Toutes les suggestions ci-dessous découlent de là.

---

## 1. Positionnement — la transformation drastique (priorité absolue)

### 1.1 Créer la catégorie dans le héro

- ✅ « Combien peut valoir votre épargne dans 25 ans ? » est une bonne question, mais elle ne
      nomme pas ce que vous êtes — **le héro doit nommer la catégorie** (« simulateur patrimonial
      français »), pas seulement poser la question.
- ❌ **Refusé** — les titres alternatifs nominatifs (« Le ProjectionLab français — mais avec votre
      fiscalité (PEA, AV, PER) ») : nommer un concurrent dans le héro rabaisse le produit. La
      comparaison nominative appartient aux pages `/alternatives/`.
- ✅ Le combo unique (fiscalité FR + 100 ans de données réelles + Monte Carlo + décumulation)
      doit être **dans le héro**, pas dans la section 5.

### 1.2 Attaquer le cluster qui possède les SERP — ✅ VALIDÉ 100 %

- ✅ Les « simulateurs SEO français » (pea.fr, lessous…) trustent Google avec des taux fixes
      naïfs — c'est l'ennemi de visibilité n°1, et personne ne les attaque.
- ✅ Bande sous le héro : _« Les autres simulateurs supposent 5 % par an. Nous, on rejoue
      100 ans de vraie histoire, krachs inclus. »_ C'est le message le plus drastique et le
      plus défendable.

### 1.3 Désambiguïser vs Snowball Analytics

- ✅ Collision de nom directe signalée dans le résumé concurrentiel : « Snowball Analytics »
      vs « Snowball Pro » = même mot-clé, même public.
- ✅ Section « Suivi ≠ simulation » opposant aux trackers type Finary/Snowball Analytics —
      **validée mais ton adouci** : comparer par les faits (leur modèle = tracker de données
      agrégées, le nôtre = simulation pure), **sans** la formule « Ils demandent vos accès
      bancaires et gardent vos données sur leurs serveurs » (**refusée**, risquée juridiquement).
- ✅ Le « 100 % local » doit cesser d'être une fonctionnalité pour devenir une **position
      morale** — sans attaque ad hominem.

### 1.4 Section « Comment on se compare » — ✅ VALIDÉ

- ✅ Tableau honnête : vous vs Finary vs ProjectionLab vs simulateurs SEO (fiscalité FR,
      historique réel, Monte Carlo, décumulation, gratuit, 100 % local, accès bancaire requis).
- ✅ Liens internes vers les 4 pages `/alternatives/` (vente + preuve + maillage SEO en une
      brique). Le footer seul ne suffit pas — le tableau honnête fait écho au style des pages
      alternatives existantes.

---

## 2. Conversion (CRO + psychologie)

### 2.1 Démo éditable — ✅ VALIDÉ 100 %

- ✅ La bascule Prudent/Central/Optimiste est bien, mais le visiteur ne peut pas se projeter.
- ✅ Ajouter 2-3 curseurs (montant initial, versement mensuel, durée) qui recalculent le vrai
      moteur.
- ✅ CTA « Repartir de cette simulation » qui pré-remplit l'app via le deep-link `#s=`
      existant (IKEA effect : ce qu'on a paramétré soi-même, on veut le voir finir).

### 2.2 Social proof réelle (pas inventée) — ❌ REFUSÉE

- ❌ Aucune preuve sociale n'est ajoutée à la landing (ni compteurs GoatCounter, ni mentions
      Reddit, ni phrases type « 100 % de nos visiteurs… »).
- La preuve reste la démonstration elle-même : moteur réel, chiffres calculés, FAQ, changelog.

### 2.3 Objection « c'est gratuit, c'est quoi le piège ? » — ❌ REFUSÉE

- ❌ **Refusé** — la formulation _« Gratuit parce qu'il n'y a pas de serveurs à payer, pas de
      données à revendre »_ **et** le renvoi vers `pricing.html` ne sont pas retenus.
- La question (« c'est gratuit, c'est quoi le piège ? ») reste ouverte ; l'objection est déjà
  couverte par la FAQ « L'application est-elle vraiment gratuite ? » et le CTA « Sans
  inscription ».

### 2.4 Réaffecter « Dernières éditions » — ✅ ADAPTÉ (pas de suppression)

- ❌ **Ne pas supprimer** : c'est la seule preuve visible que le produit est vivant (livraison
      hebdomadaire réelle, vérifiable) — de la preuve sociale gratuite.
- ✅ **Réduire à 3-4 items max** (les plus récents) + lien « Toutes les versions » → page
      changelog dédiée **à créer** (`public/changelog.html`, style guides single-file).
- Aujourd'hui : 12 cartes en grille, aucun lien vers le changelog complet.

### 2.5 Mesurer le funnel — ❌ REFUSÉE

- ❌ Pas de funnel GoatCounter events (visite → clic CTA → app ouverte → simulation modifiée
      → rapport généré) : la mesure reste limitée aux visites GoatCounter existantes.
- Conséquence : aucun test A/B adossé à un funnel ne sera mené dans l'immédiat.

---

## 3. Signature design (frontend-design / impeccable)

### 3.1 Direction esthétique : le « rapport financier » — ❌ REFUSÉE

- ❌ **Refusé** — le gold/ivoire + glass est l'identité du produit (PRODUCT.md), pas un
      « template SaaS par défaut ». Pas de refonte globale : la landing est développée dans
      l'existant, pas redessinée.

### 3.2 Élément signature (un seul, incarnant le brief)

- ✅ **Le replay des krachs** : courbe du héro animée sur 2000, 2008, 2022 avec les vrais
      chiffres — « 2008, votre épargne perd 40 %… puis elle revient ». Émotion + pédagogie,
      personne ne le fait. **Élément signature n°1.**
- ❌ **Refusée** — **La preuve de vie privée** : panneau style devtools montrant en direct les
      requêtes réseau (zéro) pendant la visite = gadget. La preuve se fait par une phrase +
      le fait qu'il n'y a rien à installer.

### 3.3 Typographie — ❌ REFUSÉE

- ❌ Pas de serif display : Outfit (display) + Inter (texte) + JetBrains Mono (chiffres) sont
      conservés tels quels (PRODUCT.md).

---

## 4. SEO / IA (c'est là que se joue la distribution)

### 4.1 FAQ schema sur la landing — ✅ VALIDÉ

- ✅ La section FAQ existe mais le JSON-LD de `index.html` ne contient que `WebApplication`.
- ✅ Ajouter le schema `FAQPage` — la différence entre être cité et être ignoré par les
      AI answers.

### 4.2 Maillage interne depuis les sections — ✅ VALIDÉ 100 %

- ✅ Carte PEA → `guides/simulateur-pea.html`
- ✅ Carte AV → `guides/pea-ou-assurance-vie.html`
- ✅ Section comparaison → les 4 `/alternatives/`
- ✅ Actuellement tout est relégué au footer.

### 4.3 Pages « vs » manquantes — ❌ REFUSÉE

- ❌ Pas de nouvelles pages comparatives (`ProjectionLab alternative France`, `Finary vs
      Snowball Pro`, `simulateur Monte Carlo France`).
- Le socle distribution existant (4 pages `/alternatives/` + 3 guides + `pricing.html`) est
      conservé tel quel.

---

## 5. Nouvelles idées validées (hors rapport initial)

### 5.1 Démo « objectif inversé » — ✅ VALIDÉ

« Je veux 1 M€ » → « il faut X €/mois ». **Deuxième mini-démo à côté du héro**, question
radicalement différente (« combien investir » au lieu de « combien ça vaudra »). Le solveur
existe déjà dans l'app (onglet Objectif) — à brancher sur la landing comme le héro l'est déjà.
CTA « Repartir de cette simulation » (cf. 2.1).

### 5.2 Manifeste « Ce que nous ne faisons pas » — ✅ VALIDÉ

Pas de rendement garanti, pas de conseil en investissement, pas de vente de données, pas de
compte obligatoire, pas de pub. C'est l'envers de l'attaque 1.2 : la preuve par l'honnêteté.
Aucun simulateur français n'ose l'écrire.

### 5.3 « Et si vous partiez à la retraite en 2008 ? » — ✅ VALIDÉ

La décumulation (rente + stress tests 1973/2000/2008) est **un onglet entier du produit**
réduit à une carte sur la landing. Un chiffre ou une mini-scène rendrait la landing unique —
c'est exactement la question que les simulateurs d'épargne ignorent.

### 5.4 Bande P10–P90 dans le héro — 🗓️ PLUS TARD

Montrer l'incertitude en image (« votre capital final : entre X et Y selon l'histoire ») —
la pédagogie signature réduite à une visualisation. **Validé mais gardé en réserve** (chantier
plus ambitieux).

### 5.5 Wizard « 8 questions » comme CTA — ❌ REFUSÉ

Ne pas vendre la landing via le questionnaire d'onboarding (v6.16). Le CTA reste
« Calculer mon nombre magique » → l'app.

---

## Ordre de bataille (final après triage complet)

1. **Attaque du cluster taux fixe** (1.2) — coût faible, drastique, aucun concurrent ne réplique.
2. **Section « Comment on se compare » + liens internes** (1.4 + 4.2) — tableau honnête + maillage SEO en une brique.
3. **Démo éditable + « Repartir de cette simulation »** (2.1) — meilleur ROI (moteur + `#s=` déjà en place).
4. **Démo « objectif inversé »** (5.1) — nouveau, solveur existant.
5. **Manifeste « Ce que nous ne faisons pas »** (5.2) — nouveau, différenciateur.
6. **« Et si vous partiez à la retraite en 2008 ? »** (5.3) — nouveau, la décumulation en scène.
7. **Replay des krachs** (3.2) — l'élément signature.
8. **FAQ schema** (4.1) — technique, rapide, rentable IA/SEO.
9. **« Dernières éditions » réduit + page changelog** (2.4 adapté) — 3-4 items + lien.
10. *(Plus tard)* **Bande P10–P90** (5.4).

## Refusés (récap final)

- **2.3** — objection gratuit (formulation « pas de serveurs à payer » + renvoi `pricing.html`).
- **3.1** — refonte esthétique « rapport financier » (identité gold/ivoire conservée).
- **3.2** — panneau devtools « preuve de vie privée » (gadget).
- **1.1** — comparaison nominative dans le héro (« Le ProjectionLab français… »).
- **1.3** — ton « ils demandent vos accès bancaires » (comparaison adoucie à la place).
- **5.5** — wizard « 8 questions » comme CTA de la landing.
- **2.2** — preuve sociale GoatCounter (aucune ajoutée à la landing).
- **2.5** — funnel GoatCounter events (aucune mesure de funnel).
- **3.3** — typo serif (Outfit conservé).
- **4.3** — pages « vs » manquantes (pas de nouvelles pages comparatives).

## Le message unique

**Vous n'êtes pas « un simulateur de plus » : vous êtes le seul simulateur patrimonial
français qui dit la vérité — et la page doit le crier dès la première seconde.**
