/**
 * Comprehensive Webhook Management System
 * Handles real-time integrations with external services
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

// Types
export interface Webhook {
  id: string;
  name: string;
  description: string;
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
  isActive: boolean;
  retryPolicy: RetryPolicy;
  filters: WebhookFilter[];
  transformationRules?: TransformationRule[];
  rateLimit?: RateLimit;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  statistics: WebhookStatistics;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // Initial delay in seconds
  backoffMultiplier: number;
  maxDelay: number; // Maximum delay in seconds
  retryableStatusCodes: number[];
}

export interface WebhookFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

export interface TransformationRule {
  sourceField: string;
  targetField: string;
  transformation: 'none' | 'uppercase' | 'lowercase' | 'date_format' | 'extract' | 'custom';
  customFunction?: string; // JavaScript function code
}

export interface RateLimit {
  maxEventsPerSecond: number;
  maxEventsPerMinute: number;
  maxEventsPerHour: number;
}

export interface WebhookStatistics {
  totalSent: number;
  totalSuccess: number;
  totalFailed: number;
  averageResponseTime: number;
  lastSuccessTimestamp?: Date;
  lastFailureTimestamp?: Date;
  recentFailures: Array<{
    timestamp: Date;
    error: string;
    statusCode?: number;
  }>;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  source: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attemptNumber: number;
  url: string;
  payload: any;
  headers: Record<string, string>;
  statusCode?: number;
  response?: string;
  duration: number; // Response time in milliseconds
  timestamp: Date;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  error?: string;
  nextRetryAt?: Date;
}

export interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'complaint' | 'payment' | 'user_action' | 'system' | 'legal' | 'analytics';
  commonEvents: string[];
  recommendedHeaders: Record<string, string>;
  payloadSchema: Record<string, any>;
  variables: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
  }>;
}

export interface EventSubscription {
  id: string;
  userId: string;
  eventType: string;
  filters?: WebhookFilter[];
  isActive: boolean;
  endpoints: string[];
  createdAt: Date;
}

/**
 * Webhook Service - Manages real-time integrations
 */
export class WebhookService {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: Map<string, WebhookDelivery[]> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processingQueue = false;
  private subscribers: Map<string, EventSubscription[]> = new Map();

  constructor() {
    this.loadWebhooks();
    this.startEventProcessor();
  }

  // WEBHOOK MANAGEMENT
  async createWebhook(config: {
    name: string;
    description: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    retryPolicy?: Partial<RetryPolicy>;
    filters?: WebhookFilter[];
    transformationRules?: TransformationRule[];
    rateLimit?: RateLimit;
  }): Promise<Webhook> {
    try {
      const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const secret = this.generateWebhookSecret();

      const webhook: Webhook = {
        id,
        name: config.name,
        description: config.description,
        url: config.url,
        secret,
        events: config.events,
        headers: config.headers || {},
        isActive: true,
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 60,
          backoffMultiplier: 2,
          maxDelay: 3600,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          ...config.retryPolicy
        },
        filters: config.filters || [],
        transformationRules: config.transformationRules || [],
        rateLimit: config.rateLimit,
        createdAt: new Date(),
        updatedAt: new Date(),
        statistics: {
          totalSent: 0,
          totalSuccess: 0,
          totalFailed: 0,
          averageResponseTime: 0,
          recentFailures: []
        }
      };

      this.webhooks.set(id, webhook);
      await this.saveWebhooks();

      console.log(`✅ Webhook created: ${webhook.name}`);
      return webhook;
    } catch (error) {
      console.error('❌ Error creating webhook:', error);
      throw error;
    }
  }

  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook> {
    try {
      const webhook = this.webhooks.get(id);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const updatedWebhook = {
        ...webhook,
        ...updates,
        id,
        updatedAt: new Date()
      };

      this.webhooks.set(id, updatedWebhook);
      await this.saveWebhooks();

      console.log(`✅ Webhook updated: ${updatedWebhook.name}`);
      return updatedWebhook;
    } catch (error) {
      console.error('❌ Error updating webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(id: string): Promise<boolean> {
    try {
      const webhook = this.webhooks.get(id);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      this.webhooks.delete(id);
      this.deliveries.delete(id);
      await this.saveWebhooks();

      console.log(`✅ Webhook deleted: ${webhook.name}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting webhook:', error);
      throw error;
    }
  }

  async getWebhooks(filters?: {
    isActive?: boolean;
    events?: string[];
    search?: string;
  }): Promise<Webhook[]> {
    try {
      let webhooks = Array.from(this.webhooks.values());

      if (filters?.isActive !== undefined) {
        webhooks = webhooks.filter(w => w.isActive === filters.isActive);
      }

      if (filters?.events && filters.events.length > 0) {
        webhooks = webhooks.filter(w =>
          filters.events!.some(event => w.events.includes(event))
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        webhooks = webhooks.filter(w =>
          w.name.toLowerCase().includes(searchLower) ||
          w.description.toLowerCase().includes(searchLower) ||
          w.url.toLowerCase().includes(searchLower)
        );
      }

      return webhooks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('❌ Error fetching webhooks:', error);
      throw error;
    }
  }

  // EVENT PROCESSING
  async triggerEvent(event: {
    eventType: string;
    data: Record<string, any>;
    userId?: string;
    sessionId?: string;
    source: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const webhookEvent: WebhookEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: event.eventType,
        data: event.data,
        timestamp: new Date(),
        userId: event.userId,
        sessionId: event.sessionId,
        source: event.source,
        priority: event.priority || 'normal',
        metadata: event.metadata
      };

      this.eventQueue.push(webhookEvent);

      // Process high and critical priority events immediately
      if (webhookEvent.priority === 'high' || webhookEvent.priority === 'critical') {
        this.processEventQueue();
      }

      console.log(`📡 Event triggered: ${webhookEvent.eventType}`);
    } catch (error) {
      console.error('❌ Error triggering event:', error);
      throw error;
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('❌ Error processing event queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      // Find relevant webhooks
      const relevantWebhooks = Array.from(this.webhooks.values()).filter(webhook =>
        webhook.isActive &&
        webhook.events.includes(event.eventType) &&
        this.matchesFilters(event, webhook.filters)
      );

      // Process each webhook
      const deliveryPromises = relevantWebhooks.map(webhook =>
        this.deliverWebhook(webhook, event)
      );

      await Promise.allSettled(deliveryPromises);

      // Notify subscribers
      await this.notifySubscribers(event);
    } catch (error) {
      console.error('❌ Error processing event:', error);
    }
  }

  private async deliverWebhook(webhook: Webhook, event: WebhookEvent): Promise<void> {
    try {
      // Check rate limits
      if (!this.checkRateLimit(webhook)) {
        console.log(`⚠️ Rate limit exceeded for webhook: ${webhook.name}`);
        return;
      }

      // Prepare payload
      let payload = {
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
        userId: event.userId,
        sessionId: event.sessionId,
        source: event.source,
        priority: event.priority,
        metadata: event.metadata
      };

      // Apply transformations
      if (webhook.transformationRules && webhook.transformationRules.length > 0) {
        payload = this.applyTransformations(payload, webhook.transformationRules);
      }

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'CallDefender-Webhook/1.0',
        'X-Webhook-Event': event.eventType,
        'X-Webhook-ID': event.id,
        'X-Webhook-Timestamp': event.timestamp.getTime().toString(),
        ...webhook.headers
      };

      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;

      // Create delivery record
      const delivery: WebhookDelivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        eventId: event.id,
        attemptNumber: 1,
        url: webhook.url,
        payload,
        headers,
        timestamp: new Date(),
        status: 'pending'
      };

      // Store delivery
      if (!this.deliveries.has(webhook.id)) {
        this.deliveries.set(webhook.id, []);
      }
      this.deliveries.get(webhook.id)!.push(delivery);

      // Make HTTP request
      const startTime = Date.now();
      const response = await this.makeHttpRequest(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const duration = Date.now() - startTime;

      // Update delivery record
      delivery.statusCode = response.status;
      delivery.response = response.data;
      delivery.duration = duration;
      delivery.status = (response.status >= 200 && response.status < 300) ? 'delivered' : 'failed';

      // Update webhook statistics
      webhook.lastTriggered = new Date();
      webhook.statistics.totalSent++;
      if (delivery.status === 'delivered') {
        webhook.statistics.totalSuccess++;
        webhook.statistics.lastSuccessTimestamp = new Date();
      } else {
        webhook.statistics.totalFailed++;
        webhook.statistics.lastFailureTimestamp = new Date();
        webhook.statistics.recentFailures.push({
          timestamp: new Date(),
          error: response.error || `HTTP ${response.status}`,
          statusCode: response.status
        });

        // Keep only last 50 failures
        if (webhook.statistics.recentFailures.length > 50) {
          webhook.statistics.recentFailures = webhook.statistics.recentFailures.slice(-50);
        }

        // Schedule retry if applicable
        if (webhook.retryPolicy.retryableStatusCodes.includes(response.status!)) {
          this.scheduleRetry(webhook, event, delivery);
        }
      }

      // Update average response time
      webhook.statistics.averageResponseTime =
        (webhook.statistics.averageResponseTime * (webhook.statistics.totalSent - 1) + duration) /
        webhook.statistics.totalSent;

      await this.saveWebhooks();

      console.log(`📡 Webhook ${delivery.status === 'delivered' ? 'delivered' : 'failed'}: ${webhook.name} (${response.status})`);
    } catch (error) {
      console.error(`❌ Error delivering webhook ${webhook.name}:`, error);

      // Update webhook statistics
      webhook.statistics.totalFailed++;
      webhook.statistics.lastFailureTimestamp = new Date();
      webhook.statistics.recentFailures.push({
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async scheduleRetry(webhook: Webhook, event: WebhookEvent, originalDelivery: WebhookDelivery): Promise<void> {
    try {
      if (originalDelivery.attemptNumber >= webhook.retryPolicy.maxRetries) {
        console.log(`❌ Max retries exceeded for webhook: ${webhook.name}`);
        return;
      }

      const delay = Math.min(
        webhook.retryPolicy.retryDelay * Math.pow(webhook.retryPolicy.backoffMultiplier, originalDelivery.attemptNumber - 1),
        webhook.retryPolicy.maxDelay
      );

      const retryAt = new Date(Date.now() + delay * 1000);

      const retryDelivery: WebhookDelivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        eventId: event.id,
        attemptNumber: originalDelivery.attemptNumber + 1,
        url: webhook.url,
        payload: originalDelivery.payload,
        headers: originalDelivery.headers,
        timestamp: new Date(),
        status: 'retrying',
        nextRetryAt: retryAt
      };

      this.deliveries.get(webhook.id)!.push(retryDelivery);

      // Schedule retry
      setTimeout(async () => {
        await this.deliverWebhook(webhook, event);
      }, delay * 1000);

      console.log(`🔄 Retry scheduled for webhook: ${webhook.name} (attempt ${retryDelivery.attemptNumber} in ${delay}s)`);
    } catch (error) {
      console.error('❌ Error scheduling webhook retry:', error);
    }
  }

  // UTILITY METHODS
  private matchesFilters(event: WebhookEvent, filters: WebhookFilter[]): boolean {
    if (filters.length === 0) return true;

    return filters.every(filter => {
      const fieldValue = this.getFieldValue(event, filter.field);
      return this.matchesFilterCondition(fieldValue, filter);
    });
  }

  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private matchesFilterCondition(value: any, filter: WebhookFilter): boolean {
    const { operator, filterValue, caseSensitive = true } = filter;

    const prepareValue = (val: any) => {
      if (typeof val === 'string' && !caseSensitive) {
        return val.toLowerCase();
      }
      return val;
    };

    const preparedValue = prepareValue(value);
    const preparedFilterValue = prepareValue(filter.value);

    switch (operator) {
      case 'eq': return preparedValue === preparedFilterValue;
      case 'ne': return preparedValue !== preparedFilterValue;
      case 'gt': return Number(preparedValue) > Number(preparedFilterValue);
      case 'gte': return Number(preparedValue) >= Number(preparedFilterValue);
      case 'lt': return Number(preparedValue) < Number(preparedFilterValue);
      case 'lte': return Number(preparedValue) <= Number(preparedFilterValue);
      case 'in': return Array.isArray(preparedFilterValue) && preparedFilterValue.includes(preparedValue);
      case 'nin': return Array.isArray(preparedFilterValue) && !preparedFilterValue.includes(preparedValue);
      case 'contains': return String(preparedValue).includes(String(preparedFilterValue));
      case 'regex': return new RegExp(preparedFilterValue).test(String(preparedValue));
      default: return false;
    }
  }

  private applyTransformations(payload: any, rules: TransformationRule[]): any {
    try {
      let transformed = { ...payload };

      rules.forEach(rule => {
        const sourceValue = this.getFieldValue(transformed, rule.sourceField);
        let transformedValue = sourceValue;

        switch (rule.transformation) {
          case 'none':
            break;
          case 'uppercase':
            transformedValue = String(sourceValue).toUpperCase();
            break;
          case 'lowercase':
            transformedValue = String(sourceValue).toLowerCase();
            break;
          case 'date_format':
            transformedValue = new Date(sourceValue).toISOString();
            break;
          case 'extract':
            // Simple regex extraction - can be enhanced
            const match = String(sourceValue).match(/\d+/);
            transformedValue = match ? match[0] : sourceValue;
            break;
          case 'custom':
            if (rule.customFunction) {
              // Safe evaluation of custom transformation
              transformedValue = this.evaluateCustomFunction(rule.customFunction, sourceValue);
            }
            break;
        }

        // Set the transformed value
        this.setFieldValue(transformed, rule.targetField, transformedValue);
      });

      return transformed;
    } catch (error) {
      console.error('❌ Error applying transformations:', error);
      return payload;
    }
  }

  private setFieldValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current[key] = current[key] || {}, obj);
    target[lastKey] = value;
  }

  private evaluateCustomFunction(functionCode: string, value: any): any {
    try {
      // Simple function evaluation - in production, use a sandbox
      const func = new Function('value', functionCode);
      return func(value);
    } catch (error) {
      console.error('❌ Error evaluating custom function:', error);
      return value;
    }
  }

  private checkRateLimit(webhook: Webhook): boolean {
    if (!webhook.rateLimit) return true;

    // Simple rate limiting - in production, use a proper rate limiter
    const now = Date.now();
    const recentDeliveries = this.deliveries.get(webhook.id) || [];

    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    const deliveriesPerSecond = recentDeliveries.filter(d => d.timestamp.getTime() > oneSecondAgo).length;
    const deliveriesPerMinute = recentDeliveries.filter(d => d.timestamp.getTime() > oneMinuteAgo).length;
    const deliveriesPerHour = recentDeliveries.filter(d => d.timestamp.getTime() > oneHourAgo).length;

    return deliveriesPerSecond < webhook.rateLimit.maxEventsPerSecond &&
           deliveriesPerMinute < webhook.rateLimit.maxEventsPerMinute &&
           deliveriesPerHour < webhook.rateLimit.maxEventsPerHour;
  }

  private generateWebhookSecret(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return CryptoJS.HmacSHA256(payloadString, secret).toString();
  }

  private async makeHttpRequest(url: string, options: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }): Promise<{ status: number; data: any; error?: string }> {
    try {
      const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
        body: options.body
      });

      const responseText = await response.text();

      return {
        status: response.status,
        data: responseText
      };
    } catch (error) {
      return {
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // EVENT SUBSCRIPTIONS
  async subscribeToEvents(subscription: {
    userId: string;
    eventType: string;
    filters?: WebhookFilter[];
    endpoints: string[];
  }): Promise<EventSubscription> {
    try {
      const eventSubscription: EventSubscription = {
        id: `subscription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: subscription.userId,
        eventType: subscription.eventType,
        filters: subscription.filters || [],
        isActive: true,
        endpoints: subscription.endpoints,
        createdAt: new Date()
      };

      if (!this.subscribers.has(subscription.eventType)) {
        this.subscribers.set(subscription.eventType, []);
      }

      this.subscribers.get(subscription.eventType)!.push(eventSubscription);
      await this.saveSubscriptions();

      console.log(`✅ Event subscription created: ${subscription.eventType} for user ${subscription.userId}`);
      return eventSubscription;
    } catch (error) {
      console.error('❌ Error creating event subscription:', error);
      throw error;
    }
  }

  private async notifySubscribers(event: WebhookEvent): Promise<void> {
    try {
      const subscribers = this.subscribers.get(event.eventType) || [];
      const matchingSubscribers = subscribers.filter(sub =>
        sub.isActive && this.matchesFilters(event, sub.filters)
      );

      for (const subscription of matchingSubscribers) {
        // Notify subscribers via their preferred endpoints
        // This could be WebSocket, Server-Sent Events, etc.
        console.log(`🔔 Notifying subscriber ${subscription.userId} about event ${event.eventType}`);
      }
    } catch (error) {
      console.error('❌ Error notifying subscribers:', error);
    }
  }

  // ANALYTICS AND MONITORING
  async getWebhookAnalytics(timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalEvents: number;
    totalDeliveries: number;
    successRate: number;
    averageResponseTime: number;
    topEvents: Array<{ eventType: string; count: number }>;
    failedDeliveries: WebhookDelivery[];
  }> {
    try {
      const webhooks = Array.from(this.webhooks.values());
      const allDeliveries = Array.from(this.deliveries.values()).flat();

      let filteredDeliveries = allDeliveries;
      if (timeRange) {
        filteredDeliveries = allDeliveries.filter(delivery =>
          delivery.timestamp >= timeRange.startDate && delivery.timestamp <= timeRange.endDate
        );
      }

      const successfulDeliveries = filteredDeliveries.filter(d => d.status === 'delivered');
      const failedDeliveries = filteredDeliveries.filter(d => d.status === 'failed');

      // Count events by type
      const eventCounts = new Map<string, number>();
      filteredDeliveries.forEach(delivery => {
        const event = this.eventQueue.find(e => e.id === delivery.eventId);
        if (event) {
          eventCounts.set(event.eventType, (eventCounts.get(event.eventType) || 0) + 1);
        }
      });

      const topEvents = Array.from(eventCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([eventType, count]) => ({ eventType, count }));

      return {
        totalWebhooks: webhooks.length,
        activeWebhooks: webhooks.filter(w => w.isActive).length,
        totalEvents: this.eventQueue.length,
        totalDeliveries: filteredDeliveries.length,
        successRate: filteredDeliveries.length > 0 ? (successfulDeliveries.length / filteredDeliveries.length) * 100 : 0,
        averageResponseTime: webhooks.reduce((sum, w) => sum + w.statistics.averageResponseTime, 0) / webhooks.length || 0,
        topEvents,
        failedDeliveries: failedDeliveries.slice(0, 50) // Last 50 failures
      };
    } catch (error) {
      console.error('❌ Error getting webhook analytics:', error);
      throw error;
    }
  }

  async getWebhookDeliveries(webhookId: string, filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<WebhookDelivery[]> {
    try {
      const deliveries = this.deliveries.get(webhookId) || [];

      let filteredDeliveries = deliveries;

      if (filters?.status) {
        filteredDeliveries = filteredDeliveries.filter(d => d.status === filters.status);
      }

      if (filters?.startDate) {
        filteredDeliveries = filteredDeliveries.filter(d => d.timestamp >= filters.startDate!);
      }

      if (filters?.endDate) {
        filteredDeliveries = filteredDeliveries.filter(d => d.timestamp <= filters.endDate!);
      }

      // Sort by timestamp (newest first)
      filteredDeliveries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      return filteredDeliveries.slice(offset, offset + limit);
    } catch (error) {
      console.error('❌ Error getting webhook deliveries:', error);
      throw error;
    }
  }

  // WEBHOOK TEMPLATES
  async getWebhookTemplates(category?: string): Promise<WebhookTemplate[]> {
    return [
      {
        id: 'complaint_filed',
        name: 'Complaint Filed',
        description: 'Triggered when a user files a complaint',
        category: 'complaint',
        commonEvents: ['complaint.created', 'complaint.updated', 'complaint.resolved'],
        recommendedHeaders: {
          'X-Event-Type': 'complaint.filed'
        },
        payloadSchema: {
          complaintId: 'string',
          userId: 'string',
          type: 'string',
          description: 'string',
          timestamp: 'string'
        },
        variables: [
          { name: 'complaintId', description: 'Unique complaint identifier', type: 'string', required: true },
          { name: 'type', description: 'Type of complaint', type: 'string', required: true },
          { name: 'description', description: 'Complaint description', type: 'string', required: true }
        ]
      },
      {
        id: 'payment_processed',
        name: 'Payment Processed',
        description: 'Triggered when a payment is processed',
        category: 'payment',
        commonEvents: ['payment.success', 'payment.failed', 'payment.refunded'],
        recommendedHeaders: {
          'X-Event-Type': 'payment.processed'
        },
        payloadSchema: {
          paymentId: 'string',
          userId: 'string',
          amount: 'number',
          currency: 'string',
          status: 'string',
          timestamp: 'string'
        },
        variables: [
          { name: 'paymentId', description: 'Unique payment identifier', type: 'string', required: true },
          { name: 'amount', description: 'Payment amount', type: 'number', required: true },
          { name: 'status', description: 'Payment status', type: 'string', required: true }
        ]
      },
      {
        id: 'user_action',
        name: 'User Action',
        description: 'Triggered when users perform specific actions',
        category: 'user_action',
        commonEvents: ['user.login', 'user.logout', 'user.profile_updated'],
        recommendedHeaders: {
          'X-Event-Type': 'user.action'
        },
        payloadSchema: {
          userId: 'string',
          action: 'string',
          timestamp: 'string',
          metadata: 'object'
        },
        variables: [
          { name: 'userId', description: 'User identifier', type: 'string', required: true },
          { name: 'action', description: 'User action performed', type: 'string', required: true }
        ]
      }
    ];
  }

  // TEST WEBHOOK
  async testWebhook(webhookId: string, testEvent?: {
    eventType: string;
    data: Record<string, any>;
  }): Promise<{ success: boolean; response?: any; error?: string; duration: number }> {
    try {
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const testPayload = testEvent || {
        eventType: 'test.event',
        data: {
          test: true,
          timestamp: new Date().toISOString(),
          webhookId: webhookId
        }
      };

      const event: WebhookEvent = {
        id: `test_${Date.now()}`,
        eventType: testPayload.eventType,
        data: testPayload.data,
        timestamp: new Date(),
        source: 'webhook-test',
        priority: 'normal'
      };

      const startTime = Date.now();
      await this.deliverWebhook(webhook, event);
      const duration = Date.now() - startTime;

      return { success: true, duration };
    } catch (error) {
      console.error('❌ Error testing webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0
      };
    }
  }

  // SECURITY
  async regenerateWebhookSecret(webhookId: string): Promise<string> {
    try {
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      webhook.secret = this.generateWebhookSecret();
      webhook.updatedAt = new Date();

      await this.saveWebhooks();

      console.log(`🔑 Secret regenerated for webhook: ${webhook.name}`);
      return webhook.secret;
    } catch (error) {
      console.error('❌ Error regenerating webhook secret:', error);
      throw error;
    }
  }

  // PERSISTENCE
  private async loadWebhooks(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('webhooks');
      if (data) {
        const webhooksArray = JSON.parse(data);
        webhooksArray.forEach((webhook: Webhook) => {
          this.webhooks.set(webhook.id, webhook);
        });
      }
    } catch (error) {
      console.error('❌ Error loading webhooks:', error);
    }
  }

  private async saveWebhooks(): Promise<void> {
    try {
      const webhooksArray = Array.from(this.webhooks.values());
      await AsyncStorage.setItem('webhooks', JSON.stringify(webhooksArray));
    } catch (error) {
      console.error('❌ Error saving webhooks:', error);
    }
  }

  private async loadSubscriptions(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('event_subscriptions');
      if (data) {
        const subscriptions = JSON.parse(data);
        this.subscribers = new Map(Object.entries(subscriptions));
      }
    } catch (error) {
      console.error('❌ Error loading subscriptions:', error);
    }
  }

  private async saveSubscriptions(): Promise<void> {
    try {
      const subscriptionsObj = Object.fromEntries(this.subscribers);
      await AsyncStorage.setItem('event_subscriptions', JSON.stringify(subscriptionsObj));
    } catch (error) {
      console.error('❌ Error saving subscriptions:', error);
    }
  }

  private startEventProcessor(): void {
    // Process queue every 5 seconds
    setInterval(() => {
      this.processEventQueue();
    }, 5000);
  }

  // HEALTH CHECK
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    queueSize: number;
    processingQueue: boolean;
    activeWebhooks: number;
    recentErrors: string[];
    uptime: number;
  }> {
    try {
      const webhooks = Array.from(this.webhooks.values());
      const recentErrors = webhooks
        .flatMap(w => w.statistics.recentFailures.slice(0, 5))
        .map(f => f.error)
        .slice(0, 10);

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (this.eventQueue.length > 100) {
        status = 'degraded';
      }

      if (this.eventQueue.length > 500 || recentErrors.length > 20) {
        status = 'unhealthy';
      }

      return {
        status,
        queueSize: this.eventQueue.length,
        processingQueue: this.processingQueue,
        activeWebhooks: webhooks.filter(w => w.isActive).length,
        recentErrors,
        uptime: Date.now() // This should be tracked from service start
      };
    } catch (error) {
      console.error('❌ Error getting health status:', error);
      return {
        status: 'unhealthy',
        queueSize: 0,
        processingQueue: false,
        activeWebhooks: 0,
        recentErrors: [error instanceof Error ? error.message : 'Unknown error'],
        uptime: 0
      };
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();