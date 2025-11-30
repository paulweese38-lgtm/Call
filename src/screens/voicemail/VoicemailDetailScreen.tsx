import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { VoicemailPlayer } from '../../components/voicemail/VoicemailPlayer';

interface VoicemailDetail {
  id: string;
  phone_number: string;
  duration: number;
  audio_url: string;
  transcript: string | null;
  category: 'personal' | 'business' | 'legal' | 'spam' | null;
  threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  threat_analysis: any;
  sentiment_score: number | null;
  sentiment_description: string | null;
  is_read: boolean;
  notes: string | null;
  created_at: string;
}

export function VoicemailDetailScreen({ navigation, route }: any) {
  const { profile } = useAuthStore();
  const { voicemailId } = route.params;

  const [voicemail, setVoicemail] = useState<VoicemailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (profile && voicemailId) {
      fetchVoicemail();
    }
  }, [profile, voicemailId]);

  useEffect(() => {
    if (voicemail && !voicemail.is_read) {
      markAsRead();
    }
  }, [voicemail]);

  const fetchVoicemail = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('voicemail_messages')
        .select('*')
        .eq('id', voicemailId)
        .eq('user_id', profile.id)
        .single();

      if (error) throw error;

      setVoicemail(data);
      setNotes(data.notes || '');
    } catch (error: any) {
      console.error('Fetch voicemail error:', error);
      Alert.alert('Error', 'Failed to load voicemail');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!voicemail) return;

    try {
      await supabase
        .from('voicemail_messages')
        .update({ is_read: true })
        .eq('id', voicemail.id);
    } catch (error: any) {
      console.error('Mark as read error:', error);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!voicemail) return;

    try {
      const { error } = await supabase
        .from('voicemail_messages')
        .update({ category: newCategory })
        .eq('id', voicemail.id);

      if (error) throw error;

      setVoicemail({ ...voicemail, category: newCategory as any });
      Alert.alert('Success', 'Category updated');
    } catch (error: any) {
      console.error('Update category error:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleSaveNotes = async () => {
    if (!voicemail) return;

    setIsSavingNotes(true);

    try {
      const { error } = await supabase
        .from('voicemail_messages')
        .update({ notes })
        .eq('id', voicemail.id);

      if (error) throw error;

      setVoicemail({ ...voicemail, notes });
    } catch (error: any) {
      console.error('Save notes error:', error);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Voicemail',
      'Are you sure you want to delete this voicemail? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!voicemail) return;

    try {
      // Delete audio file from storage
      if (voicemail.audio_url) {
        const path = voicemail.audio_url.split('/').pop();
        if (path) {
          await supabase.storage.from('voicemails').remove([`${profile?.id}/${path}`]);
        }
      }

      // Delete database record
      const { error } = await supabase.from('voicemail_messages').delete().eq('id', voicemail.id);

      if (error) throw error;

      Alert.alert('Success', 'Voicemail deleted', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete voicemail');
    }
  };

  const handleShare = async () => {
    if (!voicemail) return;

    const shareText = `Voicemail from ${voicemail.phone_number}\nDate: ${new Date(
      voicemail.created_at
    ).toLocaleString()}\n\nTranscript:\n${voicemail.transcript || 'No transcript available'}`;

    try {
      await Share.share({
        message: shareText,
        title: 'Voicemail Transcript',
      });
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  const handleCopyTranscript = () => {
    if (!voicemail?.transcript) return;

    Clipboard.setString(voicemail.transcript);
    Alert.alert('Copied', 'Transcript copied to clipboard');
  };

  const getSentimentEmoji = (score: number | null): string => {
    if (score === null) return '😐';
    if (score <= -0.5) return '😠';
    if (score < 0) return '😐';
    if (score < 0.5) return '🙂';
    return '😄';
  };

  const getSentimentLabel = (score: number | null): string => {
    if (score === null) return 'Unknown';
    if (score <= -0.5) return 'Very Negative';
    if (score < 0) return 'Somewhat Negative';
    if (score < 0.5) return 'Neutral to Positive';
    return 'Very Positive';
  };

  const getThreatColor = (threatLevel: string): string => {
    switch (threatLevel) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#689f38';
      default:
        return '#9e9e9e';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading voicemail...</Text>
      </View>
    );
  }

  if (!voicemail) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Voicemail not found</Text>
      </View>
    );
  }

  const isPremiumOrBusiness = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'business';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#212121" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Caller Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Caller Information</Text>
          <View style={styles.callerInfo}>
            <View style={styles.phoneRow}>
              <Text style={styles.phoneNumber}>{voicemail.phone_number}</Text>
              <TouchableOpacity onPress={() => Clipboard.setString(voicemail.phone_number)}>
                <Ionicons name="copy-outline" size={20} color="#1976d2" />
              </TouchableOpacity>
            </View>
            <Text style={styles.callDate}>
              {new Date(voicemail.created_at).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
            <Text style={styles.duration}>
              Duration: {Math.floor(voicemail.duration / 60)}:
              {(voicemail.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Audio Player */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Audio Playback</Text>
          {voicemail.audio_url ? (
            <VoicemailPlayer
              audioUrl={voicemail.audio_url}
              duration={voicemail.duration}
              onPlaybackUpdate={(time) => {
                // Track playback position
              }}
            />
          ) : (
            <View style={styles.audioPlayerPlaceholder}>
              <Ionicons name="musical-notes" size={48} color="#bdbdbd" />
              <Text style={styles.placeholderText}>Audio file not available</Text>
            </View>
          )}
        </View>

        {/* Category Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryChips}>
            {['personal', 'business', 'legal', 'spam'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  voicemail.category === cat && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryChange(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    voicemail.category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transcript Card */}
        <View style={styles.card}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.sectionTitle}>Transcript</Text>
            {voicemail.transcript && (
              <TouchableOpacity onPress={handleCopyTranscript}>
                <Ionicons name="copy-outline" size={20} color="#1976d2" />
              </TouchableOpacity>
            )}
          </View>
          {voicemail.transcript ? (
            <Text style={styles.transcriptText}>{voicemail.transcript}</Text>
          ) : (
            <View style={styles.noTranscript}>
              <Ionicons name="document-text-outline" size={48} color="#bdbdbd" />
              <Text style={styles.noTranscriptText}>No transcript available</Text>
              <Text style={styles.noTranscriptSubtext}>Transcription may still be processing</Text>
            </View>
          )}
        </View>

        {/* Sentiment Analysis Card */}
        {isPremiumOrBusiness && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
            <View style={styles.sentimentCard}>
              <Text style={styles.sentimentEmoji}>{getSentimentEmoji(voicemail.sentiment_score)}</Text>
              <View style={styles.sentimentInfo}>
                <Text style={styles.sentimentLabel}>{getSentimentLabel(voicemail.sentiment_score)}</Text>
                {voicemail.sentiment_score !== null && (
                  <Text style={styles.sentimentScore}>Score: {voicemail.sentiment_score.toFixed(2)}</Text>
                )}
                {voicemail.sentiment_description && (
                  <Text style={styles.sentimentDescription}>{voicemail.sentiment_description}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Threat Analysis Card */}
        {voicemail.threat_level !== 'none' && (
          <View style={[styles.card, styles.threatCard]}>
            <View style={styles.threatHeader}>
              <Text style={styles.sectionTitle}>Threat Analysis</Text>
              <View
                style={[
                  styles.threatBadge,
                  { backgroundColor: getThreatColor(voicemail.threat_level) },
                ]}
              >
                <Text style={styles.threatBadgeText}>{voicemail.threat_level}</Text>
              </View>
            </View>

            {voicemail.threat_analysis && (
              <View style={styles.threatContent}>
                {voicemail.threat_analysis.detected_issues && (
                  <View style={styles.threatSection}>
                    <Text style={styles.threatSectionTitle}>Detected Issues:</Text>
                    {voicemail.threat_analysis.detected_issues.map((issue: string, idx: number) => (
                      <Text key={idx} style={styles.threatIssue}>
                        • {issue}
                      </Text>
                    ))}
                  </View>
                )}

                {voicemail.threat_analysis.recommended_actions && (
                  <View style={styles.threatSection}>
                    <Text style={styles.threatSectionTitle}>Recommended Actions:</Text>
                    {voicemail.threat_analysis.recommended_actions.map((action: string, idx: number) => (
                      <Text key={idx} style={styles.threatAction}>
                        • {action}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn more about your rights</Text>
              <Ionicons name="arrow-forward" size={16} color="#1976d2" />
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this voicemail..."
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {isSavingNotes && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color="#1976d2" />
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  callerInfo: {
    gap: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  callDate: {
    fontSize: 14,
    color: '#757575',
  },
  duration: {
    fontSize: 14,
    color: '#757575',
  },
  audioPlayerPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#424242',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#212121',
  },
  noTranscript: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noTranscriptText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  noTranscriptSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9e9e9e',
  },
  sentimentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sentimentEmoji: {
    fontSize: 48,
  },
  sentimentInfo: {
    flex: 1,
  },
  sentimentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  sentimentScore: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  sentimentDescription: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  threatCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  threatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  threatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  threatContent: {
    marginBottom: 16,
  },
  threatSection: {
    marginBottom: 12,
  },
  threatSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  threatIssue: {
    fontSize: 14,
    color: '#d32f2f',
    lineHeight: 20,
    marginBottom: 4,
  },
  threatAction: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 4,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  notesInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#212121',
    minHeight: 100,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  savingText: {
    fontSize: 12,
    color: '#757575',
  },
});
