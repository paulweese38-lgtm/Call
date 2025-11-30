// Voice Generation Service
// Uses OpenAI TTS for text-to-speech

import { supabase } from '../lib/supabase';
import { uploadFile } from './supabaseClient';

type VoicePersonality =
  | 'friendly_helper'
  | 'enthusiastic_coach'
  | 'wise_sage'
  | 'quirky_robot'
  | 'mysterious_guide'
  | 'cheerful_friend';

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface VoiceSettings {
  pitch: number; // 0.5 to 2.0
  speed: number; // 0.25 to 4.0
}

const PERSONALITY_VOICE_MAP: Record<
  VoicePersonality,
  { voice: OpenAIVoice; pitch: number; speed: number }
> = {
  friendly_helper: { voice: 'nova', pitch: 1.0, speed: 1.0 },
  enthusiastic_coach: { voice: 'onyx', pitch: 1.0, speed: 1.1 },
  wise_sage: { voice: 'echo', pitch: 0.9, speed: 0.95 },
  quirky_robot: { voice: 'alloy', pitch: 1.2, speed: 1.0 },
  mysterious_guide: { voice: 'shimmer', pitch: 0.95, speed: 0.9 },
  cheerful_friend: { voice: 'fable', pitch: 1.05, speed: 1.0 },
};

export async function generateVoice(
  userId: string,
  personality: VoicePersonality,
  inputText: string,
  customSettings?: Partial<VoiceSettings>
): Promise<{ generationId: string; audioUrl: string; duration: number }> {
  try {
    // Check tier limit
    const { data: hasAccess, error: checkError } = await supabase.rpc('check_tier_limit', {
      p_user_id: userId,
      p_operation_type: 'voice_generation',
    });

    if (checkError) throw checkError;
    if (!hasAccess) {
      throw new Error('Monthly voice generation limit reached. Please upgrade your plan.');
    }

    // Get voice settings for personality
    const voiceConfig = PERSONALITY_VOICE_MAP[personality];
    const pitch = customSettings?.pitch ?? voiceConfig.pitch;
    const speed = customSettings?.speed ?? voiceConfig.speed;

    // Clamp values to valid ranges
    const finalPitch = Math.max(0.5, Math.min(2.0, pitch));
    const finalSpeed = Math.max(0.25, Math.min(4.0, speed));

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Call generate-voice Edge Function
    const { data: voiceResult, error: voiceError } = await supabase.functions.invoke('generate-voice', {
      body: {
        userId,
        inputText,
        voice: voiceConfig.voice,
        speed: finalSpeed,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (voiceError) throw voiceError;
    if (!voiceResult.success) throw new Error(voiceResult.error || 'Voice generation failed');

    const generationId = crypto.randomUUID();

    // Insert record
    const { data, error } = await supabase
      .from('voice_generations')
      .insert({
        user_id: userId,
        personality,
        input_text: inputText,
        audio_url: voiceResult.audioUrl,
        openai_voice: voiceConfig.voice,
        pitch: finalPitch,
        speed: finalSpeed,
        duration: voiceResult.duration,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment usage
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_operation_type: 'voice_generation',
    });

    return {
      generationId: data.id,
      audioUrl: data.audio_url,
      duration: data.duration || 0,
    };
  } catch (error) {
    console.error('Voice generation error:', error);
    throw error;
  }
}

export async function getVoiceHistory(userId: string, limit: number = 25): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('voice_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get voice history error:', error);
    throw error;
  }
}

export async function deleteVoiceGeneration(generationId: string): Promise<void> {
  try {
    // Get generation
    const { data: generation, error: fetchError } = await supabase
      .from('voice_generations')
      .select('audio_url, user_id')
      .eq('id', generationId)
      .single();

    if (fetchError) throw fetchError;

    // Delete audio file
    const path = generation.audio_url.split('/').pop();
    if (path) {
      await supabase.storage.from('voice_generations').remove([`${generation.user_id}/${path}`]);
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('voice_generations')
      .delete()
      .eq('id', generationId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Delete voice generation error:', error);
    throw error;
  }
}

export function getPersonalityConfig(personality: VoicePersonality) {
  return PERSONALITY_VOICE_MAP[personality];
}

export function getPersonalityInfo(personality: VoicePersonality) {
  const info = {
    friendly_helper: {
      name: 'Friendly Helper',
      icon: '🤗',
      description: 'Warm and encouraging',
      available: ['free', 'premium', 'business'],
    },
    enthusiastic_coach: {
      name: 'Enthusiastic Coach',
      icon: '💪',
      description: 'Energetic and motivational',
      available: ['premium', 'business'],
    },
    wise_sage: {
      name: 'Wise Sage',
      icon: '🧙',
      description: 'Calm and knowledgeable',
      available: ['premium', 'business'],
    },
    quirky_robot: {
      name: 'Quirky Robot',
      icon: '🤖',
      description: 'Playful and digital',
      available: ['premium', 'business'],
    },
    mysterious_guide: {
      name: 'Mysterious Guide',
      icon: '🔮',
      description: 'Intriguing and thoughtful',
      available: ['premium', 'business'],
    },
    cheerful_friend: {
      name: 'Cheerful Friend',
      icon: '😄',
      description: 'Bubbly and positive',
      available: ['premium', 'business'],
    },
  };

  return info[personality];
}
