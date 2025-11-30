import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getCurrentUsage, getTierLimits } from '../../services/subscriptionService';

interface LegalDocument {
  id: string;
  document_type: string;
  status: string;
  created_at: string;
}

export function LegalDashboardScreen({ navigation }: any) {
  const { profile } = useAuthStore();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!profile) return;

      // Load documents
      const { data: docs, error: docsError } = await supabase
        .from('legal_documents')
        .select('id, document_type, status, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (docsError) throw docsError;
      setDocuments(docs || []);

      // Load usage
      const currentUsage = await getCurrentUsage(profile.id);
      setUsage(currentUsage);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleCreateDocument = (type: 'debt_validation' | 'cease_desist') => {
    // Check if at limit
    if (profile?.subscription_tier === 'free' && usage?.legal_documents_count >= 2) {
      // Show upgrade modal
      navigation.navigate('Subscription');
      return;
    }

    navigation.navigate('DocumentForm', { documentType: type });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'debt_validation':
        return 'Debt Validation';
      case 'cease_desist':
        return 'Cease & Desist';
      default:
        return 'Custom';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#9e9e9e';
      case 'generated':
        return '#43a047';
      case 'sent':
        return '#1976d2';
      default:
        return '#757575';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  const tier = profile?.subscription_tier || 'free';
  const limits = getTierLimits(tier as any);
  const usedCount = usage?.legal_documents_count || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Usage Indicator (Free tier only) */}
      {tier === 'free' && (
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Documents Used This Month</Text>
            <Text style={styles.usageCount}>
              {usedCount}/{limits.legalDocuments}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(usedCount / limits.legalDocuments) * 100}%` },
              ]}
            />
          </View>
          {usedCount >= limits.legalDocuments && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Create Document</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleCreateDocument('debt_validation')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="document-text" size={32} color="#1976d2" />
          </View>
          <Text style={styles.actionTitle}>Debt Validation</Text>
          <Text style={styles.actionSubtitle}>Request debt verification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleCreateDocument('cease_desist')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#fce4ec' }]}>
            <Ionicons name="hand-left" size={32} color="#c2185b" />
          </View>
          <Text style={styles.actionTitle}>Cease & Desist</Text>
          <Text style={styles.actionSubtitle}>Stop collection calls</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Documents */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Documents</Text>
        {documents.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('DocumentsList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#bdbdbd" />
          <Text style={styles.emptyStateTitle}>No documents yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first legal document using the options above
          </Text>
        </View>
      ) : (
        <View style={styles.documentsList}>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => navigation.navigate('DocumentDetail', { documentId: doc.id })}
            >
              <View style={styles.documentHeader}>
                <View
                  style={[
                    styles.documentTypeBadge,
                    {
                      backgroundColor:
                        doc.document_type === 'debt_validation' ? '#e3f2fd' : '#fce4ec',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.documentTypeBadgeText,
                      {
                        color: doc.document_type === 'debt_validation' ? '#1976d2' : '#c2185b',
                      },
                    ]}
                  >
                    {getDocumentTypeLabel(doc.document_type)}
                  </Text>
                </View>
                <View
                  style={[styles.statusIndicator, { backgroundColor: getStatusColor(doc.status) }]}
                />
              </View>
              <Text style={styles.documentDate}>{formatDate(doc.created_at)}</Text>
              <Text style={styles.documentStatus}>{doc.status.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Legal Tips Carousel */}
      <Text style={styles.sectionTitle}>Know Your Rights</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsCarousel}>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>FDCPA Protection</Text>
          <Text style={styles.tipText}>
            Collectors cannot call before 8am or after 9pm in your time zone
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Debt Validation</Text>
          <Text style={styles.tipText}>
            You have 30 days to request validation after first contact
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Cease Contact</Text>
          <Text style={styles.tipText}>
            You can request in writing that collectors stop calling you
          </Text>
        </View>
      </ScrollView>
    </ScrollView>
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
  usageCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '600',
  },
  usageCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  upgradeButton: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  seeAllText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  documentsList: {
    paddingHorizontal: 16,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  documentTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  documentDate: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  tipsCarousel: {
    paddingLeft: 16,
    marginBottom: 24,
  },
  tipCard: {
    width: 250,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
  },
});
