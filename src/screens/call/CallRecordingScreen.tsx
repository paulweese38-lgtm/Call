/**
 * CallWall Call Recording Screen
 * Real-time call recording with AI-powered violation detection and emergency alerts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Switch,
  Animated,
  Vibration,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  EnhancedCallRecordingEngine,
  CallRecording,
  CallRecordingConfig,
  ViolationDetection,
  CallAnalytics
} from '../../services/call/EnhancedCallRecordingEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function CallRecordingScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [recordingStatus, setRecordingStatus] = useState<{
    isRecording: boolean;
    currentCall: CallRecording | null;
  }>({ isRecording: false, currentCall: null });
  const [config, setConfig] = useState<CallRecordingConfig>();
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);
  const [selectedViolations, setSelectedViolations] = useState<ViolationDetection | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const recordingEngineRef = useRef<EnhancedCallRecordingEngine | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeRecordingEngine();
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recordingStatus.isRecording) {
      startPulseAnimation();
      startRecordingTimer();
    } else {
      stopPulseAnimation();
      stopRecordingTimer();
    }
  }, [recordingStatus.isRecording]);

  const initializeRecordingEngine = async () => {
    try {
      const defaultConfig: CallRecordingConfig = {
        enabled: true,
        autoRecord: true,
        recordAllNumbers: false,
        whitelistedNumbers: [],
        blacklistedNumbers: [],
        recordingQuality: 'high',
        storageLocation: 'hybrid',
        retentionDays: 365,
        realTimeAnalysis: true,
        violationAlerts: true,
        emergencyAlerts: true,
        transcription: true,
        complianceMode: 'enhanced',
        privacySettings: {
          encryption: true,
          anonymization: false,
          dataRetention: 365,
          sharing: false
        },
        notificationSettings: {
          sms: false,
          email: false,
          push: true,
          attorneyAlert: false
        }
      };

      recordingEngineRef.current = new EnhancedCallRecordingEngine(defaultConfig);
      setConfig(defaultConfig);

      await loadRecordings();
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to initialize recording engine:', error);
      Alert.alert('Error', 'Failed to initialize call recording');
    }
  };

  const loadRecordings = async () => {
    try {
      if (!recordingEngineRef.current) return;

      const recordingsData = await recordingEngineRef.current.getRecordings();
      setRecordings(recordingsData.reverse()); // Most recent first
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      if (!recordingEngineRef.current) return;

      const analyticsData = await recordingEngineRef.current.getCallAnalytics('month');
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const requestRecordingPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        ]);

        return Object.values(granted).every(result => result === PermissionsAndroid.RESULTS.GRANTED);
      }
      return true; // iOS permissions handled via Info.plist
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermissions = await requestRecordingPermissions();
      if (!hasPermissions) {
        Alert.alert('Permissions Required', 'Please grant recording permissions to continue.');
        return;
      }

      // Mock phone number for demo
      const phoneNumber = '(555) 123-4567';
      const callId = await recordingEngineRef.current?.startRecording(phoneNumber);

      if (callId) {
        setRecordingStatus({
          isRecording: true,
          currentCall: {
            id: callId,
            phoneNumber,
            direction: 'inbound',
            timestamp: new Date().toISOString(),
            duration: 0,
            status: 'recording',
            fileSize: 0,
            format: 'mp3',
            quality: 'high',
            metadata: {
              deviceType: 'mobile',
              networkType: 'cellular',
              recordingQuality: 90
            }
          }
        });

        // Vibrate to indicate recording started
        Vibration.vibrate(100);

        Alert.alert('Recording Started', 'Call recording is now active. You will be alerted of any violations.');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingEngineRef.current || !recordingStatus.isRecording) return;

      // Vibrate to indicate recording stopped
      Vibration.vibrate(200);

      const completedCall = await recordingEngineRef.current.stopRecording();

      setRecordingStatus({
        isRecording: false,
        currentCall: null
      });

      // Check for violations in the completed call
      if (completedCall) {
        const violations = await recordingEngineRef.current.getViolationDetection(completedCall.id);
        if (violations && violations.violations.length > 0) {
          // Show violation summary
          Alert.alert(
            'Recording Completed with Violations',
            `${violations.violations.length} violation(s) detected. Review the recording for details.`,
            [
              { text: 'OK', style: 'default' },
              { text: 'View Violations', onPress: () => showRecordingViolations(completedCall, violations) }
            ]
          );
        } else {
          Alert.alert('Recording Completed', 'No violations detected in this call.');
        }

        // Refresh recordings list
        await loadRecordings();
        await loadAnalytics();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const showRecordingViolations = (recording: CallRecording, violations: ViolationDetection) => {
    setSelectedRecording(recording);
    setSelectedViolations(violations);
    setShowViolationsModal(true);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    Animated.timing(pulseAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).stop();
  };

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatusColor = (status: string): string => {
    switch (status) {
      case 'recording': return Colors.error;
      case 'completed': return Colors.success;
      case 'processing': return Colors.warning;
      case 'analyzed': return Colors.primary;
      case 'error': return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'none': return Colors.success;
      case 'low': return Colors.textSecondary;
      case 'medium': return Colors.warning;
      case 'high': return Colors.accent;
      case 'critical': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const renderRecordingControls = () => (
    <View style={styles.recordingControls}>
      <Animated.View
        style={[
          styles.recordingButton,
          {
            backgroundColor: recordingStatus.isRecording ? Colors.error : Colors.primary,
            transform: [{ scale: pulseAnimation }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.recordingButtonInner}
          onPress={recordingStatus.isRecording ? stopRecording : startRecording}
          disabled={!config?.enabled}
        >
          <Icon
            name={recordingStatus.isRecording ? 'stop' : 'mic'}
            size={32}
            color={Colors.white}
          />
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.recordingStatusText}>
        {recordingStatus.isRecording
          ? `Recording: ${formatRecordingTime(recordingTime)}`
          : config?.enabled ? 'Ready to Record' : 'Recording Disabled'}
      </Text>

      {recordingStatus.currentCall && (
        <View style={styles.currentCallInfo}>
          <Text style={styles.currentCallNumber}>{recordingStatus.currentCall.phoneNumber}</Text>
          <Text style={styles.currentCallDirection">
            {recordingStatus.currentCall.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call
          </Text>
        </View>
      )}
    </View>
  );

  const renderAnalyticsOverview = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Text style={styles.sectionTitle}>Call Analytics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.totalCalls}</Text>
            <Text style={styles.statLabel">Total Calls</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue">{analytics.recordedCalls}</Text>
            <Text style={styles.statLabel">Recorded</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue">{analytics.violationsDetected}</Text>
            <Text style={styles.statLabel">Violations</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue">{Math.round(analytics.averageCallDuration / 60)}m</Text>
            <Text style={styles.statLabel">Avg Duration</Text>
          </View>
        </View>

        <View style={styles.complianceMetrics}>
          <Text style={styles.complianceTitle">Compliance Score</Text>
          <View style={styles.complianceScore}>
            <Text style={[
              styles.complianceValue,
              { color: getSeverityColor(analytics.complianceMetrics.legalRiskScore > 50 ? 'high' : 'medium') }
            ]}>
              {100 - analytics.complianceMetrics.legalRiskScore}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecordingItem = (recording: CallRecording) => (
    <TouchableOpacity
      key={recording.id}
      style={styles.recordingItem}
      onPress={() => {
        setSelectedRecording(recording);
        // Navigate to recording details
        navigation.navigate('RecordingDetails', { recording });
      }}
    >
      <View style={styles.recordingHeader}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingPhoneNumber}>{recording.phoneNumber}</Text>
          <Text style={styles.recordingDate}>
            {new Date(recording.timestamp).toLocaleString()}
          </Text>
          <View style={styles.recordingMeta}>
            <Text style={styles.recordingDuration}>
              {formatRecordingTime(recording.duration)}
            </Text>
            <Text style={styles.recordingSize}>
              {(recording.fileSize / 1024 / 1024).toFixed(1)} MB
            </Text>
          </View>
        </View>

        <View style={styles.recordingStatusContainer}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getRecordingStatusColor(recording.status) }
          ]} />
          <Text style={[
            styles.statusText,
            { color: getRecordingStatusColor(recording.status) }
          ]}>
            {recording.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.recordingActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="play-arrow" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="text-snippet" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="delete" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {recording.metadata.emotionalImpact && recording.metadata.emotionalImpact > 70 && (
        <View style={styles.highRiskBanner}>
          <Icon name="warning" size={16} color={Colors.error} />
          <Text style={styles.highRiskText">High emotional impact detected</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderConfigModal = () => (
    <Modal
      visible={showConfigModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowConfigModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle">Recording Settings</Text>
            <TouchableOpacity onPress={() => setShowConfigModal(false)}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel">Enable Recording</Text>
              <Switch
                value={config?.enabled}
                onValueChange={(value) => {
                  if (config) {
                    setConfig({ ...config, enabled: value });
                    recordingEngineRef.current?.updateConfig({ enabled: value });
                  }
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel">Auto-Record All Calls</Text>
              <Switch
                value={config?.autoRecord}
                onValueChange={(value) => {
                  if (config) {
                    setConfig({ ...config, autoRecord: value });
                    recordingEngineRef.current?.updateConfig({ autoRecord: value });
                  }
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel">Real-Time Analysis</Text>
              <Switch
                value={config?.realTimeAnalysis}
                onValueChange={(value) => {
                  if (config) {
                    setConfig({ ...config, realTimeAnalysis: value });
                    recordingEngineRef.current?.updateConfig({ realTimeAnalysis: value });
                  }
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel">Violation Alerts</Text>
              <Switch
                value={config?.violationAlerts}
                onValueChange={(value) => {
                  if (config) {
                    setConfig({ ...config, violationAlerts: value });
                    recordingEngineRef.current?.updateConfig({ violationAlerts: value });
                  }
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel">Emergency Alerts</Text>
              <Switch
                value={config?.emergencyAlerts}
                onValueChange={(value) => {
                  if (config) {
                    setConfig({ ...config, emergencyAlerts: value });
                    recordingEngineRef.current?.updateConfig({ emergencyAlerts: value });
                  }
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel">Enable Transcription</Text>
              <Switch
                value={config?.transcription}
                onValueChange={(value) => {
                  if (config) {
                    setConfig({ ...config, transcription: value });
                    recordingEngineRef.current?.updateConfig({ transcription: value });
                  }
                }}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowConfigModal(false)}
            >
              <Text style={styles.cancelButtonText">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => setShowConfigModal(false)}
            >
              <Text style={styles.saveButtonText">Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderViolationsModal = () => {
    if (!selectedViolations || !selectedRecording) return null;

    return (
      <Modal
        visible={showViolationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViolationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle">Violations Detected</Text>
              <TouchableOpacity onPress={() => setShowViolationsModal(false)}>
                <Icon name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.violationSummary}>
                <Text style={styles.violationSummaryTitle">
                  {selectedViolations.violations.length} Violation(s) Detected
                </Text>
                <Text style={styles.violationSummaryDate}>
                  {new Date(selectedRecording.timestamp).toLocaleString()}
                </Text>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(selectedViolations.severity) }
                ]}>
                  <Text style={styles.severityBadgeText">
                    {selectedViolations.severity.toUpperCase()}
                  </Text>
                </View>
              </View>

              {selectedViolations.violations.map((violation, index) => (
                <View key={index} style={styles.violationItem}>
                  <View style={styles.violationHeader}>
                    <Text style={styles.violationType}>
                      {violation.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <View style={[
                      styles.severityIndicator,
                      { backgroundColor: getSeverityColor(violation.severity) }
                    ]}>
                      <Text style={styles.severityText">
                        {violation.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.violationSubtype}>{violation.subtype}</Text>
                  <Text style={styles.violationDescription}>{violation.transcript}</Text>

                  <View style={styles.violationDetails}>
                    <Text style={styles.violationConfidence}>
                      Confidence: {violation.confidence}%
                    </Text>
                    <Text style={styles.violationTimestamp}>
                      {formatRecordingTime(Math.floor(violation.audioSegment.start))} -
                      {formatRecordingTime(Math.floor(violation.audioSegment.end))}
                    </Text>
                  </View>

                  <View style={styles.legalReferences}>
                    <Text style={styles.legalTitle">Legal Basis:</Text>
                    {violation.legalBasis.map((ref, refIndex) => (
                      <Text key={refIndex} style={styles.legalReference}>• {ref}</Text>
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.recommendedActions}>
                <Text style={styles.actionsTitle">Recommended Actions:</Text>
                {selectedViolations.recommendedActions.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <Icon name="arrow-right" size={16} color={Colors.primary} />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowViolationsModal(false);
                  navigation.navigate('LegalReport', { phoneNumber: selectedRecording.phoneNumber });
                }}
              >
                <Text style={styles.primaryButtonText">Generate Legal Report</Text>
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
          <Text style={styles.headerTitle">Call Recording</Text>
          <Text style={styles.headerSubtitle}>
            Real-time recording with AI violation detection
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRecordings} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderRecordingControls()}
        {renderAnalyticsOverview()}

        <View style={styles.recordingsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle">Recent Recordings</Text>
            <TouchableOpacity
              style={styles.configButton}
              onPress={() => setShowConfigModal(true)}
            >
              <Icon name="settings" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {recordings.map(renderRecordingItem)}

          {recordings.length === 0 && (
            <View style={styles.emptyRecordings}>
              <Icon name="mic-off" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle">No Recordings Yet</Text>
              <Text style={styles.emptyDescription">
                Start recording calls to build your evidence library
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderConfigModal()}
      {renderViolationsModal()}
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
  recordingControls: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  recordingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  recordingButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  currentCallInfo: {
    alignItems: 'center',
  },
  currentCallNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  currentCallDirection: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  analyticsContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  complianceMetrics: {
    alignItems: 'center',
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  complianceScore: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  complianceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  recordingsContainer: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  configButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  recordingItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingPhoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  recordingDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  recordingMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  recordingDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  recordingSize: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  recordingStatusContainer: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  highRiskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}20`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  highRiskText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  emptyRecordings: {
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
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
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
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
  violationSummary: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  violationSummaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  violationSummaryDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  severityBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  violationItem: {
    backgroundColor: Colors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    color: Colors.text,
    flex: 1,
  },
  severityIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: 'bold',
  },
  violationSubtype: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  violationDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  violationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  violationConfidence: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  violationTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  legalReferences: {
    marginBottom: Spacing.sm,
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  legalReference: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  recommendedActions: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
});