import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'https://api.evolufitmarmitas.com'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// Injeta o token JWT em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@evolufit:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Tipos
export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ProfilePayload {
  height_cm: number
  birth_date: string
  sex: 'male' | 'female'
  goal: 'lose_fat' | 'gain_muscle' | 'maintain' | 'recomposition'
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
}

export interface WeightPayload {
  weight_kg: number
  body_fat_percentage?: number
}

export interface FoodLogPayload {
  calories: number
  protein_g: number
  carbs_g?: number
  fat_g?: number
  notes?: string
}

export interface TrainingLogPayload {
  duration_minutes: number
  intensity: 'low' | 'moderate' | 'high'
  notes?: string
}

export interface TrainingPlanPayload {
  sessions_per_week: number
  intensity: 'low' | 'moderate' | 'high'
}

export interface NutritionPlanPayload {
  calorie_target?: number
  protein_target_g?: number
  carbs_target_g?: number
  fat_target_g?: number
}
