import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NativeBaseProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
