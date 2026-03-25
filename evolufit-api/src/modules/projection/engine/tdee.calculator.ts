export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'lose_fat' | 'gain_muscle' | 'maintain' | 'recomposition'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
}

const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_fat:      -500,
  gain_muscle:   +300,
  maintain:         0,
  recomposition: -200,
}

export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: Sex,
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

export function getCalorieTarget(tdee: number, goal: Goal) {
  const adjustment = CALORIE_ADJUSTMENT[goal]
  return {
    target: tdee + adjustment,
    adjustment,
  }
}

export function calculateAgeFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}
