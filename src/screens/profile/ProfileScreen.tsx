import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export function ProfileScreen({ navigation }: any) {
  const { profile, logout } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      fetchUsage();
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

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const tierInfo = {
    free: {
      name: 'Free',
      color: '#9e9e9e',
      features: ['2 legal documents/month', '10 voicemail transcriptions/month', '25 phone numbers', '5 voice generations/month'],
    },
    premium: {
      name: 'Premium',
      color: '#1976d2',
      features: ['Unlimited legal documents', '100 voicemail transcriptions/month', 'Unlimited phone numbers', '50 voice generations/month', 'All 6 voice personalities'],
    },
    business: {
      name: 'Business',
      color: '#7b1fa2',
      features: ['Everything in Premium', '500 voicemail transcriptions/month', '200 voice generations/month', 'Multi-user access', 'API access', 'Priority support'],
    },
  };

  const tier = profile?.subscription_tier || 'free';
  const currentTier = tierInfo[tier as keyof typeof tierInfo];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#ffffff" />
        </View>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={[styles.tierBadge, { backgroundColor: currentTier.color }]}>
          <Text style={styles.tierBadgeText}>{currentTier.name} Plan</Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={fullName}
            onChangeText={setFullName}
            editable={!isSaving}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isSaving}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>

        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionPlan}>{currentTier.name} Plan</Text>
            {tier !== 'business' && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.subscriptionFeatures}>Features:</Text>
          {currentTier.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={currentTier.color} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Usage Statistics */}
      {usage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage This Month</Text>

          <View style={styles.usageGrid}>
            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>{usage.legal_documents_count || 0}</Text>
              <Text style={styles.usageLabel}>Legal Documents</Text>
            </View>

            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>{usage.voicemail_transcriptions_count || 0}</Text>
              <Text style={styles.usageLabel}>Transcriptions</Text>
            </View>

            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>{usage.phone_numbers_count || 0}</Text>
              <Text style={styles.usageLabel}>Phone Numbers</Text>
            </View>

            <View style={styles.usageCard}>
              <Text style={styles.usageValue}>{usage.voice_generations_count || 0}</Text>
              <Text style={styles.usageLabel}>Voice Generations</Text>
            </View>
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#424242" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#424242" />
            <Text style={styles.settingText}>Privacy & Security</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#424242" />
            <Text style={styles.settingText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={24} color="#424242" />
            <Text style={styles.settingText}>About CallWall</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#f44336" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  upgradeButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  subscriptionFeatures: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#424242',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  usageCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  usageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#212121',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
});
