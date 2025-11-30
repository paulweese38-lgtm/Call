import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { auth } from '../../services/supabaseClient';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    setError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await auth.resetPassword(email);

      if (!response.success) {
        setError(response.error?.message || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      setShowSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>📧</Text>
        <Text style={styles.successTitle}>Check Your Email</Text>
        <Text style={styles.successMessage}>
          We sent password reset instructions to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.successInstructions}>
          Please check your inbox and follow the link to reset your password.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { marginTop: 24 }]}
          onPress={handleResetPassword}
        >
          <Text style={styles.secondaryButtonText}>Resend Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="your@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    fontSize: 16,
    color: '#1976d2',
  },
  content: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#e53935',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontWeight: '600',
    color: '#1976d2',
  },
  successInstructions: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
