import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { useAuthStore } from '../../store/auth.store'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>
}

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos')
      return
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter ao menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await register(name.trim(), email.trim().toLowerCase(), password)
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>EvoluFit</Text>
        <Text style={styles.subtitle}>Crie sua conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha (mínimo 6 caracteres)"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Já tem conta? <Text style={styles.linkBold}>Fazer login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 42, fontWeight: '800', color: '#00E5A0', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 12, fontSize: 16,
    borderWidth: 1, borderColor: '#2A2D3A',
  },
  button: {
    backgroundColor: '#00E5A0', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 20,
  },
  buttonText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', fontSize: 14 },
  linkBold: { color: '#00E5A0', fontWeight: '600' },
})
