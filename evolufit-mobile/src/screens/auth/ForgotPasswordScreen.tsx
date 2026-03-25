import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { api } from '../../services/api'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>
}

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSend() {
    setError('')
    if (!email.trim()) { setError('Informe seu email'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Email inválido'); return }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.logo}>EvoluFit</Text>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.successTitle}>Email enviado!</Text>
            <Text style={styles.successDesc}>
              Verifique sua caixa de entrada em{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
              {'\n\n'}O código expira em 15 minutos.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() })}
          >
            <Text style={styles.buttonText}>Inserir código →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>← Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>EvoluFit</Text>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>Informe seu email e enviaremos um código de 6 dígitos para redefinir sua senha.</Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Seu email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={(v) => { setEmail(v); setError('') }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
        {error ? <Text style={styles.fieldError}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loading}>
          {loading ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Enviar código</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '800', color: '#00E5A0', textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  input: {
    backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 4, fontSize: 16,
    borderWidth: 1, borderColor: '#2A2D3A',
  },
  inputError: { borderColor: '#FF6B6B', backgroundColor: '#2A1C1C' },
  fieldError: { color: '#FF6B6B', fontSize: 12, marginBottom: 12, marginLeft: 4 },
  button: {
    backgroundColor: '#00E5A0', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 20,
  },
  buttonText: { color: '#0F1117', fontWeight: '700', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', fontSize: 14 },
  successCard: {
    backgroundColor: '#1C1F2A', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#00E5A033', alignItems: 'center', marginBottom: 24,
  },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { color: '#00E5A0', fontWeight: '800', fontSize: 20, marginBottom: 8 },
  successDesc: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: '#fff', fontWeight: '600' },
})
