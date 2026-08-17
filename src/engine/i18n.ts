/**
 * i18n minimaliste et pur (v6.12.0) — une seule langue ajoutée : l'anglais.
 *
 * Principe : le dictionnaire anglais est INDEXÉ PAR LE TEXTE FRANÇAIS exact.
 * `tr("en", "Durée")` → "Duration" ; `tr("fr", …)` (ou une entrée manquante)
 * retourne le texte français inchangé. Avantages :
 *  - zéro invention de clés : le JSX garde le texte français (tests existants
 *    intacts, fallback naturel si une traduction manque) ;
 *  - une même chaîne française partout → une seule entrée (cohérence).
 * Placeholders `{x}` pour les libellés dynamiques ("{n} ans").
 *
 * La langue par défaut est TOUJOURS le français : toute fonction sans langue
 * explicite (moteur, tests, composants hors provider) reste identique à avant.
 */
export type Lang = "fr" | "en"

export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "en", label: "English", flag: "🇬🇧" },
]

/** Locale Intl pour chaque langue (formatage des nombres, dates…). */
export const LANG_LOCALE: Record<Lang, string> = {
  fr: "fr-FR",
  en: "en-US",
}

const EN: Record<string, string> = {
  // ─── Application : en-tête, onglets, bandeaux ───────────────────────────────
  "Simulateur patrimonial": "Wealth simulator",
  Projection: "Projection",
  "Robustesse de votre plan": "Plan robustness",
  "Rente & Retraite": "Annuity & Retirement",
  "Combien investir ?": "How much to invest?",
  "Scénario chargé depuis un": "Scenario loaded from a",
  "lien partagé": "shared link",
  "Il est aussi sauvegardé sur cet appareil — partagez à nouveau le lien pour propager vos modifications.":
    "It is also saved on this device — share the link again to propagate your changes.",
  "Fermer le bandeau lien partagé": "Close shared link banner",
  "Des valeurs saisies sortent des bornes acceptées (": "Some entered values are outside the accepted ranges (",
  erreur: "error",
  erreurs: "errors",
  "Corrigez-les pour une simulation fiable.": "Fix them for a reliable simulation.",
  "). Corrigez-les pour une simulation fiable.": "). Fix them for a reliable simulation.",
  "Snowball Pro — Simulateur patrimonial (épargne, fiscalité, retraite)":
    "Snowball Pro — French wealth simulator (savings, tax, retirement)",
  "l'onglet": "the",
  "les réglages": "the settings",
  "Une erreur est survenue": "An error occurred",
  "Une erreur est survenue dans « {label} »": "An error occurred in “{label}”",
  "L'application a rencontré un problème imprévu dans cette zone. Rechargez pour repartir sur de bonnes bases — vos réglages sont enregistrés sur cet appareil.":
    "The app hit an unexpected problem in this area. Reload to start fresh — your settings are saved on this device.",
  Recharger: "Reload",
  "Exporter la simulation": "Export the simulation",
  "Options d'export": "Export options",

  // ─── Barre d'actions ────────────────────────────────────────────────────────
  "Annuler (⌘Z)": "Undo (⌘Z)",
  "Annuler la dernière modification": "Undo last change",
  Annuler: "Cancel",
  "Rétablir (⌘⇧Z)": "Redo (⌘⇧Z)",
  "Rétablir la modification annulée": "Redo undone change",
  Rétablir: "Redo",
  "Passer en mode clair": "Switch to light mode",
  "Passer en mode sombre": "Switch to dark mode",
  Clair: "Light",
  Sombre: "Dark",
  "Autres actions": "More actions",
  "Quitter la comparaison": "Exit comparison",
  "Comparer deux scénarios": "Compare two scenarios",
  "Lien copié !": "Link copied!",
  "Partager la simulation": "Share simulation",
  "notions techniques visibles": "technical concepts visible",
  "notions techniques masquées": "technical concepts hidden",
  "Revenir aux réglages par défaut ? Vos simulations et snapshots de cet espace seront effacés.":
    "Reset to default settings? Your simulations and snapshots in this workspace will be erased.",
  Réinitialiser: "Reset",
  "Tout réinitialiser": "Reset everything",
  // ─── Partage (boutons réseaux — v6.13.0) ───────────────────────────────────
  Partager: "Share",
  "Partager sur X (Twitter)": "Share on X (Twitter)",
  "Partager sur WhatsApp": "Share on WhatsApp",
  "Partager sur LinkedIn": "Share on LinkedIn",
  "Votre scénario est pré-rempli dans le lien partagé.": "Your scenario is pre-filled in the shared link.",
  "Ma simulation d'épargne avec Snowball Pro — gratuit, sans inscription, données 100 % locales.":
    "My savings projection with Snowball Pro — free, no signup, 100% local data.",
  avertissement: "warning",
  avertissements: "warnings",

  // ─── Export ────────────────────────────────────────────────────────────────
  Exporter: "Export",
  "Export CSV": "CSV export",
  "Tableau année par année": "Year-by-year table",
  "Export JSON": "JSON export",
  "Paramètres + résultats bruts": "Settings + raw results",
  "Rapport PDF": "PDF report",
  "Rapport patrimonial de synthèse — imprimer ou enregistrer en PDF": "Summary wealth report — print or save as PDF",
  "Créé avec Snowball Pro — simulez gratuitement votre propre projet d'épargne :":
    "Made with Snowball Pro — simulate your own savings plan for free:",
  "Votre scénario partageable :": "Your shareable scenario:",

  // ─── Échelles de valeurs ───────────────────────────────────────────────────
  "sur le compte": "on the account",
  "sur le compte en {year}": "on the account in {year}",
  "en euros d'aujourd'hui": "in today's euros",
  "Valeur brute": "Gross value",
  "Net fiscal": "After-tax value",
  "Impôt théorique": "Theoretical tax",
  "Total épargné": "Total saved",
  "Gains de la bourse": "Stock market gains",

  // ─── Raccourcis chiffrés courants ──────────────────────────────────────────
  "{n} an": "{n} year",
  "{n} ans": "{n} years",
  "{n} mois": "{n} months",
  "/an": "/year",
  "/mois": "/month",
  "par an": "per year",
  "par mois": "per month",
  "Euros courants": "Current euros",
  "Euros d'aujourd'hui": "Today's euros",
  Année: "Year",
  Date: "Date",
  Annee: "Year",
  "Total Verse": "Total Paid",
  Interets: "Interest",
  "Valeur Nominale": "Nominal Value",
  "Valeur Reelle": "Real Value",
  "Net Fiscal": "Net After Tax",
  "Total versé": "Total contributed",
  Intérêts: "Interest",
  "Valeur nominale": "Nominal value",
  Versements: "Contributions",
  Frais: "Fees",
  Capital: "Capital",
  Épargné: "Saved",
  "Gains bourse": "Market gains",
  "Après impôt théorique": "After theoretical tax",
  "En € d'aujourd'hui": "In today's €",

  // ─── Enveloppes fiscales ───────────────────────────────────────────────────
  "Compte-titres ordinaire": "Ordinary securities account",
  "Plan d'épargne en actions": "Stock savings plan (PEA)",
  "Assurance-vie": "Life insurance (AV)",
  "PER / PERIN": "PER / PERIN",
  "Sans fiscalité": "No tax",
  "Projection avant impôts": "Pre-tax projection",
  "Versements déductibles (TMI) à l'entrée, sortie allégée":
    "Deductible contributions (tax bracket) on entry, lighter taxation on exit",
  "Impôt unique de 31,4 % sur vos gains": "Single flat tax of 31.4% on your gains",
  "Après 5 ans : 18,6 % de cotisations sociales seulement": "After 5 years: only 18.6% social contributions",
  "Après 8 ans : abattement, puis 7,5 % + cotisations sociales":
    "After 8 years: allowance, then 7.5% + social contributions",

  // ─── Snapshots ─────────────────────────────────────────────────────────────
  "Aucun état sauvegardé": "No saved state",
  "Sauvegarder un snapshot": "Save a snapshot",
  "Supprimer ce snapshot": "Delete this snapshot",
  "Confirmer la suppression": "Confirm deletion",

  // ─── Scénarios de rendement ────────────────────────────────────────────────
  Prudent: "Conservative",
  Central: "Central",
  Optimiste: "Optimistic",
  "rendement réel composé": "real compounded return",
  "rendement géométrique composé": "geometric compounded return",
  "moyenne arithmétique": "arithmetic mean",
  "repli faible": "small drawdown",
  compromis: "balanced",
  "repli fort": "large drawdown",
  Équilibré: "Balanced",
  Audacieux: "Bold",

  // ─── Modèles de retrait (rente) ────────────────────────────────────────────
  "Règle des 4 %": "4% rule",
  "Retrait prudent de 4 %/an (Bengen)": "Conservative 4%/year withdrawal (Bengen)",
  "Très prudent": "Very conservative",
  "Retrait conservateur de 2,5 %/an": "Conservative 2.5%/year withdrawal",
  "Retrait dynamique de 5,5 %/an": "Dynamic 5.5%/year withdrawal",
  Personnalisé: "Custom",
  "Montant fixe mensuel choisi": "Chosen fixed monthly amount",
  "Modèle de retrait": "Withdrawal model",

  // ─── Stress tests historiques ──────────────────────────────────────────────
  "Choc pétrolier 1973-74": "Oil shock 1973-74",
  "−30 % puis −31 % deux années de suite, avec 9-14 % d'inflation (stagflation)":
    "−30% then −31% two years in a row, with 9-14% inflation (stagflation)",
  "Bulle internet 2000-03": "Dot-com bubble 2000-03",
  "Trois années de baisse consécutives (−6 %, −12 %, −33 %) après le pic":
    "Three consecutive down years (−6%, −12%, −33%) after the peak",
  "Crise financière 2008": "2008 financial crisis",
  "−37 % sur un an (GFC), la pire année de l'après-guerre": "−37% in one year (GFC), the worst post-war year",
  Survit: "Survives",
  Épuisé: "Depleted",

  // ─── Jalons ────────────────────────────────────────────────────────────────
  "Premier 100k": "First 100k",
  "500k investissables": "500k investable",
  "Cap du million": "Million mark",
  "Indépendance avancée": "Advanced independence",
  "Liberté financière": "Financial freedom",
  "Les gains dépassent les versements": "Gains exceed contributions",

  // ─── Fiscalité ─────────────────────────────────────────────────────────────
  "Votre impôt théorique (si vente totale)": "Your theoretical tax (if fully sold)",
  "Gains avant impôts (brut)": "Gains before tax (gross)",
  "Impôt sur versements PER déduits": "Tax on deducted PER contributions",
  "Cotisations sociales": "Social contributions",
  "Impôt sur le revenu": "Income tax",
  "Total impôt théorique": "Total theoretical tax",
  "Gains après impôts": "After-tax gains",
  Barème: "Progressive scale",

  // ─── KPI ───────────────────────────────────────────────────────────────────
  "Rendement net / an": "Net return / year",
  "Gain par risque": "Return per risk",
  "Multiplié par": "Multiplied by",
  "Pour doubler": "Time to double",
  "Après inflation": "After inflation",
  "Pire chute": "Worst drawdown",
  "Frais payés": "Fees paid",
  "Pouvoir d'achat conservé": "Purchasing power retained",

  // ─── Statistiques clés ─────────────────────────────────────────────────────
  "Statistiques clés": "Key statistics",
  "Votre capital en détail": "Your capital in detail",
  "Rendement brut appliqué": "Gross return applied",
  "net de frais": "after fees",
  "après inflation": "after inflation",
  "Frais débités au total": "Total fees deducted",
  "Capital perdu à cause des frais": "Capital lost to fees",

  // ─── Divers / UI générique ─────────────────────────────────────────────────
  Fermer: "Close",
  Aide: "Help",
  "Copier le lien": "Copy link",
  "Chargement…": "Loading…",
  "Tout replier": "Collapse all",
  "Tout déplier": "Expand all",
  "Replier les réglages": "Collapse settings",
  "Déplier les réglages": "Expand settings",
  Enregistré: "Saved",
  "Aucun résultat": "No results",
  Optionnel: "Optional",
  Recommandé: "Recommended",
  "{n} erreur": "{n} error",
  "{n} erreurs": "{n} errors",
  "{n} avertissement": "{n} warning",
  "{n} avertissements": "{n} warnings",
  "Mode Avancé": "Advanced mode",
  "Mode Débutant": "Beginner mode",
  "Médiane historique": "Historical median",
  "médiane historique": "historical median",
  "cible BCE": "ECB target",
  "médiane de la période": "period median",
  // ─── Sidebar ───────────────────────────────────────────────────────────────
  "Sections de réglages": "Settings sections",
  Réglages: "Settings",
  "Votre épargne": "Your savings",
  "Pourquoi ces chiffres ?": "Why these numbers?",
  "Compte d'investissement": "Investment account",
  "Votre profil": "Your profile",
  "Capital de départ (€)": "Starting capital (€)",
  "Épargne mensuelle (€)": "Monthly savings (€)",
  "Durée (années)": "Duration (years)",
  "Rendement de la bourse (MSCI World)": "Stock market return (MSCI World)",
  "Brut (moyenne des années)": "Gross (average of years)",
  "Composé (krachs inclus)": "Compounded (crashes included)",
  "Réel (après inflation 2,1 %)": "Real (after 2.1% inflation)",
  " %/an": " %/year",
  "Hypothèse d'inflation : ": "Inflation assumption: ",
  "2,1 %/an (cible BCE)": "2.1%/year (ECB target)",
  ", vs 4,0 % en moyenne réelle 1970-2025 — la médiane de la période est justement 2,1 %.":
    ", vs 4.0% actual average 1970-2025 — the period median is exactly 2.1%.",
  "Pourquoi 10,07 % → 5,99 % ? Chaque ligne retire": "Why 10.07% → 5.99%? Each line removes",
  "une seule": "one single",
  "chose :": "thing:",
  "la volatilité": "volatility",
  "(les mauvaises années -37 %, -33 %… réduisent le gain composé) puis":
    "(the bad years -37%, -33%… reduce the compounded gain) then",
  "l'inflation": "inflation",
  "(2,1 %/an). Le Simulateur applique le scénario choisi dans « Votre épargne » (défaut :":
    "(2.1%/year). The simulator applies the scenario chosen in “Your savings” (default:",
  "ligne composée) chaque année — courbe lissée, sans krachs.":
    "compounded line) every year — smooth curve, no crashes.",
  "Pourquoi pas 6,12 % (8,22 − 2,1) ? C'est une approximation : la formule exacte (Fisher) est":
    "Why not 6.12% (8.22 − 2.1)? That is an approximation: the exact formula (Fisher) is",
  " — l'inflation rogne aussi vos gains, pas seulement votre capital de départ.":
    " — inflation also eats into your gains, not just your starting capital.",
  "Augmentation de votre épargne (%/an)": "Increase of your savings (%/year)",
  "Votre épargne mensuelle augmente chaque année": "Your monthly savings increase every year",
  "Inflation annuelle (%)": "Annual inflation (%)",
  "défaut 2,1 %/an — taux personnalisé": "default 2.1%/year — custom rate",
  "Simulations Monte Carlo": "Monte Carlo simulations",
  "nombre de scénarios testés (Monte Carlo & Rente)": "number of scenarios tested (Monte Carlo & Annuity)",
  "Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout":
    "Highlights purchasing power — the account value stays visible everywhere",
  "Années de détention du PEA": "Years held (PEA)",
  "moins de 5 ans : PFU {rate}": "under 5 years: flat tax {rate}",
  "au-delà de 5 ans : taux réduit ({rate})": "after 5 years: reduced rate ({rate})",
  "Années de détention de l'AV": "Years held (AV)",
  "au-delà de 8 ans : abattement annuel": "after 8 years: annual allowance",
  "Fiscalité du CTO": "CTO taxation",
  "PFU : Prélèvement Forfaitaire Unique — {pfu} sur les gains ({social} de prélèvements sociaux + {ir} d'impôt sur le revenu), sans barème.":
    "PFU: single flat tax — {pfu} on gains ({social} social contributions + {ir} income tax), no progressive scale.",
  "impôt unique": "single flat tax",
  "{social} + impôt à votre TMI": "{social} + tax at your marginal rate",
  "Barème progressif :": "Progressive scale:",
  "de prélèvements sociaux + impôt sur le revenu à votre TMI de":
    "social contributions + income tax at your marginal rate of",
  "(réglage hérité du mode Avancé).": "(setting inherited from Advanced mode).",
  "Impôt unique de": "Single flat tax of",
  "sur vos gains (prélèvement forfaitaire) — pour le barème progressif, passez en mode Avancé.":
    "on your gains (flat tax) — for the progressive scale, switch to Advanced mode.",
  "Tranche marginale d'imposition (%)": "Marginal tax rate (%)",
  "Versements déduits à ce taux ; sortie : versements imposés à votre TMI (sans abattement de 10 %), gains au PFU":
    "Contributions deducted at this rate; exit: contributions taxed at your marginal rate (no 10% allowance), gains at flat tax",
  "Impôt appliqué à vos gains CTO (barème)": "Tax applied to your CTO gains (progressive scale)",
  "Fiscalité en couple": "Joint taxation (couple)",
  "Plafond de versements PEA doublé (300 000 €)": "PEA contribution cap doubled (€300,000)",
  "Âge actuel": "Current age",
  "Âge de départ à la retraite": "Retirement age",
  "Dépenses à la retraite (€/mois)": "Retirement expenses (€/month)",
  "Autres revenus à la retraite (€/mois)": "Other retirement income (€/month)",
  "utilisé pour situer votre retraite": "used to position your retirement",
  "votre rente démarre à cet âge": "your annuity starts at this age",
  "ce dont vous aurez besoin chaque mois (profil)": "what you will need each month (profile)",
  "pensions publiques, immobilier… s'ajoutent à votre rente": "public pensions, real estate… add to your annuity",
  "Tolérance au risque": "Risk tolerance",
  "Votre profil de risque sert à l'alerte « plan trop risqué » de l'onglet Rente (pire repli historique vs perte acceptée) et recalibre la perte maximale acceptée (Prudent 20 %, Équilibré 35 %, Audacieux 50 %).":
    "Your risk profile drives the “plan too risky” warning in the Annuity tab (worst historical drawdown vs accepted loss) and recalibrates the maximum accepted loss (Conservative 20%, Balanced 35%, Bold 50%).",
  "Perte maximale acceptée (%)": "Maximum accepted loss (%)",
  "le pire repli de bourse que vous acceptez de traverser": "the worst market drawdown you accept to go through",
  "Âge actuel ({ageNow}) + durée ({duration} ans) =": "Current age ({ageNow}) + duration ({duration} years) =",
  ", mais retraite prévue à": ", but retirement planned at",
  " — le capital de l'onglet Rente ne correspond pas à votre départ en retraite.":
    " — the Annuity tab capital does not match your retirement start.",
  "Votre projet": "Your project",
  "Projection sur": "Projection over",
  ". Capital final :": ". Final capital:",
  "sur le compte (fin de projet) ·": "on the account (end of project) ·",
  "en euros d'aujourd'hui.": "in today's euros.",
  "Votre épargne augmente de {pct} %/an.": "Your savings increase by {pct}%/year.",
  "Les rendements rejoués sont ceux du MSCI World (1970–2025).":
    "The returns replayed are those of the MSCI World (1970–2025).",

  // ─── QuickStart / Snapshots / divers ───────────────────────────────────────
  "Commencez ici — profils de départ": "Get started — starter profiles",
  "Commencez ici — choisissez un profil de départ": "Get started — pick a starter profile",
  "Fermer les profils de départ": "Close starter profiles",
  "Les réglages par défaut sont une situation type. Un profil ajuste tout en un clic — capital, versement, durée et enveloppe fiscale.":
    "The default settings are a typical situation. A profile adjusts everything in one click — capital, contribution, duration and tax wrapper.",
  "Capital final": "Final capital",
  "Utiliser ce profil": "Use this profile",
  "Premiers pas — à 25 ans": "Getting started — at 25",
  "Carrière — à 35 ans": "Career — at 35",
  "Horizon retraite — à 55 ans": "Retirement horizon — at 55",
  "10 k€ · 250 €/mois · 40 ans · PEA": "€10k · €250/month · 40 years · PEA",
  "30 k€ · 800 €/mois · 25 ans · CTO": "€30k · €800/month · 25 years · CTO",
  "100 k€ · 1 500 €/mois · 10 ans · AV": "€100k · €1,500/month · 10 years · AV",
  Snapshots: "Snapshots",
  Sauvegarder: "Save",
  "Aucun état sauvegardé. Figez un scénario pour le retrouver plus tard.":
    "No saved state. Freeze a scenario to find it later.",
  "Charger ce scénario": "Load this scenario",
  "Confirmer la suppression de {name}": "Confirm deleting {name}",
  "Confirmer ?": "Confirm?",
  "Mode Comparaison actif": "Comparison mode active",
  "Le panneau édite le Scénario B — A est figé tel qu'au lancement":
    "The panel edits Scenario B — A is frozen as it was at launch",
  "Onglets de simulation": "Simulation tabs",
  "Les simulations présentées sont hypothétiques et ne constituent pas un conseil financier.":
    "The simulations presented are hypothetical and do not constitute financial advice.",
  "Les performances passées ne garantissent pas les résultats futurs.":
    "Past performance does not guarantee future results.",
  "Les calculs utilisent des modèles mathématiques simplifiés et les impôts sont une":
    "The calculations use simplified mathematical models and taxes are an",
  estimation: "estimate",
  "fondée sur les règles fiscales en vigueur (liquidation théorique). Consultez un conseiller financier pour des décisions d'investissement.":
    "based on the tax rules in force (theoretical liquidation). Consult a financial adviser for investment decisions.",
  "Vos données sont enregistrées": "Your data is stored",
  "localement dans votre navigateur": "locally in your browser",
  "(localStorage) et ne quittent jamais votre appareil.": "(localStorage) and never leaves your device.",
  "Frais du fonds (ETF)": "Fund fees (ETF)",
  "Courtage sur chaque versement": "Brokerage on each contribution",
  "% par versement": "% per contribution",
  "Frais de gestion pilotée": "Managed management fees",
  // ─── Héro, synthèse, statistiques ──────────────────────────────────────────
  "Votre patrimoine estimé": "Your estimated wealth",
  "{n} ans · {year}": "{n} years · {year}",
  "en euros d'aujourd'hui (pouvoir d'achat)": "in today's euros (purchasing power)",
  "{a} % de votre capital provient de votre épargne, {b} % de la croissance de la bourse":
    "{a}% of your capital comes from your savings, {b}% from stock market growth",
  "Épargné :": "Saved:",
  "Gains de la bourse :": "Stock market gains:",
  "La croissance de la bourse représente": "Stock market growth represents",
  "de votre capital final": "of your final capital",
  "votre épargne est multipliée par": "your savings are multiplied by",
  "Votre capital repose pour l'instant sur votre épargne — la croissance s'ajoutera avec le temps.":
    "Your capital currently rests on your savings — growth will build up over time.",
  "Valeur réelle": "Real value",
  "Net fiscal ({env})": "After-tax ({env})",
  "avant impôts": "before taxes",
  "après impôts": "after taxes",
  "Aucun impôt à payer": "No tax to pay",
  "impôt théorique sur gains + versements": "theoretical tax on gains + contributions",
  "impôt théorique à la liquidation": "theoretical tax at liquidation",
  "Grands chiffres : {a} — petits chiffres : {b}": "Large figures: {a} — small figures: {b}",
  "€ d'aujourd'hui": "today's €",
  "Capital net (impôts déduits)": "Net capital (after tax)",
  "Part de la base PER imposable prise par l'impôt": "Share of the taxable PER base taken by tax",
  "Part de vos gains prise par les impôts": "Share of your gains taken by taxes",
  Estimation: "Estimate",
  " : ces impôts supposent que vous liquidez tous vos gains aujourd'hui. Les gains latents ne sont taxés qu'à la revente réelle.":
    ": these taxes assume you liquidate all your gains today. Unrealized gains are only taxed on an actual sale.",
  "Barème progressif (TMI)": "Progressive scale (marginal rate)",
  "Impôt unique (PFU)": "Single flat tax (PFU)",
  "Cotisations sociales seules": "Social contributions only",
  "Taux appliqué :": "Applied rate:",
  " %/an brut": " %/year gross",
  "(scénario": "(scenario",
  " % net de frais": " % after fees",
  " % après inflation": " % after inflation",
  " ans": " years",
  "XIRR de VOTRE projection : net de tous vos frais, avant impôts et inflation":
    "XIRR of YOUR projection: net of all your fees, before taxes and inflation",
  "rendement annuel moyen de votre épargne, après tous vos frais, avant impôts et inflation":
    "average annual return of your savings, after all your fees, before taxes and inflation",
  "net de frais et d'inflation : (1 + {a} %) ÷ (1 + {b} %) − 1 = {c} %":
    "after fees and inflation: (1 + {a}%) ÷ (1 + {b}%) − 1 = {c}%",
  "votre rendement après frais ET inflation : (1 + {a} %) ÷ (1 + {b} %) − 1 = {c} % — le pouvoir d'achat de votre épargne":
    "your return after fees AND inflation: (1 + {a}%) ÷ (1 + {b}%) − 1 = {c}% — the purchasing power of your savings",
  "XIRR : le rendement annuel réellement obtenu par VOTRE projection, versements étalés dans le temps inclus, après tous vos frais et avant inflation.":
    "XIRR: the annual return actually achieved by YOUR projection, including contributions spread over time, after all your fees and before inflation.",
  "le gain obtenu pour chaque risque pris (Sharpe)": "the return earned for each unit of risk taken (Sharpe)",
  "capital final ÷ argent épargné": "final capital ÷ money saved",
  "années pour que votre capital double": "years for your capital to double",
  "la plus grosse baisse du capital en cours de route": "the largest capital decline along the way",
  "tous les frais cumulés sur la durée": "all fees accumulated over the period",
  "part de la valeur du capital restant après inflation": "share of the capital value left after inflation",
  "Le Simulateur applique chaque année le même taux de référence, choisi parmi trois scénarios. Monte Carlo et la Rente, eux, rejouent toujours l'historique réel année par année — leur médiane se calcule toute seule.":
    "The simulator applies the same reference rate every year, chosen among three scenarios. Monte Carlo and the Annuity, on the other hand, always replay the real history year by year — their median is computed on its own.",
  "Le taux le plus bas des trois : le rendement géométrique composé de l'historique, une fois l'inflation retirée (≈ 5,99 %/an pour le MSCI World). Un plancher honnête pour planifier sans dépendre de la chance.":
    "The lowest of the three: the geometric compounded return of history, once inflation is removed (≈5.99%/year for the MSCI World). An honest floor to plan without relying on luck.",
  "Le rendement que la bourse a VRAIMENT composé sur toute la période, krachs inclus (≈ 8,22 %/an pour le MSCI World). C'est la projection « médiane » : moins flatteuse que la moyenne arithmétique, mais plus honnête.":
    "The return the market ACTUALLY compounded over the whole period, crashes included (≈8.22%/year for the MSCI World). It is the “median” projection: less flattering than the arithmetic mean, but more honest.",
  "La moyenne arithmétique des années (≈ 10,07 %/an pour le MSCI World) : le taux moyen d'une année, pas le gain réellement composé. Les mauvaises années (-37 %…) pèsent davantage sur un compte réel que sur cette moyenne.":
    "The arithmetic mean of the years (≈10.07%/year for the MSCI World): the average rate of a year, not the actually compounded gain. Bad years (-37%…) weigh more on a real account than on this average.",
  "Projection centrale basée sur la": "Central projection based on the",
  "(rendement composé {rate}/an, krachs inclus) —": "(compounded return {rate}/year, crashes included) —",
  "pas sur la meilleure moyenne": "not on the best average",
  "Votre argent a rapporté plus que ce que vous avez mis de côté : {amount} proviennent de la croissance de la bourse.":
    "Your money has earned more than you set aside: {amount} come from stock market growth.",
  "{pct}% de votre capital provient de la croissance de la bourse, pas de votre épargne.":
    "{pct}% of your capital comes from stock market growth, not your savings.",
  "(XIRR après frais, avant inflation, versements inclus)":
    "(XIRR after fees, before inflation, contributions included)",
  "(après frais, avant inflation, versements inclus)": "(after fees, before inflation, contributions included)",
  "Votre rendement annuel de {r}% {label} dépasse le taux brut appliqué de {s}%/an (scénario {name}).":
    "Your annual return of {r}% {label} beats the applied gross rate of {s}%/year (scenario {name}).",
  "Votre rendement annuel de {r}% {label} reste sous le taux brut appliqué de {s}%/an (scénario {name}).":
    "Your annual return of {r}% {label} stays below the applied gross rate of {s}%/year (scenario {name}).",
  "Votre rendement annuel de {r}% {label} est proche du taux brut appliqué de {s}%/an (scénario {name}).":
    "Your annual return of {r}% {label} is close to the applied gross rate of {s}%/year (scenario {name}).",
  "Épargnez plus ou prolongez la durée : avec le temps, la bourse fait travailler votre argent (intérêts composés).":
    "Save more or extend the duration: over time, the market puts your money to work (compound interest).",
  "Analyse & conseils": "Analysis & advice",
  "Projections hypothétiques. Les performances passées ne préjugent pas des résultats futurs.":
    "Hypothetical projections. Past performance is no guarantee of future results.",
  "Ce que les frais vous coûtent": "What fees cost you",
  "Sans frais, votre capital final serait de": "Without fees, your final capital would be",
  "(au lieu de": "(instead of",
  "Aucun frais : votre croissance n'est pas rognée.": "No fees: your growth is not eroded.",
  "Les défauts réalistes sont 0,25 %/an d'ETF et 0,75 %/an d'assurance-vie — réglez-les dans les paramètres pour voir leur coût réel.":
    "Realistic defaults are 0.25%/year ETF fees and 0.75%/year life insurance — adjust them in the settings to see their real cost.",
  "{label} (saisie directe)": "{label} (direct entry)",
  "Valeur invalide": "Invalid value",
  "Valeur négative non acceptée": "Negative values are not accepted",
  "Limité au maximum ({max})": "Capped at the maximum ({max})",
  "Limité au minimum ({min})": "Capped at the minimum ({min})",

  // ─── Graphiques ────────────────────────────────────────────────────────────
  "Projection de votre capital": "Projection of your capital",
  "Projection de votre capital — montants par année": "Projection of your capital — amounts per year",
  "Gains (bourse)": "Gains (market)",
  "Argent épargné": "Money saved",
  "Impôts théoriques (liquidation)": "Theoretical taxes (liquidation)",
  "Courbes en euros d'aujourd'hui — sur le compte, le capital final serait de":
    "Curves in today's euros — on the account, the final capital would be",
  "Votre capital, année après année": "Your capital, year after year",
  "Votre capital année après année — P10, P50 et P90": "Your capital year after year — P10, P50 and P90",
  "Objectif visé :": "Target goal:",
  "{n} évolutions de bourse différentes testées · chaque ligne est un cas possible ·":
    "{n} different market evolutions tested · each line is one possible case ·",
  "en euros d'aujourd'hui (nets d'impôts et d'inflation)": "in today's euros (net of taxes and inflation)",
  "en euros courants (nets d'impôts)": "in current euros (net of taxes)",
  "Aujourd'hui": "Today",
  "Fourchette (pire – meilleur cas)": "Range (worst – best case)",
  "Bonne période de bourse (P90)": "Good market period (P90)",
  "Scénario moyen (P50)": "Median scenario (P50)",
  "Période difficile (P10)": "Hard period (P10)",
  Objectif: "Goal",
  "La bourse vous sourit — seul 1 cas sur 10 fait encore mieux":
    "The market smiles at you — only 1 case in 10 does even better",
  "Le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien":
    "The most common case: 1 time out of 2 better, 1 time out of 2 worse",
  "La bourse est décevante — seul 1 cas sur 10 fait encore moins bien":
    "The market disappoints — only 1 case in 10 does even worse",
  "Les baisses de votre capital": "Drawdowns of your capital",
  "Les baisses de votre capital en pourcentage": "Drawdowns of your capital as a percentage",
  "Les valeurs négatives = les moments où votre capital a baissé par rapport à son plus haut niveau (la « pire chute » est le point le plus bas de la courbe).":
    "Negative values = the moments your capital fell from its highest level (the “worst drawdown” is the lowest point of the curve).",
  "Avec la courbe lissée (rendement constant chaque année), votre capital ne baisse jamais d'une année sur l'autre : aucun creux à afficher. Les baisses restent visibles dans les onglets Monte Carlo et Rente.":
    "With the smoothed curve (constant yearly return), your capital never falls from one year to the next: nothing to display. Drawdowns remain visible in the Monte Carlo and Annuity tabs.",
  "Baisse du capital": "Capital drawdown",
  "Versements après fiscalité": "Contributions after tax",
  "Autres écarts arrondis": "Other rounding differences",
  "D'où vient votre argent ?": "Where does your money come from?",
  "net après liquidation théorique": "net after theoretical liquidation",
  "Capital total": "Total capital",
  "Projection comparée A vs B": "Comparison projection A vs B",
  "Projection comparée des scénarios A et B": "Comparison projection of scenarios A and B",
  "Scénario A": "Scenario A",
  "Scénario B": "Scenario B",

  // ─── Tableaux, jalons, histogramme, méthodologie, comparaison ──────────────
  "Vos étapes clés": "Your key milestones",
  "Épargnez plus ou allongez la durée pour atteindre vos premières étapes.":
    "Save more or extend the duration to reach your first milestones.",
  "Atteint dès aujourd'hui": "Reached today",
  "Atteint en année {year}": "Reached in year {year}",
  "Histogramme des issues : {total} cas répartis en {nb} classes de capital final entre {low} et {high}. La classe la plus fréquente contient {count} cas autour de {value}. La médiane est à {med}, la moyenne à {mean} (l'écart entre les deux reflète les cas très chanceux).":
    "Histogram of outcomes: {total} cases spread over {nb} final capital classes between {low} and {high}. The most frequent class contains {count} cases around {value}. The median is {med}, the mean {mean} (the gap between the two reflects the very lucky cases).",
  "{n} cas ({pct} %)": "{n} cases ({pct}%)",
  "méd.": "med.",
  "moy.": "avg.",
  "Médiane : {m} — 1 cas sur 2 fait mieux": "Median: {m} — 1 case in 2 does better",
  "Moyenne : {m} — tirée par la queue droite": "Mean: {m} — pulled by the right tail",
  "· La dernière barre regroupe aussi les cas au-delà de {max} (queue droite).":
    "· The last bar also groups cases beyond {max} (right tail).",
  "Rendement appliqué": "Applied return",
  "Rendement brut": "Gross return",
  "Rendement composé": "Compounded return",
  "Rendement réel": "Real return",
  "Projection & Monte Carlo": "Projection & Monte Carlo",
  Inflation: "Inflation",
  "Enveloppe fiscale": "Tax wrapper",
  "Rendement interne (XIRR)": "Internal return (XIRR)",
  "Devise & dividendes": "Currency & dividends",
  "Mise à jour": "Updated",
  "{rate}/an — le taux du scénario « {scenario} » choisi en haut de l'onglet, appliqué chaque année par la courbe lissée du Simulateur (défaut : Central = rendement composé ≈ 8,22 %/an)":
    "{rate}/year — the rate of the “{scenario}” scenario chosen at the top of the tab, applied every year by the simulator's smoothed curve (default: Central = compounded return ≈8.22%/year)",
  "{rate}/an — moyenne ARITHMÉTIQUE des années {name} (1970-2025) : le taux moyen d'une année, PAS ce que la bourse a réellement composé":
    "{rate}/year — ARITHMETIC mean of the {name} years (1970-2025): the average rate of a year, NOT what the market actually compounded",
  "{rate}/an — moyenne GÉOMÉTRIQUE de la série, krachs réels (-37 % en 2008, -33 % en 2002…) inclus : ce que la bourse a réellement rapporté en cumulé":
    "{rate}/year — GEOMETRIC mean of the series, real crashes (-37% in 2008, -33% in 2002…) included: what the market actually returned in total",
  "{rate}/an — formule de Fisher : (1 + {comp}) ÷ (1 + {infl}) − 1. Pas une simple soustraction : l'inflation rogne aussi vos gains, pas seulement le capital":
    "{rate}/year — Fisher formula: (1 + {comp}) ÷ (1 + {infl}) − 1. Not a simple subtraction: inflation also eats into your gains, not just the capital",
  "{rate}/an — le rendement composé une fois l'inflation déduite (le pouvoir d'achat de votre capital)":
    "{rate}/year — the compounded return once inflation is removed (the purchasing power of your capital)",
  "Le Simulateur applique le scénario choisi chaque année (courbe lissée, sans krachs) ; Monte Carlo & la Rente rééchantillonnent l'historique réel par blocs de 5 ans et rejouent ses krachs":
    "The simulator applies the chosen scenario every year (smoothed curve, no crashes); Monte Carlo & the Annuity resample the real history in 5-year blocks and replay its crashes",
  "Série historique réelle": "Real historical series",
  "Dynamique autour de {rate} %/an": "Dynamic around {rate}%/year",
  "{rate} %/an fixe": "Fixed {rate}%/year",
  "{name} — taux et abattements de l'année fiscale {year} ({pfu} PFU CTO / {av} AV)":
    "{name} — rates and allowances of tax year {year} ({pfu} PFU CTO / {av} AV)",
  "Calculé sur les flux réels (capital initial + versements mensuels + valeur finale)":
    "Computed on the real cash flows (starting capital + monthly contributions + final value)",
  "{rate} % ETF": "{rate}% ETF",
  "{rate} % par versement (courtage)": "{rate}% per contribution (brokerage)",
  "{rate} % assurance": "{rate}% insurance",
  "{rate} % gestion": "{rate}% management",
  "Aucun frais": "No fees",
  "Euros (EUR) — indice capitalisant : les dividendes sont réinvestis dans l'indice (MSCI World), aucun dividende séparé":
    "Euros (EUR) — total-return index: dividends are reinvested in the index (MSCI World), no separate dividends",
  "Taux de l'année fiscale {year} · historique MSCI World 1970-2025 · règle de rééchantillonnage : bootstrap par blocs non chevauchants de 5 ans":
    "Tax year {year} rates · MSCI World history 1970-2025 · resampling rule: non-overlapping 5-year block bootstrap",
  "Méthodologie & hypothèses": "Methodology & assumptions",
  "Les impôts affichés sont une": "The taxes displayed are an",
  "fondée sur la législation fiscale en vigueur (prélèvement forfaitaire unique, abattements assurance-vie, cotisations sociales et règles simplifiées du PER) et modélisée comme une liquidation théorique à la fin de la projection. Les gains latents ne sont taxés qu'à la revente réelle — les montants « après impôts » sont donc une projection, pas une réalité comptable.":
    "based on the tax legislation in force (single flat tax, life insurance allowances, social contributions and simplified PER rules) and modeled as a theoretical liquidation at the end of the projection. Unrealized gains are only taxed on an actual sale — “after-tax” amounts are therefore a projection, not an accounting reality.",
  "net fiscal final · {scale}": "final after-tax · {scale}",
  "€ courants": "current €",
  "Écart (B − A)": "Gap (B − A)",
  Égal: "Equal",
  "aucune différence": "no difference",
  "{pct} par rapport à A": "{pct} vs A",
  "Avec votre épargne actuelle": "With your current savings",
  "Objectif visé : {target} — capital projeté avec votre épargne : {current}":
    "Goal: {target} — projected capital with your savings: {current}",
  "Calendrier des flux": "Cash flow calendar",
  "Capital initial": "Starting capital",
  Totaux: "Totals",
  "Impôts non cumulables : somme théorique si liquidation chaque année — pas un impôt réel":
    "Non-accumulable taxes: theoretical sum if liquidating each year — not a real tax",
  "« Versements » = capital initial (ligne « Départ ») + épargne mensuelle. Les impôts correspondent à l'impôt théorique si le portefeuille était liquidé à chaque date ; ils ne sont pas des impôts cumulés réellement payés et ne deviennent dus qu'à la revente — leur total n'est donc pas affiché (non cumulable). Seuls les versements et les frais se cumulent.":
    "“Contributions” = starting capital (the “Start” row) + monthly savings. Taxes correspond to the theoretical tax if the portfolio were liquidated at each date; they are not actually paid accumulated taxes and only become due upon sale — their total is therefore not displayed (non-accumulable). Only contributions and fees accumulate.",

  // ─── Onglet Rente & Retraite (décaissement) ────────────────────────────────
  "Simulation de décaissement & rente": "Withdrawal & annuity simulation",
  "Analysez la soutenabilité de vos retraits sur": "Check how sustainable your withdrawals are over",
  "via une simulation Monte-Carlo.": "using a Monte-Carlo simulation.",
  "La rente n'est pas garantie — les performances passées ne préjugent pas des résultats futurs.":
    "The annuity is not guaranteed — past performance does not predict future results.",
  "Profil :": "Profile:",
  "Capital à décumuler": "Capital to withdraw",
  "Brut en fin d'accumulation — après impôts de sortie :": "Gross at end of accumulation — after exit taxes:",
  "Capital initial (aucune simulation)": "Initial capital (no simulation yet)",
  "La rente est calculée sur le brut ; chaque retrait n'est imposé que sur sa part de gains.":
    "The annuity is calculated on the gross amount; each withdrawal is only taxed on its share of gains.",
  "{n} ans au départ de la retraite": "{n} years at retirement start",
  "{n} ans à la fin de la rente": "{n} years at the end of the annuity",
  "Un krach de −{pct} % frappe chaque scénario en année {year} de la retraite (partir en période difficile).":
    "A crash of −{pct}% hits every scenario in year {year} of retirement (retiring in a difficult period).",
  "Quel modèle choisir ?": "Which model should you choose?",
  "La règle des 4 %": "The 4% rule",
  "est le standard historique (Bengen) : elle a tenu sur toutes les périodes de 30 ans testées.":
    "is the historical standard (Bengen): it held through every 30-year period tested.",
  "sacrifie du confort pour la sécurité, pendant que": "trades comfort for safety, while",
  "convient si vous pouvez réduire vos retraits les mauvaises années. Le mode":
    "fits if you can cut withdrawals in bad years. The",
  "teste le montant exact que vous visez.": "mode tests the exact amount you are targeting.",
  "Rente mensuelle initiale": "Initial monthly annuity",
  "Montant fixe": "Fixed amount",
  "Montant de la rente fixe en euros par mois": "Fixed annuity amount in euros per month",
  soit: "i.e.",
  mois: "month",
  an: "year",
  ans: "years",
  "indexée sur l'inflation": "inflation-indexed",
  "Durée de la rente": "Annuity duration",
  "Durée de la rente en années": "Annuity duration in years",
  "Indexer sur l'inflation": "Index to inflation",
  "Préserve le pouvoir d'achat": "Preserves purchasing power",
  "Partir en période difficile": "Retire in a difficult period",
  "Simule un krach au moment et à l'intensité de votre choix":
    "Simulates a crash at the time and intensity of your choice",
  "Le krach frappe après": "The crash hits after",
  "dès le début": "right away",
  "Années avant le krach": "Years before the crash",
  "Année 1": "Year 1",
  "Intensité du krach": "Crash intensity",
  "Intensité du krach en pourcentage": "Crash intensity as a percentage",
  "Chaque scénario subit cette chute la même année — le « et si le départ tombait en pleine crise ? » appliqué à 100 % des cas, pas seulement au cas pessimiste.":
    "Every scenario takes this hit in the same year — the “what if retirement fell right into a crisis?” applied to 100% of cases, not just the pessimistic one.",
  Paramètres: "Parameters",
  "Calcul... {progress}%": "Computing... {progress}%",
  "{progress}% — interface fluide pendant le calcul": "{progress}% — the UI stays smooth while computing",
  Réduire: "Collapse",
  "Votre capital pendant la retraite — P10, P50 et P90": "Your capital during retirement — P10, P50 and P90",
  "/mois) — il manque": "/month) — you are short",
  "Lancer la simulation Monte-Carlo": "Run the Monte-Carlo simulation",
  "Tolérance au risque dépassée :": "Risk tolerance exceeded:",
  "le pire repli historique de votre indice est de": "the worst historical drawdown of your index is",
  ", au-delà de votre tolérance de": ", beyond your tolerance of",
  "Ce plan peut être": "This plan may be",
  "trop risqué pour vous": "too risky for you",
  "— envisagez une part plus prudente (obligations, livrets) ou un taux de retrait plus faible.":
    "— consider a more cautious allocation (bonds, savings accounts) or a lower withdrawal rate.",
  "Risque maîtrisé :": "Risk under control:",
  "le pire repli historique de votre indice": "the worst historical drawdown of your index",
  "reste dans votre tolérance de": "stays within your tolerance of",
  "Votre projection s'arrête à": "Your projection ends at",
  "âge actuel": "current age",
  durée: "duration",
  "et votre retraite est prévue à": "and your retirement is planned at",
  "Le capital à décumuler correspond à": "The capital to withdraw corresponds to",
  "un âge": "an age",
  antérieur: "earlier",
  postérieur: "later",
  "à votre départ — allongez la durée ou avancez la retraite pour que le capital projeté couvre la rente.":
    "than your retirement date — extend the duration or move retirement earlier so the projected capital covers the annuity.",
  "à votre départ — les": "than your retirement date — the",
  "{n} dernières années de projection ne servent pas à la rente.":
    "the last {n} years of projection do not serve the annuity.",
  "Fiabilité & sûreté des estimations": "Reliability & safety of the estimates",
  "Incertitude des paramètres": "Parameter uncertainty",
  "La moyenne et la volatilité du marché sont des estimations, pas des vérités : chaque scénario tire les siennes. Élargit honnêtement le taux de survie.":
    "The market mean and volatility are estimates, not truths: each scenario draws its own. Honestly widens the survival rate.",
  "Historique étendu (100 ans)": "Extended history (100 years)",
  "Rejoue 100 ans de rendements réels (1929, 1931, 1933…) au lieu des 56 dernières années : plus de krachs testés.":
    "Replays 100 years of real returns (1929, 1931, 1933…) instead of the last 56 years: more crashes tested.",
  "Inflation stochastique": "Stochastic inflation",
  "L'indexation rejoue l'inflation française réelle 1970-2025 (pics à 13,7 % en 1974) au lieu d'un taux fixe.":
    "Indexation replays real French inflation 1970-2025 (peaks at 13.7% in 1974) instead of a fixed rate.",
  "Garde-fous dynamiques (Guyton–Klinger)": "Dynamic guardrails (Guyton–Klinger)",
  "Après une année boursière négative, la rente de l'année suivante est réduite de 10 % — sauve la majorité des cas de ruine.":
    "After a negative market year, the next year's annuity is cut by 10% — saves most cases of ruin.",
  "Ces 4 options sont actives par défaut : elles rendent les estimations plus honnêtes (bandes plus larges, taux de survie plus crédibles). Désactivez-les pour comparer avec le comportement historique simple.":
    "These 4 options are on by default: they make the estimates more honest (wider bands, more credible survival rates). Turn them off to compare with the simple historical behavior.",
  "Paramètres modifiés depuis le lancement — relancez la simulation pour mettre à jour les résultats.":
    "Settings changed since the run — re-run the simulation to update the results.",
  "Et si vous partiez en pleine crise ?": "What if you retired right into a crisis?",
  "(scénarios réels 1973 · 2000 · 2008)": "(real scenarios 1973 · 2000 · 2008)",
  "Voir le détail": "See details",
  "Votre rente est sûre": "Your annuity is safe",
  "Votre rente est risquée": "Your annuity is risky",
  Excellente: "Excellent",
  Correcte: "Fair",
  Risquée: "Risky",
  "Nous avons rejoué votre plan": "We replayed your plan",
  fois: "times",
  ", avec des évolutions de bourse différentes à chaque fois. Résultat : votre rente de":
    ", with different market paths each time. Result: your annuity of",
  "est payée jusqu'au bout dans": "is paid to the end in",
  "des cas.": "of cases.",
  "Krach simulé :": "Simulated crash:",
  "En clair :": "In plain words:",
  "quand un plan échoue, l'argent manque généralement autour de l'année":
    "when a plan fails, money generally runs out around year",
  "— les autres années, la rente est versée sans interruption pendant":
    "— in other years, the annuity is paid without interruption for",
  "ans.": "years.",
  dans: "in",
  "100 % des simulations": "100% of simulations",
  ", votre rente est payée jusqu'au bout — et il reste toujours de l'argent à la fin.":
    ", your annuity is paid to the end — and there is always money left at the finish.",
  "Basé sur": "Based on",
  scénarios: "scenarios",
  "100 ans": "100 years",
  "56 ans": "56 years",
  "d'historique réel · fiscalité des retraits incluse (enveloppe":
    "of real history · withdrawal taxes included (envelope",
  "Sans fiscalité :": "Without taxation:",
  "l'enveloppe choisie est « BRUT » — aucun impôt n'est prélevé sur les retraits. La rente affichée est donc la rente brute.":
    "the chosen envelope is “GROSS” — no tax is withheld on withdrawals. The displayed annuity is therefore the gross annuity.",
  "Rente nette :": "Net annuity:",
  "après impôt sur les retraits (enveloppe": "after withdrawal taxes (envelope",
  "), vous recevez en moyenne": "), you receive on average",
  "euros courants": "current euros",
  "Au total :": "In total:",
  "d'impôts et": "in taxes and",
  "de frais de gestion payés pendant toute la retraite (la rente brute reste":
    "in management fees paid over the whole retirement (the gross annuity stays",
  "/mois).": "/month).",
  "Revenus couverts :": "Income covered:",
  "votre rente nette": "your net annuity",
  "plus vos autres revenus": "plus your other income",
  couvrent: "covers",
  "de vos dépenses prévues": "of your planned expenses",
  "Manque à couvrir :": "Shortfall to cover:",
  "rente nette": "net annuity",
  "autres revenus": "other income",
  "il manque": "you are short",
  "Montants en": "Amounts in",
  "non corrigés de l'inflation": "not adjusted for inflation",
  "l'accumulation affichait les deux échelles, le décaissement est projeté en valeur nominale du compte.":
    "accumulation showed both scales; decumulation is projected at the account's nominal value.",
  "Votre rente": "Your annuity",
  "par mois, pendant {n} ans (brute, sans fiscalité)": "per month, for {n} years (gross, no taxation)",
  "par mois (brute) — net ≈ {n}/mois après impôt": "per month (gross) — net ≈ {n}/month after tax",
  "La rente dure-t-elle ?": "Does the annuity last?",
  "≈ {n} cas sur 100": "≈ {n} cases out of 100",
  "Capital épuisé (si échec)": "Capital depleted (if it fails)",
  "Année {n}": "Year {n}",
  Jamais: "Never",
  "l'argent manque vers l'année {n} dans les cas défavorables": "money runs out around year {n} in unfavorable cases",
  "le capital résiste dans 100 % des cas": "capital holds up in 100% of cases",
  "Capital restant": "Remaining capital",
  "reste à la fin dans le scénario moyen (sur {n} ans)": "left at the end in the median scenario (over {n} years)",
  "Ce taux de survie n'est pas un point exact : sur": "This survival rate is not an exact point: over",
  "simulations, il se situe en réalité entre": "simulations, it actually lies between",
  et: "and",
  "intervalle de confiance à 95 %": "95% confidence interval",
  "La moyenne des capitaux finaux": "The mean of final capitals",
  "est tirée par quelques cas très chanceux — planifiez sur la médiane.":
    "is pulled up by a few very lucky cases — plan on the median.",
  "Distribution des capitaux finaux": "Distribution of final capitals",
  "0 € = capital épuisé": "€0 = capital depleted",
  "0 € = rente stoppée": "€0 = annuity stopped",
  "Comment lire ?": "How to read it?",
  "évolutions de bourse différentes testées · chaque ligne est un cas possible":
    "different market paths tested · each line is a possible outcome",
  "Pourquoi ce graphique ?": "Why this chart?",
  "Personne ne peut prédire l'avenir de la bourse. Nous avons donc rejoué votre plan":
    "No one can predict the market's future. So we replayed your plan",
  "fois, avec des évolutions différentes, pour voir dans quels cas votre argent dure jusqu'au bout.":
    "times, with different paths, to see in which cases your money lasts to the end.",
  "Ligne dorée (scénario moyen)": "Golden line (median scenario)",
  "le cas le plus courant. Une fois sur deux, votre résultat est meilleur ; une fois sur deux, il est moins bon.":
    "the most common case. Half the time your result is better; half the time it is worse.",
  "Zone jaune pâle": "Pale yellow zone",
  "votre vrai résultat se situera probablement quelque part entre la ligne verte et la ligne rouge.":
    "your real result will probably lie somewhere between the green line and the red line.",
  "Ligne verte (bonne période de bourse)": "Green line (good market period)",
  "la bourse vous sourit. Seul 1 cas sur 10 fait encore mieux.":
    "the market smiles at you. Only 1 case out of 10 does even better.",
  "Ligne rouge (période difficile)": "Red line (hard period)",
  "la bourse est décevante. Seul 1 cas sur 10 fait encore moins bien.":
    "the market disappoints. Only 1 case out of 10 does even worse.",
  "Quand une ligne touche 0 €": "When a line touches €0",
  "dans ce scénario, tout le capital a été dépensé avant la fin — la rente s'arrête.":
    "in this scenario, all the capital was spent before the end — the annuity stops.",
  "Astuce : regardez surtout si la ligne rouge tient jusqu'à la fin de votre retraite. Si oui, votre plan résiste même quand la bourse est mauvaise.":
    "Tip: mainly check whether the red line holds until the end of your retirement. If it does, your plan holds up even when the market is bad.",
  "Lancez la simulation Monte-Carlo": "Run the Monte-Carlo simulation",
  "Analysez sur des centaines de scénarios stochastiques la viabilité de votre stratégie de décaissement.":
    "Check the viability of your withdrawal strategy across hundreds of stochastic scenarios.",
  "Commencez par simuler une phase d'accumulation dans l'onglet Simulateur pour disposer d'un capital à décumuler.":
    "Start by simulating an accumulation phase in the Simulator tab to have capital to withdraw.",
  "Les percentiles ci-dessus mélangent toutes les époques. Ici, nous rejouons":
    "The percentiles above mix all eras. Here, we replay",
  "les trois pires fenêtres historiques telles qu'elles se sont réellement déroulées":
    "the three worst historical windows exactly as they actually unfolded",
  "(rendements contigus réels, inflation réelle de l'époque, garde-fous et indexation appliqués à l'identique).":
    "(real contiguous returns, real inflation of the era, guardrails and indexation applied identically).",
  "Aucun hasard : c'est exactement ce que la bourse a fait. Pour un krach au moment de votre choix, utilisez l'option":
    "No randomness: this is exactly what the market did. For a crash at a time of your choosing, use the",
  "dans les paramètres.": "option in the settings.",
  "0 €": "€0",
  "Perte max": "Max loss",
  "(pic → creux)": "(peak → trough)",
  "Rente stoppée en {n}": "Annuity stopped in {n}",
  "Rente versée jusqu'au bout": "Annuity paid to the end",
  "Rendements réels rejoués :": "Real returns replayed:",
  "Capital le plus bas": "Lowest capital",
  "Total retiré sur la période": "Total withdrawn over the period",

  // ─── Compléments divers (sidebar, formulaires, onglets) ────────────────────
  "Frais de l'assurance-vie": "Life insurance fees",
  Snapshot: "Snapshot",
  "Paramètres avancés": "Advanced settings",
  "Capital net": "Net capital",
  "Scénario de rendement": "Return scenario",
  "Tableau comparatif annuel": "Annual comparison table",
  "Graphiques détaillés": "Detailed charts",
  "Fiscalité détaillée": "Detailed taxation",
  "Détail année par année": "Year-by-year detail",
  "Voir le détail annuel": "See annual details",

  // ─── Onglet Objectif d'épargne ─────────────────────────────────────────────
  "Objectif d'épargne": "Savings goal",
  "Vous savez combien vous voulez avoir plus tard : l'app calcule combien épargner chaque mois (et quel rendement de la bourse viser) pour y arriver.":
    "You know how much you want later: the app calculates how much to save each month (and what market return to target) to get there.",
  "Utiliser mon scénario principal": "Use my main scenario",
  "Reprend le capital, la durée, l'épargne et le rendement (scénario courant) de l'onglet Simulateur — l'objectif n'est plus une calculatrice séparée.":
    "Takes the capital, duration, savings and return (current scenario) from the Simulator tab — the goal is no longer a separate calculator.",
  "Objectif (€)": "Goal (€)",
  "Synchronisé avec le Simulateur": "Synced with the Simulator",
  "Capital :": "Capital:",
  "Durée :": "Duration:",
  "Épargne :": "Savings:",
  "Rendement :": "Return:",
  "Rendement de la bourse (% brut)": "Market return (% gross)",
  "Rendement BRUT = rendement réel du marché avant inflation (ex. MSCI World : 8,22 %/an brut — scénario Central par défaut). L'inflation est déduite automatiquement par le simulateur, QUE l'affichage soit en euros courants ou en euros d'aujourd'hui — ne saisissez jamais un taux déjà net d'inflation.":
    "GROSS return = the market's actual return before inflation (e.g. MSCI World: 8.22%/year gross — Central scenario by default). Inflation is deducted automatically by the simulator, whether the display is in current euros or today's euros — never enter a rate already net of inflation.",
  "Épargne de référence : {x}/mois": "Reference savings: {x}/month",
  "Épargne mensuelle de référence (€)": "Reference monthly savings (€)",
  "utilisée pour calculer le rendement nécessaire": "used to compute the required return",
  Rendement: "Return",
  brut: "gross",
  "(avant inflation) — référence :": "(before inflation) — reference:",
  "{rate} % brut (scénario Central)": "{rate}% gross (Central scenario)",
  " · taux recommandé :": " · recommended rate:",
  "{min} à {max} %/an": "{min} to {max}%/year",
  "Épargne mensuelle nécessaire": "Required monthly savings",
  "Pour atteindre": "To reach",
  en: "in",
  "avec un rendement de": "with a return of",
  "et un capital de départ de": "and a starting capital of",
  "(hypothèses du scénario principal)": "(main scenario assumptions)",
  "Total épargné :": "Total saved:",
  "Rendement nécessaire ({x}/mois d'épargne)": "Required return ({x}/month of savings)",
  Impossible: "Impossible",
  "Rendement de la bourse nécessaire chaque année pour obtenir": "Market return needed every year to get",
  "en épargnant": "while saving",
  "avec un capital initial de": "with an initial capital of",
  "Comparaison des scénarios": "Scenario comparison",
  "objectif : {goal}": "goal: {goal}",
  "Rendement/an": "Return/year",
  "Épargne /mois": "Savings /month",
  "Part de l'objectif épargnée": "Share of the goal saved",
  "{pct}% de l'objectif provient de votre épargne": "{pct}% of the goal comes from your savings",
  "Versement nécessaire selon la bourse (Monte Carlo)": "Required contribution by market (Monte Carlo)",
  "objectif : {goal} — {n} ans, capital {capital}": "goal: {goal} — {n} years, capital {capital}",
  "Combien faut-il épargner chaque mois pour atteindre l'objectif selon la période de bourse ? Le calcul rejoue":
    "How much should you save each month to reach the goal depending on the market period? The calculation replays",
  "scénarios rééchantillonnés à chaque itération, avec": "resampled scenarios at each iteration, with",
  vos: "your",
  "frais,": "fees,",
  votre: "your",
  "fiscalité et": "tax and",
  "capital de départ": "starting capital",
  "Calculer le versement pour P10 / P50 / P90": "Compute the contribution for P10 / P50 / P90",
  "{progress}% — 3 percentiles × 14 itérations (P90 → P50 → P10)":
    "{progress}% — 3 percentiles × 14 iterations (P90 → P50 → P10)",
  "Bonne période (P90)": "Good period (P90)",
  "1 cas sur 10 fait encore mieux — le minimum si la bourse vous sourit":
    "Only 1 case out of 10 does even better — the minimum if the market smiles at you",
  "Cas médian (P50)": "Median case (P50)",
  "1 fois sur 2 mieux, 1 fois sur 2 moins bien — le versement honnête":
    "Half the time better, half the time worse — the honest contribution",
  "1 cas sur 10 fait encore moins bien — pour réussir même dans les pires cas":
    "Only 1 case out of 10 does even worse — to succeed even in the worst cases",
  "Votre capital de départ suffit déjà dans ce scénario — aucun versement nécessaire.":
    "Your starting capital is already enough in this scenario — no contribution needed.",
  "Le versement": "The contribution",
  "est votre meilleure cible : dans la moitié des scénarios il suffit, dans l'autre moitié il manque un peu. Le versement":
    "is your best target: in half the scenarios it suffices, in the other half it falls a little short. The contribution",
  "garantit l'objectif même dans les pires périodes — c'est le « budget sécurité ». Recalculez après avoir changé vos paramètres.":
    "guarantees the goal even in the worst periods — it's the “safety budget”. Recompute after changing your settings.",

  // ─── Onglet Monte Carlo ────────────────────────────────────────────────────
  "Mauvaise période de bourse (P10)": "Bad market period (P10)",
  "P10 = percentile 10 : seuls 10 % des scénarios finissent avec MOINS que ce montant. C'est le cas défavorable — 9 fois sur 10, vous ferez mieux.":
    "P10 = 10th percentile: only 10% of scenarios end with LESS than this amount. It's the unfavorable case — 9 times out of 10 you'll do better.",
  "P50 = la médiane : dans la moitié des scénarios le capital final est supérieur, dans l'autre moitié il est inférieur. Planifiez sur ce chiffre.":
    "P50 = the median: in half the scenarios the final capital is higher, in the other half lower. Plan on this number.",
  "P90 = percentile 90 : 90 % des scénarios finissent avec MOINS que ce montant. C'est le cas favorable — ne le planifiez pas comme certitude.":
    "P90 = 90th percentile: 90% of scenarios end with LESS than this amount. It's the favorable case — don't plan on it as a certainty.",
  "Simulation de Monte Carlo": "Monte Carlo simulation",
  "L'avenir de la bourse est imprévisible : nous testons donc votre plan":
    "The market's future is unpredictable: so we test your plan",
  "{n} fois": "{n} times",
  ", en rééchantillonnant les": ", by resampling the",
  "rendements réels passés": "real past returns",
  "de l'indice": "of the index",
  "(les krachs et les bull markets réels sont rejoués). Vous verrez le résultat de votre capital dans une":
    "(real crashes and bull markets are replayed). You'll see your capital's outcome in a",
  mauvaise: "bad",
  une: "an",
  moyenne: "average",
  "et une": "and a",
  bonne: "good",
  "période de bourse.": "market period.",
  "Lancer {n} simulations": "Run {n} simulations",
  "Fiabilité du modèle": "Model reliability",
  "La moyenne 10,07 % et la volatilité ne sont PAS des vérités connues : chaque scénario tire les siennes autour des estimations historiques (Pástor–Stambaugh). Élargit honnêtement P10 et P90.":
    "The 10.07% mean and volatility are NOT known truths: each scenario draws its own around the historical estimates (Pástor–Stambaugh). Honestly widens P10 and P90.",
  "Rejoue 100 ans de rendements réels (S&P 500 1926-1969 + MSCI World 1970-2025) au lieu de 56 : les krachs de 1929, 1931, 1933 sont rejoués.":
    "Replays 100 years of real returns (S&P 500 1926-1969 + MSCI World 1970-2025) instead of 56: the crashes of 1929, 1931, 1933 are replayed.",
  "Testez votre plan dans {n} situations de bourse différentes": "Test your plan in {n} different market situations",
  "{n} scénarios": "{n} scenarios",
  "{years} d'historique réel": "{years} of real history",
  "fiscalité française incluse": "French taxation included",
  Montants: "Amounts",
  "nets d'impôts": "net of taxes",
  "(liquidation théorique) — les cartes ci-dessous suivent le toggle « Euros d'aujourd'hui » (la valeur du compte reste affichée en dessous), comme les cartes de l'onglet Projection.":
    "(theoretical liquidation) — the cards below follow the “Today's euros” toggle (the account value stays displayed below), like the cards of the Projection tab.",
  "Chances d'atteindre votre objectif": "Chances of reaching your goal",
  "dont {pct} % en pouvoir d'achat réel": "of which {pct}% in real purchasing power",
  "sur {n} cas, le capital final atteint au moins": "out of {n} cases, the final capital reaches at least",
  "en euros courants — et dans": "in current euros — and in",
  "des cas, ce même objectif en": "of cases, this same goal in",
  "(après inflation).": "(after inflation).",
  "Précision : {a} % ± {b} pt (intervalle de confiance à 95 %)": "Precision: {a}% ± {b} pt (95% confidence interval)",
  cas: "cases",
  "L'écart entre la": "The gap between the",
  médiane: "median",
  "(cas le plus courant) et la": "(most common case) and the",
  "montre la « queue de chance » : quelques cas très heureux tirent la moyenne vers le haut. Planifiez sur la médiane, pas sur la moyenne.":
    "shows the “lucky tail”: a few very fortunate cases pull the mean upward. Plan on the median, not the mean.",
  "Paramètres modifiés depuis le lancement — relancez pour mettre à jour.":
    "Settings changed since the run — re-run to update.",
  "1 cas sur 10 fait encore moins bien": "Only 1 case out of 10 does even worse",
  "le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien":
    "the most common case: half the time better, half the time worse",
  "1 cas sur 10 fait encore mieux": "Only 1 case out of 10 does even better",
  "euros d'aujourd'hui": "today's euros",

  // ─── Rapport patrimonial (PDF) ─────────────────────────────────────────────
  "Capital de départ": "Starting capital",
  "Épargne mensuelle": "Monthly savings",
  Durée: "Duration",
  Enveloppe: "Envelope",
  "brut/an": "gross/year",
  "à la liquidation": "at liquidation",
  "Rapport généré le": "Report generated on",
  à: "at",
  "Simulation non contractuelle": "Non-contractual simulation",
  "Rapport patrimonial de synthèse": "Summary wealth report",
  "Croissance :": "Growth:",
  "de votre capital final — votre épargne est multipliée par": "of your final capital — your savings are multiplied by",
  "Paramètres de la simulation": "Simulation settings",
  "Snowball Pro — snowball-pro.vercel.app · Données 100 % locales, aucun chiffre ne quitte votre appareil":
    "Snowball Pro — snowball-pro.vercel.app · 100% local data, no figure leaves your device",
  Synthèse: "Summary",
  "Projection sur {n} ans": "Projection over {n} years",
  "Projection jusqu'en {year}": "Projection until {year}",
  scénario: "scenario",
  "Rendement net / an (XIRR)": "Net return / year (XIRR)",
  "Rendement réel / an": "Real return / year",
  "Capital multiplié par": "Capital multiplied by",
  "Projection de votre capital (euros courants)": "Projection of your capital (current euros)",
  "Pouvoir d'achat": "Purchasing power",
  "Fiscalité — {env}": "Taxation — {env}",
  "Part des gains prise par les impôts": "Share of gains taken by taxes",
  "Estimation : ces impôts supposent une liquidation totale aujourd'hui. Les gains latents ne sont taxés qu'à la revente réelle.":
    "Estimate: these taxes assume a full liquidation today. Unrealized gains are only taxed on an actual sale.",
  Versé: "Paid in",
  "Capital (€)": "Capital (€)",
  Méthodologie: "Methodology",
  "100 ans d'histoire boursière réelle": "100 years of real market history",
  "La projection applique le scénario": "The projection applies the",
  "(courbe lissée, sans hasard).": "(smoothed curve, no randomness).",
  "Fiscalité française appliquée": "French taxation applied",
  "prélèvements sociaux, PFU ou barème progressif, abattements — règles 2026.":
    "social contributions, PFU or progressive scale, allowances — 2026 rules.",
  "Inflation de {rate}/an": "Inflation of {rate}/year",
  "retirée pour l'échelle « euros d'aujourd'hui » (formule de Fisher, jamais une simple soustraction).":
    "removed for the “today's euros” scale (Fisher formula, never a simple subtraction).",
  "jusqu'à": "up to",
  "scénarios Monte Carlo rééchantillonnés": "resampled Monte Carlo scenarios",
  "onglet « Robustesse de votre plan »": "the “Plan robustness” tab",
  "et garde-fous dynamiques (Guyton–Klinger) pour la rente.":
    "and dynamic guardrails (Guyton–Klinger) for the annuity.",
  "Simulation indicative et non contractuelle — ne constitue pas un conseil financier. Les résultats dépendent des hypothèses saisies (capital, épargne, durée, frais, scénario). Données 100 % locales.":
    "Indicative, non-contractual simulation — not financial advice. Results depend on the entered assumptions (capital, savings, duration, fees, scenario). 100% local data.",

  // ─── Landing page ──────────────────────────────────────────────────────────
  "réel, après inflation": "real, after inflation",
  "krachs inclus · défaut": "crashes included · default",
  "moyenne des années": "average of years",
  "Scénario de rendement de la démo": "Return scenario of the demo",
  Fonctionnalités: "Features",
  Scénarios: "Scenarios",
  "Capital en détail, clarifié": "Your capital in detail, clarified",
  "Icône Google": "Google icon",
  "L'inflation, sans détour": "Inflation, straight to the point",
  "Graphiques lus d'un coup d'œil": "Charts read at a glance",
  "La valeur finale de chaque courbe s'affiche en bout de tracé, sans survol — avec un point or sur les gains. Palette unifiée entre camembert et courbes, légendes en chips, axes et infobulles harmonisés.":
    "Each curve's final value shows at the end of the line, without hovering — with a gold dot on gains. Unified palette between pie and curves, chip legends, harmonized axes and tooltips.",
  "Capital en détail": "Capital in detail",
  "Les 4 cartes de synthèse deviennent un panneau titré « Votre capital en détail » : colonnes séparées, gains de la bourse en or, une seule légende d'échelle — le bloc s'intègre enfin entre le héro et le graphique.":
    "The 4 summary cards become a titled “Your capital in detail” panel: separate columns, market gains in gold, a single scale legend — the block finally fits between the hero and the chart.",
  "Rythme uniformisé": "Uniform rhythm",
  "Espacements verticaux harmonisés sur une seule échelle — moins d'air entre les sections, héro et colonnes alignés en haut, même respiration sur tous les écrans.":
    "Vertical spacing harmonized on a single scale — less air between sections, hero and columns aligned at the top, same breathing room on every screen.",
  "PER : versements déduits à votre TMI à l'entrée, sortie imposée selon la nature des fonds.":
    "PER: contributions deducted at your marginal tax rate on the way in, taxed on the way out depending on the funds.",
  "Snowball Pro — simulateur patrimonial français : projection d'épargne, fiscalité CTO PEA AV PER, Monte Carlo et rente retraite":
    "Snowball Pro — French wealth simulator: savings projection, CTO PEA AV PER taxation, Monte Carlo and retirement annuity",
  "Fiscalité française 2026 · 100 ans d'historique réel": "French 2026 taxation · 100 years of real history",
  "Combien peut valoir votre épargne dans 25 ans ?": "How much could your savings be worth in 25 years?",
  "Combien peut valoir votre épargne": "How much could your savings be worth",
  "dans 25 ans": "in 25 years",
  "Votre nombre magique, c'est le capital final de votre épargne — calculé sur 100 ans de vraie histoire boursière, krachs inclus. En 30 secondes, sans inscription, sur votre appareil.":
    "Your magic number is the final capital of your savings — computed on 100 years of real market history, crashes included. In 30 seconds, no sign-up, on your device.",
  "Voir la méthode": "See the method",
  "Vos données restent sur cet appareil": "Your data stays on this device",
  "Des chiffres réels, pas des promesses : chaque nombre de cette page est calculé en direct par le moteur, sur les vrais rendements MSCI World 1970-2025 — krachs inclus, fiscalité française 2026.":
    "Real numbers, not promises: every figure on this page is computed live by the engine, on the real MSCI World 1970-2025 returns — crashes included, French 2026 taxation.",
  "Simulation par défaut — démo réelle": "Default simulation — real demo",
  "d'historique réel — S&P 500 1926-1969 + MSCI World 1970-2025":
    "of real history — S&P 500 1926-1969 + MSCI World 1970-2025",
  "scénarios Monte Carlo — P10, P50, P90 et probabilité de succès":
    "Monte Carlo scenarios — P10, P50, P90 and success probability",
  "enveloppes fiscales françaises : CTO, PEA, AV, PER": "French tax envelopes: CTO, PEA, AV, PER",
  "local — calculé sur votre appareil, zéro serveur": "local — computed on your device, zero server",
  "Quatre onglets, une question : où va votre argent ?": "Four tabs, one question: where does your money go?",
  "Projection, robustesse, rente & retraite, objectif inversé — chaque outil répond à un besoin précis, sur les mêmes données réelles.":
    "Projection, robustness, annuity & retirement, reverse goal — each tool answers a specific need, on the same real data.",
  "Projection lissée": "Smoothed projection",
  "Votre capital année après année, sans hasard : une courbe claire, avec le pouvoir d'achat en euros d'aujourd'hui toujours visible — et la décomposition épargne / croissance dès l'ouverture.":
    "Your capital year after year, without randomness: a clear curve, with purchasing power in today's euros always visible — and the savings / growth breakdown from the start.",
  "L'historique réel rejoué par blocs sur 10 000 scénarios : P10, P50, P90, probabilité de succès et histogramme des capitaux finaux — planifiez sur la médiane, pas la moyenne.":
    "Real history replayed in blocks over 10,000 scenarios: P10, P50, P90, success probability and final capitals histogram — plan on the median, not the mean.",
  "Garde-fous dynamiques, inflation réelle INSEE, stress tests 1973 · 2000 · 2008, et le scénario « et si le départ tombait en pleine crise ? ».":
    "Dynamic guardrails, real INSEE inflation, stress tests 1973 · 2000 · 2008, and the “what if retirement fell right into a crisis?” scenario.",
  "Fiscalité française": "French taxation",
  "CTO, PEA, AV, PER : PFU, barème, TMI, abattements — les règles 2026 appliquées à la lettre, y compris la durée de détention du PEA.":
    "CTO, PEA, AV, PER: PFU, progressive scale, marginal tax rate, allowances — the 2026 rules applied to the letter, including the PEA holding period.",
  "Objectif inversé": "Reverse goal",
  "« Combien investir pour atteindre X € ? » — l'épargne mensuelle nécessaire est calculée en une seconde, avec une jauge d'atteignabilité.":
    "“How much to invest to reach X €?” — the required monthly savings is computed in a second, with a reachability gauge.",
  "Lien de partage de votre scénario, comparaison A/B, snapshots, annuler/rétablir, export CSV, JSON et rapport PDF.":
    "Scenario sharing link, A/B comparison, snapshots, undo/redo, CSV, JSON and PDF report export.",
  "Trois scénarios, un seul moteur": "Three scenarios, one engine",
  "Le même historique réel rejoué trois fois. L'app applique le Central par défaut — changez de monde en un clic, les chiffres suivent.":
    "The same real history replayed three times. The app applies Central by default — switch worlds in one click, the numbers follow.",
  "Le monde réel, après inflation": "The real world, after inflation",
  "Chaque année, le rendement réel composé de l'historique (déflaté de l'inflation) : votre plan tient-il même sans la bourse au sec ?":
    "Every year, the historical real compounded return (deflated for inflation): does your plan hold even without the market helping?",
  "Central · défaut": "Central · default",
  "La géométrie, krachs inclus": "The geometry, crashes included",
  "La moyenne géométrique du MSCI World, 2000, 2008 et 2022 inclus. C'est le scénario appliqué par défaut : la projection honnête, pas la meilleure moyenne.":
    "The geometric mean of the MSCI World, 2000, 2008 and 2022 included. It's the default scenario: the honest projection, not the best average.",
  "La moyenne des années": "The average of years",
  "La moyenne arithmétique des années boursières : le haut de la fourchette. Utile pour l'imaginer — mais les krachs ne se lissent pas.":
    "The arithmetic mean of the market years: the top of the range. Useful to imagine it — but crashes don't smooth out.",
  Fiscalité: "Taxation",
  "Quatre enveloppes, leurs vraies règles": "Four envelopes, their real rules",
  "Le moteur applique les régimes réels — pas d'approximation : votre impôt dépend de l'enveloppe, de la durée de détention et de votre TMI.":
    "The engine applies the real regimes — no approximation: your tax depends on the envelope, the holding period and your marginal tax rate.",
  "Plan d'épargne retraite": "Retirement savings plan",
  "Versements déduits à votre TMI à l'entrée, sortie imposée selon la nature des fonds. L'arbitrage se voit dans le héro.":
    "Contributions deducted at your marginal tax rate on the way in, taxed on the way out depending on the funds. The trade-off shows in the hero.",
  "— la moyenne des années": "— the average of years",
  Composé: "Compounded",
  défaut: "default",
  "moyenne géométrique": "geometric mean",
  "pour connaître votre pouvoir d'achat réel": "to know your real purchasing power",
  Réel: "Real",
  "— après inflation": "— after inflation",
  "l'inflation rogne aussi vos gains, pas seulement votre capital de départ.":
    "inflation also erodes your gains, not just your starting capital.",
  "Hypothèse d'inflation :": "Inflation assumption:",
  "vs 4,0 % en moyenne réelle 1970-2025. La médiane de la période est justement 2,1 % : la moyenne est tirée vers le haut par les chocs des années 1970-1985.":
    "vs 4.0% real average 1970-2025. The period median is exactly 2.1%: the mean is pulled upward by the shocks of the 1970-1985 years.",
  "Sources : S&P 500 SBBI 1926-1969 · MSCI World 1970-2025 · inflation française INSEE 1970-2025.":
    "Sources: S&P 500 SBBI 1926-1969 · MSCI World 1970-2025 · French INSEE inflation 1970-2025.",
  "Capital de départ, versement mensuel, durée.": "Starting capital, monthly contribution, duration.",
  "CTO, PEA, AV ou PER, avec votre fiscalité.": "CTO, PEA, AV or PER, with your taxation.",
  "Le résultat d'abord": "The result first",
  "Capital final, épargne vs croissance, robustesse.": "Final capital, savings vs growth, robustness.",
  "Le moteur à l'œuvre sur des situations types — les chiffres sont calculés, pas illustrés.":
    "The engine at work on typical situations — the numbers are computed, not illustrated.",
  "Moteur réel — versements et durées indiqués sur chaque carte, frais et fiscalité inclus, scénario Central. Ajustez tout cela dans l'app : c'est votre situation qui compte, pas un exemple.":
    "Real engine — contributions and durations shown on each card, fees and taxation included, Central scenario. Adjust it all in the app: your situation is what matters, not an example.",
  "Questions fréquentes": "Frequently asked questions",
  "Mes données sont-elles envoyées sur un serveur ?": "Are my data sent to a server?",
  "Non, l'application fonctionne intégralement sans compte. Un compte vous permet d'isoler vos simulations de celles des autres utilisateurs de l'appareil et prépare la synchronisation future.":
    "No, the app works fully without an account. An account lets you isolate your simulations from those of other users of the device and prepares future sync.",
  "Prudent, Central, Optimiste : c'est quoi la différence ?":
    "Conservative, Central, Optimistic: what's the difference?",
  "Pourquoi 2,1 % d'inflation et pas la moyenne réelle ?": "Why 2.1% inflation and not the real average?",
  "Jusqu'à 10 000 scénarios qui rejouent l'historique réel par blocs — krachs et bull markets inclus. Vous obtenez les percentiles P10/P50/P90, la probabilité de succès et l'intervalle de confiance de cette estimation.":
    "Up to 10,000 scenarios replaying the real history in blocks — crashes and bull markets included. You get the P10/P50/P90 percentiles, the success probability and the confidence interval of this estimate.",
  "Dernières éditions": "Latest releases",
  "Mobile 100 % — résultat d'abord": "100% mobile — results first",
  "Sur téléphone, le simulateur affiche d'abord le capital final et les onglets (les réglages passent en dessous), le bandeau « Commencez ici » devient compact et défilant, les champs ne déclenchent plus le zoom iOS et les boutons sont plus faciles à toucher. Le site est aussi prêt pour une future app iOS (Capacitor).":
    "On phones, the simulator now shows the final capital and tabs first (settings move below), the “Get started” banner is compact and swipeable, input fields no longer trigger iOS zoom, and buttons are easier to tap. The site is also ready for a future iOS app (Capacitor).",
  "4 pages alternatives + page tarifs": "4 comparison pages + pricing page",
  "Quatre comparatifs honnêtes (Portfolio Visualizer, FireCalc, Networthify, Quantalys) et une page Tarifs « 100 % gratuit » — indexées au sitemap, dans llms.txt et liées depuis le pied de page de la landing.":
    "Four honest comparisons (Portfolio Visualizer, FireCalc, Networthify, Quantalys) and a “100% free” pricing page — indexed in the sitemap, in llms.txt and linked from the landing footer.",
  "Voyez où va votre épargne,": "See where your savings go,",
  "Quelques secondes suffisent — gratuit, sans inscription, sans envoyer vos données nulle part.":
    "A few seconds is all it takes — free, no sign-up, no data sent anywhere.",
  "Aucune inscription requise — vos données ne quittent pas cet appareil.":
    "No sign-up required — your data never leaves this device.",
  "Snowball Pro fournit des simulations pédagogiques basées sur des données historiques réelles — il ne constitue pas un conseil en investissement. Les performances passées ne préjugent pas des performances futures. Vos données restent stockées localement sur votre appareil.":
    "Snowball Pro provides educational simulations based on real historical data — it is not investment advice. Past performance does not predict future results. Your data stays stored locally on your device.",
  "© 2026 Snowball Pro · v6.16.0 · Données 100 % locales · Fait avec les rendements réels, pas des promesses.":
    "© 2026 Snowball Pro · v6.16.0 · 100% local data · Made with real returns, not promises.",
  "Onglets nets sur mobile": "Clean tabs on mobile",
  "Correction mobile : les onglets du simulateur ne débordent plus de l'écran sur téléphone — « Robustesse de votre plan » passe proprement à la ligne au lieu de déborder, même à 320 px.":
    "Mobile fix: the simulator tabs no longer overflow the screen on phones — “Plan robustness” now wraps cleanly instead of overflowing, even at 320px.",
  "Partagez votre simulation en un clic": "Share your simulation in one click",
  "Boutons de partage X, WhatsApp et LinkedIn avec votre scénario pré-rempli dans le lien (UTM par canal pour mesurer chaque source), pied de rapport PDF « Créé avec Snowball Pro » + lien du scénario, et 3 guides SEO qui arrivent de Google : simulateur PEA, PEA ou assurance vie, intérêts composés.":
    "X, WhatsApp and LinkedIn share buttons with your scenario pre-filled in the link (per-channel UTM to measure each source), a “Made with Snowball Pro” footer + scenario link on the PDF report, and 3 SEO guides coming from Google: PEA simulator, PEA vs life insurance, compound interest.",
  "L'application en anglais 🇬🇧": "The app in English 🇬🇧",
  "Un bouton FR/EN (en-tête de l'app et de la landing) traduit toute l'application en anglais : simulateur, Monte Carlo, rente, objectif, rapport PDF et landing — avec le formatage des montants adapté (€1,234.56 au lieu de 1 234,56 €).":
    "An FR/EN button (in the app and landing headers) translates the whole app into English: simulator, Monte Carlo, annuity, goal, PDF report and landing — with amounts formatted accordingly (€1,234.56 instead of 1 234,56 €).",
  "Projection du capital sur la durée par défaut : la courbe nominale monte de 0 à un capital final, la courbe en euros d'aujourd'hui suit en dessous.":
    "Capital projection over the default duration: the nominal curve rises from 0 to a final capital, the today's-euros curve follows below.",
  "Capital final ({year}) :": "Final capital ({year}):",
  Croissance: "Growth",

  // ─── Messages de validation (affichés via tr au lieu du moteur) ────────────
  "Le capital initial ne peut pas être négatif": "Starting capital cannot be negative",
  "Capital initial très élevé : limité à 100 M€ pour le calcul":
    "Very high starting capital: capped at €100M for the calculation",
  "Le versement mensuel ne peut pas être négatif": "Monthly contribution cannot be negative",
  "Versement mensuel très élevé : limité à 200 k€/mois pour le calcul":
    "Very high monthly contribution: capped at €200k/month for the calculation",
  "La durée doit être d'au moins 1 an": "Duration must be at least 1 year",
  "La durée maximale est de 80 ans : valeur limitée pour le calcul":
    "Maximum duration is 80 years: value capped for the calculation",
  "Inflation anormalement basse (<-10%)": "Abnormally low inflation (<-10%)",
  "Inflation anormalement élevée (>100%)": "Abnormally high inflation (>100%)",
  "Les frais ne peuvent pas être négatifs": "Fees cannot be negative",
  "La tranche marginale d'imposition ne peut pas être négative": "Marginal tax rate cannot be negative",
  "TMI très élevée (>45 %) — vérifiez le barème en vigueur":
    "Very high marginal tax rate (>45%) — check the current scale",
  "Mode fiscal CTO invalide (PFU ou barème progressif)": "Invalid CTO tax mode (PFU or progressive scale)",
  "L'objectif doit être supérieur à 0": "The goal must be greater than 0",
  "Nombre de simulations limité à la fourchette 100-10 000 pour le calcul":
    "Simulation count capped to the 100-10,000 range for the calculation",
  "Durée de la rente limitée à la fourchette 1-60 ans pour le calcul":
    "Annuity duration capped to the 1-60 year range for the calculation",
  "Robustesse du plan": "Plan robustness",
  "Résultat principal de la projection": "Main projection result",
  "Atteignable (livrets, obligations)": "Achievable (savings accounts, bonds)",
  "Marché actions diversifié": "Diversified stock market",
  "Très ambitieux": "Very ambitious",
  "Objectif irréaliste": "Unrealistic goal",

  // ─── Auth (compte local) ───────────────────────────────────────────────────
  "Votre nom est requis.": "Your name is required.",
  "L'adresse email est requise.": "Email address is required.",
  "Au moins 8 caractères.": "At least 8 characters.",
  "Les deux mots de passe ne correspondent pas.": "The two passwords do not match.",
  "8 caractères minimum, avec une lettre et un chiffre": "At least 8 characters, with a letter and a digit",
  "Mot de passe solide ✓": "Strong password ✓",
  "Votre nom": "Your name",
  "Ex. Marie Dupont": "e.g. Marie Dupont",
  "Adresse email": "Email address",
  "Mot de passe": "Password",
  "Confirmer le mot de passe": "Confirm password",
  "Créer mon compte": "Create my account",
  "Déjà un compte ?": "Already have an account?",
  "Votre mot de passe": "Your password",
  "Pas encore de compte ?": "No account yet?",
  "Créer un compte": "Create an account",
  Bienvenue: "Welcome",
  "Connectez-vous pour retrouver vos simulations.": "Log in to find your simulations.",
  "Créez votre compte": "Create your account",
  "Vos simulations, isolées sur cet appareil — gratuit et sans engagement.":
    "Your simulations, isolated on this device — free and no commitment.",
  "Retour à l'accueil": "Back to home",
  "Vos identifiants et vos simulations restent": "Your credentials and simulations stay",
  "sur cet appareil": "on this device",
  "aucune donnée n'est envoyée sur un serveur.": "no data is sent to a server.",
  "Masquer le mot de passe": "Hide password",
  "Afficher le mot de passe": "Show password",
  "Compte de {name}": "Account of {name}",
  "Compte invité — se connecter": "Guest account — log in",
  "Menu du compte": "Account menu",
  "Compte invité — vos simulations restent sur cet appareil. Créer un compte ne transfère rien en ligne : il crée des espaces de simulation séparés et protégés par mot de passe, pour plusieurs projets sur le même appareil.":
    "Guest account — your simulations stay on this device. Creating an account transfers nothing online: it creates separate, password-protected simulation spaces for several projects on the same device.",
  "Changer le mot de passe": "Change password",
  "Se déconnecter": "Log out",
  "Supprimer mon compte": "Delete my account",
  Retour: "Back",
  "Mot de passe modifié ✓": "Password changed ✓",
  "Mot de passe actuel": "Current password",
  "Nouveau mot de passe": "New password",
  Confirmer: "Confirm",
  "Mettre à jour": "Update",
  "Les deux nouveaux mots de passe ne correspondent pas.": "The two new passwords do not match.",
  "Saisissez votre mot de passe pour confirmer.": "Enter your password to confirm.",
  "Supprimer le compte": "Delete account",
  "et toutes ses simulations sur cet appareil seront définitivement supprimés. Cette action est irréversible.":
    "and all its simulations on this device will be permanently deleted. This action is irreversible.",
  "Je comprends, continuer": "I understand, continue",
  "Supprimer définitivement": "Delete permanently",
  "Compte introuvable.": "Account not found.",
  "Le mot de passe actuel est incorrect.": "The current password is incorrect.",
  "Le nouveau mot de passe doit être différent de l'actuel.":
    "The new password must be different from the current one.",
  "Le mot de passe est requis.": "Password is required.",
  "Email ou mot de passe incorrect.": "Incorrect email or password.",
  "Un compte existe déjà avec cette adresse email.": "An account already exists with this email address.",
  "Cette adresse email est trop longue.": "This email address is too long.",
  "Adresse email invalide (ex. nom@domaine.fr).": "Invalid email address (e.g. name@domain.com).",
  "Au moins une lettre et un chiffre.": "At least one letter and one digit.",
  "60 caractères maximum.": "60 characters maximum.",
  "128 caractères maximum.": "128 characters maximum.",
  "PEA : {rate} de cotisations sociales après 5 ans de détention, plafond 150 000 €.":
    "PEA: {rate} social contributions after 5 years of holding, €150,000 cap.",
  "AV : abattement annuel de 4 600 € (9 200 € en couple) après 8 ans de détention.":
    "AV: annual allowance of €4,600 (€9,200 as a couple) after 8 years of holding.",
  "CTO : impôt unique de {rate} sur les gains, ou barème progressif à votre TMI.":
    "CTO: flat {rate} tax on gains, or progressive scale at your marginal tax rate.",
  "Snowball Pro — accueil": "Snowball Pro — home",
  "Navigation principale": "Main navigation",
  "Se connecter": "Log in",
  "Calculer mon nombre magique": "Calculate my magic number",
  Gratuit: "Free",
  "Sans inscription": "No sign-up",
  "en € d'aujourd'hui": "in today's €",
  "Chiffres clés": "Key figures",
  "Moteur réel — mêmes défauts que l'app (10 k€, 500 €/mois, 25 ans, CTO, frais inclus). Vos chiffres dans l'app, en changeant le scénario dans « Votre épargne ».":
    "Real engine — same defaults as the app (€10k, €500/month, 25 years, CTO, fees included). Your numbers in the app, by changing the scenario in “Your savings”.",
  Brut: "Gross",
  "%/an": "%/year",
  "on retire": "we remove",
  "— les krachs réels (2000, 2008, 2022…) réduisent le gain réellement composé":
    "— the real crashes (2000, 2008, 2022…) reduce the actually compounded gain",
  "— krachs inclus": "— crashes included",
  "formule de Fisher": "Fisher formula",
  "Pourquoi pas 6,12 % (8,22 − 2,1) ? La soustraction simple est une approximation : la formule exacte de Fisher est":
    "Why not 6.12% (8.22 − 2.1)? Simple subtraction is an approximation: the exact Fisher formula is",
  "Non. Tout est calculé et stocké dans votre navigateur (localStorage) : aucune donnée ne quitte votre appareil. Un compte crée un espace isolé pour vos simulations sur cet appareil — la synchronisation cloud n'existe pas encore.":
    "No. Everything is computed and stored in your browser (localStorage): no data ever leaves your device. An account creates an isolated space for your simulations on this device — cloud sync does not exist yet.",
  "Trois lectures du même historique (MSCI World 1970-2025). L'app applique par défaut le Central : la moyenne géométrique composée (≈ 8,22 %/an), krachs inclus. L'Optimiste est la moyenne arithmétique des années (≈ 10,07 %), le Prudent le rendement réel après inflation (≈ 5,99 %). Comparez votre plan dans les trois mondes — c'est la même échelle que la section Méthodologie.":
    "Three readings of the same history (MSCI World 1970-2025). The app applies Central by default: the compounded geometric mean (≈ 8.22%/year), crashes included. Optimistic is the arithmetic mean of the years (≈ 10.07%), Conservative the real return after inflation (≈ 5.99%). Compare your plan in all three worlds — it's the same scale as the Methodology section.",
  "10,07 % est la moyenne arithmétique des années (scénario Optimiste) ; l'app applique par défaut le Central, 8,22 %/an composé. 6,12 serait la simple soustraction 8,22 − 2,1 : c'est une approximation. La formule exacte de Fisher est (1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %/an réel — le scénario Prudent.":
    "10.07% is the arithmetic mean of the years (Optimistic scenario); the app applies Central by default, 8.22%/year compounded. 6.12 would be the simple subtraction 8.22 − 2.1: that's an approximation. The exact Fisher formula is (1 + 8.22%) ÷ (1 + 2.1%) − 1 = 5.99%/year real — the Conservative scenario.",
  "2,1 % est une hypothèse d'inflation future (proche de la cible BCE de 2 %), pas la moyenne historique : l'inflation française réelle 1970-2025 est de 4,0 % en moyenne, mais cette moyenne est tirée vers le haut par les chocs des années 1970-1985 (jusqu'à 13,7 % en 1974). La médiane de la période est justement 2,1 %, et depuis 1986 la moyenne n'est que de 1,9 % — pour l'avenir, 2,1 % est une hypothèse raisonnable, voire prudente.":
    "2.1% is a future inflation assumption (close to the ECB's 2% target), not the historical average: real French inflation 1970-2025 averages 4.0%, but that average is pulled upward by the shocks of the 1970-1985 years (up to 13.7% in 1974). The period median is exactly 2.1%, and since 1986 the average is only 1.9% — for the future, 2.1% is a reasonable, even conservative assumption.",
  "S&P 500 SBBI 1926-1969 (dividendes réinvestis) puis MSCI World 1970-2025 : la période récente est couverte par un indice mondial, l'ancienne par le marché américain, seul indice de référence fiable à l'époque. L'inflation utilisée est la série INSEE française.":
    "S&P 500 SBBI 1926-1969 (dividends reinvested) then MSCI World 1970-2025: the recent period is covered by a world index, the older one by the US market, the only reliable benchmark at the time. The inflation used is the French INSEE series.",
  "Oui. Gratuite, sans engagement et sans carte bancaire — aujourd'hui et demain.":
    "Yes. Free, no commitment and no credit card — today and tomorrow.",
  "avant de l'y mettre": "before you put it there",
  "Navigation pied de page": "Footer navigation",
  "Guides et comparatifs": "Guides & comparisons",
  "Simulateur PEA": "PEA simulator",
  "PEA ou assurance vie": "PEA vs life insurance",
  "Calcul des intérêts composés": "Compound interest calculator",
  "Portfolio Visualizer": "Portfolio Visualizer",
  FireCalc: "FireCalc",
  Networthify: "Networthify",
  Quantalys: "Quantalys",
  Tarifs: "Pricing",

  // ─── Onboarding v7 : tutoriel + questionnaire « Nouvelle simulation » ──────
  "Bienvenue — présentation de Snowball Pro": "Welcome — introduction to Snowball Pro",
  "Bienvenue sur Snowball Pro": "Welcome to Snowball Pro",
  "Votre épargne projetée dans l'avenir avec les vrais rendements de la bourse sur 100 ans — krachs compris. Des chiffres réels, expliqués simplement, sans promesse de rendement.":
    "Your savings projected into the future with real stock market returns over 100 years — crashes included. Real figures, explained simply, with no return promises.",
  "Un seul chiffre d'abord : votre nombre magique": "One number first: your magic number",
  "Chaque simulation affiche d'abord le capital final de votre épargne — et son pouvoir d'achat en euros d'aujourd'hui. C'est le point de départ de tout le reste.":
    "Each simulation first shows the final capital of your savings — and its purchasing power in today's euros. That's the starting point for everything else.",
  "Quatre onglets pour tout comprendre": "Four tabs to understand everything",
  "Projection : la courbe de votre épargne. Robustesse : votre plan résiste-t-il aux krachs ? Rente & Retraite : combien vivre de votre épargne. Combien investir : l'objectif inversé.":
    "Projection: your savings curve. Robustness: does your plan survive crashes? Annuity & Retirement: how much to live on from your savings. How much to invest: the reverse goal.",
  "Simple, gratuit, 100 % privé": "Simple, free, 100% private",
  "Pas d'inscription obligatoire. Vos données ne quittent jamais votre appareil. L'app fonctionne hors-ligne, en français comme en anglais.":
    "No account required. Your data never leaves your device. The app works offline, in French and English.",
  "C'est parti !": "Let's go!",
  "Quelques questions simples et Snowball Pro construit votre première simulation — rien à régler, tout est guidé.":
    "A few simple questions and Snowball Pro builds your first simulation — nothing to set, everything is guided.",
  "{current} sur {total}": "{current} of {total}",
  "Lancer ma première simulation": "Launch my first simulation",
  Suivant: "Next",
  "Nouvelle simulation — questionnaire guidé": "New simulation — guided questionnaire",
  "Question {current} sur {total}": "Question {current} of {total}",
  "Fermer le questionnaire": "Close the questionnaire",
  "Quel âge avez-vous ?": "How old are you?",
  "Cela nous aide à estimer votre horizon.": "This helps us estimate your time horizon.",
  Autre: "Other",
  "Votre âge": "Your age",
  "Avez-vous de l'argent épargné disponible pour investir ?": "Do you have savings available to invest?",
  "Capital déjà constitué : livret, compte courant, assurance-vie…":
    "Capital already built up: savings account, checking account, life insurance…",
  Oui: "Yes",
  "Non, je pars de zéro": "No, I'm starting from zero",
  "Combien pouvez-vous investir dès maintenant ?": "How much can you invest right now?",
  "Un ordre de grandeur suffit.": "A rough estimate is enough.",
  "Autre montant": "Another amount",
  "Montant à investir": "Amount to invest",
  "Combien pouvez-vous épargner chaque mois ?": "How much can you save each month?",
  "Ce que vous pouvez mettre de côté sans vous priver.": "What you can set aside without depriving yourself.",
  "Pour quel projet souhaitez-vous investir ?": "What project do you want to invest for?",
  "Le projet fixe un horizon conseillé — ajustable à l'étape suivante.":
    "The project sets a recommended horizon — adjustable at the next step.",
  Retraite: "Retirement",
  "Préparer vos vieux jours (30-40 ans)": "Prepare for your later years (30-40 years)",
  "Achat immobilier": "Real estate purchase",
  "Constituer un apport (10 ans)": "Build a down payment (10 years)",
  "Vivre de votre épargne (20 ans)": "Live off your savings (20 years)",
  "Épargne de précaution": "Emergency savings",
  "Un matelas de sécurité (5 ans)": "A safety cushion (5 years)",
  "Enrichissement personnel": "Personal wealth growth",
  "Faire grandir votre patrimoine (25 ans)": "Grow your wealth (25 years)",
  "Je ne sais pas encore": "I don't know yet",
  "L'app choisit une situation type (25 ans)": "The app picks a typical situation (25 years)",
  "Pendant combien d'années ?": "Over how many years?",
  "L'horizon conseillé pour votre projet est indiqué d'une étoile.":
    "The recommended horizon for your project is marked with a star.",
  "Où souhaitez-vous placer cet argent ?": "Where do you want to invest this money?",
  "L'étoile marque la meilleure option pour votre horizon — « Je ne sais pas » laisse l'app choisir.":
    "The star marks the best option for your horizon — “I don't know” lets the app choose.",
  "Je ne sais pas — recommandez-moi": "I don't know — recommend me",
  "L'app choisit la meilleure enveloppe pour votre horizon.": "The app picks the best wrapper for your horizon.",
  "À quel âge voulez-vous arrêter de travailler ?": "At what age do you want to stop working?",
  "L'app estime la durée pendant laquelle votre épargne devra vous faire vivre.":
    "The app estimates how long your savings will need to support you.",
  "Comment réagiriez-vous si votre épargne baissait temporairement ?":
    "How would you react if your savings temporarily dropped?",
  "Le marché monte et descend : votre confort face aux variations guide la projection.":
    "The market goes up and down: your comfort with swings guides the projection.",
  Tranquille: "Calm",
  "Je préfère limiter les variations de mon épargne": "I prefer to limit swings in my savings",
  "Un bon compromis entre sécurité et croissance": "A good balance between safety and growth",
  "J'accepte des variations pour viser plus haut": "I accept swings to aim higher",
  "Nommez votre simulation": "Name your simulation",
  "Retrouvez-la plus tard dans l'onglet « Mes simulations ».": "Find it later in the “My simulations” tab.",
  "Nom de la simulation": "Simulation name",
  versement: "contribution",
  "enveloppe recommandée": "recommended wrapper",
  "Voir mon résultat": "See my result",
  "Sauvegarder la simulation en cours ?": "Save the current simulation?",
  "Votre simulation a été modifiée": "Your simulation has been modified",
  "La sauvegarder avant d'en créer une nouvelle ? Elle restera dans « Mes simulations ».":
    "Save it before creating a new one? It will remain in “My simulations”.",
  "Sauvegarder et créer": "Save and create",
  "Créer sans sauvegarder": "Create without saving",
  "Mes simulations": "My simulations",
  "Nouvelle simulation": "New simulation",
  "Simulation en cours": "Current simulation",
  "En cours": "In progress",
  "Simulations sauvegardées": "Saved simulations",
  "Aucune simulation sauvegardée": "No saved simulations",
  "Lancez une nouvelle simulation : le questionnaire la construira et l'ajoutera ici automatiquement.":
    "Start a new simulation: the questionnaire will build it and add it here automatically.",
  "Lancer une nouvelle simulation": "Start a new simulation",
  "Ouvrir cette simulation": "Open this simulation",
  "Ouvrir {name}": "Open {name}",
  Renommer: "Rename",
  "Renommer {name}": "Rename {name}",
  Supprimer: "Delete",
  "Supprimer {name}": "Delete {name}",
  "Enregistrer le nom": "Save the name",
  "Réglages avancés": "Advanced settings",
  "Déplier les réglages avancés": "Expand advanced settings",
  "Replier les réglages avancés": "Collapse advanced settings",
}

/** Remplace les placeholders {x} d'un libellé. */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key]
    return v === undefined ? `{${key}}` : String(v)
  })
}

/**
 * Traduit un libellé français. En français (ou si la traduction manque) le
 * texte est retourné inchangé — les placeholders {x} sont interpolés dans
 * les deux cas.
 */
export function tr(lang: Lang, text: string, params?: Record<string, string | number>): string {
  const translated = lang === "en" ? (EN[text] ?? text) : text
  return interpolate(translated, params)
}

/** Court libellé de langue ("FR" / "EN") pour les boutons compacts. */
export function langCode(lang: Lang): string {
  return lang === "fr" ? "FR" : "EN"
}
