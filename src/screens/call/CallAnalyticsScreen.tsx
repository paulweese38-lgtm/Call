/**
 * CallWall Call Analytics Screen
 * Comprehensive call analytics dashboard with violation patterns and legal insights
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
  CallAnalyticsEngine,
  CallAnalyticsData,
  ViolationAnalytics,
  CollectorAnalytics,
  LegalReportingData
} from '../../services/call/CallAnalyticsEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function CallAnalyticsScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<CallAnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'violations' | 'collectors' | 'financial' | 'legal'>('overview');
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const analyticsEngine = new CallAnalyticsEngine();

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    setRefreshing(true);
    try {
      const data = await analyticsEngine.generateComprehensiveAnalytics(selectedTimeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Unable to load analytics data');
    } finally {
      setRefreshing(false);
    }
  };

  const getOverviewChartData = () => {
    if (!analyticsData) return null;

    const callVolumeData = analyticsData.temporalAnalytics.callVolumeTrends.map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: trend.callCount,
      violations: trend.violationCount
    }));

    return {
      labels: callVolumeData.map(d => d.date),
      datasets: [
        {
          data: callVolumeData.map(d => d.calls),
          color: (opacity = 1) => `rgba(75, 83, 32, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: callVolumeData.map(d => d.violations),
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
          strokeWidth: 2,
        }
      ]
    };
  };

  const getViolationSeverityData = () => {
    if (!analyticsData) return null;

    const severityData = analyticsData.violationAnalytics.violationsBySeverity;
    const total = Object.values(severityData).reduce((sum, count) => sum + count, 0);

    return Object.entries(severityData).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      population: count,
      color: getSeverityColor(severity),
      legendFontColor: Colors.text,
      legendFontSize: 12
    }));
  };

  const getCollectorRiskData = () => {
    if (!analyticsData) return null;

    const riskData = analyticsData.collectorAnalytics.riskRatings;
    return Object.entries(riskData).map(([risk, count]) => ({
      name: risk.charAt(0).toUpperCase() + risk.slice(1),
      population: count,
      color: getRiskColor(risk),
      legendFontColor: Colors.text,
      legendFontSize: 12
    }));
  };

  const getTimeOfDayData = () => {
    if (!analyticsData) return null;

    return analyticsData.temporalAnalytics.timeOfDayAnalysis.map(hour => ({
      hour: hour.hour,
      callCount: hour.callCount,
      violationRate: hour.violationRate
    })).filter((_, index) => index % 2 === 0); // Show every other hour for clarity
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return Colors.textSecondary;
      case 'moderate': return Colors.warning;
      case 'major': return Colors.accent;
      case 'severe': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.accent;
      case 'critical': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 90) return Colors.success;
    if (score >= 70) return Colors.warning;
    if (score >= 50) return Colors.accent;
    return Colors.error;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    const { overview } = analyticsData;

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Icon name="phone" size={24} color={Colors.primary} />
            <Text style={styles.summaryValue}>{formatNumber(overview.totalCalls)}</Text>
            <Text style={styles.summaryLabel}>Total Calls</Text>
          </View>

          <View style={styles.summaryCard}>
            <Icon name="mic" size={24} color={Colors.success} />
            <Text style={styles.summaryValue}>{formatNumber(overview.recordedCalls)}</Text>
            <Text style={styles.summaryLabel}>Recorded</Text>
          </View>

          <View style={styles.summaryCard}>
            <Icon name="gavel" size={24} color={Colors.error} />
            <Text style={styles.summaryValue}>{formatNumber(overview.callsWithViolations)}</Text>
            <Text style={styles.summaryLabel}>Violations</Text>
          </View>

          <View style={styles.summaryCard}>
            <Icon name="warning" size={24} color={Colors.accent} />
            <Text style={styles.summaryValue}>{overview.violationRate}%</Text>
            <Text style={styles.summaryLabel}>Violation Rate</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Call Volume & Violations Trend</Text>
          <LineChart
            data={getOverviewChartData()}
            width={screenWidth - Spacing.lg * 2}
            height={220}
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.primary }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.complianceContainer}>
          <Text style={styles.complianceTitle">Overall Compliance Score</Text>
          <View style={styles.complianceScoreContainer}>
            <View style={styles.complianceScoreCircle}>
              <Text style={[
                styles.complianceScoreText,
                { color: getComplianceColor(overview.complianceScore) }
              ]}>
                {overview.complianceScore}%
              </Text>
            </View>
            <Text style={styles.complianceDescription}>
              {overview.complianceScore >= 90 ? 'Excellent compliance with regulations' :
               overview.complianceScore >= 70 ? 'Good compliance with minor issues' :
               overview.complianceScore >= 50 ? 'Moderate compliance needs improvement' :
               'Poor compliance requires immediate attention'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatNumber(overview.highRiskCalls)}</Text>
            <Text style={styles.metricLabel}>High Risk Calls</Text>
            <View style={styles.metricIndicator} />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overview.emergencyAlerts}</Text>
            <Text style={styles.metricLabel}>Emergency Alerts</Text>
            <View style={styles.metricIndicator} />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{Math.round(overview.averageCallDuration / 60)}m</Text>
            <Text style={styles.metricLabel}>Avg Duration</Text>
            <View style={styles.metricIndicator} />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue">{overview.evidenceStrength}%</Text>
            <Text style={styles.metricLabel}>Evidence Strength</Text>
            <View style={styles.metricIndicator} />
          </View>
        </View>
      </View>
    );
  };

  const renderViolationsTab = () => {
    if (!analyticsData) return null;

    const { violationAnalytics } = analyticsData;

    return (
      <View style={styles.violationsContainer}>
        <View style={styles.violationOverview}>
          <Text style={styles.violationTotal}>
            {formatNumber(violationAnalytics.totalViolations)} Total Violations
          </Text>
          <View style={styles.violationStats}>
            <Text style={styles.violationStat}>Severity Distribution</Text>
            <PieChart
              data={getViolationSeverityData()}
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
        </View>

        <View style={styles.topViolationsContainer}>
          <Text style={styles.sectionTitle}>Top Violation Types</Text>
          {violationAnalytics.topViolationTypes.slice(0, 5).map((violation, index) => (
            <View key={index} style={styles.violationTypeCard}>
              <View style={styles.violationHeader}>
                <Text style={styles.violationTypeName}>{violation.type}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(violation.severity) }]}>
                  <Text style={styles.severityText}>{violation.severity.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.violationMetrics}>
                <Text style={styles.violationCount}>{formatNumber(violation.count)} occurrences</Text>
                <Text style={styles.violationFrequency}>{violation.frequency}% frequency</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.patternsContainer}>
          <Text style={styles.sectionTitle">Violation Patterns</Text>
          {violationAnalytics.violationPatterns.slice(0, 3).map((pattern, index) => (
            <View key={index} style={styles.patternCard}>
              <Text style={styles.patternName}>{pattern.name}</Text>
              <Text style={styles.patternDescription}>{pattern.description}</Text>
              <View style={styles.patternMetrics}>
                <Text style={styles.patternFrequency}>Frequency: {pattern.frequency}</Text>
                <View style={[styles.patternSeverity, { backgroundColor: getSeverityColor(pattern.severity) }]}>
                  <Text style={styles.patternSeverityText}>{pattern.severity.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.patternActions}>
                <Text style={styles.patternActionTitle">Recommended Actions:</Text>
                {pattern.recommendedActions.map((action, actionIndex) => (
                  <Text key={actionIndex} style={styles.patternAction}>• {action}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.escalationContainer}>
          <Text style={styles.sectionTitle}>Escalation Triggers</Text>
          {violationAnalytics.escalationTriggers.map((trigger, index) => (
            <View key={index} style={styles.escalationItem}>
              <Icon name="warning" size={16} color={Colors.accent} />
              <Text style={styles.escalationText}>{trigger}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCollectorsTab = () => {
    if (!analyticsData) return null;

    const { collectorAnalytics } = analyticsData;

    return (
      <View style={styles.collectorsContainer}>
        <View style={styles.collectorOverview}>
          <Text style={styles.collectorTotal}>
            {formatNumber(collectorAnalytics.totalCollectors)} Total Collectors
          </Text>
          <View style={styles.collectorStats}>
            <Text style={styles.collectorStat}>
              {collectorAnalytics.activeCollectors} active
            </Text>
            <Text style={styles.collectorStat}>
              {collectorAnalytics.blacklistCandidates.length} high risk
            </Text>
          </View>
          <PieChart
            data={getCollectorRiskData()}
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

        <View style={styles.riskRatingsContainer}>
          <Text style={styles.sectionTitle">Risk Distribution</Text>
          <View style={styles.riskBars}>
            {Object.entries(collectorAnalytics.riskRatings).map(([risk, count]) => (
              <View key={risk} style={styles.riskBar}>
                <Text style={styles.riskLabel}>{risk.charAt(0).toUpperCase() + risk.slice(1)}</Text>
                <View style={styles.riskBarBackground}>
                  <View
                    style={[
                      styles.riskBarFill,
                      {
                        width: `${(count / collectorAnalytics.totalCollectors) * 100}%`,
                        backgroundColor: getRiskColor(risk)
                      }
                    ]}
                  />
                </View>
                <Text style={styles.riskValue}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.topCollectorsContainer}>
          <Text style={styles.sectionTitle}>Most Dangerous Collectors</Text>
          {collectorAnalytics.mostDangerousCollectors.slice(0, 5).map((collector, index) => (
            <View key={index} style={styles.collectorCard}>
              <View style={styles.collectorHeader}>
                <View style={styles.collectorInfo}>
                  <Text style={styles.collectorName}>{collector.name}</Text>
                  <Text style={styles.collectorAgency}>{collector.agency}</Text>
                  <Text style={styles.collectorPhone}>{collector.phoneNumber}</Text>
                </View>
                <View style={styles.collectorRisk}>
                  <View style={[styles.riskScore, { backgroundColor: getComplianceColor(100 - collector.riskScore) }]}>
                    <Text style={styles.riskScoreText}>{collector.riskScore}</Text>
                  </View>
                  <Text style={styles.violationCount}>{collector.violationCount}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.communicationStylesContainer}>
          <Text style={styles.sectionTitle}>Communication Styles Analysis</Text>
          {Object.entries(collectorAnalytics.communicationStyles).slice(0, 4).map(([style, count]) => (
            <View key={style} style={styles.communicationStyle}>
              <Text style={styles.styleName}>{style.replace('_', ' ').toUpperCase()}</Text>
              <Text style={styles.styleCount}>{formatNumber(count)} instances</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFinancialTab = () => {
    if (!analyticsData) return null;

    const { financialAnalytics } = analyticsData;

    return (
      <View style={styles.financialContainer}>
        <View style={styles.financialOverview}>
          <Text style={styles.financialTitle}>
            Potential Damages: {formatCurrency(financialAnalytics.totalPotentialDamages)}
          </Text>
          <View style={styles.financialStats}>
            <View style={styles.financialStat}>
              <Text style={styles.financialValue}>{formatCurrency(financialAnalytics.averageSettlementValue)}</Text>
              <Text style={styles.financialLabel">Avg Settlement</Text>
            </View>
            <View style={styles.financialStat}>
              <Text style={styles.financialValue}>{financialAnalytics.litigationProbability}%</Text>
              <Text style={styles.financialLabel">Litigation Probability</Text>
            </View>
            <View style={styles.financialStat}>
              <Text style={styles.financialValue}>{financialAnalytics.settlementProbability}%</Text>
              <Text style={styles.financialLabel">Settlement Probability</Text>
            </View>
          </View>
        </View>

        <View style={styles.highestValueContainer}>
          <Text style={styles.sectionTitle">Highest Value Case</Text>
          <View style={styles.highestValueCard}>
            <View style={styles.highestValueHeader}>
              <Text style={styles.highestValueAmount}>
                {formatCurrency(financialAnalytics.highestValueCase.estimatedValue)}
              </Text>
              <View style={[styles.valueBadge, { backgroundColor: Colors.success }]}>
                <Text style={styles.valueBadgeText">STRONG CASE</Text>
              </View>
            </View>
            <Text style={styles.highestValueDetails}>
              <Text>Collector: {financialAnalytics.highestValueCase.collector}</Text>
              <Text>Violations: {financialAnalytics.highestValueCase.violations}</Text>
              <Text>Date: {new Date(financialAnalytics.highestValueCase.date).toLocaleDateString()}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.valueRangeContainer}>
          <Text style={styles.sectionTitle">Cases by Value Range</Text>
          {Object.entries(financialAnalytics.casesByValueRange).map(([range, count]) => (
            <View key={range} style={styles.valueRangeItem}>
              <Text style={styles.valueRangeLabel}>{range}</Text>
              <Text style={styles.valueRangeCount}>{count} cases</Text>
            </View>
          ))}
        </View>

        <View style={styles.evidenceContainer}>
          <Text style={styles.sectionTitle">Evidence Value Assessment</Text>
          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceValue}>{financialAnalytics.evidenceValue.strongEvidence}</Text>
              <Text style={styles.evidenceLabel">Strong Evidence</Text>
            </View>
            <View style={styles.evidenceItem">
              <Text style={styles.evidenceValue}>{financialAnalytics.evidenceValue.admissibleInCourt}%</Text>
              <Text style={styles.evidenceLabel">Court Admissible</Text>
            </View>
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceValue}>{formatCurrency(financialAnalytics.evidenceValue.totalEvidenceValue)}</Text>
              <Text style={styles.evidenceLabel">Total Evidence Value</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLegalTab = () => {
    if (!analyticsData) return null;

    const { legalReporting } = analyticsData;

    return (
      <View style={styles.legalContainer}>
        <View style={styles.legalReadiness}>
          <Text style={styles.legalTitle">Legal Action Readiness</Text>
          <View style={[
            styles.readinessBadge,
            { backgroundColor: legalReporting.readyForLegalAction ? Colors.success : Colors.warning }
          ]}>
            <Icon name={legalReporting.readyForLegalAction ? 'check-circle' : 'warning'} size={20} color={Colors.white} />
            <Text style={styles.readinessText}>
              {legalReporting.readyForLegalAction ? 'Ready for Legal Action' : 'Preparation Needed'}
            </Text>
          </View>
        </View>

        <View style={styles.strongCasesContainer}>
          <Text style={styles.sectionTitle}>Strong Legal Cases</Text>
          {legalReporting.strongCases.slice(0, 3).map((legalCase, index) => (
            <View key={index} style={styles.legalCaseCard}>
              <View style={styles.caseHeader}>
                <Text style={styles.caseId}>Case {legalCase.id}</Text>
                <View style={[styles.caseComplexity, { backgroundColor: getComplexityColor(legalCase.complexity) }]}>
                  <Text style={styles.complexityText}>{legalCase.complexity.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.caseMetrics}>
                <Text style={styles.caseMetric}>Potential Damages: {formatCurrency(legalCase.totalDamages)}</Text>
                <Text style={styles.caseMetric}>Success Probability: {legalCase.successProbability}%</Text>
                <Text style={styles.caseMetric}>Violations: {legalCase.violationCount}</Text>
                <Text style={styles.caseMetric}>Evidence Strength: {legalCase.evidenceStrength}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.evidencePackageContainer}>
          <Text style={styles.sectionTitle">Evidence Package</Text>
          <View style={styles.evidenceStats}>
            <View style={styles.evidenceStat}>
              <Text style={styles.evidenceCount}>{legalReporting.evidencePackage.totalEvidence}</Text>
              <Text style={styles.evidenceLabel">Total Evidence</Text>
            </View>
            <View style={styles.evidenceStat}>
              <Text style={styles.evidenceCount}>{legalReporting.evidencePackage.admissibleEvidence}</Text>
              <Text style={styles.evidenceLabel">Admissible</Text>
            </View>
            <View style={styles.evidenceStat}>
              <Text style={styles.evidenceCount}>{legalReporting.evidencePackage.transcribedCalls}</Text>
              <Text style={styles.evidenceLabel">Transcribed</Text>
            </View>
            <View style={styles.evidenceStat}>
              <Text style={styles.evidenceCount}>{formatCurrency(legalReporting.evidencePackage.totalEvidenceValue)}</Text>
              <Text style={styles.evidenceLabel">Total Value</Text>
            </View>
          </View>
        </View>

        <View style={styles.filingReadinessContainer}>
          <Text style={styles.sectionTitle">Regulatory Filing Readiness</Text>
          <View style={styles.filingAgencies}>
            <View style={styles.filingAgency}>
              <Icon name="account-balance" size={20} color={legalReporting.regulatoryFilingData.cfpbReady ? Colors.success : Colors.error} />
              <Text style={styles.filingAgencyText">CFPB</Text>
              <Text style={[
                styles.filingStatus,
                { color: legalReporting.regulatoryFilingData.cfpbReady ? Colors.success : Colors.error }
              ]}>
                {legalReporting.regulatoryFilingData.cfpbReady ? 'Ready' : 'Not Ready'}
              </Text>
            </View>

            <View style={styles.filingAgency}>
              <Icon name="gavel" size={20} color={legalReporting.regulatoryFilingData.attorneyGeneralReady ? Colors.success : Colors.error} />
              <Text style={styles.filingAgencyText">Attorney General</Text>
              <Text style={[
                styles.filingStatus,
                { color: legalReporting.regulatoryFilingData.attorneyGeneralReady ? Colors.success : Colors.error }
              ]}>
                {legalReporting.regulatoryFilingData.attorneyGeneralReady ? 'Ready' : 'Not Ready'}
              </Text>
            </View>

            <View style={styles.filingAgency}>
              <Icon name="description" size={20} color={legalReporting.regulatoryFilingData.ftcReady ? Colors.success : Colors.error} />
              <Text style={styles.filingAgencyText">FTC</Text>
              <Text style={[
                styles.filingStatus,
                { color: legalReporting.regulatoryFilingData.ftcReady ? Colors.success : Colors.error }
              ]}>
                {legalReporting.regulatoryFilingData.ftcReady ? 'Ready' : 'Not Ready'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'simple': return Colors.success;
      case 'moderate': return Colors.warning;
      case 'complex': return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <TouchableOpacity
        style={styles.timeRangeButton}
        onPress={() => setShowTimeRangeModal(true)}
      >
        <Icon name="date-range" size={20} color={Colors.white} />
        <Text style={styles.timeRangeText}>{selectedTimeRange.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActionsBar = () => (
    <View style={styles.actionsBar}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: Colors.primary }]}
        onPress={() => navigation.navigate('DetailedAnalytics', { timeframe: selectedTimeRange })}
      >
        <Icon name="analytics" size={20} color={Colors.white} />
        <Text style={styles.actionButtonText">Detailed Analysis</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: Colors.accent }]}
        onPress={() => setShowExportModal(true)}
      >
        <Icon name="download" size={20} color={Colors.white} />
        <Text style={styles.actionButtonText">Export Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: Colors.success }]}
        onPress={async () => {
          try {
            const reportUrl = await analyticsEngine.generateLegalReport([]);
            Alert.alert('Success', 'Legal report generated successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to generate legal report');
          }
        }}
      >
        <Icon name="gavel" size={20} color={Colors.white} />
        <Text style={styles.actionButtonText">Legal Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Call Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive violation analysis and legal insights
          </Text>
        </View>
      </LinearGradient>

      {renderTimeRangeSelector()}

      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'violations', label: 'Violations', icon: 'gavel' },
          { key: 'collectors', label: 'Collectors', icon: 'people' },
          { key: 'financial', label: 'Financial', icon: 'attach-money' },
          { key: 'legal', label: 'Legal', icon: 'balance' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={selectedTab === tab.key ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAnalytics} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'violations' && renderViolationsTab()}
        {selectedTab === 'collectors' && renderCollectorsTab()}
        {selectedTab === 'financial' && renderFinancialTab()}
        {selectedTab === 'legal' && renderLegalTab()}
      </ScrollView>

      {renderActionsBar()}

      {/* Time Range Modal */}
      <Modal
        visible={showTimeRangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle">Select Time Range</Text>
              <TouchableOpacity onPress={() => setShowTimeRangeModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {[
                { key: 'day', label: 'Last 24 Hours', icon: 'today' },
                { key: 'week', label: 'Last 7 Days', icon: 'view_week' },
                { key: 'month', label: 'Last 30 Days', icon: 'calendar_month' },
                { key: 'quarter', label: 'Last 90 Days', icon: 'date_range' },
                { key: 'year', label: 'Last Year', icon: 'history' },
              ].map((timeRange) => (
                <TouchableOpacity
                  key={timeRange.key}
                  style={[
                    styles.timeRangeOption,
                    selectedTimeRange === timeRange.key && styles.selectedTimeRangeOption,
                  ]}
                  onPress={() => {
                    setSelectedTimeRange(timeRange.key as any);
                    setShowTimeRangeModal(false);
                  }}
                >
                  <Icon name={timeRange.icon} size={24} color={selectedTimeRange === timeRange.key ? Colors.primary : Colors.textSecondary} />
                  <Text style={[
                    styles.timeRangeOptionText,
                    selectedTimeRange === timeRange.key && styles.selectedTimeRangeOptionText,
                  ]}>
                    {timeRange.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle">Export Analytics Report</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.exportLabel">Select Export Format:</Text>
              {[
                { key: 'pdf', label: 'PDF Report', icon: 'picture-as-pdf', description: 'Comprehensive analytics report with charts' },
                { key: 'excel', label: 'Excel Spreadsheet', icon: 'grid-on', description: 'Raw data for further analysis' },
                { key: 'csv', label: 'CSV Data', icon: 'table-chart', description: 'Comma-separated values' },
              ].map((format) => (
                <TouchableOpacity
                  key={format.key}
                  style={[
                    styles.formatOption,
                    exportFormat === format.key && styles.selectedFormatOption,
                  ]}
                  onPress={() => setExportFormat(format.key as any)}
                >
                  <Icon name={format.icon} size={24} color={exportFormat === format.key ? Colors.primary : Colors.textSecondary} />
                  <View style={styles.formatOptionContent}>
                    <Text style={[
                      styles.formatOptionTitle,
                      exportFormat === format.key && styles.selectedFormatOptionTitle,
                    ]}>
                      {format.label}
                    </Text>
                    <Text style={styles.formatOptionDescription}>{format.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.cancelButtonText">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.exportButton]}
                onPress={async () => {
                  try {
                    const exportUrl = await analyticsEngine.exportAnalytics(exportFormat, selectedTimeRange);
                    Alert.alert('Success', `Analytics exported successfully as ${exportFormat.toUpperCase()}`);
                    setShowExportModal(false);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to export analytics');
                  }
                }}
              >
                <Text style={styles.exportButtonText">Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  timeRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
  complianceContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  complianceScoreContainer: {
    alignItems: 'center',
  },
  complianceScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  complianceScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  complianceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
    ...Shadows.small,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  metricIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  violationsContainer: {
    padding: Spacing.lg,
  },
  violationOverview: {
    marginBottom: Spacing.lg,
  },
  violationTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  violationStats: {
    alignItems: 'center',
  },
  violationStat: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  topViolationsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Text.color,
    marginBottom: Spacing.md,
  },
  violationTypeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  violationTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
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
  violationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  violationCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  violationFrequency: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  patternsContainer: {
    marginBottom: Spacing.lg,
  },
  patternCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  patternName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  patternDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  patternMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  patternFrequency: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  patternSeverity: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  patternSeverityText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  patternActions: {
    marginTop: Spacing.sm,
  },
  patternActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  patternAction: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  escalationContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  escalationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  escalationText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  collectorsContainer: {
    padding: Spacing.lg,
  },
  collectorOverview: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  collectorTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  collectorStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  collectorStat: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  riskRatingsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  riskBars: {
    marginBottom: Spacing.md,
  },
  riskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  riskLabel: {
    width: 80,
    fontSize: 14,
    color: Colors.text,
  },
  riskBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.input,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  topCollectorsContainer: {
    marginBottom: Spacing.lg,
  },
  collectorCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  collectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  collectorInfo: {
    flex: 1,
  },
  collectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  collectorAgency: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  collectorPhone: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  collectorRisk: {
    alignItems: 'flex-end',
  },
  riskScore: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  riskScoreText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  violationCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.error,
  },
  communicationStylesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  communicationStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  styleCount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  financialContainer: {
    padding: Spacing.lg,
  },
  financialOverview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  financialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  financialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  financialStat: {
    alignItems: 'center',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  financialLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  highestValueContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  highestValueCard: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  highestValueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  highestValueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  valueBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  valueBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  highestValueDetails: {
    marginTop: Spacing.sm,
  },
  valueRangeContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  valueRangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  valueRangeLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  valueRangeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  evidenceContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  evidenceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  evidenceItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    margin: Spacing.sm,
  },
  evidenceCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  evidenceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  legalContainer: {
    padding: Spacing.lg,
  },
  legalReadiness: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  legalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  readinessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  readinessText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  strongCasesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  legalCaseCard: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  caseId: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  caseComplexity: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  complexityText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  caseMetrics: {
    marginTop: Spacing.sm,
  },
  caseMetric: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  evidencePackageContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  evidenceStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  evidenceStat: {
    width: '50%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  evidenceCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  evidenceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filingReadinessContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  filingAgencies: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filingAgency: {
    alignItems: 'center',
  },
  filingAgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  filingStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  actionButtonText: {
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
  },
  timeRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTimeRangeOption: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
  },
  timeRangeOptionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  selectedTimeRangeOptionText: {
    color: Colors.primary,
    fontWeight: '600',
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
  exportButton: {
    backgroundColor: Colors.primary,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  exportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFormatOption: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
  },
  formatOptionContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  formatOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  selectedFormatOptionTitle: {
    color: Colors.primary,
  },
  formatOptionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});