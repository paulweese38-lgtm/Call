/**
 * Advanced Battery Optimization System
 * Maximizes battery life while maintaining app functionality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions } from 'react-native';
import { AppState, AppStateStatus } from 'react-native';

// Types
export interface BatteryLevel {
  level: number; // 0-1
  isCharging: boolean;
  powerSource: 'battery' | 'ac' | 'usb' | 'wireless';
  estimatedTimeRemaining?: number; // in seconds
  temperature?: number; // in Celsius
  health: 'good' | 'fair' | 'poor' | 'unknown';
}

export interface BatteryOptimizationConfig {
  enabled: boolean;
  lowBatteryThreshold: number; // 0-1
  criticalBatteryThreshold: number; // 0-1
  performanceMode: 'balanced' | 'battery_saver' | 'performance';
  adaptiveOptimization: boolean;
  scheduleOptimization: boolean;
  optimizationWindows: OptimizationWindow[];
}

export interface OptimizationWindow {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  days: number[];    // 0-6 (Sunday-Saturday)
  settings: {
    performanceMode: 'balanced' | 'battery_saver' | 'performance';
    disableAnimations: boolean;
    reduceNetworkActivity: boolean;
    limitBackgroundTasks: boolean;
  };
}

export interface PowerSavingMode {
  id: string;
  name: string;
  description: string;
  settings: PowerSavingSettings;
  triggers: PowerSavingTrigger[];
  isActive: boolean;
  priority: number; // Higher number = higher priority
}

export interface PowerSavingSettings {
  reduceAnimations: boolean;
  lowerFrameRate: number;
  disableVibrations: boolean;
  reduceNetworkPolling: boolean;
  limitBackgroundSync: boolean;
  decreaseImageQuality: boolean;
  disablePushNotifications: boolean;
  dimScreenBrightness: number; // 0-1
  reduceLogLevel: boolean;
}

export interface PowerSavingTrigger {
  type: 'battery_level' | 'time_of_day' | 'app_state' | 'thermal_state';
  condition: any;
  enabled: boolean;
}

export interface EnergyConsumption {
  component: string;
  consumption: number; // in mAh
  percentage: number; // of total consumption
  timeRange: string;
  measurements: EnergyMeasurement[];
}

export interface EnergyMeasurement {
  timestamp: Date;
  consumption: number;
  activity: string;
  duration: number;
}

export interface AppLifecycleEvent {
  type: 'foreground' | 'background' | 'inactive' | 'active';
  timestamp: Date;
  batteryLevel: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * Battery Optimizer - Comprehensive power management
 */
export class BatteryOptimizer {
  private static instance: BatteryOptimizer;
  private config: BatteryOptimizationConfig;
  private currentBatteryLevel: BatteryLevel;
  private powerSavingModes: Map<string, PowerSavingMode> = new Map();
  private activePowerSavingMode: PowerSavingMode | null = null;
  private energyConsumption: Map<string, EnergyConsumption> = new Map();
  private lifecycleEvents: AppLifecycleEvent[] = [];
  private isOptimizing = false;
  private optimizationInterval?: NodeJS.Timeout;
  private batteryMonitorInterval?: NodeJS.Timeout;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.currentBatteryLevel = {
      level: 1.0,
      isCharging: false,
      powerSource: 'battery',
      health: 'unknown'
    };
    this.initializeDefaultPowerSavingModes();
  }

  static getInstance(): BatteryOptimizer {
    if (!BatteryOptimizer.instance) {
      BatteryOptimizer.instance = new BatteryOptimizer();
    }
    return BatteryOptimizer.instance;
  }

  // INITIALIZATION
  async initialize(): Promise<void> {
    try {
      console.log('🔋 Initializing Battery Optimizer...');

      // Load configuration
      await this.loadConfig();

      // Load power saving modes
      await this.loadPowerSavingModes();

      // Get current battery level
      await this.updateBatteryLevel();

      // Set up monitoring
      this.setupBatteryMonitoring();
      this.setupAppStateMonitoring();

      // Start optimization process
      if (this.config.enabled) {
        this.startOptimization();
      }

      console.log('✅ Battery Optimizer initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Battery Optimizer:', error);
      throw error;
    }
  }

  private getDefaultConfig(): BatteryOptimizationConfig {
    return {
      enabled: true,
      lowBatteryThreshold: 0.2,  // 20%
      criticalBatteryThreshold: 0.1,  // 10%
      performanceMode: 'balanced',
      adaptiveOptimization: true,
      scheduleOptimization: true,
      optimizationWindows: [
        {
          id: 'night',
          name: 'Night Mode',
          startTime: '22:00',
          endTime: '07:00',
          days: [1, 2, 3, 4, 5], // Monday-Friday
          settings: {
            performanceMode: 'battery_saver',
            disableAnimations: true,
            reduceNetworkActivity: true,
            limitBackgroundTasks: true
          }
        },
        {
          id: 'work_hours',
          name: 'Work Hours',
          startTime: '09:00',
          endTime: '17:00',
          days: [1, 2, 3, 4, 5],
          settings: {
            performanceMode: 'balanced',
            disableAnimations: false,
            reduceNetworkActivity: false,
            limitBackgroundTasks: false
          }
        }
      ]
    };
  }

  // BATTERY MONITORING
  private setupBatteryMonitoring(): void {
    this.batteryMonitorInterval = setInterval(async () => {
      await this.updateBatteryLevel();
      await this.checkBatteryTriggers();
      await this.recordEnergyConsumption();
    }, 30000); // Check every 30 seconds

    console.log('🔋 Battery monitoring started');
  }

  private async updateBatteryLevel(): Promise<void> {
    try {
      // Battery API integration would go here
      // This is a simplified version for demonstration

      const previousLevel = this.currentBatteryLevel.level;

      // Simulate battery level changes
      if (!this.currentBatteryLevel.isCharging) {
        // Gradually decrease battery level when not charging
        this.currentBatteryLevel.level = Math.max(0, this.currentBatteryLevel.level - 0.001);
      } else {
        // Increase when charging
        this.currentBatteryLevel.level = Math.min(1, this.currentBatteryLevel.level + 0.002);
      }

      // Log significant battery changes
      if (Math.abs(previousLevel - this.currentBatteryLevel.level) > 0.05) {
        console.log(`🔋 Battery level: ${Math.round(this.currentBatteryLevel.level * 100)}%`);
        await this.recordBatteryChange();
      }
    } catch (error) {
      console.error('❌ Error updating battery level:', error);
    }
  }

  private async checkBatteryTriggers(): Promise<void> {
    try {
      const level = this.currentBatteryLevel.level;

      // Check low battery threshold
      if (level <= this.config.criticalBatteryThreshold) {
        await this.activatePowerSavingMode('critical_battery');
      } else if (level <= this.config.lowBatteryThreshold) {
        await this.activatePowerSavingMode('low_battery');
      } else {
        await this.deactivatePowerSavingMode('critical_battery');
        await this.deactivatePowerSavingMode('low_battery');
      }

      // Check charging state
      if (this.currentBatteryLevel.isCharging && this.activePowerSavingMode) {
        // Consider deactivating some power saving modes when charging
        if (this.activePowerSavingMode.id !== 'night_mode') {
          await this.deactivatePowerSavingMode(this.activePowerSavingMode.id);
        }
      }

      // Check optimization windows
      await this.checkOptimizationWindows();
    } catch (error) {
      console.error('❌ Error checking battery triggers:', error);
    }
  }

  private async checkOptimizationWindows(): Promise<void> {
    if (!this.config.scheduleOptimization) return;

    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const dayOfWeek = now.getDay();

      for (const window of this.config.optimizationWindows) {
        if (!window.days.includes(dayOfWeek)) continue;

        const isActive = this.isTimeInRange(currentTime, window.startTime, window.endTime);

        if (isActive) {
          await this.applyOptimizationWindow(window);
        } else {
          await this.removeOptimizationWindow(window);
        }
      }
    } catch (error) {
      console.error('❌ Error checking optimization windows:', error);
    }
  }

  private isTimeInRange(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // APP STATE MONITORING
  private setupAppStateMonitoring(): void {
    AppState.addEventListener('change', (nextState: AppStateStatus) => {
      this.handleAppStateChange(nextState);
    });

    console.log('📱 App state monitoring started');
  }

  private async handleAppStateChange(state: AppStateStatus): Promise<void> {
    try {
      const event: AppLifecycleEvent = {
        type: state === 'active' ? 'active' : state === 'background' ? 'background' : 'inactive',
        timestamp: new Date(),
        batteryLevel: this.currentBatteryLevel.level,
        memoryUsage: await this.getMemoryUsage(),
        cpuUsage: await this.getCPUUsage()
      };

      this.lifecycleEvents.push(event);

      // Keep only last 100 events
      if (this.lifecycleEvents.length > 100) {
        this.lifecycleEvents = this.lifecycleEvents.slice(-100);
      }

      await this.saveLifecycleEvents();

      console.log(`📱 App state changed to: ${state}`);

      // Apply optimizations based on app state
      if (state === 'background') {
        await this.applyBackgroundOptimizations();
      } else if (state === 'active') {
        await this.applyForegroundOptimizations();
      }
    } catch (error) {
      console.error('❌ Error handling app state change:', error);
    }
  }

  private async applyBackgroundOptimizations(): Promise<void> {
    try {
      console.log('🔋 Applying background optimizations...');

      // Reduce network activity
      this.setNetworkOptimizationLevel('minimal');

      // Limit background sync
      this.setBackgroundSyncEnabled(false);

      // Reduce animation quality
      this.setAnimationQuality('reduced');

      // Lower refresh rate
      this.setRefreshRate(30);

      // Disable non-essential features
      this.setNonEssentialFeaturesEnabled(false);
    } catch (error) {
      console.error('❌ Error applying background optimizations:', error);
    }
  }

  private async applyForegroundOptimizations(): Promise<void> {
    try {
      console.log('🔋 Applying foreground optimizations...');

      // Restore normal network activity
      this.setNetworkOptimizationLevel('normal');

      // Enable background sync
      this.setBackgroundSyncEnabled(true);

      // Restore animation quality based on current mode
      if (this.activePowerSavingMode?.settings.reduceAnimations) {
        this.setAnimationQuality('reduced');
      } else {
        this.setAnimationQuality('normal');
      }

      // Set appropriate refresh rate
      const targetFrameRate = this.activePowerSavingMode?.settings.lowerFrameRate || 60;
      this.setRefreshRate(targetFrameRate);

      // Enable essential features
      this.setNonEssentialFeaturesEnabled(true);
    } catch (error) {
      console.error('❌ Error applying foreground optimizations:', error);
    }
  }

  // POWER SAVING MODES
  private initializeDefaultPowerSavingModes(): void {
    const defaultModes: PowerSavingMode[] = [
      {
        id: 'low_battery',
        name: 'Low Battery Mode',
        description: 'Conserves battery when power is low',
        priority: 2,
        isActive: false,
        settings: {
          reduceAnimations: true,
          lowerFrameRate: 30,
          disableVibrations: false,
          reduceNetworkPolling: true,
          limitBackgroundSync: true,
          decreaseImageQuality: true,
          disablePushNotifications: false,
          dimScreenBrightness: 0.8,
          reduceLogLevel: true
        },
        triggers: [
          {
            type: 'battery_level',
            condition: { operator: 'lte', value: 0.2 },
            enabled: true
          }
        ]
      },
      {
        id: 'critical_battery',
        name: 'Critical Battery Mode',
        description: 'Maximum power conservation',
        priority: 3,
        isActive: false,
        settings: {
          reduceAnimations: true,
          lowerFrameRate: 15,
          disableVibrations: true,
          reduceNetworkPolling: true,
          limitBackgroundSync: true,
          decreaseImageQuality: true,
          disablePushNotifications: true,
          dimScreenBrightness: 0.6,
          reduceLogLevel: true
        },
        triggers: [
          {
            type: 'battery_level',
            condition: { operator: 'lte', value: 0.1 },
            enabled: true
          }
        ]
      },
      {
        id: 'night_mode',
        name: 'Night Mode',
        description: 'Optimized for nighttime use',
        priority: 1,
        isActive: false,
        settings: {
          reduceAnimations: true,
          lowerFrameRate: 30,
          disableVibrations: true,
          reduceNetworkPolling: true,
          limitBackgroundSync: true,
          decreaseImageQuality: false,
          disablePushNotifications: false,
          dimScreenBrightness: 0.7,
          reduceLogLevel: false
        },
        triggers: [
          {
            type: 'time_of_day',
            condition: { startTime: '22:00', endTime: '07:00' },
            enabled: true
          }
        ]
      }
    ];

    defaultModes.forEach(mode => {
      this.powerSavingModes.set(mode.id, mode);
    });
  }

  async activatePowerSavingMode(modeId: string): Promise<void> {
    try {
      const mode = this.powerSavingModes.get(modeId);
      if (!mode) {
        console.warn(`⚠️ Power saving mode not found: ${modeId}`);
        return;
      }

      // Check if a higher priority mode is already active
      if (this.activePowerSavingMode &&
          this.activePowerSavingMode.priority > mode.priority) {
        console.log(`⚠️ Higher priority mode already active: ${this.activePowerSavingMode.name}`);
        return;
      }

      // Deactivate current mode if lower priority
      if (this.activePowerSavingMode &&
          this.activePowerSavingMode.priority <= mode.priority) {
        await this.deactivatePowerSavingMode(this.activePowerSavingMode.id);
      }

      mode.isActive = true;
      this.activePowerSavingMode = mode;

      // Apply power saving settings
      await this.applyPowerSavingSettings(mode.settings);

      await this.savePowerSavingModes();
      console.log(`🔋 Power saving mode activated: ${mode.name}`);
    } catch (error) {
      console.error('❌ Error activating power saving mode:', error);
    }
  }

  async deactivatePowerSavingMode(modeId: string): Promise<void> {
    try {
      const mode = this.powerSavingModes.get(modeId);
      if (!mode || !mode.isActive) return;

      mode.isActive = false;

      if (this.activePowerSavingMode?.id === modeId) {
        this.activePowerSavingMode = null;

        // Restore default settings
        await this.restoreDefaultSettings();

        // Check if other modes should be activated
        await this.checkBatteryTriggers();
      }

      await this.savePowerSavingModes();
      console.log(`🔋 Power saving mode deactivated: ${mode.name}`);
    } catch (error) {
      console.error('❌ Error deactivating power saving mode:', error);
    }
  }

  private async applyPowerSavingSettings(settings: PowerSavingSettings): Promise<void> {
    try {
      console.log('🔋 Applying power saving settings...');

      if (settings.reduceAnimations) {
        this.setAnimationQuality('reduced');
      }

      this.setRefreshRate(settings.lowerFrameRate);

      if (settings.disableVibrations) {
        this.setVibrationsEnabled(false);
      }

      if (settings.reduceNetworkPolling) {
        this.setNetworkOptimizationLevel('reduced');
      }

      if (settings.limitBackgroundSync) {
        this.setBackgroundSyncEnabled(false);
      }

      if (settings.decreaseImageQuality) {
        this.setImageQuality('reduced');
      }

      if (settings.disablePushNotifications) {
        this.setPushNotificationsEnabled(false);
      }

      // Screen brightness would be controlled through native APIs
      console.log('🔋 Power saving settings applied');
    } catch (error) {
      console.error('❌ Error applying power saving settings:', error);
    }
  }

  private async restoreDefaultSettings(): Promise<void> {
    try {
      console.log('🔋 Restoring default settings...');

      this.setAnimationQuality('normal');
      this.setRefreshRate(60);
      this.setVibrationsEnabled(true);
      this.setNetworkOptimizationLevel('normal');
      this.setBackgroundSyncEnabled(true);
      this.setImageQuality('normal');
      this.setPushNotificationsEnabled(true);

      console.log('🔋 Default settings restored');
    } catch (error) {
      console.error('❌ Error restoring default settings:', error);
    }
  }

  // OPTIMIZATION IMPLEMENTATIONS
  private setAnimationQuality(quality: 'normal' | 'reduced'): void {
    // Animation quality implementation would go here
    console.log(`🎬 Animation quality set to: ${quality}`);
  }

  private setRefreshRate(fps: number): void {
    // Frame rate implementation would go here
    console.log(`⚡ Refresh rate set to: ${fps}fps`);
  }

  private setVibrationsEnabled(enabled: boolean): void {
    // Vibration control implementation would go here
    console.log(`📳 Vibrations ${enabled ? 'enabled' : 'disabled'}`);
  }

  private setNetworkOptimizationLevel(level: 'normal' | 'reduced' | 'minimal'): void {
    // Network optimization implementation would go here
    console.log(`🌐 Network optimization level: ${level}`);
  }

  private setBackgroundSyncEnabled(enabled: boolean): void {
    // Background sync control implementation would go here
    console.log(`🔄 Background sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  private setImageQuality(quality: 'normal' | 'reduced'): void {
    // Image quality implementation would go here
    console.log(`🖼️ Image quality: ${quality}`);
  }

  private setPushNotificationsEnabled(enabled: boolean): void {
    // Push notification control implementation would go here
    console.log(`🔔 Push notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  private setNonEssentialFeaturesEnabled(enabled: boolean): void {
    // Non-essential features control implementation would go here
    console.log(`⚙️ Non-essential features ${enabled ? 'enabled' : 'disabled'}`);
  }

  private async applyOptimizationWindow(window: OptimizationWindow): Promise<void> {
    try {
      // Create temporary power saving mode for optimization window
      const windowMode: PowerSavingMode = {
        id: `window_${window.id}`,
        name: window.name,
        description: `Scheduled optimization: ${window.name}`,
        priority: 0,
        isActive: true,
        settings: {
          reduceAnimations: window.settings.disableAnimations,
          lowerFrameRate: window.settings.performanceMode === 'battery_saver' ? 30 : 60,
          disableVibrations: false,
          reduceNetworkPolling: window.settings.reduceNetworkActivity,
          limitBackgroundSync: window.settings.limitBackgroundTasks,
          decreaseImageQuality: window.settings.performanceMode === 'battery_saver',
          disablePushNotifications: false,
          dimScreenBrightness: 0.9,
          reduceLogLevel: false
        },
        triggers: []
      };

      this.powerSavingModes.set(windowMode.id, windowMode);
      await this.applyPowerSavingSettings(windowMode.settings);
      console.log(`⏰ Optimization window applied: ${window.name}`);
    } catch (error) {
      console.error('❌ Error applying optimization window:', error);
    }
  }

  private async removeOptimizationWindow(window: OptimizationWindow): Promise<void> {
    try {
      const windowModeId = `window_${window.id}`;
      this.powerSavingModes.delete(windowModeId);
      console.log(`⏰ Optimization window removed: ${window.name}`);
    } catch (error) {
      console.error('❌ Error removing optimization window:', error);
    }
  }

  // ENERGY CONSUMPTION TRACKING
  private async recordEnergyConsumption(): Promise<void> {
    try {
      // Energy consumption measurement would be implemented here
      // This is a simplified version for demonstration
      const components = ['cpu', 'network', 'display', 'sensors'];

      for (const component of components) {
        const consumption = Math.random() * 100; // Simulated consumption

        if (!this.energyConsumption.has(component)) {
          this.energyConsumption.set(component, {
            component,
            consumption: 0,
            percentage: 0,
            timeRange: 'last_hour',
            measurements: []
          });
        }

        const energyData = this.energyConsumption.get(component)!;
        energyData.measurements.push({
          timestamp: new Date(),
          consumption,
          activity: 'normal',
          duration: 60 // 1 minute
        });

        // Keep only last 60 measurements (1 hour)
        if (energyData.measurements.length > 60) {
          energyData.measurements = energyData.measurements.slice(-60);
        }

        // Calculate totals
        energyData.consumption = energyData.measurements.reduce((sum, m) => sum + m.consumption, 0);
      }

      await this.saveEnergyConsumption();
    } catch (error) {
      console.error('❌ Error recording energy consumption:', error);
    }
  }

  // ANALYTICS
  getBatteryAnalytics(): {
    currentLevel: BatteryLevel;
    activePowerSavingMode: PowerSavingMode | null;
    energyConsumption: EnergyConsumption[];
    lifecycleEvents: AppLifecycleEvent[];
    optimizationWindows: OptimizationWindow[];
    efficiency: {
      score: number;
      recommendations: string[];
    };
  } {
    const energyConsumption = Array.from(this.energyConsumption.values());
    const totalConsumption = energyConsumption.reduce((sum, e) => sum + e.consumption, 0);

    // Calculate efficiency score
    const score = this.calculateEfficiencyScore();
    const recommendations = this.generateRecommendations();

    return {
      currentLevel: this.currentBatteryLevel,
      activePowerSavingMode: this.activePowerSavingMode,
      energyConsumption,
      lifecycleEvents: this.lifecycleEvents.slice(-20),
      optimizationWindows: this.config.optimizationWindows,
      efficiency: {
        score,
        recommendations
      }
    };
  }

  private calculateEfficiencyScore(): number {
    let score = 100;

    // Deduct points for low battery
    if (this.currentBatteryLevel.level < 0.2) score -= 20;
    if (this.currentBatteryLevel.level < 0.1) score -= 30;

    // Deduct points for high energy consumption
    const totalConsumption = Array.from(this.energyConsumption.values())
      .reduce((sum, e) => sum + e.consumption, 0);
    if (totalConsumption > 1000) score -= 20;

    // Add points for power saving modes
    if (this.activePowerSavingMode) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.currentBatteryLevel.level < 0.2) {
      recommendations.push('Consider charging your device soon');
    }

    if (!this.activePowerSavingMode && this.currentBatteryLevel.level < 0.3) {
      recommendations.push('Enable power saving mode to extend battery life');
    }

    const totalConsumption = Array.from(this.energyConsumption.values())
      .reduce((sum, e) => sum + e.consumption, 0);
    if (totalConsumption > 1000) {
      recommendations.push('High energy consumption detected - consider reducing app usage');
    }

    return recommendations;
  }

  // UTILITY METHODS
  private async getMemoryUsage(): Promise<number> {
    // Memory usage implementation would go here
    return Math.random() * 1024; // Simulated MB
  }

  private async getCPUUsage(): Promise<number> {
    // CPU usage implementation would go here
    return Math.random() * 100; // Simulated percentage
  }

  private async recordBatteryChange(): Promise<void> {
    try {
      // Record significant battery changes for analytics
      const change = {
        timestamp: new Date(),
        level: this.currentBatteryLevel.level,
        isCharging: this.currentBatteryLevel.isCharging
      };

      const changes = JSON.parse(await AsyncStorage.getItem('battery_changes') || '[]');
      changes.push(change);

      // Keep only last 100 changes
      if (changes.length > 100) {
        changes.splice(0, changes.length - 100);
      }

      await AsyncStorage.setItem('battery_changes', JSON.stringify(changes));
    } catch (error) {
      console.error('❌ Error recording battery change:', error);
    }
  }

  private startOptimization(): void {
    this.isOptimizing = true;

    this.optimizationInterval = setInterval(async () => {
      if (this.isOptimizing) {
        await this.performOptimization();
      }
    }, 60000); // Optimize every minute

    console.log('🔋 Battery optimization started');
  }

  private async performOptimization(): Promise<void> {
    try {
      // Adaptive optimization logic would go here
      if (this.config.adaptiveOptimization) {
        await this.adaptiveOptimization();
      }
    } catch (error) {
      console.error('❌ Error during optimization:', error);
    }
  }

  private async adaptiveOptimization(): Promise<void> {
    try {
      // Learn from usage patterns and adjust optimization
      const recentEvents = this.lifecycleEvents.slice(-10);

      // Analyze usage patterns
      const activeTime = recentEvents.filter(e => e.type === 'active').length;
      const backgroundTime = recentEvents.filter(e => e.type === 'background').length;

      // Adjust optimization based on usage
      if (backgroundTime > activeTime) {
        // User is mostly in background - optimize for battery
        this.setNetworkOptimizationLevel('reduced');
        this.setBackgroundSyncEnabled(false);
      }

      console.log('🔋 Adaptive optimization completed');
    } catch (error) {
      console.error('❌ Error during adaptive optimization:', error);
    }
  }

  // CONFIGURATION MANAGEMENT
  async updateConfig(updates: Partial<BatteryOptimizationConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...updates };
      await this.saveConfig();
      console.log('⚙️ Battery optimizer configuration updated');
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      throw error;
    }
  }

  async addOptimizationWindow(window: OptimizationWindow): Promise<void> {
    try {
      this.config.optimizationWindows.push(window);
      await this.saveConfig();
      console.log('⏰ Optimization window added:', window.name);
    } catch (error) {
      console.error('❌ Error adding optimization window:', error);
      throw error;
    }
  }

  // PERSISTENCE
  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('battery_optimizer_config');
      if (data) {
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('battery_optimizer_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
    }
  }

  private async loadPowerSavingModes(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('power_saving_modes');
      if (data) {
        const modes = JSON.parse(data);
        modes.forEach((mode: PowerSavingMode) => {
          this.powerSavingModes.set(mode.id, mode);
        });
      }
    } catch (error) {
      console.error('❌ Error loading power saving modes:', error);
    }
  }

  private async savePowerSavingModes(): Promise<void> {
    try {
      const modes = Array.from(this.powerSavingModes.values());
      await AsyncStorage.setItem('power_saving_modes', JSON.stringify(modes));
    } catch (error) {
      console.error('❌ Error saving power saving modes:', error);
    }
  }

  private async saveLifecycleEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('lifecycle_events', JSON.stringify(this.lifecycleEvents));
    } catch (error) {
      console.error('❌ Error saving lifecycle events:', error);
    }
  }

  private async saveEnergyConsumption(): Promise<void> {
    try {
      const consumption = Array.from(this.energyConsumption.values());
      await AsyncStorage.setItem('energy_consumption', JSON.stringify(consumption));
    } catch (error) {
      console.error('❌ Error saving energy consumption:', error);
    }
  }

  // CLEANUP
  async cleanup(): Promise<void> {
    try {
      if (this.batteryMonitorInterval) {
        clearInterval(this.batteryMonitorInterval);
      }

      if (this.optimizationInterval) {
        clearInterval(this.optimizationInterval);
      }

      this.isOptimizing = false;
      console.log('🧹 Battery optimizer cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // PUBLIC GETTERS
  getConfiguration(): BatteryOptimizationConfig {
    return { ...this.config };
  }

  getCurrentBatteryLevel(): BatteryLevel {
    return { ...this.currentBatteryLevel };
  }

  getPowerSavingModes(): PowerSavingMode[] {
    return Array.from(this.powerSavingModes.values());
  }

  getActivePowerSavingMode(): PowerSavingMode | null {
    return this.activePowerSavingMode;
  }
}

// Export singleton instance
export const batteryOptimizer = BatteryOptimizer.getInstance();