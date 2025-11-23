import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../../store/authStore';
import { supabaseClient } from '../../lib/supabaseClient';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../constants/theme';

interface DocumentGeneratorProps {
  visible: boolean;
  onClose: () => void;
  documentType: 'debt_validation' | 'cease_desist' | 'custom';
  initialData?: any;
}

interface DebtValidationData {
  creditorName: string;
  creditorAddress: string;
  originalAmount: string;
  dateOfFirstDelinquency: string;
  accountNumber: string;
  disputeReasons: string[];
  requestTimeline: string;
  deliveryMethod: string;
  additionalNotes: string;
}

interface CeaseDesistData {
  agencyName: string;
  agencyAddress: string;
  referenceAccount: string;
  originalCreditor: string;
  communicationPreference: string;
  authorizedContact: string;
  contactPhone: string;
  contactEmail: string;
  additionalNotes: string;
}

const DEBT_VALIDATION_REASONS = [
  'I do not recognize this debt',
  'The amount is incorrect',
  'This is not my account',
  'Statute of limitations has expired',
  'I was not properly notified',
  'Other (specify in notes)',
];

export default function DocumentGenerator({
  visible,
  onClose,
  documentType,
  initialData,
}: DocumentGeneratorProps) {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState('');

  // Debt Validation Form Data
  const [debtValidationData, setDebtValidationData] = useState<DebtValidationData>({
    creditorName: '',
    creditorAddress: '',
    originalAmount: '',
    dateOfFirstDelinquency: '',
    accountNumber: '',
    disputeReasons: [],
    requestTimeline: '30 days',
    deliveryMethod: 'certified_mail',
    additionalNotes: '',
  });

  // Cease & Desist Form Data
  const [ceaseDesistData, setCeaseDesistData] = useState<CeaseDesistData>({
    agencyName: '',
    agencyAddress: '',
    referenceAccount: '',
    originalCreditor: '',
    communicationPreference: 'written_only',
    authorizedContact: '',
    contactPhone: '',
    contactEmail: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (initialData) {
      if (documentType === 'debt_validation') {
        setDebtValidationData({ ...debtValidationData, ...initialData });
      } else if (documentType === 'cease_desist') {
        setCeaseDesistData({ ...ceaseDesistData, ...initialData });
      }
    }
  }, [initialData, documentType]);

  const validateForm = (): boolean => {
    if (documentType === 'debt_validation') {
      const required = [
        'creditorName',
        'creditorAddress',
        'originalAmount',
        'dateOfFirstDelinquency',
      ];

      for (const field of required) {
        if (!debtValidationData[field as keyof DebtValidationData]) {
          Alert.alert('Validation Error', 'Please fill in all required fields');
          return false;
        }
      }

      if (debtValidationData.disputeReasons.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one dispute reason');
        return false;
      }
    } else if (documentType === 'cease_desist') {
      const required = [
        'agencyName',
        'agencyAddress',
        'referenceAccount',
        'originalCreditor',
      ];

      for (const field of required) {
        if (!ceaseDesistData[field as keyof CeaseDesistData]) {
          Alert.alert('Validation Error', 'Please fill in all required fields');
          return false;
        }
      }
    }

    return true;
  };

  const toggleDisputeReason = (reason: string) => {
    setDebtValidationData(prev => ({
      ...prev,
      disputeReasons: prev.disputeReasons.includes(reason)
        ? prev.disputeReasons.filter(r => r !== reason)
        : [...prev.disputeReasons, reason],
    }));
  };

  const generateDocument = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      let content = '';
      let templateData: any;

      if (documentType === 'debt_validation') {
        content = generateDebtValidationLetter();
        templateData = debtValidationData;
      } else if (documentType === 'cease_desist') {
        content = generateCeaseDesistLetter();
        templateData = ceaseDesistData;
      } else {
        content = generateCustomDocument();
        templateData = {};
      }

      setGeneratedDocument(content);

      // Save to database
      const documentResult = await supabaseClient.insert(
        'legal_documents',
        {
          user_id: user.id,
          document_type: documentType,
          template_data: templateData,
          generated_content: content,
          status: 'generated',
        }
      );

      if (documentResult.success) {
        setPreviewMode(true);
      } else {
        Alert.alert('Error', 'Failed to save document. Please try again.');
      }
    } catch (error) {
      console.error('Document generation error:', error);
      Alert.alert('Error', 'Failed to generate document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDebtValidationLetter = (): string => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const disputeText = debtValidationData.disputeReasons
      .map(reason => `• ${reason}`)
      .join('\n');

    return `[Current Date: ${currentDate}]

${user?.full_name || 'Your Name'}
${user?.phone_number || 'Your Phone'}
${user?.email || 'Your Email'}

Via Certified Mail, Return Receipt Requested

${debtValidationData.creditorName}
${debtValidationData.creditorAddress}

Re: Debt Validation Request
Account Reference: ${debtValidationData.accountNumber}
Original Amount: $${debtValidationData.originalAmount}

Dear ${debtValidationData.creditorName},

I am writing in response to your communication regarding the above-referenced debt. Pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692g(b), I hereby request that you provide validation of this debt.

Please provide the following information within ${debtValidationData.requestTimeline} of receipt of this letter:

1. The amount of the debt and verification of the amount owed
2. The name and address of the original creditor
3. Proof that you are legally authorized to collect this debt
4. Copies of any judgment or other legal documents
5. A complete payment history showing how the amount was calculated
6. The date of first delinquency with the original creditor

I am disputing this debt for the following reasons:
${disputeText}

Date of first delinquency: ${debtValidationData.dateOfFirstDelinquency}

Please be advised that during this validation period:
- All collection activity must cease
- You may not report this debt to any credit reporting agency
- You may not sell or transfer this debt to another collector
- You may not communicate with me regarding this debt

If you cannot provide adequate validation of this debt, you must permanently cease collection efforts and delete any negative information you have reported to credit bureaus.

I expect a written response within the specified timeframe. Please direct all correspondence to the address listed above.

${debtValidationData.additionalNotes ? `\nAdditional Notes: ${debtValidationData.additionalNotes}` : ''}

Sincerely,

_________________________
${user?.full_name || 'Your Name'}

This is an attempt to collect a debt. Any information obtained will be used for that purpose.`;
  };

  const generateCeaseDesistLetter = (): string => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `[Current Date: ${currentDate}]

${user?.full_name || 'Your Name'}
${user?.phone_number || 'Your Phone'}
${user?.email || 'Your Email'}

Via Certified Mail, Return Receipt Requested

${ceaseDesistData.agencyName}
${ceaseDesistData.agencyAddress}

Re: CEASE AND DESIST NOTICE
Account Reference: ${ceaseDesistData.referenceAccount}
Original Creditor: ${ceaseDesistData.originalCreditor}

Dear ${ceaseDesistData.agencyName},

Pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692c(c), I hereby demand that you immediately cease and desist from all communication with me regarding the above-referenced debt.

This includes, but is not limited to:
- Telephone calls to my home, work, or mobile phone
- Text messages or SMS communications
- Email communications
- Written correspondence
- Any attempts to contact me at my place of employment

I prefer to communicate regarding this matter ${
      ceaseDesistData.communicationPreference === 'written_only'
        ? 'through written correspondence only'
        : 'through written correspondence sent to the address above'
    }.

${
      ceaseDesistData.authorizedContact
        ? `If you must communicate with anyone other than myself, please direct all inquiries to:\n${ceaseDesistData.authorizedContact}\nPhone: ${ceaseDesistData.contactPhone}\nEmail: ${ceaseDesistData.contactEmail}`
        : ''
    }

Please be advised that any violation of this cease and desist notice may result in legal action. The FDCPA provides for statutory damages of up to $1,000 per violation, plus actual damages and attorney fees.

This notice does not:
- Admit liability for the alleged debt
- Waive any of my rights under the FDCPA
- Prevent you from taking legal action to collect the debt

Please acknowledge receipt of this cease and desist notice in writing within 15 days.

${ceaseDesistData.additionalNotes ? `\nAdditional Notes: ${ceaseDesistData.additionalNotes}` : ''}

Sincerely,

_________________________
${user?.full_name || 'Your Name'}

This is an attempt to collect a debt. Any information obtained will be used for that purpose.`;
  };

  const generateCustomDocument = (): string => {
    return `[Custom Document Template]

This is a placeholder for custom document generation.
Users would be able to create custom legal documents based on their specific needs.

Date: ${new Date().toLocaleDateString()}
User: ${user?.full_name || 'Your Name'}

[Custom content would appear here]`;
  };

  const saveAndClose = () => {
    setPreviewMode(false);
    setGeneratedDocument('');
    onClose();
  };

  const renderDebtValidationForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Creditor Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Creditor Name *"
          value={debtValidationData.creditorName}
          onChangeText={(text) => setDebtValidationData(prev => ({ ...prev, creditorName: text }))}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Creditor Address *"
          value={debtValidationData.creditorAddress}
          onChangeText={(text) => setDebtValidationData(prev => ({ ...prev, creditorAddress: text }))}
          multiline
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Original Amount Owed ($) *"
          value={debtValidationData.originalAmount}
          onChangeText={(text) => setDebtValidationData(prev => ({ ...prev, originalAmount: text }))}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Account Number"
          value={debtValidationData.accountNumber}
          onChangeText={(text) => setDebtValidationData(prev => ({ ...prev, accountNumber: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of First Delinquency *"
          value={debtValidationData.dateOfFirstDelinquency}
          onChangeText={(text) => setDebtValidationData(prev => ({ ...prev, dateOfFirstDelinquency: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Dispute Reasons *</Text>
        {DEBT_VALIDATION_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={styles.checkboxContainer}
            onPress={() => toggleDisputeReason(reason)}
          >
            <View style={[
              styles.checkbox,
              debtValidationData.disputeReasons.includes(reason) && styles.checkboxChecked
            ]}>
              {debtValidationData.disputeReasons.includes(reason) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>{reason}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional notes (optional)"
          value={debtValidationData.additionalNotes}
          onChangeText={(text) => setDebtValidationData(prev => ({ ...prev, additionalNotes: text }))}
          multiline
        />
      </View>
    </ScrollView>
  );

  const renderCeaseDesistForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Collection Agency Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Agency Name *"
          value={ceaseDesistData.agencyName}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, agencyName: text }))}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Agency Address *"
          value={ceaseDesistData.agencyAddress}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, agencyAddress: text }))}
          multiline
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Reference Account Number *"
          value={ceaseDesistData.referenceAccount}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, referenceAccount: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Original Creditor *"
          value={ceaseDesistData.originalCreditor}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, originalCreditor: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Communication Preferences</Text>
        <Text style={styles.label}>Preferred Communication Method:</Text>
        <View style={styles.radioGroup}>
          {[
            { key: 'written_only', label: 'Written correspondence only' },
            { key: 'all_but_phone', label: 'All communication except phone calls' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={styles.radioContainer}
              onPress={() => setCeaseDesistData(prev => ({ ...prev, communicationPreference: option.key }))}
            >
              <View style={[
                styles.radio,
                ceaseDesistData.communicationPreference === option.key && styles.radioChecked
              ]}>
                {ceaseDesistData.communicationPreference === option.key && (
                  <Text style={styles.radioDot}>●</Text>
                )}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Authorized Contact (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Authorized contact person"
          value={ceaseDesistData.authorizedContact}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, authorizedContact: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact phone"
          value={ceaseDesistData.contactPhone}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, contactPhone: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact email"
          value={ceaseDesistData.contactEmail}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, contactEmail: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional notes (optional)"
          value={ceaseDesistData.additionalNotes}
          onChangeText={(text) => setCeaseDesistData(prev => ({ ...prev, additionalNotes: text }))}
          multiline
        />
      </View>
    </ScrollView>
  );

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>Document Preview</Text>
        <TouchableOpacity
          style={styles.closePreviewButton}
          onPress={() => setPreviewMode(false)}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.previewContent}>
        <Text style={styles.previewText}>{generatedDocument}</Text>
      </ScrollView>
      <View style={styles.previewActions}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setPreviewMode(false)}
        >
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={saveAndClose}
        >
          <Text style={styles.primaryButtonText}>Save & Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'debt_validation':
        return 'Debt Validation Letter';
      case 'cease_desist':
        return 'Cease & Desist Letter';
      case 'custom':
        return 'Custom Document';
      default:
        return 'Legal Document';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getDocumentTitle()}</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        {previewMode ? (
          renderPreview()
        ) : (
          <View style={styles.content}>
            {documentType === 'debt_validation' && renderDebtValidationForm()}
            {documentType === 'cease_desist' && renderCeaseDesistForm()}
            {documentType === 'custom' && (
              <View style={styles.formContainer}>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Custom Document</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter your custom document content here..."
                    multiline
                    numberOfLines={10}
                  />
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={generateDocument}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Generate Document</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...Shadows.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.input,
    color: Colors.textInput,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  radioGroup: {
    marginBottom: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  radioDot: {
    color: Colors.white,
    fontSize: 12,
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Preview styles
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  previewHeader: {
    backgroundColor: Colors.primary,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  closePreviewButton: {
    padding: 4,
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});