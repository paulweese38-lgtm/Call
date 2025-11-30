// Transcribe Voicemail using OpenAI Whisper API
// Edge Function for CallWall Mobile App

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface TranscriptionRequest {
  voicemailId: string;
  audioUrl: string;
}

interface TranscriptionResponse {
  success: boolean;
  transcript?: string;
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
    const { voicemailId, audioUrl }: TranscriptionRequest = await req.json();

    if (!voicemailId || !audioUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing voicemailId or audioUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify voicemail belongs to user
    const { data: voicemail, error: fetchError } = await supabase
      .from('voicemail_messages')
      .select('user_id')
      .eq('id', voicemailId)
      .single();

    if (fetchError || !voicemail || voicemail.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Voicemail not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download audio file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBlob = await audioResponse.blob();

    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be made dynamic based on user preferences
    formData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Transcription service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('OpenAI Whisper API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Transcription failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whisperResult = await whisperResponse.json();
    const transcript = whisperResult.text;

    // Update voicemail record with transcript
    const { error: updateError } = await supabase
      .from('voicemail_messages')
      .update({
        transcript,
        updated_at: new Date().toISOString(),
      })
      .eq('id', voicemailId);

    if (updateError) {
      console.error('Failed to update voicemail:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save transcript' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, transcript }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
