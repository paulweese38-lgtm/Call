import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VoicemailListScreen } from '../screens/voicemail/VoicemailListScreen';
import { VoicemailDetailScreen } from '../screens/voicemail/VoicemailDetailScreen';
import { VoicemailRecordScreen } from '../screens/voicemail/VoicemailRecordScreen';

const Stack = createStackNavigator();

export function VoicemailStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="VoicemailList"
        component={VoicemailListScreen}
        options={{
          headerShown: true,
          title: 'Voicemails',
        }}
      />
      <Stack.Screen
        name="VoicemailDetail"
        component={VoicemailDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="VoicemailRecord"
        component={VoicemailRecordScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
