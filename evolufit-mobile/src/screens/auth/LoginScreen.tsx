import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { useAuthStore } from '../../store/auth.store'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha')
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>EvoluFit</Text>
        <Text style={styles.subtitle}>Sua evolução, projetada.</Text>

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
          placeholder="Senha"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
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
