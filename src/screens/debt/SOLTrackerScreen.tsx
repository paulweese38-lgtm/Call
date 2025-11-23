/**
 * CallWall Statute of Limitations Tracker Screen
 * Advanced SOL monitoring and analysis for debt defense strategies
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  StatuteOfLimitationsEngine,
  SOLAnalysisReport,
  SOLDebt,
  SOLRiskAssessment,
  SOLRecommendations
} from '../../services/debt/StatuteOfLimitationsEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function SOLTrackerScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [debts, setDebts] = useState<SOLDebt[]>([]);
  const [analysisReport, setAnalysisReport] = useState<SOLAnalysisReport | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<SOLDebt | null>(null);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newDebt, setNewDebt] = useState({
    creditorName: '',
    debtType: 'written_contract',
    amount: '',
    lastPaymentDate: '',
    state: 'California'
  });

  const solEngine = new StatuteOfLimitationsEngine();

  useEffect(() => {
    loadSOLData();
  }, []);

  const loadSOLData = async () => {
    setRefreshing(true);
    try {
      // Mock SOL data for demonstration
      const mockDebts: SOLDebt[] = [
        {
          id: 'debt_001',
          originalCreditor: 'Chase Bank',
          currentAmount: 8750.00,
          originalAmount: 12000.00,
          debtType: 'credit_card',
          lastPaymentDate: '2021-03-15T00:00:00Z',
          lastActivityDate: '2022-01-20T00:00:00Z',
          contractDate: '2019-06-01T00:00:00Z',
          state: 'California',
          daysToExpiry: -185, // Expired
          isExpired: true,
          statutoryPeriod: 4, // years
          timeElapsed: 4.51, // years
          expiryDate: '2023-03-15T00:00:00Z',
          riskAssessment: {
            score: 95,
            level: 'very_low',
            collectability: 'time_barred',
            legalStanding: 'none',
            recommendedActions: [
              'Assert statute of limitations defense',
              'File motion to dismiss for time-barred debt',
              'Request validation of debt date'
            ],
            risks: [
              {
                type: 'collector_payment_claim',
                probability: 15,
                impact: 'low',
                description: 'Collector may claim recent activity to reset SOL'
              }
            ],
            evidenceRequired: [
              'Payment records from last 4+ years',
              'Original contract with dates',
              'All communication records'
            ]
          },
          tollingEvents: [],
          restartOpportunities: [],
          legalReferences: ['California Code of Civil Procedure § 337'],
          notes: 'Debt is well beyond California 4-year SOL for written contracts'
        },
        {
          id: 'debt_002',
          originalCreditor: 'QuickLoan',
          currentAmount: 3500.00,
          originalAmount: 2500.00,
          debtType: 'written_contract',
          lastPaymentDate: '2023-08-10T00:00:00Z',
          lastActivityDate: '2024-01-05T00:00:00Z',
          contractDate: '2023-01-15T00:00:00Z',
          state: 'Texas',
          daysToExpiry: 1082, // Not expired
          isExpired: false,
          statutoryPeriod: 4, // years
          timeElapsed: 0.62, // years
          expiryDate: '2027-01-15T00:00:00Z',
          riskAssessment: {
            score: 25,
            level: 'medium',
            collectability: 'enforceable',
            legalStanding: 'strong',
            recommendedActions: [
              'Monitor SOL expiry date',
              'Consider debt settlement options',
              'Document all collector communications'
            ],
            risks: [
              {
                type: 'collection_action',
                probability: 75,
                impact: 'high',
                description: 'Debt is within SOL and collector may pursue legal action'
              }
            ],
            evidenceRequired: [
              'Payment records and receipts',
              'Original loan agreement',
              'Account statements'
            ]
          },
          tollingEvents: [],
          restartOpportunities: [],
          legalReferences: ['Texas Civil Practice & Remedies Code § 16.004'],
          notes: 'Recent activity may restart SOL clock'
        },
        {
          id: 'debt_003',
          originalCreditor: 'Medical Center',
          currentAmount: 12000.00,
          originalAmount: 15000.00,
          debtType: 'medical',
          lastPaymentDate: '2022-11-20T00:00:00Z',
          lastActivityDate: '2023-06-15T00:00:00Z',
          contractDate: '2021-09-01T00:00:00Z',
          state: 'New York',
          daysToExpiry: 45, // Near expiry
          isExpired: false,
          statutoryPeriod: 6, // years
          timeElapsed: 5.88, // years
          expiryDate: '2024-11-20T00:00:00Z',
          riskAssessment: {
            score: 85,
            level: 'high',
            collectability: 'expiring_soon',
            legalStanding: 'strong_but_expiring',
            recommendedActions: [
              'Prepare SOL defense strategy',
              'Consider making small payment to extend timeline',
              'Document SOL countdown for legal use'
            ],
            risks: [
              {
                type: 'immediate_legal_action',
                probability: 60,
                impact: 'critical',
                description: 'Collector may file lawsuit before SOL expires'
              }
            ],
            evidenceRequired: [
              'Medical records and itemized bills',
              'Insurance payment records',
              'Communication with medical provider'
            ]
          },
          tollingEvents: [],
          restartOpportunities: [
            {
              type: 'partial_payment',
              description: 'Making any payment could restart SOL clock',
              impact: 'significantly_delays_expiry',
              recommendation: 'Avoid payments unless settlement agreement'
            }
          ],
          legalReferences: ['New York Civil Practice Law & Rules § 213(8)'],
          notes: 'Medical debt SOL expires in 45 days - critical timeframe'
        }
      ];

      setDebts(mockDebts);

      // Generate analysis report
      const report = await solEngine.analyzePortfolio(mockDebts);
      setAnalysisReport(report);

    } catch (error) {
      console.error('Error loading SOL data:', error);
      Alert.alert('Error', 'Unable to load SOL tracking data');
    } finally {
      setRefreshing(false);
    }
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'very_low': return Colors.success;
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.accent;
      case 'very_high': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusColor = (isExpired: boolean, daysToExpiry: number): string => {
    if (isExpired) return Colors.success;
    if (daysToExpiry <= 90) return Colors.error;
    if (daysToExpiry <= 365) return Colors.warning;
    return Colors.textSecondary;
  };

  const getStatusText = (isExpired: boolean, daysToExpiry: number): string => {
    if (isExpired) return 'EXPIRED';
    if (daysToExpiry <= 90) return `${daysToExpiry} DAYS`;
    if (daysToExpiry <= 365) return `${Math.ceil(daysToExpiry / 30)} MONTHS`;
    return `${Math.ceil(daysToExpiry / 365)} YEARS`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const addNewDebt = async () => {
    try {
      if (!newDebt.creditorName || !newDebt.amount || !newDebt.lastPaymentDate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Create new SOL debt entry
      const solDebt: SOLDebt = {
        id: `debt_${Date.now()}`,
        originalCreditor: newDebt.creditorName,
        currentAmount: parseFloat(newDebt.amount),
        originalAmount: parseFloat(newDebt.amount),
        debtType: newDebt.debtType,
        lastPaymentDate: new Date(newDebt.lastPaymentDate).toISOString(),
        lastActivityDate: new Date().toISOString(),
        contractDate: new Date().toISOString(),
        state: newDebt.state,
        daysToExpiry: 0,
        isExpired: false,
        statutoryPeriod: 0,
        timeElapsed: 0,
        expiryDate: '',
        riskAssessment: {
          score: 50,
          level: 'medium',
          collectability: 'unknown',
          legalStanding: 'unknown',
          recommendedActions: [],
          risks: [],
          evidenceRequired: []
        },
        tollingEvents: [],
        restartOpportunities: [],
        legalReferences: [],
        notes: 'Newly added debt - analysis pending'
      };

      setDebts([...debts, solDebt]);
      setShowAddDebtModal(false);
      setNewDebt({
        creditorName: '',
        debtType: 'written_contract',
        amount: '',
        lastPaymentDate: '',
        state: 'California'
      });

      Alert.alert('Success', 'Debt added successfully. SOL analysis will be updated shortly.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add debt');
    }
  };

  const renderSummaryStats = () => {
    if (!analysisReport) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="account-balance" size={24} color={Colors.primary} />
          <Text style={styles.summaryValue}>{analysisReport.totalDebts}</Text>
          <Text style={styles.summaryLabel}>Total Debts</Text>
        </View>

        <View style={styles.summaryCard}>
          <Icon name="check-circle" size={24} color={Colors.success} />
          <Text style={styles.summaryValue}>{analysisReport.timeBarredDebts}</Text>
          <Text style={styles.summaryLabel}>Time-Barred</Text>
        </View>

        <View style={styles.summaryCard}>
          <Icon name="warning" size={24} color={Colors.warning} />
          <Text style={styles.summaryValue}>{analysisReport.expiringSoon}</Text>
          <Text style={styles.summaryLabel}>Expiring Soon</Text>
        </View>

        <View style={styles.summaryCard}>
          <Icon name="trending-up" size={24} color={Colors.error} />
          <Text style={styles.summaryValue}>{analysisReport.averageRiskScore}</Text>
          <Text style={styles.summaryLabel}>Avg Risk Score</Text>
        </View>
      </View>
    );
  };

  const renderDebtItem = (debt: SOLDebt) => (
    <TouchableOpacity
      key={debt.id}
      style={styles.debtItem}
      onPress={() => {
        setSelectedDebt(debt);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.debtHeader}>
        <View style={styles.debtInfo}>
          <Text style={styles.creditorName}>{debt.originalCreditor}</Text>
          <Text style={styles.debtType}>{debt.debtType.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.debtAmount}>${debt.currentAmount.toLocaleString()}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(debt.isExpired, debt.daysToExpiry) }]}>
          <Text style={styles.statusText}>{getStatusText(debt.isExpired, debt.daysToExpiry)}</Text>
        </View>
      </View>

      <View style={styles.debtDetails}>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{debt.state}</Text>
          <Text style={styles.detailText}>•</Text>
          <Icon name="schedule" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{debt.statutoryPeriod}yr SOL</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expiry:</Text>
          <Text style={styles.detailValue}>{formatDate(debt.expiryDate)}</Text>
        </View>

        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Risk Level:</Text>
          <View style={[styles.riskIndicator, { backgroundColor: getRiskLevelColor(debt.riskAssessment.level) }]}>
            <Text style={styles.riskText}>
              {debt.riskAssessment.level.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {debt.riskAssessment.collectability === 'expiring_soon' && (
        <View style={styles.urgentAlert}>
          <Icon name="priority-high" size={16} color={Colors.error} />
          <Text style={styles.urgentText}>SOL expires soon - immediate action recommended</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAddDebtModal = () => (
    <Modal
      visible={showAddDebtModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddDebtModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Debt to SOL Tracker</Text>
            <TouchableOpacity onPress={() => setShowAddDebtModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Creditor Name *</Text>
              <TextInput
                style={styles.input}
                value={newDebt.creditorName}
                onChangeText={(text) => setNewDebt({ ...newDebt, creditorName: text })}
                placeholder="e.g., Chase Bank"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Debt Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  { value: 'written_contract', label: 'Written Contract' },
                  { value: 'credit_card', label: 'Credit Card' },
                  { value: 'medical', label: 'Medical' },
                  { value: 'auto_loan', label: 'Auto Loan' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.debtTypeChip,
                      newDebt.debtType === type.value && styles.selectedDebtType,
                    ]}
                    onPress={() => setNewDebt({ ...newDebt, debtType: type.value })}
                  >
                    <Text style={[
                      styles.debtTypeText,
                      newDebt.debtType === type.value && styles.selectedDebtTypeText,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={newDebt.amount}
                onChangeText={(text) => setNewDebt({ ...newDebt, amount: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Payment Date *</Text>
              <TextInput
                style={styles.input}
                value={newDebt.lastPaymentDate}
                onChangeText={(text) => setNewDebt({ ...newDebt, lastPaymentDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={newDebt.state}
                onChangeText={(text) => setNewDebt({ ...newDebt, state: text })}
                placeholder="California"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAddDebtModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
              onPress={addNewDebt}
            >
              <Text style={styles.addButtonText}>Add Debt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDetailsModal = () => {
    if (!selectedDebt) return null;

    return (
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SOL Analysis Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Debt Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Creditor:</Text>
                  <Text style={styles.infoValue}>{selectedDebt.originalCreditor}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount:</Text>
                  <Text style={styles.infoValue}>${selectedDebt.currentAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>{selectedDebt.debtType.replace('_', ' ')}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>State:</Text>
                  <Text style={styles.infoValue}>{selectedDebt.state}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Statute of Limitations</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Statutory Period:</Text>
                  <Text style={styles.infoValue}>{selectedDebt.statutoryPeriod} years</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Time Elapsed:</Text>
                  <Text style={styles.infoValue}>{selectedDebt.timeElapsed.toFixed(2)} years</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expiry Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedDebt.expiryDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={[
                    styles.infoValue,
                    { color: selectedDebt.isExpired ? Colors.success : Colors.error }
                  ]}>
                    {selectedDebt.isExpired ? 'EXPIRED' : 'ACTIVE'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Risk Assessment</Text>
                <Text style={styles.sectionSubtitle}>Risk Score: {selectedDebt.riskAssessment.score}/100</Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(selectedDebt.riskAssessment.level) }]}>
                  <Text style={styles.riskBadgeText}>
                    {selectedDebt.riskAssessment.level.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.recommendationsTitle}>Recommended Actions:</Text>
                {selectedDebt.riskAssessment.recommendedActions.map((action, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Icon name="arrow-right" size={16} color={Colors.primary} />
                    <Text style={styles.recommendationText}>{action}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Legal References</Text>
                {selectedDebt.legalReferences.map((ref, index) => (
                  <Text key={index} style={styles.legalReference}>• {ref}</Text>
                ))}
              </View>

              {selectedDebt.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notes}>{selectedDebt.notes}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('SOLDefense', { debt: selectedDebt });
                }}
              >
                <Text style={styles.primaryButtonText}>Generate Defense Strategy</Text>
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
          <Text style={styles.headerTitle}>SOL Tracker</Text>
          <Text style={styles.headerSubtitle}>
            Monitor statute of limitations and build legal defenses
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadSOLData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSummaryStats()}

        <View style={styles.debtsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tracked Debts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddDebtModal(true)}
            >
              <Icon name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {debts.map(renderDebtItem)}

          {debts.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="account-balance-wallet" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No debts tracked</Text>
              <Text style={styles.emptyDescription}>
                Add your debts to monitor their statute of limitations status
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderAddDebtModal()}
      {renderDetailsModal()}
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
    paddingBottom: 30,
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
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  debtsContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
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
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  debtItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  debtInfo: {
    flex: 1,
  },
  creditorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  debtType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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
  debtDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  riskLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  riskIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  riskText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  urgentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}20`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  urgentText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
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
  debtTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDebtType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  debtTypeText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedDebtTypeText: {
    color: Colors.white,
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
  addButton: {
    backgroundColor: Colors.primary,
  },
  addButtonText: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  riskBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  riskBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  legalReference: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  notes: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});