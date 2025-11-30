import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface PhoneNumberDetail {
  id: string;
  phone_number: string;
  label: string | null;
  call_count: number;
  first_call_at: string | null;
  last_call_at: string | null;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
}

interface RelatedVoicemail {
  id: string;
  duration: number;
  category: string | null;
  created_at: string;
}

export function PhoneDetailScreen({ navigation, route }: any) {
  const { profile } = useAuthStore();
  const { phoneNumberId } = route.params;

  const [phoneNumber, setPhoneNumber] = useState<PhoneNumberDetail | null>(null);
  const [relatedVoicemails, setRelatedVoicemails] = useState<RelatedVoicemail[]>([]);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (profile && phoneNumberId) {
      fetchPhoneNumber();
      fetchRelatedVoicemails();
    }
  }, [profile, phoneNumberId]);

  const fetchPhoneNumber = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .eq('user_id', profile.id)
        .single();

      if (error) throw error;

      setPhoneNumber(data);
      setLabel(data.label || '');
      setNotes(data.notes || '');
    } catch (error: any) {
      console.error('Fetch phone number error:', error);
      Alert.alert('Error', 'Failed to load phone number');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedVoicemails = async () => {
    if (!profile || !phoneNumber) return;

    try {
      const { data, error } = await supabase
        .from('voicemail_messages')
        .select('id, duration, category, created_at')
        .eq('user_id', profile.id)
        .eq('phone_number', phoneNumber.phone_number)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRelatedVoicemails(data || []);
    } catch (error: any) {
      console.error('Fetch related voicemails error:', error);
    }
  };

  const handleSaveLabel = async () => {
    if (!phoneNumber) return;

    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ label: label.trim() || null })
        .eq('id', phoneNumber.id);

      if (error) throw error;

      setPhoneNumber({ ...phoneNumber, label: label.trim() || null });
      Alert.alert('Success', 'Label updated');
    } catch (error: any) {
      console.error('Update label error:', error);
      Alert.alert('Error', 'Failed to update label');
    }
  };

  const handleSaveNotes = async () => {
    if (!phoneNumber) return;

    setIsSavingNotes(true);

    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ notes })
        .eq('id', phoneNumber.id);

      if (error) throw error;

      setPhoneNumber({ ...phoneNumber, notes });
    } catch (error: any) {
      console.error('Save notes error:', error);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!phoneNumber) return;

    const newBlockStatus = !phoneNumber.is_blocked;
    const action = newBlockStatus ? 'block' : 'unblock';

    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ is_blocked: newBlockStatus })
        .eq('id', phoneNumber.id);

      if (error) throw error;

      setPhoneNumber({ ...phoneNumber, is_blocked: newBlockStatus });
      Alert.alert('Success', `Number ${action}ed successfully`);
    } catch (error: any) {
      console.error(`${action} error:`, error);
      Alert.alert('Error', `Failed to ${action} number`);
    }
  };

  const handleCall = () => {
    if (!phoneNumber) return;

    Linking.openURL(`tel:${phoneNumber.phone_number}`);
  };

  const handleMessage = () => {
    if (!phoneNumber) return;

    Linking.openURL(`sms:${phoneNumber.phone_number}`);
  };

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getCategoryColor = (category: string | null): string => {
    switch (category) {
      case 'personal':
        return '#2196f3';
      case 'business':
        return '#43a047';
      case 'legal':
        return '#ff9800';
      case 'spam':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!phoneNumber) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Phone number not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {phoneNumber.phone_number}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#1976d2" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={24} color="#1976d2" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleBlockToggle}>
            <Ionicons
              name={phoneNumber.is_blocked ? 'checkmark-circle' : 'ban'}
              size={24}
              color={phoneNumber.is_blocked ? '#43a047' : '#f44336'}
            />
            <Text style={styles.actionButtonText}>
              {phoneNumber.is_blocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Label</Text>
            <TextInput
              style={styles.infoInput}
              placeholder="e.g., Work, Home"
              value={label}
              onChangeText={setLabel}
              onBlur={handleSaveLabel}
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Calls</Text>
            <Text style={styles.infoValue}>{phoneNumber.call_count}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>First Call</Text>
            <Text style={styles.infoValue}>{formatTimestamp(phoneNumber.first_call_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Call</Text>
            <Text style={styles.infoValue}>{formatTimestamp(phoneNumber.last_call_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: phoneNumber.is_blocked ? '#f44336' : '#43a047' },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {phoneNumber.is_blocked ? 'Blocked' : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this number..."
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

        {/* Related Voicemails */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Related Voicemails</Text>
          {relatedVoicemails.length > 0 ? (
            relatedVoicemails.map((vm) => (
              <TouchableOpacity
                key={vm.id}
                style={styles.voicemailItem}
                onPress={() => navigation.navigate('VoicemailDetail', { voicemailId: vm.id })}
              >
                <View style={styles.voicemailInfo}>
                  <Text style={styles.voicemailDate}>
                    {new Date(vm.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.voicemailDuration}>
                    {Math.floor(vm.duration / 60)}:{(vm.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>

                {vm.category && (
                  <View
                    style={[styles.categoryBadge, { backgroundColor: getCategoryColor(vm.category) }]}
                  >
                    <Text style={styles.categoryBadgeText}>{vm.category}</Text>
                  </View>
                )}

                <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noVoicemails}>
              <Ionicons name="voicemail" size={48} color="#bdbdbd" />
              <Text style={styles.noVoicemailsText}>No voicemails from this number</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#424242',
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
  voicemailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  voicemailInfo: {
    flex: 1,
  },
  voicemailDate: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 4,
  },
  voicemailDuration: {
    fontSize: 12,
    color: '#757575',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  noVoicemails: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noVoicemailsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
});
