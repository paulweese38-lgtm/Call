// Offline Queue Service
// Handles queueing operations when offline and syncing when online

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

const QUEUE_STORAGE_KEY = '@callwall_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export type QueueOperationType =
  | 'voicemail_upload'
  | 'voicemail_transcription'
  | 'legal_document_generate'
  | 'voice_generation'
  | 'threat_analysis'
  | 'phone_number_add'
  | 'phone_number_block';

export interface QueuedOperation {
  id: string;
  type: QueueOperationType;
  payload: any;
  userId: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedOperation[]) => void> = [];
  private networkUnsubscribe: (() => void) | null = null;

  async initialize() {
    // Load queue from storage
    await this.loadQueue();

    // Listen for network changes
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    });

    // Process queue if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }
  }

  async cleanup() {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }

  private async loadQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  async addToQueue(
    type: QueueOperationType,
    payload: any,
    userId: string
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      userId,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(operation);
    await this.saveQueue();

    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }

    return operation.id;
  }

  async processQueue() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;

    // Check if online
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('Offline - skipping queue processing');
      return;
    }

    this.isProcessing = true;

    const pendingOperations = this.queue.filter((op) => op.status === 'pending');

    for (const operation of pendingOperations) {
      try {
        // Update status to processing
        operation.status = 'processing';
        await this.saveQueue();

        // Process based on type
        await this.processOperation(operation);

        // Mark as completed
        operation.status = 'completed';
        await this.saveQueue();

        // Remove completed operation after a delay (for UI to show success)
        setTimeout(() => {
          this.removeOperation(operation.id);
        }, 3000);
      } catch (error) {
        console.error(`Failed to process operation ${operation.id}:`, error);

        operation.retryCount++;
        operation.error = error instanceof Error ? error.message : 'Unknown error';

        if (operation.retryCount >= MAX_RETRY_ATTEMPTS) {
          operation.status = 'failed';
        } else {
          operation.status = 'pending';
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }

        await this.saveQueue();
      }
    }

    this.isProcessing = false;
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'voicemail_upload':
        await this.processVoicemailUpload(operation);
        break;

      case 'voicemail_transcription':
        await this.processVoicemailTranscription(operation);
        break;

      case 'legal_document_generate':
        await this.processLegalDocumentGenerate(operation);
        break;

      case 'voice_generation':
        await this.processVoiceGeneration(operation);
        break;

      case 'threat_analysis':
        await this.processThreatAnalysis(operation);
        break;

      case 'phone_number_add':
        await this.processPhoneNumberAdd(operation);
        break;

      case 'phone_number_block':
        await this.processPhoneNumberBlock(operation);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async processVoicemailUpload(operation: QueuedOperation): Promise<void> {
    const { uploadVoicemail } = await import('./voicemailService');
    const { userId, audioUri, phoneNumber, audioHash, duration } = operation.payload;
    await uploadVoicemail(userId, audioUri, phoneNumber, audioHash, duration);
  }

  private async processVoicemailTranscription(operation: QueuedOperation): Promise<void> {
    const { transcribeVoicemail } = await import('./voicemailService');
    const { voicemailId } = operation.payload;
    await transcribeVoicemail(voicemailId);
  }

  private async processLegalDocumentGenerate(operation: QueuedOperation): Promise<void> {
    const { saveDocument } = await import('./legalDocumentService');
    const { userId, documentType, formData, documentText, pdfUrl } = operation.payload;
    await saveDocument(userId, documentType, formData, documentText, pdfUrl);
  }

  private async processVoiceGeneration(operation: QueuedOperation): Promise<void> {
    const { generateVoice } = await import('./voiceService');
    const { userId, personality, inputText, customSettings } = operation.payload;
    await generateVoice(userId, personality, inputText, customSettings);
  }

  private async processThreatAnalysis(operation: QueuedOperation): Promise<void> {
    const { analyzeWithAI } = await import('./threatAnalysisService');
    const { communicationText, userTier, context } = operation.payload;
    await analyzeWithAI(communicationText, userTier, context);
  }

  private async processPhoneNumberAdd(operation: QueuedOperation): Promise<void> {
    const { addPhoneNumber } = await import('./phoneService');
    const { userId, phoneNumber, label, notes } = operation.payload;
    await addPhoneNumber(userId, phoneNumber, label, notes);
  }

  private async processPhoneNumberBlock(operation: QueuedOperation): Promise<void> {
    const { blockPhoneNumber } = await import('./phoneService');
    const { phoneNumberId } = operation.payload;
    await blockPhoneNumber(phoneNumberId);
  }

  async removeOperation(operationId: string) {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    await this.saveQueue();
  }

  async clearFailedOperations() {
    this.queue = this.queue.filter((op) => op.status !== 'failed');
    await this.saveQueue();
  }

  async retryOperation(operationId: string) {
    const operation = this.queue.find((op) => op.id === operationId);
    if (operation) {
      operation.status = 'pending';
      operation.retryCount = 0;
      operation.error = undefined;
      await this.saveQueue();

      // Process immediately
      this.processQueue();
    }
  }

  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.filter((op) => op.status === 'pending').length;
  }

  getFailedCount(): number {
    return this.queue.filter((op) => op.status === 'failed').length;
  }

  subscribeToQueue(listener: (queue: QueuedOperation[]) => void) {
    this.listeners.push(listener);
    listener(this.queue); // Immediately notify with current queue

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.queue));
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueService();
