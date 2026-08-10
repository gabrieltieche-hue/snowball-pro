# MÉMOIRE — Snowball Pro v5.0

> Fichier de mémoire persistante : capture chaque session et décision pour garantir une continuité parfaite.

---

## SESSION — 2026-08-03 (v5.6.0 : Courbe lissée du Simulateur + scénario « Partir en période difficile »)

### Résumé

Deux demandes utilisateur fusionnées dans la release **v5.6.0** (workflow APEX + fable-mode + oneshot + ultrathink) : (1) *« un truc linéaire, pas une courbe aléatoire »* — le Simulateur rejouait les zigzags historiques, l'utilisateur veut une courbe lisse ; (2) *« et si le départ à la retraite tombait en pleine crise ? »* — pouvoir choisir le moment et l'intensité du krach au lieu des seules fenêtres historiques fixes. **208 tests**, gate 100 % vert (typecheck ✓ lint ✓ test ✓ build ✓), déploiement Vercel.

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

Suite directe de la question utilisateur *« Pourquoi P50 = 2,67 M€ et P90 = 10,88 M€ (4× d'écart) ? Est-ce fiable ? Comment augmenter drastiquement la fiabilité ? »*. Première réponse vérifiée par recalcul indépendant (la dispersion 4× est mathématiquement correcte : volatilité réelle 19,3 % × √durée + bootstrap par blocs). Puis demande « IMPLÉMENTE TOUT » : les 6 améliorations proposées ont été implémentées en deux volets — **honnêteté du modèle** (fiabilité) et **robustesse du plan** (sûreté). Workflow APEX -a -x -v + fable-mode + oneshot + ultrathink + webapp-testing. **201 tests**, gate 100 % vert (vérifié navigateur en cours).

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
- **Infobulle clarifiée** (`GoalTab.tsx`) : *« L'inflation est déduite automatiquement par le simulateur, QUE l'affichage soit en euros courants ou en euros d'aujourd'hui — ne saisissez jamais un taux déjà net d'inflation. »*
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

Demande utilisateur : *« Je veux créer une landing page de présentation de l'app, un système de création de compte et de login, et tout le tralala. »* Workflow APEX -a -x -v + fable-mode + impeccable + webapp-testing. **308 tests** (+71), gate 100 % vert, vérifié en navigateur réel. **Aucun déploiement Vercel — validation utilisateur requise.** Commit local demandé (« quand t'as fini commit ») — PAS de push (aucun remote).

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

Demande utilisateur : *« Discutons de ces issues et décidons… »* puis *« lance P0 et P1 ensemble, commit et sauvegarde la version actuelle au cas ou, puis implémente, teste, vérifie, improve, go deeper »*. Chantier d'organisation de l'information (zéro changement moteur) : fin du « tout au même poids ». **308 tests**, gate 100 % vert, vérifié navigateur réel (desktop 1440 + mobile 375, clair + sombre, clavier). **Déployé en production** (validation utilisateur obtenue dans la foulée).

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
