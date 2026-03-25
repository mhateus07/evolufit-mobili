import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../services/api'

const { width } = Dimensions.get('window')

type Goal = 'lose_fat' | 'gain_muscle' | 'maintain' | 'recomposition'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
type Sex = 'male' | 'female'
type Intensity = 'low' | 'moderate' | 'high'

const STEPS = ['Perfil', 'Nutrição', 'Treino', 'Peso inicial']

const GOALS: { value: Goal; label: string; icon: string; desc: string }[] = [
  { value: 'lose_fat', label: 'Perder gordura', icon: '🔥', desc: 'Déficit calórico progressivo' },
  { value: 'gain_muscle', label: 'Ganhar músculo', icon: '💪', desc: 'Superávit controlado' },
  { value: 'maintain', label: 'Manter peso', icon: '⚖️', desc: 'Equilíbrio calórico' },
  { value: 'recomposition', label: 'Recomposição', icon: '🔄', desc: 'Perder gordura e ganhar músculo' },
]

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentário', desc: 'Trabalho de escritório, sem exercício' },
  { value: 'light', label: 'Levemente ativo', desc: '1-3 treinos por semana' },
  { value: 'moderate', label: 'Moderado', desc: '3-5 treinos por semana' },
  { value: 'active', label: 'Ativo', desc: '5-6 treinos intensos por semana' },
  { value: 'very_active', label: 'Muito ativo', desc: 'Atleta ou trabalho físico pesado' },
]

interface Props {
  onComplete: () => void
}

type Errors = Record<string, string>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <Text style={styles.fieldError}>{message}</Text>
}

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  // Step 1 — Perfil
  const [heightCm, setHeightCm] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [goal, setGoal] = useState<Goal>('lose_fat')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')

  // Step 2 — Nutrição
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  // Step 3 — Treino
  const [sessions, setSessions] = useState('3')
  const [intensity, setIntensity] = useState<Intensity>('moderate')

  // Step 4 — Peso inicial
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')

  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  function parseBirthDate(input: string) {
    const [d, m, y] = input.split('/')
    return `${y}-${m}-${d}`
  }

  function validateProfile(): Errors {
    const e: Errors = {}
    const h = Number(heightCm)
    if (!heightCm) e.heightCm = 'Altura é obrigatória'
    else if (isNaN(h) || h < 100 || h > 250) e.heightCm = 'Altura inválida (100–250 cm)'

    if (!birthDate) {
      e.birthDate = 'Data de nascimento é obrigatória'
    } else {
      const parts = birthDate.split('/')
      if (parts.length !== 3 || parts[2]?.length !== 4) {
        e.birthDate = 'Formato inválido — use DD/MM/AAAA'
      } else {
        const d = parseInt(parts[0]), m = parseInt(parts[1]), y = parseInt(parts[2])
        const date = new Date(y, m - 1, d)
        const now = new Date()
        const age = now.getFullYear() - y
        if (isNaN(date.getTime()) || d < 1 || d > 31 || m < 1 || m > 12) {
          e.birthDate = 'Data inválida'
        } else if (age < 10 || age > 100) {
          e.birthDate = 'Idade deve ser entre 10 e 100 anos'
        }
      }
    }
    return e
  }

  function validateNutrition(): Errors {
    const e: Errors = {}
    const cal = parseInt(calories)
    const prot = parseFloat(protein)
    const c = carbs ? parseFloat(carbs) : null
    const f = fat ? parseFloat(fat) : null

    if (!calories) e.calories = 'Calorias são obrigatórias'
    else if (isNaN(cal) || cal < 500 || cal > 10000) e.calories = 'Valor inválido (500–10000 kcal)'

    if (!protein) e.protein = 'Proteína é obrigatória'
    else if (isNaN(prot) || prot < 10 || prot > 500) e.protein = 'Valor inválido (10–500 g)'

    if (carbs && (isNaN(c!) || c! < 0 || c! > 1000)) e.carbs = 'Valor inválido (0–1000 g)'
    if (fat && (isNaN(f!) || f! < 0 || f! > 500)) e.fat = 'Valor inválido (0–500 g)'

    return e
  }

  async function saveProfile() {
    const e = validateProfile()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      await api.put('/users/me/profile', {
        height_cm: Number(heightCm),
        birth_date: parseBirthDate(birthDate),
        sex, goal, activity_level: activityLevel,
      })
      setStep(1)
    } catch (err: any) {
      setErrors({ api: err?.response?.data?.message ?? 'Falha ao salvar perfil' })
    } finally {
      setSaving(false)
    }
  }

  async function saveNutrition() {
    const e = validateNutrition()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      await api.put('/nutrition/plan', {
        calories_target: parseInt(calories),
        protein_g: parseFloat(protein),
        carbs_g: carbs ? parseFloat(carbs) : 0,
        fat_g: fat ? parseFloat(fat) : 0,
        valid_from: new Date().toISOString().split('T')[0],
      })
      setStep(2)
    } catch (err: any) {
      setErrors({ api: err?.response?.data?.message ?? 'Falha ao salvar plano' })
    } finally {
      setSaving(false)
    }
  }

  async function saveTraining() {
    setSaving(true)
    try {
      await api.put('/training/plan', {
        sessions_per_week: parseInt(sessions),
        avg_duration_min: 60,
        intensity,
      })
      setStep(3)
    } catch (err: any) {
      setErrors({ api: err?.response?.data?.message ?? 'Falha ao salvar plano' })
    } finally {
      setSaving(false)
    }
  }

  async function saveWeight() {
    const e: Errors = {}
    if (!weight) { e.weight = 'Informe seu peso atual'; setErrors(e); return }
    const w = parseFloat(weight)
    if (isNaN(w) || w < 20 || w > 300) { e.weight = 'Peso inválido (20–300 kg)'; setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      await api.post('/biometrics/weight', {
        weight_kg: w,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
      })
      onComplete()
    } catch (err: any) {
      setErrors({ api: err?.response?.data?.message ?? 'Falha ao registrar peso' })
    } finally {
      setSaving(false)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepCount}>Etapa {step + 1} de {STEPS.length}</Text>
        <View style={styles.progressBar}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.progressSegment, i <= step && styles.progressSegmentActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{STEPS[step]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {errors.api && (
          <View style={styles.apiErrorBox}>
            <Text style={styles.apiErrorText}>⚠ {errors.api}</Text>
          </View>
        )}

        {step === 0 && (
          <StepProfile
            heightCm={heightCm}
            setHeightCm={(v: string) => { setHeightCm(v); clearError('heightCm') }}
            birthDate={birthDate}
            setBirthDate={(v: string) => { setBirthDate(v); clearError('birthDate') }}
            sex={sex} setSex={setSex}
            goal={goal} setGoal={setGoal}
            activityLevel={activityLevel} setActivityLevel={setActivityLevel}
            errors={errors}
          />
        )}
        {step === 1 && (
          <StepNutrition
            calories={calories}
            setCalories={(v: string) => { setCalories(v); clearError('calories') }}
            protein={protein}
            setProtein={(v: string) => { setProtein(v); clearError('protein') }}
            carbs={carbs}
            setCarbs={(v: string) => { setCarbs(v); clearError('carbs') }}
            fat={fat}
            setFat={(v: string) => { setFat(v); clearError('fat') }}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepTraining
            sessions={sessions} setSessions={setSessions}
            intensity={intensity} setIntensity={setIntensity}
          />
        )}
        {step === 3 && (
          <StepWeight
            weight={weight}
            setWeight={(v: string) => { setWeight(v); clearError('weight') }}
            bodyFat={bodyFat} setBodyFat={setBodyFat}
            errors={errors}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => { setErrors({}); setStep(step - 1) }}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === 0 && { flex: 1 }, hasErrors && styles.nextBtnDisabled]}
          onPress={step === 0 ? saveProfile : step === 1 ? saveNutrition : step === 2 ? saveTraining : saveWeight}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#0F1117" />
            : <Text style={styles.nextBtnText}>{step === 3 ? 'Começar →' : 'Próximo →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function StepProfile({ heightCm, setHeightCm, birthDate, setBirthDate, sex, setSex, goal, setGoal, activityLevel, setActivityLevel, errors }: any) {
  return (
    <View>
      <Text style={styles.stepTitle}>Seus dados físicos</Text>
      <Text style={styles.stepDesc}>Usamos esses dados para calcular seu metabolismo e projetar sua evolução com precisão.</Text>

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput
        style={[styles.input, errors.heightCm && styles.inputError]}
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
        placeholder="Ex: 175"
        placeholderTextColor="#888"
      />
      <FieldError message={errors.heightCm} />

      <Text style={styles.label}>Data de nascimento</Text>
      <TextInput
        style={[styles.input, errors.birthDate && styles.inputError]}
        value={birthDate}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, '').slice(0, 8)
          let formatted = digits
          if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
          else if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
          setBirthDate(formatted)
        }}
        keyboardType="numeric"
        placeholder="DD/MM/AAAA"
        placeholderTextColor="#888"
        maxLength={10}
      />
      <FieldError message={errors.birthDate} />

      <Text style={styles.label}>Sexo biológico</Text>
      <View style={styles.row}>
        {(['male', 'female'] as Sex[]).map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, sex === s && styles.chipActive]} onPress={() => setSex(s)}>
            <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
              {s === 'male' ? '♂ Masculino' : '♀ Feminino'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Seu objetivo</Text>
      {GOALS.map((g) => (
        <TouchableOpacity key={g.value} style={[styles.optionCard, goal === g.value && styles.optionCardActive]} onPress={() => setGoal(g.value)}>
          <Text style={styles.optionIcon}>{g.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionLabel, goal === g.value && styles.optionLabelActive]}>{g.label}</Text>
            <Text style={styles.optionDesc}>{g.desc}</Text>
          </View>
          {goal === g.value && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Nível de atividade</Text>
      {ACTIVITY_LEVELS.map((a) => (
        <TouchableOpacity key={a.value} style={[styles.optionCard, activityLevel === a.value && styles.optionCardActive]} onPress={() => setActivityLevel(a.value)}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionLabel, activityLevel === a.value && styles.optionLabelActive]}>{a.label}</Text>
            <Text style={styles.optionDesc}>{a.desc}</Text>
          </View>
          {activityLevel === a.value && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  )
}

function StepNutrition({ calories, setCalories, protein, setProtein, carbs, setCarbs, fat, setFat, errors }: any) {
  return (
    <View>
      <Text style={styles.stepTitle}>Suas metas nutricionais</Text>
      <Text style={styles.stepDesc}>Defina sua ingestão diária alvo. Você pode ajustar a qualquer momento em Planos.</Text>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Referência rápida</Text>
        <Text style={styles.tipText}>Proteína: 1.8–2.2g por kg de peso corporal</Text>
        <Text style={styles.tipText}>Déficit para perda: 300–500 kcal abaixo do TDEE</Text>
        <Text style={styles.tipText}>Superávit para ganho: 200–300 kcal acima do TDEE</Text>
      </View>

      <Text style={styles.label}>Meta de calorias (kcal) *</Text>
      <TextInput
        style={[styles.input, errors.calories && styles.inputError]}
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        placeholder="Ex: 2500"
        placeholderTextColor="#888"
      />
      <FieldError message={errors.calories} />

      <Text style={styles.label}>Meta de proteína (g) *</Text>
      <TextInput
        style={[styles.input, errors.protein && styles.inputError]}
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
        placeholder="Ex: 180"
        placeholderTextColor="#888"
      />
      <FieldError message={errors.protein} />

      <Text style={styles.label}>Meta de carboidratos (g) — opcional</Text>
      <TextInput
        style={[styles.input, errors.carbs && styles.inputError]}
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
        placeholder="Ex: 280"
        placeholderTextColor="#888"
      />
      <FieldError message={errors.carbs} />

      <Text style={styles.label}>Meta de gordura (g) — opcional</Text>
      <TextInput
        style={[styles.input, errors.fat && styles.inputError]}
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
        placeholder="Ex: 70"
        placeholderTextColor="#888"
      />
      <FieldError message={errors.fat} />
    </View>
  )
}

function StepTraining({ sessions, setSessions, intensity, setIntensity }: any) {
  const intensityOptions: { value: Intensity; label: string; desc: string; color: string }[] = [
    { value: 'low', label: 'Leve', desc: 'Caminhada, yoga, mobilidade', color: '#4A90E2' },
    { value: 'moderate', label: 'Moderada', desc: 'Musculação, corrida leve', color: '#F5A623' },
    { value: 'high', label: 'Intensa', desc: 'HIIT, treinos pesados', color: '#FF6B6B' },
  ]

  return (
    <View>
      <Text style={styles.stepTitle}>Seu plano de treino</Text>
      <Text style={styles.stepDesc}>Isso calibra o cálculo de gasto calórico e o score de aderência.</Text>

      <Text style={styles.label}>Quantas vezes treina por semana?</Text>
      <View style={styles.sessionsGrid}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.sessionBtn, sessions === String(n) && styles.sessionBtnActive]}
            onPress={() => setSessions(String(n))}
          >
            <Text style={[styles.sessionBtnText, sessions === String(n) && styles.sessionBtnTextActive]}>{n}x</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Intensidade dos treinos</Text>
      {intensityOptions.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.optionCard, intensity === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
          onPress={() => setIntensity(opt.value)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionLabel, intensity === opt.value && { color: opt.color }]}>{opt.label}</Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
          </View>
          {intensity === opt.value && <Text style={{ color: opt.color, fontSize: 18 }}>✓</Text>}
        </TouchableOpacity>
      ))}

      <View style={styles.finalCard}>
        <Text style={styles.finalTitle}>🎉 Tudo pronto!</Text>
        <Text style={styles.finalDesc}>
          Após concluir, o EvoluFit vai calcular seu metabolismo, gerar sua primeira projeção e monitorar sua evolução a cada registro.
        </Text>
      </View>
    </View>
  )
}

function StepWeight({ weight, setWeight, bodyFat, setBodyFat, errors }: any) {
  return (
    <View>
      <Text style={styles.stepTitle}>Seu peso atual</Text>
      <Text style={styles.stepDesc}>
        Este será o ponto de partida para monitorar sua evolução. O EvoluFit usará esse dado para gerar sua primeira projeção.
      </Text>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Dica</Text>
        <Text style={styles.tipText}>Pese-se sempre pela manhã, em jejum, para dados mais consistentes.</Text>
      </View>

      <Text style={styles.label}>Peso atual (kg) *</Text>
      <TextInput
        style={[styles.input, errors.weight && styles.inputError]}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="Ex: 78.5"
        placeholderTextColor="#888"
      />
      {errors.weight ? <Text style={styles.fieldError}>{errors.weight}</Text> : null}

      <Text style={styles.label}>% Gordura corporal (opcional)</Text>
      <TextInput
        style={styles.input}
        value={bodyFat}
        onChangeText={setBodyFat}
        keyboardType="decimal-pad"
        placeholder="Ex: 18.5"
        placeholderTextColor="#888"
      />

      <View style={styles.finalCard}>
        <Text style={styles.finalTitle}>🚀 Pronto para começar!</Text>
        <Text style={styles.finalDesc}>
          Com esses dados o EvoluFit vai calcular seu metabolismo, criar sua primeira projeção e acompanhar cada passo da sua evolução.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  header: { padding: 20, paddingBottom: 0 },
  stepCount: { color: '#666', fontSize: 13, marginBottom: 10 },
  progressBar: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#2A2D3A' },
  progressSegmentActive: { backgroundColor: '#00E5A0' },
  stepLabel: { color: '#00E5A0', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  content: { padding: 20, paddingBottom: 20 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  stepDesc: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2A2D3A' },
  inputError: { borderColor: '#FF6B6B', backgroundColor: '#2A1C1C' },
  fieldError: { color: '#FF6B6B', fontSize: 12, marginTop: 5, marginLeft: 4 },
  apiErrorBox: { backgroundColor: '#2A1C1C', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FF6B6B55' },
  apiErrorText: { color: '#FF6B6B', fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A', alignItems: 'center' },
  chipActive: { backgroundColor: '#00E5A0', borderColor: '#00E5A0' },
  chipText: { color: '#aaa', fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#0F1117' },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A', marginBottom: 8 },
  optionCardActive: { borderColor: '#00E5A0', backgroundColor: '#00E5A015' },
  optionIcon: { fontSize: 22 },
  optionLabel: { color: '#aaa', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  optionLabelActive: { color: '#00E5A0' },
  optionDesc: { color: '#555', fontSize: 12 },
  checkmark: { color: '#00E5A0', fontSize: 18, fontWeight: '700' },
  tipCard: { backgroundColor: '#1C2A1C', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#00E5A033', marginBottom: 8 },
  tipTitle: { color: '#00E5A0', fontWeight: '700', marginBottom: 6 },
  tipText: { color: '#888', fontSize: 12, marginBottom: 3 },
  sessionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sessionBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A', justifyContent: 'center', alignItems: 'center' },
  sessionBtnActive: { backgroundColor: '#00E5A0', borderColor: '#00E5A0' },
  sessionBtnText: { color: '#aaa', fontWeight: '700', fontSize: 16 },
  sessionBtnTextActive: { color: '#0F1117' },
  finalCard: { backgroundColor: '#1C2A1C', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#00E5A033', marginTop: 20 },
  finalTitle: { color: '#00E5A0', fontWeight: '800', fontSize: 18, marginBottom: 8 },
  finalDesc: { color: '#888', fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  backBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#2A2D3A', justifyContent: 'center' },
  backBtnText: { color: '#aaa', fontWeight: '600', fontSize: 15 },
  nextBtn: { flex: 2, backgroundColor: '#00E5A0', borderRadius: 12, padding: 16, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#1C4A3A', opacity: 0.6 },
  nextBtnText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
})
