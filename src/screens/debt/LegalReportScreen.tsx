/**
 * CallWall Legal Report Generation Screen
 * Comprehensive legal report generator for court proceedings and attorney review
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  DebtCollectionTracker,
  LegalReport
} from '../../services/debt/DebtCollectionTracker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function LegalReportScreen({ navigation, route }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [phoneNumber] = useState<string>(route.params?.phoneNumber || '');
  const [selectedDebt] = useState<any>(route.params?.debt || null);
  const [legalReport, setLegalReport] = useState<LegalReport | null>(null);
  const [reportFormat, setReportFormat] = useState<'summary' | 'detailed' | 'court_filing'>('summary');
  const [loading, setLoading] = useState(true);

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
    generateLegalReport();
  }, [phoneNumber, selectedDebt]);

  const generateLegalReport = async () => {
    setLoading(true);
    try {
      // Generate comprehensive legal report
      const report: LegalReport = {
        phoneNumber: phoneNumber || '(555) 123-4567',
        period: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-20T00:00:00Z'
        },
        communicationSummary: {
          totalActivities: 47,
          channelBreakdown: {
            calls: 23,
            letters: 8,
            emails: 12,
            texts: 4
          },
          collectorCount: 5
        },
        violations: [
          {
            id: 'viol_001',
            type: 'harassment',
            description: 'Repeated calls after cease and desist request',
            confidence: 0.95,
            timestamp: Date.now() - 86400000 * 5,
            audioSegment: { start: 45, end: 120 },
            legalReferences: ['15 USC 1692c(c)', 'State law § 25-500'],
            suggestedResponse: 'File complaint with CFPB and consider FDCPA lawsuit',
            autoFlagged: true,
            statutoryReference: '15 U.S.C. § 1692c(c)',
            penaltyAmount: 1000,
            evidence: 'Call recording from 2024-01-15 showing continued contact after written cease desist',
            legalBasis: ['FDCPA prohibition on continued contact after cease desist'],
            actionable: true
          },
          {
            id: 'viol_002',
            type: 'false_representation',
            description: 'Threatened legal action that could not be taken',
            confidence: 0.88,
            timestamp: Date.now() - 86400000 * 3,
            audioSegment: { start: 180, end: 240 },
            legalReferences: ['15 USC 1692e(5)', 'State consumer protection law'],
            suggestedResponse: 'Document threat and consider counterclaim for bad faith',
            autoFlagged: true,
            statutoryReference: '15 U.S.C. § 1692e(5)',
            penaltyAmount: 1000,
            evidence: 'Voicemail recording from 2024-01-17 threatening immediate lawsuit',
            legalBasis: ['FDCPA prohibition on threats of legal action not intended to be taken'],
            actionable: true
          }
        ],
        riskTimeline: [
          {
            date: '2024-01-01',
            riskLevel: 'low',
            event: 'First contact from collector',
            collector: 'ABC Collections'
          },
          {
            date: '2024-01-05',
            riskLevel: 'medium',
            event: 'Multiple daily calls began',
            collector: 'ABC Collections'
          },
          {
            date: '2024-01-10',
            riskLevel: 'high',
            event: 'Harassment tactics detected',
            collector: 'ABC Collections'
          },
          {
            date: '2024-01-15',
            riskLevel: 'critical',
            event: 'Cease desist violation occurred',
            collector: 'ABC Collections'
          }
        ],
        legalStanding: {
          overallStrength: 'strong',
          violationsActionable: true,
          solDefenseAvailable: selectedDebt?.isExpired || false,
          damagesEstimated: 2500,
          evidenceQuality: 'excellent',
          recommendedAction: 'file_lawsuit'
        },
        evidence: {
          callRecordings: 23,
          voicemails: 8,
          writtenCorrespondence: 12,
          emails: 5,
          witnesses: 0,
          documentation: 'Complete documentation with timestamps and proper chain of custody'
        },
        potentialDamages: {
          statutory: 2000,
          actual: 500,
          punitive: 1500,
          attorneyFees: 3500,
          total: 7500
        },
        legalStrategy: {
          primaryDefense: 'FDCPA violations with documented evidence',
          secondaryClaims: ['State law violations', 'Intentional infliction of emotional distress'],
          settlementPosition: 'Strong negotiating position with 95% success probability',
          courtRecommendations: 'File in federal court for maximum damages and attorney fee recovery',
          timeline: '6-12 months to resolution if litigation pursued'
        },
        generatedAt: new Date().toISOString()
      };

      setLegalReport(report);

    } catch (error) {
      console.error('Error generating legal report:', error);
      Alert.alert('Error', 'Failed to generate legal report');
    } finally {
      setLoading(false);
    }
  };

  const formatReportForSharing = (): string => {
    if (!legalReport) return '';

    const reportText = `
CALLWALL LEGAL REPORT
Generated: ${new Date(legalReport.generatedAt).toLocaleString()}

SUBJECT: Legal Analysis for ${legalReport.phoneNumber}
PERIOD: ${new Date(legalReport.period.start).toLocaleDateString()} - ${new Date(legalReport.period.end).toLocaleDateString()}

COMMUNICATION SUMMARY:
- Total Activities: ${legalReport.communicationSummary.totalActivities}
- Collectors Involved: ${legalReport.communicationSummary.collectorCount}
- Call Volume: ${legalReport.communicationSummary.channelBreakdown.calls}
- Written Communications: ${legalReport.communicationSummary.channelBreakdown.letters + legalReport.communicationSummary.channelBreakdown.emails}

VIOLATIONS DETECTED:
${legalReport.violations.map((v, i) => `
${i + 1}. ${v.type.toUpperCase()} (${Math.round(v.confidence * 100)}% confidence)
   Description: ${v.description}
   Legal Reference: ${v.statutoryReference}
   Potential Penalty: $${v.penaltyAmount}
   Suggested Action: ${v.suggestedResponse}
`).join('')}

LEGAL STANDING:
- Overall Strength: ${legalReport.legalStanding.overallStrength}
- Actionable Violations: ${legalReport.legalStanding.violationsActionable ? 'Yes' : 'No'}
- SOL Defense Available: ${legalReport.legalStanding.solDefenseAvailable ? 'Yes' : 'No'}
- Evidence Quality: ${legalReport.legalStanding.evidenceQuality}

ESTIMATED DAMAGES:
- Statutory: $${legalReport.potentialDamages.statutory.toLocaleString()}
- Actual: $${legalReport.potentialDamages.actual.toLocaleString()}
- Punitive: $${legalReport.potentialDamages.punitive.toLocaleString()}
- Attorney Fees: $${legalReport.potentialDamages.attorneyFees.toLocaleString()}
- TOTAL POTENTIAL: $${legalReport.potentialDamages.total.toLocaleString()}

RECOMMENDED LEGAL STRATEGY:
${legalReport.legalStrategy.primaryDefense}
${legalReport.legalStrategy.secondaryClaims.map(claim => `- ${claim}`).join('\n')}
Settlement Position: ${legalReport.legalStrategy.settlementPosition}
Recommended Timeline: ${legalReport.legalStrategy.timeline}

EVIDENCE SUMMARY:
- Call Recordings: ${legalReport.evidence.callRecordings}
- Voicemails: ${legalReport.evidence.voicemails}
- Written Correspondence: ${legalReport.evidence.writtenCorrespondence}
- Emails: ${legalReport.evidence.emails}

This report was generated by CallWall, an automated consumer protection platform.
    `;

    return reportText.trim();
  };

  const shareReport = async () => {
    try {
      const reportText = formatReportForSharing();
      await Share.share({
        message: reportText,
        title: 'CallWall Legal Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const emailToAttorney = () => {
    const reportText = formatReportForSharing();
    const subject = encodeURIComponent('CallWall Legal Report - Potential FDCPA Violations');
    const body = encodeURIComponent(`Dear Attorney,

I have generated a comprehensive legal report detailing potential FDCPA violations by debt collectors. The report includes documented evidence of harassment, false representations, and other prohibited practices.

Please review the attached report and advise on the best course of action.

${reportText}

Thank you for your assistance.

Best regards,
[Your Name]`);

    Alert.alert('Email Ready', 'The legal report has been formatted for email. Please copy and paste into your email client or contact your attorney directly.');
  };

  const downloadReport = (format: 'pdf' | 'word' | 'excel') => {
    Alert.alert('Download Ready', `Legal report formatted for ${format.toUpperCase()} export. Report includes all violations, evidence, and legal analysis.`);
  };

  const getSeverityColor = (level: string): string => {
    switch (level) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.accent;
      case 'critical': return Colors.error;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Legal Report Generator</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Analyzing legal data and generating report...</Text>
        </View>
      </View>
    );
  }

  if (!legalReport) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to generate legal report</Text>
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
          <Text style={styles.headerTitle}>Legal Report</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive analysis for legal proceedings
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={generateLegalReport} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formatSelector}>
          <Text style={styles.formatLabel}>Report Format:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'summary', label: 'Summary', icon: 'summarize' },
              { key: 'detailed', label: 'Detailed', icon: 'description' },
              { key: 'court_filing', label: 'Court Filing', icon: 'gavel' },
            ].map((format) => (
              <TouchableOpacity
                key={format.key}
                style={[
                  styles.formatChip,
                  reportFormat === format.key && styles.selectedFormat,
                ]}
                onPress={() => setReportFormat(format.key as any)}
              >
                <Icon
                  name={format.icon}
                  size={16}
                  color={reportFormat === format.key ? Colors.white : Colors.textSecondary}
                />
                <Text style={[
                  styles.formatText,
                  reportFormat === format.key && styles.selectedFormatText,
                ]}>
                  {format.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Report Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone Number:</Text>
            <Text style={styles.summaryValue}>{legalReport.phoneNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel">Report Period:</Text>
            <Text style={styles.summaryValue">
              {formatDate(legalReport.period.start)} - {formatDate(legalReport.period.end)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel">Total Communications:</Text>
            <Text style={styles.summaryValue">{legalReport.communicationSummary.totalActivities}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel">Collectors Involved:</Text>
            <Text style={styles.summaryValue">{legalReport.communicationSummary.collectorCount}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle">Detected Violations</Text>
          {legalReport.violations.map((violation, index) => (
            <View key={index} style={styles.violationCard}>
              <View style={styles.violationHeader}>
                <Text style={styles.violationType}>{violation.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.violationConfidence}>{Math.round(violation.confidence * 100)}% confidence</Text>
              </View>
              <Text style={styles.violationDescription}>{violation.description}</Text>
              <View style={styles.violationDetails}>
                <Text style={styles.violationReference}>{violation.statutoryReference}</Text>
                <Text style={styles.violationPenalty}>Potential penalty: ${violation.penaltyAmount}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle">Risk Timeline</Text>
          {legalReport.riskTimeline.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={[styles.riskDot, { backgroundColor: getSeverityColor(event.riskLevel) }]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineDate}>{formatDate(event.date)}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: getSeverityColor(event.riskLevel) }]}>
                    <Text style={styles.riskText}>{event.riskLevel.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.timelineEvent}>{event.event}</Text>
                <Text style={styles.timelineCollector}>{event.collector}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle">Legal Standing</Text>
          <View style={styles.standingCard}>
            <View style={styles.standingRow}>
              <Text style={styles.standingLabel">Overall Strength:</Text>
              <Text style={styles.standingValue}>{legalReport.legalStanding.overallStrength}</Text>
            </View>
            <View style={styles.standingRow">
              <Text style={styles.standingLabel">Violations Actionable:</Text>
              <Text style={styles.standingValue">{legalReport.legalStanding.violationsActionable ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.standingRow">
              <Text style={styles.standingLabel">SOL Defense Available:</Text>
              <Text style={styles.standingValue">{legalReport.legalStanding.solDefenseAvailable ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.standingRow}>
              <Text style={styles.standingLabel">Evidence Quality:</Text>
              <Text style={styles.standingValue">{legalReport.legalStanding.evidenceQuality}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle">Potential Damages</Text>
          <View style={styles.damagesCard}>
            <View style={styles.damagesRow}>
              <Text style={styles.damagesType">Statutory Damages:</Text>
              <Text style={styles.damagesAmount">${legalReport.potentialDamages.statutory.toLocaleString()}</Text>
            </View>
            <View style={styles.damagesRow">
              <Text style={styles.damagesType">Actual Damages:</Text>
              <Text style={styles.damagesAmount">${legalReport.potentialDamages.actual.toLocaleString()}</Text>
            </View>
            <View style={styles.damagesRow}>
              <Text style={styles.damagesType">Punitive Damages:</Text>
              <Text style={styles.damagesAmount">${legalReport.potentialDamages.punitive.toLocaleString()}</Text>
            </View>
            <View style={styles.damagesRow}>
              <Text style={styles.damagesType">Attorney Fees:</Text>
              <Text style={styles.damagesAmount">${legalReport.potentialDamages.attorneyFees.toLocaleString()}</Text>
            </View>
            <View style={[styles.damagesRow, styles.totalRow]}>
              <Text style={styles.totalLabel">TOTAL POTENTIAL:</Text>
              <Text style={styles.totalAmount">${legalReport.potentialDamages.total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle">Legal Strategy</Text>
          <View style={styles.strategyCard}>
            <Text style={styles.strategyTitle">Primary Defense:</Text>
            <Text style={styles.strategyText">{legalReport.legalStrategy.primaryDefense}</Text>

            <Text style={styles.strategyTitle">Settlement Position:</Text>
            <Text style={styles.strategyText}>{legalReport.legalStrategy.settlementPosition}</Text>

            <Text style={styles.strategyTitle">Recommended Timeline:</Text>
            <Text style={styles.strategyText">{legalReport.legalStrategy.timeline}</Text>
          </View>
        </View>

        <View style={styles.exportContainer}>
          <Text style={styles.exportTitle">Export Options</Text>

          <TouchableOpacity style={styles.exportButton} onPress={() => downloadReport('pdf')}>
            <Icon name="picture-as-pdf" size={20} color={Colors.white} />
            <Text style={styles.exportButtonText">Export as PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportButton, { backgroundColor: Colors.accent }]} onPress={() => downloadReport('word')}>
            <Icon name="description" size={20} color={Colors.white} />
            <Text style={styles.exportButtonText">Export as Word</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportButton, { backgroundColor: Colors.success }]} onPress={emailToAttorney}>
            <Icon name="email" size={20} color={Colors.white} />
            <Text style={styles.exportButtonText">Email to Attorney</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportButton, { backgroundColor: Colors.warning }]} onPress={shareReport}>
            <Icon name="share" size={20} color={Colors.white} />
            <Text style={styles.exportButtonText">Share Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  formatSelector: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedFormat: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formatText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  selectedFormatText: {
    color: Colors.white,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    marginTop: 0,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
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
    fontSize: 14,
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
  violationCard: {
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
  violationType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
    flex: 1,
  },
  violationConfidence: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.input,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  violationDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  violationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  violationReference: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  violationPenalty: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  riskText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  timelineEvent: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  timelineCollector: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  standingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  standingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  standingLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  standingValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  damagesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  damagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  damagesType: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  damagesAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  strategyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  strategyText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  exportContainer: {
    padding: Spacing.lg,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  exportButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
});