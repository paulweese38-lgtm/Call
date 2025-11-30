// Stripe Webhook Handler
// Edge Function for CallWall Mobile App

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe configuration missing');
      return new Response(
        JSON.stringify({ error: 'Webhook service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;
        const tier = subscription.metadata.subscription_tier as 'premium' | 'business';

        if (!userId || !tier) {
          console.error('Missing metadata in subscription:', subscription.id);
          break;
        }

        // Determine status
        let status: 'active' | 'canceled' | 'past_due' = 'active';
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          status = 'canceled';
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          status = 'past_due';
        }

        // Update user subscription
        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to update user subscription:', error);
        } else {
          console.log(`Updated subscription for user ${userId}: ${tier} - ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (!userId) {
          console.error('Missing metadata in subscription:', subscription.id);
          break;
        }

        // Downgrade user to free tier
        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            subscription_end_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to downgrade user:', error);
        } else {
          console.log(`Downgraded user ${userId} to free tier`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Payment succeeded for subscription renewal
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata.supabase_user_id;

          if (userId) {
            // Update subscription status to active
            const { error } = await supabase
              .from('users')
              .update({
                subscription_status: 'active',
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (error) {
              console.error('Failed to update subscription status:', error);
            } else {
              console.log(`Payment succeeded for user ${userId}`);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Payment failed for subscription
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata.supabase_user_id;

          if (userId) {
            // Update subscription status to past_due
            const { error } = await supabase
              .from('users')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (error) {
              console.error('Failed to update subscription status:', error);
            } else {
              console.log(`Payment failed for user ${userId}`);
            }

            // In production, you would also:
            // - Send email notification to user
            // - Log the payment failure for support team
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.subscription_tier as 'premium' | 'business';

        if (!userId || !tier) {
          console.error('Missing metadata in checkout session:', session.id);
          break;
        }

        // Initial subscription activation handled by customer.subscription.created
        // This event is just for logging/confirmation
        console.log(`Checkout completed for user ${userId}: ${tier}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
