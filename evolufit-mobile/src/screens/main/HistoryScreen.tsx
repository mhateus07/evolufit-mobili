import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../services/api'

type Tab = 'weight' | 'food' | 'training'

interface WeightLog { id: string; weight_kg: number; body_fat_pct: number | null; measured_at: string }
interface FoodLog { id: string; calories_actual: number; protein_g: number; carbs_g: number; fat_g: number; logged_date: string; notes: string }
interface TrainingLog { id: string; duration_minutes: number; intensity: string; trained_at: string; notes: string }

export function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('weight')
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    try {
      const [w, f, t] = await Promise.allSettled([
        api.get('/biometrics/weight'),
        api.get('/nutrition/log'),
        api.get('/training/log'),
      ])
      if (w.status === 'fulfilled') setWeightLogs(w.value.data ?? [])
      if (f.status === 'fulfilled') setFoodLogs(f.value.data ?? [])
      if (t.status === 'fulfilled') setTrainingLogs(t.value.data ?? [])
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

  async function deleteWeight(id: string) {
    Alert.alert('Excluir', 'Remover este registro de peso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/biometrics/weight/${id}`)
            setWeightLogs((prev) => prev.filter((w) => w.id !== id))
          } catch { Alert.alert('Erro', 'Não foi possível excluir') }
        },
      },
    ])
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#00E5A0" size="large" /></View>

  const refreshCtrl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5A0" />

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Histórico</Text>

      <View style={styles.tabs}>
        {([
          { key: 'weight', label: '⚖️ Peso' },
          { key: 'food', label: '🥗 Alimentação' },
          { key: 'training', label: '🏋️ Treino' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'weight' && (
        <FlatList
          data={weightLogs}
          keyExtractor={(item) => item.id}
          refreshControl={refreshCtrl}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState text="Nenhum peso registrado" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardMain}>{Number(item.weight_kg).toFixed(1)} kg</Text>
                {item.body_fat_pct != null && (
                  <Text style={styles.cardSub}>{Number(item.body_fat_pct).toFixed(1)}% gordura</Text>
                )}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardDate}>{formatDate(item.measured_at)}</Text>
                <TouchableOpacity onPress={() => deleteWeight(item.id)}>
                  <Text style={styles.deleteBtn}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {tab === 'food' && (
        <FlatList
          data={foodLogs}
          keyExtractor={(item) => item.id}
          refreshControl={refreshCtrl}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState text="Nenhum registro alimentar" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardMain}>{item.calories_actual} kcal</Text>
                <View style={styles.macroRow}>
                  <MacroPill label="P" value={item.protein_g} color="#00E5A0" />
                  <MacroPill label="C" value={item.carbs_g} color="#4A90E2" />
                  <MacroPill label="G" value={item.fat_g} color="#F5A623" />
                </View>
                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.cardDate}>{formatDate(item.logged_date)}</Text>
            </View>
          )}
        />
      )}

      {tab === 'training' && (
        <FlatList
          data={trainingLogs}
          keyExtractor={(item) => item.id}
          refreshControl={refreshCtrl}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState text="Nenhum treino registrado" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardMain}>{item.duration_minutes} min</Text>
                <View style={styles.intensityBadge}>
                  <Text style={[styles.intensityText, { color: intensityColor(item.intensity) }]}>
                    {intensityLabel(item.intensity)}
                  </Text>
                </View>
                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.cardDate}>{formatDate(item.trained_at)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function EmptyState({ text }: { text: string }) {
  return <View style={{ padding: 40, alignItems: 'center' }}><Text style={{ color: '#555', fontSize: 14 }}>{text}</Text></View>
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginRight: 8 }}>
      <Text style={{ color: '#666', fontSize: 11 }}>{label}:</Text>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{Number(value ?? 0).toFixed(0)}g</Text>
    </View>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function intensityColor(i: string) {
  return i === 'high' ? '#FF6B6B' : i === 'moderate' ? '#F5A623' : '#4A90E2'
}

function intensityLabel(i: string) {
  return i === 'high' ? 'Intenso' : i === 'moderate' ? 'Moderado' : 'Leve'
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', padding: 20, paddingBottom: 0 },
  tabs: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#1C1F2A', borderWidth: 1, borderColor: '#2A2D3A' },
  tabActive: { backgroundColor: '#00E5A015', borderColor: '#00E5A0' },
  tabText: { fontSize: 11, color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#00E5A0' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1C1F2A', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2A2D3A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardMain: { color: '#fff', fontWeight: '800', fontSize: 20, marginBottom: 4 },
  cardSub: { color: '#888', fontSize: 12 },
  cardDate: { color: '#666', fontSize: 12 },
  deleteBtn: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  macroRow: { flexDirection: 'row', marginTop: 4 },
  notes: { color: '#666', fontSize: 12, marginTop: 4 },
  intensityBadge: { marginTop: 4 },
  intensityText: { fontSize: 12, fontWeight: '700' },
})
