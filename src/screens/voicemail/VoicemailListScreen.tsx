import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import VoicemailIntelligenceEngine, { VoicemailMessage } from '../../services/voicemail/VoicemailIntelligenceEngine';
import VoicemailIntelligenceInterface from '../../components/voicemail/VoicemailIntelligenceInterface';

export default function VoicemailListScreen({ navigation }: any) {
  const { user } = useAuthStore();

  const [voicemails, setVoicemails] = useState<VoicemailMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoicemail, setSelectedVoicemail] = useState<VoicemailMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'violations' | 'harassment' | 'scam' | 'collection'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'urgency' | 'violations'>('date');

  const voicemailEngine = new VoicemailIntelligenceEngine();

  const isFeatureLocked = user?.subscription_tier === 'free';

  useEffect(() => {
    loadVoicemails();
  }, []);

  const loadVoicemails = async () => {
    setRefreshing(true);
    try {
      // Mock data - in real app, fetch from database
      const mockVoicemails: VoicemailMessage[] = [
        {
          id: '1',
          phoneNumber: '(555) 123-4567',
          callerId: 'ABC Collections',
          timestamp: '2024-01-15T14:30:00Z',
          duration: 45,
          audioUrl: 'https://example.com/audio1.mp3',
          transcript: 'This is John from ABC Collections calling regarding your account. We need to discuss an urgent matter regarding your balance of $2,457. Please return our call immediately to avoid further action.',
          sentiment: 'negative',
          urgency: 'high',
          violationAnalysis: {
            violations: [
              {
                type: 'threat_language',
                description: 'Collector threatened legal action without proper disclosure',
                confidence: 0.85,
                timestamp: 25,
                audioSegment: { start: 20, end: 30 },
                legalReferences: ['FDCPA § 807(5)', '15 USC 1692e(5)'],
                suggestedResponse: 'Your threatening language violates FDCPA. Cease all communication.',
                autoFlagged: true,
              }
            ],
            severity: 'major',
            fdcpaViolations: [],
            stateViolations: [],
            harassmentIndicators: ['repeated calls', 'urgent tone'],
            threatIndicators: ['further action'],
            deceptionIndicators: [],
            evidenceMarkers: [],
            legalConfidence: 0.85,
          },
          intelligence: {
            callerIdentification: {
              confidence: 0.92,
              agency: 'ABC Collections',
              collectorId: 'john_smith_abc',
              knownTactics: ['high pressure', 'threatening language'],
              complaintHistory: 47,
              reputation: 'poor',
            },
            contentAnalysis: {
              purpose: 'debt_collection',
              urgencyLevel: 80,
              emotionalTone: 'intimidating',
              deceptionScore: 25,
              pressureTactics: ['urgency', 'threats'],
              keyInformation: {
                debtAmount: 2457,
                threats: ['further action'],
                demands: ['immediate call back'],
              },
            },
            legalAssessment: {
              actionableViolations: true,
              potentialDamages: 1000,
              recommendedLegalAction: 'sue',
              evidenceStrength: 'strong',
              timeSensitivity: 75,
            },
            behavioralInsights: {
              callerTactics: ['high pressure', 'threatening'],
              escalationRisk: 85,
              likelihoodOfContact: 90,
              bestResponseStrategy: 'cease and desist',
              recommendedTiming: 'immediate',
            },
          },
          autoProcessed: true,
          category: 'collection',
          actionable: true,
          recommendedActions: [
            'File FDCPA violation complaint',
            'Document the threat',
            'Consider legal action',
            'Block the number',
          ],
        },
        {
          id: '2',
          phoneNumber: '(555) 987-6543',
          callerId: 'IRS Scam Alert',
          timestamp: '2024-01-14T09:15:00Z',
          duration: 62,
          audioUrl: 'https://example.com/audio2.mp3',
          transcript: 'This is an urgent message from the IRS. We have detected suspicious activity on your account. You must call us immediately at 1-800-SCAM to resolve this issue or face legal consequences.',
          sentiment: 'negative',
          urgency: 'critical',
          violationAnalysis: {
            violations: [],
            severity: 'none',
            fdcpaViolations: [],
            stateViolations: [],
            harassmentIndicators: ['fake identity'],
            threatIndicators: ['fake legal threats'],
            deceptionIndicators: ['impersonating government', 'fake urgency'],
            evidenceMarkers: [],
            legalConfidence: 0.95,
          },
          intelligence: {
            callerIdentification: {
              confidence: 0.98,
              agency: 'IRS Impersonation Scam',
              knownTactics: ['impersonation', 'fake threats', 'urgency'],
              complaintHistory: 0,
              reputation: 'terrible',
            },
            contentAnalysis: {
              purpose: 'scam',
              urgencyLevel: 95,
              emotionalTone: 'authoritative',
              deceptionScore: 90,
              pressureTactics: ['fake authority', 'urgency'],
              keyInformation: {
                threats: ['legal consequences'],
                demands: ['immediate callback'],
              },
            },
            legalAssessment: {
              actionableViolations: true,
              potentialDamages: 0,
              recommendedLegalAction: 'report',
              evidenceStrength: 'overwhelming',
              timeSensitivity: 95,
            },
            behavioralInsights: {
              callerTactics: ['impersonation', 'high pressure'],
              escalationRisk: 10,
              likelihoodOfContact: 5,
              bestResponseStrategy: 'report to authorities',
              recommendedTiming: 'immediate',
            },
          },
          autoProcessed: true,
          category: 'scam',
          actionable: true,
          recommendedActions: [
            'Report to FTC',
            'Block and report number',
            'Monitor accounts for fraud',
            'Inform family members',
          ],
        },
      ];

      setVoicemails(mockVoicemails);
    } catch (error) {
      console.error('Error loading voicemails:', error);
      Alert.alert('Error', 'Unable to load voicemail messages');
    } finally {
      setRefreshing(false);
    }
  };

  const handleVoicemailPress = (voicemail: VoicemailMessage) => {
    setSelectedVoicemail(voicemail);
  };

  const handleAction = (action: string, voicemail: VoicemailMessage) => {
    Alert.alert(
      'Action Taken',
      `You selected: ${action}`,
      [
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const getFilteredVoicemails = () => {
    let filtered = [...voicemails];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(v => {
        switch (filter) {
          case 'violations':
            return v.violationAnalysis.violations.length > 0;
          case 'harassment':
            return v.category === 'harassment';
          case 'scam':
            return v.category === 'scam';
          case 'collection':
            return v.category === 'collection';
          default:
            return true;
        }
      });
    }

    // Apply sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'urgency') {
      const urgencyOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      filtered.sort((a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency]);
    } else if (sortBy === 'violations') {
      filtered.sort((a, b) => b.violationAnalysis.violations.length - a.violationAnalysis.violations.length);
    }

    return filtered;
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

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'scam': return Colors.error;
      case 'harassment': return Colors.accent;
      case 'collection': return Colors.warning;
      case 'legal_notice': return Colors.primary;
      case 'marketing': return Colors.success;
      default: return Colors.textSecondary;
    }
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All', icon: 'inbox' },
          { key: 'violations', label: 'Violations', icon: 'gavel' },
          { key: 'scam', label: 'Scams', icon: 'warning' },
          { key: 'collection', label: 'Collection', icon: 'account_balance' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              filter === f.key && styles.selectedFilter,
            ]}
            onPress={() => setFilter(f.key as any)}
          >
            <Icon
              name={f.icon}
              size={16}
              color={filter === f.key ? Colors.white : Colors.textSecondary}
            />
            <Text style={[
              styles.filterText,
              filter === f.key && styles.selectedFilterText,
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'date', label: 'Recent' },
            { key: 'urgency', label: 'Urgent' },
            { key: 'violations', label: 'Most Violations' },
          ].map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.sortChip,
                sortBy === s.key && styles.selectedSort,
              ]}
              onPress={() => setSortBy(s.key as any)}
            >
              <Text style={[
                styles.sortText,
                sortBy === s.key && styles.selectedSortText,
              ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderVoicemailItem = (voicemail: VoicemailMessage) => (
    <TouchableOpacity
      key={voicemail.id}
      style={styles.voicemailItem}
      onPress={() => handleVoicemailPress(voicemail)}
    >
      <View style={styles.voicemailHeader}>
        <View style={styles.callerInfo}>
          <Icon name="voicemail" size={20} color={Colors.accent} />
          <Text style={styles.callerName}>{voicemail.callerId}</Text>
          <Text style={styles.phoneNumber}>{voicemail.phoneNumber}</Text>
        </View>

        <View style={styles.voicemailMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(voicemail.category) }]}>
            <Text style={styles.categoryText}>{voicemail.category.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(voicemail.urgency) }]}>
            <Text style={styles.urgencyText}>{voicemail.urgency.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.voicemailDetails}>
        <Text style={styles.timestamp}>{formatDate(voicemail.timestamp)}</Text>
        <Text style={styles.duration}>{formatDuration(voicemail.duration)}</Text>
        {voicemail.violationAnalysis.violations.length > 0 && (
          <View style={styles.violationIndicator}>
            <Icon name="warning" size={14} color={Colors.error} />
            <Text style={styles.violationCount}>
              {voicemail.violationAnalysis.violations.length} violation(s)
            </Text>
          </View>
        )}
      </View>

      {voicemail.transcript && (
        <View style={styles.transcriptPreview}>
          <Text style={styles.transcriptText} numberOfLines={2}>
            {voicemail.transcript}
          </Text>
        </View>
      )}

      {voicemail.actionable && voicemail.recommendedActions.length > 0 && (
        <View style={styles.actionableIndicator}>
          <Icon name="play-arrow" size={14} color={Colors.accent} />
          <Text style={styles.actionableText}>
            {voicemail.recommendedActions.length} action(s) recommended
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isFeatureLocked) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <Text style={styles.headerTitle}>Voicemail Intelligence</Text>
          <Text style={styles.headerSubtitle}>
            AI-powered transcription and sentiment analysis
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.lockedContainer}>
            <Icon name="lock" size={64} color={Colors.textMuted} />
            <Text style={styles.lockedTitle}>Premium Feature</Text>
            <Text style={styles.lockedDescription}>
              Voicemail Intelligence is available with our Premium and Business subscriptions.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Voicemail Intelligence</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered transcription and violation detection
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadVoicemails} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderFilters()}

        <View style={styles.voicemailList}>
          {getFilteredVoicemails().map(renderVoicemailItem)}

          {getFilteredVoicemails().length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="voicemail" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No voicemails found</Text>
              <Text style={styles.emptyDescription}>
                {filter === 'all'
                  ? 'Your voicemail messages will appear here'
                  : 'No voicemails match the current filter'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {selectedVoicemail && (
        <VoicemailIntelligenceInterface
          visible={!!selectedVoicemail}
          voicemail={selectedVoicemail}
          onClose={() => setSelectedVoicemail(null)}
          onTakeAction={handleAction}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  lockedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Voicemail Intelligence styles
  content: {
    flex: 1,
  },
  filtersContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filterChip: {
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
  selectedFilter: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  selectedFilterText: {
    color: Colors.white,
    fontWeight: '500',
  },
  sortContainer: {
    marginTop: Spacing.md,
  },
  sortLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedSort: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedSortText: {
    color: Colors.white,
    fontWeight: '500',
  },
  voicemailList: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  voicemailItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  voicemailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  callerInfo: {
    flex: 1,
  },
  callerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  phoneNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 26, // Align with caller name
  },
  voicemailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  urgencyText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  voicemailDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  duration: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  violationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  violationCount: {
    fontSize: 12,
    color: Colors.error,
    marginLeft: Spacing.xs,
  },
  transcriptPreview: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  transcriptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 18,
  },
  actionableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent}20`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  actionableText: {
    fontSize: 12,
    color: Colors.accent,
    marginLeft: Spacing.sm,
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
});