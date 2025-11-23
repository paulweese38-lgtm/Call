/**
 * CallWall Credit Monitor Screen
 * Real-time credit score monitoring with insights and alerts
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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { CreditScoreMonitor, CreditScore, CreditAlert, ScoreOptimization } from '../../services/credit/CreditScoreMonitor';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function CreditMonitorScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [creditAlerts, setCreditAlerts] = useState<CreditAlert[]>([]);
  const [optimizations, setOptimizations] = useState<ScoreOptimization[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);

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
    bureaus: {
      experian: true,
      equifax: true,
      transunion: true
    },
    refreshFrequency: 'weekly',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    privacySettings: {
      dataSharing: false,
      analytics: true,
      thirdParty: false
    }
  });

  useEffect(() => {
    loadCreditData();
  }, [selectedTimeRange]);

  const loadCreditData = async () => {
    setRefreshing(true);
    try {
      const [score, alerts, opts] = await Promise.all([
        monitor.getCurrentScore(),
        monitor.getCreditAlerts(),
        monitor.getScoreOptimizations()
      ]);

      setCreditScore(score);
      setCreditAlerts(alerts);
      setOptimizations(opts);
    } catch (error) {
      console.error('Error loading credit data:', error);
      Alert.alert('Error', 'Unable to load credit monitoring data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 750) return Colors.success;
    if (score >= 700) return '#4CAF50';
    if (score >= 650) return Colors.warning;
    if (score >= 600) return Colors.accent;
    return Colors.error;
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  const getAlertSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return Colors.textSecondary;
      case 'medium': return Colors.warning;
      case 'high': return Colors.accent;
      case 'critical': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const formatChartLabels = (period: string): string[] => {
    const labels = [];
    const now = new Date();

    switch (period) {
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        break;
      case 'month':
        for (let i = 3; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        break;
      case 'quarter':
        for (let i = 2; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - (i * 1));
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
      case 'year':
        for (let i = 11; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
    }

    return labels;
  };

  const getScoreChartData = () => {
    // Mock score history data
    const data = {
      labels: formatChartLabels(selectedTimeRange),
      datasets: [{
        data: [665, 668, 665, 658, 642], // Mock score history
        color: (opacity = 1) => `rgba(75, 83, 32, ${opacity})`,
        strokeWidth: 3
      }]
    };

    return data;
  };

  const getUtilizationData = () => {
    // Mock utilization breakdown
    const utilizationByCategory = {
      'Credit Cards': 68,
      'Auto Loans': 85,
      'Student Loans': 75,
      'Personal Loans': 60
    };

    const data = {
      labels: Object.keys(utilizationByCategory),
      datasets: [{
        data: Object.values(utilizationByCategory),
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
        strokeWidth: 2
      }]
    };

    return data;
  };

  const renderScoreCard = () => {
    if (!creditScore) return null;

    const scoreColor = getScoreColor(creditScore.currentScore);
    const scoreChangeColor = creditScore.scoreChange >= 0 ? Colors.success : Colors.error;
    const scoreChangeIcon = creditScore.scoreChange >= 0 ? 'trending_up' : 'trending_down';

    return (
      <View style={styles.scoreCard}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.scoreHeader}
        >
          <Text style={styles.scoreTitle}>Current Credit Score</Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {creditScore.currentScore}
            </Text>
            <Text style={styles.scoreMax}>/ 850</Text>
          </View>
          <Text style={[styles.scoreGrade, { color: scoreColor }]}>
            {getScoreGrade(creditScore.currentScore)}
          </Text>
        </LinearGradient>

        <View style={styles.scoreDetails}>
          <View style={styles.scoreChangeRow}>
            <Icon name={scoreChangeIcon} size={20} color={scoreChangeColor} />
            <Text style={[styles.scoreChangeText, { color: scoreChangeColor }]}>
              {creditScore.scoreChange >= 0 ? '+' : ''}{creditScore.scoreChange} points
            </Text>
            <Text style={styles.scoreChangeLabel">from last month</Text>
          </View>

          <View style={styles.scoreFactorContainer}>
            <Text style={styles.factorsTitle">Key Factors</Text>

            <View style={styles.factorSection}>
              <Text style={styles.factorLabel">Positive</Text>
              {creditScore.factors.positive.slice(0, 2).map((factor, index) => (
                <View key={index} style={styles.factorItem}>
                  <Icon name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.factorText}>{factor.name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.factorSection}>
              <Text style={styles.factorLabel">Negative</Text>
              {creditScore.factors.negative.slice(0, 2).map((factor, index) => (
                <View key={index} style={styles.factorItem}>
                  <Icon name="error" size={16} color={Colors.error} />
                  <Text style={styles.factorText}>{factor.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCharts = () => (
    <View style={styles.chartsContainer}>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle">Score History</Text>
        <LineChart
          data={getScoreChartData()}
          width={screenWidth - Spacing.lg * 2}
          height={180}
          chartConfig={{
            backgroundColor: Colors.surface,
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(75, 83, 32, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.primary }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle">Credit Utilization</Text>
        <BarChart
          data={getUtilizationData()}
          width={screenWidth - Spacing.lg * 2}
          height={180}
          chartConfig={{
            backgroundColor: Colors.surface,
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
            style: { borderRadius: 16 }
          }}
          style={styles.chart}
        />
        <Text style={styles.utilizationNote">
          Target: Keep utilization below 30% for optimal score
        </Text>
      </View>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Text style={styles.timeRangeLabel">Time Range:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
          { key: 'quarter', label: 'Quarter' },
          { key: 'year', label: 'Year' },
        ].map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.timeRangeChip,
              selectedTimeRange === range.key && styles.selectedTimeRange,
            ]}
            onPress={() => setSelectedTimeRange(range.key as any)}
          >
            <Text style={[
              styles.timeRangeText,
              selectedTimeRange === range.key && styles.selectedTimeRangeText,
            ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader">
        <Text style={styles.sectionTitle">Credit Alerts</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('CreditAlerts')}
        >
          <Text style={styles.viewAllText">View All</Text>
        </TouchableOpacity>
      </View>

      {creditAlerts.slice(0, 3).map((alert, index) => (
        <View key={index} style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Icon name={getAlertIcon(alert.type)} size={20} color={getAlertSeverityColor(alert.severity)} />
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getAlertSeverityColor(alert.severity) }]}>
              <Text style={styles.severityText">{alert.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.alertDescription">{alert.description}</Text>
          {alert.actionRequired && (
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText">Take Action</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {creditAlerts.length === 0 && (
        <View style={styles.emptyAlerts}>
          <Icon name="check-circle" size={48} color={Colors.success} />
          <Text style={styles.emptyTitle">No Recent Alerts</Text>
          <Text style={styles.emptyDescription">
            Your credit is being monitored. Alerts will appear here if any changes are detected.
          </Text>
        </View>
      )}
    </View>
  );

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'score_change': return 'trending-down';
      case 'new_account': return 'credit-card';
      case 'new_inquiry': return 'search';
      case 'late_payment': return 'event-late';
      case 'collection': return 'account-balance-wallet';
      case 'public_record': return 'gavel';
      case 'fraud_alert': return 'warning';
      default: return 'notifications';
    }
  };

  const renderOptimizations = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle">Score Optimizations</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('ScoreOptimizations')}
        >
          <Text style={styles.viewAllText">View All</Text>
        </TouchableOpacity>
      </View>

      {optimizations.slice(0, 3).map((optimization, index) => (
        <View key={index} style={styles.optimizationCard}>
          <View style={styles.optimizationHeader}>
            <Text style={styles.optimizationTitle">{optimization.category}</Text>
            <View style={styles.improvementBadge}>
              <Text style={styles.improvementText">+{optimization.potentialImprovement} pts</Text>
            </View>
          </View>

          <View style={styles.optimizationDetails}>
            <View style={styles.optimizationRow">
              <Text style={styles.optimizationLabel">Timeframe:</Text>
              <Text style={styles.optimizationValue">{optimization.timeframe}</Text>
            </View>
            <View style={styles.optimizationRow">
              <Text style={styles.optimizationLabel">Difficulty:</Text>
              <Text style={[styles.optimizationValue, {
                color: optimization.difficulty === 'easy' ? Colors.success :
                       optimization.difficulty === 'moderate' ? Colors.warning : Colors.accent
              }]}>
                {optimization.difficulty}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewStepsButton}
            onPress={() => navigation.navigate('OptimizationDetails', { optimization })}
          >
            <Text style={styles.viewStepsText">View Steps</Text>
          </TouchableOpacity>
        </View>
      ))}

      {optimizations.length === 0 && (
        <View style={styles.emptyOptimizations}>
          <Icon name="trending-up" size={48} color={Colors.success} />
          <Text style={styles.emptyTitle">Excellent Credit Health</Text>
          <Text style={styles.emptyDescription">
            Your credit profile is optimized. Keep maintaining good credit habits!
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Credit Monitor</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText">Loading credit monitoring data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Credit Monitor</Text>
          <Text style={styles.headerSubtitle">
            Real-time credit score monitoring and alerts
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCreditData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderScoreCard()}
        {renderTimeRangeSelector()}
        {renderCharts()}
        {renderAlerts()}
        {renderOptimizations()}
      </ScrollView>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('CreditAccounts')}
        >
          <Icon name="account-balance" size={20} color={Colors.white} />
          <Text style={styles.quickActionText">Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('CreditDisputes')}
        >
          <Icon name="gavel" size={20} color={Colors.white} />
          <Text style={styles.quickActionText">Disputes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('CreditReport')}
        >
          <Icon name="description" size={20} color={Colors.white} />
          <Text style={styles.quickActionText">Reports</Text>
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scoreCard: {
    margin: Spacing.lg,
    marginTop: 0,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.large,
  },
  scoreHeader: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: Spacing.sm,
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreDetails: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  scoreChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreChangeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  scoreChangeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  scoreFactorContainer: {
    marginBottom: Spacing.md,
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  factorSection: {
    marginBottom: Spacing.sm,
  },
  factorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  factorText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 0,
  },
  timeRangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.md,
  },
  timeRangeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTimeRange: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedTimeRangeText: {
    color: Colors.white,
    fontWeight: '500',
  },
  chartsContainer: {
    padding: Spacing.lg,
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  utilizationNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  sectionContainer: {
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
  viewAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginLeft: Spacing.sm,
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
  alertDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyAlerts: {
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
  optimizationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  optimizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  improvementBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  improvementText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  optimizationDetails: {
    marginBottom: Spacing.md,
  },
  optimizationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  optimizationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  optimizationValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  viewStepsButton: {
    backgroundColor: Colors.input,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  viewStepsText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyOptimizations: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xs,
  },
  quickActionText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
});