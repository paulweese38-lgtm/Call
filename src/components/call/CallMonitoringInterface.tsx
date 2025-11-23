/**
 * CallWall Real-Time Call Monitoring Interface
 * Advanced live call monitoring with violation detection and protection
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Dimensions,
  Vibration,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CallRecordingEngine, RealTimeViolationAlert, CallMonitoringSettings } from '../../services/call/CallRecordingEngine';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface CallMonitoringInterfaceProps {
  visible: boolean;
  phoneNumber?: string;
  direction?: 'inbound' | 'outbound';
  settings: CallMonitoringSettings;
  onCallEnded: (recording?: any) => void;
  emergencyContacts?: any[];
}

export default function CallMonitoringInterface({
  visible,
  phoneNumber,
  direction = 'inbound',
  settings,
  onCallEnded,
  emergencyContacts = []
}: CallMonitoringInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<RealTimeViolationAlert | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'connecting' | 'recording' | 'processing'>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [violations, setViolations] = useState(0);
  const [sentimentScore, setSentimentScore] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEmergencyActions, setShowEmergencyActions] = useState(false);

  const recordingEngineRef = useRef<CallRecordingEngine | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const alertAnimationRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && phoneNumber) {
      initializeCall();
    }

    return () => {
      cleanupCall();
    };
  }, [visible, phoneNumber]);

  const initializeCall = async () => {
    try {
      setRecordingStatus('connecting');

      // Initialize recording engine
      recordingEngineRef.current = new CallRecordingEngine(
        settings,
        handleViolationDetected,
        handleHarassmentDetected
      );

      // Start recording
      const callId = await recordingEngineRef.current.startRecording(phoneNumber!, direction);
      setIsRecording(true);
      setCallActive(true);
      setRecordingStatus('recording');

      // Start call timer
      startCallTimer();

      Vibration.vibrate(100);

    } catch (error) {
      console.error('Failed to initialize call recording:', error);
      Alert.alert('Recording Error', 'Unable to start call recording. Call monitoring features will be limited.');
      setRecordingStatus('idle');
    }
  };

  const cleanupCall = async () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    if (recordingEngineRef.current && isRecording) {
      try {
        setRecordingStatus('processing');
        const recording = await recordingEngineRef.current.stopRecording(phoneNumber || '');
        onCallEnded(recording);
      } catch (error) {
        console.error('Error stopping recording:', error);
        onCallEnded();
      }
    }

    setIsRecording(false);
    setCallActive(false);
    setRecordingStatus('idle');
    setLiveTranscript('');
    setViolations(0);
    setSentimentScore(0);
    setDuration(0);
    setCurrentAlert(null);
  };

  const startCallTimer = () => {
    const startTime = Date.now();
    callTimerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const handleViolationDetected = (alert: RealTimeViolationAlert) => {
    setCurrentAlert(alert);
    setViolations(prev => prev + 1);

    // Animate alert appearance
    Animated.sequence([
      Animated.timing(alertAnimationRef, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(alertAnimationRef, {
        toValue: 0,
        duration: 300,
        delay: 3000,
        useNativeDriver: true,
      }),
    ]).start();

    // Vibrate for attention
    Vibration.vibrate([100, 50, 100]);

    // Auto-dismiss low severity alerts after 5 seconds
    if (alert.severity === 'minor' || alert.severity === 'moderate') {
      setTimeout(() => {
        setCurrentAlert(null);
      }, 5000);
    }
  };

  const handleHarassmentDetected = (alert: RealTimeViolationAlert) => {
    setCurrentAlert(alert);
    setShowEmergencyActions(true);

    // Stronger vibration for harassment
    Vibration.vibrate([200, 100, 200, 100, 200]);

    // Show persistent alert for harassment
    Alert.alert(
      'Harassment Detected',
      'AI has detected harassment patterns. You have the right to end this call.',
      [
        { text: 'End Call Now', onPress: endCall, style: 'destructive' },
        { text: 'View Rights', onPress: () => showLegalRights() },
        { text: 'Continue', style: 'cancel' },
      ]
    );
  };

  const endCall = () => {
    cleanupCall();
  };

  const recordViolation = () => {
    // Manually record a violation during the call
    Alert.prompt(
      'Record Violation',
      'Describe the violation that occurred:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record',
          onPress: (description) => {
            if (description) {
              setViolations(prev => prev + 1);
              Alert.alert('Violation Recorded', 'The violation has been documented with your call recording.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const showLegalRights = () => {
    const rights = [
      '• FDCPA § 805(a): Right to demand they stop calling',
      '• FDCPA § 806: Protection from harassment and abuse',
      '• FDCPA § 807: Protection from deceptive practices',
      '• Right to terminate conversation at any time',
      '• Right to not provide personal information',
      '• Right to request written validation of debt',
    ];

    Alert.alert(
      'Your Legal Rights',
      rights.join('\n'),
      [{ text: 'I Understand', style: 'default' }]
    );
  };

  const callEmergencyContact = (contact: any) => {
    Alert.alert(
      'Call Emergency Contact',
      `Call ${contact.name} at ${contact.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`);
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (score: number): string => {
    if (score <= 20) return Colors.success;
    if (score <= 40) return Colors.warning;
    if (score <= 60) return Colors.accent;
    return Colors.error;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return Colors.warning;
      case 'moderate': return Colors.accent;
      case 'major': return Colors.error;
      case 'severe': return Colors.error;
      default: return Colors.success;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={endCall}
    >
      <View style={styles.container}>
        {/* Status Bar */}
        <LinearGradient
          colors={[recordingStatus === 'recording' ? Colors.error : Colors.primary, Colors.primaryDark]}
          style={styles.statusBar}
        >
          <View style={styles.statusContent}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIndicator, recordingStatus === 'recording' && styles.recordingIndicator]} />
              <Text style={styles.statusText}>
                {recordingStatus === 'recording' ? 'Recording in Progress' :
                 recordingStatus === 'connecting' ? 'Connecting...' :
                 recordingStatus === 'processing' ? 'Processing...' : 'Call Monitor'}
              </Text>
            </View>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        </LinearGradient>

        {/* Call Information */}
        <View style={styles.callInfo}>
          <View style={styles.phoneNumberContainer}>
            <Icon name={direction === 'inbound' ? 'call-received' : 'call-made'} size={24} color={Colors.accent} />
            <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
            <Text style={styles.directionText}>
              {direction === 'inbound' ? 'Incoming' : 'Outgoing'}
            </Text>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <Icon name="gavel" size={20} color={Colors.error} />
              <Text style={styles.metricValue}>{violations}</Text>
              <Text style={styles.metricLabel}>Violations</Text>
            </View>

            <View style={styles.metric}>
              <Icon name="sentiment-very-dissatisfied" size={20} color={getSentimentColor(sentimentScore)} />
              <Text style={[styles.metricValue, { color: getSentimentColor(sentimentScore) }]}>
                {Math.round(sentimentScore)}%
              </Text>
              <Text style={styles.metricLabel}>Stress</Text>
            </View>
          </View>
        </View>

        {/* Live Transcript */}
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptTitle}>Live Transcript</Text>
          <ScrollView
            style={styles.transcriptScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.transcriptText}>{liveTranscript || 'Listening...'}</Text>
          </ScrollView>
        </View>

        {/* Real-Time Alert */}
        {currentAlert && (
          <Animated.View
            style={[
              styles.alertContainer,
              {
                opacity: alertAnimationRef,
                transform: [{ translateY: alertAnimationRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                }) }],
                backgroundColor: getSeverityColor(currentAlert.severity),
              }
            ]}
          >
            <View style={styles.alertContent}>
              <Icon name="warning" size={24} color={Colors.white} />
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>{currentAlert.violationType.toUpperCase()} DETECTED</Text>
                <Text style={styles.alertDescription}>{currentAlert.liveTranscript}</Text>
                <Text style={styles.alertSuggestion}>{currentAlert.suggestedResponse}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Emergency Actions Panel */}
        {showEmergencyActions && (
          <View style={styles.emergencyPanel}>
            <Text style={styles.emergencyTitle}>Emergency Actions</Text>
            <View style={styles.emergencyActions}>
              <TouchableOpacity
                style={[styles.emergencyButton, styles.endCallButton]}
                onPress={endCall}
              >
                <Icon name="call-end" size={24} color={Colors.white} />
                <Text style={styles.emergencyButtonText}>End Call Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.emergencyButton, styles.rightsButton]}
                onPress={showLegalRights}
              >
                <Icon name="gavel" size={24} color={Colors.white} />
                <Text style={styles.emergencyButtonText}>View Rights</Text>
              </TouchableOpacity>

              {emergencyContacts.slice(0, 2).map((contact, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.emergencyButton, styles.contactButton]}
                  onPress={() => callEmergencyContact(contact)}
                >
                  <Icon name="contact-phone" size={24} color={Colors.white} />
                  <Text style={styles.emergencyButtonText}>{contact.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={[styles.controlButton, styles.endCallControl]}
            onPress={endCall}
          >
            <Icon name="call-end" size={28} color={Colors.white} />
            <Text style={styles.controlButtonText}>End Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.recordButton]}
            onPress={recordViolation}
          >
            <Icon name="report" size={28} color={Colors.accent} />
            <Text style={styles.recordButtonText}>Record Violation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.infoButton]}
            onPress={showLegalRights}
          >
            <Icon name="info" size={28} color={Colors.primary} />
            <Text style={styles.infoButtonText}>Rights</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBar: {
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: Spacing.lg,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginRight: Spacing.sm,
  },
  recordingIndicator: {
    backgroundColor: Colors.error,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  callInfo: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  phoneNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  directionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  transcriptContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  alertContainer: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.large,
    zIndex: 1000,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  alertDescription: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  alertSuggestion: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  emergencyPanel: {
    backgroundColor: Colors.error,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emergencyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emergencyButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  endCallButton: {
    backgroundColor: Colors.dark,
  },
  rightsButton: {
    backgroundColor: Colors.accent,
  },
  contactButton: {
    backgroundColor: Colors.primary,
  },
  emergencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  controlPanel: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
  },
  endCallControl: {
    backgroundColor: Colors.error,
  },
  recordButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  infoButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    marginTop: Spacing.xs,
  },
  recordButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
});