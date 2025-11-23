import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import VoicemailIntelligenceEngine, { VoicemailMessage } from '../../services/voicemail/VoicemailIntelligenceEngine';
import VoicemailIntelligenceInterface from '../../components/voicemail/VoicemailIntelligenceInterface';

export default function VoicemailListScreen({ navigation }: any) {
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
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Voicemail Intelligence</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered transcription and sentiment analysis
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {isFeatureLocked ? (
          <View style={styles.lockedContainer}>
            <Icon name="lock" size={64} color={Colors.textMuted} />
            <Text style={styles.lockedTitle}>Premium Feature</Text>
            <Text style={styles.lockedDescription}>
              Voicemail Intelligence is available with our Premium and Business subscriptions.
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
            <Icon name="voicemail" size={64} color={Colors.primary} />
            <Text style={styles.placeholderTitle}>Coming Soon</Text>
            <Text style={styles.placeholderDescription}>
              Voicemail management features will be available soon.
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
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
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
    padding: Spacing.lg,
  },
  lockedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,
  },
  upgradeButtonText: {
    color: Colors.white,
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
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});