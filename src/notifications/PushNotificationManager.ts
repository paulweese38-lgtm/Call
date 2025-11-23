/**
 * Comprehensive Push Notification System
 * Manages push notifications, in-app messages, and user preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, PermissionsAndroid, DeviceInfo } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Types
export interface NotificationPreferences {
  enabled: boolean;
  categories: NotificationCategory[];
  quietHours: QuietHours;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  priority: NotificationPriority;
}

export interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  sound?: string;
  vibrationPattern?: number[];
  badge?: boolean;
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
  sound?: string;
  vibrationPattern?: number[];
  badge?: boolean;
  lightColor?: string;
  lightOnMs?: number;
  lightOffMs?: number;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  days: number[];    // 0-6 (Sunday-Saturday)
  exceptions: string[]; // Category IDs that override quiet hours
}

export interface NotificationPriority {
  immediate: string[]; // Category IDs that bypass quiet hours
  high: string[];      // Category IDs with high priority
  normal: string[];    // Category IDs with normal priority
  low: string[];       // Category IDs with low priority
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger: Notifications.NotificationTriggerInput;
  categoryId: string;
  priority: NotificationPriorityLevel;
  sound?: string;
  vibrationPattern?: number[];
  badge?: number;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
  categoryId: string;
  actionTaken?: string;
  imageUrl?: string;
  actionUrl?: string;
}

export type NotificationPriorityLevel = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  titleTemplate: string;
  bodyTemplate: string;
  dataTemplate?: Record<string, any>;
  variables: NotificationVariable[];
  sound?: string;
  vibrationPattern?: number[];
  badge?: boolean;
}

export interface NotificationVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * Push Notification Manager - Comprehensive notification system
 */
export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private preferences: NotificationPreferences;
  private notificationHistory: NotificationHistory[] = [];
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private deviceToken: string | null = null;
  private isInitialized = false;

  private constructor() {
    // Initialize default notification preferences
    this.preferences = this.getDefaultPreferences();
    this.initializeDefaultTemplates();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // INITIALIZATION
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      console.log('🔔 Initializing Push Notification Manager...');

      // Load preferences
      await this.loadPreferences();
      await this.loadNotificationHistory();

      // Configure notification settings
      await this.configureNotificationSettings();

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Notification permissions not granted');
        return;
      }

      // Get device token
      await this.getDeviceToken();

      // Set up notification handlers
      this.setupNotificationHandlers();

      // Set up notification channels
      await this.setupNotificationChannels();

      this.isInitialized = true;
      console.log('✅ Push Notification Manager initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Push Notification Manager:', error);
      throw error;
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      categories: [
        {
          id: 'complaint_updates',
          name: 'Complaint Updates',
          description: 'Updates on your filed complaints',
          enabled: true,
          priority: 'high',
          channels: [
            {
              id: 'complaint_status',
              name: 'Status Changes',
              description: 'When complaint status changes',
              importance: 'high',
              sound: 'default',
              badge: true
            },
            {
              id: 'complaint_response',
              name: 'Agency Responses',
              description: 'When agencies respond to complaints',
              importance: 'high',
              sound: 'default',
              badge: true
            }
          ]
        },
        {
          id: 'scam_alerts',
          name: 'Scam Alerts',
          description: 'New scam warnings and alerts',
          enabled: true,
          priority: 'critical',
          channels: [
            {
              id: 'scam_warning',
              name: 'Scam Warnings',
              description: 'New scam alerts in your area',
              importance: 'max',
              sound: 'alert',
              badge: true,
              lightColor: '#FF0000'
            }
          ]
        },
        {
          id: 'call_protection',
          name: 'Call Protection',
          description: 'Call screening and blocking notifications',
          enabled: true,
          priority: 'high',
          channels: [
            {
              id: 'blocked_call',
              name: 'Blocked Calls',
              description: 'When calls are blocked',
              importance: 'normal',
              sound: 'simple'
            },
            {
              id: 'suspicious_call',
              name: 'Suspicious Calls',
              description: 'When suspicious calls are detected',
              importance: 'high',
              sound: 'alert'
            }
          ]
        },
        {
          id: 'legal_updates',
          name: 'Legal Updates',
          description: 'Legal resource updates and tips',
          enabled: true,
          priority: 'normal',
          channels: [
            {
              id: 'legal_tips',
              name: 'Legal Tips',
              description: 'Helpful legal tips and advice',
              importance: 'low',
              sound: 'default'
            },
            {
              id: 'resource_updates',
              name: 'Resource Updates',
              description: 'New legal resources available',
              importance: 'normal',
              sound: 'default'
            }
          ]
        },
        {
          id: 'system',
          name: 'System',
          description: 'App updates and system notifications',
          enabled: true,
          priority: 'normal',
          channels: [
            {
              id: 'app_updates',
              name: 'App Updates',
              description: 'New features and improvements',
              importance: 'low',
              sound: 'default'
            },
            {
              id: 'security',
              name: 'Security',
              description: 'Security alerts and updates',
              importance: 'high',
              sound: 'alert',
              badge: true
            }
          ]
        }
      ],
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        days: [1, 2, 3, 4, 5], // Monday-Friday
        exceptions: ['scam_alerts', 'call_protection']
      },
      soundEnabled: true,
      vibrationEnabled: true,
      badgeEnabled: true,
      priority: {
        immediate: ['scam_alerts', 'security'],
        high: ['complaint_updates', 'call_protection'],
        normal: ['legal_updates'],
        low: ['app_updates']
      }
    };
  }

  private async configureNotificationSettings(): Promise<void> {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: this.preferences.soundEnabled,
        shouldSetBadge: this.preferences.badgeEnabled,
      }),
    });
  }

  private async requestPermissions(): Promise<boolean> {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }
        return false;
      }
    } else {
      Alert.alert('Must use physical device for Push Notifications');
      return false;
    }

    return true;
  }

  private async getDeviceToken(): Promise<void> {
    try {
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        this.deviceToken = token.data;
        console.log('📱 Device token:', this.deviceToken);
        await this.saveDeviceToken();
      }
    } catch (error) {
      console.error('❌ Error getting device token:', error);
    }
  }

  private setupNotificationHandlers(): void {
    // Handle notification received
    Notifications.addNotificationReceivedListener((notification) => {
      this.handleNotificationReceived(notification);
    });

    // Handle notification response (user taps)
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationResponse(response);
    });
  }

  private async setupNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    for (const category of this.preferences.categories) {
      for (const channel of category.channels) {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: this.getImportanceLevel(channel.importance),
          sound: channel.sound || 'default',
          vibrationPattern: channel.vibrationPattern,
          enableLights: !!channel.lightColor,
          lightColor: channel.lightColor,
          enableVibrate: this.preferences.vibrationEnabled,
          badgeCountType: this.preferences.badgeEnabled ? 'count' : 'none',
        });
      }
    }
  }

  private getImportanceLevel(importance: string): Notifications.AndroidImportance {
    switch (importance) {
      case 'none': return Notifications.AndroidImportance.MIN;
      case 'min': return Notifications.AndroidImportance.MIN;
      case 'low': return Notifications.AndroidImportance.LOW;
      case 'default': return Notifications.AndroidImportance.DEFAULT;
      case 'high': return Notifications.AndroidImportance.HIGH;
      case 'max': return Notifications.AndroidImportance.MAX;
      default: return Notifications.AndroidImportance.DEFAULT;
    }
  }

  // NOTIFICATION MANAGEMENT
  async sendNotification(options: {
    title: string;
    body: string;
    data?: Record<string, any>;
    categoryId: string;
    channelId?: string;
    priority?: NotificationPriorityLevel;
    sound?: string;
    vibrationPattern?: number[];
    badge?: number;
    imageUrl?: string;
    actionUrl?: string;
  }): Promise<string> {
    try {
      if (!this.preferences.enabled) {
        console.log('🔔 Notifications disabled - skipping');
        return '';
      }

      const category = this.preferences.categories.find(c => c.id === options.categoryId);
      if (!category || !category.enabled) {
        console.log(`🔔 Category ${options.categoryId} disabled - skipping`);
        return '';
      }

      // Check quiet hours
      if (this.isQuietHours(options.categoryId, options.priority)) {
        console.log('🔔 Quiet hours - notification scheduled for later');
        return await this.scheduleNotificationForLater(options);
      }

      const channelId = options.channelId || category.channels[0]?.id || 'default';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: {
            ...options.data,
            categoryId: options.categoryId,
            actionUrl: options.actionUrl,
          },
          sound: options.sound || 'default',
          vibrationPattern: options.vibrationPattern,
          badge: options.badge,
        },
        trigger: null, // Immediate notification
        identifier: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      // Add to history
      const historyItem: NotificationHistory = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: options.title,
        body: options.body,
        data: options.data,
        timestamp: new Date(),
        read: false,
        categoryId: options.categoryId,
        imageUrl: options.imageUrl,
        actionUrl: options.actionUrl,
      };

      this.notificationHistory.unshift(historyItem);
      await this.saveNotificationHistory();

      console.log('🔔 Notification sent:', options.title);
      return historyItem.id;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  }

  async sendBulkNotification(notifications: Array<{
    title: string;
    body: string;
    data?: Record<string, any>;
    categoryId: string;
  }>): Promise<string[]> {
    const results: string[] = [];

    for (const notification of notifications) {
      try {
        const id = await this.sendNotification(notification);
        results.push(id);
      } catch (error) {
        console.error('❌ Error sending bulk notification:', error);
        results.push('');
      }
    }

    return results;
  }

  private async scheduleNotificationForLater(options: any): Promise<string> {
    // Schedule notification after quiet hours
    const quietHours = this.preferences.quietHours;
    const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(endHour, endMinute, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const trigger = new Date(scheduledTime);

    return await this.scheduleNotification({
      ...options,
      trigger,
      categoryId: options.categoryId,
      priority: options.priority || 'normal',
    });
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound || 'default',
          vibrationPattern: notification.vibrationPattern,
          badge: notification.badge,
        },
        trigger: notification.trigger,
        identifier: notification.id,
      });

      this.scheduledNotifications.set(identifier, notification);
      await this.saveScheduledNotifications();

      console.log('🔔 Notification scheduled:', notification.title);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      this.scheduledNotifications.delete(identifier);
      await this.saveScheduledNotifications();

      console.log('🔔 Scheduled notification cancelled:', identifier);
    } catch (error) {
      console.error('❌ Error cancelling scheduled notification:', error);
    }
  }

  // TEMPLATE SYSTEM
  async createTemplate(template: NotificationTemplate): Promise<void> {
    this.templates.set(template.id, template);
    await this.saveTemplates();
    console.log('📋 Notification template created:', template.name);
  }

  async sendFromTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Validate required variables
      for (const variable of template.variables) {
        if (variable.required && !variables[variable.name]) {
          throw new Error(`Required variable missing: ${variable.name}`);
        }
      }

      // Replace template variables
      const title = this.replaceTemplateVariables(template.titleTemplate, variables);
      const body = this.replaceTemplateVariables(template.bodyTemplate, variables);
      const data = template.dataTemplate ?
        this.replaceTemplateData(template.dataTemplate, variables) : undefined;

      return await this.sendNotification({
        title,
        body,
        data,
        categoryId: template.categoryId,
        sound: template.sound,
        vibrationPattern: template.vibrationPattern,
        badge: template.badge ? 1 : undefined,
      });
    } catch (error) {
      console.error('❌ Error sending from template:', error);
      throw error;
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  private replaceTemplateData(template: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        result[key] = this.replaceTemplateVariables(value, variables);
      } else if (typeof value === 'object') {
        result[key] = this.replaceTemplateData(value, variables);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  // NOTIFICATION HANDLERS
  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    console.log('🔔 Notification received:', notification.request.content.title);

    // Add to history if not already there
    const { title, body, data } = notification.request.content;
    const categoryId = data?.categoryId;

    const existingHistory = this.notificationHistory.find(h =>
      h.title === title && h.body === body && h.categoryId === categoryId
    );

    if (!existingHistory) {
      const historyItem: NotificationHistory = {
        id: notification.request.identifier,
        title: title || '',
        body: body || '',
        data,
        timestamp: new Date(),
        read: false,
        categoryId: categoryId || 'system',
        actionUrl: data?.actionUrl,
      };

      this.notificationHistory.unshift(historyItem);
      await this.saveNotificationHistory();
    }
  }

  private async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    console.log('🔔 Notification response received:', response.notification.request.content.title);

    const notificationId = response.notification.request.identifier;
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data;

    // Update history
    const historyItem = this.notificationHistory.find(h => h.id === notificationId);
    if (historyItem) {
      historyItem.read = true;
      historyItem.actionTaken = actionId;
      await this.saveNotificationHistory();
    }

    // Handle action
    if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // User tapped notification
      if (data?.actionUrl) {
        // Handle navigation to action URL
        console.log('🔔 Navigating to:', data.actionUrl);
      }
    }

    // Trigger custom action handlers
    this.triggerActionHandlers(actionId, data);
  }

  private triggerActionHandlers(actionId: string, data: any): void {
    // Custom action handlers can be implemented here
    console.log('🔔 Action triggered:', actionId, data);
  }

  // QUIET HOURS
  private isQuietHours(categoryId: string, priority?: NotificationPriorityLevel): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const exceptions = this.preferences.quietHours.exceptions;
    if (exceptions.includes(categoryId)) return false;

    const immediateCategories = this.preferences.priority.immediate;
    if (immediateCategories.includes(categoryId)) return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (!this.preferences.quietHours.days.includes(dayOfWeek)) return false;

    const { startTime, endTime } = this.preferences.quietHours;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // PREFERENCES MANAGEMENT
  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();

      // Update notification channels
      await this.setupNotificationChannels();

      console.log('⚙️ Notification preferences updated');
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }

  async enableCategory(categoryId: string, enabled: boolean): Promise<void> {
    const category = this.preferences.categories.find(c => c.id === categoryId);
    if (category) {
      category.enabled = enabled;
      await this.savePreferences();
      console.log(`🔔 Category ${categoryId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  async updateQuietHours(quietHours: QuietHours): Promise<void> {
    this.preferences.quietHours = quietHours;
    await this.savePreferences();
    console.log('🌙 Quiet hours updated');
  }

  // ANALYTICS
  getNotificationAnalytics(): {
    totalSent: number;
    totalRead: number;
    byCategory: Record<string, { sent: number; read: number }>;
    recentActivity: NotificationHistory[];
    scheduledCount: number;
  } {
    const byCategory: Record<string, { sent: number; read: number }> = {};

    for (const category of this.preferences.categories) {
      const categoryHistory = this.notificationHistory.filter(h => h.categoryId === category.id);
      byCategory[category.id] = {
        sent: categoryHistory.length,
        read: categoryHistory.filter(h => h.read).length,
      };
    }

    return {
      totalSent: this.notificationHistory.length,
      totalRead: this.notificationHistory.filter(h => h.read).length,
      byCategory,
      recentActivity: this.notificationHistory.slice(0, 10),
      scheduledCount: this.scheduledNotifications.size,
    };
  }

  // UTILITY METHODS
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotificationHistory();
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notificationHistory.forEach(n => n.read = true);
    await this.saveNotificationHistory();
  }

  async clearHistory(): Promise<void> {
    this.notificationHistory = [];
    await this.saveNotificationHistory();
    console.log('🧹 Notification history cleared');
  }

  getNotificationHistory(limit?: number): NotificationHistory[] {
    if (limit) {
      return this.notificationHistory.slice(0, limit);
    }
    return this.notificationHistory;
  }

  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  // PERSISTENCE
  private async loadPreferences(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('notification_preferences');
      if (data) {
        const loaded = JSON.parse(data);
        this.preferences = { ...this.getDefaultPreferences(), ...loaded };
      }
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
    }
  }

  private async loadNotificationHistory(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('notification_history');
      if (data) {
        const loaded = JSON.parse(data);
        this.notificationHistory = loaded.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('❌ Error loading notification history:', error);
    }
  }

  private async saveNotificationHistory(): Promise<void> {
    try {
      // Keep only last 1000 notifications
      const limited = this.notificationHistory.slice(0, 1000);
      await AsyncStorage.setItem('notification_history', JSON.stringify(limited));
    } catch (error) {
      console.error('❌ Error saving notification history:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      const data = Array.from(this.scheduledNotifications.entries());
      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving scheduled notifications:', error);
    }
  }

  private async saveTemplates(): Promise<void> {
    try {
      const data = Array.from(this.templates.entries());
      await AsyncStorage.setItem('notification_templates', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving notification templates:', error);
    }
  }

  private async saveDeviceToken(): Promise<void> {
    if (this.deviceToken) {
      await AsyncStorage.setItem('device_token', this.deviceToken);
    }
  }

  private initializeDefaultTemplates(): void {
    // Add default notification templates
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'complaint_status_update',
        name: 'Complaint Status Update',
        description: 'Template for complaint status change notifications',
        categoryId: 'complaint_updates',
        titleTemplate: 'Your Complaint {{complaintId}} Status Updated',
        bodyTemplate: 'Your complaint regarding {{subject}} has been updated to {{status}}.',
        variables: [
          { name: 'complaintId', type: 'string', description: 'Complaint ID', required: true },
          { name: 'subject', type: 'string', description: 'Complaint subject', required: true },
          { name: 'status', type: 'string', description: 'New status', required: true }
        ],
        sound: 'default',
        badge: true
      },
      {
        id: 'scam_alert_new',
        name: 'New Scam Alert',
        description: 'Template for new scam alert notifications',
        categoryId: 'scam_alerts',
        titleTemplate: '⚠️ New Scam Alert: {{scamType}}',
        bodyTemplate: '{{scammers}} are targeting {{victims}} in {{location}}. Stay alert and share this warning.',
        variables: [
          { name: 'scamType', type: 'string', description: 'Type of scam', required: true },
          { name: 'scammers', type: 'string', description: 'Who is running the scam', required: true },
          { name: 'victims', type: 'string', description: 'Target victims', required: true },
          { name: 'location', type: 'string', description: 'Location of scam', required: true }
        ],
        sound: 'alert',
        vibrationPattern: [0, 250, 100, 250],
        badge: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();