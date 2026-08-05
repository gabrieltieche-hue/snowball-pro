# PRODUCT.md — Snowball Pro

> Vérité produit capturée (session 2026-08-05, chantier v6.1 : landing + comptes).
> Dérivée du brief utilisateur et du produit existant (CHANGELOG, MEMORY.md) —
> pas d'entretien produit : mode `/apex -a` (auto), brief explicite.

## Produit

Snowball Pro est un **simulateur patrimonial français** : il projette une épargne
(capital + versements mensuels) avec les rendements réels du MSCI World
(1970–2025) et 100 ans d'historique (S&P 500 SBBI 1926–1969), applique la
fiscalité française (CTO, PEA, AV, PER — règles 2026), et mesure la robustesse
du plan par Monte Carlo (jusqu'à 10 000 scénarios) et par la Rente/retraite
(garde-fous Guyton–Klinger, stress tests 1973/2000/2008).

## Promesse

Le résultat d'abord : ouvrir l'app doit montrer « le nombre magique » — le
capital final et sa décomposition (épargné + croissance) — pas une page de
réglages. La pédagogie est au même niveau que la précision (échelle
10,07 % → 8,22 % → 5,99 %, formule de Fisher, « planifiez sur la médiane »).

## Public

Épargnants francophones, débutants à confirmés. La confiance vient de la
transparence (données réelles, sources citées, incertitudes affichées) plus que
de promesses de rendement.

## Contraintes

- **100 % local** : aucun serveur, aucune donnée qui quitte l'appareil
  (localStorage). Les comptes v6.1 créent un espace isolé sur l'appareil — pas
  encore de synchronisation cloud.
- Build single-file (vite-plugin-singlefile), PWA offline, app française.
- Style : or/ivoire, Outfit (display), Inter (texte), JetBrains Mono (chiffres),
  dark par défaut côté site, thème clair par défaut côté app (CSS vars).

## Positionnement (landing)

Landing = mode « Persuade » : prouver la valeur par la démonstration réelle
(graphique exécuté par le vrai moteur), les chiffres vrais (100 ans, 10 000
scénarios, 4 enveloppes) et la confiance (données locales, gratuit, sources).
Pas de prix (gratuit), pas de témoignages inventés, pas de promesse de
rendement.
