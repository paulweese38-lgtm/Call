/**
 * CallWall Call History and Analytics Screen
 * Comprehensive call recording management and violation analysis dashboard
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CallRecording } from '../../services/call/CallRecordingEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function CallHistoryScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [filter, setFilter] = useState<'all' | 'violations' | 'harassment' | 'legal_action'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'risk' | 'duration'>('date');
  const [stats, setStats] = useState({
    totalCalls: 0,
    violations: 0,
    harassment: 0,
    legalActions: 0,
    totalPenalties: 0,
  });

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    setRefreshing(true);
    try {
      // Mock data - in real app, fetch from database
      const mockRecordings: CallRecording[] = [
        {
          id: '1',
          phoneNumber: '(555) 123-4567',
          callerId: 'ABC Collections',
          direction: 'inbound',
          timestamp: '2024-01-15T14:30:00Z',
          duration: 180,
          audioUrl: 'https://example.com/audio1.mp3',
          transcript: 'This is a sample transcript with potential violations...',
          violationAnalysis: {
            violations: [],
            severity: 'moderate',
            legalReferences: ['15 USC 1692d'],
            evidenceMarkers: [],
            recommendedActions: [],
          },
          sentimentAnalysis: {
            overall: 'negative',
            harassment: 65,
            intimidation: 45,
            urgency: 80,
            emotionalDistress: 55,
            keywords: ['urgent', 'immediate', 'threatening'],
            toneChanges: [],
          },
          riskLevel: 'high',
          autoFlagged: true,
          collectorInfo: {
            name: 'John Smith',
            agency: 'ABC Collections',
            knownTactics: ['high pressure', 'frequent calling'],
            complaintHistory: 127,
            averageSettlementRange: { min: 500, max: 2000 },
            reputation: 'poor',
          },
        },
        {
          id: '2',
          phoneNumber: '(555) 987-6543',
          callerId: 'Legal Recovery Services',
          direction: 'outbound',
          timestamp: '2024-01-14T10:15:00Z',
          duration: 95,
          audioUrl: 'https://example.com/audio2.mp3',
          transcript: 'Clean call with no violations detected...',
          violationAnalysis: {
            violations: [],
            severity: 'none',
            legalReferences: [],
            evidenceMarkers: [],
            recommendedActions: [],
          },
          sentimentAnalysis: {
            overall: 'neutral',
            harassment: 5,
            intimidation: 10,
            urgency: 20,
            emotionalDistress: 8,
            keywords: [],
            toneChanges: [],
          },
          riskLevel: 'low',
          autoFlagged: false,
        },
      ];

      setRecordings(mockRecordings);
      updateStats(mockRecordings);
    } catch (error) {
      console.error('Error loading call history:', error);
      Alert.alert('Error', 'Unable to load call history');
    } finally {
      setRefreshing(false);
    }
  };

  const updateStats = (recordings: CallRecording[]) => {
    const stats = {
      totalCalls: recordings.length,
      violations: recordings.filter(r => r.violationAnalysis.violations.length > 0).length,
      harassment: recordings.filter(r => r.sentimentAnalysis.harassment > 50).length,
      legalActions: recordings.filter(r => r.riskLevel === 'severe').length,
      totalPenalties: recordings.reduce((sum, r) => sum + r.violationAnalysis.violations.reduce((penalty, v) => penalty + v.potentialPenalty, 0), 0),
    };

    setStats(stats);
  };

  const getFilteredRecordings = () => {
    let filtered = [...recordings];

    // Apply filter
    if (filter === 'violations') {
      filtered = filtered.filter(r => r.violationAnalysis.violations.length > 0);
    } else if (filter === 'harassment') {
      filtered = filtered.filter(r => r.sentimentAnalysis.harassment > 50);
    } else if (filter === 'legal_action') {
      filtered = filtered.filter(r => r.riskLevel === 'severe');
    }

    // Apply sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'risk') {
      const riskOrder = { 'severe': 4, 'high': 3, 'medium': 2, 'low': 1 };
      filtered.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => b.duration - a.duration);
    }

    return filtered;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'severe': return Colors.error;
      case 'high': return Colors.accent;
      case 'medium': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Icon name="phone" size={24} color={Colors.primary} />
        <Text style={styles.statValue}>{stats.totalCalls}</Text>
        <Text style={styles.statLabel}>Total Calls</Text>
      </View>

      <View style={styles.statCard}>
        <Icon name="gavel" size={24} color={Colors.error} />
        <Text style={styles.statValue}>{stats.violations}</Text>
        <Text style={styles.statLabel}>Violations</Text>
      </View>

      <View style={styles.statCard}>
        <Icon name="psychology" size={24} color={Colors.warning} />
        <Text style={styles.statValue}>{stats.harassment}</Text>
        <Text style={styles.statLabel}>Harassment</Text>
      </View>

      <View style={styles.statCard}>
        <Icon name="attach_money" size={24} color={Colors.success} />
        <Text style={styles.statValue}>${stats.totalPenalties.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Potential Penalties</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All Calls', icon: 'phone' },
          { key: 'violations', label: 'Violations', icon: 'gavel' },
          { key: 'harassment', label: 'Harassment', icon: 'psychology' },
          { key: 'legal_action', label: 'Legal Action', icon: 'balance' },
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
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'date', label: 'Date' },
            { key: 'risk', label: 'Risk' },
            { key: 'duration', label: 'Duration' },
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

  const renderCallItem = (recording: CallRecording) => (
    <TouchableOpacity
      key={recording.id}
      style={styles.callItem}
      onPress={() => navigation.navigate('CallDetails', { recording })}
    >
      <View style={styles.callHeader}>
        <View style={styles.callInfo}>
          <View style={styles.callerInfo}>
            <Icon name="call" size={16} color={Colors.textSecondary} />
            <Text style={styles.phoneNumber}>{recording.phoneNumber}</Text>
            {recording.direction === 'inbound' ? (
              <Icon name="call-received" size={16} color={Colors.success} />
            ) : (
              <Icon name="call-made" size={16} color={Colors.primary} />
            )}
          </View>

          <View style={styles.callerDetails}>
            <Text style={styles.callerName}>{recording.callerId}</Text>
            <Text style={styles.callTime}>{formatDate(recording.timestamp)}</Text>
          </View>
        </View>

        <View style={styles.callMetrics}>
          <View style={styles.duration}>
            <Icon name="schedule" size={14} color={Colors.textSecondary} />
            <Text style={styles.durationText}>{formatDuration(recording.duration)}</Text>
          </View>

          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(recording.riskLevel) }]}>
            <Text style={styles.riskText}>{recording.riskLevel.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {recording.violationAnalysis.violations.length > 0 && (
        <View style={styles.violationAlert}>
          <Icon name="warning" size={16} color={Colors.error} />
          <Text style={styles.violationText}>
            {recording.violationAnalysis.violations.length} violation(s) detected
          </Text>
          {recording.autoFlagged && (
            <View style={styles.autoFlagged}>
              <Icon name="auto-awesome" size={14} color={Colors.accent} />
              <Text style={styles.autoFlaggedText}>Auto-flagged</Text>
            </View>
          )}
        </View>
      )}

      {recording.sentimentAnalysis.harassment > 50 && (
        <View style={styles.sentimentAlert}>
          <Icon name="sentiment-very-dissatisfied" size={16} color={Colors.warning} />
          <Text style={styles.sentimentText}>
            Harassment detected ({Math.round(recording.sentimentAnalysis.harassment)}%)
          </Text>
        </View>
      )}

      {recording.collectorInfo && (
        <View style={styles.collectorInfo}>
          <Icon name="business" size={14} color={Colors.textSecondary} />
          <Text style={styles.collectorText}>
            {recording.collectorInfo.agency} • {recording.collectorInfo.complaintHistory} complaints
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Call History & Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Monitor violations and track collection activity
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCallHistory} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStats()}
        {renderFilters()}

        <View style={styles.callList}>
          {getFilteredRecordings().map(renderCallItem)}

          {getFilteredRecordings().length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="phone-locked" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No calls found</Text>
              <Text style={styles.emptyDescription}>
                {filter === 'all'
                  ? 'Start making or receiving calls to see them here'
                  : 'No calls match the current filter'
                }
              </Text>
            </View>
          )}
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filtersContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
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
  callList: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  callItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  callInfo: {
    flex: 1,
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  callerDetails: {
    marginLeft: 26, // Align with phone number
  },
  callerName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  callTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  callMetrics: {
    alignItems: 'flex-end',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  durationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
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
  autoFlagged: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  autoFlaggedText: {
    fontSize: 11,
    color: Colors.white,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  sentimentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.warning}20`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  sentimentText: {
    fontSize: 13,
    color: Colors.warning,
    marginLeft: Spacing.sm,
  },
  collectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  collectorText: {
    fontSize: 12,
    color: Colors.textSecondary,
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