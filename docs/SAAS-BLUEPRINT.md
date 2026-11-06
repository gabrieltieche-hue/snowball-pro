# SaaS Blueprint — Snowball Pro (mode payant + users réels)

## Vision
Garder la promesse core (100 % local, gratuit, sans pub) et ajouter une couche
"Pro" **opt-in** pour les utilisateurs qui veulent cloud sync + fonctionnalités avancées.

## Modèles retenus
- **A** Soutien (GitHub Sponsors / Ko-fi) — immédiat, zéro friction.
- **C** SaaS léger "Pro" — abonnement mensuel/annuel pour fonctions premium cloud.

## Stack retenue (choix utilisateur)
- Auth + DB : **Supabase** (email + Google, RLS par user).
- Billing : **Stripe** Checkout + Customer Portal + webhooks.
- Hébergement API : Vercel Serverless Functions (`/api/*`) à côté de l'app statique.
- App : client Supabase (optionnel, lazy) + aucune rupture de la promesse locale.

## Plan tier
- **Free (toujours très généreux)** : app actuelle, 100 % locale, illimitée.
- **Pro (plus tard)** : sync multi-appareils + export PDF premium + scénarios illimités + support.

## Setup checklist (une fois)
1. Créer le projet Supabase + activer Email/Google auth.
2. Créer produit + price Stripe (récurrent mensuel + annuel), copier `STRIPE_PRICE_ID`.
3. Remplir `.env.local` puis les variables Vercel (Settings → Environment Variables).
4. Déployer (`vercel --prod`) pour activer `/api/stripe/*`.
5. Tester checkout en mode test Stripe via `/api/stripe/create-checkout`.

## Phases
1. Waitlist + donations (sans backend) — 1 semaine.
2. Auth Supabase (compte optionnel) + sync locale -> cloud — 2-3 semaines.
3. Stripe billing + plan gating — 2 semaines.
4. Admin metrics (MRR, churn) — 1 semaine.
5. Lancement (PH/HN) — 1 semaine.

## Variables d'environnement (Vercel)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

## Feature gating (V1)
- Free : app actuelle, illimité local.
- Pro : multi-appareils sync, export PDF premium, scénarios illimités sauvegardés, priorité support.

## Contraintes
- Ne jamais forcer un compte pour utiliser la simu (engagement produit).
- Données locales restent source de vérité hors-ligne.
- Toute donnée cloud = opt-in explicite.

## Décisions à prendre cette semaine
1. Auth provider : Supabase vs Clerk vs Firebase Auth.
2. Billing : Stripe vs Lemon Squeezy (MoR) vs Gumroad.
3. Positionnement Pro : quels features exacts dans le tier payant.
