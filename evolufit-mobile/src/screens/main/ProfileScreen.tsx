import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/auth.store'

type Goal = 'lose_fat' | 'gain_muscle' | 'maintain' | 'recomposition'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
type Sex = 'male' | 'female'

const GOAL_LABELS: Record<Goal, string> = {
  lose_fat: 'Perder gordura',
  gain_muscle: 'Ganhar músculo',
  maintain: 'Manter peso',
  recomposition: 'Recomposição',
}

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentário',
  light: 'Levemente ativo',
  moderate: 'Moderadamente ativo',
  active: 'Ativo',
  very_active: 'Muito ativo',
}

interface Profile {
  height_cm: number
  birth_date: string
  sex: Sex
  goal: Goal
  activity_level: ActivityLevel
}

export function ProfileScreen() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // form state
  const [heightCm, setHeightCm] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [goal, setGoal] = useState<Goal>('lose_fat')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')

  useEffect(() => {
    api.get('/users/me/profile')
      .then(({ data }) => {
        setProfile(data)
        setHeightCm(String(data.height_cm))
        setBirthDate(formatDate(data.birth_date))
        setSex(data.sex)
        setGoal(data.goal)
        setActivityLevel(data.activity_level)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function formatDate(iso: string) {
    const [y, m, d] = iso.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  }

  function parseDate(dmy: string) {
    const [d, m, y] = dmy.split('/')
    return `${y}-${m}-${d}`
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await api.put('/users/me/profile', {
        height_cm: Number(heightCm),
        birth_date: parseDate(birthDate),
        sex, goal, activity_level: activityLevel,
      })
      setProfile(data)
      setEditing(false)
      Alert.alert('Sucesso', 'Perfil atualizado!')
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F1117' }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil</Text>

      {/* Info do usuário */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Perfil biométrico */}
      {!editing ? (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dados biométricos</Text>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Editar</Text>
            </TouchableOpacity>
          </View>

          {profile ? (
            <View style={styles.card}>
              <InfoRow label="Altura" value={`${profile.height_cm} cm`} />
              <InfoRow label="Nascimento" value={formatDate(profile.birth_date)} />
              <InfoRow label="Sexo" value={profile.sex === 'male' ? 'Masculino' : 'Feminino'} />
              <InfoRow label="Objetivo" value={GOAL_LABELS[profile.goal]} />
              <InfoRow label="Atividade" value={ACTIVITY_LABELS[profile.activity_level]} last />
            </View>
          ) : (
            <TouchableOpacity style={styles.setupCard} onPress={() => setEditing(true)}>
              <Text style={styles.setupText}>+ Configurar perfil</Text>
              <Text style={styles.setupSub}>Necessário para calcular projeções</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtn}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm}
            keyboardType="numeric" placeholderTextColor="#888" />

          <Text style={styles.label}>Data de nascimento</Text>
          <TextInput
            style={styles.input}
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

          <Text style={styles.label}>Sexo biológico</Text>
          <View style={styles.chipRow}>
            {(['male', 'female'] as Sex[]).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, sex === s && styles.chipActive]} onPress={() => setSex(s)}>
                <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                  {s === 'male' ? 'Masculino' : 'Feminino'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Objetivo</Text>
          <View style={styles.chipRow}>
            {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([k, v]) => (
              <TouchableOpacity key={k} style={[styles.chip, goal === k && styles.chipActive]} onPress={() => setGoal(k)}>
                <Text style={[styles.chipText, goal === k && styles.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nível de atividade</Text>
          {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([k, v]) => (
            <TouchableOpacity key={k} style={[styles.option, activityLevel === k && styles.optionActive]} onPress={() => setActivityLevel(k)}>
              <Text style={[styles.optionText, activityLevel === k && styles.optionTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.saveBtnText}>Salvar alterações</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 20 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1C1F2A', borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: '#2A2D3A',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#00E5A0',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#0F1117', fontWeight: '800', fontSize: 22 },
  userName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userEmail: { color: '#888', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#aaa', fontWeight: '600', fontSize: 13, textTransform: 'uppercase' },
  editBtn: { color: '#00E5A0', fontWeight: '600', fontSize: 14 },
  cancelBtn: { color: '#FF6B6B', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#1C1F2A', borderRadius: 16, borderWidth: 1, borderColor: '#2A2D3A', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#2A2D3A' },
  infoLabel: { color: '#888', fontSize: 14 },
  infoValue: { color: '#fff', fontWeight: '600', fontSize: 14 },
  setupCard: {
    backgroundColor: '#1C1F2A', borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2D3A', borderStyle: 'dashed', marginBottom: 20,
  },
  setupText: { color: '#00E5A0', fontWeight: '700', fontSize: 16 },
  setupSub: { color: '#666', fontSize: 12, marginTop: 4 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12,
    padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2A2D3A',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A',
  },
  chipActive: { backgroundColor: '#00E5A0', borderColor: '#00E5A0' },
  chipText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#0F1117' },
  option: {
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2D3A',
    backgroundColor: '#1C1F2A', marginBottom: 8,
  },
  optionActive: { borderColor: '#00E5A0', backgroundColor: '#00E5A015' },
  optionText: { color: '#aaa', fontSize: 14 },
  optionTextActive: { color: '#00E5A0', fontWeight: '600' },
  saveBtn: { backgroundColor: '#00E5A0', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
  logoutBtn: {
    marginTop: 20, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#FF6B6B44', alignItems: 'center',
  },
  logoutText: { color: '#FF6B6B', fontWeight: '600', fontSize: 14 },
})
