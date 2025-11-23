import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    resetPassword,
    error,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert('Reset Password Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => clearInterval(interval);
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const success = await resetPassword(email);
      if (success) {
        setEmailSent(true);
        setCanResend(false);
        setCountdown(60); // 60 seconds countdown
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const success = await resetPassword(email);
      if (success) {
        setCanResend(false);
        setCountdown(60);
        Alert.alert(
          'Email Resent',
          'Password reset instructions have been sent again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.successContainer}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📧</Text>
                </View>

                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successMessage}>
                  We've sent password reset instructions to:
                </Text>
                <View style={styles.emailBox}>
                  <Text style={styles.emailText}>{email}</Text>
                </View>

                <Text style={styles.instructions}>
                  1. Open your email app{'\n'}
                  2. Find the email from CallWall{'\n'}
                  3. Click the reset password link{'\n'}
                  4. Create a new password
                </Text>

                <View style={styles.resendSection}>
                  <Text style={styles.resendLabel}>
                    Didn't receive the email?
                  </Text>
                  <TouchableOpacity
                    style={[styles.resendButton, !canResend && styles.buttonDisabled]}
                    onPress={handleResendEmail}
                    disabled={!canResend || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.resendButtonText}>
                        {canResend
                          ? 'Resend Email'
                          : `Resend in ${formatCountdown(countdown)}`
                        }
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.tipsSection}>
                  <Text style={styles.tipsTitle}>Tips:</Text>
                  <Text style={styles.tipsText}>
                    • Check your spam or junk folder{'\n'}
                    • Make sure the email address is correct{'\n'}
                    • Wait a few minutes for the email to arrive
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>🛡️</Text>
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you instructions to reset your password
              </Text>
            </View>

            {/* Reset Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Instructions</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Additional Help */}
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                If you don't receive the email within a few minutes:
              </Text>
              <View style={styles.helpList}>
                <Text style={styles.helpItem}>• Check your spam or junk folder</Text>
                <Text style={styles.helpItem}>• Make sure you entered the correct email</Text>
                <Text style={styles.helpItem}>• Contact support if you continue to have issues</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.large,
  },
  logoText: {
    fontSize: 35,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.large,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    backgroundColor: Colors.input,
    color: Colors.textInput,
  },
  resetButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  resetButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  helpSection: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  helpList: {
    paddingLeft: 10,
  },
  helpItem: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    lineHeight: 18,
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  emailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    minWidth: 250,
  },
  emailText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left',
    marginBottom: 30,
    lineHeight: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  resendButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 150,
  },
  resendButtonText: {
    color: '#1e3c72',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});