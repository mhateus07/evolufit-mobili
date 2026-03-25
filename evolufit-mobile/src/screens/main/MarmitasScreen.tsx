import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { api } from '../../services/api'

interface Marmita {
  id: string
  name: string
  description: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  price_cents: number
  tags: string[]
}

interface Suggestion {
  id: string
  marmita: Marmita
  reason: string
  gap_covered_calories: number
  gap_covered_protein_g: number
}

type View_ = 'suggestions' | 'catalog'

export function MarmitasScreen() {
  const [view, setView] = useState<View_>('suggestions')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [catalog, setCatalog] = useState<Marmita[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    try {
      const [suggestRes, catalogRes] = await Promise.allSettled([
        api.get('/marmitas/suggestions'),
        api.get('/marmitas'),
      ])
      if (suggestRes.status === 'fulfilled') setSuggestions(suggestRes.value.data ?? [])
      if (catalogRes.status === 'fulfilled') setCatalog(catalogRes.value.data ?? [])
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

  async function trackView(suggestionId: string) {
    try { await api.post(`/marmitas/suggestions/${suggestionId}/view`) } catch {}
  }

  async function trackPurchase(suggestionId: string) {
    try {
      await api.post(`/marmitas/suggestions/${suggestionId}/purchase`)
      Alert.alert('Compra registrada!', 'Obrigado. Isso ajuda a melhorar as sugestões.')
    } catch {}
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#00E5A0" size="large" /></View>
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Marmitas</Text>

      <View style={styles.tabs}>
        {(['suggestions', 'catalog'] as View_[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.tab, view === v && styles.tabActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.tabText, view === v && styles.tabTextActive]}>
              {v === 'suggestions' ? '✨ Sugestões' : '📋 Catálogo'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'suggestions' ? (
        suggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🥗</Text>
            <Text style={styles.emptyTitle}>Tudo certo hoje!</Text>
            <Text style={styles.emptyText}>Nenhuma sugestão — suas metas nutricionais estão sendo cumpridas</Text>
          </View>
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5A0" />}
            renderItem={({ item }) => (
              <SuggestionCard
                suggestion={item}
                onView={() => trackView(item.id)}
                onPurchase={() => trackPurchase(item.id)}
              />
            )}
          />
        )
      ) : (
        <FlatList
          data={catalog}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5A0" />}
          renderItem={({ item }) => <MarmitaCard marmita={item} />}
        />
      )}
    </SafeAreaView>
  )
}

function SuggestionCard({ suggestion, onView, onPurchase }: {
  suggestion: Suggestion
  onView: () => void
  onPurchase: () => void
}) {
  const { marmita } = suggestion
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{marmita.name}</Text>
        <Text style={styles.cardPrice}>{marmita.price_cents != null ? `R$ ${(marmita.price_cents / 100).toFixed(2)}` : ''}</Text>
      </View>
      <Text style={styles.reasonText}>{suggestion.reason}</Text>
      <View style={styles.macros}>
        <MacroBadge label="Proteína" value={`${marmita.protein_g}g`} color="#00E5A0" />
        <MacroBadge label="Calorias" value={`${marmita.calories}kcal`} color="#4A90E2" />
        {suggestion.gap_covered_protein_g > 0 && (
          <MacroBadge label="Cobre gap" value={`+${suggestion.gap_covered_protein_g.toFixed(0)}g prot`} color="#F5A623" />
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.viewBtn} onPress={onView}>
          <Text style={styles.viewBtnText}>Ver detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.purchaseBtn} onPress={onPurchase}>
          <Text style={styles.purchaseBtnText}>Registrar compra</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function MarmitaCard({ marmita }: { marmita: Marmita }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{marmita.name}</Text>
        <Text style={styles.cardPrice}>{marmita.price_cents != null ? `R$ ${(marmita.price_cents / 100).toFixed(2)}` : ''}</Text>
      </View>
      {marmita.description && <Text style={styles.descText}>{marmita.description}</Text>}
      <View style={styles.macros}>
        <MacroBadge label="Proteína" value={`${marmita.protein_g}g`} color="#00E5A0" />
        <MacroBadge label="Calorias" value={`${marmita.calories}kcal`} color="#4A90E2" />
        <MacroBadge label="Carbs" value={`${marmita.carbs_g}g`} color="#F5A623" />
        <MacroBadge label="Gordura" value={`${marmita.fat_g}g`} color="#FF6B6B" />
      </View>
      {marmita.tags?.length > 0 && (
        <View style={styles.tags}>
          {marmita.tags.map((tag) => (
            <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
          ))}
        </View>
      )}
    </View>
  )
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroBadge, { borderColor: color + '44' }]}>
      <Text style={[styles.macroBadgeValue, { color }]}>{value}</Text>
      <Text style={styles.macroBadgeLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', padding: 20, paddingBottom: 0 },
  tabs: { flexDirection: 'row', padding: 16, gap: 10 },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#1C1F2A', borderWidth: 1, borderColor: '#2A2D3A',
  },
  tabActive: { backgroundColor: '#00E5A015', borderColor: '#00E5A0' },
  tabText: { color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#00E5A0' },
  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  card: {
    backgroundColor: '#1C1F2A', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2A2D3A',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardName: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14, marginRight: 8 },
  cardPrice: { color: '#00E5A0', fontWeight: '800', fontSize: 16 },
  reasonText: { color: '#888', fontSize: 12, marginBottom: 10 },
  descText: { color: '#777', fontSize: 12, marginBottom: 10 },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  macroBadge: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center',
  },
  macroBadgeValue: { fontSize: 13, fontWeight: '700' },
  macroBadgeLabel: { fontSize: 10, color: '#666' },
  cardActions: { flexDirection: 'row', gap: 8 },
  viewBtn: {
    flex: 1, padding: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#2A2D3A', alignItems: 'center',
  },
  viewBtnText: { color: '#aaa', fontSize: 13 },
  purchaseBtn: {
    flex: 1, padding: 10, borderRadius: 10,
    backgroundColor: '#00E5A0', alignItems: 'center',
  },
  purchaseBtnText: { color: '#0F1117', fontWeight: '700', fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#2A2D3A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: '#888', fontSize: 11 },
})
