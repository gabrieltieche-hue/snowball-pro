// Vercel Serverless Function — webhook Stripe (vérification de signature).
// Variable requise : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.

import Stripe from "stripe"

export const config = { api: { bodyParser: false } }

async function rawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end()
    return
  }
  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !webhookSecret) {
    res.status(503).end()
    return
  }
  const stripe = new Stripe(secret)
  const signature = req.headers["stripe-signature"]
  if (!signature || typeof signature !== "string") {
    res.status(400).end()
    return
  }
  const body = await rawBody(req)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    res.status(400).send(`Webhook signature verification failed: ${error instanceof Error ? error.message : "unknown"}`)
    return
  }

  // À compléter quand la base Supabase est en place : mettre à jour le plan
  // de l'utilisateur selon event.type (checkout.session.completed, etc.).
  // eslint-disable-next-line no-console
  console.log("stripe webhook received:", event.type)

  res.status(200).json({ received: true })
}
