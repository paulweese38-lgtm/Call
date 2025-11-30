import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import { uploadFile } from './supabaseClient';
import { analyzeThreat } from './threatAnalysisService';

export interface VoicemailRecording {
  uri: string;
  hash: string;
  duration: number;
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const permission = await Audio.requestPermissionsAsync();
    return permission.granted;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
}

export async function startRecording(): Promise<Audio.Recording> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    return recording;
  } catch (error) {
    console.error('Recording start error:', error);
    throw error;
  }
}

export async function stopRecording(recording: Audio.Recording): Promise<VoicemailRecording> {
  try {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (!uri) throw new Error('No recording URI');

    const status = await recording.getStatusAsync();
    const duration = status.durationMillis ? Math.floor(status.durationMillis / 1000) : 0;

    // Calculate hash for deduplication
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fileContent
    );

    return { uri, hash, duration };
  } catch (error) {
    console.error('Recording stop error:', error);
    throw error;
  }
}

export async function uploadVoicemail(
  userId: string,
  audioUri: string,
  phoneNumber: string,
  audioHash: string,
  duration: number
): Promise<string> {
  try {
    // Check tier limit
    const { data: hasAccess, error: checkError } = await supabase.rpc('check_tier_limit', {
      p_user_id: userId,
      p_operation_type: 'voicemail_transcription',
    });

    if (checkError) throw checkError;
    if (!hasAccess) {
      throw new Error('Monthly voicemail limit reached. Please upgrade your plan.');
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('voicemail_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('audio_hash', audioHash)
      .single();

    if (existing) {
      return existing.id;
    }

    // Read audio file
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) throw new Error('Audio file not found');

    const audioBlob = await fetch(audioUri).then((r) => r.blob());

    // Upload to storage
    const voicemailId = crypto.randomUUID();
    const storagePath = `${userId}/${voicemailId}.mp3`;
    const uploadResult = await uploadFile('voicemails', storagePath, audioBlob);

    if (!uploadResult.success || !uploadResult.data) {
      throw new Error('Failed to upload audio');
    }

    // Insert record
    const { data, error } = await supabase
      .from('voicemail_messages')
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        audio_url: uploadResult.data.url,
        audio_hash: audioHash,
        duration,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment usage
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_operation_type: 'voicemail_transcription',
    });

    // Queue transcription (would be done via background job)
    // For MVP, we skip automatic transcription
    // transcribeVoicemail(data.id).catch(console.error);

    return data.id;
  } catch (error) {
    console.error('Upload voicemail error:', error);
    throw error;
  }
}

export async function transcribeVoicemail(voicemailId: string): Promise<string> {
  try {
    // Fetch voicemail
    const { data: voicemail, error: fetchError } = await supabase
      .from('voicemail_messages')
      .select('*')
      .eq('id', voicemailId)
      .single();

    if (fetchError) throw fetchError;

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Call transcribe-voicemail Edge Function
    const { data, error } = await supabase.functions.invoke('transcribe-voicemail', {
      body: {
        voicemailId,
        audioUrl: voicemail.audio_url,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Transcription failed');

    const transcript = data.transcript;

    // Analyze threat
    const analysis = await analyzeThreat(transcript, {
      callerNumber: voicemail.phone_number,
    });

    // Auto-categorize
    const category = autoCategorizeVoicemail(transcript);

    // Update record with analysis results
    const { error: updateError } = await supabase
      .from('voicemail_messages')
      .update({
        sentiment_score: analysis.sentimentScore,
        threat_level: analysis.threatLevel,
        category,
      })
      .eq('id', voicemailId);

    if (updateError) throw updateError;

    return transcript;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

function autoCategorizeVoicemail(transcript: string): 'personal' | 'business' | 'legal' | 'spam' {
  const text = transcript.toLowerCase();

  // Legal keywords
  if (
    text.includes('debt') ||
    text.includes('collection') ||
    text.includes('attorney') ||
    text.includes('lawsuit') ||
    text.includes('court')
  ) {
    return 'legal';
  }

  // Spam keywords
  if (
    text.includes('warranty') ||
    text.includes('extended') ||
    text.includes('free') ||
    text.includes('winner') ||
    text.includes('congratulations')
  ) {
    return 'spam';
  }

  // Business keywords
  if (
    text.includes('appointment') ||
    text.includes('meeting') ||
    text.includes('service') ||
    text.includes('customer')
  ) {
    return 'business';
  }

  return 'personal';
}

export async function deleteVoicemail(voicemailId: string): Promise<void> {
  try {
    // Get voicemail
    const { data: voicemail, error: fetchError } = await supabase
      .from('voicemail_messages')
      .select('audio_url, user_id')
      .eq('id', voicemailId)
      .single();

    if (fetchError) throw fetchError;

    // Delete audio file
    const path = voicemail.audio_url.split('/').pop();
    if (path) {
      await supabase.storage.from('voicemails').remove([`${voicemail.user_id}/${path}`]);
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('voicemail_messages')
      .delete()
      .eq('id', voicemailId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Delete voicemail error:', error);
    throw error;
  }
}
