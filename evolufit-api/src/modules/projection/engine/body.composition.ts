import type { Sex } from './tdee.calculator.js'
import type { Goal } from './tdee.calculator.js'

export interface BodyComposition {
  fat_mass_kg: number
  lean_mass_kg: number
  body_fat_pct: number
}

// Estimativa baseada em Gallagher et al. quando não há bioimpedância
export function estimateBodyComposition(
  weight_kg: number,
  age: number,
  sex: Sex,
): BodyComposition {
  // Fórmula de estimativa de % gordura por IMC não aplicável sem altura aqui,
  // usamos valores médios por sexo e faixa etária como estimativa inicial
  const base_fat_pct = sex === 'male'
    ? Math.min(10 + age * 0.2, 30)
    : Math.min(18 + age * 0.2, 40)

  const fat_mass_kg = (weight_kg * base_fat_pct) / 100
  return {
    fat_mass_kg: Number(fat_mass_kg.toFixed(2)),
    lean_mass_kg: Number((weight_kg - fat_mass_kg).toFixed(2)),
    body_fat_pct: Number(base_fat_pct.toFixed(1)),
  }
}

export function compositionFromMeasured(
  weight_kg: number,
  body_fat_pct: number,
): BodyComposition {
  const fat_mass_kg = (weight_kg * body_fat_pct) / 100
  return {
    fat_mass_kg: Number(fat_mass_kg.toFixed(2)),
    lean_mass_kg: Number((weight_kg - fat_mass_kg).toFixed(2)),
    body_fat_pct,
  }
}

// Quanto de gordura vs músculo será alterado por semana baseado no objetivo
export function getLeanMassRetentionFactor(
  goal: Goal,
  protein_g_per_day: number,
  protein_target_g: number,
): number {
  const protein_ratio = Math.min(protein_g_per_day / protein_target_g, 1)

  const base: Record<Goal, number> = {
    lose_fat:      0.85, // 85% da perda é gordura se proteína adequada
    gain_muscle:   1.0,  // ganho é predominantemente músculo
    maintain:      1.0,
    recomposition: 0.90,
  }

  // Proteína baixa reduz retenção de massa magra
  return base[goal] * (0.7 + 0.3 * protein_ratio)
}
