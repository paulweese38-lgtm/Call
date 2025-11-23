import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { supabaseClient } from '../lib/supabaseClient';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import AIDocumentGenerator from '../../components/legal/AIDocumentGenerator';

interface LegalDocument {
  id: string;
  document_type: string;
  template_data: any;
  status: string;
  created_at: string;
  pdf_url?: string;
}

interface ThreatAnalysis {
  id: string;
  communication_type: string;
  threat_level: 'low' | 'medium' | 'high';
  analysis_text: string;
  created_at: string;
}

export default function LegalDashboardScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<LegalDocument[]>([]);
  const [threatAnalyses, setThreatAnalyses] = useState<ThreatAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIDocumentGenerator, setShowAIDocumentGenerator] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load recent documents
      const documentsResult = await supabaseClient.select<LegalDocument>(
        'legal_documents',
        '*',
        { user_id: user.id },
        'Failed to load documents'
      );

      if (documentsResult.success && documentsResult.data) {
        // Sort by created_at descending and take latest 5
        const sorted = documentsResult.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentDocuments(sorted);
      }

      // Load threat analyses (placeholder - would need actual table)
      // For now, we'll create mock data
      const mockThreatAnalyses: ThreatAnalysis[] = [
        {
          id: '1',
          communication_type: 'Phone Call',
          threat_level: 'medium',
          analysis_text: 'Aggressive tone detected, potential harassment',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          communication_type: 'Text Message',
          threat_level: 'low',
          analysis_text: 'Standard debt collection communication',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setThreatAnalyses(mockThreatAnalyses);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getDocumentIcon = (documentType: string): string => {
    switch (documentType) {
      case 'debt_validation':
        return 'description';
      case 'cease_desist':
        return 'block';
      case 'custom':
        return 'edit-document';
      default:
        return 'description';
    }
  };

  const getDocumentTitle = (documentType: string): string => {
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

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'high':
        return Colors.accent;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return Colors.textMuted;
    }
  };

  const getThreatLevelIcon = (level: string): string => {
    switch (level) {
      case 'high':
        return 'warning';
      case 'medium':
        return 'error';
      case 'low':
        return 'check-circle';
      default:
        return 'help';
    }
  };

  const isFeatureLocked = (feature: string): boolean => {
    const premiumFeatures = ['threat_analysis', 'advanced_templates'];
    return premiumFeatures.includes(feature) && user?.subscription_tier === 'free';
  };

  const handleFeaturePress = (feature: string) => {
    if (isFeatureLocked(feature)) {
      Alert.alert(
        'Premium Feature',
        'This feature requires a premium subscription. Upgrade to unlock all legal protection tools.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    switch (feature) {
      case 'debt_validation':
        navigation.navigate('DocumentGenerator', { type: 'debt_validation' });
        break;
      case 'cease_desist':
        navigation.navigate('DocumentGenerator', { type: 'cease_desist' });
        break;
      case 'threat_analysis':
        // Navigate to threat analysis screen
        Alert.alert('Threat Analysis', 'Threat analysis feature coming soon!');
        break;
      case 'custom_document':
        navigation.navigate('DocumentGenerator', { type: 'custom' });
        break;
    }
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleFeaturePress('debt_validation')}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="description" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Debt Validation</Text>
          <Text style={styles.actionDescription}>Request debt validation from creditors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleFeaturePress('cease_desist')}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="block" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Cease & Desist</Text>
          <Text style={styles.actionDescription}>Stop unwanted communications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleFeaturePress('threat_analysis')}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="security" size={28} color={Colors.primary} />
            {isFeatureLocked('threat_analysis') && (
              <View style={styles.lockOverlay}>
                <Icon name="lock" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.actionTitle}>Threat Analysis</Text>
          <Text style={styles.actionDescription}>AI-powered threat detection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleFeaturePress('custom_document')}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="edit" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Custom Document</Text>
          <Text style={styles.actionDescription}>Create custom legal documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentDocuments = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Documents</Text>
        <TouchableOpacity onPress={() => Alert.alert('Documents', 'Document library coming soon!')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentDocuments.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="description" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No documents yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first legal document above</Text>
        </View>
      ) : (
        recentDocuments.map((doc) => (
          <TouchableOpacity key={doc.id} style={styles.documentItem}>
            <View style={styles.documentIconContainer}>
              <Icon name={getDocumentIcon(doc.document_type)} size={24} color={Colors.primary} />
            </View>
            <View style={styles.documentContent}>
              <Text style={styles.documentTitle}>{getDocumentTitle(doc.document_type)}</Text>
              <Text style={styles.documentDate}>
                {new Date(doc.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.documentStatus}>
              <Text style={[
                styles.statusText,
                { color: doc.status === 'generated' ? '#00cc66' : '#ff8800' }
              ]}>
                {doc.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderThreatAnalysis = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Threat Analysis</Text>
        {isFeatureLocked('threat_analysis') && (
          <Icon name="lock" size={16} color="#888" />
        )}
      </View>

      {threatAnalyses.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="security" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No threats detected</Text>
          <Text style={styles.emptyStateSubtext}>
            {isFeatureLocked('threat_analysis')
              ? 'Upgrade to premium for AI threat analysis'
              : 'Communications will be analyzed automatically'
            }
          </Text>
        </View>
      ) : (
        threatAnalyses.map((threat) => (
          <View key={threat.id} style={styles.threatItem}>
            <View style={styles.threatIconContainer}>
              <Icon
                name={getThreatLevelIcon(threat.threat_level)}
                size={24}
                color={getThreatLevelColor(threat.threat_level)}
              />
            </View>
            <View style={styles.threatContent}>
              <Text style={styles.threatTitle}>{threat.communication_type}</Text>
              <Text style={styles.threatDescription}>{threat.analysis_text}</Text>
              <Text style={styles.threatDate}>
                {new Date(threat.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.threatLevel}>
              <Text
                style={[
                  styles.threatLevelText,
                  { color: getThreatLevelColor(threat.threat_level) }
                ]}
              >
                {threat.threat_level.toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderLegalTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal Tips</Text>
      <View style={styles.tipsContainer}>
        <View style={styles.tipItem}>
          <Icon name="lightbulb" size={20} color="#ff8800" />
          <Text style={styles.tipText}>
            Always keep records of all communications with debt collectors
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="lightbulb" size={20} color="#ff8800" />
          <Text style={styles.tipText}>
            Request debt validation within 30 days of first contact
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="lightbulb" size={20} color="#ff8800" />
          <Text style={styles.tipText}>
            Save copies of all sent documents for your records
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Legal Protection</Text>
        <Text style={styles.headerSubtitle}>
          FDCPA-compliant tools to protect your rights
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderQuickActions()}
        {renderRecentDocuments()}
        {renderThreatAnalysis()}
        {renderLegalTips()}
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
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
  },
  documentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  threatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threatContent: {
    flex: 1,
  },
  threatTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  threatDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  threatDate: {
    fontSize: 10,
    color: '#888',
  },
  threatLevel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  threatLevelText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
  tipsContainer: {
    paddingVertical: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});