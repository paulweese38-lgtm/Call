import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { generatePDF, saveDocument } from '../../services/legalDocumentService';

interface DocumentPreviewScreenProps {
  navigation: any;
  route: {
    params: {
      documentText: string;
      documentType: 'debt_validation' | 'cease_desist';
      formData: any;
    };
  };
}

export function DocumentPreviewScreen({ navigation, route }: DocumentPreviewScreenProps) {
  const { profile } = useAuthStore();
  const { documentText, documentType, formData } = route.params;

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const documentTypeLabel =
    documentType === 'debt_validation' ? 'Debt Validation Letter' : 'Cease & Desist Letter';

  const handleGeneratePDF = async () => {
    if (!profile) return;

    setIsGeneratingPDF(true);

    try {
      // Generate PDF and upload to Supabase
      const tempDocId = crypto.randomUUID();
      const result = await generatePDF(documentText, tempDocId);

      setPdfUrl(result.url);
      Alert.alert('Success', 'PDF generated successfully');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      // Save document to database
      const documentId = await saveDocument(
        profile.id,
        documentType,
        formData,
        documentText,
        pdfUrl || undefined
      );

      Alert.alert(
        'Success',
        'Document saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Legal Dashboard
              navigation.navigate('LegalDashboard');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Save document error:', error);
      Alert.alert('Error', error.message || 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: documentText,
        title: documentTypeLabel,
      });
    } catch (error: any) {
      console.error('Share error:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share document');
      }
    }
  };

  const handleEdit = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{documentTypeLabel}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Document Preview */}
      <ScrollView style={styles.documentContainer} contentContainerStyle={styles.documentContent}>
        <Text style={styles.documentText}>{documentText}</Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleEdit}
            disabled={isSaving || isGeneratingPDF}
          >
            <Ionicons name="pencil" size={20} color="#1976d2" />
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleShare}
            disabled={isSaving || isGeneratingPDF}
          >
            <Ionicons name="share-outline" size={20} color="#1976d2" />
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
          onPress={handleGeneratePDF}
          disabled={isGeneratingPDF || isSaving || !!pdfUrl}
        >
          {isGeneratingPDF ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="document" size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>
                {pdfUrl ? 'PDF Generated' : 'Generate PDF'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            styles.fullWidthButton,
            (!pdfUrl || isSaving) && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!pdfUrl || isSaving || isGeneratingPDF}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Save to Documents</Text>
            </>
          )}
        </TouchableOpacity>

        {!pdfUrl && (
          <Text style={styles.helperText}>Generate PDF first, then save to your documents</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
  documentContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  documentContent: {
    padding: 24,
  },
  documentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#212121',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  fullWidthButton: {
    width: '100%',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  saveButton: {
    backgroundColor: '#43a047',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
    borderColor: '#bdbdbd',
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
  helperText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginTop: -8,
  },
});
