import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function VoicePlaygroundScreen({ navigation }: any) {
  const { user } = useAuthStore();

  const isFeatureLocked = user?.subscription_tier === 'free';

  const handleLockedFeature = () => {
    if (isFeatureLocked) {
      // This would typically show a modal to upgrade
      navigation.navigate('Subscription');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.header}>
        <Text style={styles.headerTitle}>Voice Playground</Text>
        <Text style={styles.headerSubtitle}>
          6 AI voice personalities with text-to-speech
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {isFeatureLocked ? (
          <View style={styles.lockedContainer}>
            <Icon name="lock" size={64} color="#ccc" />
            <Text style={styles.lockedTitle}>Premium Feature</Text>
            <Text style={styles.lockedDescription}>
              Voice Playground with 6 AI personalities is available with our Premium and Business subscriptions.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name="record-voice-over" size={64} color="#1e3c72" />
            <Text style={styles.placeholderTitle}>Coming Soon</Text>
            <Text style={styles.placeholderDescription}>
              Voice AI playground with 6 personalities will be available soon.
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
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#1e3c72',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});