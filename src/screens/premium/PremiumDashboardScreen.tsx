import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { UserSubscription } from '../../services/subscription/SubscriptionManager';
import { UsageAnalytics } from '../../services/analytics/UsageAnalytics';

const { width: screenWidth } = Dimensions.get('window');

interface PremiumDashboardProps {
  userId: string;
  subscription: UserSubscription;
  onUpgrade: () => void;
  onManageBilling: () => void;
  onFeatureDetails: (featureId: string) => void;
}

interface UsageMetrics {
  currentUsage: number;
  limit: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  resetDate: string;
  cost: number;
}

interface FeatureCard {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  enabled: boolean;
  usage: UsageMetrics;
  value: number;
  lastUsed: string;
  unlockLevel: string;
}

interface DashboardStats {
  totalValue: number;
  monthlySavings: number;
  roi: number;
  featuresUsed: number;
  totalFeatures: number;
  engagementScore: number;
  upgradePotential: number;
  timeToValue: string;
}

const PremiumDashboardScreen: React.FC<PremiumDashboardProps> = ({
  userId,
  subscription,
  onUpgrade,
  onManageBilling,
  onFeatureDetails
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [featureCards, setFeatureCards] = useState<FeatureCard[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'dashboard' },
    { id: 'features', name: 'Features', icon: 'apps' },
    { id: 'usage', name: 'Usage', icon: 'analytics' },
    { id: 'value', name: 'Value', icon: 'trending-up' },
    { id: 'insights', name: 'Insights', icon: 'lightbulb' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [userId, subscription]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock API calls - would integrate with real services
      const stats = await getDashboardStats();
      const features = await getFeatureCards();
      const usage = await getUsageAnalytics();
      const notifs = await getNotifications();

      setDashboardStats(stats);
      setFeatureCards(features);
      setUsageData(usage);
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const getDashboardStats = async (): Promise<DashboardStats> => {
    return {
      totalValue: 12450,
      monthlySavings: 2250,
      roi: 350,
      featuresUsed: 18,
      totalFeatures: 24,
      engagementScore: 87,
      upgradePotential: 4500,
      timeToValue: '2 weeks'
    };
  };

  const getFeatureCards = async (): Promise<FeatureCard[]> => {
    return [
      {
        id: 'call_recording',
        name: 'Unlimited Call Recording',
        description: 'Record and store collection calls as legal evidence',
        category: 'Core Protection',
        icon: 'phone',
        enabled: true,
        usage: {
          currentUsage: 850,
          limit: -1,
          percentage: 85,
          trend: 'up',
          resetDate: 'Never',
          cost: 0
        },
        value: 2999,
        lastUsed: '2 hours ago',
        unlockLevel: 'Premium'
      },
      {
        id: 'ai_analysis',
        name: 'AI Violation Detection',
        description: 'Real-time AI analysis with 98% accuracy',
        category: 'Core Protection',
        icon: 'psychology',
        enabled: true,
        usage: {
          currentUsage: 425,
          limit: 500,
          percentage: 85,
          trend: 'up',
          resetDate: '2024-02-01',
          cost: 212.50
        },
        value: 4999,
        lastUsed: '30 minutes ago',
        unlockLevel: 'Premium'
      },
      {
        id: 'attorney_consultation',
        name: 'Attorney Consultations',
        description: 'One-on-one consultations with consumer protection attorneys',
        category: 'Legal Services',
        icon: 'gavel',
        enabled: true,
        usage: {
          currentUsage: 3,
          limit: 12,
          percentage: 25,
          trend: 'stable',
          resetDate: '2024-06-01',
          cost: 0
        },
        value: 2400,
        lastUsed: '3 days ago',
        unlockLevel: 'Premium'
      },
      {
        id: 'settlement_calculator',
        name: 'Settlement Calculator',
        description: 'AI-powered settlement valuation and negotiation',
        category: 'Analytics',
        icon: 'calculator',
        enabled: true,
        usage: {
          currentUsage: 18,
          limit: 100,
          percentage: 18,
          trend: 'up',
          resetDate: '2024-02-01',
          cost: 36
        },
        value: 1200,
        lastUsed: '1 day ago',
        unlockLevel: 'Premium'
      },
      {
        id: 'document_automation',
        name: 'Document Automation',
        description: 'Automated legal document generation and management',
        category: 'Legal Services',
        icon: 'description',
        enabled: true,
        usage: {
          currentUsage: 35,
          limit: 100,
          percentage: 35,
          trend: 'up',
          resetDate: '2024-02-01',
          cost: 70
        },
        value: 850,
        lastUsed: '5 hours ago',
        unlockLevel: 'Premium'
      }
    ];
  };

  const getUsageAnalytics = async (): Promise<any[]> => {
    return [
      { period: 'Mon', usage: 120, value: 850 },
      { period: 'Tue', usage: 145, value: 1020 },
      { period: 'Wed', usage: 180, value: 1260 },
      { period: 'Thu', usage: 165, value: 1155 },
      { period: 'Fri', usage: 195, value: 1365 },
      { period: 'Sat', usage: 85, value: 595 },
      { period: 'Sun', usage: 60, value: 420 }
    ];
  };

  const getNotifications = async (): Promise<Notification[]> => {
    return [
      {
        id: '1',
        type: 'warning',
        title: 'AI Analysis Limit Approaching',
        message: 'You\'ve used 85% of your monthly AI analysis credits',
        time: '2 hours ago',
        read: false,
        action: 'Upgrade Plan'
      },
      {
        id: '2',
        type: 'success',
        title: 'Settlement Generated',
        message: 'New settlement letter generated with AI assistance',
        time: '1 day ago',
        read: false,
        action: 'View Document'
      },
      {
        id: '3',
        type: 'info',
        title: 'New Attorney Match',
        message: '3 new attorney matches found for your case',
        time: '3 days ago',
        read: true,
        action: 'View Matches'
      }
    ];
  };

  const renderOverviewTab = () => {
    if (!dashboardStats) return null;

    return (
      <View style={styles.tabContent}>
        {/* Value Summary */}
        <View style={styles.valueCard}>
          <Text style={styles.valueTitle}>Total Value Delivered</Text>
          <Text style={styles.valueAmount}>${dashboardStats.totalValue.toLocaleString()}</Text>
          <Text style={styles.valueSubtitle}>${dashboardStats.monthlySavings.toLocaleString()} monthly savings</Text>
          <View style={styles.roiContainer}>
            <Text style={styles.roiText}>{dashboardStats.roi}% ROI</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>{dashboardStats.featuresUsed}/{dashboardStats.totalFeatures}</Text>
            <Text style={styles.metricLabel}>Features Used</Text>
          </View>

          <View style={styles.metricCard}>
            <Icon name="trending-up" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>{dashboardStats.engagementScore}%</Text>
            <Text style={styles.metricLabel}>Engagement</Text>
          </View>

          <View style={styles.metricCard}>
            <Icon name="timer" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>{dashboardStats.timeToValue}</Text>
            <Text style={styles.metricLabel}>Time to Value</Text>
          </View>

          <View style={styles.metricCard}>
            <Icon name="upgrade" size={24} color="#9C27B0" />
            <Text style={styles.metricValue}>${dashboardStats.upgradePotential}</Text>
            <Text style={styles.metricLabel}>Upgrade Potential</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickAction} onPress={() => onUpgrade()}>
              <Icon name="arrow-upward" size={28} color="#007AFF" />
              <Text style={styles.quickActionText}>Upgrade Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={() => onManageBilling()}>
              <Icon name="credit-card" size={28} color="#007AFF" />
              <Text style={styles.quickActionText}>Billing</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <Icon name="support-agent" size={28} color="#007AFF" />
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <Icon name="school" size={28} color="#007AFF" />
              <Text style={styles.quickActionText}>Tutorial</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFeaturesTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Your Premium Features</Text>
        {featureCards.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={() => onFeatureDetails(feature.id)}
          >
            <View style={styles.featureHeader}>
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={24} color="#007AFF" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.featureMeta}>
                  <Text style={styles.featureCategory}>{feature.category}</Text>
                  <Text style={styles.featureLevel}>{feature.unlockLevel}</Text>
                </View>
              </View>
              <View style={styles.featureStatus}>
                <Icon
                  name={feature.enabled ? 'check-circle' : 'lock'}
                  size={24}
                  color={feature.enabled ? '#4CAF50' : '#999'}
                />
              </View>
            </View>

            {feature.enabled && (
              <View style={styles.featureUsage}>
                <View style={styles.usageBar}>
                  <View style={styles.usageProgress}>
                    <View
                      style={[
                        styles.usageFill,
                        { width: `${Math.min(feature.usage.percentage, 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.usageText}>
                    {feature.usage.currentUsage}{feature.usage.limit > 0 && `/${feature.usage.limit}`} {feature.usage.unit}
                  </Text>
                </View>
                <View style={styles.featureStats}>
                  <Text style={styles.featureValue}>${feature.value.toLocaleString()} value</Text>
                  <Text style={styles.featureLastUsed}>Used {feature.lastUsed}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderUsageTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Usage Analytics</Text>

        {/* Usage Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Usage Trend</Text>
          <LineChart
            data={{
              labels: usageData.map(item => item.period),
              datasets: [{
                data: usageData.map(item => item.usage),
                strokeWidth: 2,
                color: '#007AFF',
              }]
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: '#666',
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#007AFF'
              }
            }}
            bezier
          />
        </View>

        {/* Value Generated Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Value Generated ($)</Text>
          <BarChart
            data={{
              labels: usageData.map(item => item.period),
              datasets: [{
                data: usageData.map(item => item.value),
              }]
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: '#666',
              style: {
                borderRadius: 16
              }
            }}
          />
        </View>

        {/* Usage Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.chartTitle}>Usage by Category</Text>
          <PieChart
            data={[
              {
                name: 'Call Recording',
                population: 35,
                color: '#007AFF',
                legendFontColor: '#666',
                legendFontSize: 12
              },
              {
                name: 'AI Analysis',
                population: 25,
                color: '#4CAF50',
                legendFontColor: '#666',
                legendFontSize: 12
              },
              {
                name: 'Documents',
                population: 20,
                color: '#FF9800',
                legendFontColor: '#666',
                legendFontSize: 12
              },
              {
                name: 'Consultations',
                population: 20,
                color: '#9C27B0',
                legendFontColor: '#666',
                legendFontSize: 12
              }
            ]}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: '#666',
              style: {
                borderRadius: 16
              }
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </View>
    );
  };

  const renderValueTab = () => {
    if (!dashboardStats) return null;

    return (
      <View style={styles.tabContent}>
        {/* Value Summary */}
        <View style={styles.valueSummary}>
          <Text style={styles.valueSectionTitle}>Your Premium Investment</Text>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Monthly Plan Cost</Text>
            <Text style={styles.valueAmount}>$49.99</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Annual Value Received</Text>
            <Text style={styles.valueAmount}>${dashboardStats.totalValue.toLocaleString()}</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Return on Investment</Text>
            <Text style={styles.valueAmount}>{dashboardStats.roi}%</Text>
          </View>
        </View>

        {/* Value Breakdown */}
        <View style={styles.valueBreakdown}>
          <Text style={styles.valueSectionTitle}>Value Breakdown</Text>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownBar, { width: '75%' }]} />
            <Text style={styles.breakdownText}>Attorney Services ($8,400)</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownBar, { width: '45%' }]} />
            <Text style={styles.breakdownText}>AI Analysis ($4,999)</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownBar, { width: '35%' }]} />
            <Text style={styles.breakdownText}>Document Generation ($2,550)</Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownBar, { width: '20%' }]} />
            <Text style={styles.breakdownText}>Settlement Calculator ($1,200)</Text>
          </View>
        </View>

        {/* Upgrade Opportunities */}
        <View style={styles.upgradeOpportunities}>
          <Text style={styles.valueSectionTitle}>Growth Opportunities</Text>
          <TouchableOpacity style={styles.opportunityCard} onPress={onUpgrade}>
            <Icon name="workspace-premium" size={32} color="#FFD700" />
            <View style={styles.opportunityContent}>
              <Text style={styles.opportunityTitle}>Enterprise Plan</Text>
              <Text style={styles.opportunityDescription}>
                Unlock API access, unlimited team members, and custom integrations
              </Text>
              <Text style={styles.opportunityValue}>+${dashboardStats.upgradePotential.toLocaleString()} potential value</Text>
            </View>
            <Icon name="arrow-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderInsightsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>AI-Powered Insights</Text>

        {/* Personalized Recommendations */}
        <View style={styles.insightsContainer}>
          <View style={styles.insightCard}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.insightTitle}>Usage Pattern Detected</Text>
            <Text style={styles.insightDescription}>
              Your call recording usage increased by 40% this month. Consider upgrading to Enterprise for unlimited storage.
            </Text>
            <TouchableOpacity style={styles.insightAction}>
              <Text style={styles.insightActionText}>View Analytics</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.insightCard}>
            <Icon name="psychology" size={24} color="#2196F3" />
            <Text style={styles.insightTitle}>AI Performance Optimization</Text>
            <Text style={styles.insightDescription}>
              Your AI analysis success rate is 98.7%, above the 94% average. Keep up the excellent documentation!
            </Text>
            <TouchableOpacity style={styles.insightAction}>
              <Text style={styles.insightActionText}>View Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.insightCard}>
            <Icon name="gavel" size={24} color="#FF9800" />
            <Text style={styles.insightTitle}>Legal Opportunity Identified</Text>
            <Text style={styles.insightDescription}>
              Based on your call analysis, 3 additional FDCPA violations could be pursued. Schedule attorney consultation.
            </Text>
            <TouchableOpacity style={styles.insightAction}>
              <Text style={styles.insightActionText}>Schedule Consultation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Center */}
        <View style={styles.notificationsContainer}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {notifications.map((notification) => (
            <TouchableOpacity key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationIcon}>
                <Icon
                  name={notification.type === 'success' ? 'check-circle' :
                        notification.type === 'warning' ? 'warning' : 'info'}
                  size={20}
                  color={notification.type === 'success' ? '#4CAF50' :
                          notification.type === 'warning' ? '#FF9800' : '#2196F3'}
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your Premium Dashboard...</Text>
        </View>
      );
    }

    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'features':
        return renderFeaturesTab();
      case 'usage':
        return renderUsageTab();
      case 'value':
        return renderValueTab();
      case 'insights':
        return renderInsightsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.subscription}>{subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)} Plan</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={onUpgrade}>
            <Icon name="upgrade" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.activeTab
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={selectedTab === tab.id ? '#007AFF' : '#666'}
              />
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.activeTabText
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => onManageBilling()}>
        <Icon name="settings" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
  action: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  subscription: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
  },
  tabScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  tabContent: {
    paddingBottom: 20,
  },
  // Overview Tab Styles
  valueCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valueTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  valueSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  roiContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roiText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  // Features Tab Styles
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  featureMeta: {
    flexDirection: 'row',
  },
  featureCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  featureLevel: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featureStatus: {
    marginLeft: 12,
  },
  featureUsage: {
    marginTop: 12,
  },
  usageBar: {
    marginBottom: 8,
  },
  usageProgress: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  usageText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  featureStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  featureLastUsed: {
    fontSize: 12,
    color: '#666',
  },
  // Charts Tab Styles
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  // Value Tab Styles
  valueSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  valueSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  valueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  valueLabel: {
    fontSize: 16,
    color: '#666',
  },
  valueBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: '#666',
  },
  upgradeOpportunities: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  opportunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  opportunityContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  opportunityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // Insights Tab Styles
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  insightActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  notificationsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default PremiumDashboardScreen;