import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native'
import { api } from '../../services/api'

interface Scenario {
  adherence_assumption: number
  weeks: {
    week: number
    date: string
    weight_expected_kg: number
    weight_min_kg: number
    weight_max_kg: number
    fat_mass_expected_kg: number
    lean_mass_expected_kg: number
  }[]
  goal_reached_week: number | null
}

interface ProjectionResult {
  cold_start: { is_cold_start: boolean; missing: string[]; confidence: number }
  metabolic: {
    bmr: number
    tdee: number
    calorie_target: number
    calibration: { quality: string; confidence: number }
  }
  scenarios: {
    conservative: Scenario
    current: Scenario
    optimized: Scenario
  }
  adherence: {
    overall: number
    weight_score: number
    nutrition_score: number
    training_score: number
  }
  cached_at: string
  expires_at: string
}

// Normaliza qualquer formato da API para o formato que o componente espera
function normalize(data: any): ProjectionResult | null {
  if (!data) return null

  // Formato geração nova: tem `scenarios` direto
  if (data.scenarios) {
    return {
      cold_start: {
        is_cold_start: data.is_cold_start ?? false,
        missing: data.cold_start_info?.missing ?? [],
        confidence: data.calibration?.confidence ?? 0,
      },
      metabolic: {
        bmr: data.metabolic?.bmr ?? 0,
        tdee: data.metabolic?.tdee_calibrated ?? data.metabolic?.tdee_formula ?? 0,
        calorie_target: data.metabolic?.calorie_target ?? 0,
        calibration: {
          quality: data.calibration?.quality ?? 'insufficient',
          confidence: data.calibration?.confidence ?? 0,
        },
      },
      scenarios: data.scenarios,
      adherence: {
        overall: data.adherence_detail?.overall ?? data.adherence_score ?? 0,
        weight_score: data.adherence_detail?.weight_score ?? 0,
        nutrition_score: data.adherence_detail?.nutrition_score ?? 0,
        training_score: data.adherence_detail?.training_score ?? 0,
      },
      cached_at: data.generated_at ?? '',
      expires_at: data.expires_at ?? '',
    }
  }

  // Formato cache (colunas do banco): tem `conservative_scenario` etc.
  if (data.conservative_scenario) {
    const parse = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v)
    return {
      cold_start: { is_cold_start: data.is_cold_start ?? false, missing: [], confidence: 0 },
      metabolic: { bmr: 0, tdee: 0, calorie_target: 0, calibration: { quality: 'insufficient', confidence: 0 } },
      scenarios: {
        conservative: parse(data.conservative_scenario),
        current: parse(data.current_scenario),
        optimized: parse(data.optimized_scenario),
      },
      adherence: { overall: data.adherence_score ?? 0, weight_score: 0, nutrition_score: 0, training_score: 0 },
      cached_at: data.generated_at ?? '',
      expires_at: data.expires_at ?? '',
    }
  }

  return null
}

export function ProjectionScreen() {
  const [projection, setProjection] = useState<ProjectionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeScenario, setActiveScenario] = useState<'conservative' | 'current' | 'optimized'>('current')

  async function loadProjection(force = false) {
    try {
      const { data } = force
        ? await api.post('/projection/recalculate')
        : await api.get('/projection/current')
      const normalized = normalize(data)
      setProjection(normalized)
    } catch {
      setProjection(null)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadProjection(true)
    setRefreshing(false)
  }, [])

  useEffect(() => { loadProjection() }, [])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#00E5A0" size="large" />
      </View>
    )
  }

  if (!projection || !projection.scenarios) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Configure seu perfil</Text>
        <Text style={styles.emptyText}>Vá em Perfil → preencha altura, nascimento e objetivo para ver sua projeção</Text>
      </View>
    )
  }

  const scenario = projection.scenarios[activeScenario] ?? projection.scenarios.current
  const week4 = scenario?.weeks.find((w) => w.week === 4)
  const week8 = scenario?.weeks.find((w) => w.week === 8)
  const week12 = scenario?.weeks.find((w) => w.week === 12)

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5A0" />}
    >
      <Text style={styles.title}>Projeção</Text>

      {projection.cold_start?.is_cold_start && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Dados insuficientes</Text>
          <Text style={styles.warningText}>
            Registre mais dados para aumentar a precisão:{' '}
            {projection.cold_start.missing.join(', ')}
          </Text>
          <Text style={styles.warningConfidence}>
            Confiança atual: {Math.round(projection.cold_start.confidence * 100)}%
          </Text>
        </View>
      )}

      {/* Aderência */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score de aderência</Text>
        <View style={styles.scoreRow}>
          <ScoreCircle score={projection.adherence.overall} label="Geral" main />
          <ScoreCircle score={projection.adherence.weight_score} label="Peso" />
          <ScoreCircle score={projection.adherence.nutrition_score} label="Nutrição" />
          <ScoreCircle score={projection.adherence.training_score} label="Treino" />
        </View>
      </View>

      {/* Metabólico */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados metabólicos</Text>
        <View style={styles.metaRow}>
          <MetaItem label="TMB" value={`${Math.round(projection.metabolic.bmr)} kcal`} />
          <MetaItem label="TDEE" value={`${Math.round(projection.metabolic.tdee)} kcal`} />
          <MetaItem label="Meta" value={`${Math.round(projection.metabolic.calorie_target)} kcal`} />
        </View>
        <View style={styles.calibBadge}>
          <Text style={styles.calibText}>
            Calibração: {calibQuality(projection.metabolic.calibration.quality)} ({Math.round(projection.metabolic.calibration.confidence * 100)}%)
          </Text>
        </View>
      </View>

      {/* Seleção de cenário */}
      <View style={styles.scenarioTabs}>
        {([
          { key: 'conservative', label: '🛡️ Conservador', pct: '70%' },
          { key: 'current', label: '🎯 Atual', pct: `${Math.round((projection.scenarios.current.adherence_assumption ?? 0) * 100)}%` },
          { key: 'optimized', label: '🚀 Otimizado', pct: '90%' },
        ] as const).map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.scenarioTab, activeScenario === s.key && styles.scenarioTabActive]}
            onPress={() => setActiveScenario(s.key)}
          >
            <Text style={[styles.scenarioTabText, activeScenario === s.key && styles.scenarioTabTextActive]}>
              {s.label}
            </Text>
            <Text style={[styles.scenarioPct, activeScenario === s.key && styles.scenarioPctActive]}>
              {s.pct} aderência
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Projeção por semana */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evolução projetada</Text>
        {[
          { weeks: 4, data: week4 },
          { weeks: 8, data: week8 },
          { weeks: 12, data: week12 },
        ].map(({ weeks, data }) =>
          data ? (
            <View key={weeks} style={styles.weekRow}>
              <View style={styles.weekBadge}>
                <Text style={styles.weekLabel}>{weeks}sem</Text>
              </View>
              <View style={styles.weekData}>
                <Text style={styles.weekWeight}>{data.weight_expected_kg.toFixed(1)} kg</Text>
                <Text style={styles.weekRange}>
                  [{data.weight_min_kg.toFixed(1)} – {data.weight_max_kg.toFixed(1)}]
                </Text>
              </View>
              <View style={styles.weekChanges}>
                <Text style={styles.fatChange}>
                  {data.fat_mass_expected_kg.toFixed(1)}kg gordura
                </Text>
                <Text style={styles.muscleChange}>
                  {data.lean_mass_expected_kg.toFixed(1)}kg músculo
                </Text>
              </View>
            </View>
          ) : null
        )}
      </View>

      <TouchableOpacity style={styles.recalcButton} onPress={() => loadProjection(true)}>
        <Text style={styles.recalcText}>↺ Recalcular projeção</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

function ScoreCircle({ score, label, main }: { score: number; label: string; main?: boolean }) {
  const color = score >= 70 ? '#00E5A0' : score >= 40 ? '#F5A623' : '#FF6B6B'
  return (
    <View style={styles.scoreItem}>
      <View style={[styles.scoreCircle, main && styles.scoreCircleMain, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, main && styles.scoreNumberMain, { color }]}>{Math.round(score)}</Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

function calibQuality(q: string) {
  const map: Record<string, string> = {
    insufficient: 'Insuficiente', low: 'Baixa', medium: 'Média', high: 'Alta'
  }
  return map[q] ?? q
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117', padding: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  warningCard: {
    backgroundColor: '#2A1F0A', borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#F5A62366',
  },
  warningTitle: { color: '#F5A623', fontWeight: '700', marginBottom: 4 },
  warningText: { color: '#aaa', fontSize: 13 },
  warningConfidence: { color: '#F5A623', fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: '#1C1F2A', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#2A2D3A',
  },
  cardTitle: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 14, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreItem: { alignItems: 'center' },
  scoreCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  scoreCircleMain: { width: 64, height: 64, borderRadius: 32, borderWidth: 3 },
  scoreNumber: { fontSize: 16, fontWeight: '800' },
  scoreNumberMain: { fontSize: 20 },
  scoreLabel: { color: '#666', fontSize: 11, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  metaItem: { alignItems: 'center' },
  metaLabel: { color: '#666', fontSize: 11, marginBottom: 2 },
  metaValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  calibBadge: {
    backgroundColor: '#2A2D3A', borderRadius: 8, padding: 8, alignItems: 'center',
  },
  calibText: { color: '#888', fontSize: 12 },
  scenarioTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  scenarioTab: {
    flex: 1, padding: 10, borderRadius: 12, borderWidth: 1,
    borderColor: '#2A2D3A', backgroundColor: '#1C1F2A', alignItems: 'center',
  },
  scenarioTabActive: { borderColor: '#00E5A0', backgroundColor: '#00E5A015' },
  scenarioTabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  scenarioTabTextActive: { color: '#00E5A0' },
  scenarioPct: { color: '#444', fontSize: 10, marginTop: 2 },
  scenarioPctActive: { color: '#00E5A066' },
  weekRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2A2D3A',
  },
  weekBadge: {
    backgroundColor: '#2A2D3A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 12,
  },
  weekLabel: { color: '#888', fontSize: 12, fontWeight: '700' },
  weekData: { flex: 1 },
  weekWeight: { color: '#fff', fontSize: 18, fontWeight: '800' },
  weekRange: { color: '#666', fontSize: 11 },
  weekChanges: { alignItems: 'flex-end' },
  fatChange: { color: '#FF6B6B', fontSize: 11, fontWeight: '600' },
  muscleChange: { color: '#4A90E2', fontSize: 11, fontWeight: '600' },
  recalcButton: {
    borderWidth: 1, borderColor: '#2A2D3A', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  recalcText: { color: '#666', fontSize: 14 },
})
