export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  subscription_tier: 'free' | 'premium' | 'business';
  subscription_status: 'active' | 'canceled' | 'past_due';
  stripe_customer_id?: string;
  subscription_period_start?: string;
  subscription_period_end?: string;
  usage_reset_date: string;
  created_at: string;
  updated_at: string;
  preferences: Record<string, any>;
}

export interface User {
  id: string;
  aud: string;
  email?: string;
  created_at: string;
  updated_at: string;
}
