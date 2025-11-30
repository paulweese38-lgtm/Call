import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { generateVoice } from '../../services/voiceService';

interface Personality {
  id: string;
  name: string;
  icon: string;
  description: string;
  emoji: string;
}

interface VoiceGeneration {
  id: string;
  personality: string;
  text: string;
  audio_url: string;
  created_at: string;
}

const PERSONALITIES: Personality[] = [
  {
    id: 'friendly_helper',
    name: 'Friendly Helper',
    icon: 'happy',
    emoji: '😊',
    description: 'Warm and supportive tone',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: 'briefcase',
    emoji: '💼',
    description: 'Clear and confident business tone',
  },
  {
    id: 'quirky_robot',
    name: 'Quirky Robot',
    icon: 'hardware-chip',
    emoji: '🤖',
    description: 'Playful robotic voice',
  },
  {
    id: 'calm_therapist',
    name: 'Calm Therapist',
    icon: 'leaf',
    emoji: '🧘',
    description: 'Soothing and reassuring',
  },
  {
    id: 'energetic_coach',
    name: 'Energetic Coach',
    icon: 'fitness',
    emoji: '💪',
    description: 'Motivating and upbeat',
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    icon: 'book',
    emoji: '📖',
    description: 'Engaging narrative voice',
  },
];

const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export function VoicePlaygroundScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>(PERSONALITIES[0]);
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [pitch, setPitch] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [history, setHistory] = useState<VoiceGeneration[]>([]);

  const tier = profile?.subscription_tier || 'free';
  const maxCharacters = tier === 'free' ? 500 : 2000;

  useEffect(() => {
    if (profile) {
      fetchUsage();
      fetchHistory();
    }
  }, [profile]);

  const fetchUsage = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setUsage(data);
    } catch (error: any) {
      console.error('Fetch usage error:', error);
    }
  };

  const fetchHistory = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('voice_generations')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setHistory(data || []);
    } catch (error: any) {
      console.error('Fetch history error:', error);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    if (text.length > maxCharacters) {
      Alert.alert('Error', `Text exceeds ${maxCharacters} character limit`);
      return;
    }

    if (!profile) return;

    // Check tier limit
    const tierLimits: Record<string, number> = {
      free: 5,
      premium: 50,
      business: 200,
    };

    const usedCount = usage?.voice_generations_count || 0;
    const limit = tierLimits[tier];

    if (usedCount >= limit) {
      Alert.alert(
        'Limit Reached',
        `You've used ${usedCount}/${limit} voice generations this month. Upgrade to get more!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    setIsGenerating(true);

    try {
      await generateVoice(
        profile.id,
        selectedPersonality.id,
        text,
        selectedVoice,
        pitch,
        speed
      );

      Alert.alert('Success', 'Voice generated successfully!');

      // Refresh usage and history
      await fetchUsage();
      await fetchHistory();

      // Clear text
      setText('');
    } catch (error: any) {
      console.error('Generate voice error:', error);
      Alert.alert('Error', error.message || 'Failed to generate voice');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPersonalityCard = (personality: Personality) => (
    <TouchableOpacity
      key={personality.id}
      style={[
        styles.personalityCard,
        selectedPersonality.id === personality.id && styles.personalityCardActive,
      ]}
      onPress={() => setSelectedPersonality(personality)}
    >
      <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
      <Text style={styles.personalityName}>{personality.name}</Text>
      <Text style={styles.personalityDescription}>{personality.description}</Text>
      {selectedPersonality.id === personality.id && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#1976d2" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: VoiceGeneration }) => (
    <TouchableOpacity style={styles.historyItem}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyText} numberOfLines={2}>
          {item.text}
        </Text>
        <Text style={styles.historyDate}>
          {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play-circle" size={32} color="#1976d2" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const tierLimits: Record<string, number> = {
    free: 5,
    premium: 50,
    business: 200,
  };

  const usedCount = usage?.voice_generations_count || 0;
  const limit = tierLimits[tier];

  // Free tier only allows Friendly Helper
  const availablePersonalities = tier === 'free'
    ? [PERSONALITIES[0]]
    : PERSONALITIES;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Usage Indicator */}
        {(tier === 'free' || tier === 'premium') && (
          <View style={styles.usageCard}>
            <Text style={styles.usageText}>
              {usedCount}/{limit} generations used this month
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((usedCount / limit) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Personality Selector */}
        <Text style={styles.sectionTitle}>Choose Personality</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personalityScroll}>
          {availablePersonalities.map(renderPersonalityCard)}
          {tier === 'free' && (
            <View style={styles.upgradeCard}>
              <Ionicons name="lock-closed" size={32} color="#9e9e9e" />
              <Text style={styles.upgradeText}>5 more personalities</Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Text Input */}
        <Text style={styles.sectionTitle}>Enter Text</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter text to convert to speech..."
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={6}
          maxLength={maxCharacters}
          textAlignVertical="top"
          editable={!isGenerating}
        />
        <Text style={styles.characterCount}>
          {text.length} / {maxCharacters} characters
        </Text>

        {/* Voice Settings */}
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Text style={styles.sectionTitle}>Voice Settings</Text>
          <Ionicons
            name={showSettings ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#424242"
          />
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.settingsContent}>
            <Text style={styles.settingLabel}>OpenAI Voice</Text>
            <View style={styles.voiceSelector}>
              {OPENAI_VOICES.map((voice) => (
                <TouchableOpacity
                  key={voice}
                  style={[
                    styles.voiceChip,
                    selectedVoice === voice && styles.voiceChipActive,
                  ]}
                  onPress={() => setSelectedVoice(voice)}
                >
                  <Text
                    style={[
                      styles.voiceChipText,
                      selectedVoice === voice && styles.voiceChipTextActive,
                    ]}
                  >
                    {voice}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingLabel}>Pitch: {pitch.toFixed(1)}</Text>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Lower</Text>
              <Text style={styles.sliderLabel}>Higher</Text>
            </View>

            <Text style={styles.settingLabel}>Speed: {speed.toFixed(1)}</Text>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Slower</Text>
              <Text style={styles.sliderLabel}>Faster</Text>
            </View>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating || !text.trim()}
        >
          {isGenerating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="mic" size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generate Voice</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generation History */}
        <Text style={styles.sectionTitle}>Recent Generations</Text>
        {history.length > 0 ? (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="musical-notes-outline" size={48} color="#bdbdbd" />
            <Text style={styles.emptyHistoryText}>No generations yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  usageCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  usageText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976d2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  personalityScroll: {
    marginBottom: 24,
  },
  personalityCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  personalityCardActive: {
    borderColor: '#1976d2',
  },
  personalityEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  personalityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  personalityDescription: {
    fontSize: 11,
    color: '#757575',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  upgradeCard: {
    width: 140,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  upgradeText: {
    fontSize: 12,
    color: '#757575',
    marginVertical: 8,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#212121',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  characterCount: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginTop: 12,
    marginBottom: 8,
  },
  voiceSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  voiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  voiceChipActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  voiceChipText: {
    fontSize: 12,
    color: '#424242',
    textTransform: 'capitalize',
  },
  voiceChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#757575',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  historyText: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#757575',
  },
  playButton: {
    padding: 4,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  emptyHistoryText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
});
