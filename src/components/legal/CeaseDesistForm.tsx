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
import { generateCeaseDesistLetter, saveDocument } from '../../services/legalDocumentService';

interface CeaseDesistFormData {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  agencyName: string;
  agencyAddress: string;
  accountNumber: string;
  originalCreditor: string;
  firstContactDate: string;
  contactFrequency: string;
  contactMethods: string[];
  ceaseType: string;
  violations: string[];
  otherViolation: string;
  acknowledgeDisclaimer: boolean;
}

export function CeaseDesistForm({ navigation }: any) {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CeaseDesistFormData>({
    fullName: profile?.full_name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: profile?.phone_number || '',
    email: profile?.email || '',
    agencyName: '',
    agencyAddress: '',
    accountNumber: '',
    originalCreditor: '',
    firstContactDate: '',
    contactFrequency: 'daily',
    contactMethods: [],
    ceaseType: 'complete',
    violations: [],
    otherViolation: '',
    acknowledgeDisclaimer: false,
  });

  const contactMethodOptions = [
    'Phone calls',
    'Text messages',
    'Emails',
    'Letters',
    'Social media',
    'In-person visits',
  ];

  const violationOptions = [
    'Called before 8am or after 9pm',
    'Called me at work after being told not to',
    'Contacted third parties about my debt',
    'Used threatening or abusive language',
    'Misrepresented the debt amount or legal status',
    'Failed to provide validation of debt',
  ];

  const updateField = (field: keyof CeaseDesistFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const toggleArrayItem = (field: 'contactMethods' | 'violations', item: string) => {
    const current = formData[field];
    if (current.includes(item)) {
      updateField(field, current.filter((i) => i !== item));
    } else {
      updateField(field, [...current, item]);
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
    if (!formData.agencyName.trim()) newErrors.agencyName = 'Agency name is required';
    if (!formData.agencyAddress.trim()) newErrors.agencyAddress = 'Agency address is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.firstContactDate.trim())
      newErrors.firstContactDate = 'First contact date is required';

    if (formData.contactMethods.length === 0) {
      newErrors.contactMethods = 'Select at least one contact method';
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
      const documentText = await generateCeaseDesistLetter(formData);

      navigation.navigate('DocumentPreview', {
        documentText,
        documentType: 'cease_desist',
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
      await saveDocument(profile.id, 'cease_desist', formData, '');
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
        <Text style={styles.heading}>Cease & Desist Letter</Text>
        <Text style={styles.subtitle}>
          Generate a FDCPA-compliant letter to stop collection communications
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

        {/* Section 2: Collection Agency Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Agency Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Agency Name *</Text>
            <TextInput
              style={[styles.input, errors.agencyName && styles.inputError]}
              value={formData.agencyName}
              onChangeText={(text) => updateField('agencyName', text)}
              placeholder="XYZ Collection Agency"
            />
            {errors.agencyName && <Text style={styles.errorText}>{errors.agencyName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Agency Address *</Text>
            <TextInput
              style={[styles.input, errors.agencyAddress && styles.inputError]}
              value={formData.agencyAddress}
              onChangeText={(text) => updateField('agencyAddress', text)}
              placeholder="123 Main St, City, State ZIP"
              multiline
            />
            {errors.agencyAddress && <Text style={styles.errorText}>{errors.agencyAddress}</Text>}
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Original Creditor (if known)</Text>
            <TextInput
              style={styles.input}
              value={formData.originalCreditor}
              onChangeText={(text) => updateField('originalCreditor', text)}
              placeholder="Original Company Name"
            />
          </View>
        </View>

        {/* Section 3: Communication History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication History</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of First Contact *</Text>
            <TextInput
              style={[styles.input, errors.firstContactDate && styles.inputError]}
              value={formData.firstContactDate}
              onChangeText={(text) => updateField('firstContactDate', text)}
              placeholder="MM/DD/YYYY"
            />
            {errors.firstContactDate && (
              <Text style={styles.errorText}>{errors.firstContactDate}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Frequency of Contact *</Text>
            <View style={styles.pickerContainer}>
              {['Multiple times per day', 'Daily', 'Several times per week', 'Weekly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={styles.radioContainer}
                  onPress={() => updateField('contactFrequency', freq)}
                >
                  <View style={styles.radio}>
                    {formData.contactFrequency === freq && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>{freq}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Methods Used *</Text>
            <Text style={styles.helpText}>Select all that apply</Text>

            {contactMethodOptions.map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.checkboxContainer}
                onPress={() => toggleArrayItem('contactMethods', method)}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.contactMethods.includes(method) && styles.checkboxChecked,
                  ]}
                >
                  {formData.contactMethods.includes(method) && (
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{method}</Text>
              </TouchableOpacity>
            ))}

            {errors.contactMethods && (
              <Text style={styles.errorText}>{errors.contactMethods}</Text>
            )}
          </View>
        </View>

        {/* Section 4: Cease and Desist Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cease and Desist Instructions</Text>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => updateField('ceaseType', 'complete')}
          >
            <View style={styles.radio}>
              {formData.ceaseType === 'complete' && <View style={styles.radioSelected} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Complete Cease and Desist</Text>
              <Text style={styles.radioSubtext}>Stop all communication</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => updateField('ceaseType', 'written_only')}
          >
            <View style={styles.radio}>
              {formData.ceaseType === 'written_only' && <View style={styles.radioSelected} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Written Communication Only</Text>
              <Text style={styles.radioSubtext}>Allow mail, no calls</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioContainer}
            onPress={() => updateField('ceaseType', 'legal_only')}
          >
            <View style={styles.radio}>
              {formData.ceaseType === 'legal_only' && <View style={styles.radioSelected} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Legal Correspondence Only</Text>
              <Text style={styles.radioSubtext}>Only through attorney</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 5: FDCPA Violations (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FDCPA Violations (Optional)</Text>
          <Text style={styles.helpText}>Select any violations that have occurred</Text>

          {violationOptions.map((violation) => (
            <TouchableOpacity
              key={violation}
              style={styles.checkboxContainer}
              onPress={() => toggleArrayItem('violations', violation)}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.violations.includes(violation) && styles.checkboxChecked,
                ]}
              >
                {formData.violations.includes(violation) && (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{violation}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Other Violation (specify)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.otherViolation}
              onChangeText={(text) => updateField('otherViolation', text)}
              placeholder="Describe any other violations..."
              multiline
              numberOfLines={3}
            />
          </View>
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
  pickerContainer: {
    marginTop: 8,
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
    fontWeight: '500',
  },
  radioSubtext: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
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
