import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { SubscriptionScreen } from '../screens/subscription/SubscriptionScreen';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { offlineQueue } from '../services/offlineQueueService';

const Stack = createStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['callwall://'],
  config: {
    screens: {
      Auth: {
        screens: {
          VerifyEmail: 'auth/verify-email',
          ResetPassword: 'auth/reset-password'
        }
      },
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Legal: 'legal',
              Voicemail: 'voicemail',
              Phone: 'phone',
              Voice: 'voice',
              Profile: 'profile'
            }
          }
        }
      }
    }
  }
};

export function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Initialize offline queue service when app starts
    offlineQueue.initialize();

    return () => {
      offlineQueue.cleanup();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            // Auth Stack
            <Stack.Group>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </Stack.Group>
          ) : (
            // Main Stack
            <>
              <Stack.Group>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              </Stack.Group>
              {/* Modal Screens */}
              <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
              </Stack.Group>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {/* Offline indicator shown on top of all screens when user is authenticated */}
      {isAuthenticated && <OfflineIndicator />}
    </>
  );
}
