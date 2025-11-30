import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

export function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, isLoading, error, clearError } = useAuthStore();

  const getPasswordStrength = (): { strength: string; color: string } => {
    if (!password) return { strength: '', color: '#e0e0e0' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', color: '#e53935' };
    if (score <= 3) return { strength: 'Medium', color: '#fb8c00' };
    return { strength: 'Strong', color: '#43a047' };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      newErrors.fullName = 'Name must be between 2 and 100 characters';
    }

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone number validation (optional)
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/[\s-()]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    const success = await register(email, password, {
      full_name: fullName.trim(),
      phone_number: phoneNumber || undefined
    });

    if (success) {
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>📧</Text>
        <Text style={styles.successTitle}>Check Your Email!</Text>
        <Text style={styles.successMessage}>
          We sent a verification email to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.successInstructions}>
          Please check your inbox and click the verification link to activate your account.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { marginTop: 24 }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.heading}>Create Account</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="John Doe"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors({ ...errors, fullName: undefined });
            }}
            autoCapitalize="words"
          />
          {errors.fullName && <Text style={styles.fieldError}>{errors.fullName}</Text>}
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="your@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
        </View>

        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
            }}
            keyboardType="phone-pad"
          />
          {errors.phoneNumber && <Text style={styles.fieldError}>{errors.phoneNumber}</Text>}
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {password && (
            <View style={styles.strengthContainer}>
              <View style={[styles.strengthBar, { backgroundColor: getPasswordStrength().color }]} />
              <Text style={[styles.strengthText, { color: getPasswordStrength().color }]}>
                {getPasswordStrength().strength}
              </Text>
            </View>
          )}
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.showPasswordText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {confirmPassword && password === confirmPassword && (
            <Text style={styles.matchText}>✓ Passwords match</Text>
          )}
          {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => {
            setAgreeToTerms(!agreeToTerms);
            if (errors.terms) setErrors({ ...errors, terms: undefined });
          }}
        >
          <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
            {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text style={styles.link}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {errors.terms && <Text style={[styles.fieldError, { marginLeft: 28 }]}>{errors.terms}</Text>}

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#1976d2',
  },
  form: {
    width: '100%',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#212121',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
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
  fieldError: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  showPasswordText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    height: 4,
    width: 60,
    borderRadius: 2,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchText: {
    color: '#43a047',
    fontSize: 12,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#bdbdbd',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#616161',
    flex: 1,
    lineHeight: 20,
  },
  link: {
    color: '#1976d2',
    fontWeight: '600',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#616161',
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
