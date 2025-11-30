// Generate Voice using OpenAI TTS API
// Edge Function for CallWall Mobile App

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface VoiceGenerationRequest {
  userId: string;
  inputText: string;
  voice: OpenAIVoice;
  speed: number; // 0.25 to 4.0
}

interface VoiceGenerationResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
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
    const { userId, inputText, voice, speed }: VoiceGenerationRequest = await req.json();

    // Validate inputs
    if (!userId || !inputText || !voice) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate text length (OpenAI TTS max is 4096 characters)
    if (inputText.length > 4096) {
      return new Response(
        JSON.stringify({ success: false, error: 'Input text exceeds 4096 character limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clamp speed to valid range
    const finalSpeed = Math.max(0.25, Math.min(4.0, speed || 1.0));

    // Call OpenAI TTS API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Voice generation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // High-definition model
        input: inputText,
        voice: voice,
        speed: finalSpeed,
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('OpenAI TTS API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Voice generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audio data
    const audioBlob = await ttsResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Calculate approximate duration (rough estimate: 150 words per minute average speech)
    const wordCount = inputText.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60 / finalSpeed);

    // Upload audio to Supabase Storage
    const generationId = crypto.randomUUID();
    const storagePath = `${userId}/${generationId}.mp3`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice_generations')
      .upload(storagePath, audioBytes, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save audio file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice_generations')
      .getPublicUrl(storagePath);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: publicUrl,
        duration: estimatedDuration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Voice generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
