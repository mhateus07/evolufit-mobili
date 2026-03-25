import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native'
import { api } from '../../services/api'

type Tab = 'weight' | 'food' | 'training'

interface NutritionPlan {
  calories_target: number
  protein_g: number
  carbs_g?: number
  fat_g?: number
}

export function LogScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('weight')
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null)

  useEffect(() => {
    api.get('/nutrition/plan').then(({ data }) => setNutritionPlan(data)).catch(() => {})
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Registrar</Text>

      <View style={styles.tabs}>
        {(['weight', 'food', 'training'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'weight' ? '⚖️ Peso' : tab === 'food' ? '🥗 Alimentação' : '🏋️ Treino'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab === 'weight' && <WeightForm />}
        {activeTab === 'food' && <FoodForm plan={nutritionPlan} />}
        {activeTab === 'training' && <TrainingForm />}
      </ScrollView>
    </SafeAreaView>
  )
}

function SuccessBanner({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  return (
    <Animated.View style={[styles.successBanner, { opacity }]}>
      <Text style={styles.successText}>✓ {message}</Text>
    </Animated.View>
  )
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>⚠ {message}</Text>
    </View>
  )
}

function WeightForm() {
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [weightError, setWeightError] = useState('')

  async function handleSave() {
    setError('')
    if (!weight) { setWeightError('Informe o peso'); return }
    const w = parseFloat(weight)
    if (isNaN(w) || w < 20 || w > 300) { setWeightError('Peso inválido (20–300 kg)'); return }
    setWeightError('')
    setLoading(true)
    try {
      await api.post('/biometrics/weight', {
        weight_kg: w,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
      })
      setSuccess(true)
      setWeight('')
      setBodyFat('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Registro de peso</Text>
      <Text style={styles.hint}>Pese-se sempre no mesmo horário para dados mais precisos</Text>

      <SuccessBanner message="Peso registrado com sucesso!" visible={success} />
      <ErrorBanner message={error} />

      <Text style={styles.label}>Peso (kg) *</Text>
      <TextInput
        style={[styles.input, weightError && styles.inputError]}
        placeholder="Ex: 78.5"
        placeholderTextColor="#888"
        value={weight}
        onChangeText={(v) => { setWeight(v); setWeightError('') }}
        keyboardType="decimal-pad"
      />
      {weightError ? <Text style={styles.fieldError}>{weightError}</Text> : null}

      <Text style={styles.label}>% Gordura corporal (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 18.5"
        placeholderTextColor="#888"
        value={bodyFat}
        onChangeText={setBodyFat}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Salvar peso</Text>}
      </TouchableOpacity>
    </View>
  )
}

function FoodForm({ plan }: { plan: NutritionPlan | null }) {
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!calories) e.calories = 'Obrigatório'
    else if (parseInt(calories) < 0 || parseInt(calories) > 20000) e.calories = 'Valor inválido'
    if (!protein) e.protein = 'Obrigatório'
    else if (parseFloat(protein) < 0) e.protein = 'Valor inválido'
    return e
  }

  async function handleSave() {
    setError('')
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/nutrition/log', {
        calories: parseInt(calories),
        protein_g: parseFloat(protein),
        carbs_g: carbs ? parseFloat(carbs) : undefined,
        fat_g: fat ? parseFloat(fat) : undefined,
        notes: notes || undefined,
      })
      setSuccess(true)
      setCalories(''); setProtein(''); setCarbs(''); setFat(''); setNotes('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao registrar')
    } finally {
      setLoading(false)
    }
  }

  const calPct = plan && calories ? Math.min((parseInt(calories) / plan.calories_target) * 100, 100) : 0
  const protPct = plan && protein ? Math.min((parseFloat(protein) / plan.protein_g) * 100, 100) : 0

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Alimentação de hoje</Text>
      <Text style={styles.hint}>Informe o total consumido no dia</Text>

      <SuccessBanner message="Alimentação registrada!" visible={success} />
      <ErrorBanner message={error} />

      {plan && (
        <View style={styles.targetsCard}>
          <Text style={styles.targetsTitle}>Suas metas diárias</Text>
          <View style={styles.targetsRow}>
            <TargetItem label="Calorias" value={calories} target={plan.calories_target} unit="kcal" pct={calPct} />
            <TargetItem label="Proteína" value={protein} target={plan.protein_g} unit="g" pct={protPct} />
          </View>
        </View>
      )}

      <Text style={styles.label}>Calorias (kcal) *</Text>
      <TextInput
        style={[styles.input, errors.calories && styles.inputError]}
        placeholder={plan ? `Meta: ${plan.calories_target} kcal` : 'Ex: 2200'}
        placeholderTextColor="#888"
        value={calories}
        onChangeText={(v) => { setCalories(v); setErrors((p) => ({ ...p, calories: '' })) }}
        keyboardType="numeric"
      />
      {errors.calories ? <Text style={styles.fieldError}>{errors.calories}</Text> : null}

      <Text style={styles.label}>Proteína (g) *</Text>
      <TextInput
        style={[styles.input, errors.protein && styles.inputError]}
        placeholder={plan ? `Meta: ${plan.protein_g}g` : 'Ex: 150'}
        placeholderTextColor="#888"
        value={protein}
        onChangeText={(v) => { setProtein(v); setErrors((p) => ({ ...p, protein: '' })) }}
        keyboardType="decimal-pad"
      />
      {errors.protein ? <Text style={styles.fieldError}>{errors.protein}</Text> : null}

      <Text style={styles.label}>Carboidratos (g)</Text>
      <TextInput
        style={styles.input}
        placeholder={plan?.carbs_g ? `Meta: ${plan.carbs_g}g` : 'Ex: 280'}
        placeholderTextColor="#888"
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Gordura (g)</Text>
      <TextInput
        style={styles.input}
        placeholder={plan?.fat_g ? `Meta: ${plan.fat_g}g` : 'Ex: 65'}
        placeholderTextColor="#888"
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, { height: 72 }]}
        placeholder="Observações..."
        placeholderTextColor="#888"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Salvar alimentação</Text>}
      </TouchableOpacity>
    </View>
  )
}

function TargetItem({ label, value, target, unit, pct }: { label: string; value: string; target: number; unit: string; pct: number }) {
  const current = parseFloat(value) || 0
  const over = current > target
  return (
    <View style={{ flex: 1, marginRight: 8 }}>
      <Text style={styles.targetLabel}>{label}</Text>
      <Text style={[styles.targetValue, over && { color: '#FF6B6B' }]}>
        {current > 0 ? current : '—'}<Text style={styles.targetUnit}> / {target}{unit}</Text>
      </Text>
      <View style={styles.targetBarBg}>
        <View style={[styles.targetBarFill, { width: `${pct}%` as any, backgroundColor: over ? '#FF6B6B' : pct >= 80 ? '#00E5A0' : '#4A90E2' }]} />
      </View>
    </View>
  )
}

type Intensity = 'low' | 'moderate' | 'high'

function TrainingForm() {
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [durationError, setDurationError] = useState('')

  async function handleSave() {
    setError('')
    if (!duration) { setDurationError('Informe a duração'); return }
    const d = parseInt(duration)
    if (isNaN(d) || d < 5 || d > 480) { setDurationError('Duração inválida (5–480 min)'); return }
    setDurationError('')
    setLoading(true)
    try {
      await api.post('/training/log', {
        duration_min: d,
        intensity,
      })
      setSuccess(true)
      setDuration(''); setNotes('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao registrar')
    } finally {
      setLoading(false)
    }
  }

  const intensityOptions: { value: Intensity; label: string; desc: string; color: string }[] = [
    { value: 'low', label: 'Leve', desc: 'Caminhada, yoga', color: '#4A90E2' },
    { value: 'moderate', label: 'Moderado', desc: 'Musculação, corrida', color: '#F5A623' },
    { value: 'high', label: 'Intenso', desc: 'HIIT, treinos pesados', color: '#FF6B6B' },
  ]

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Sessão de treino</Text>

      <SuccessBanner message="Treino registrado!" visible={success} />
      <ErrorBanner message={error} />

      <Text style={styles.label}>Duração (minutos) *</Text>
      <TextInput
        style={[styles.input, durationError && styles.inputError]}
        placeholder="Ex: 60"
        placeholderTextColor="#888"
        value={duration}
        onChangeText={(v) => { setDuration(v); setDurationError('') }}
        keyboardType="numeric"
      />
      {durationError ? <Text style={styles.fieldError}>{durationError}</Text> : null}

      <Text style={styles.label}>Intensidade</Text>
      <View style={styles.intensityGrid}>
        {intensityOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.intensityCard, intensity === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '18' }]}
            onPress={() => setIntensity(opt.value)}
          >
            <Text style={[styles.intensityLabel, intensity === opt.value && { color: opt.color }]}>{opt.label}</Text>
            <Text style={styles.intensityDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, { height: 72 }]}
        placeholder="Tipo de treino, exercícios..."
        placeholderTextColor="#888"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Salvar treino</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', padding: 20, paddingBottom: 0 },
  tabs: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1C1F2A', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2D3A',
  },
  tabActive: { backgroundColor: '#00E5A015', borderColor: '#00E5A0' },
  tabText: { fontSize: 12, color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#00E5A0' },
  content: { padding: 16, paddingBottom: 40 },
  form: {},
  formTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  hint: { fontSize: 12, color: '#666', marginBottom: 12 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12,
    padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2A2D3A',
  },
  inputError: { borderColor: '#FF6B6B', backgroundColor: '#2A1C1C' },
  fieldError: { color: '#FF6B6B', fontSize: 12, marginTop: 5, marginLeft: 4 },
  button: {
    backgroundColor: '#00E5A0', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
  successBanner: {
    backgroundColor: '#1C2A1C', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#00E5A044', marginBottom: 12,
  },
  successText: { color: '#00E5A0', fontWeight: '600', fontSize: 14 },
  errorBanner: {
    backgroundColor: '#2A1C1C', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 12,
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  targetsCard: {
    backgroundColor: '#1C1F2A', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2A2D3A', marginBottom: 8,
  },
  targetsTitle: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
  targetsRow: { flexDirection: 'row' },
  targetLabel: { color: '#888', fontSize: 11, marginBottom: 2 },
  targetValue: { color: '#fff', fontWeight: '700', fontSize: 15 },
  targetUnit: { color: '#555', fontWeight: '400', fontSize: 12 },
  targetBarBg: { height: 3, backgroundColor: '#2A2D3A', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  targetBarFill: { height: 3, borderRadius: 2 },
  intensityGrid: { flexDirection: 'row', gap: 8 },
  intensityCard: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A',
  },
  intensityLabel: { color: '#aaa', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  intensityDesc: { color: '#555', fontSize: 11 },
})
