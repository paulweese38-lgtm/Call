import React, { useState } from 'react';
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
import { LoginCredentials } from '../types/auth';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    login,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  React.useEffect(() => {
    // Check for biometric availability
    checkBiometricAvailability();
  }, []);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const checkBiometricAvailability = async () => {
    try {
      // This would typically use expo-local-authentication
      // For now, we'll simulate it
      setBiometricAvailable(true);
    } catch {
      setBiometricAvailable(false);
    }
  };

  const handleLogin = async () => {
    if (!credentials.email.trim() || !credentials.password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    const success = await login(credentials);
    if (success) {
      // Navigation will be handled by the AppNavigator
      console.log('Login successful');
    }
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      console.log('Google login initiated');
    }
  };

  const handleBiometricLogin = async () => {
    // This would typically use expo-local-authentication
    Alert.alert('Biometric Login', 'Face ID / Fingerprint login would be implemented here');
  };

  const updateCredentials = (field: keyof LoginCredentials, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Logo and Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>🛡️</Text>
              </View>
              <Text style={styles.title}>Welcome to CallWall</Text>
              <Text style={styles.subtitle}>
                Your comprehensive communication protection platform
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#888"
                  value={credentials.email}
                  onChangeText={(value) => updateCredentials('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  value={credentials.password}
                  onChangeText={(value) => updateCredentials('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rememberContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => updateCredentials('rememberMe', !credentials.rememberMe)}
                  disabled={isLoading}
                >
                  <View style={[
                    styles.checkboxInner,
                    credentials.rememberMe && styles.checkboxChecked
                  ]}>
                    {credentials.rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={styles.rememberText}>Remember me</Text>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isLoading}
              >
                <Text style={styles.forgotButtonText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {biometricAvailable && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.biometricButton]}
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.biometricButtonText}>
                    Use Face ID / Fingerprint
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  eyeText: {
    fontSize: 20,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#1e3c72',
    borderColor: '#1e3c72',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#1e3c72',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotButtonText: {
    color: '#1e3c72',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#888',
    fontSize: 14,
  },
  socialButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  biometricButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  biometricButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  signUpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});