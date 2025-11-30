// Realtime Voicemails Hook
// Subscribes to real-time updates for new voicemails and transcriptions

import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface VoicemailUpdate {
  id: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  voicemail: any;
}

export function useRealtimeVoicemails(onUpdate?: (update: VoicemailUpdate) => void) {
  const { profile } = useAuthStore();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleInsert = useCallback(
    (payload: any) => {
      console.log('New voicemail:', payload.new);
      if (onUpdate) {
        onUpdate({
          id: payload.new.id,
          event: 'INSERT',
          voicemail: payload.new,
        });
      }
    },
    [onUpdate]
  );

  const handleUpdate = useCallback(
    (payload: any) => {
      console.log('Voicemail updated:', payload.new);
      if (onUpdate) {
        onUpdate({
          id: payload.new.id,
          event: 'UPDATE',
          voicemail: payload.new,
        });
      }
    },
    [onUpdate]
  );

  const handleDelete = useCallback(
    (payload: any) => {
      console.log('Voicemail deleted:', payload.old);
      if (onUpdate) {
        onUpdate({
          id: payload.old.id,
          event: 'DELETE',
          voicemail: payload.old,
        });
      }
    },
    [onUpdate]
  );

  useEffect(() => {
    if (!profile?.id) return;

    // Create channel for user's voicemail updates
    const voicemailChannel = supabase
      .channel(`voicemails:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voicemail_messages',
          filter: `user_id=eq.${profile.id}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'voicemail_messages',
          filter: `user_id=eq.${profile.id}`,
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'voicemail_messages',
          filter: `user_id=eq.${profile.id}`,
        },
        handleDelete
      )
      .subscribe((status) => {
        console.log('Voicemail channel status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    setChannel(voicemailChannel);

    // Cleanup
    return () => {
      if (voicemailChannel) {
        voicemailChannel.unsubscribe();
      }
    };
  }, [profile?.id, handleInsert, handleUpdate, handleDelete]);

  return { isSubscribed, channel };
}
