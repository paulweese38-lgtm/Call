/**
 * CallWall Debt Analysis Screen
 * Comprehensive debt analysis, validation, and legal strategy generation
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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  DebtCollectionTracker,
  CollectionInsights,
  SettlementOpportunity,
  ComplianceIssue,
  LegalAction
} from '../../services/debt/DebtCollectionTracker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function DebtAnalysisScreen({ navigation, route }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(route.params?.debt || null);
  const [settlementOpportunities, setSettlementOpportunities] = useState<SettlementOpportunity[]>([]);
  const [legalActions, setLegalActions] = useState<LegalAction[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showLegalActionModal, setShowLegalActionModal] = useState(false);
  const [validationRequest, setValidationRequest] = useState({
    letterSent: false,
    certifiedMail: false,
    trackingNumber: '',
    sentDate: '',
    collectorResponse: '',
    notes: ''
  });
  const [settlementOffer, setSettlementOffer] = useState({
    amount: '',
    terms: '',
    paymentPlan: false,
    numberOfPayments: '',
    monthlyAmount: ''
  });

  const tracker = new DebtCollectionTracker({
    monitoringEnabled: true,
    autoLogging: true,
    violationAlerts: true,
    escalationAlerts: true,
    statutoryLimitations: { enabled: true, stateRules: [] },
    dataRetention: { days: 365, autoDelete: false },
    privacySettings: { encryption: true, dataSharing: false, analytics: true }
  });

  useEffect(() => {
    loadDebtAnalysis();
  }, [selectedDebt]);

  const loadDebtAnalysis = async () => {
    if (!selectedDebt) {
      Alert.alert('Error', 'No debt selected for analysis');
      return;
    }

    setRefreshing(true);
    try {
      // Mock settlement opportunities
      const mockSettlements: SettlementOpportunity[] = [
        {
          debtId: selectedDebt.id || 'debt_001',
          collectorId: 'col_001',
          originalAmount: selectedDebt.currentAmount || 5000,
          settlementRange: {
            min: Math.floor((selectedDebt.currentAmount || 5000) * 0.3),
            max: Math.floor((selectedDebt.currentAmount || 5000) * 0.6)
          },
          likelihood: 85,
          timeframe: '30-60 days',
          strategy: 'Negotiate lump sum payment at 40% of original amount',
          legalStanding: 'Strong SOL defense available'
        },
        {
          debtId: selectedDebt.id || 'debt_002',
          collectorId: 'col_002',
          originalAmount: selectedDebt.currentAmount || 3000,
          settlementRange: {
            min: Math.floor((selectedDebt.currentAmount || 3000) * 0.2),
            max: Math.floor((selectedDebt.currentAmount || 3000) * 0.5)
          },
          likelihood: 70,
          timeframe: '60-90 days',
          strategy: 'Extended payment plan with reduced interest',
          legalStanding: 'Moderate - recent activity may affect SOL'
        }
      ];

      setSettlementOpportunities(mockSettlements);

      // Mock legal actions
      const mockLegalActions: LegalAction[] = [
        {
          id: 'legal_001',
          type: 'complaint',
          status: 'pending',
          date: '2024-01-15T00:00:00Z',
          authorities: ['CFPB', 'FTC', 'State Attorney General'],
          evidence: ['Call recordings', 'Voicemail transcripts', 'Written correspondence'],
          potentialDamages: 1500,
          description: 'FDCPA violations including harassment and false threats'
        },
        {
          id: 'legal_002',
          type: 'validation_request',
          status: 'pending',
          date: '2024-01-10T00:00:00Z',
          authorities: ['CFPB'],
          evidence: ['Initial collection letter', 'Validation request letter'],
          potentialDamages: 1000,
          description: 'Failure to provide proper debt validation'
        }
      ];

      setLegalActions(mockLegalActions);

      // Mock compliance issues
      const mockCompliance: ComplianceIssue[] = [
        {
          type: 'licensing',
          severity: 'major',
          description: 'Collector operating with expired license in current state',
          collectorId: 'col_001',
          date: '2024-01-15T00:00:00Z',
          resolved: false,
          resolution: 'Report to state licensing board and CFPB'
        },
        {
          type: 'communication',
          severity: 'minor',
          description: 'Called outside of permitted hours (8pm local time)',
          collectorId: 'col_002',
          date: '2024-01-14T00:00:00Z',
          resolved: true,
          resolution: 'Documented violation, issued warning'
        }
      ];

      setComplianceIssues(mockCompliance);

    } catch (error) {
      console.error('Error loading debt analysis:', error);
      Alert.alert('Error', 'Unable to load debt analysis data');
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return Colors.warning;
      case 'major': return Colors.accent;
      case 'severe': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getLikelihoodColor = (likelihood: number): string => {
    if (likelihood >= 80) return Colors.success;
    if (likelihood >= 60) return Colors.warning;
    return Colors.error;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'filed': return Colors.accent;
      case 'resolved': return Colors.success;
      case 'dismissed': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sendValidationRequest = async () => {
    try {
      // Generate debt validation letter
      const validationLetter = `
        ${new Date().toLocaleDateString()}

        DEBT VALIDATION REQUEST
        ${selectedDebt.collector?.name || 'Debt Collector'}
        ${selectedDebt.collector?.address || 'Collector Address'}

        RE: Account ${selectedDebt.accountNumber || 'Unknown'}
        Original Creditor: ${selectedDebt.originalCreditor || 'Unknown'}
        Amount Claimed: $${selectedDebt.currentAmount || 'Unknown'}

        Dear Debt Collector,

        I am writing in response to your communication regarding the above-referenced debt.
        Pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA),
        15 U.S.C. § 1692g(b), I request that you provide validation of this debt.

        Please provide the following information:
        • The amount of the debt and any interest or fees
        • The name of the original creditor
        • Verification that you are authorized to collect this debt
        • Copy of the original judgment or account agreement
        • Proof of the statute of limitations for this debt
        • Complete payment history showing all charges and payments

        Please note that all communication must be in writing. I do not consent to
        telephone calls at any time, including calls to my place of employment.

        Please direct all future correspondence to my mailing address.

        Sincerely,
        [Your Name]
      `;

      Alert.alert('Success', 'Debt validation request generated. Send via certified mail with return receipt.');
      setShowValidationModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate validation request');
    }
  };

  const submitSettlementOffer = async () => {
    try {
      Alert.alert('Success', 'Settlement offer prepared. Review before submitting to collector.');
      setShowSettlementModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare settlement offer');
    }
  };

  const initiateLegalAction = async () => {
    try {
      Alert.alert('Success', 'Legal action documentation prepared. Consult with attorney before filing.');
      setShowLegalActionModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare legal action');
    }
  };

  const renderDebtOverview = () => (
    <View style={styles.overviewContainer}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.overviewHeader}
      >
        <Text style={styles.overviewTitle}>Debt Analysis</Text>
        <Text style={styles.overviewSubtitle}>
          Comprehensive legal strategy and validation options
        </Text>
      </LinearGradient>

      {selectedDebt && (
        <View style={styles.debtSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Creditor:</Text>
            <Text style={styles.summaryValue}>{selectedDebt.originalCreditor || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount:</Text>
            <Text style={styles.summaryValue}>${selectedDebt.currentAmount?.toLocaleString() || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>{selectedDebt.debtType?.replace('_', ' ') || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SOL Status:</Text>
            <Text style={[
              styles.summaryValue,
              { color: selectedDebt.isExpired ? Colors.success : Colors.error }
            ]}>
              {selectedDebt.isExpired ? 'EXPIRED' : 'ACTIVE'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderSettlementOpportunities = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Settlement Opportunities</Text>

      {settlementOpportunities.map((opportunity, index) => (
        <View key={index} style={styles.opportunityCard}>
          <View style={styles.opportunityHeader}>
            <Text style={styles.opportunityRange}>
              ${(opportunity.settlementRange.min).toLocaleString()} - ${(opportunity.settlementRange.max).toLocaleString()}
            </Text>
            <View style={[styles.likelihoodBadge, { backgroundColor: getLikelihoodColor(opportunity.likelihood) }]}>
              <Text style={styles.likelihoodText}>{opportunity.likelihood}% likely</Text>
            </View>
          </View>

          <View style={styles.opportunityDetails}>
            <Text style={styles.opportunityLabel}>Strategy:</Text>
            <Text style={styles.opportunityText}>{opportunity.strategy}</Text>
          </View>

          <View style={styles.opportunityDetails}>
            <Text style={styles.opportunityLabel}>Timeframe:</Text>
            <Text style={styles.opportunityText}>{opportunity.timeframe}</Text>
          </View>

          <View style={styles.opportunityDetails}>
            <Text style={styles.opportunityLabel}>Legal Standing:</Text>
            <Text style={styles.opportunityText}>{opportunity.legalStanding}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowSettlementModal(true)}
          >
            <Icon name="handshake" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Negotiate Settlement</Text>
          </TouchableOpacity>
        </View>
      ))}

      {settlementOpportunities.length === 0 && (
        <View style={styles.emptySection}>
          <Icon name="money-off" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No settlement opportunities</Text>
          <Text style={styles.emptyDescription}>
            Check back later for potential settlement options
          </Text>
        </View>
      )}
    </View>
  );

  const renderLegalActions = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Available Legal Actions</Text>

      {legalActions.map((action, index) => (
        <View key={index} style={styles.legalCard}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalType}>{action.type.replace('_', ' ').toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(action.status) }]}>
              <Text style={styles.statusText}>{action.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.legalDescription}>{action.description}</Text>

          <View style={styles.legalDetails}>
            <Text style={styles.legalLabel}>Potential Damages:</Text>
            <Text style={styles.legalAmount}>${action.potentialDamages?.toLocaleString()}</Text>
          </View>

          <View style={styles.legalDetails}>
            <Text style={styles.legalLabel}>Authorities:</Text>
            <Text style={styles.legalText}>{action.authorities.join(', ')}</Text>
          </View>

          <Text style={styles.evidenceTitle}>Evidence:</Text>
          {action.evidence.map((evidence, idx) => (
            <View key={idx} style={styles.evidenceItem}>
              <Icon name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.evidenceText}>{evidence}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowLegalActionModal(true)}
          >
            <Icon name="gavel" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Initiate Legal Action</Text>
          </TouchableOpacity>
        </View>
      ))}

      {legalActions.length === 0 && (
        <View style={styles.emptySection}>
          <Icon name="balance" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No legal actions available</Text>
          <Text style={styles.emptyDescription}>
            Monitor for violations that may warrant legal action
          </Text>
        </View>
      )}
    </View>
  );

  const renderComplianceIssues = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Compliance Issues</Text>

      {complianceIssues.map((issue, index) => (
        <View key={index} style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <Text style={styles.complianceType}>{issue.type.replace('_', ' ').toUpperCase()}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(issue.severity) }]}>
              <Text style={styles.severityText}>{issue.severity.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.complianceDescription}>{issue.description}</Text>

          <View style={styles.complianceDetails}>
            <Text style={styles.complianceDate}>{formatDate(issue.date)}</Text>
            <View style={[styles.resolutionStatus, {
              backgroundColor: issue.resolved ? Colors.success : Colors.warning
            }]}>
              <Text style={styles.resolutionText}>
                {issue.resolved ? 'RESOLVED' : 'PENDING'}
              </Text>
            </View>
          </View>

          {issue.resolution && (
            <Text style={styles.resolution}>{issue.resolution}</Text>
          )}
        </View>
      ))}

      {complianceIssues.length === 0 && (
        <View style={styles.emptySection}>
          <Icon name="verified" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No compliance issues</Text>
          <Text style={styles.emptyDescription}>
            All collector activities appear to be compliant
          </Text>
        </View>
      )}
    </View>
  );

  const renderValidationModal = () => (
    <Modal
      visible={showValidationModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowValidationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Debt Validation Request</Text>
            <TouchableOpacity onPress={() => setShowValidationModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Validation letter sent</Text>
              <Switch
                value={validationRequest.letterSent}
                onValueChange={(value) => setValidationRequest({ ...validationRequest, letterSent: value })}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Sent via certified mail</Text>
              <Switch
                value={validationRequest.certifiedMail}
                onValueChange={(value) => setValidationRequest({ ...validationRequest, certifiedMail: value })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tracking Number (if certified)</Text>
              <TextInput
                style={styles.input}
                value={validationRequest.trackingNumber}
                onChangeText={(text) => setValidationRequest({ ...validationRequest, trackingNumber: text })}
                placeholder="e.g., 7000 0000 0000 0000 0000 00"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date Sent</Text>
              <TextInput
                style={styles.input}
                value={validationRequest.sentDate}
                onChangeText={(text) => setValidationRequest({ ...validationRequest, sentDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Collector Response</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                value={validationRequest.collectorResponse}
                onChangeText={(text) => setValidationRequest({ ...validationRequest, collectorResponse: text })}
                placeholder="Describe any response received from the collector"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={validationRequest.notes}
                onChangeText={(text) => setValidationRequest({ ...validationRequest, notes: text })}
                placeholder="Any additional information about the validation request"
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowValidationModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={sendValidationRequest}
            >
              <Text style={styles.primaryButtonText}>Generate Letter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSettlementModal = () => (
    <Modal
      visible={showSettlementModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSettlementModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settlement Offer</Text>
            <TouchableOpacity onPress={() => setShowSettlementModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Settlement Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={settlementOffer.amount}
                onChangeText={(text) => setSettlementOffer({ ...settlementOffer, amount: text })}
                placeholder="Enter amount you can offer"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Terms</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                value={settlementOffer.terms}
                onChangeText={(text) => setSettlementOffer({ ...settlementOffer, terms: text })}
                placeholder="Describe the terms of your settlement offer"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Payment Plan Requested</Text>
              <Switch
                value={settlementOffer.paymentPlan}
                onValueChange={(value) => setSettlementOffer({ ...settlementOffer, paymentPlan: value })}
              />
            </View>

            {settlementOffer.paymentPlan && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Number of Payments</Text>
                  <TextInput
                    style={styles.input}
                    value={settlementOffer.numberOfPayments}
                    onChangeText={(text) => setSettlementOffer({ ...settlementOffer, numberOfPayments: text })}
                    placeholder="e.g., 12"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Monthly Amount ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={settlementOffer.monthlyAmount}
                    onChangeText={(text) => setSettlementOffer({ ...settlementOffer, monthlyAmount: text })}
                    placeholder="Monthly payment amount"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSettlementModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={submitSettlementOffer}
            >
              <Text style={styles.primaryButtonText}>Prepare Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLegalActionModal = () => (
    <Modal
      visible={showLegalActionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLegalActionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Legal Action Preparation</Text>
            <TouchableOpacity onPress={() => setShowLegalActionModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.legalPrepSection}>
              <Text style={styles.prepTitle}>Required Documentation</Text>
              <Text style={styles.prepDescription}>
                Before filing any legal action, ensure you have the following documentation:
              </Text>

              {[
                'All communication records (calls, letters, emails)',
                'Proof of violations with timestamps',
                'Financial statements showing hardship if applicable',
                'Documentation of any agreements or disputes',
                'Witness information if available',
                'Previous complaints filed with authorities'
              ].map((doc, index) => (
                <View key={index} style={styles.docItem}>
                  <Icon name="description" size={16} color={Colors.primary} />
                  <Text style={styles.docText}>{doc}</Text>
                </View>
              ))}
            </View>

            <View style={styles.legalPrepSection}>
              <Text style={styles.prepTitle}>Legal Options</Text>

              <TouchableOpacity style={styles.legalOption}>
                <Icon name="assignment" size={24} color={Colors.primary} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>File CFPB Complaint</Text>
                  <Text style={styles.optionDescription}>
                    Free federal complaint process for FDCPA violations
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.legalOption}>
                <Icon name="gavel" size={24} color={Colors.accent} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Small Claims Court</Text>
                  <Text style={styles.optionDescription}>
                    File lawsuit for violations and damages under $10,000
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.legalOption}>
                <Icon name="balance" size={24} color={Colors.warning} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle">Civil Lawsuit</Text>
                  <Text style={styles.optionDescription">
                    Full legal action with attorney representation
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowLegalActionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={initiateLegalAction}
            >
              <Text style={styles.primaryButtonText}>Prepare Documentation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDebtAnalysis} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderDebtOverview()}
        {renderSettlementOpportunities()}
        {renderLegalActions()}
        {renderComplianceIssues()}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowValidationModal(true)}
          >
            <Icon name="assignment" size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>Request Validation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: Colors.accent }]}
            onPress={() => navigation.navigate('SOLDefense', { debt: selectedDebt })}
          >
            <Icon name="security" size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>SOL Defense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: Colors.warning }]}
            onPress={() => navigation.navigate('LegalReport', { debt: selectedDebt })}
          >
            <Icon name="description" size={20} color={Colors.white} />
            <Text style={styles.quickActionText}>Legal Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderValidationModal()}
      {renderSettlementModal()}
      {renderLegalActionModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    marginBottom: Spacing.md,
  },
  overviewHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  debtSummary: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    marginTop: -Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  sectionContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  opportunityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  opportunityRange: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    flex: 1,
  },
  likelihoodBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  likelihoodText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  opportunityDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  opportunityLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginRight: Spacing.sm,
    width: 80,
  },
  opportunityText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  legalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  legalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legalType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  legalDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  legalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  legalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  legalText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  evidenceText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  complianceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  complianceType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  complianceDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  complianceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  complianceDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resolutionStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  resolutionText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  resolution: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  emptySection: {
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
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  quickActionText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    fontSize: 14,
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
    width: '90%',
    maxHeight: '80%',
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
    maxHeight: '60%',
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
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
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
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  legalPrepSection: {
    marginBottom: Spacing.lg,
  },
  prepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  prepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  docText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  legalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  optionContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});