import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useAuthStore } from '../../store/authStore';
import { uploadVoicemail } from '../../services/voicemailService';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export function VoicemailRecordScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const durationInterval = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required to record audio');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        setRecordedUri(uri);
      }

      setRecording(null);
    } catch (error: any) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleSave = async () => {
    if (!recordedUri || !phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please provide a phone number');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsSaving(true);

    try {
      // Generate audio hash
      const fileContent = await FileSystem.readAsStringAsync(recordedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const audioHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileContent
      );

      // Upload voicemail
      await uploadVoicemail(
        profile.id,
        recordedUri,
        phoneNumber.trim(),
        audioHash,
        recordingDuration
      );

      Alert.alert('Success', 'Voicemail saved successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Save voicemail error:', error);
      Alert.alert('Error', error.message || 'Failed to save voicemail');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'Are you sure you want to discard this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setRecordedUri(null);
          setRecordingDuration(0);
          setPhoneNumber('');
        },
      },
    ]);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Voicemail</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Recording Visualization */}
        <View style={styles.recordingCard}>
          <View style={styles.visualizer}>
            {isRecording ? (
              <>
                <View style={styles.pulseOuter} />
                <View style={styles.pulseMiddle} />
                <View style={styles.pulseInner} />
                <Ionicons name="mic" size={48} color="#ffffff" />
              </>
            ) : (
              <Ionicons
                name={recordedUri ? 'checkmark-circle' : 'mic-outline'}
                size={64}
                color={recordedUri ? '#43a047' : '#bdbdbd'}
              />
            )}
          </View>

          <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>

          {isRecording && <Text style={styles.recordingLabel}>Recording...</Text>}
          {recordedUri && !isRecording && (
            <Text style={styles.recordingLabel}>Recording Complete</Text>
          )}
        </View>

        {/* Record Button */}
        {!recordedUri && (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isSaving}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={32}
              color="#ffffff"
            />
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Phone Number Input */}
        {recordedUri && (
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isSaving}
            />

            <Text style={styles.helperText}>
              Enter the caller's phone number for this voicemail
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.discardButton}
                onPress={handleDiscard}
                disabled={isSaving}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving || !phoneNumber.trim()}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Save Voicemail</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Instructions */}
        {!recordedUri && !isRecording && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Tips for Recording:</Text>
            <Text style={styles.instructionItem}>• Find a quiet location</Text>
            <Text style={styles.instructionItem}>• Speak clearly and at a normal pace</Text>
            <Text style={styles.instructionItem}>• Hold phone close to your mouth</Text>
            <Text style={styles.instructionItem}>
              • You can transcribe and analyze after saving
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  recordingCard: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visualizer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pulseOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
  },
  pulseMiddle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(25, 118, 210, 0.4)',
  },
  pulseInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1976d2',
  },
  durationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  recordingLabel: {
    fontSize: 16,
    color: '#757575',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: '#f44336',
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#fafafa',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f44336',
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#43a047',
  },
  saveButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  instructions: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 24,
  },
});
