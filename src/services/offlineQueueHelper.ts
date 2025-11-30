// Offline Queue Helper
// Utility functions for integrating offline queue with services

import NetInfo from '@react-native-community/netinfo';
import { offlineQueue, QueueOperationType } from './offlineQueueService';

export interface QueueableOperation {
  type: QueueOperationType;
  payload: any;
  userId: string;
  executeNow: () => Promise<any>;
}

/**
 * Execute an operation immediately if online, or queue it for later if offline
 */
export async function executeOrQueue<T>(
  operation: QueueableOperation
): Promise<T | { queued: true; queueId: string }> {
  // Check network status
  const netInfo = await NetInfo.fetch();

  if (netInfo.isConnected) {
    // Online - execute immediately
    try {
      return await operation.executeNow();
    } catch (error) {
      // If execution fails, queue it for retry
      console.error('Operation failed, queueing for retry:', error);
      const queueId = await offlineQueue.addToQueue(
        operation.type,
        operation.payload,
        operation.userId
      );
      return { queued: true, queueId } as any;
    }
  } else {
    // Offline - queue for later
    const queueId = await offlineQueue.addToQueue(
      operation.type,
      operation.payload,
      operation.userId
    );
    return { queued: true, queueId } as any;
  }
}

/**
 * Check if a result indicates the operation was queued
 */
export function isQueued<T>(result: T | { queued: true; queueId: string }): result is { queued: true; queueId: string } {
  return typeof result === 'object' && result !== null && 'queued' in result;
}

/**
 * Wrap a service function to automatically handle offline queueing
 */
export function withOfflineQueue<TArgs extends any[], TResult>(
  type: QueueOperationType,
  fn: (...args: TArgs) => Promise<TResult>,
  getUserId: (...args: TArgs) => string,
  getPayload: (...args: TArgs) => any
) {
  return async (...args: TArgs): Promise<TResult | { queued: true; queueId: string }> => {
    return executeOrQueue({
      type,
      userId: getUserId(...args),
      payload: getPayload(...args),
      executeNow: () => fn(...args),
    });
  };
}
