# Améliorer les données de Snowball Pro — roadmap sourcée

> **Demande** : « comment améliorer nos données, avoir beaucoup plus de trucs, sur plus longtemps, de manière toujours extrêmement fiable ? »
> **Méthode** : bundles `research` + `deep-research` + `business` — recherche web sourcée (outils natifs `web_search` + `read_url`), vérification croisée des sources, hiérarchie de qualité (données officielles > académiques publiées > agrégateurs > non vérifiés). Chaque série recommandée a une source réelle consultée (URL en §5). Aucun chiffre inventé : les points non vérifiés sont marqués « à vérifier ».
> **Date** : 2026-08-17.

---

## 1. État des lieux — ce que l'app a déjà (audit)

| Série | Profondeur | Source actuelle (commentaires du code) | Fiabilité déjà en place |
|---|---|---|---|
| MSCI World NR EUR | 1970-2025 (56 ans) | Curvo + factsheets Amundi/MSCI, recoupé CW8 2022-2025 | ✅ ancrages vérifiés (1999 +46,2 %, 2008 −37,3 %, 2002 −32,7 %) |
| S&P 500 | 1995-2025 (31 ans) | — | série SBBI 1926-1969 **déjà dans le code** (`SP500_TOTAL_RETURNS_1926_1969`, ancrages 1929/1931/1933/1954) mais non branchée au sélecteur |
| Nasdaq 100 | 1995-2025 | — | — |
| CAC 40 | 1995-2025 | — | — |
| Bitcoin | 2011-2025 | — | — |
| Or | 2000-2025 | — | — |
| Inflation France | 1970-2025 | INSEE (Insee Focus n° 87) | ✅ médiane 2,10 % = l'hypothèse 2,1 % affichée (v6.11.0) |
| **Historique étendu** (option) | MSCI World → **100 ans** (S&P 500 1926-1969 + MSCI World 1970-2025), **centré** sur 10,07 % | SBBI/Ibbotson | ✅ correction v5.6.1 (pas de performance fabriquée par la fiabilité), blocs non chevauchants, incertitude Pástor–Stambaugh |

**Forces** : culture de la véracité déjà forte (ancrages, correction du biais de moyenne, inflation réelle rejouée dans la Rente). C'est le socle sur lequel bâtir.

**Limites (ce qui manque) :**
1. **Pas assez longtemps** : 56 ans pour le MSCI World ; l'extension 100 ans ne couvre que le MSCI World (pas S&P 500, CAC 40, Or) ; l'inflation s'arrête à 1970 (pourtant l'INSEE publie depuis 1901).
2. **Pas assez de trucs** : 6 indices, tous des actions/or/btc — zéro obligation, zéro immobilier, zéro émergents, zéro small caps, zéro indice européen large.
3. **Fiabilité non systématisée** : la vérification est faite « à la main » (commentaires dans le code), pas par un registre + tests de la gate. Le jour où une série est allongée, rien ne force la re-vérification.

---

## 2. Les trois leviers

## 2.1 Allonger — « sur plus longtemps » (P0, sources gratuites, faible coût)

| Série | Actuel | Cible | Source (gratuite sauf mention) | Vérification |
|---|---|---|---|---|
| **Inflation France** | 1970-2025 | **1901-2025 (125 ans)** | INSEE, séries chronologiques IPC (CSV) — portail `insee.fr/fr/statistiques/series/129209311` ; la série annuelle moyenne existe depuis 1901 (documenté par l'INSEE, cf. « 50 ans de mai 68 ») | Recouper les 56 dernières années avec la série actuelle (doit coller au centième), ancrages 1974 (13,7 %), 2015 (0,0 %) |
| **S&P 500** | 1995-2025 | **1928-2025 (98 ans)** — la série SBBI 1926-1969 est déjà en code, il ne manque que 1970-2025 | Damodaran (NYU Stern), *Historical Returns on Stocks, Bonds and Bills 1928-2024*, XLS gratuit | Recouper 1928-1969 avec SBBI déjà présent ; 1970-2025 avec Yahoo/Stooq ; ancrages 1931 (−43 %), 1954 (+52,6 %) |
| **S&P 500 « très long »** (mode étendu) | — | **1871-2025 (155 ans)** | Shiller, *U.S. Stock Markets 1871-Present*, gratuit (prix, dividendes, earnings, CPI mensuels) | Le 1871-1927 est reconstruit (Cowles) → **étiqueter « reconstitué »** en UI |
| **CAC 40** | 1995-2025 | **1988-2025 (38 ans)** | Euronext Paris (données officielles, base 1 000 au 31/12/1987) ; archives complètes depuis la création sur `bnains.org` | Recouper 1995-2025 avec l'existant ; ancrage 2008 (−43 % prix, à vérifier en TR) |
| **CAC 40 étendu** (option) | — | **1854-2025 (172 ans)** | Le Bris & Hautcoeur (2010), *A blue chips index for the Paris Stock Exchange 1854-1998*, Financial History Review — PDF gratuit (HAL/PSE) | Reconstruction académique publiée → **étiqueter « reconstruit par les historiens »** ; centrer sur la moyenne CAC officielle (règle v5.6.1) |
| **Or** | 2000-2025 | **1968-2025 (58 ans)** | London Gold PM Fix — gratuit via **FRED** `GOLDPMGBD228NLBM` (données LBMA) ; ou World Bank GEM (depuis 1960) | Recouper 2000-2025 avec l'existant ; ancrages 1980 (pic), 2008, 2011 |
| **MSCI World** | 1970-2025 | **vérifier 1969** : la série officielle remonte au 31/12/1969 (factsheet MSCI, données back-testées avant le lancement du 31/03/1986) | MSCI factsheet + Curvo | 1969 est une demi-année : l'ajouter change peu — **décision à trancher** (risque : casser la figure de référence 10,07 %) |
| **Monde 1900+** (option stratégique) | — | **126 ans** (35 marchés, 98 % de la capitalisation 1900) | DMS (Dimson, Marsh, Staunton), *Global Investment Returns Yearbook* — synthèses annuelles gratuites (UBS/Cambridge CEAM), **base complète payante** (Morningstar/GFD) | Utiliser les chiffres publiés du Yearbook comme **ancrage de croisement** (ordre de grandeur réel monde ≈ 5 %/an) plutôt que comme série rejouée — le S&P 500 reste le proxy gratuit |

**Bonus P0 — généraliser l'historique étendu** : aujourd'hui l'option `extendedHistory` ne concerne que le MSCI World (`getHistoricalPool`). Étendre le principe à chaque indice (S&P 500 1928+, CAC 40 1854+, Or 1968+, Nasdaq/BC n/a), chacun **centré sur sa propre moyenne de référence** — c'est la règle v5.6.1 déjà en place : les krachs s'élargissent, la médiane ne bouge pas.

## 2.2 Enrichir — « beaucoup plus de trucs » (P1, nouvelles classes d'actifs)

| Nouvelle série | Profondeur disponible | Source | Note d'honnêteté |
|---|---|---|---|
| **MSCI Emerging Markets** | 1988-2025 (back-testé dès déc. 1987) | Factsheet MSCI + Curvo | **Étiqueter « reconstitué »** avant 1988 |
| **MSCI ACWI** | reconstitué depuis 1990 | Factsheet MSCI | **Étiqueter « reconstitué »** |
| **MSCI World Small Cap** | depuis ~1998 | Factsheet MSCI + Curvo | — |
| **EURO STOXX 50** | base 1 000 au 31/12/1991, valeurs de fin d'année depuis 1986 | STOXX (factsheet officielle), Wikipedia | — |
| **STOXX Europe 600** | base 31/12/1991, 600 composantes | STOXX | — |
| **Obligations France** | OAT 10 ans (Banque de France Webstat, séries longues depuis le XIXᵉ s. via AEFR/Levy-Garboua & Monnet 2016) | Banque de France Webstat | Taux → transformer en rendement total approximatif ou garder comme série « taux » |
| **Obligations US** | 1928-2024 (T-Bond, T-Bill, Baa) | Damodaran XLS gratuit | Série directement réutilisable en Monte Carlo |
| **Immobilier coté** | 1990-2025 | FTSE EPRA Nareit Developed (factsheet FTSE/LSEG, Curvo) | Proche du sujet SCPI/immobilier des utilisateurs FR — le meilleur proxy coté sourcé |
| **Argent (silver)** | London Fix depuis 1968 | FRED / World Bank | Complète l'or |
| **Granularité mensuelle** (en plus de l'annuel) | S&P 500 mensuel 1871+, or mensuel, etc. | Shiller, FRED, ECB | Ouvre les stats de **drawdown** (pire chute, durée de reprise) — l'app n'a que de l'annuel |

**Direction stratégique à cadrer séparément — multi-actifs corrélés** : le moteur simule aujourd'hui **un** indice à la fois. « Beaucoup plus de trucs » = aussi des **portefeuilles** (monde + obligations + or + EM) → bloc-bootstrap **multivarié** (rejouer les années de retour réelles des N classes d'actifs ensemble, ce qui préserve les corrélations). C'est le plus gros chantier moteur de la liste (voir §3).

## 2.3 Fiabiliser — « toujours extrêmement fiable » (P2, le système)

Le code a déjà les ancrages (1929/1931/1933 pour SBBI, 1999/2008 pour MSCI World) — mais à la main, dans des commentaires. Le passage à l'échelle exige de **mécaniser** la fiabilité :

1. **Registre de provenance** (`src/engine/data/registry.json`) : une entrée par série — source, URL, date de récupération, licence, période, méthode (officiel / reconstitué / académique), ancrages de vérification, série de recoupement (≥ 2 sources indépendantes).
2. **Tests de la gate** : chaque série = test d'intégrité (longueur, bornes [−1, +5], pas de NaN/∞, années contiguës, moyenne ≈ figure de référence publiée) + **test d'ancrage** (les valeurs des années connues doivent coller à ±0,1 pt). → `npm test` refuse silencieusement une série corrompue.
3. **Double-vérification systématique** : chaque nouvelle série recoupée sur ≥ 2 sources (ex. S&P 500 = Damodaran × Shiller × SBBI ; CAC 40 = Euronext × bnains ; inflation = INSEE × france-inflation.com). C'est déjà la pratique sur MSCI World/CW8 — la généraliser.
4. **Étiquetage d'honnêteté en UI** : toute série reconstituée (MSCI EM 1987, ACWI 1990, CAC 1854-1987, S&P 1871-1927) porte un badge « reconstitué » (données back-testées) — règle du repo (leçon v6.8.0 : la landing ne doit jamais en dire plus que le moteur).
5. **Page publique « Nos données & méthodologie »** : chaque série, sa source, son URL, ses ancrages, la date de mise à jour → transparence = confiance (et contenu SEO, cf. §4). À relier depuis la landing, le rapport PDF et le footer.
6. **Procédure de mise à jour annuelle documentée** (janvier) : rafraîchir les séries, mettre à jour le registre, relancer les ancrages, bump de version — chaque mise à jour = entrée CHANGELOG + test d'ancrage vert.

**⚠️ Licences à respecter (tableau) :**

| Source | Statut |
|---|---|
| INSEE | Licence ouverte (réutilisation libre avec mention) ✅ |
| ECB / Banque de France Webstat / FRED | Libres (API gratuite) ✅ |
| Shiller (Yale) | Gratuit pour usage académique/éducatif, citation requise ⚠️ |
| Damodaran (NYU Stern) | Gratuit, citation requise ⚠️ |
| Kenneth French Data Library | Gratuit, citation requise ⚠️ |
| Le Bris & Hautcoeur (HAL) | PDF académique libre ⚠️ |
| Stooq / Yahoo Finance | Gratuits mais sans garantie contractuelle ⚠️ (recouper) |
| LBMA (fix officiels) | Licence IBA pour redistribution → **passer par FRED/World Bank** ✅ |
| DMS / Global Financial Data / Morningstar | **Payants** — base 1900+ uniquement si stratégique |

---

## 3. Feuille de route priorisée

### P0 — Allonger (2-3 sessions de travail, zéro coût financier)
1. Inflation France 1970 → **1901** (INSEE, CSV) — impact direct Rente + pédagogie (125 ans de chocs, dont les années 1940).
2. S&P 500 1995 → **1928** (Damodaran) en réutilisant la série SBBI déjà en code → le sélecteur S&P 500 passe à 98 ans ; option étendue **1871** (Shiller).
3. CAC 40 1995 → **1988** (Euronext) + mode étendu **1854** (Le Bris-Hautcoeur, centré).
4. Or 2000 → **1968** (FRED/LBMA).
5. Généraliser `extendedHistory` à tous les indices (centré, règle v5.6.1).
6. **Acceptation** : gate vert (typecheck/lint/tests/build) + 1 test d'ancrage par série + registre rempli.

### P1 — Enrichir (3-5 sessions)
1. Nouvelles séries : EM (1988), ACWI (1990), World Small Cap, EURO STOXX 50 / STOXX 600, obligations (Damodaran T-Bond 1928+, OAT Banque de France), EPRA Nareit (1990), argent.
2. Granularité mensuelle pour les stats de drawdown.
3. Chantier moteur **multi-actifs corrélés** (cadrage séparé : bootstrap multivarié, UI « portefeuille », i18n, tests).

### P2 — Fiabiliser (permanent)
1. Registre de provenance + tests d'intégrité/ancrage dans la gate.
2. Étiquetage « reconstitué » en UI.
3. Page publique « Nos données & méthodologie » (SEO + confiance).
4. Procédure annuelle documentée.

---

## 4. Angle business (bundle `business`)

- **La fiabilité est le produit** : la promesse de la landing est « Des chiffres réels, pas des promesses » (v6.8.0) et « 100 ans de vraie histoire, krachs inclus » (v6.17.0). Allonger à **150 ans (1871)** pour le S&P 500 étendu et **172 ans (1854)** pour le CAC étendu transforme ce slogan en fait vérifiable — et c'est exactement ce que **Portfolio Visualizer / Curvo / FireCalc** ne font pas documenté avec autant de transparence (avantage concurrentiel gratuit).
- **Chaque indice = un scénario partageable = une boucle virale** : le partage `#s=` existe déjà (v6.13.0) ; chaque nouvelle classe d'actifs (EM, obligations, immo) crée de nouveaux scénarios que les utilisateurs partagent avec UTM — plus de séries = plus de boucles.
- **SEO programmatique** : une page statique par indice (« Simulateur MSCI Emerging Markets », « CAC 40 depuis 1854 », « Or depuis 1968 »…) reprend le pattern des guides v6.13.0 (JSON-LD, CTA deep-link `#s=`) sur des requêtes long-tail françaises. La page « Nos données » est elle-même un contenu de confiance indexable.
- **Conversion** : l'étiquetage « reconstitué » + la page méthodologie ne coûtent rien et désamorcent l'objection « les données back-testées sont-elles fiables ? » — c'est du copywriting de réassurance factuel.
- **Garde-fous (règles du repo)** : pas de chiffre en dur non dérivé du moteur (v6.8.0), pas de sur-promesse sur les séries reconstituées (badge obligatoire), taux cités = taux du moteur, rester 100 % gratuit (recommandation pricing v6.8.0 conservée : la fiabilité documentée est le moat, pas un paywall).

---

## 5. Sources consultées (vérifiées le 2026-08-17)

**Indices mondiaux**
- MSCI World factsheet : https://www.msci.com/www/fact-sheet/msci-world-index/05830501 (données depuis le 31/12/1969, lancement 31/03/1986)
- MSCI World — Wikipédia : https://en.wikipedia.org/wiki/MSCI_World (« calculé depuis 1969 »)
- Curvo, historique MSCI World 1969-2026 : https://curvo.eu/backtest/en/market-index/msci-world
- MSCI Emerging Markets factsheet : https://www.msci.com/www/fact-sheet/msci-emerging-markets-index/07149641 (back-testé dès 1987)
- Curvo, MSCI EM 1988-2025 : https://curvo.eu/backtest/en/market-index/msci-emerging-markets
- MSCI ACWI factsheet : https://www.msci.com/www/index-factsheets/msci-acwi/05737588

**États-Unis long terme**
- Shiller, données mensuelles 1871-présent (prix, dividendes, earnings, CPI) : http://www.econ.yale.edu/~shiller/data.htm (page lue : série mensuelle depuis janvier 1871, sources Cowles pré-1926, CPI Warren-Pearson pré-1913)
- Damodaran (NYU Stern), *Historical Returns on Stocks, Bonds and Bills 1928-2024* : https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html + XLS https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls
- Kenneth French Data Library (facteurs US depuis 07/1926, gratuit) : https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html

**Monde 1900+ (DMS)**
- Cambridge CEAM, Global Investment Returns (35 pays, 1900+, >98 % de la capitalisation 1900) : https://www.jbs.cam.ac.uk/centres/ceam/research/investing-over-the-long-term/global-investment-returns/ (page lue)
- UBS Global Investment Returns Yearbook 2026 (126 ans de données) : https://www.ubs.com/global/de/media/display-page-ndp/en-20260303-global-investment-returns-yearbook-2026.html
- London.edu (Yearbook 2026 : « up to 126 years of data across 35 different markets ») : https://www.london.edu/news/ubs-global-investment-returns-yearbook-2026-history-risk-and-return-in-turbulent-times

**France**
- Le Bris & Hautcoeur (2010), *A blue chips index for the Paris Stock Exchange 1854-1998*, Financial History Review 17(2) : https://ideas.repec.org/a/cup/fihrev/v17y2010i02p141-183_00.html ; HAL : https://hal.science/hal-00468209 ; PSE : https://www.parisschoolofeconomics.eu/publications-hal/a-challenge-to-triumphant-optimists-a-new-blue-chips-index-for-the-paris-stock-exchange-1854-2007/
- CAC 40 — economie.gouv.fr (créé en 1987, base 1 000 au 31/12/1987) : https://www.economie.gouv.fr/facileco/le-cac-40 ; archives complètes : https://www.bnains.org/archives/archives.php
- INSEE, séries IPC (portail, CSV) : https://www.insee.fr/fr/statistiques/series/129209311 ; série depuis 1901 documentée : https://www.insee.fr/fr/information/5017873 ; France-inflation (années 1901+) : https://france-inflation.com/
- Banque de France Webstat, OAT 10 ans : https://webstat.banque-france.fr/fr/catalogue/fm/FM.M.FR.EUR.FR2.BB.FR10YT_RR.YLD
- Levy-Garboua & Monnet (2016), *Les taux d'intérêt en France : une perspective historique*, Revue d'économie financière (séries depuis le XIXᵉ s.) : https://www.aefr.eu/fr/article/3392-les-taux-d-interet-en-france-une-perspective-historique ; https://ideas.repec.org/a/cai/refaef/ecofi_121_0035.html

**Autres classes d'actifs**
- FTSE EPRA Nareit Developed (données depuis 1990) : https://www.lseg.com/en/ftse-russell/indices/epra-nareit ; Curvo : https://curvo.eu/backtest/en/market-index/ftse-epra-nareit-developed
- EURO STOXX 50 (base 1 000 au 31/12/1991, lancement 26/02/1998) : https://www.stoxx.com/document/Indices/Factsheets/2023/March/SX5E.pdf ; Wikipédia (valeurs de fin d'année depuis 1986) : https://en.wikipedia.org/wiki/EURO_STOXX_50
- FRED, London Gold PM Fix (données LBMA depuis 1968) : série `GOLDPMGBD228NLBM` ; LBMA : https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices ; World Bank gold USD depuis 1960 : https://eco3min.fr/en/gold-price-history-dataset/

**Données gratuites / infra**
- ECB, taux de référence EUR (CSV/API libres) : https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/exchange-rates ; https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
- Banque de France Webstat EXR (change + prix de l'or) : https://webstat.banque-france.fr/en/methodologies/exr/
- Stooq, données historiques gratuites (CSV) : https://stooq.com/db/h/
