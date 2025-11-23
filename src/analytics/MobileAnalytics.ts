/**
 * Comprehensive Mobile Analytics and Crash Reporting System
 * Tracks app performance, user behavior, crashes, and provides insights
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions, DeviceInfo } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Types
export interface AnalyticsConfig {
  enabled: boolean;
  crashReporting: boolean;
  performanceMonitoring: boolean;
  userBehaviorTracking: boolean;
  analyticsEndpoint: string;
  batchSize: number;
  flushInterval: number; // in milliseconds
  maxRetries: number;
  samplingRate: number; // 0-1
  debugMode: boolean;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  deviceInfo: DeviceInfo;
  appVersion: string;
  events: AnalyticsEvent[];
  crashes: CrashReport[];
  performance: PerformanceMetrics;
  location?: GeolocationData;
  networkConditions?: NetworkConditions;
}

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  category: EventCategory;
  name: string;
  timestamp: Date;
  properties: Record<string, any>;
  value?: number;
  duration?: number;
  sessionId: string;
  userId?: string;
  screen?: string;
  action?: string;
  element?: string;
  metadata?: Record<string, any>;
}

export type EventType = 'screen_view' | 'user_action' | 'app_event' | 'error' | 'performance' | 'custom';
export type EventCategory = 'navigation' | 'engagement' | 'conversion' | 'error' | 'performance' | 'monetization' | 'social';

export interface CrashReport {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  error: ErrorInfo;
  deviceInfo: DeviceInfo;
  appState: AppState;
  userActions: UserAction[];
  memoryUsage: number;
  batteryLevel: number;
  networkConditions?: NetworkConditions;
  stackTrace: string;
  isFatal: boolean;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ErrorInfo {
  message: string;
  name: string;
  stack?: string;
  line?: number;
  column?: number;
  source?: string;
  context?: Record<string, any>;
}

export interface AppState {
  isActive: boolean;
  isBackgrounded: boolean;
  screenName?: string;
  route?: string;
  component?: string;
  props?: Record<string, any>;
}

export interface UserAction {
  timestamp: Date;
  type: 'tap' | 'swipe' | 'scroll' | 'input' | 'navigation';
  target: string;
  screen: string;
  coordinates?: { x: number; y: number };
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  appStartTime: number;
  renderTime: number;
  networkRequests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  memoryUsage: {
    peak: number;
    average: number;
    current: number;
  };
  batteryUsage: {
    start: number;
    end: number;
    consumed: number;
  };
  screenPerformance: ScreenPerformance[];
  apiPerformance: APIPerformance[];
}

export interface ScreenPerformance {
  screenName: string;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  crashCount: number;
  viewCount: number;
  averageViewDuration: number;
  bounceRate: number;
}

export interface APIPerformance {
  endpoint: string;
  method: string;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  dataTransfer: number;
  timeouts: number;
  retries: number;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
  architecture: string;
  memory: number;
  storage: number;
  screen: ScreenInfo;
  networkCapabilities: string[];
  osVersion: string;
  appVersion: string;
  buildNumber: string;
}

export interface ScreenInfo {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  orientation: 'portrait' | 'landscape';
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface NetworkConditions {
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  strength: number; // 0-1
  speed: number; // in Mbps
  latency: number; // in ms
  carrier?: string;
  connectionType: '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet';
}

export interface AnalyticsInsight {
  type: 'usage_pattern' | 'performance_issue' | 'crash_trend' | 'user_behavior' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0-1
  data: Record<string, any>;
  recommendations: string[];
  timestamp: Date;
}

/**
 * Mobile Analytics - Comprehensive analytics and crash reporting
 */
export class MobileAnalytics {
  private static instance: MobileAnalytics;
  private config: AnalyticsConfig;
  private currentSession: UserSession | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private crashQueue: CrashReport[] = [];
  private deviceInfo: DeviceInfo;
  private flushInterval?: NodeJS.Timeout;
  private isInitialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.deviceInfo = this.getDeviceInfo();
  }

  static getInstance(): MobileAnalytics {
    if (!MobileAnalytics.instance) {
      MobileAnalytics.instance = new MobileAnalytics();
    }
    return MobileAnalytics.instance;
  }

  // INITIALIZATION
  async initialize(userId?: string): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log('📊 Initializing Mobile Analytics...');

      // Load configuration
      await this.loadConfig();

      // Start new session
      await this.startSession(userId);

      // Set up error handlers
      this.setupErrorHandlers();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Start flush interval
      if (this.config.enabled) {
        this.startFlushInterval();
      }

      this.isInitialized = true;
      console.log('✅ Mobile Analytics initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Mobile Analytics:', error);
      throw error;
    }
  }

  private getDefaultConfig(): AnalyticsConfig {
    return {
      enabled: true,
      crashReporting: true,
      performanceMonitoring: true,
      userBehaviorTracking: true,
      analyticsEndpoint: 'https://api.callexample.com/analytics',
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      samplingRate: 1.0, // 100% sampling
      debugMode: __DEV__
    };
  }

  // SESSION MANAGEMENT
  async startSession(userId?: string): Promise<void> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.currentSession = {
        id: sessionId,
        userId,
        startTime: new Date(),
        deviceInfo: this.deviceInfo,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        events: [],
        crashes: [],
        performance: {
          appStartTime: Date.now(),
          renderTime: 0,
          networkRequests: {
            total: 0,
            successful: 0,
            failed: 0,
            averageResponseTime: 0
          },
          memoryUsage: {
            peak: 0,
            average: 0,
            current: 0
          },
          batteryUsage: {
            start: await this.getBatteryLevel(),
            end: 0,
            consumed: 0
          },
          screenPerformance: [],
          apiPerformance: []
        }
      };

      await this.trackEvent({
        type: 'app_event',
        category: 'navigation',
        name: 'session_start',
        properties: {
          sessionId,
          userId,
          appVersion: this.currentSession.appVersion
        }
      });

      console.log(`📊 Session started: ${sessionId}`);
    } catch (error) {
      console.error('❌ Error starting session:', error);
    }
  }

  async endSession(): Promise<void> {
    try {
      if (!this.currentSession) return;

      this.currentSession.endTime = new Date();
      this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
      this.currentSession.performance.batteryUsage.end = await this.getBatteryLevel();
      this.currentSession.performance.batteryUsage.consumed =
        this.currentSession.performance.batteryUsage.start - this.currentSession.performance.batteryUsage.end;

      await this.trackEvent({
        type: 'app_event',
        category: 'navigation',
        name: 'session_end',
        properties: {
          sessionId: this.currentSession.id,
          duration: this.currentSession.duration,
          eventCount: this.currentSession.events.length,
          crashCount: this.currentSession.crashes.length
        }
      });

      await this.flushData();
      console.log(`📊 Session ended: ${this.currentSession.id}`);
      this.currentSession = null;
    } catch (error) {
      console.error('❌ Error ending session:', error);
    }
  }

  // EVENT TRACKING
  async trackEvent(event: Partial<AnalyticsEvent>): Promise<void> {
    try {
      if (!this.config.enabled || !this.currentSession) return;

      // Check sampling rate
      if (Math.random() > this.config.samplingRate) return;

      const fullEvent: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: event.type || 'custom',
        category: event.category || 'engagement',
        name: event.name || 'unknown',
        timestamp: new Date(),
        properties: event.properties || {},
        value: event.value,
        duration: event.duration,
        sessionId: this.currentSession.id,
        userId: this.currentSession.userId,
        screen: event.screen,
        action: event.action,
        element: event.element,
        metadata: event.metadata
      };

      this.eventQueue.push(fullEvent);

      if (this.currentSession) {
        this.currentSession.events.push(fullEvent);
      }

      // Log in debug mode
      if (this.config.debugMode) {
        console.log(`📊 Event tracked: ${fullEvent.name}`, fullEvent.properties);
      }

      // Auto-flush if batch size reached
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flushEvents();
      }
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  async trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      type: 'screen_view',
      category: 'navigation',
      name: 'screen_view',
      screen: screenName,
      properties: {
        screenName,
        ...properties
      }
    });
  }

  async trackUserAction(action: string, target: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      type: 'user_action',
      category: 'engagement',
      name: action,
      action,
      element: target,
      properties: {
        action,
        target,
        ...properties
      }
    });
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      type: 'error',
      category: 'error',
      name: error.name,
      properties: {
        errorMessage: error.message,
        stackTrace: error.stack,
        ...context
      }
    });
  }

  async trackPerformance(metric: string, value: number, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      type: 'performance',
      category: 'performance',
      name: metric,
      value,
      properties: {
        metric,
        value,
        ...properties
      }
    });
  }

  // CRASH REPORTING
  private setupErrorHandlers(): void {
    // Set up global error handlers
    if (typeof ErrorUtils !== 'undefined') {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.reportCrash(error, isFatal);
      });
    }

    // Handle unhandled promise rejections
    if (typeof process !== 'undefined' && process.on) {
      process.on('unhandledRejection', (reason, promise) => {
        const error = new Error(`Unhandled promise rejection: ${reason}`);
        this.reportCrash(error, false);
      });
    }

    console.log('📊 Crash reporting setup completed');
  }

  async reportCrash(error: Error, isFatal: boolean = false): Promise<void> {
    try {
      if (!this.config.crashReporting || !this.currentSession) return;

      const crashReport: CrashReport = {
        id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        sessionId: this.currentSession.id,
        userId: this.currentSession.userId,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          context: {
            lastScreen: this.getCurrentScreen(),
            lastAction: this.getLastAction(),
            memoryUsage: await this.getMemoryUsage(),
            batteryLevel: await this.getBatteryLevel()
          }
        },
        deviceInfo: this.deviceInfo,
        appState: {
          isActive: true,
          isBackgrounded: false,
          screenName: this.getCurrentScreen(),
          component: this.getCurrentComponent()
        },
        userActions: this.getRecentUserActions(),
        memoryUsage: await this.getMemoryUsage(),
        batteryLevel: await this.getBatteryLevel(),
        networkConditions: await this.getNetworkConditions(),
        stackTrace: error.stack || '',
        isFatal,
        resolved: false
      };

      this.crashQueue.push(crashReport);
      if (this.currentSession) {
        this.currentSession.crashes.push(crashReport);
      }

      console.error('💥 Crash reported:', error.message);

      // Auto-flush crashes immediately
      await this.flushCrashes();

      // If fatal, attempt to save data before app closes
      if (isFatal) {
        await this.saveDataOnCrash();
      }
    } catch (reportError) {
      console.error('❌ Error reporting crash:', reportError);
    }
  }

  // PERFORMANCE MONITORING
  private setupPerformanceMonitoring(): void {
    if (!this.config.performanceMonitoring) return;

    // Monitor app performance
    setInterval(async () => {
      if (!this.currentSession) return;

      const memoryUsage = await this.getMemoryUsage();
      const batteryLevel = await this.getBatteryLevel();

      // Update performance metrics
      this.currentSession.performance.memoryUsage.current = memoryUsage;
      this.currentSession.performance.memoryUsage.peak = Math.max(
        this.currentSession.performance.memoryUsage.peak,
        memoryUsage
      );

      // Track performance metrics
      await this.trackPerformance('memory_usage', memoryUsage, { unit: 'MB' });
      await this.trackPerformance('battery_level', batteryLevel, { unit: 'percentage' });
    }, 30000); // Every 30 seconds

    console.log('📊 Performance monitoring started');
  }

  async measureScreenRenderTime(screenName: string, startTime: number): Promise<void> {
    try {
      const renderTime = Date.now() - startTime;

      await this.trackPerformance('screen_render_time', renderTime, {
        screenName,
        unit: 'milliseconds'
      });

      if (this.currentSession) {
        // Update screen performance metrics
        let screenPerf = this.currentSession.performance.screenPerformance.find(
          sp => sp.screenName === screenName
        );

        if (!screenPerf) {
          screenPerf = {
            screenName,
            renderTime,
            interactionTime: 0,
            memoryUsage: await this.getMemoryUsage(),
            crashCount: 0,
            viewCount: 1,
            averageViewDuration: 0,
            bounceRate: 0
          };
          this.currentSession.performance.screenPerformance.push(screenPerf);
        } else {
          screenPerf.renderTime = (screenPerf.renderTime + renderTime) / 2; // Average
          screenPerf.viewCount++;
        }
      }
    } catch (error) {
      console.error('❌ Error measuring screen render time:', error);
    }
  }

  async measureAPIPerformance(endpoint: string, method: string, responseTime: number, success: boolean): Promise<void> {
    try {
      await this.trackPerformance('api_response_time', responseTime, {
        endpoint,
        method,
        success,
        unit: 'milliseconds'
      });

      if (this.currentSession) {
        // Update API performance metrics
        const networkReq = this.currentSession.performance.networkRequests;
        networkReq.total++;
        if (success) {
          networkReq.successful++;
        } else {
          networkReq.failed++;
        }
        networkReq.averageResponseTime =
          ((networkReq.averageResponseTime * (networkReq.total - 1)) + responseTime) / networkReq.total;

        // Update specific API performance
        let apiPerf = this.currentSession.performance.apiPerformance.find(
          ap => ap.endpoint === endpoint && ap.method === method
        );

        if (!apiPerf) {
          apiPerf = {
            endpoint,
            method,
            requestCount: 1,
            successRate: success ? 1 : 0,
            averageResponseTime: responseTime,
            errorRate: success ? 0 : 1,
            dataTransfer: 0,
            timeouts: 0,
            retries: 0
          };
          this.currentSession.performance.apiPerformance.push(apiPerf);
        } else {
          apiPerf.requestCount++;
          apiPerf.successRate = ((apiPerf.successRate * (apiPerf.requestCount - 1)) + (success ? 1 : 0)) / apiPerf.requestCount;
          apiPerf.averageResponseTime = ((apiPerf.averageResponseTime * (apiPerf.requestCount - 1)) + responseTime) / apiPerf.requestCount;
          apiPerf.errorRate = 1 - apiPerf.successRate;
        }
      }
    } catch (error) {
      console.error('❌ Error measuring API performance:', error);
    }
  }

  // DATA FLUSHING
  private startFlushInterval(): void {
    this.flushInterval = setInterval(async () => {
      await this.flushData();
    }, this.config.flushInterval);

    console.log(`📊 Flush interval started: ${this.config.flushInterval}ms`);
  }

  async flushData(): Promise<void> {
    try {
      await Promise.all([
        this.flushEvents(),
        this.flushCrashes()
      ]);
    } catch (error) {
      console.error('❌ Error flushing data:', error);
    }
  }

  private async flushEvents(): Promise<void> {
    try {
      if (this.eventQueue.length === 0) return;

      const events = [...this.eventQueue];
      this.eventQueue = [];

      const payload = {
        events,
        deviceInfo: this.deviceInfo,
        sessionId: this.currentSession?.id,
        timestamp: new Date().toISOString()
      };

      // Send to analytics endpoint
      await this.sendData(this.config.analyticsEndpoint, payload);

      console.log(`📊 Flushed ${events.length} events`);
    } catch (error) {
      console.error('❌ Error flushing events:', error);
      // Restore events to queue on failure
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private async flushCrashes(): Promise<void> {
    try {
      if (this.crashQueue.length === 0) return;

      const crashes = [...this.crashQueue];
      this.crashQueue = [];

      const payload = {
        crashes,
        deviceInfo: this.deviceInfo,
        sessionId: this.currentSession?.id,
        timestamp: new Date().toISOString()
      };

      // Send to analytics endpoint
      const crashEndpoint = `${this.config.analyticsEndpoint}/crashes`;
      await this.sendData(crashEndpoint, payload);

      console.log(`💥 Flushed ${crashes.length} crash reports`);
    } catch (error) {
      console.error('❌ Error flushing crashes:', error);
      // Restore crashes to queue on failure
      this.crashQueue.unshift(...this.crashQueue);
    }
  }

  private async sendData(endpoint: string, data: any): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `CallDefender/${this.deviceInfo.appVersion}`,
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`📊 Data sent to ${endpoint}`);
    } catch (error) {
      console.error(`❌ Error sending data to ${endpoint}:`, error);
      throw error;
    }
  }

  // ANALYTICS AND INSIGHTS
  generateInsights(): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    if (!this.currentSession) return insights;

    const session = this.currentSession;
    const events = session.events;
    const crashes = session.crashes;

    // Crash rate insight
    if (crashes.length > 0) {
      insights.push({
        type: 'crash_trend',
        title: 'Crashes Detected',
        description: `${crashes.length} crashes occurred in this session`,
        severity: crashes.length > 3 ? 'critical' : crashes.length > 1 ? 'high' : 'medium',
        impact: Math.min(crashes.length / 10, 1),
        data: {
          crashCount: crashes.length,
          crashRate: crashes.length / events.length,
          avgTimeBetweenCrashes: session.duration ? session.duration / crashes.length : 0
        },
        recommendations: [
          'Investigate common crash patterns',
          'Review recent code changes',
          'Consider adding more error handling'
        ],
        timestamp: new Date()
      });
    }

    // Performance insight
    const avgRenderTime = session.performance.screenPerformance.reduce(
      (sum, sp) => sum + sp.renderTime, 0
    ) / Math.max(session.performance.screenPerformance.length, 1);

    if (avgRenderTime > 100) { // 100ms threshold
      insights.push({
        type: 'performance_issue',
        title: 'Slow Screen Rendering',
        description: `Average screen render time is ${Math.round(avgRenderTime)}ms`,
        severity: avgRenderTime > 500 ? 'critical' : avgRenderTime > 200 ? 'high' : 'medium',
        impact: Math.min(avgRenderTime / 1000, 1),
        data: {
          avgRenderTime,
          screens: session.performance.screenPerformance.length,
          problemScreens: session.performance.screenPerformance.filter(sp => sp.renderTime > 200)
        },
        recommendations: [
          'Optimize component rendering',
          'Implement lazy loading',
          'Consider code splitting'
        ],
        timestamp: new Date()
      });
    }

    // User behavior insight
    const screenViews = events.filter(e => e.type === 'screen_view').length;
    const userActions = events.filter(e => e.type === 'user_action').length;
    const engagementRate = screenViews > 0 ? userActions / screenViews : 0;

    if (engagementRate < 0.5) {
      insights.push({
        type: 'user_behavior',
        title: 'Low User Engagement',
        description: `Users are performing ${Math.round(engagementRate * 100)}% fewer actions than expected`,
        severity: 'medium',
        impact: 0.3,
        data: {
          engagementRate,
          screenViews,
          userActions,
          sessionDuration: session.duration
        },
        recommendations: [
          'Improve onboarding',
          'Add interactive elements',
          'Review user journey'
        ],
        timestamp: new Date()
      });
    }

    return insights;
  }

  getAnalyticsData(): {
    currentSession: UserSession | null;
    eventQueue: AnalyticsEvent[];
    crashQueue: CrashReport[];
    insights: AnalyticsInsight[];
    config: AnalyticsConfig;
  } {
    return {
      currentSession: this.currentSession,
      eventQueue: [...this.eventQueue],
      crashQueue: [...this.crashQueue],
      insights: this.generateInsights(),
      config: { ...this.config }
    };
  }

  // UTILITY METHODS
  private getDeviceInfo(): DeviceInfo {
    const { width, height } = Dimensions.get('window');

    return {
      deviceId: DeviceInfo.getUniqueId(),
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: DeviceInfo.getModel(),
      manufacturer: DeviceInfo.getBrand(),
      architecture: DeviceInfo.getArchitecture() || 'unknown',
      memory: 4096, // Would get actual memory
      storage: 64000, // Would get actual storage
      screen: {
        width,
        height,
        scale: 2, // Would get actual scale
        fontScale: 1,
        orientation: width > height ? 'landscape' : 'portrait'
      },
      networkCapabilities: ['wifi', 'cellular'],
      osVersion: Platform.Version.toString(),
      appVersion: Constants.expoConfig?.version || '1.0.0',
      buildNumber: Constants.expoConfig?.ios?.buildNumber || '1'
    };
  }

  private async getMemoryUsage(): Promise<number> {
    // Memory usage implementation would go here
    // This is a simplified version for demonstration
    return Math.random() * 512; // Simulated MB
  }

  private async getBatteryLevel(): Promise<number> {
    // Battery level implementation would go here
    // This is a simplified version for demonstration
    return Math.random(); // Simulated 0-1
  }

  private async getNetworkConditions(): Promise<NetworkConditions> {
    // Network conditions implementation would go here
    return {
      type: 'wifi',
      strength: 0.8,
      speed: 50,
      latency: 30,
      connectionType: 'wifi'
    };
  }

  private getCurrentScreen(): string {
    // Get current screen name
    return 'Unknown';
  }

  private getCurrentComponent(): string {
    // Get current component name
    return 'Unknown';
  }

  private getLastAction(): string {
    if (this.currentSession && this.currentSession.events.length > 0) {
      const lastEvent = this.currentSession.events[this.currentSession.events.length - 1];
      return lastEvent.name;
    }
    return 'None';
  }

  private getRecentUserActions(): UserAction[] {
    // Get recent user actions for crash context
    return [];
  }

  private async saveDataOnCrash(): Promise<void> {
    try {
      // Save critical data to local storage on crash
      const criticalData = {
        sessionId: this.currentSession?.id,
        userId: this.currentSession?.userId,
        events: this.eventQueue,
        crashes: this.crashQueue,
        timestamp: new Date().toISOString()
      };

      await AsyncStorage.setItem('crash_data', JSON.stringify(criticalData));
      console.log('💾 Critical crash data saved');
    } catch (error) {
      console.error('❌ Error saving crash data:', error);
    }
  }

  // CONFIGURATION MANAGEMENT
  async updateConfig(updates: Partial<AnalyticsConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...updates };
      await this.saveConfig();
      console.log('⚙️ Analytics configuration updated');
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
    }
  }

  async enableSampling(rate: number): Promise<void> {
    if (rate < 0 || rate > 1) {
      throw new Error('Sampling rate must be between 0 and 1');
    }

    this.config.samplingRate = rate;
    await this.saveConfig();
    console.log(`📊 Sampling rate set to ${(rate * 100).toFixed(1)}%`);
  }

  // PERSISTENCE
  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('analytics_config');
      if (data) {
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('analytics_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
    }
  }

  // CLEANUP
  async cleanup(): Promise<void> {
    try {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
      }

      await this.endSession();
      await this.flushData();
      console.log('🧹 Mobile Analytics cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // PUBLIC GETTERS
  getConfiguration(): AnalyticsConfig {
    return { ...this.config };
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }
}

// Export singleton instance
export const mobileAnalytics = MobileAnalytics.getInstance();