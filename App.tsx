import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings that are common in React Native development
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Setting a timer for a long period of time',
  'componentWillReceiveProps has been renamed',
]);

// Add custom error handling for development
if (__DEV__) {
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#1e3c72"
            translucent={false}
          />
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}