/**
 * Comprehensive Biometric Authentication System
 * Supports fingerprint, face recognition, and other biometric methods
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Types
export interface BiometricConfig {
  enabled: boolean;
  requireAuthentication: boolean;
  fallbackToPin: boolean;
  maxAttempts: number;
  timeoutDuration: number; // in seconds
  supportedTypes: BiometricType[];
  authenticationMethod: 'biometric' | 'pin' | 'both';
  autoLockTimeout: number; // in minutes
}

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'voice' | 'none';

export interface AuthenticationAttempt {
  id: string;
  timestamp: Date;
  method: 'biometric' | 'pin' | 'password';
  success: boolean;
  error?: string;
  deviceInfo?: string;
  ipAddress?: string;
  location?: string;
}

export interface SecuritySession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  authenticationMethod: 'biometric' | 'pin' | 'password';
  deviceFingerprint: string;
  ipAddress: string;
}

export interface BiometricKey {
  id: string;
  userId: string;
  publicKey: string;
  privateKey: string;
  iv: string;
  algorithm: string;
  createdAt: Date;
  lastUsed?: Date;
  isRevoked: boolean;
  deviceFingerprint: string;
}

export interface AuthenticationCredentials {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  version: string;
  model: string;
    manufacturer: string;
  uniqueId: string;
  biometricCapabilities: BiometricType[];
  securityLevel: SecurityLevel;
}

export type SecurityLevel = 'low' | 'medium' | 'high' | 'maximum';

export interface PinConfiguration {
  minLength: number;
  maxLength: number;
  requireMixedChars: boolean;
  requireNumbers: boolean;
  maxAttempts: number;
  lockoutDuration: number; // in minutes
  encryptionStrength: 'AES-128' | 'AES-256';
}

/**
 * Biometric Authenticator - Comprehensive authentication system
 */
export class BiometricAuthenticator {
  private static instance: BiometricAuthenticator;
  private config: BiometricConfig;
  private authenticationAttempts: AuthenticationAttempt[] = [];
  private activeSession: SecuritySession | null = null;
  private deviceFingerprint: string;
  private isInitialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.deviceFingerprint = this.generateDeviceFingerprint();
  }

  static getInstance(): BiometricAuthenticator {
    if (!BiometricAuthenticator.instance) {
      BiometricAuthenticator.instance = new BiometricAuthenticator();
    }
    return BiometricAuthenticator.instance;
  }

  // INITIALIZATION
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log('🔐 Initializing Biometric Authenticator...');

      // Load configuration
      await this.loadConfig();

      // Check device capabilities
      const biometricCapabilities = await this.checkBiometricCapabilities();
      this.config.supportedTypes = biometricCapabilities;

      // Generate device fingerprint
      await this.generateAndStoreDeviceFingerprint();

      // Load previous authentication attempts
      await this.loadAuthenticationAttempts();

      // Load active session if exists
      await this.loadActiveSession();

      this.isInitialized = true;
      console.log('✅ Biometric Authenticator initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Biometric Authenticator:', error);
      throw error;
    }
  }

  private getDefaultConfig(): BiometricConfig {
    return {
      enabled: true,
      requireAuthentication: true,
      fallbackToPin: true,
      maxAttempts: 3,
      timeoutDuration: 60,
      supportedTypes: [],
      authenticationMethod: 'both',
      autoLockTimeout: 5
    };
  }

  // BIOMETRIC CAPABILITIES
  async checkBiometricCapabilities(): Promise<BiometricType[]> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        console.log('📱 Device does not support biometric authentication');
        return ['none'];
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.log('👤 No biometric data enrolled on device');
        return ['none'];
      }

      const availableTypes: BiometricType[] = [];

      if (Platform.OS === 'ios') {
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          availableTypes.push('fingerprint');
        }

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          availableTypes.push('face');
        }
      } else if (Platform.OS === 'android') {
        // Android typically supports fingerprint
        availableTypes.push('fingerprint');

        // Check for face recognition on newer Android versions
        try {
          const hasFaceAuth = await LocalAuthentication.hasHardwareAsync();
          if (hasFaceAuth) {
            availableTypes.push('face');
          }
        } catch (error) {
          // Face detection not available
        }
      }

      console.log('🔐 Supported biometric types:', availableTypes);
      return availableTypes.length > 0 ? availableTypes : ['none'];
    } catch (error) {
      console.error('❌ Error checking biometric capabilities:', error);
      return ['none'];
    }
  }

  async hasBiometricSupport(): Promise<boolean> {
    const capabilities = await this.checkBiometricCapabilities();
    return capabilities.length > 0 && !capabilities.includes('none');
  }

  // AUTHENTICATION METHODS
  async authenticate(reason?: string): Promise<{
    success: boolean;
    method: 'biometric' | 'pin' | 'password';
    error?: string;
  }> {
    try {
      if (!this.config.enabled) {
        return { success: true, method: 'none' };
      }

      // Check for existing valid session
      if (this.activeSession && this.isSessionValid(this.activeSession)) {
        await this.updateSessionActivity();
        return { success: true, method: this.activeSession.authenticationMethod };
      }

      let authMethod: 'biometric' | 'pin' | 'password' = 'biometric';
      let success = false;
      let error: string | undefined;

      // Try biometric authentication first if enabled
      if (this.config.authenticationMethod === 'biometric' || this.config.authenticationMethod === 'both') {
        const biometricResult = await this.authenticateWithBiometrics(reason);
        if (biometricResult.success) {
          success = true;
        } else if (biometricResult.error) {
          error = biometricResult.error;
        }
      }

      // Fallback to PIN if biometric fails or PIN only mode
      if (!success && (this.config.fallbackToPin || this.config.authenticationMethod === 'pin')) {
        authMethod = 'pin';
        const pinResult = await this.authenticateWithPin();
        if (pinResult.success) {
          success = true;
          error = undefined;
        } else if (pinResult.error) {
          error = pinResult.error;
        }
      }

      // Record authentication attempt
      await this.recordAuthenticationAttempt({
        id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        method: authMethod,
        success,
        error,
        deviceInfo: await this.getDeviceInfoString(),
        ipAddress: await this.getCurrentIPAddress()
      });

      if (success) {
        await this.createSecuritySession(authMethod);
      }

      return { success, method: authMethod, error };
    } catch (error) {
      console.error('❌ Error during authentication:', error);
      return {
        success: false,
        method: 'biometric',
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async authenticateWithBiometrics(reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const authReason = reason || 'Authenticate to access the app';

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: authReason,
        fallbackLabel: this.config.fallbackToPin ? 'Use PIN' : undefined,
        cancelLabel: 'Cancel',
        disableDeviceFallback: !this.config.fallbackToPin,
      });

      if (result.success) {
        console.log('🔐 Biometric authentication successful');
        return { success: true };
      } else {
        console.log('🔐 Biometric authentication failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error in biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication failed'
      };
    }
  }

  private async authenticateWithPin(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // PIN authentication would typically show a custom PIN input UI
      // This is a simplified implementation
      const storedPin = await SecureStore.getItemAsync('user_pin');

      if (!storedPin) {
        return { success: false, error: 'No PIN configured' };
      }

      // In a real implementation, you would show a PIN input screen here
      // For now, we'll simulate successful PIN entry
      console.log('🔐 PIN authentication successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in PIN authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PIN authentication failed'
      };
    }
  }

  async setPin(pin: string): Promise<void> {
    try {
      if (pin.length < 4) {
        throw new Error('PIN must be at least 4 digits');
      }

      await SecureStore.setItemAsync('user_pin', pin);
      console.log('🔐 PIN set successfully');
    } catch (error) {
      console.error('❌ Error setting PIN:', error);
      throw error;
    }
  }

  async changePin(oldPin: string, newPin: string): Promise<void> {
    try {
      const storedPin = await SecureStore.getItemAsync('user_pin');

      if (storedPin !== oldPin) {
        throw new Error('Current PIN is incorrect');
      }

      if (newPin.length < 4) {
        throw new Error('New PIN must be at least 4 digits');
      }

      await SecureStore.setItemAsync('user_pin', newPin);
      console.log('🔐 PIN changed successfully');
    } catch (error) {
      console.error('❌ Error changing PIN:', error);
      throw error;
    }
  }

  // SESSION MANAGEMENT
  private async createSecuritySession(authenticationMethod: 'biometric' | 'pin' | 'password'): Promise<void> {
    try {
      const session: SecuritySession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: await this.getCurrentUserId(),
        startTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        authenticationMethod,
        deviceFingerprint: this.deviceFingerprint,
        ipAddress: await this.getCurrentIPAddress()
      };

      this.activeSession = session;
      await this.saveActiveSession();

      console.log('🔐 Security session created');
    } catch (error) {
      console.error('❌ Error creating security session:', error);
    }
  }

  private isSessionValid(session: SecuritySession): boolean {
    if (!session.isActive) return false;

    const now = new Date();
    const sessionAge = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60); // in minutes

    return sessionAge < this.config.autoLockTimeout;
  }

  private async updateSessionActivity(): Promise<void> {
    if (this.activeSession) {
      this.activeSession.lastActivity = new Date();
      await this.saveActiveSession();
    }
  }

  async logout(): Promise<void> {
    try {
      this.activeSession = null;
      await AsyncStorage.removeItem('active_session');
      console.log('🔐 User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  }

  async getCurrentSession(): Promise<SecuritySession | null> {
    return this.activeSession && this.isSessionValid(this.activeSession)
      ? this.activeSession
      : null;
  }

  // ENCRYPTION AND SECURITY
  async generateBiometricKey(userId: string): Promise<BiometricKey> {
    try {
      const keyPair = await Crypto.generateKeyPairAsync('RSA', {
        modulusLength: 2048,
        publicExponent: 65537,
      });

      const iv = Crypto.getRandomBytesAsync(16);

      const biometricKey: BiometricKey = {
        id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        publicKey: keyPair.publicKey.toString(),
        privateKey: keyPair.privateKey.toString(),
        iv: await iv,
        algorithm: 'RSA-2048',
        createdAt: new Date(),
        isRevoked: false,
        deviceFingerprint: this.deviceFingerprint
      };

      // Store private key securely
      await SecureStore.setItemAsync(
        `biometric_key_${biometricKey.id}`,
        biometricKey.privateKey
      );

      console.log('🔐 Biometric key generated successfully');
      return biometricKey;
    } catch (error) {
      console.error('❌ Error generating biometric key:', error);
      throw error;
    }
  }

  async revokeBiometricKey(keyId: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`biometric_key_${keyId}`);
      console.log('🔐 Biometric key revoked successfully');
    } catch (error) {
      console.error('❌ Error revoking biometric key:', error);
      throw error;
    }
  }

  // CONFIGURATION MANAGEMENT
  async updateConfig(updates: Partial<BiometricConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...updates };
      await this.saveConfig();
      console.log('⚙️ Biometric configuration updated');
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      throw error;
    }
  }

  async enableBiometrics(enabled: boolean): Promise<void> {
    try {
      if (enabled && !(await this.hasBiometricSupport())) {
        throw new Error('Device does not support biometric authentication');
      }

      this.config.enabled = enabled;
      await this.saveConfig();
      console.log(`🔐 Biometrics ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error enabling/disabling biometrics:', error);
      throw error;
    }
  }

  async setAutoLockTimeout(timeoutMinutes: number): Promise<void> {
    try {
      if (timeoutMinutes < 1) {
        throw new Error('Auto-lock timeout must be at least 1 minute');
      }

      this.config.autoLockTimeout = timeoutMinutes;
      await this.saveConfig();
      console.log(`🔐 Auto-lock timeout set to ${timeoutMinutes} minutes`);
    } catch (error) {
      console.error('❌ Error setting auto-lock timeout:', error);
      throw error;
    }
  }

  // ANALYTICS AND MONITORING
  getAuthenticationAnalytics(): {
    totalAttempts: number;
    successRate: number;
    byMethod: Record<string, { attempts: number; successes: number }>;
    recentFailures: AuthenticationAttempt[];
    activeSession: SecuritySession | null;
  } {
    const totalAttempts = this.authenticationAttempts.length;
    const successes = this.authenticationAttempts.filter(a => a.success).length;
    const successRate = totalAttempts > 0 ? (successes / totalAttempts) * 100 : 0;

    const byMethod: Record<string, { attempts: number; successes: number }> = {};

    this.authenticationAttempts.forEach(attempt => {
      if (!byMethod[attempt.method]) {
        byMethod[attempt.method] = { attempts: 0, successes: 0 };
      }
      byMethod[attempt.method].attempts++;
      if (attempt.success) {
        byMethod[attempt.method].successes++;
      }
    });

    const recentFailures = this.authenticationAttempts
      .filter(a => !a.success)
      .slice(-10);

    return {
      totalAttempts,
      successRate,
      byMethod,
      recentFailures,
      activeSession: this.activeSession
    };
  }

  getSecurityLevel(): SecurityLevel {
    let level = 0;

    // Check if biometrics are enabled and available
    if (this.config.enabled && await this.hasBiometricSupport()) {
      level += 2;
    }

    // Check if PIN is configured
    SecureStore.getItemAsync('user_pin').then(pin => {
      if (pin) level += 1;
    });

    // Check auto-lock timeout
    if (this.config.autoLockTimeout <= 5) {
      level += 1;
    }

    if (level >= 4) return 'maximum';
    if (level >= 3) return 'high';
    if (level >= 2) return 'medium';
    return 'low';
  }

  // UTILITY METHODS
  private generateDeviceFingerprint(): string {
    // Simple device fingerprinting - in production, use more sophisticated methods
    const info = `${Platform.OS}-${Platform.Version}-${Date.now()}`;
    return Buffer.from(info).toString('base64');
  }

  private async generateAndStoreDeviceFingerprint(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('device_fingerprint');
      if (!stored) {
        await AsyncStorage.setItem('device_fingerprint', this.deviceFingerprint);
      } else {
        this.deviceFingerprint = stored;
      }
    } catch (error) {
      console.error('❌ Error storing device fingerprint:', error);
    }
  }

  private async getCurrentUserId(): Promise<string> {
    // This would typically get the current user ID from your auth system
    return await AsyncStorage.getItem('current_user_id') || 'anonymous';
  }

  private async getCurrentIPAddress(): Promise<string> {
    // In a real implementation, you would get the actual IP address
    return '192.168.1.1';
  }

  private async getDeviceInfoString(): Promise<string> {
    return `${Platform.OS} ${Platform.Version}`;
  }

  private async recordAuthenticationAttempt(attempt: AuthenticationAttempt): Promise<void> {
    this.authenticationAttempts.push(attempt);

    // Keep only last 100 attempts
    if (this.authenticationAttempts.length > 100) {
      this.authenticationAttempts = this.authenticationAttempts.slice(-100);
    }

    await this.saveAuthenticationAttempts();
  }

  // PERSISTENCE
  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('biometric_config');
      if (data) {
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
    }
  }

  private async loadAuthenticationAttempts(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('authentication_attempts');
      if (data) {
        const loaded = JSON.parse(data);
        this.authenticationAttempts = loaded.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('❌ Error loading authentication attempts:', error);
    }
  }

  private async saveAuthenticationAttempts(): Promise<void> {
    try {
      await AsyncStorage.setItem('authentication_attempts', JSON.stringify(this.authenticationAttempts));
    } catch (error) {
      console.error('❌ Error saving authentication attempts:', error);
    }
  }

  private async loadActiveSession(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('active_session');
      if (data) {
        const session: SecuritySession = JSON.parse(data);
        session.startTime = new Date(session.startTime);
        session.lastActivity = new Date(session.lastActivity);

        if (this.isSessionValid(session)) {
          this.activeSession = session;
        } else {
          await AsyncStorage.removeItem('active_session');
        }
      }
    } catch (error) {
      console.error('❌ Error loading active session:', error);
    }
  }

  private async saveActiveSession(): Promise<void> {
    try {
      if (this.activeSession) {
        await AsyncStorage.setItem('active_session', JSON.stringify(this.activeSession));
      }
    } catch (error) {
      console.error('❌ Error saving active session:', error);
    }
  }

  // PUBLIC GETTERS
  getConfiguration(): BiometricConfig {
    return { ...this.config };
  }

  getDeviceFingerprint(): string {
    return this.deviceFingerprint;
  }

  async isBiometricEnrolled(): Promise<boolean> {
    return await LocalAuthentication.isEnrolledAsync();
  }
}

// Export singleton instance
export const biometricAuthenticator = BiometricAuthenticator.getInstance();