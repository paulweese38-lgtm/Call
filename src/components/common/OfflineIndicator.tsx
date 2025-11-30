// Offline Indicator Component
// Shows a banner when the user is offline with queue status

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { offlineQueue } from '../../services/offlineQueueService';
import type { QueuedOperation } from '../../services/offlineQueueService';

export function OfflineIndicator() {
  const { isConnected } = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedOperation[]>([]);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribeToQueue(setQueue);
    return unsubscribe;
  }, []);

  const pendingCount = queue.filter((op) => op.status === 'pending').length;
  const processingCount = queue.filter((op) => op.status === 'processing').length;

  if (isConnected && pendingCount === 0 && processingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, isConnected ? styles.syncing : styles.offline]}>
      <View style={styles.content}>
        {!isConnected ? (
          <>
            <Text style={styles.icon}>📡</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Offline Mode</Text>
              {pendingCount > 0 && (
                <Text style={styles.subtitle}>
                  {pendingCount} operation{pendingCount !== 1 ? 's' : ''} queued
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.icon}>🔄</Text>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Syncing...</Text>
              <Text style={styles.subtitle}>
                Processing {processingCount + pendingCount} operation
                {processingCount + pendingCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offline: {
    backgroundColor: '#F59E0B',
  },
  syncing: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
});
