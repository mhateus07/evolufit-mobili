import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native'
import { api } from '../../services/api'

type Goal = 'lose_fat' | 'gain_muscle' | 'maintain' | 'recomposition'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
type Sex = 'male' | 'female'

const GOALS: { value: Goal; label: string }[] = [
  { value: 'lose_fat', label: 'Perder gordura' },
  { value: 'gain_muscle', label: 'Ganhar músculo' },
  { value: 'maintain', label: 'Manter peso' },
  { value: 'recomposition', label: 'Recomposição' },
]

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentário' },
  { value: 'light', label: 'Levemente ativo' },
  { value: 'moderate', label: 'Moderadamente ativo' },
  { value: 'active', label: 'Ativo' },
  { value: 'very_active', label: 'Muito ativo' },
]

export function ProfileSetupScreen() {
  const [heightCm, setHeightCm] = useState('')
  const [birthDate, setBirthDate] = useState('') // DD/MM/AAAA
  const [sex, setSex] = useState<Sex>('male')
  const [goal, setGoal] = useState<Goal>('lose_fat')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [loading, setLoading] = useState(false)

  function parseBirthDate(input: string): string {
    // Converte DD/MM/AAAA → AAAA-MM-DD
    const [day, month, year] = input.split('/')
    return `${year}-${month}-${day}`
  }

  async function handleSave() {
    if (!heightCm || !birthDate) {
      Alert.alert('Erro', 'Preencha altura e data de nascimento')
      return
    }
    const parts = birthDate.split('/')
    if (parts.length !== 3 || parts[2].length !== 4) {
      Alert.alert('Erro', 'Data no formato DD/MM/AAAA')
      return
    }
    setLoading(true)
    try {
      await api.put('/users/me/profile', {
        height_cm: Number(heightCm),
        birth_date: parseBirthDate(birthDate),
        sex,
        goal,
        activity_level: activityLevel,
      })
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configure seu perfil</Text>
      <Text style={styles.subtitle}>Essas informações permitem projeções precisas</Text>

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 175"
        placeholderTextColor="#888"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Data de nascimento</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/AAAA"
        placeholderTextColor="#888"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Sexo biológico</Text>
      <View style={styles.row}>
        {(['male', 'female'] as Sex[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, sex === s && styles.chipActive]}
            onPress={() => setSex(s)}
          >
            <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
              {s === 'male' ? 'Masculino' : 'Feminino'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Objetivo</Text>
      <View style={styles.grid}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.chip, goal === g.value && styles.chipActive]}
            onPress={() => setGoal(g.value)}
          >
            <Text style={[styles.chipText, goal === g.value && styles.chipTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Nível de atividade</Text>
      {ACTIVITY_LEVELS.map((a) => (
        <TouchableOpacity
          key={a.value}
          style={[styles.option, activityLevel === a.value && styles.optionActive]}
          onPress={() => setActivityLevel(a.value)}
        >
          <Text style={[styles.optionText, activityLevel === a.value && styles.optionTextActive]}>
            {a.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continuar</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 28 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12,
    padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#2A2D3A',
  },
  row: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#2A2D3A', backgroundColor: '#1C1F2A',
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
  button: {
    backgroundColor: '#00E5A0', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 28,
  },
  buttonText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
})
