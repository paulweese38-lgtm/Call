/**
 * CallWall Credit Disputes Screen
 * Automated credit dispute creation, submission, and tracking with AI analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  CreditDisputeEngine,
  DisputeCase,
  DisputeTemplate,
  DisputeAnalytics,
  BureauResponse
} from '../../services/credit/CreditDisputeEngine';
import {
  CreditScoreMonitor,
  CreditAccount
} from '../../services/credit/CreditScoreMonitor';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function CreditDisputesScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [templates, setTemplates] = useState<DisputeTemplate[]>([]);
  const [analytics, setAnalytics] = useState<DisputeAnalytics | null>(null);
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DisputeTemplate | null>(null);
  const [showCreateDisputeModal, setShowCreateDisputeModal] = useState(false);
  const [showDisputeDetailsModal, setShowDisputeDetailsModal] = useState(false);
  const [showEvidenceUploadModal, setShowEvidenceUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'templates' | 'analytics'>('active');

  const disputeEngine = new CreditDisputeEngine();
  const creditMonitor = new CreditScoreMonitor({
    enabled: true,
    alertThresholds: {
      scoreDrop: 10,
      newInquiry: true,
      latePayment: true,
      newAccount: true,
      collection: true,
      publicRecord: true
    },
    bureaus: { experian: true, equifax: true, transunion: true },
    refreshFrequency: 'weekly',
    notifications: { email: true, sms: false, push: true },
    privacySettings: { dataSharing: false, analytics: true, thirdParty: false }
  });

  const [newDispute, setNewDispute] = useState({
    accountId: '',
    description: '',
    evidence: [] as any[],
    selectedTemplateId: '',
    bureauSelection: {
      experian: true,
      equifax: true,
      transunion: true
    }
  });

  useEffect(() => {
    loadDisputeData();
  }, []);

  const loadDisputeData = async () => {
    setRefreshing(true);
    try {
      const [disputeData, templateData, analyticsData, accountData] = await Promise.all([
        Promise.resolve([]), // disputeEngine.getActiveDisputes() - using mock data
        Promise.resolve(disputeEngine.getDisputeTemplates()),
        Promise.resolve(disputeEngine.getDisputeAnalytics()),
        creditMonitor.getCreditAccounts()
      ]);

      // Mock active disputes
      const mockDisputes: DisputeCase[] = [
        {
          id: 'dispute_001',
          accountId: 'account_004',
          bureau: 'all',
          type: 'inaccurate_information',
          severity: 'moderate',
          description: 'Medical collection amount is incorrect - should be $800 not $1,200',
          evidence: [
            {
              id: 'evidence_001',
              type: 'payment_receipt',
              title: 'Medical Bill Statement',
              description: 'Original medical bill showing $800 balance',
              fileUrl: 'https://example.com/medical_bill.pdf',
              fileName: 'medical_bill.pdf',
              fileSize: 245760,
              uploadDate: '2024-01-10T00:00:00Z',
              verified: true,
              relevanceScore: 95,
              extractedText: 'Total Amount Due: $800.00'
            },
            {
              id: 'evidence_002',
              type: 'correspondence',
              title: 'Insurance EOB',
              description: 'Explanation of Benefits showing covered amount',
              fileUrl: 'https://example.com/eob.pdf',
              fileName: 'insurance_eob.pdf',
              fileSize: 184320,
              uploadDate: '2024-01-10T00:00:00Z',
              verified: true,
              relevanceScore: 90,
              extractedText: 'Amount Allowed: $800.00'
            }
          ],
          status: 'investigation',
          timeline: [
            {
              date: '2024-01-10T00:00:00Z',
              event: 'Dispute submitted to bureaus',
              description: 'Dispute submitted via certified mail to Experian, Equifax, and TransUnion',
              status: 'completed',
              automated: false,
              documents: ['dispute_letter', 'evidence_package']
            },
            {
              date: '2024-01-12T00:00:00Z',
              event: 'Bureaus received disputes',
              description: 'All three bureaus confirmed receipt of dispute',
              status: 'completed',
              automated: true
            },
            {
              date: '2024-01-15T00:00:00Z',
              event: '30-day investigation period',
              description: 'Credit bureaus have 30 days to investigate and respond',
              status: 'pending',
              automated: true
            }
          ],
          impactScore: 25,
          confidence: 85,
          legalGrounds: ['FCRA 15 USC 1681i(a)(1)(A)', 'Fair Credit Billing Act'],
          statutoryReferences: ['15 U.S.C. § 1681i', '15 U.S.C. § 1681c'],
          autoGenerated: false
        },
        {
          id: 'dispute_002',
          accountId: 'account_001',
          bureau: 'experian',
          type: 'outdated_information',
          severity: 'minor',
          description: 'Late payment from 2022 should be removed (over 2 years old)',
          evidence: [
            {
              id: 'evidence_003',
              type: 'credit_report',
              title: 'Old Credit Report',
              description: 'Credit report showing late payment date',
              fileUrl: 'https://example.com/old_report.pdf',
              fileName: 'credit_report_2022.pdf',
              fileSize: 524288,
              uploadDate: '2024-01-05T00:00:00Z',
              verified: true,
              relevanceScore: 88
            }
          ],
          status: 'resolved',
          timeline: [
            {
              date: '2024-01-05T00:00:00Z',
              event: 'Dispute submitted to Experian',
              description: 'Dispute for outdated late payment submitted',
              status: 'completed',
              automated: false
            },
            {
              date: '2024-01-20T00:00:00Z',
              event: 'Dispute resolved',
              description: 'Experian removed outdated late payment',
              status: 'completed',
              automated: true
            }
          ],
          impactScore: 15,
          confidence: 92,
          legalGrounds: ['FCRA 15 USC 1681c(a)'],
          statutoryReferences: ['15 U.S.C. § 1681c'],
          autoGenerated: true,
          outcome: {
            resolution: 'deleted',
            scoreChange: 15,
            details: 'Late payment removed from credit report',
            resolvedDate: '2024-01-20T00:00:00Z',
            documentsProvided: ['dispute_letter', 'credit_report'],
            finalDecision: 'Account information verified and corrected',
            appealAvailable: false
          }
        }
      ];

      setDisputes(mockDisputes);
      setTemplates(templateData);
      setAnalytics(analyticsData);
      setAccounts(accountData);
    } catch (error) {
      console.error('Error loading dispute data:', error);
      Alert.alert('Error', 'Unable to load dispute data');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return Colors.textSecondary;
      case 'submitted': return Colors.primary;
      case 'investigation': return Colors.warning;
      case 'additional_info': return Colors.accent;
      case 'resolved': return Colors.success;
      case 'rejected': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return Colors.textSecondary;
      case 'moderate': return Colors.warning;
      case 'major': return Colors.accent;
      case 'critical': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return Colors.success;
    if (confidence >= 60) return Colors.warning;
    return Colors.error;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDeadline = (dispute: DisputeCase): number => {
    const submissionDate = dispute.timeline.find(t => t.event.includes('submitted'));
    if (!submissionDate) return 0;

    const deadline = new Date(submissionDate.date);
    deadline.setDate(deadline.getDate() + 30); // 30-day investigation period

    const today = new Date();
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const analyzeAccountForDisputes = async (accountId: string) => {
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        Alert.alert('Error', 'Account not found');
        return;
      }

      // AI analysis of account for potential disputes
      const potentialDisputes = await disputeEngine.analyzeDispute(
        account,
        newDispute.description,
        newDispute.evidence
      );

      if (potentialDisputes.length > 0) {
        setSelectedTemplate(templates.find(t => t.category === potentialDisputes[0].type));
        Alert.alert(
          'Dispute Opportunities Found',
          `Found ${potentialDisputes.length} potential dispute strategies with up to ${Math.max(...potentialDisputes.map(d => d.impactScore))} points potential score improvement.`,
          [{ text: 'Review Strategies', onPress: () => {} }, { text: 'OK' }]
        );
      } else {
        Alert.alert('No Disputes Found', 'No clear dispute opportunities identified for this account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze account for disputes');
    }
  };

  const createDispute = async () => {
    try {
      if (!selectedTemplate) {
        Alert.alert('Error', 'Please select a dispute template');
        return;
      }

      // Generate dispute case
      const dispute = await disputeEngine.createDisputeCase(
        accounts.find(a => a.id === newDispute.accountId)!,
        selectedTemplate.category,
        newDispute.description,
        newDispute.evidence
      );

      // Submit to selected bureaus
      const selectedBureaus = Object.keys(newDispute.bureauSelection).filter(
        bureau => newDispute.bureauSelection[bureau as keyof typeof newDispute.bureauSelection]
      );

      await disputeEngine.submitDispute(dispute, selectedBureaus);

      Alert.alert('Success', 'Dispute submitted successfully! Tracking number will be provided soon.');

      // Reset form
      setShowCreateDisputeModal(false);
      setNewDispute({
        accountId: '',
        description: '',
        evidence: [],
        selectedTemplateId: '',
        bureauSelection: {
          experian: true,
          equifax: true,
          transunion: true
        }
      });

      loadDisputeData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create and submit dispute');
    }
  };

  const renderDisputeItem = (dispute: DisputeCase) => {
    const daysUntilDeadline = getDaysUntilDeadline(dispute);
    const account = accounts.find(a => a.id === dispute.id);

    return (
      <TouchableOpacity
        key={dispute.id}
        style={styles.disputeCard}
        onPress={() => {
          setSelectedDispute(dispute);
          setShowDisputeDetailsModal(true);
        }}
      >
        <View style={styles.disputeHeader}>
          <View style={styles.disputeInfo}>
            <Text style={styles.disputeTitle}>
              {dispute.type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.disputeDescription}>
              {account?.name || 'Unknown Account'}
            </Text>
            <Text style={styles.disputeDate}>
              Submitted: {formatDate(dispute.timeline[0]?.date || '')}
            </Text>
          </View>

          <View style={styles.disputeStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispute.status) }]}>
              <Text style={styles.statusText}>{dispute.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(dispute.severity) }]}>
              <Text style={styles.severityText}>{dispute.severity.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.disputeMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{dispute.confidence}%</Text>
            <Text style={styles.metricLabel">Success Rate</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue">+{dispute.impactScore}</Text>
            <Text style={styles.metricLabel">Score Impact</Text>
          </View>
          {dispute.status === 'investigation' && (
            <View style={styles.metricItem">
              <Text style={styles.metricValue">{daysUntilDeadline}d</Text>
              <Text style={styles.metricLabel">Until Response</Text>
            </View>
          )}
        </View>

        <View style={styles.disputeEvidence}>
          <Icon name="attach-file" size={16} color={Colors.textSecondary} />
          <Text style={styles.evidenceText">
            {dispute.evidence.length} evidence documents
          </Text>
        </View>

        {dispute.outcome && (
          <View style={styles.outcomeBanner}>
            <Icon name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.outcomeText">
              {dispute.outcome.resolution.replace('_', ' ').toUpperCase()} - +{dispute.outcome.scoreChange} points
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTemplateItem = (template: DisputeTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={[
        styles.templateCard,
        selectedTemplate?.id === template.id && styles.selectedTemplateCard
      ]}
      onPress={() => setSelectedTemplate(template)}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateTitle}>{template.name}</Text>
        <View style={styles.successRateBadge}>
          <Text style={styles.successRateText}>{template.successRate}% success</Text>
        </View>
      </View>

      <Text style={styles.templateDescription}>{template.description}</Text>

      <View style={styles.templateMetrics}>
        <View style={styles.templateMetric}>
          <Text style={styles.templateMetricValue">{template.averageResolutionTime}</Text>
          <Text style={styles.templateMetricLabel">Avg. Time</Text>
        </View>
        <View style={styles.templateMetric}>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: template.difficulty === 'easy' ? Colors.success :
                   template.difficulty === 'moderate' ? Colors.warning : Colors.accent }
          ]}>
            <Text style={styles.difficultyText">{template.difficulty.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.evidenceCount">
        Required: {template.requiredEvidence.length} documents
      </Text>
    </TouchableOpacity>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.totalDisputes}</Text>
            <Text style={styles.statLabel">Total Disputes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue">{analytics.successfulDisputes}</Text>
            <Text style={styles.statLabel">Successful</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue">{analytics.averageResolutionTime}d</Text>
            <Text style={styles.statLabel">Avg. Time</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue">+{analytics.averageScoreImprovement}</Text>
            <Text style={styles.statLabel">Avg. Score Gain</Text>
          </View>
        </View>

        <View style={styles.successRatesContainer}>
          <Text style={styles.sectionTitle">Success by Type</Text>
          {Object.entries(analytics.successByType).map(([type, rate]) => (
            <View key={type} style={styles.successRateItem}>
              <Text style={styles.successTypeLabel">{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${rate}%`, backgroundColor: getConfidenceColor(rate) }
                    ]}
                  />
                </View>
                <Text style={styles.successRatePercentage">{rate}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.commonIssuesContainer}>
          <Text style={styles.sectionTitle">Common Issues</Text>
          {analytics.commonIssues.map((issue, index) => (
            <View key={index} style={styles.commonIssueItem}>
              <Icon name="error" size={16} color={Colors.accent} />
              <Text style={styles.commonIssueText">{issue}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCreateDisputeModal = () => (
    <Modal
      visible={showCreateDisputeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateDisputeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle">Create New Dispute</Text>
            <TouchableOpacity onPress={() => setShowCreateDisputeModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup">
              <Text style={styles.inputLabel">Select Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountChip,
                      newDispute.accountId === account.id && styles.selectedAccountChip
                    ]}
                    onPress={() => setNewDispute({ ...newDispute, accountId: account.id })}
                  >
                    <Text style={[
                      styles.accountChipText,
                      newDispute.accountId === account.id && styles.selectedAccountChipText
                    ]}>
                      {account.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {newDispute.accountId && (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={() => analyzeAccountForDisputes(newDispute.accountId)}
              >
                <Icon name="analytics" size={20} color={Colors.white} />
                <Text style={styles.analyzeButtonText">AI Analyze for Disputes</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel">Dispute Description</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                value={newDispute.description}
                onChangeText={(text) => setNewDispute({ ...newDispute, description: text })}
                placeholder="Describe what's inaccurate about this account..."
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup">
              <Text style={styles.inputLabel">Evidence Documents</Text>
              <TouchableOpacity
                style={styles.evidenceUploadButton}
                onPress={() => setShowEvidenceUploadModal(true)}
              >
                <Icon name="cloud-upload" size={20} color={Colors.primary} />
                <Text style={styles.evidenceUploadText">Upload Evidence</Text>
              </TouchableOpacity>
              <Text style={styles.evidenceCountText">
                {newDispute.evidence.length} files uploaded
              </Text>
            </View>

            <View style={styles.inputGroup">
              <Text style={styles.inputLabel">Select Bureaus</Text>
              {Object.keys(newDispute.bureauSelection).map((bureau) => (
                <View key={bureau} style={styles.bureauSelectionRow}>
                  <Text style={styles.bureauName">{bureau.charAt(0).toUpperCase() + bureau.slice(1)}</Text>
                  <Switch
                    value={newDispute.bureauSelection[bureau as keyof typeof newDispute.bureauSelection]}
                    onValueChange={(value) =>
                      setNewDispute({
                        ...newDispute,
                        bureauSelection: { ...newDispute.bureauSelection, [bureau]: value }
                      })
                    }
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCreateDisputeModal(false)}
            >
              <Text style={styles.cancelButtonText">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton]}
              onPress={createDispute}
              disabled={!newDispute.accountId || !newDispute.description}
            >
              <Text style={styles.createButtonText">Submit Dispute</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDisputeDetailsModal = () => {
    if (!selectedDispute) return null;

    return (
      <Modal
        visible={showDisputeDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDisputeDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle">Dispute Details</Text>
              <TouchableOpacity onPress={() => setShowDisputeDetailsModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle">Dispute Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Type:</Text>
                  <Text style={styles.detailValue">{selectedDispute.type.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Status:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedDispute.status) }]}>
                    {selectedDispute.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Severity:</Text>
                  <Text style={[styles.detailValue, { color: getSeverityColor(selectedDispute.severity) }]}>
                    {selectedDispute.severity.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Success Probability:</Text>
                  <Text style={[styles.detailValue, { color: getConfidenceColor(selectedDispute.confidence) }]}>
                    {selectedDispute.confidence}%
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle">Impact & Timeline</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Potential Score Impact:</Text>
                  <Text style={styles.detailValue">+{selectedDispute.impactScore} points</Text>
                </View>
                <View style={styles.detailRow">
                  <Text style={styles.detailLabel">Bureaus:</Text>
                  <Text style={styles.detailValue">{selectedDispute.bureau.toUpperCase()}</Text>
                </View>
                {selectedDispute.status === 'investigation' && (
                  <View style={styles.detailRow">
                    <Text style={styles.detailLabel">Days Until Response:</Text>
                    <Text style={styles.detailValue">{getDaysUntilDeadline(selectedDispute)} days</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection">
                <Text style={styles.detailSectionTitle">Description</Text>
                <Text style={styles.detailDescription">{selectedDispute.description}</Text>
              </View>

              <View style={styles.detailSection">
                <Text style={styles.detailSectionTitle">Timeline</Text>
                {selectedDispute.timeline.map((event, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: getStatusColor(event.status) }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineEvent}>{event.event}</Text>
                      <Text style={styles.timelineDescription}>{event.description}</Text>
                      <Text style={styles.timelineDate">{formatDate(event.date)}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.detailSection">
                <Text style={styles.detailSectionTitle">Evidence Documents</Text>
                {selectedDispute.evidence.map((evidence, index) => (
                  <View key={index} style={styles.evidenceItem}>
                    <Icon name="attach-file" size={16} color={Colors.primary} />
                    <View style={styles.evidenceDetails}>
                      <Text style={styles.evidenceTitle">{evidence.title}</Text>
                      <Text style={styles.evidenceType">{evidence.type.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.evidenceRelevance">Relevance: {evidence.relevanceScore}%</Text>
                    </View>
                    {evidence.verified && (
                      <Icon name="verified" size={16} color={Colors.success} />
                    )}
                  </View>
                ))}
              </View>

              {selectedDispute.outcome && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle">Outcome</Text>
                  <View style={styles.outcomeCard}>
                    <Icon name="check-circle" size={24} color={Colors.success} />
                    <Text style={styles.outcomeTitle">
                      {selectedDispute.outcome.resolution.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.outcomeDetails">
                      Score improvement: +{selectedDispute.outcome.scoreChange} points
                    </Text>
                    <Text style={styles.outcomeDate">
                      Resolved: {formatDate(selectedDispute.outcome.resolvedDate)}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowDisputeDetailsModal(false);
                  // Navigate to appeal or follow-up actions
                }}
              >
                <Text style={styles.primaryButtonText">Generate Appeal Letter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle">Credit Disputes</Text>
          <Text style={styles.headerSubtitle">
            AI-powered dispute creation and tracking
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {[
          { key: 'active', label: 'Active', icon: 'pending' },
          { key: 'templates', label: 'Templates', icon: 'description' },
          { key: 'analytics', label: 'Analytics', icon: 'analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDisputeData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' && (
          <View style={styles.activeDisputesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle">Active Disputes</Text>
              <TouchableOpacity
                style={styles.createDisputeButton}
                onPress={() => setShowCreateDisputeModal(true)}
              >
                <Icon name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {disputes.map(renderDisputeItem)}

            {disputes.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="gavel" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle">No Active Disputes</Text>
                <Text style={styles.emptyDescription">
                  Create a dispute to start improving your credit score
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'templates' && (
          <View style={styles.templatesContainer}>
            <Text style={styles.sectionTitle">Dispute Templates</Text>
            {templates.map(renderTemplateItem)}
          </View>
        )}

        {activeTab === 'analytics' && renderAnalytics()}
      </ScrollView>

      {renderCreateDisputeModal()}
      {renderDisputeDetailsModal()}
    </View>
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
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  activeDisputesContainer: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  createDisputeButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  disputeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  disputeInfo: {
    flex: 1,
  },
  disputeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  disputeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  disputeDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  disputeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  disputeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  disputeEvidence: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  evidenceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  outcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}20`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  outcomeText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  templatesContainer: {
    padding: Spacing.lg,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.small,
  },
  selectedTemplateCard: {
    borderColor: Colors.primary,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  successRateBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  successRateText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  templateMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateMetric: {
    alignItems: 'center',
  },
  templateMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  templateMetricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  evidenceCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  analyticsContainer: {
    padding: Spacing.lg,
  },
  statsOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  successRatesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  successRateItem: {
    marginBottom: Spacing.md,
  },
  successTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.input,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  successRatePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    width: 40,
    textAlign: 'right',
  },
  commonIssuesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  commonIssueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commonIssueText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.input,
  },
  accountChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAccountChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  accountChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedAccountChipText: {
    color: Colors.white,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  analyzeButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  evidenceUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  evidenceUploadText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  evidenceCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  bureauSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bureauName: {
    fontSize: 16,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.input,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineEvent: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  timelineDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  evidenceDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  evidenceType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  evidenceRelevance: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  outcomeCard: {
    backgroundColor: `${Colors.success}20`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  outcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  outcomeDetails: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  outcomeDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});