/**
 * Comprehensive Offline Management System
 * Enables seamless app functionality without internet connectivity
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfo } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Types
export interface OfflineQueueItem {
  id: string;
  type: 'api_request' | 'user_action' | 'data_sync';
  endpoint?: string;
  method?: string;
  data?: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface OfflineData {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  size: number;
  version: string;
  tags: string[];
  syncStatus: 'synced' | 'pending' | 'conflict' | 'local_only';
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  retryBackoffMultiplier: number;
  maxRetryDelay: number;
  batchSize: number;
  conflictResolution: 'local_wins' | 'remote_wins' | 'manual';
}

export interface ConflictResolution {
  id: string;
  itemType: string;
  itemId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: Date;
  resolution: 'pending' | 'local' | 'remote' | 'merged';
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface OfflineCapabilities {
  canAccessComplaints: boolean;
  canAccessCallRecords: boolean;
  canAccessScamDatabase: boolean;
  canAccessLegalResources: boolean;
  canCreateComplaints: boolean;
  canRecordCalls: boolean;
  canReportScams: boolean;
  canAccessEmergencyContacts: boolean;
}

/**
 * Offline Manager - Comprehensive offline functionality
 */
export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private queue: OfflineQueueItem[] = [];
  private cache: Map<string, OfflineData> = new Map();
  private syncInterval?: NodeJS.Timeout;
  private config: SyncConfig;
  private conflicts: ConflictResolution[] = [];
  private capabilities: OfflineCapabilities;
  private totalCacheSize: number = 0;
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB

  private constructor() {
    this.config = {
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 5,
      retryBackoffMultiplier: 2,
      maxRetryDelay: 300000, // 5 minutes
      batchSize: 10,
      conflictResolution: 'local_wins'
    };

    this.capabilities = {
      canAccessComplaints: true,
      canAccessCallRecords: true,
      canAccessScamDatabase: false, // Requires fresh data
      canAccessLegalResources: true,
      canCreateComplaints: true,
      canRecordCalls: true,
      canReportScams: true,
      canAccessEmergencyContacts: true
    };

    this.initialize();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Load stored data
      await this.loadOfflineData();
      await this.loadQueue();
      await this.loadConflicts();

      // Initialize network monitoring
      this.startNetworkMonitoring();

      // Start sync process if enabled
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      console.log('📱 Offline Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing Offline Manager:', error);
    }
  }

  // NETWORK MONITORING
  private startNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('🌐 Back online - starting sync process');
        this.processSyncQueue();
      }

      if (this.isOnline) {
        console.log('📶 Online');
      } else {
        console.log('📶 Offline - using offline capabilities');
      }
    });
  }

  // DATA CACHING
  async cacheData(key: string, data: any, options: {
    ttl?: number; // in milliseconds
    tags?: string[];
    version?: string;
    syncStatus?: 'synced' | 'pending' | 'conflict' | 'local_only';
  } = {}): Promise<void> {
    try {
      const ttl = options.ttl || 86400000; // 24 hours default
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl);

      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;

      // Check cache size limit
      if (this.totalCacheSize + size > this.maxCacheSize) {
        await this.cleanupCache();
      }

      const offlineData: OfflineData = {
        key,
        data,
        timestamp: now,
        expiresAt,
        size,
        version: options.version || '1.0',
        tags: options.tags || [],
        syncStatus: options.syncStatus || 'synced'
      };

      this.cache.set(key, offlineData);
      this.totalCacheSize += size;

      // Persist to AsyncStorage
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(offlineData));

      console.log(`💾 Cached data: ${key} (${Math.round(size / 1024)}KB)`);
    } catch (error) {
      console.error('❌ Error caching data:', error);
      throw error;
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      // Check memory cache first
      const cached = this.cache.get(key);
      if (cached) {
        // Check if expired
        if (cached.expiresAt < new Date()) {
          this.cache.delete(key);
          await AsyncStorage.removeItem(`cache_${key}`);
          console.log(`⏰ Cache expired: ${key}`);
          return null;
        }

        console.log(`📦 Cache hit: ${key}`);
        return cached.data;
      }

      // Check persisted cache
      const persistedData = await AsyncStorage.getItem(`cache_${key}`);
      if (persistedData) {
        const offlineData: OfflineData = JSON.parse(persistedData);

        if (offlineData.expiresAt < new Date()) {
          await AsyncStorage.removeItem(`cache_${key}`);
          return null;
        }

        // Load into memory cache
        this.cache.set(key, offlineData);
        console.log(`💾 Cache loaded from storage: ${key}`);
        return offlineData.data;
      }

      console.log(`❌ Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ Error getting cached data:', error);
      return null;
    }
  }

  async invalidateCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Invalidate cache entries matching pattern
        for (const [key, data] of this.cache.entries()) {
          if (key.includes(pattern) || data.tags.some(tag => tag.includes(pattern))) {
            this.cache.delete(key);
            await AsyncStorage.removeItem(`cache_${key}`);
            this.totalCacheSize -= data.size;
          }
        }
      } else {
        // Clear all cache
        this.cache.clear();
        this.totalCacheSize = 0;

        // Clear persisted cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
      }

      console.log(`🧹 Cache invalidated${pattern ? ` (pattern: ${pattern})` : ''}`);
    } catch (error) {
      console.error('❌ Error invalidating cache:', error);
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      // Sort by expiration and last used
      const entries = Array.from(this.cache.entries()).sort((a, b) =>
        a[1].expiresAt.getTime() - b[1].expiresAt.getTime()
      );

      // Remove oldest entries until under limit
      const targetSize = this.maxCacheSize * 0.8; // Remove 20%
      let currentSize = this.totalCacheSize;

      for (const [key, data] of entries) {
        if (currentSize <= targetSize) break;

        this.cache.delete(key);
        await AsyncStorage.removeItem(`cache_${key}`);
        currentSize -= data.size;
        this.totalCacheSize -= data.size;
      }

      console.log(`🧹 Cache cleanup completed - freed ${this.totalCacheSize - currentSize} bytes`);
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  // OFFLINE QUEUE MANAGEMENT
  async queueAction(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const queueItem: OfflineQueueItem = {
        ...item,
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        retryCount: 0
      };

      // Insert based on priority
      const insertIndex = this.queue.findIndex(existing =>
        this.getPriorityValue(existing.priority) < this.getPriorityValue(queueItem.priority)
      );

      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }

      await this.saveQueue();

      console.log(`📤 Action queued: ${queueItem.type} (${queueItem.priority} priority)`);
      return queueItem.id;
    } catch (error) {
      console.error('❌ Error queuing action:', error);
      throw error;
    }
  }

  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) return;

    try {
      console.log(`🔄 Processing sync queue (${this.queue.length} items)`);

      const batchSize = Math.min(this.config.batchSize, this.queue.length);
      const batch = this.queue.slice(0, batchSize);

      for (const item of batch) {
        try {
          await this.processQueueItem(item);
          this.queue = this.queue.filter(q => q.id !== item.id);
        } catch (error) {
          console.error(`❌ Error processing queue item ${item.id}:`, error);
          await this.handleQueueItemError(item, error);
        }
      }

      await this.saveQueue();
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    }
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    try {
      switch (item.type) {
        case 'api_request':
          if (item.endpoint && item.method) {
            await this.executeAPIRequest(item);
          }
          break;

        case 'user_action':
          await this.executeUserAction(item);
          break;

        case 'data_sync':
          await this.executeDataSync(item);
          break;
      }

      console.log(`✅ Processed queue item: ${item.id}`);
    } catch (error) {
      console.error(`❌ Error processing queue item ${item.id}:`, error);
      throw error;
    }
  }

  private async executeAPIRequest(item: OfflineQueueItem): Promise<void> {
    if (!item.endpoint || !item.method || !item.data) {
      throw new Error('Missing required fields for API request');
    }

    const response = await fetch(item.endpoint, {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    console.log(`📡 API request completed: ${item.method} ${item.endpoint}`);
  }

  private async executeUserAction(item: OfflineQueueItem): Promise<void> {
    // Execute user-specific actions
    console.log(`👤 User action executed: ${item.metadata?.action}`);
  }

  private async executeDataSync(item: OfflineQueueItem): Promise<void> {
    // Execute data synchronization
    console.log(`🔄 Data sync executed: ${item.metadata?.syncType}`);
  }

  private async handleQueueItemError(item: OfflineQueueItem, error: any): Promise<void> {
    item.retryCount++;

    if (item.retryCount >= item.maxRetries) {
      console.error(`❌ Max retries exceeded for item ${item.id} - removing from queue`);
      this.queue = this.queue.filter(q => q.id !== item.id);
      return;
    }

    // Calculate retry delay with exponential backoff
    const delay = Math.min(
      item.retryDelay * Math.pow(this.config.retryBackoffMultiplier, item.retryCount),
      this.config.maxRetryDelay
    );

    // Schedule retry
    setTimeout(() => {
      this.processQueueItem(item);
    }, delay);

    console.log(`🔄 Scheduled retry for item ${item.id} (${delay}ms delay)`);
  }

  // CONFLICT RESOLUTION
  async detectConflicts(): Promise<ConflictResolution[]> {
    try {
      // Conflict detection logic would go here
      // This is a simplified version
      const conflicts: ConflictResolution[] = [];

      for (const [key, data] of this.cache.entries()) {
        if (data.syncStatus === 'conflict') {
          conflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemType: 'cached_data',
            itemId: key,
            localVersion: data.data,
            remoteVersion: null, // Would be fetched from server
            timestamp: new Date(),
            resolution: 'pending'
          });
        }
      }

      this.conflicts = conflicts;
      await this.saveConflicts();

      return conflicts;
    } catch (error) {
      console.error('❌ Error detecting conflicts:', error);
      return [];
    }
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any): Promise<void> {
    try {
      const conflict = this.conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      switch (resolution) {
        case 'local':
          // Keep local version
          break;

        case 'remote':
          // Use remote version
          if (conflict.remoteVersion) {
            await this.cacheData(conflict.itemId, conflict.remoteVersion);
          }
          break;

        case 'merged':
          if (mergedData) {
            await this.cacheData(conflict.itemId, mergedData);
          }
          break;
      }

      conflict.resolution = resolution;
      conflict.resolvedAt = new Date();
      conflict.resolvedBy = 'user';

      await this.saveConflicts();
      console.log(`✅ Conflict resolved: ${conflictId} (${resolution})`);
    } catch (error) {
      console.error('❌ Error resolving conflict:', error);
      throw error;
    }
  }

  // OFFLINE CAPABILITIES
  getOfflineCapabilities(): OfflineCapabilities {
    return { ...this.capabilities };
  }

  updateOfflineCapabilities(capabilities: Partial<OfflineCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...capabilities };
    console.log('🔧 Offline capabilities updated');
  }

  async preloadEssentialData(): Promise<void> {
    try {
      console.log('📦 Preloading essential offline data...');

      // Preload critical data
      const essentialData = [
        { key: 'emergency_contacts', data: [], ttl: 604800000 }, // 7 days
        { key: 'consumer_rights', data: [], ttl: 604800000 },
        { key: 'scam_alerts', data: [], ttl: 86400000 }, // 1 day
        { key: 'legal_resources', data: [], ttl: 604800000 },
        { key: 'complaint_templates', data: [], ttl: 604800000 }
      ];

      for (const { key, data, ttl } of essentialData) {
        await this.cacheData(key, data, {
          ttl,
          tags: ['essential', 'offline'],
          syncStatus: 'synced'
        });
      }

      console.log('✅ Essential offline data preloaded');
    } catch (error) {
      console.error('❌ Error preloading essential data:', error);
    }
  }

  // SYNCHRONIZATION
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);

    console.log('🔄 Auto-sync started');
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    console.log('⏹️ Auto-sync stopped');
  }

  async forceSync(): Promise<{
    success: boolean;
    syncedItems: number;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];
      let syncedItems = 0;

      const initialQueueLength = this.queue.length;

      await this.processSyncQueue();

      syncedItems = initialQueueLength - this.queue.length;

      return {
        success: errors.length === 0,
        syncedItems,
        errors
      };
    } catch (error) {
      console.error('❌ Error during force sync:', error);
      return {
        success: false,
        syncedItems: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // PERSISTENCE
  private async loadOfflineData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const offlineData: OfflineData = JSON.parse(data);
            const cacheKey = key.replace('cache_', '');

            // Check if expired
            if (offlineData.expiresAt < new Date()) {
              await AsyncStorage.removeItem(key);
              continue;
            }

            this.cache.set(cacheKey, offlineData);
            this.totalCacheSize += offlineData.size;
          }
        } catch (error) {
          console.error(`❌ Error loading cache item ${key}:`, error);
        }
      }

      console.log(`📦 Loaded ${this.cache.size} cached items`);
    } catch (error) {
      console.error('❌ Error loading offline data:', error);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('offline_queue');
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`📤 Loaded ${this.queue.length} queued items`);
      }
    } catch (error) {
      console.error('❌ Error loading queue:', error);
    }
  }

  private async loadConflicts(): Promise<void> {
    try {
      const conflictsData = await AsyncStorage.getItem('offline_conflicts');
      if (conflictsData) {
        this.conflicts = JSON.parse(conflictsData);
        console.log(`⚠️ Loaded ${this.conflicts.length} conflicts`);
      }
    } catch (error) {
      console.error('❌ Error loading conflicts:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('❌ Error saving queue:', error);
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_conflicts', JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('❌ Error saving conflicts:', error);
    }
  }

  // ANALYTICS
  getOfflineStats(): {
    isOnline: boolean;
    cachedItems: number;
    cacheSize: number;
    queuedItems: number;
    conflicts: number;
    capabilities: OfflineCapabilities;
  } {
    return {
      isOnline: this.isOnline,
      cachedItems: this.cache.size,
      cacheSize: this.totalCacheSize,
      queuedItems: this.queue.length,
      conflicts: this.conflicts.filter(c => c.resolution === 'pending').length,
      capabilities: this.capabilities
    };
  }

  // CONFIGURATION
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.autoSync !== undefined) {
      if (newConfig.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    if (newConfig.syncInterval) {
      this.startAutoSync(); // Restart with new interval
    }

    console.log('⚙️ Offline manager configuration updated');
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  // CLEANUP
  async cleanup(): Promise<void> {
    try {
      this.stopAutoSync();
      await this.cleanupCache();
      console.log('🧹 Offline manager cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();