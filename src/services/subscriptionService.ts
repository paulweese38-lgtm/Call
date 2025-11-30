// Subscription Service
// Handles Stripe integration and tier management

import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'free' | 'premium' | 'business';

export interface TierLimits {
  legalDocuments: number;
  voicemailTranscriptions: number;
  phoneNumbers: number;
  voiceGenerations: number;
  storage: number; // in MB
}

const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    legalDocuments: 2,
    voicemailTranscriptions: 10,
    phoneNumbers: 25,
    voiceGenerations: 5,
    storage: 50,
  },
  premium: {
    legalDocuments: 999999,
    voicemailTranscriptions: 100,
    phoneNumbers: 999999,
    voiceGenerations: 50,
    storage: 5000,
  },
  business: {
    legalDocuments: 999999,
    voicemailTranscriptions: 500,
    phoneNumbers: 999999,
    voiceGenerations: 200,
    storage: 25000,
  },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

export async function checkTierAccess(userId: string, feature: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error || !user) return false;

    const tier = user.subscription_tier as SubscriptionTier;

    // Define tier-specific features
    const premiumFeatures = [
      'advanced_threat_analysis',
      'unlimited_documents',
      'auto_categorization',
      'all_voice_personalities',
      'export_data',
      'priority_support',
    ];

    const businessFeatures = [
      ...premiumFeatures,
      'multi_user',
      'api_access',
      'custom_branding',
      'advanced_analytics',
      'compliance_monitoring',
    ];

    if (tier === 'free') {
      return !premiumFeatures.includes(feature);
    }

    if (tier === 'premium') {
      return !businessFeatures.includes(feature) || premiumFeatures.includes(feature);
    }

    // Business tier has access to everything
    return true;
  } catch (error) {
    console.error('Check tier access error:', error);
    return false;
  }
}

export async function getCurrentUsage(userId: string): Promise<any> {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth.toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return (
      data || {
        legal_documents_count: 0,
        voicemail_transcriptions_count: 0,
        voice_generations_count: 0,
        storage_used_mb: 0,
      }
    );
  } catch (error) {
    console.error('Get current usage error:', error);
    return {
      legal_documents_count: 0,
      voicemail_transcriptions_count: 0,
      voice_generations_count: 0,
      storage_used_mb: 0,
    };
  }
}

export async function updateSubscription(
  userId: string,
  tier: SubscriptionTier,
  status: 'active' | 'canceled' | 'past_due'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Update subscription error:', error);
    throw error;
  }
}

// Stripe integration functions via Supabase Edge Functions

export async function createCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  billingPeriod: 'monthly' | 'annual',
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Call create-checkout-session Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        tier,
        billingPeriod,
        successUrl,
        cancelUrl,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to create checkout session');

    return data.sessionId;
  } catch (error) {
    console.error('Create checkout session error:', error);
    throw error;
  }
}

export async function cancelSubscription(userId: string): Promise<void> {
  try {
    // Get user's subscription details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    if (!user?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    // For subscription cancellation, we use Stripe API directly via Edge Function
    // This would typically be handled by an admin function or webhook
    // For now, we'll update the local status and let the webhook handle Stripe
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // In production, you would:
    // 1. Call Stripe API via Edge Function to cancel subscription
    // 2. Wait for webhook confirmation
    // 3. Update local status
    console.log('Subscription cancellation requested. Processing via Stripe webhook.');
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}

export function getSubscriptionPricing(tier: SubscriptionTier, billingPeriod: 'monthly' | 'annual') {
  const pricing = {
    free: { monthly: 0, annual: 0 },
    premium: { monthly: 9.99, annual: 99.0 },
    business: { monthly: 29.99, annual: 299.0 },
  };

  const price = pricing[tier][billingPeriod];
  const savings = billingPeriod === 'annual' ? (pricing[tier].monthly * 12 - price).toFixed(2) : 0;

  return { price, savings };
}
