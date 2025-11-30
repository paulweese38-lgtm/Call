import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LegalDashboardScreen } from '../screens/legal/LegalDashboardScreen';
import { DocumentPreviewScreen } from '../screens/legal/DocumentPreviewScreen';
import { DebtValidationForm } from '../components/legal/DebtValidationForm';
import { CeaseDesistForm } from '../components/legal/CeaseDesistForm';

const Stack = createStackNavigator();

// Wrapper component for document forms
function DocumentFormScreen({ navigation, route }: any) {
  const { documentType } = route.params;

  if (documentType === 'debt_validation') {
    return <DebtValidationForm navigation={navigation} />;
  } else if (documentType === 'cease_desist') {
    return <CeaseDesistForm navigation={navigation} />;
  }

  return null;
}

export function LegalStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="LegalDashboard"
        component={LegalDashboardScreen}
        options={{
          headerShown: true,
          title: 'Legal Protection',
        }}
      />
      <Stack.Screen
        name="DocumentForm"
        component={DocumentFormScreen}
        options={{
          headerShown: true,
          title: 'Create Document',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="DocumentPreview"
        component={DocumentPreviewScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
