import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { AuthStackParamList } from '../../types/navigation'
import { api } from '../../services/api'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>
  route: RouteProp<AuthStackParamList, 'ResetPassword'>
}

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const passwordRef = useRef<TextInput>(null)

  function validate() {
    const e: Record<string, string> = {}
    if (!code || code.length !== 6) e.code = 'Código deve ter 6 dígitos'
    if (!newPassword || newPassword.length < 6) e.newPassword = 'Senha deve ter pelo menos 6 caracteres'
    if (newPassword !== confirmPassword) e.confirmPassword = 'As senhas não coincidem'
    return e
  }

  async function handleReset() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        code: code.trim(),
        new_password: newPassword,
      })
      setSuccess(true)
    } catch (err: any) {
      setErrors({ api: err?.response?.data?.message ?? 'Código inválido ou expirado' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.logo}>EvoluFit</Text>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Senha redefinida!</Text>
            <Text style={styles.successDesc}>Sua senha foi alterada com sucesso. Faça login com a nova senha.</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Ir para o login →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>EvoluFit</Text>
        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.subtitle}>
          Insira o código enviado para{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {errors.api && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {errors.api}</Text>
          </View>
        )}

        <Text style={styles.label}>Código de 6 dígitos</Text>
        <TextInput
          style={[styles.input, styles.codeInput, errors.code && styles.inputError]}
          placeholder="000000"
          placeholderTextColor="#444"
          value={code}
          onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setErrors((p) => ({ ...p, code: '' })) }}
          keyboardType="numeric"
          maxLength={6}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        {errors.code ? <Text style={styles.fieldError}>{errors.code}</Text> : null}

        <Text style={styles.label}>Nova senha</Text>
        <TextInput
          ref={passwordRef}
          style={[styles.input, errors.newPassword && styles.inputError]}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#888"
          value={newPassword}
          onChangeText={(v) => { setNewPassword(v); setErrors((p) => ({ ...p, newPassword: '' })) }}
          secureTextEntry
        />
        {errors.newPassword ? <Text style={styles.fieldError}>{errors.newPassword}</Text> : null}

        <Text style={styles.label}>Confirmar nova senha</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Repita a senha"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((p) => ({ ...p, confirmPassword: '' })) }}
          secureTextEntry
        />
        {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#0F1117" /> : <Text style={styles.buttonText}>Redefinir senha</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Voltar</Text>
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
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emailHighlight: { color: '#fff', fontWeight: '600' },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1C1F2A', color: '#fff', borderRadius: 12,
    padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#2A2D3A',
  },
  codeInput: { fontSize: 28, fontWeight: '800', letterSpacing: 10, textAlign: 'center', color: '#00E5A0' },
  inputError: { borderColor: '#FF6B6B', backgroundColor: '#2A1C1C' },
  fieldError: { color: '#FF6B6B', fontSize: 12, marginTop: 5, marginLeft: 4 },
  errorBanner: {
    backgroundColor: '#2A1C1C', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 8,
  },
  errorBannerText: { color: '#FF6B6B', fontSize: 13 },
  button: {
    backgroundColor: '#00E5A0', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 20,
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
})
