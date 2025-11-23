/**
 * CallWall Credit Accounts Screen
 * Detailed credit account management with optimization recommendations
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
import { PieChart, ProgressChart } from 'react-native-chart-kit';
import {
  CreditScoreMonitor,
  CreditAccount,
  CreditInquiry,
  ScoreOptimization
} from '../../services/credit/CreditScoreMonitor';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function CreditAccountsScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [inquiries, setInquiries] = useState<CreditInquiry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'credit_card',
    creditor: '',
    balance: '',
    limit: '',
    payment: ''
  });
  const [activeTab, setActiveTab] = useState<'accounts' | 'inquiries' | 'optimization'>('accounts');

  const monitor = new CreditScoreMonitor({
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

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    setRefreshing(true);
    try {
      const [accountsData, inquiriesData] = await Promise.all([
        monitor.getCreditAccounts(),
        monitor.getCreditInquiries()
      ]);

      setAccounts(accountsData);
      setInquiries(inquiriesData);
    } catch (error) {
      console.error('Error loading credit data:', error);
      Alert.alert('Error', 'Unable to load credit accounts data');
    } finally {
      setRefreshing(false);
    }
  };

  const getAccountIcon = (type: string): string => {
    switch (type) {
      case 'credit_card': return 'credit-card';
      case 'auto_loan': return 'directions-car';
      case 'mortgage': return 'home';
      case 'student_loan': return 'school';
      case 'personal_loan': return 'account-balance';
      case 'collection': return 'warning';
      case 'charge_off': return 'error';
      default: return 'account-balance-wallet';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'current': return Colors.success;
      case 'late': return Colors.warning;
      case 'charge_off': return Colors.error;
      case 'collection': return Colors.accent;
      case 'closed': return Colors.textSecondary;
      case 'paid_in_full': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const getAccountTypeColor = (type: string): string => {
    switch (type) {
      case 'credit_card': return Colors.primary;
      case 'auto_loan': return Colors.accent;
      case 'mortgage': return Colors.success;
      case 'student_loan': return Colors.warning;
      case 'personal_loan': return Colors.info;
      case 'collection': return Colors.error;
      case 'charge_off': return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateOverallUtilization = (): number => {
    const creditCardAccounts = accounts.filter(acc => acc.type === 'credit_card' && acc.creditLimit);
    const totalBalance = creditCardAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalLimit = creditCardAccounts.reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);

    return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  };

  const getAccountBreakdown = () => {
    const breakdown: Record<string, number> = {};
    accounts.forEach(account => {
      breakdown[account.type] = (breakdown[account.type] || 0) + 1;
    });

    return Object.keys(breakdown).map(key => ({
      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      population: breakdown[key],
      color: getAccountTypeColor(key),
      legendFontColor: Colors.text,
      legendFontSize: 12
    }));
  };

  const renderAccountOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle">Credit Accounts Overview</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue">{accounts.length}</Text>
            <Text style={styles.statLabel">Total Accounts</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue">{accounts.filter(a => a.status === 'current').length}</Text>
            <Text style={styles.statLabel">Current</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue">{calculateOverallUtilization()}%</Text>
            <Text style={styles.statLabel">Utilization</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue">
              {accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel">Total Balance</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle">Account Distribution</Text>
        <PieChart
          data={getAccountBreakdown()}
          width={screenWidth - Spacing.lg * 2}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
        />
      </View>

      <View style={styles.utilizationCard}>
        <Text style={styles.utilizationTitle">Credit Utilization Analysis</Text>
        <View style={styles.utilizationProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(calculateOverallUtilization(), 100)}%`,
                  backgroundColor: calculateOverallUtilization() <= 30 ? Colors.success :
                                 calculateOverallUtilization() <= 50 ? Colors.warning : Colors.error
                }
              ]}
            />
          </View>
          <Text style={styles.utilizationPercentage">{calculateOverallUtilization()}%</Text>
        </View>
        <Text style={styles.utilizationRecommendation">
          {calculateOverallUtilization() <= 30 ? 'Excellent! Keep utilization below 30%' :
           calculateOverallUtilization() <= 50 ? 'Good. Consider paying down to improve score' :
           'High. Pay down balances to boost your credit score'}
        </Text>
      </View>
    </View>
  );

  const renderAccountItem = (account: CreditAccount) => (
    <TouchableOpacity
      key={account.id}
      style={styles.accountCard}
      onPress={() => {
        setSelectedAccount(account);
        setShowAccountDetails(true);
      }}
    >
      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <View style={styles.accountTypeIcon}>
            <Icon name={getAccountIcon(account.type)} size={24} color={getAccountTypeColor(account.type)} />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountCreditor}>{account.creditor}</Text>
            <Text style={styles.accountNumber}>{account.accountNumber}</Text>
          </View>
        </View>

        <View style={styles.accountStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(account.status) }]}>
            <Text style={styles.statusText">{account.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.accountFinancials}>
        <View style={styles.financialItem}>
          <Text style={styles.financialLabel">Balance</Text>
          <Text style={styles.financialValue">{formatCurrency(account.balance)}</Text>
        </View>

        {account.creditLimit && (
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel">Limit</Text>
            <Text style={styles.financialValue">{formatCurrency(account.creditLimit)}</Text>
          </View>
        )}

        <View style={styles.financialItem}>
          <Text style={styles.financialLabel">Payment</Text>
          <Text style={styles.financialValue">{formatCurrency(account.monthlyPayment)}</Text>
        </View>

        {account.utilization && (
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel">Utilization</Text>
            <Text style={[
              styles.financialValue,
              { color: account.utilization <= 30 ? Colors.success :
                     account.utilization <= 50 ? Colors.warning : Colors.error }
            ]}>
              {account.utilization}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.accountMeta}>
        <Text style={styles.metaText">
          Opened: {formatDate(account.openedDate)}
        </Text>
        <Text style={styles.metaText">
          Age: {account.ageInMonths} months
        </Text>
      </View>

      {account.paymentHistory.length > 0 && (
        <View style={styles.paymentHistory}>
          <Text style={styles.paymentHistoryTitle">Recent Payments</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {account.paymentHistory.slice(-3).map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <Icon
                  name={payment.status === 'on_time' ? 'check-circle' : 'error'}
                  size={16}
                  color={payment.status === 'on_time' ? Colors.success : Colors.error}
                />
                <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderInquiries = () => (
    <View style={styles.inquiriesContainer}>
      <Text style={styles.sectionTitle">Credit Inquiries</Text>

      {inquiries.map((inquiry, index) => (
        <View key={index} style={styles.inquiryCard}>
          <View style={styles.inquiryHeader}>
            <View style={styles.inquiryInfo}>
              <Icon
                name={inquiry.type === 'hard' ? 'search' : 'visibility'}
                size={20}
                color={inquiry.type === 'hard' ? Colors.accent : Colors.textSecondary}
              />
              <Text style={styles.inquiryCreditor}>{inquiry.creditor}</Text>
            </View>

            <View style={[styles.inquiryTypeBadge, {
              backgroundColor: inquiry.type === 'hard' ? Colors.accent : Colors.input
            }]}>
              <Text style={[
                styles.inquiryTypeText,
                { color: inquiry.type === 'hard' ? Colors.white : Colors.text }
              ]}>
                {inquiry.type.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.inquiryDetails}>
            <Text style={styles.inquiryPurpose">{inquiry.purpose}</Text>
            <Text style={styles.inquiryDate">{formatDate(inquiry.date)}</Text>
            {inquiry.impact !== 0 && (
              <Text style={[
                styles.inquiryImpact,
                { color: inquiry.impact < 0 ? Colors.error : Colors.success }
              ]}>
                {inquiry.impact > 0 ? '+' : ''}{inquiry.impact} points
              </Text>
            )}
          </View>

          <Text style={styles.inquiryExpires}>
            Expires: {formatDate(inquiry.expires)}
          </Text>
        </View>
      ))}

      {inquiries.length === 0 && (
        <View style={styles.emptyInquiries}>
          <Icon name="search-off" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle">No Recent Inquiries</Text>
          <Text style={styles.emptyDescription">
            Credit inquiries will appear here when they're made
          </Text>
        </View>
      )}
    </View>
  );

  const renderOptimizationTab = () => (
    <View style={styles.optimizationContainer}>
      <Text style={styles.sectionTitle">Account Optimization</Text>

      <View style={styles.optimizationCard}>
        <Icon name="trending-down" size={24} color={Colors.error} />
        <Text style={styles.optimizationTitle">High Utilization Detected</Text>
        <Text style={styles.optimizationDescription">
          Your credit utilization is {calculateOverallUtilization()}%, which is impacting your score.
        </Text>
        <TouchableOpacity
          style={styles.optimizationButton}
          onPress={() => navigation.navigate('UtilizationOptimization')}
        >
          <Text style={styles.optimizationButtonText">Optimize Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optimizationCard}>
        <Icon name="schedule" size={24} color={Colors.warning} />
        <Text style={styles.optimizationTitle">Payment History Opportunity</Text>
        <Text style={styles.optimizationDescription">
          Setting up automatic payments could improve your payment history and boost your score.
        </Text>
        <TouchableOpacity
          style={styles.optimizationButton}
          onPress={() => navigation.navigate('PaymentOptimization')}
        >
          <Text style={styles.optimizationButtonText">Set Up Autopay</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optimizationCard}>
        <Icon name="credit-card" size={24} color={Colors.success} />
        <Text style={styles.optimizationTitle">Credit Limit Increases</Text>
        <Text style={styles.optimizationDescription">
          Requesting limit increases on existing accounts could improve your utilization ratio.
        </Text>
        <TouchableOpacity
          style={styles.optimizationButton}
          onPress={() => navigation.navigate('LimitIncrease')}
        >
          <Text style={styles.optimizationButtonText">Request Increases</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddAccountModal = () => (
    <Modal
      visible={showAddAccountModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddAccountModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle">Add Credit Account</Text>
            <TouchableOpacity onPress={() => setShowAddAccountModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody">
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel">Account Name</Text>
              <TextInput
                style={styles.input}
                value={newAccount.name}
                onChangeText={(text) => setNewAccount({ ...newAccount, name: text })}
                placeholder="e.g., Chase Freedom Card"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel">Account Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  { value: 'credit_card', label: 'Credit Card' },
                  { value: 'auto_loan', label: 'Auto Loan' },
                  { value: 'mortgage', label: 'Mortgage' },
                  { value: 'student_loan', label: 'Student Loan' },
                  { value: 'personal_loan', label: 'Personal Loan' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.accountTypeChip,
                      newAccount.type === type.value && styles.selectedAccountType,
                    ]}
                    onPress={() => setNewAccount({ ...newAccount, type: type.value as any })}
                  >
                    <Text style={[
                      styles.accountTypeText,
                      newAccount.type === type.value && styles.selectedAccountTypeText,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel">Creditor</Text>
              <TextInput
                style={styles.input}
                value={newAccount.creditor}
                onChangeText={(text) => setNewAccount({ ...newAccount, creditor: text })}
                placeholder="e.g., Chase Bank"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel">Current Balance ($)</Text>
              <TextInput
                style={styles.input}
                value={newAccount.balance}
                onChangeText={(text) => setNewAccount({ ...newAccount, balance: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            {(newAccount.type === 'credit_card') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel">Credit Limit ($)</Text>
                <TextInput
                  style={styles.input}
                  value={newAccount.limit}
                  onChangeText={(text) => setNewAccount({ ...newAccount, limit: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel">Monthly Payment ($)</Text>
              <TextInput
                style={styles.input}
                value={newAccount.payment}
                onChangeText={(text) => setNewAccount({ ...newAccount, payment: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAddAccountModal(false)}
            >
              <Text style={styles.cancelButtonText">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
              onPress={() => {
                Alert.alert('Success', 'Account added successfully!');
                setShowAddAccountModal(false);
                setNewAccount({
                  name: '',
                  type: 'credit_card',
                  creditor: '',
                  balance: '',
                  limit: '',
                  payment: ''
                });
              }}
            >
              <Text style={styles.addButtonText">Add Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAccountDetailsModal = () => {
    if (!selectedAccount) return null;

    return (
      <Modal
        visible={showAccountDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle">Account Details</Text>
              <TouchableOpacity onPress={() => setShowAccountDetails(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle">Account Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Name:</Text>
                  <Text style={styles.detailValue">{selectedAccount.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Creditor:</Text>
                  <Text style={styles.detailValue">{selectedAccount.creditor}</Text>
                </View>
                <View style={styles.detailRow">
                  <Text style={styles.detailLabel">Account Number:</Text>
                  <Text style={styles.detailValue">{selectedAccount.accountNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: getStatusColor(selectedAccount.status) }
                  ]}>
                    {selectedAccount.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle">Financial Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Balance:</Text>
                  <Text style={styles.detailValue">{formatCurrency(selectedAccount.balance)}</Text>
                </View>
                {selectedAccount.creditLimit && (
                  <>
                    <View style={styles.detailRow">
                      <Text style={styles.detailLabel">Credit Limit:</Text>
                      <Text style={styles.detailValue">{formatCurrency(selectedAccount.creditLimit)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel">Utilization:</Text>
                      <Text style={styles.detailValue">{selectedAccount.utilization}%</Text>
                    </View>
                  </>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Monthly Payment:</Text>
                  <Text style={styles.detailValue">{formatCurrency(selectedAccount.monthlyPayment)}</Text>
                </View>
                {selectedAccount.originalAmount && (
                  <View style={styles.detailRow">
                    <Text style={styles.detailLabel">Original Amount:</Text>
                    <Text style={styles.detailValue">{formatCurrency(selectedAccount.originalAmount)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle">Account History</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel">Opened:</Text>
                  <Text style={styles.detailValue">{formatDate(selectedAccount.openedDate)}</Text>
                </View>
                <View style={styles.detailRow">
                  <Text style={styles.detailLabel">Account Age:</Text>
                  <Text style={styles.detailValue">{selectedAccount.ageInMonths} months</Text>
                </View>
                <View style={styles.detailRow">
                  <Text style={styles.detailLabel">Last Activity:</Text>
                  <Text style={styles.detailValue">{formatDate(selectedAccount.lastActivity)}</Text>
                </View>
              </View>

              <View style={styles.detailSection">
                <Text style={styles.detailSectionTitle">Recent Payment History</Text>
                {selectedAccount.paymentHistory.map((payment, index) => (
                  <View key={index} style={styles.paymentHistoryItem}>
                    <Icon
                      name={payment.status === 'on_time' ? 'check-circle' : 'error'}
                      size={20}
                      color={payment.status === 'on_time' ? Colors.success : Colors.error}
                    />
                    <View style={styles.paymentHistoryDetails}>
                      <Text style={styles.paymentHistoryDate">{formatDate(payment.date)}</Text>
                      <Text style={styles.paymentHistoryAmount}>{formatCurrency(payment.amount)}</Text>
                      <Text style={[
                        styles.paymentHistoryStatus,
                        { color: payment.status === 'on_time' ? Colors.success : Colors.error }
                      ]}>
                        {payment.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowAccountDetails(false);
                  navigation.navigate('AccountOptimization', { account: selectedAccount });
                }}
              >
                <Text style={styles.primaryButtonText">Optimize Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const { width: screenWidth } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle">Credit Accounts</Text>
          <Text style={styles.headerSubtitle">
            Manage and optimize your credit accounts
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {[
          { key: 'accounts', label: 'Accounts', icon: 'account-balance' },
          { key: 'inquiries', label: 'Inquiries', icon: 'search' },
          { key: 'optimization', label: 'Optimize', icon: 'trending-up' },
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
          <RefreshControl refreshing={refreshing} onRefresh={loadCreditData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'accounts' && (
          <>
            {renderAccountOverview()}
            <View style={styles.accountsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle">All Accounts</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddAccountModal(true)}
                >
                  <Icon name="add" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {accounts.map(renderAccountItem)}

              {accounts.length === 0 && (
                <View style={styles.emptyAccounts}>
                  <Icon name="account-balance-wallet" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle">No Credit Accounts</Text>
                  <Text style={styles.emptyDescription">
                    Add your credit accounts to start tracking and optimizing your credit
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === 'inquiries' && renderInquiries()}

        {activeTab === 'optimization' && renderOptimizationTab()}
      </ScrollView>

      {renderAddAccountModal()}
      {renderAccountDetailsModal()}
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
  overviewContainer: {
    padding: Spacing.lg,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  utilizationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  utilizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  utilizationProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.input,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    width: 40,
    textAlign: 'right',
  },
  utilizationRecommendation: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  accountsContainer: {
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
  accountCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  accountInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  accountTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  accountCreditor: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  accountNumber: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  accountStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  accountFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  financialItem: {
    alignItems: 'center',
    flex: 1,
  },
  financialLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  accountMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  paymentHistory: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  paymentHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  paymentAmount: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  inquiriesContainer: {
    padding: Spacing.lg,
  },
  inquiryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inquiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inquiryCreditor: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  inquiryTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  inquiryTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  inquiryDetails: {
    marginBottom: Spacing.sm,
  },
  inquiryPurpose: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inquiryDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inquiryImpact: {
    fontSize: 14,
    fontWeight: '600',
  },
  inquiryExpires: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  optimizationContainer: {
    padding: Spacing.lg,
  },
  optimizationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  optimizationDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    flex: 1,
    marginLeft: Spacing.md,
  },
  optimizationButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  optimizationButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyAccounts: {
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
  emptyInquiries: {
    alignItems: 'center',
    padding: Spacing.xl,
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
  accountTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAccountType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  accountTypeText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedAccountTypeText: {
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
    flex: 2,
    textAlign: 'right',
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentHistoryDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  paymentHistoryDate: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  paymentHistoryAmount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  paymentHistoryStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
});