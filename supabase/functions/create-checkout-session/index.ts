// Create Stripe Checkout Session
// Edge Function for CallWall Mobile App

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

type SubscriptionTier = 'premium' | 'business';
type BillingPeriod = 'monthly' | 'annual';

interface CheckoutSessionRequest {
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { tier, billingPeriod, successUrl, cancelUrl }: CheckoutSessionRequest = await req.json();

    // Validate inputs
    if (!tier || !billingPeriod || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['premium', 'business'].includes(tier)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user details
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('email, subscription_tier, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has this tier or higher
    if (
      (tier === 'premium' && ['premium', 'business'].includes(userProfile.subscription_tier)) ||
      (tier === 'business' && userProfile.subscription_tier === 'business')
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'You already have this subscription tier or higher' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Define price IDs (these should be created in Stripe Dashboard)
    // Format: price_<tier>_<period>
    const priceIds: Record<SubscriptionTier, Record<BillingPeriod, string>> = {
      premium: {
        monthly: Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID') || 'price_premium_monthly',
        annual: Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID') || 'price_premium_annual',
      },
      business: {
        monthly: Deno.env.get('STRIPE_BUSINESS_MONTHLY_PRICE_ID') || 'price_business_monthly',
        annual: Deno.env.get('STRIPE_BUSINESS_ANNUAL_PRICE_ID') || 'price_business_annual',
      },
    };

    const priceId = priceIds[tier][billingPeriod];

    // Get or create Stripe customer
    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to user profile
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        subscription_tier: tier,
        billing_period: billingPeriod,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          subscription_tier: tier,
        },
      },
    });

    // Return session ID
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
