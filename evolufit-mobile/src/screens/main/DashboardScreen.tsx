import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { WeightChart } from '../../components/WeightChart'

interface NutritionGap {
  date: string
  logged: { calories: number; protein_g: number }
  plan: { calorie_target: number; protein_target_g: number }
  gap: { calories: number; protein_g: number }
}

interface WeightLog {
  id: string
  weight_kg: number
  measured_at: string
}

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user)
  const [gap, setGap] = useState<NutritionGap | null>(null)
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null)
  const [allWeights, setAllWeights] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    try {
      const [gapRes, weightRes] = await Promise.allSettled([
        api.get('/nutrition/gap/today'),
        api.get('/biometrics/weight'),
      ])

      if (gapRes.status === 'fulfilled') setGap(gapRes.value.data)
      if (weightRes.status === 'fulfilled') {
        const logs = weightRes.value.data
        if (Array.isArray(logs) && logs.length > 0) {
          setLatestWeight(logs[0])
          setAllWeights(logs)
        }
      }
    } catch {
      // ignora erros parciais
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  useEffect(() => { loadData() }, [])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#00E5A0" size="large" />
      </View>
    )
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5A0" />}
    >
      <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0]} 👋</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {/* Card de peso */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Peso atual</Text>
        {latestWeight ? (
          <View>
            <Text style={styles.bigNumber}>{latestWeight.weight_kg} <Text style={styles.unit}>kg</Text></Text>
            <Text style={styles.cardSub}>
              Registrado em {latestWeight.measured_at ? new Date(latestWeight.measured_at).toLocaleDateString('pt-BR') : '—'}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum peso registrado ainda</Text>
        )}
      </View>

      {/* Card de nutrição */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrição hoje</Text>
        {gap?.logged ? (
          <View>
            <View style={styles.macroRow}>
              <MacroItem label="Calorias" value={gap.logged.calories} target={gap.plan?.calorie_target} unit="kcal" />
              <MacroItem label="Proteína" value={gap.logged.protein_g} target={gap.plan?.protein_target_g} unit="g" />
            </View>
            {gap.gap && (
              <View style={styles.gapRow}>
                <Text style={styles.gapLabel}>Gap calórico: </Text>
                <Text style={[styles.gapValue, { color: gap.gap.calories < 0 ? '#FF6B6B' : '#00E5A0' }]}>
                  {gap.gap.calories > 0 ? '+' : ''}{gap.gap.calories} kcal
                </Text>
                <Text style={styles.gapLabel}>  Proteína: </Text>
                <Text style={[styles.gapValue, { color: gap.gap.protein_g < 0 ? '#FF6B6B' : '#00E5A0' }]}>
                  {gap.gap.protein_g > 0 ? '+' : ''}{gap.gap.protein_g}g
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum registro alimentar hoje</Text>
        )}
      </View>

      {/* Gráfico de evolução de peso */}
      {allWeights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolução do peso</Text>
          <WeightChart data={allWeights} />
        </View>
      )}

      <View style={styles.hintCard}>
        <Text style={styles.hintText}>💡 Use a aba <Text style={styles.hintBold}>Log</Text> para registrar peso, alimentação e treino</Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  )
}

function MacroItem({ label, value, target, unit }: { label: string; value: number; target?: number; unit: string }) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0
  return (
    <View style={{ flex: 1, marginRight: 8 }}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}<Text style={styles.unit}> {unit}</Text></Text>
      {target && <Text style={styles.macroTarget}>meta: {target} {unit}</Text>}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: pct >= 100 ? '#00E5A0' : '#4A90E2' }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  greeting: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 2 },
  date: { fontSize: 13, color: '#666', marginBottom: 20 },
  card: {
    backgroundColor: '#1C1F2A', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#2A2D3A',
  },
  cardTitle: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  bigNumber: { fontSize: 40, fontWeight: '800', color: '#00E5A0' },
  unit: { fontSize: 18, color: '#888', fontWeight: '400' },
  cardSub: { fontSize: 12, color: '#666', marginTop: 2 },
  emptyText: { color: '#555', fontSize: 14 },
  macroRow: { flexDirection: 'row' },
  macroLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  macroValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  macroTarget: { fontSize: 11, color: '#555', marginBottom: 4 },
  barBg: { height: 4, backgroundColor: '#2A2D3A', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  gapRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  gapLabel: { fontSize: 12, color: '#666' },
  gapValue: { fontSize: 12, fontWeight: '700' },
  hintCard: {
    backgroundColor: '#1C1F2A', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2A2D3A',
  },
  hintText: { color: '#888', fontSize: 13 },
  hintBold: { color: '#00E5A0', fontWeight: '700' },
})
