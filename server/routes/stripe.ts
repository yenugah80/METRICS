/**
 * Stripe Subscription Routes for Premium Features
 * Handles freemium to premium upgrade flow
 */

import { Router } from 'express';
import Stripe from 'stripe';
import { freemiumMiddleware, type FreemiumRequest } from '../middleware/freemium';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

const router = Router();

// Create subscription for premium upgrade
router.post('/create-subscription', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please sign in to upgrade to premium'
      });
    }

    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if user already has a subscription
    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      if (subscription.status === 'active') {
        return res.json({
          success: true,
          message: 'Already subscribed to premium',
          subscriptionId: subscription.id,
          status: subscription.status
        });
      }
    }

    let customerId = user.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'MyFoodMatrics Premium',
            description: 'Unlimited recipe generation, voice logging, and advanced nutrition insights'
          },
          unit_amount: 699, // $6.99 per month
          recurring: {
            interval: 'month'
          }
        } as any
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user with Stripe info
    await storage.updateUserStripeInfo(userId, customerId, subscription.id);

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent as any;

    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status
    });

  } catch (error: any) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({
      error: 'Subscription creation failed',
      message: error.message || 'Unable to create subscription'
    });
  }
});

// Get subscription status
router.get('/subscription-status', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!userId) {
      return res.json({
        isPremium: false,
        status: 'unauthenticated'
      });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.json({
        isPremium: false,
        status: 'no_subscription'
      });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    res.json({
      isPremium: subscription.status === 'active',
      status: subscription.status,
      subscriptionId: subscription.id,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
    });

  } catch (error: any) {
    console.error('Subscription status error:', error);
    res.status(500).json({
      error: 'Unable to check subscription status'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', freemiumMiddleware, async (req: FreemiumRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({
        error: 'No active subscription found'
      });
    }

    // Cancel at period end (don't immediately terminate)
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      success: true,
      message: 'Subscription will cancel at the end of the current billing period',
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      currentPeriodEnd: (subscription as any).current_period_end
    });

  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      error: 'Unable to cancel subscription'
    });
  }
});

// Stripe webhook for handling subscription events
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        // Update user premium status
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (customer.metadata?.userId) {
          await storage.updateUserStripeInfo(
            customer.metadata.userId,
            customer.id,
            subscription.id
          );
        }
      }
      break;
      
    case 'invoice.payment_failed':
      // Handle failed payment
      console.log('Payment failed:', event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSub = event.data.object as Stripe.Subscription;
      const customer2 = await stripe.customers.retrieve(deletedSub.customer as string) as Stripe.Customer;
      
      if (customer2.metadata?.userId) {
        // Remove premium status
        await storage.updateUserStripeInfo(
          customer2.metadata.userId,
          customer2.id,
          ''
        );
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export { router as stripeRoutes };