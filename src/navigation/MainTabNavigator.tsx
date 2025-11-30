import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LegalStackNavigator } from './LegalStackNavigator';
import { VoicemailStackNavigator } from './VoicemailStackNavigator';
import { PhoneStackNavigator } from './PhoneStackNavigator';
import { VoicePlaygroundScreen } from '../screens/voice/VoicePlaygroundScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#757575',
        headerShown: true
      }}
    >
      <Tab.Screen
        name="Legal"
        component={LegalStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gavel" size={size} color={color} />
          ),
          title: 'Legal Protection',
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Voicemail"
        component={VoicemailStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="voicemail" size={size} color={color} />
          ),
          title: 'Voicemails',
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Phone"
        component={PhoneStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call" size={size} color={color} />
          ),
          title: 'Phone Numbers',
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoicePlaygroundScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
          title: 'Voice Playground'
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}
