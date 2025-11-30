import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PhoneManagementScreen } from '../screens/phone/PhoneManagementScreen';
import { PhoneDetailScreen } from '../screens/phone/PhoneDetailScreen';
import { AddPhoneNumberScreen } from '../screens/phone/AddPhoneNumberScreen';

const Stack = createStackNavigator();

export function PhoneStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PhoneManagement"
        component={PhoneManagementScreen}
        options={{
          headerShown: true,
          title: 'Phone Numbers',
        }}
      />
      <Stack.Screen
        name="PhoneDetail"
        component={PhoneDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="PhoneAdd"
        component={AddPhoneNumberScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
