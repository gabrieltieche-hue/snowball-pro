// Vercel Serverless Function — crée une session Stripe Checkout pour l'abonnement Pro.
// Variables requises : STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_SUCCESS_URL,
// STRIPE_CANCEL_URL.

import Stripe from "stripe"

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const secret = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  if (!secret || !priceId) {
    res.status(503).json({ error: "Stripe not configured" })
    return
  }

  const stripe = new Stripe(secret)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL ?? "https://snowball-pro.vercel.app/?pro=success",
      cancel_url: process.env.STRIPE_CANCEL_URL ?? "https://snowball-pro.vercel.app/?pro=cancel",
      allow_promotion_codes: true,
    })
    res.status(200).json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe error"
    res.status(500).json({ error: message })
  }
}
