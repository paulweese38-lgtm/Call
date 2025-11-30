import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export function AddPhoneNumberScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9\s\-\(\)]+$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !profile) return;

    setIsSaving(true);

    try {
      // Check tier limit
      const { data: hasAccess, error: checkError } = await supabase.rpc('check_tier_limit', {
        p_user_id: profile.id,
        p_operation_type: 'phone_number',
      });

      if (checkError) throw checkError;

      if (!hasAccess) {
        Alert.alert(
          'Limit Reached',
          'You've reached your phone number tracking limit. Upgrade to Premium for unlimited numbers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
          ]
        );
        return;
      }

      // Check if number already exists
      const { data: existing } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('user_id', profile.id)
        .eq('phone_number', phoneNumber.trim())
        .single();

      if (existing) {
        Alert.alert('Error', 'This phone number is already tracked');
        return;
      }

      // Insert new phone number
      const { error } = await supabase.from('phone_numbers').insert({
        user_id: profile.id,
        phone_number: phoneNumber.trim(),
        label: label.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      // Increment usage
      await supabase.rpc('increment_usage', {
        p_user_id: profile.id,
        p_operation_type: 'phone_number',
      });

      Alert.alert('Success', 'Phone number added', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Add phone number error:', error);
      Alert.alert('Error', error.message || 'Failed to add phone number');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Phone Number</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChangeText={(value) => {
                setPhoneNumber(value);
                if (errors.phoneNumber) {
                  setErrors({ ...errors, phoneNumber: '' });
                }
              }}
              keyboardType="phone-pad"
              editable={!isSaving}
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          {/* Label */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Work, Home, Doctor"
              value={label}
              onChangeText={setLabel}
              editable={!isSaving}
            />
            <Text style={styles.helperText}>Add a friendly name to identify this number</Text>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this number..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#1976d2" />
            <Text style={styles.infoText}>
              This number will be tracked for call analytics and blocking. You can manage it anytime from the Phone tab.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Add Phone Number</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
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
  inputError: {
    borderColor: '#f44336',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#f44336',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: '#757575',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
