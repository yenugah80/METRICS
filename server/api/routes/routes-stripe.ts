import type { Express } from "express";
import express from "express";
import Stripe from "stripe";
import { verifyJWT, type AuthenticatedRequest } from "../../infrastructure/auth/authService";
import { storage } from "../../infrastructure/database/storage";
import { db } from "../../infrastructure/database/db";
import { users } from "../../../shared/schema";
import { eq } from "drizzle-orm";

// Stripe setup
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerStripeRoutes(app: Express) {
  const { logger } = await import("../../infrastructure/monitoring/logging/logger");
  const { secureErrorResponse } = await import("../../infrastructure/security/security");

  // Premium upgrade endpoint
  app.post('/api/upgrade-premium', verifyJWT, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create Stripe checkout session for premium subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Premium Subscription',
                description: 'Unlimited AI recipe generation, advanced nutrition insights, and premium features',
              },
              unit_amount: 699, // $6.99/month
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.get('host')}/recipes?upgraded=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/recipes?upgrade=cancelled`,
        customer_email: user.email,
        metadata: {
          userId: userId,
        },
      });

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      logger.error('Premium upgrade error', error, req);
      res.status(500).json(secureErrorResponse(error, req));
    }
  });

  // Stripe webhook to handle successful subscriptions
  app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || 'placeholder');
    } catch (err: any) {
      logger.security('Stripe webhook signature verification failed', { error: err.message }, req);
      return res.status(400).send(`Webhook Error: Invalid signature`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.metadata?.userId) {
          try {
            // Update user to premium
            await db
              .update(users)
              .set({ 
                isPremium: true,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                updatedAt: new Date()
              })
              .where(eq(users.id, session.metadata.userId));
            
            logger.payment('User upgraded to premium', { userId: session.metadata.userId }, req);
          } catch (error) {
            logger.error('Error upgrading user to premium', error, req);
          }
        }
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        try {
          // Downgrade user from premium
          await db
            .update(users)
            .set({ 
              isPremium: false,
              updatedAt: new Date()
            })
            .where(eq(users.stripeSubscriptionId, subscription.id));
          
          logger.payment('User downgraded from premium', {}, req);
        } catch (error) {
          logger.error('Error downgrading user from premium', error, req);
        }
        break;
      default:
        logger.warn('Unhandled Stripe event type', { eventType: event.type }, req);
    }

    res.json({received: true});
  });

  // Get current user usage stats endpoint
  app.get('/api/usage-stats', verifyJWT, async (req: any, res) => {
    res.json({
      usageStats: {
        recipesGenerated: 0,
        remainingFree: 5,
        isPremium: false
      }
    });
  });
}