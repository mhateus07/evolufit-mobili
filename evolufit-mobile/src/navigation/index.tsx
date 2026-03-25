import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuthStore } from '../store/auth.store'

import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen'
import { ProfileSetupScreen } from '../screens/onboarding/ProfileSetupScreen'
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen'
import { DashboardScreen } from '../screens/main/DashboardScreen'
import { LogScreen } from '../screens/main/LogScreen'
import { ProjectionScreen } from '../screens/main/ProjectionScreen'
import { MarmitasScreen } from '../screens/main/MarmitasScreen'
import { ProfileScreen } from '../screens/main/ProfileScreen'
import { PlansScreen } from '../screens/main/PlansScreen'
import { HistoryScreen } from '../screens/main/HistoryScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Log: '📝',
    Histórico: '📋',
    Projeção: '📊',
    Planos: '🎯',
    Marmitas: '🥗',
    Perfil: '👤',
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 18 }}>{icons[label] ?? '●'}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#00E5A0' : '#555', fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1F2A',
          borderTopColor: '#2A2D3A',
          height: 64,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} /> }}
      />
      <Tab.Screen
        name="Log"
        component={LogScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Log" focused={focused} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Histórico" focused={focused} /> }}
      />
      <Tab.Screen
        name="Projection"
        component={ProjectionScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Projeção" focused={focused} /> }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Planos" focused={focused} /> }}
      />
      <Tab.Screen
        name="Marmitas"
        component={MarmitasScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Marmitas" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Perfil" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const { isAuthenticated, isLoading, hasProfile, loadStoredToken, markProfileComplete } = useAuthStore()

  useEffect(() => {
    loadStoredToken()
  }, [])

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>EvoluFit</Text>
        <ActivityIndicator color="#00E5A0" style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : !hasProfile ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={markProfileComplete} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ProfileSetup"
              component={ProfileSetupScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  splashLogo: { fontSize: 48, fontWeight: '800', color: '#00E5A0' },
})
