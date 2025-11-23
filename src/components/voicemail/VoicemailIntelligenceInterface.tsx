/**
 * CallWall Voicemail Intelligence Interface
 * Advanced voicemail analysis and violation detection interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Linking,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VoicemailMessage } from '../../services/voicemail/VoicemailIntelligenceEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface VoicemailIntelligenceInterfaceProps {
  visible: boolean;
  voicemail: VoicemailMessage;
  onClose: () => void;
  onTakeAction?: (action: string, voicemail: VoicemailMessage) => void;
}

export default function VoicemailIntelligenceInterface({
  visible,
  voicemail,
  onClose,
  onTakeAction,
}: VoicemailIntelligenceInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'transcript' | 'evidence'>('analysis');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const slideAnimation = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleActionPress = (action: string) => {
    Vibration.vibrate(50);
    setSelectedAction(action);

    Alert.alert(
      'Take Action',
      `Do you want to ${action.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedAction(null) },
        {
          text: 'Yes',
          onPress: () => {
            onTakeAction?.(action, voicemail);
            setSelectedAction(null);
          },
        },
      ]
    );
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return Colors.error;
      case 'high': return Colors.accent;
      case 'medium': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'severe': return Colors.error;
      case 'major': return Colors.accent;
      case 'moderate': return Colors.warning;
      case 'minor': return Colors.warning;
      case 'none': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Voicemail Intelligence</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.voicemailInfo}>
            <View style={styles.callerInfo}>
              <Icon name="voicemail" size={20} color={Colors.white} />
              <Text style={styles.callerName}>{voicemail.callerId}</Text>
            </View>
            <Text style={styles.phoneNumber}>{voicemail.phoneNumber}</Text>
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>{formatDate(voicemail.timestamp)}</Text>
              <Text style={styles.metadataText}>•</Text>
              <Text style={styles.metadataText}>{formatDuration(voicemail.duration)}</Text>
              <View style={[styles.urgencyIndicator, { backgroundColor: getUrgencyColor(voicemail.urgency) }]}>
                <Text style={styles.urgencyText}>{voicemail.urgency.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      {[
        { key: 'analysis', label: 'Analysis', icon: 'psychology' },
        { key: 'transcript', label: 'Transcript', icon: 'description' },
        { key: 'evidence', label: 'Evidence', icon: 'gavel' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={activeTab === tab.key ? Colors.accent : Colors.textSecondary}
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
  );

  const renderAnalysisTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Icon name="analytics" size={24} color={Colors.accent} />
          <Text style={styles.summaryTitle}>AI Analysis Summary</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{voicemail.violationAnalysis.violations.length}</Text>
            <Text style={styles.summaryLabel}>Violations</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: getSeverityColor(voicemail.violationAnalysis.severity) }]}>
              {voicemail.violationAnalysis.severity.toUpperCase()}
            </Text>
            <Text style={styles.summaryLabel}>Severity</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: getUrgencyColor(voicemail.urgency) }]}>
              {voicemail.urgency.toUpperCase()}
            </Text>
            <Text style={styles.summaryLabel}>Urgency</Text>
          </View>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(voicemail.category) }]}>
          <Icon name="label" size={16} color={Colors.white} />
          <Text style={styles.categoryText}>{voicemail.category.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {/* Violation Analysis */}
      {voicemail.violationAnalysis.violations.length > 0 && (
        <View style={styles.violationsCard}>
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={() => setExpandedSection(expandedSection === 'violations' ? null : 'violations')}
          >
            <Icon name="warning" size={24} color={Colors.error} />
            <Text style={styles.sectionTitle}>Violations Detected</Text>
            <Icon
              name={expandedSection === 'violations' ? 'expand-less' : 'expand-more'}
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'violations' && (
            <View style={styles.violationsList}>
              {voicemail.violationAnalysis.violations.map((violation, index) => (
                <View key={index} style={styles.violationItem}>
                  <View style={styles.violationHeader}>
                    <Text style={styles.violationType}>{violation.type}</Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {Math.round(violation.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.violationDescription}>{violation.description}</Text>
                  {violation.legalReferences.length > 0 && (
                    <View style={styles.legalReferences}>
                      <Text style={styles.legalRefLabel}>Legal Basis:</Text>
                      {violation.legalReferences.map((ref, idx) => (
                        <Text key={idx} style={styles.legalRefText}>• {ref}</Text>
                      ))}
                    </View>
                  )}
                  {violation.suggestedResponse && (
                    <View style={styles.suggestedResponse}>
                      <Text style={styles.responseLabel}>Suggested Response:</Text>
                      <Text style={styles.responseText}>{violation.suggestedResponse}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Intelligence Insights */}
      <View style={styles.intelligenceCard}>
        <TouchableOpacity
          style={styles.expandableHeader}
          onPress={() => setExpandedSection(expandedSection === 'intelligence' ? null : 'intelligence')}
        >
          <Icon name="psychology" size={24} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Intelligence Insights</Text>
          <Icon
            name={expandedSection === 'intelligence' ? 'expand-less' : 'expand-more'}
            size={24}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        {expandedSection === 'intelligence' && (
          <View style={styles.intelligenceContent}>
            {voicemail.intelligence.callerIdentification.confidence > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightTitle}>Caller Identification</Text>
                <View style={styles.insightRow}>
                  <Text style={styles.insightLabel}>Agency:</Text>
                  <Text style={styles.insightValue}>
                    {voicemail.intelligence.callerIdentification.agency || 'Unknown'}
                  </Text>
                </View>
                {voicemail.intelligence.callerIdentification.complaintHistory > 0 && (
                  <View style={styles.insightRow}>
                    <Text style={styles.insightLabel}>Complaints:</Text>
                    <Text style={styles.insightValue}>
                      {voicemail.intelligence.callerIdentification.complaintHistory} filed
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.insightSection}>
              <Text style={styles.insightTitle}>Content Analysis</Text>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Purpose:</Text>
                <Text style={styles.insightValue}>
                  {voicemail.intelligence.contentAnalysis.purpose.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Emotional Tone:</Text>
                <Text style={styles.insightValue}>
                  {voicemail.intelligence.contentAnalysis.emotionalTone}
                </Text>
              </View>
            </View>

            <View style={styles.insightSection}>
              <Text style={styles.insightTitle}>Legal Assessment</Text>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Recommended Action:</Text>
                <Text style={[styles.insightValue, { color: Colors.accent }]}>
                  {voicemail.intelligence.legalAssessment.recommendedLegalAction.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Evidence Strength:</Text>
                <Text style={styles.insightValue}>
                  {voicemail.intelligence.legalAssessment.evidenceStrength}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Recommended Actions */}
      {voicemail.recommendedActions.length > 0 && (
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>
          {voicemail.recommendedActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionItem,
                selectedAction === action && styles.selectedAction,
              ]}
              onPress={() => handleActionPress(action)}
            >
              <Icon name="arrow-forward" size={20} color={Colors.accent} />
              <Text style={styles.actionText}>{action}</Text>
              <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderTranscriptTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.transcriptCard}>
        <View style={styles.transcriptHeader}>
          <Icon name="description" size={24} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Full Transcript</Text>
        </View>
        <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.transcriptText}>{voicemail.transcript}</Text>
        </ScrollView>
      </View>

      {/* Audio Player */}
      <View style={styles.audioCard}>
        <View style={styles.audioHeader}>
          <Icon name="music-note" size={24} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Original Audio</Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Icon name="play-arrow" size={32} color={Colors.white} />
          <Text style={styles.playButtonText}>Play Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEvidenceTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.evidenceCard}>
        <View style={styles.evidenceHeader}>
          <Icon name="gavel" size={24} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Legal Evidence</Text>
        </View>

        {voicemail.violationAnalysis.evidenceMarkers.length > 0 ? (
          <View style={styles.evidenceList}>
            {voicemail.violationAnalysis.evidenceMarkers.map((marker, index) => (
              <View key={index} style={styles.evidenceItem}>
                <View style={styles.evidenceTypeBadge}>
                  <Text style={styles.evidenceTypeText}>
                    {marker.type.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.evidenceText}>{marker.text}</Text>
                <View style={styles.evidenceMeta}>
                  <Text style={styles.evidenceTime}>
                    Timestamp: {marker.timestamp}s
                  </Text>
                  <View style={styles.confidenceBar}>
                    <Text style={styles.evidenceConfidence}>
                      {Math.round(marker.confidence * 100)}% confidence
                    </Text>
                  </View>
                </View>
                {marker.legalRelevance && (
                  <View style={styles.legalRelevance}>
                    <Text style={styles.legalRelevanceLabel}>Legal Relevance:</Text>
                    <Text style={styles.legalRelevanceText}>{marker.legalRelevance}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noEvidence}>
            <Icon name="info" size={48} color={Colors.textSecondary} />
            <Text style={styles.noEvidenceTitle}>No Specific Evidence</Text>
            <Text style={styles.noEvidenceDescription}>
              This voicemail doesn't contain clear legal evidence markers
            </Text>
          </View>
        )}
      </View>

      {/* FDCPA Violations */}
      {voicemail.violationAnalysis.fdcpaViolations.length > 0 && (
        <View style={styles.fdcpaCard}>
          <View style={styles.fdcpaHeader}>
            <Icon name="balance" size={24} color={Colors.error} />
            <Text style={styles.sectionTitle}>FDCPA Violations</Text>
          </View>
          {voicemail.violationAnalysis.fdcpaViolations.map((violation, index) => (
            <View key={index} style={styles.fdcpaItem}>
              <View style={styles.fdcpaSection}>
                <Text style={styles.fdcpaSectionText}>{violation.section}</Text>
              </View>
              <Text style={styles.fdcpaTitle}>{violation.title}</Text>
              <Text style={styles.fdcpaViolation}>{violation.violation}</Text>
              <View style={styles.fdcpaPenalty}>
                <Text style={styles.fdcpaPenaltyLabel}>Potential Penalty:</Text>
                <Text style={styles.fdcpaPenaltyAmount}>${violation.penalty.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'harassment': return Colors.error;
      case 'legal_notice': return Colors.accent;
      case 'scam': return Colors.warning;
      case 'collection': return Colors.primary;
      case 'marketing': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [300, 0]
            }) }],
          }
        ]}
      >
        {renderHeader()}
        {renderTabSelector()}

        <View style={styles.content}>
          {activeTab === 'analysis' && renderAnalysisTab()}
          {activeTab === 'transcript' && renderTranscriptTab()}
          {activeTab === 'evidence' && renderEvidenceTab()}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  voicemailInfo: {
    alignItems: 'center',
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  callerName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  phoneNumber: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.sm,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  metadataText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: Spacing.xs,
  },
  urgencyIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  urgencyText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  activeTabText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  // Analysis Tab Styles
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },

  // Violations Card
  violationsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  violationsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  violationItem: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  violationType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  confidenceBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  violationDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  legalReferences: {
    marginBottom: Spacing.sm,
  },
  legalRefLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  legalRefText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestedResponse: {
    backgroundColor: `${Colors.accent}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  responseText: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: 'italic',
  },

  // Intelligence Card
  intelligenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  intelligenceContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  insightSection: {
    marginBottom: Spacing.lg,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  insightLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  insightValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },

  // Actions Card
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  selectedAction: {
    backgroundColor: `${Colors.accent}20`,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },

  // Transcript Tab Styles
  transcriptCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  transcriptScroll: {
    maxHeight: 200,
  },
  transcriptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  audioCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },

  // Evidence Tab Styles
  evidenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  evidenceList: {},
  evidenceItem: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  evidenceTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  evidenceTypeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  evidenceText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  evidenceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  evidenceTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  evidenceConfidence: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  legalRelevance: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  legalRelevanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  legalRelevanceText: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: 'italic',
  },
  noEvidence: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noEvidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noEvidenceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // FDCPA Card
  fdcpaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  fdcpaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  fdcpaItem: {
    backgroundColor: `${Colors.error}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  fdcpaSection: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  fdcpaSectionText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  fdcpaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  fdcpaViolation: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  fdcpaPenalty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fdcpaPenaltyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fdcpaPenaltyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
});