---
description: Step-by-step guide to setting up a payment flow and webhooks
---

# Stripe Checkout Integration

**Tags:** Stripe, Payments, E-commerce, Auth, NextAuth, Security, +1, Supabase, Database, Security, +1, Database, Postgres, Local Development, +1, LangChain, AI Agents, Orchestration, Reinforcement Learning, RL, AI, Django, Python, Backend

description: Step-by-step guide to setting up a payment flow and webhooks

1.  **Install Stripe**:
    - Install the Stripe SDK.
      // turbo
    - Run npm install stripe

2.  **Create Checkout Session (Server Action)**:
    - Create a server action to initiate the Stripe checkout session.
      'use server'
      import Stripe from 'stripe';
      import { redirect } from 'next/navigation';

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    export async function checkout() {
    const session = await stripe.checkout.sessions.create({
    line_items: [{ price: 'price_id', quantity: 1 }],
    mode: 'payment',
    success_url: ${process.env.NEXT_PUBLIC_URL}/success,
    cancel_url: ${process.env.NEXT_PUBLIC_URL}/cancel,
    });
    redirect(session.url!);
    }

3.  **Handle Webhooks (api/webhooks/stripe/route.ts)**:
    - You _must_ verify the webhook signature to prevent fraud.
    - **Next.js 15 Note:** headers() is now async.
      import { headers } from 'next/headers';
      import { NextResponse } from 'next/server';
      import Stripe from 'stripe';

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature')!;

        let event;
        try {
          event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        } catch (err) {
          return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          // Fulfill order here
        }

        return NextResponse.json({ received: true });

    }

4.  **Pro Tips**:
    - Use the **Stripe CLI** to test webhooks locally: stripe listen --forward-to localhost:3000/api/webhooks/stripe.
    - Never trust client-side success callbacks; always rely on webhooks.
    - Set STRIPE_WEBHOOK_SECRET from the Stripe CLI or Dashboard.
