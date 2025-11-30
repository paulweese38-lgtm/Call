# Offline Queue System Guide

## Overview

The CallWall offline queue system allows users to perform operations even when they don't have internet connectivity. Operations are automatically queued when offline and synced when the connection is restored.

## Architecture

### Components

1. **offlineQueueService.ts** - Core queue management
   - Stores operations in AsyncStorage
   - Monitors network connectivity
   - Processes queue when online
   - Handles retries and failures

2. **useNetworkStatus.ts** - React hook for network monitoring
   - Provides real-time network status to components
   - Uses NetInfo to detect connectivity changes

3. **OfflineIndicator.tsx** - UI component
   - Shows offline status banner
   - Displays queue count and sync status
   - Appears at top of app when offline or syncing

4. **offlineQueueHelper.ts** - Utility functions
   - `executeOrQueue()` - Execute immediately if online, queue if offline
   - `isQueued()` - Check if result indicates queued operation
   - `withOfflineQueue()` - Wrap functions for automatic queueing

### Supported Operations

The queue supports these operation types:

- `voicemail_upload` - Upload recorded voicemail
- `voicemail_transcription` - Request voicemail transcription
- `legal_document_generate` - Generate legal document
- `voice_generation` - Generate AI voice
- `threat_analysis` - Analyze communication for threats
- `phone_number_add` - Add phone number to tracking
- `phone_number_block` - Block a phone number

## How It Works

### 1. Automatic Detection

The app automatically detects network status using NetInfo:

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';

function MyComponent() {
  const { isConnected } = useNetworkStatus();

  if (!isConnected) {
    // Show offline message
  }
}
```

### 2. Queueing Operations

When a user performs an action offline, it's automatically queued:

```typescript
import { executeOrQueue } from '../services/offlineQueueHelper';

async function uploadVoicemail(userId, audioUri, phoneNumber, audioHash, duration) {
  const result = await executeOrQueue({
    type: 'voicemail_upload',
    userId,
    payload: { userId, audioUri, phoneNumber, audioHash, duration },
    executeNow: async () => {
      // Actual upload logic here
      return await performUpload(userId, audioUri, phoneNumber, audioHash, duration);
    },
  });

  if (isQueued(result)) {
    // Operation was queued - notify user
    Alert.alert('Offline', 'Your voicemail will be uploaded when you\'re back online');
  } else {
    // Operation succeeded immediately
    Alert.alert('Success', 'Voicemail uploaded successfully');
  }
}
```

### 3. Automatic Syncing

When network connectivity is restored:

1. Queue automatically starts processing
2. OfflineIndicator shows "Syncing..." status
3. Each operation is processed in order
4. Successful operations are removed from queue
5. Failed operations are retried (up to 3 times)
6. User sees success/failure notifications

## Integration Examples

### Example 1: Simple Operation

```typescript
import { offlineQueue } from '../services/offlineQueueService';
import NetInfo from '@react-native-community/netinfo';

async function addPhoneNumber(userId: string, phoneNumber: string, label: string) {
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    // Queue for later
    const queueId = await offlineQueue.addToQueue(
      'phone_number_add',
      { userId, phoneNumber, label },
      userId
    );

    Alert.alert(
      'Offline Mode',
      'Phone number will be added when you\'re back online'
    );

    return { queued: true, queueId };
  }

  // Execute immediately
  return await performAddPhoneNumber(userId, phoneNumber, label);
}
```

### Example 2: Using Helper Function

```typescript
import { executeOrQueue, isQueued } from '../services/offlineQueueHelper';

async function generateVoice(userId: string, personality: string, text: string) {
  const result = await executeOrQueue({
    type: 'voice_generation',
    userId,
    payload: { userId, personality, inputText: text },
    executeNow: async () => {
      // Call Edge Function
      const { data } = await supabase.functions.invoke('generate-voice', {
        body: { userId, personality, inputText: text },
      });
      return data;
    },
  });

  if (isQueued(result)) {
    return {
      success: false,
      message: 'Voice generation queued for when you\'re online',
      queueId: result.queueId,
    };
  }

  return result;
}
```

### Example 3: Wrapper Function

```typescript
import { withOfflineQueue } from '../services/offlineQueueHelper';

// Original function
async function transcribeVoicemail(voicemailId: string, userId: string) {
  const { data } = await supabase.functions.invoke('transcribe-voicemail', {
    body: { voicemailId },
  });
  return data.transcript;
}

// Wrapped version with automatic offline queueing
export const transcribeVoicemailOffline = withOfflineQueue(
  'voicemail_transcription',
  transcribeVoicemail,
  (voicemailId, userId) => userId, // getUserId
  (voicemailId) => ({ voicemailId }) // getPayload
);
```

## UI Integration

### Show Offline Indicator

The `OfflineIndicator` component is already integrated into `AppNavigator.tsx` and automatically appears when:
- User is offline
- Operations are queued
- Operations are syncing

```typescript
// Already integrated in AppNavigator.tsx
{isAuthenticated && <OfflineIndicator />}
```

### Show Queue Status in Component

```typescript
import { offlineQueue } from '../services/offlineQueueService';

function MyComponent() {
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribeToQueue((queue) => {
      setQueueCount(queue.filter(op => op.status === 'pending').length);
    });

    return unsubscribe;
  }, []);

  return (
    <View>
      {queueCount > 0 && (
        <Text>{queueCount} operations queued for sync</Text>
      )}
    </View>
  );
}
```

### Retry Failed Operations

```typescript
import { offlineQueue } from '../services/offlineQueueService';

function QueueManagementScreen() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribeToQueue(setQueue);
    return unsubscribe;
  }, []);

  const failedOperations = queue.filter(op => op.status === 'failed');

  return (
    <View>
      {failedOperations.map(op => (
        <View key={op.id}>
          <Text>{op.type} failed: {op.error}</Text>
          <Button
            title="Retry"
            onPress={() => offlineQueue.retryOperation(op.id)}
          />
        </View>
      ))}
      <Button
        title="Clear All Failed"
        onPress={() => offlineQueue.clearFailedOperations()}
      />
    </View>
  );
}
```

## Queue Persistence

The queue is stored in AsyncStorage using the key `@callwall_offline_queue`. This ensures:
- Operations survive app restarts
- Queue is preserved even if app is force-closed
- Operations will eventually sync when online

**Storage Structure:**

```json
[
  {
    "id": "1638360000000_abc123",
    "type": "voicemail_upload",
    "payload": {
      "userId": "user-123",
      "audioUri": "file:///...",
      "phoneNumber": "+1234567890",
      "audioHash": "sha256...",
      "duration": 45
    },
    "userId": "user-123",
    "timestamp": 1638360000000,
    "retryCount": 0,
    "status": "pending"
  }
]
```

## Error Handling

### Retry Strategy

1. **Initial Attempt**: Operation is tried immediately
2. **Retry 1**: After 2 seconds if failed
3. **Retry 2**: After 2 seconds if failed again
4. **Retry 3**: After 2 seconds (final attempt)
5. **Mark as Failed**: After 3 failed attempts

### Failed Operation Behavior

When an operation fails after 3 retries:
- Status set to 'failed'
- Error message stored in operation
- Operation remains in queue for manual retry
- User can view failed operations
- User can manually retry or clear failed operations

### Common Errors

**"Not authenticated"**
- User's auth token expired while offline
- Solution: User must log in again, then retry operation

**"Audio file not found"**
- Temporary file was deleted (iOS cleanup)
- Solution: Re-record voicemail

**"Network timeout"**
- Server didn't respond in time
- Solution: Automatic retry will happen

**"Invalid request"**
- Payload data is invalid or corrupted
- Solution: Operation must be removed from queue

## Best Practices

### 1. Inform Users About Offline Mode

```typescript
if (!isConnected) {
  Alert.alert(
    'Offline Mode',
    'You\'re currently offline. Your changes will be saved and synced when you\'re back online.',
    [{ text: 'OK' }]
  );
}
```

### 2. Show Queue Count

Display pending operations count in relevant screens:

```typescript
const pendingCount = offlineQueue.getPendingCount();

if (pendingCount > 0) {
  return (
    <Badge value={pendingCount} status="warning">
      {pendingCount} pending sync
    </Badge>
  );
}
```

### 3. Handle Queued Results

Always check if an operation was queued vs executed:

```typescript
const result = await someOperation();

if (isQueued(result)) {
  // Show "queued for sync" message
  navigation.goBack(); // Don't wait for result
} else {
  // Show success with actual result
  showSuccessMessage(result);
}
```

### 4. Don't Queue Everything

Some operations should NOT be queued:
- Login/logout (requires immediate feedback)
- Fetching data (user needs it now)
- Real-time features (by definition need connectivity)
- Operations with user-provided files that might be deleted

### 5. Clear Queue on Logout

```typescript
// In logout function
await offlineQueue.clearFailedOperations();
// Consider clearing all operations for privacy
```

## Testing Offline Mode

### Enable Airplane Mode

1. Open device settings
2. Enable Airplane Mode
3. Test operations in app
4. Disable Airplane Mode
5. Verify operations sync automatically

### Simulate Network Errors

```typescript
// Temporarily block Supabase requests
supabase.functions.invoke = async () => {
  throw new Error('Network error');
};

// Test operation
await someOperation();

// Restore
delete supabase.functions.invoke;
```

### Check Queue Contents

```typescript
const queue = offlineQueue.getQueue();
console.log('Current queue:', queue);
```

## Monitoring and Debugging

### Enable Detailed Logging

```typescript
// In offlineQueueService.ts, add logging:
console.log('[Queue] Adding operation:', operation);
console.log('[Queue] Processing:', operation.id);
console.log('[Queue] Success:', operation.id);
console.log('[Queue] Failed:', operation.id, error);
```

### View Queue in Development

Add a debug screen:

```typescript
function QueueDebugScreen() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribeToQueue(setQueue);
    return unsubscribe;
  }, []);

  return (
    <ScrollView>
      <Text>Queue Size: {queue.length}</Text>
      <Text>Pending: {queue.filter(op => op.status === 'pending').length}</Text>
      <Text>Failed: {queue.filter(op => op.status === 'failed').length}</Text>

      {queue.map(op => (
        <View key={op.id}>
          <Text>Type: {op.type}</Text>
          <Text>Status: {op.status}</Text>
          <Text>Retries: {op.retryCount}</Text>
          {op.error && <Text>Error: {op.error}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
```

## Performance Considerations

### Queue Size Limits

Consider adding a maximum queue size:

```typescript
const MAX_QUEUE_SIZE = 50;

if (this.queue.length >= MAX_QUEUE_SIZE) {
  throw new Error('Queue is full. Please sync pending operations before adding more.');
}
```

### Memory Usage

Large payloads (audio files, images) should be stored as file URIs, not as base64:

```typescript
// Good
payload: { audioUri: 'file:///path/to/audio.mp3' }

// Bad (uses too much memory)
payload: { audioData: 'base64_encoded_audio_data_here...' }
```

### Background Processing

Consider using `expo-task-manager` for background queue processing:

```typescript
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('SYNC_QUEUE', async () => {
  await offlineQueue.processQueue();
  return BackgroundFetch.Result.NewData;
});
```

## Security Considerations

### Sensitive Data

Don't queue operations containing sensitive data that shouldn't be persisted:
- Credit card numbers
- Passwords
- Social security numbers

### User Privacy

Clear queue on logout to respect user privacy:

```typescript
async function logout() {
  await offlineQueue.cleanup();
  await AsyncStorage.removeItem('@callwall_offline_queue');
  // Continue with logout...
}
```

---

**Status**: Fully Implemented
**Last Updated**: 2025-11-30
