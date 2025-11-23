/**
 * CallWall Debt Collection Tracker Screen
 * Comprehensive dashboard for monitoring collection activities and statutory violations
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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import {
  DebtCollectionTracker,
  CollectionInsights,
  DebtCollectionActivity,
  RiskAssessment
} from '../../services/debt/DebtCollectionTracker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function DebtTrackerScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<CollectionInsights | null>(null);
  const [recentActivities, setRecentActivities] = useState<DebtCollectionActivity[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [riskDistribution, setRiskDistribution] = useState<any>(null);
  const [communicationTrends, setCommunicationTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tracker = new DebtCollectionTracker({
    monitoringEnabled: true,
    autoLogging: true,
    violationAlerts: true,
    escalationAlerts: true,
    statutoryLimitations: {
      enabled: true,
      stateRules: []
    },
    dataRetention: {
      days: 365,
      autoDelete: false
    },
    privacySettings: {
      encryption: true,
      dataSharing: false,
      analytics: true
    }
  });

  useEffect(() => {
    loadDebtCollectionData();
  }, [selectedTimeRange]);

  const loadDebtCollectionData = async () => {
    setRefreshing(true);
    try {
      // Get date range based on selection
      const endDate = new Date();
      const startDate = new Date();

      switch (selectedTimeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Get comprehensive insights
      const collectionInsights = await tracker.getCollectionInsights({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      setInsights(collectionInsights);

      // Process data for charts
      processChartData(collectionInsights);

      // Load recent activities (mock data for now)
      const mockActivities: DebtCollectionActivity[] = [
        {
          id: '1',
          type: 'call',
          timestamp: '2024-01-15T14:30:00Z',
          collector: {
            id: 'col_001',
            name: 'John Smith',
            agency: 'ABC Collections',
            phone: '(555) 123-4567',
            address: '123 Collection St, Phoenix, AZ',
            licenseNumber: 'AZ-COL-001',
            jurisdiction: 'Arizona',
            tactics: ['high_pressure', 'frequent_calling'],
            complaintHistory: 127,
            lastActivity: '2024-01-15T14:30:00Z',
            reputation: 'poor',
            settlementRange: { min: 500, max: 2000, average: 1200 },
            licenseStatus: 'active'
          },
          direction: 'inbound',
          communicationId: 'comm_001',
          content: {
            body: 'This is an attempt to collect a debt. You need to pay immediately.',
            referencedDebts: [{
              originalCreditor: 'Credit Card Company',
              currentAmount: 2500,
              disputeStatus: 'none'
            }],
            threats: [{
              type: 'legal_action',
              credibility: 85,
              language: 'We will take legal action if you don\'t pay',
              timeframe: '30 days'
            }],
            demands: [],
            promises: [],
            legalReferences: [],
            urgency: 'high',
            tone: 'aggressive'
          },
          violations: [{
            id: 'viol_001',
            type: 'harassment',
            severity: 'major',
            statutoryReference: '15 USC 1692d',
            penaltyAmount: 1000,
            confidence: 0.92,
            evidence: 'Threatening language with high pressure tactics',
            legalBasis: ['FDCPA Harassment provisions'],
            suggestedResponse: 'File complaint with CFPB and consider legal action',
            actionable: true
          }],
          riskAssessment: {
            level: 'high',
            score: 85,
            factors: [{
              type: 'harassment_indicators',
              weight: 0.4,
              value: 90,
              impact: 'High likelihood of FDCPA violations'
            }],
            escalationRisk: 75,
            legalRisk: 90,
            recommendedActions: ['Document all communications', 'Consider cease and desist', 'File complaint'],
            timeframe: 'Immediate action required',
            protectiveMeasures: ['Record all calls', 'Save all communications', 'Consult attorney']
          },
          actionRequired: true,
          actionTaken: 'Documented violation',
          sentiment: {
            overall: 'hostile',
            harassment: 85,
            intimidation: 70,
            manipulation: 60,
            urgency: 90,
            fearInducing: 75,
            professionalism: 20
          },
          emotionalImpact: 88
        }
      ];

      setRecentActivities(mockActivities);

    } catch (error) {
      console.error('Error loading debt collection data:', error);
      Alert.alert('Error', 'Unable to load debt collection data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const processChartData = (insights: CollectionInsights) => {
    // Risk distribution for pie chart
    const riskData = [
      {
        name: 'Low Risk',
        population: insights.communicationTrends.filter(t => t.averageRisk < 25).length,
        color: Colors.success,
        legendFontColor: Colors.text,
        legendFontSize: 12
      },
      {
        name: 'Medium Risk',
        population: insights.communicationTrends.filter(t => t.averageRisk >= 25 && t.averageRisk < 50).length,
        color: Colors.warning,
        legendFontColor: Colors.text,
        legendFontSize: 12
      },
      {
        name: 'High Risk',
        population: insights.communicationTrends.filter(t => t.averageRisk >= 50 && t.averageRisk < 75).length,
        color: Colors.accent,
        legendFontColor: Colors.text,
        legendFontSize: 12
      },
      {
        name: 'Critical Risk',
        population: insights.communicationTrends.filter(t => t.averageRisk >= 75).length,
        color: Colors.error,
        legendFontColor: Colors.text,
        legendFontSize: 12
      }
    ];

    setRiskDistribution(riskData);

    // Communication trends for line chart
    const trendData = {
      labels: insights.communicationTrends.slice(-7).map(t =>
        new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' })
      ),
      datasets: [
        {
          data: insights.communicationTrends.slice(-7).map(t => t.volume),
          color: (opacity = 1) => `rgba(75, 83, 32, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: insights.communicationTrends.slice(-7).map(t => t.averageRisk),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    setCommunicationTrends(trendData);
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.accent;
      case 'critical': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return Colors.success;
      case 'moderate': return Colors.warning;
      case 'major': return Colors.accent;
      case 'severe': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInsightCards = () => {
    if (!insights) return null;

    return (
      <View style={styles.insightsContainer}>
        <View style={styles.insightCard}>
          <Icon name="business" size={24} color={Colors.primary} />
          <Text style={styles.insightValue}>{insights.totalCollectors}</Text>
          <Text style={styles.insightLabel}>Active Collectors</Text>
        </View>

        <View style={styles.insightCard}>
          <Icon name="phone" size={24} color={Colors.accent} />
          <Text style={styles.insightValue}>{insights.totalCommunications}</Text>
          <Text style={styles.insightLabel}>Total Contacts</Text>
        </View>

        <View style={styles.insightCard}>
          <Icon name="gavel" size={24} color={Colors.error} />
          <Text style={styles.insightValue}>{insights.violationRate.toFixed(1)}%</Text>
          <Text style={styles.insightLabel}>Violation Rate</Text>
        </View>

        <View style={styles.insightCard}>
          <Icon name="warning" size={24} color={Colors.warning} />
          <Text style={styles.insightValue}>{insights.averageRiskScore.toFixed(0)}</Text>
          <Text style={styles.insightLabel}>Avg Risk Score</Text>
        </View>
      </View>
    );
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Text style={styles.timeRangeLabel}>Time Range:</Text>
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

  const renderRiskChart = () => {
    if (!riskDistribution) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Risk Distribution</Text>
        <PieChart
          data={riskDistribution}
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
    );
  };

  const renderTrendsChart = () => {
    if (!communicationTrends) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Communication Trends</Text>
        <LineChart
          data={communicationTrends}
          width={screenWidth - Spacing.lg * 2}
          height={220}
          chartConfig={{
            backgroundColor: Colors.surface,
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(75, 83, 32, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: Colors.primary
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderRecentActivities = () => (
    <View style={styles.activitiesContainer}>
      <Text style={styles.sectionTitle}>Recent Activities</Text>
      {recentActivities.slice(0, 5).map((activity) => (
        <TouchableOpacity
          key={activity.id}
          style={styles.activityItem}
          onPress={() => navigation.navigate('ActivityDetails', { activity })}
        >
          <View style={styles.activityHeader}>
            <View style={styles.activityInfo}>
              <View style={styles.activityType}>
                <Icon name={activity.type === 'call' ? 'phone' : 'email'} size={16} color={Colors.textSecondary} />
                <Text style={styles.activityTypeText}>{activity.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.activityCollector}>{activity.collector.agency}</Text>
              <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
            </View>

            <View style={[styles.riskIndicator, { backgroundColor: getRiskLevelColor(activity.riskAssessment.level) }]}>
              <Text style={styles.riskIndicatorText}>
                {activity.riskAssessment.score}
              </Text>
            </View>
          </View>

          {activity.violations.length > 0 && (
            <View style={styles.violationAlert}>
              <Icon name="warning" size={16} color={Colors.error} />
              <Text style={styles.violationText}>
                {activity.violations.length} violation(s) detected
              </Text>
              {activity.violations[0] && (
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(activity.violations[0].severity) }]}>
                  <Text style={styles.severityText}>{activity.violations[0].severity}</Text>
                </View>
              )}
            </View>
          )}

          {activity.actionRequired && (
            <View style={styles.actionRequired}>
              <Icon name="priority-high" size={14} color={Colors.accent} />
              <Text style={styles.actionRequiredText}>Action Required</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {recentActivities.length === 0 && (
        <View style={styles.emptyActivities}>
          <Icon name="phone-locked" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No recent activities</Text>
          <Text style={styles.emptyDescription}>
            Collection activities will appear here once detected
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
          <Text style={styles.headerTitle}>Debt Collection Tracker</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading debt collection data...</Text>
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
          <Text style={styles.headerTitle}>Debt Collection Tracker</Text>
          <Text style={styles.headerSubtitle}>
            Monitor collection activities and protect your rights
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDebtCollectionData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderInsightCards()}
        {renderTimeRangeSelector()}
        {renderRiskChart()}
        {renderTrendsChart()}
        {renderRecentActivities()}
      </ScrollView>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SOLTracker')}
        >
          <Icon name="schedule" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>SOL Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('LegalReport')}
        >
          <Icon name="description" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Legal Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Violations')}
        >
          <Icon name="gavel" size={20} color={Colors.white} />
          <Text style={styles.actionButtonText}>Violations</Text>
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
  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  insightCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  insightLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  timeRangeContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  timeRangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
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
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    margin: Spacing.lg,
    marginTop: 0,
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
  activitiesContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  activityItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  activityTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  activityCollector: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  riskIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  riskIndicatorText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  violationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}20`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  violationText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: Spacing.sm,
    flex: 1,
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
  actionRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent}20`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionRequiredText: {
    fontSize: 12,
    color: Colors.accent,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  emptyActivities: {
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
  quickActions: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
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
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    fontSize: 14,
  },
});