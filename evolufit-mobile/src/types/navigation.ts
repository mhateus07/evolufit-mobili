export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: { email: string }
}

export type OnboardingStackParamList = {
  ProfileSetup: undefined
}

export type MainTabParamList = {
  Dashboard: undefined
  Log: undefined
  Projection: undefined
  Marmitas: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Onboarding: undefined
  Main: undefined
}
