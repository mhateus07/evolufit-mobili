import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../services/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  hasProfile: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadStoredToken: () => Promise<void>
  markProfileComplete: () => void
}

async function checkHasProfile(): Promise<boolean> {
  try {
    await api.get('/users/me/profile')
    return true
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  hasProfile: false,

  loadStoredToken: async () => {
    try {
      const token = await AsyncStorage.getItem('@evolufit:token')
      if (token) {
        const { data } = await api.get('/users/me')
        const hasProfile = await checkHasProfile()
        set({ user: data, token, isAuthenticated: true, hasProfile, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      await AsyncStorage.removeItem('@evolufit:token')
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await AsyncStorage.setItem('@evolufit:token', data.token)
    const hasProfile = await checkHasProfile()
    set({ user: data.user, token: data.token, isAuthenticated: true, hasProfile })
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    await AsyncStorage.setItem('@evolufit:token', data.token)
    set({ user: data.user, token: data.token, isAuthenticated: true, hasProfile: false })
  },

  logout: async () => {
    await AsyncStorage.removeItem('@evolufit:token')
    set({ user: null, token: null, isAuthenticated: false, hasProfile: false })
  },

  markProfileComplete: () => set({ hasProfile: true }),
}))
