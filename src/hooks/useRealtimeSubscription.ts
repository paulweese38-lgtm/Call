// Realtime Subscription Hook
// Subscribes to real-time updates for user subscription changes

import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface SubscriptionUpdate {
  subscription_tier: 'free' | 'premium' | 'business';
  subscription_status: 'active' | 'canceled' | 'past_due';
  subscription_end_date: string | null;
}

export function useRealtimeSubscription(onUpdate?: (update: SubscriptionUpdate) => void) {
  const { profile } = useAuthStore();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    // Create channel for user's subscription updates
    const subscriptionChannel = supabase
      .channel(`user_subscription:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Subscription updated:', payload);

          const update: SubscriptionUpdate = {
            subscription_tier: payload.new.subscription_tier,
            subscription_status: payload.new.subscription_status,
            subscription_end_date: payload.new.subscription_end_date,
          };

          // Update auth store
          useAuthStore.getState().setProfile({
            ...profile,
            ...update,
          });

          // Call optional callback
          if (onUpdate) {
            onUpdate(update);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription channel status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    setChannel(subscriptionChannel);

    // Cleanup
    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [profile?.id]);

  return { isSubscribed, channel };
}
