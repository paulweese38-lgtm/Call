import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { generateDebtValidationLetter, generatePDF, saveDocument } from '../../services/legalDocumentService';

interface FormData {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  creditorName: string;
  collectionAgency: string;
  creditorAddress: string;
  accountNumber: string;
  debtAmount: string;
  delinquencyDate: string;
  lastPaymentDate: string;
  disputeReasons: string[];
  otherReason: string;
  deliveryMethod: string;
  acknowledgeDisclaimer: boolean;
}

export function DebtValidationForm({ navigation, onComplete }: any) {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    fullName: profile?.full_name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: profile?.phone_number || '',
    email: profile?.email || '',
    creditorName: '',
    collectionAgency: '',
    creditorAddress: '',
    accountNumber: '',
    debtAmount: '',
    delinquencyDate: '',
    lastPaymentDate: '',
    disputeReasons: [],
    otherReason: '',
    deliveryMethod: 'certified_mail',
    acknowledgeDisclaimer: false,
  });

  const disputeOptions = [
    'I do not recognize this debt',
    'The amount is incorrect',
    'This debt has been paid',
    'This debt is beyond statute of limitations',
    'I am a victim of identity theft',
  ];

  const updateField = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const toggleDisputeReason = (reason: string) => {
    const current = formData.disputeReasons;
    if (current.includes(reason)) {
      updateField('disputeReasons', current.filter((r) => r !== reason));
    } else {
      updateField('disputeReasons', [...current, reason]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.creditorName.trim()) newErrors.creditorName = 'Creditor name is required';
    if (!formData.creditorAddress.trim()) newErrors.creditorAddress = 'Creditor address is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.debtAmount.trim()) newErrors.debtAmount = 'Debt amount is required';
    if (!formData.delinquencyDate.trim()) newErrors.delinquencyDate = 'Delinquency date is required';

    if (formData.disputeReasons.length === 0) {
      newErrors.disputeReasons = 'Select at least one dispute reason';
    }

    if (!formData.acknowledgeDisclaimer) {
      newErrors.disclaimer = 'You must acknowledge the disclaimer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Generate document text
      const documentText = await generateDebtValidationLetter(formData);

      // Navigate to preview screen
      navigation.navigate('DocumentPreview', {
        documentText,
        documentType: 'debt_validation',
        formData,
      });
    } catch (error: any) {
      console.error('Preview error:', error);
      Alert.alert('Error', error.message || 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!profile) return;

    setIsLoading(true);

    try {
      await saveDocument(profile.id, 'debt_validation', formData, '');
      Alert.alert('Success', 'Draft saved successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Save draft error:', error);
      Alert.alert('Error', error.message || 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.heading}>Debt Validation Letter</Text>
        <Text style={styles.subtitle}>
          Generate a FDCPA-compliant letter to request debt verification
        </Text>

        {/* Section 1: Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={formData.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              placeholder="John Doe"
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="123 Main St"
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={formData.city}
                onChangeText={(text) => updateField('city', text)}
                placeholder="City"
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={[styles.input, errors.state && styles.inputError]}
                value={formData.state}
                onChangeText={(text) => updateField('state', text.toUpperCase())}
                placeholder="CA"
                maxLength={2}
              />
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>ZIP *</Text>
              <TextInput
                style={[styles.input, errors.zip && styles.inputError]}
                value={formData.zip}
                onChangeText={(text) => updateField('zip', text)}
                placeholder="12345"
                keyboardType="numeric"
                maxLength={5}
              />
              {errors.zip && <Text style={styles.errorText}>{errors.zip}</Text>}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
        </View>

        {/* Section 2: Creditor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creditor Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Original Creditor Name *</Text>
            <TextInput
              style={[styles.input, errors.creditorName && styles.inputError]}
              value={formData.creditorName}
              onChangeText={(text) => updateField('creditorName', text)}
              placeholder="ABC Collections"
            />
            {errors.creditorName && <Text style={styles.errorText}>{errors.creditorName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Collection Agency (if different)</Text>
            <TextInput
              style={styles.input}
              value={formData.collectionAgency}
              onChangeText={(text) => updateField('collectionAgency', text)}
              placeholder="XYZ Collection Agency"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Creditor Address *</Text>
            <TextInput
              style={[styles.input, errors.creditorAddress && styles.inputError]}
              value={formData.creditorAddress}
              onChangeText={(text) => updateField('creditorAddress', text)}
              placeholder="123 Main St, City, State ZIP"
              multiline
            />
            {errors.creditorAddress && (
              <Text style={styles.errorText}>{errors.creditorAddress}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Account/Reference Number *</Text>
            <TextInput
              style={[styles.input, errors.accountNumber && styles.inputError]}
              value={formData.accountNumber}
              onChangeText={(text) => updateField('accountNumber', text)}
              placeholder="ACC-12345"
            />
            {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
          </View>
        </View>

        {/* Section 3: Debt Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debt Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Original Debt Amount *</Text>
            <TextInput
              style={[styles.input, errors.debtAmount && styles.inputError]}
              value={formData.debtAmount}
              onChangeText={(text) => updateField('debtAmount', text)}
              placeholder="1500.00"
              keyboardType="decimal-pad"
            />
            {errors.debtAmount && <Text style={styles.errorText}>{errors.debtAmount}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of First Delinquency *</Text>
            <TextInput
              style={[styles.input, errors.delinquencyDate && styles.inputError]}
              value={formData.delinquencyDate}
              onChangeText={(text) => updateField('delinquencyDate', text)}
              placeholder="MM/DD/YYYY"
            />
            {errors.delinquencyDate && (
              <Text style={styles.errorText}>{errors.delinquencyDate}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Payment Date (optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.lastPaymentDate}
              onChangeText={(text) => updateField('lastPaymentDate', text)}
              placeholder="MM/DD/YYYY"
            />
          </View>
        </View>

        {/* Section 4: Dispute Reasons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispute Reasons *</Text>
          <Text style={styles.helpText}>Select all that apply</Text>

          {disputeOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.checkboxContainer}
              onPress={() => toggleDisputeReason(option)}
            >
              <View style={[styles.checkbox, formData.disputeReasons.includes(option) && styles.checkboxChecked]}>
                {formData.disputeReasons.includes(option) && (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{option}</Text>
            </TouchableOpacity>
          ))}

          {formData.disputeReasons.includes('Other reason') && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Specify Other Reason</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.otherReason}
                onChangeText={(text) => updateField('otherReason', text)}
                placeholder="Describe your reason..."
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {errors.disputeReasons && (
            <Text style={styles.errorText}>{errors.disputeReasons}</Text>
          )}
        </View>

        {/* Section 5: Delivery Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => updateField('deliveryMethod', 'certified_mail')}
          >
            <View style={styles.radio}>
              {formData.deliveryMethod === 'certified_mail' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Certified Mail (Recommended)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => updateField('deliveryMethod', 'regular_mail')}
          >
            <View style={styles.radio}>
              {formData.deliveryMethod === 'regular_mail' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Regular Mail</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            This letter is generated based on your input and FDCPA guidelines. CallWall is not a
            law firm and does not provide legal advice. For complex situations, consult with an
            attorney.
          </Text>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => updateField('acknowledgeDisclaimer', !formData.acknowledgeDisclaimer)}
          >
            <View
              style={[
                styles.checkbox,
                formData.acknowledgeDisclaimer && styles.checkboxChecked,
              ]}
            >
              {formData.acknowledgeDisclaimer && (
                <Ionicons name="checkmark" size={18} color="#ffffff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>I understand this is not legal advice</Text>
          </TouchableOpacity>
          {errors.disclaimer && <Text style={styles.errorText}>{errors.disclaimer}</Text>}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSaveDraft}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handlePreview}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Preview Document</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
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
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#e53935',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#bdbdbd',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#bdbdbd',
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1976d2',
  },
  radioLabel: {
    fontSize: 14,
    color: '#424242',
  },
  disclaimerContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#e65100',
    lineHeight: 18,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
});
