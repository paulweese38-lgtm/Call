import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Slider, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface VoicemailPlayerProps {
  audioUrl: string;
  duration: number;
  onPlaybackUpdate?: (currentTime: number) => void;
}

export function VoicemailPlayer({ audioUrl, duration, onPlaybackUpdate }: VoicemailPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playbackUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (sound) {
        sound.unloadAsync();
      }
      if (playbackUpdateInterval.current) {
        clearInterval(playbackUpdateInterval.current);
      }
    };
  }, [sound]);

  const loadAudio = async () => {
    if (sound) return;

    setIsLoading(true);

    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false, rate: playbackSpeed },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
    } catch (error: any) {
      console.error('Load audio error:', error);
      Alert.alert('Error', 'Failed to load audio file');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);

      if (onPlaybackUpdate) {
        onPlaybackUpdate(status.positionMillis / 1000);
      }

      // Auto-stop at end
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!sound) {
        await loadAudio();
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error: any) {
      console.error('Play/pause error:', error);
      Alert.alert('Error', 'Failed to control playback');
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;

    try {
      const positionMillis = value * 1000;
      await sound.setPositionAsync(positionMillis);
      setCurrentTime(value);
    } catch (error: any) {
      console.error('Seek error:', error);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);

    if (sound) {
      try {
        await sound.setRateAsync(newSpeed, true);
      } catch (error: any) {
        console.error('Speed change error:', error);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 1.0, 1.5, 2.0];

  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons name="hourglass-outline" size={48} color="#1976d2" />
        ) : (
          <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={64} color="#1976d2" />
        )}
      </TouchableOpacity>

      {/* Waveform Placeholder */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveformPlaceholder}>
          {[...Array(40)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: Math.random() * 40 + 10,
                  backgroundColor: (i / 40) < (currentTime / duration) ? '#1976d2' : '#e0e0e0',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Progress Slider */}
      <Slider
        style={styles.slider}
        value={currentTime}
        minimumValue={0}
        maximumValue={duration}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor="#1976d2"
        maximumTrackTintColor="#e0e0e0"
        thumbTintColor="#1976d2"
      />

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Playback Controls */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlLabel}>Playback Speed:</Text>
        <View style={styles.speedButtons}>
          {speedOptions.map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                playbackSpeed === speed && styles.speedButtonActive,
              ]}
              onPress={() => handleSpeedChange(speed)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  playbackSpeed === speed && styles.speedButtonTextActive,
                ]}
              >
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  playButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  waveformContainer: {
    height: 60,
    marginBottom: 16,
  },
  waveformPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  slider: {
    width: '100%',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#757575',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '600',
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  speedButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  speedButtonText: {
    fontSize: 12,
    color: '#424242',
    fontWeight: '600',
  },
  speedButtonTextActive: {
    color: '#ffffff',
  },
});
