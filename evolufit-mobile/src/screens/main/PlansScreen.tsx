import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../services/api'

type Intensity = 'low' | 'moderate' | 'high'

interface NutritionPlan {
  calorie_target: number
  protein_target_g: number
  carbs_target_g: number
  fat_target_g: number
}

interface TrainingPlan {
  sessions_per_week: number
  intensity: Intensity
}

export function PlansScreen() {
  const [tab, setTab] = useState<'nutrition' | 'training'>('nutrition')

  // Nutrição
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  // Treino
  const [sessions, setSessions] = useState('')
  const [intensity, setIntensity] = useState<Intensity>('moderate')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [nutRes, trainRes] = await Promise.allSettled([
          api.get('/nutrition/plan'),
          api.get('/training/plan'),
        ])
        if (nutRes.status === 'fulfilled' && nutRes.value.data) {
          const p: NutritionPlan = nutRes.value.data
          setCalories(String(p.calorie_target ?? ''))
          setProtein(String(p.protein_target_g ?? ''))
          setCarbs(String(p.carbs_target_g ?? ''))
          setFat(String(p.fat_target_g ?? ''))
        }
        if (trainRes.status === 'fulfilled' && trainRes.value.data) {
          const t: TrainingPlan = trainRes.value.data
          setSessions(String(t.sessions_per_week ?? ''))
          setIntensity(t.intensity ?? 'moderate')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveNutrition() {
    if (!calories || !protein) { Alert.alert('Erro', 'Preencha calorias e proteína'); return }
    setSaving(true)
    try {
      await api.put('/nutrition/plan', {
        calorie_target: parseInt(calories),
        protein_target_g: parseFloat(protein),
        carbs_target_g: carbs ? parseFloat(carbs) : undefined,
        fat_target_g: fat ? parseFloat(fat) : undefined,
      })
      Alert.alert('Sucesso', 'Plano nutricional salvo!')
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function saveTraining() {
    if (!sessions) { Alert.alert('Erro', 'Informe as sessões por semana'); return }
    setSaving(true)
    try {
      await api.put('/training/plan', {
        sessions_per_week: parseInt(sessions),
        avg_duration_min: 60,
        intensity,
      })
      Alert.alert('Sucesso', 'Plano de treino salvo!')
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#00E5A0" size="large" /></View>
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Meus Planos</Text>

      <View style={styles.tabs}>
        {(['nutrition', 'training'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'nutrition' ? '🥗 Nutricional' : '🏋️ Treino'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'nutrition' ? (
          <View>
            <Text style={styles.hint}>
              Defina suas metas diárias. A projeção usa esses valores para calcular seu progresso.
            </Text>

            <Text style={styles.label}>Meta de calorias (kcal) *</Text>
            <TextInput style={styles.input} value={calories} onChangeText={setCalories}
              keyboardType="numeric" placeholder="Ex: 2500" placeholderTextColor="#888" />

            <Text style={styles.label}>Meta de proteína (g) *</Text>
            <TextInput style={styles.input} value={protein} onChangeText={setProtein}
              keyboardType="decimal-pad" placeholder="Ex: 180" placeholderTextColor="#888" />

            <Text style={styles.label}>Meta de carboidratos (g)</Text>
            <TextInput style={styles.input} value={carbs} onChangeText={setCarbs}
              keyboardType="decimal-pad" placeholder="Ex: 280" placeholderTextColor="#888" />

            <Text style={styles.label}>Meta de gordura (g)</Text>
            <TextInput style={styles.input} value={fat} onChangeText={setFat}
              keyboardType="decimal-pad" placeholder="Ex: 70" placeholderTextColor="#888" />

            {calories && protein ? (
              <View style={styles.macroPreview}>
                <Text style={styles.macroPreviewTitle}>Distribuição calórica</Text>
                <View style={styles.macroRow}>
                  <MacroBar label="Proteína" g={parseFloat(protein || '0')} kcal={parseFloat(protein || '0') * 4} total={parseInt(calories || '1')} color="#00E5A0" />
                  <MacroBar label="Carbs" g={parseFloat(carbs || '0')} kcal={parseFloat(carbs || '0') * 4} total={parseInt(calories || '1')} color="#4A90E2" />
                  <MacroBar label="Gordura" g={parseFloat(fat || '0')} kcal={parseFloat(fat || '0') * 9} total={parseInt(calories || '1')} color="#F5A623" />
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={saveNutrition} disabled={saving}>
              {saving ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Salvar plano nutricional</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.hint}>
              Configure sua frequência e intensidade de treino para o score de aderência.
            </Text>

            <Text style={styles.label}>Sessões por semana *</Text>
            <View style={styles.sessionsRow}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.sessionChip, sessions === String(n) && styles.sessionChipActive]}
                  onPress={() => setSessions(String(n))}
                >
                  <Text style={[styles.sessionChipText, sessions === String(n) && styles.sessionChipTextActive]}>{n}x</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Intensidade padrão</Text>
            {([
              { value: 'low', label: 'Leve', desc: 'Caminhada, yoga, mobilidade', color: '#4A90E2' },
              { value: 'moderate', label: 'Moderada', desc: 'Musculação, corrida leve', color: '#F5A623' },
              { value: 'high', label: 'Intensa', desc: 'HIIT, treinos pesados', color: '#FF6B6B' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.intensityOpt, intensity === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
                onPress={() => setIntensity(opt.value)}
              >
                <View>
                  <Text style={[styles.intensityLabel, intensity === opt.value && { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.intensityDesc}>{opt.desc}</Text>
                </View>
                {intensity === opt.value && <Text style={{ color: opt.color, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.button} onPress={saveTraining} disabled={saving}>
              {saving ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Salvar plano de treino</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function MacroBar({ label, g, kcal, total, color }: { label: string; g: number; kcal: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((kcal / total) * 100) : 0
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <View style={{ width: 40, height: 80, backgroundColor: '#2A2D3A', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' }}>
        <View style={{ width: '100%', height: `${pct}%`, backgroundColor: color, borderRadius: 8 }} />
      </View>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{pct}%</Text>
      <Text style={{ color: '#888', fontSize: 11 }}>{label}</Text>
      <Text style={{ color: '#666', fontSize: 10 }}>{g}g</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', padding: 20, paddingBottom: 0 },
  tabs: { flexDirection: 'row', padding: 16, gap: 10 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#1C1F2A', borderWidth: 1, borderColor: '#2A2D3A' },
  tabActive: { backgroundColor: '#00E5A015', borderColor: '#00E5A0' },
  tabText: { color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#00E5A0' },
  content: { padding: 16, paddingBottom: 40 },
  hint: { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2A2D3A' },
  macroPreview: { backgroundColor: '#1C1F2A', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#2A2D3A' },
  macroPreviewTitle: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { backgroundColor: '#00E5A0', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
  sessionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  sessionChip: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A', justifyContent: 'center', alignItems: 'center' },
  sessionChipActive: { backgroundColor: '#00E5A0', borderColor: '#00E5A0' },
  sessionChipText: { color: '#aaa', fontWeight: '700', fontSize: 16 },
  sessionChipTextActive: { color: '#0F1117' },
  intensityOpt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A', marginBottom: 8 },
  intensityLabel: { color: '#aaa', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  intensityDesc: { color: '#555', fontSize: 12 },
})
