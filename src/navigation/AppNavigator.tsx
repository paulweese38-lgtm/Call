import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Alert, Linking, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main App Screens (to be created)
import LegalDashboardScreen from '../screens/legal/LegalDashboardScreen';
import VoicemailListScreen from '../screens/voicemail/VoicemailListScreen';
import CallHistoryScreen from '../screens/call/CallHistoryScreen';
import PhoneManagementScreen from '../screens/phone/PhoneManagementScreen';
import VoicePlaygroundScreen from '../screens/voice/VoicePlaygroundScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';

// Types
export type RootStackParamList = {
  AuthStack: undefined;
  MainApp: undefined;
  DocumentViewer: { id: string };
  DocumentGenerator: { type: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  LegalDashboard: undefined;
  CallHistory: undefined;
  Voicemail: undefined;
  Phone: undefined;
  Voice: undefined;
  Profile: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </AuthStack.Navigator>
  );
};

// Main App Tab Navigator
const MainTabNavigator = () => {
  const { user } = useAuthStore();

  const getTabIcon = (focused: boolean, color: string, size: number, routeName: string) => {
    let iconName: string;

    switch (routeName) {
      case 'LegalDashboard':
        iconName = 'gavel';
        break;
      case 'CallHistory':
        iconName = 'history';
        break;
      case 'Voicemail':
        iconName = 'voicemail';
        break;
      case 'Phone':
        iconName = 'phone';
        break;
      case 'Voice':
        iconName = 'record-voice-over';
        break;
      case 'Profile':
        iconName = 'person';
        break;
      default:
        iconName = 'help';
    }

    return <Icon name={iconName} size={size} color={color} />;
  };

  const getTabLabel = (focused: boolean, routeName: string) => {
    switch (routeName) {
      case 'LegalDashboard':
        return 'Legal';
      case 'Voicemail':
        return 'Voicemail';
      case 'Phone':
        return 'Phone';
      case 'Voice':
        return 'Voice';
      case 'Profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  const isPremiumFeature = (routeName: string) => {
    const premiumFeatures = ['Voicemail', 'Voice'];
    return premiumFeatures.includes(routeName) && user?.subscription_tier === 'free';
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabIcon(focused, color, size, route.name),
        tabBarLabel: ({ focused }) => (
          <Text style={[
            appStyles.tabBarLabel,
            { color: focused ? Colors.accent : Colors.textMuted }
          ]}>
            {getTabLabel(focused, route.name)}
          </Text>
        ),
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: appStyles.tabBar,
        headerShown: false,
        tabBarBadge: isPremiumFeature(route.name) ? '🔒' : undefined,
      })}
    >
      <Tab.Screen
        name="LegalDashboard"
        component={LegalDashboardScreen}
        options={{
          title: 'Legal Tools',
        }}
      />
      <Tab.Screen
        name="Voicemail"
        component={VoicemailListScreen}
        options={{
          title: 'Voicemail',
          tabBarBadge: user?.subscription_tier === 'free' ? '🔒' : undefined,
        }}
      />
      <Tab.Screen
        name="Phone"
        component={PhoneManagementScreen}
        options={{
          title: 'Phone',
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoicePlaygroundScreen}
        options={{
          title: 'Voice AI',
          tabBarBadge: user?.subscription_tier === 'free' ? '🔒' : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <View style={appStyles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.accent} />
    <Text style={appStyles.loadingText}>Loading CallWall...</Text>
  </View>
);

// Deep Link Handler
const useDeepLinking = (navigation: any) => {
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (url.includes('auth/callback')) {
        // Handle OAuth callback
        navigation.replace('MainApp');
      } else if (url.includes('auth/reset-password')) {
        // Handle password reset
        navigation.navigate('ForgotPassword');
      } else if (url.includes('document/')) {
        // Handle document sharing
        const docId = url.split('/document/')[1];
        navigation.navigate('DocumentViewer', { id: docId });
      } else if (url.includes('/legal')) {
        navigation.navigate('MainApp', { screen: 'LegalDashboard' });
      } else if (url.includes('/voicemail')) {
        navigation.navigate('MainApp', { screen: 'Voicemail' });
      } else if (url.includes('/voice')) {
        navigation.navigate('MainApp', { screen: 'Voice' });
      } else if (url.includes('/profile')) {
        navigation.navigate('MainApp', { screen: 'Profile' });
      } else if (url.includes('/subscription')) {
        navigation.navigate('MainApp', { screen: 'Subscription' });
      }
    };

    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL changes
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [navigation]);
};

// Main App Navigator
const AppNavigator = () => {
  const [isReady, setIsReady] = useState(false);
  const { isAuthenticated, isLoading, initializeAuth, refreshSession } = useAuthStore();
  const navigation = React.useRef<any>(null);

  // Initialize app and check authentication
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuth();

        // Try to refresh session if exists
        const refreshed = await refreshSession();
        if (refreshed) {
          console.log('Session refreshed successfully');
        }
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize the app. Please restart the app.'
        );
      } finally {
        setIsReady(true);
      }
    };

    initialize();
  }, [initializeAuth, refreshSession]);

  // Set up deep linking
  useDeepLinking(navigation.current);

  // Session refresh timer
  useEffect(() => {
    if (isAuthenticated) {
      const refreshInterval = setInterval(async () => {
        try {
          await refreshSession();
        } catch (error) {
          console.error('Session refresh error:', error);
        }
      }, 15 * 60 * 1000); // Refresh every 15 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, refreshSession]);

  // Show loading screen while initializing
  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigation}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            <Stack.Screen
              name="DocumentViewer"
              // DocumentViewer component to be created
              component={LegalDashboardScreen} // Temporary placeholder
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="DocumentGenerator"
              // DocumentGenerator component to be created
              component={LegalDashboardScreen} // Temporary placeholder
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        ) : (
          // Authentication screens
          <Stack.Screen name="AuthStack" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const appStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.white,
    fontWeight: '500',
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default AppNavigator;