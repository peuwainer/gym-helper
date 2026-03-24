import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Eye, EyeOff, Check, Trash2 } from 'lucide-react-native';
import { getApiKey, setApiKey, clearApiKey } from '../../lib/storage';
import { clearChatHistory } from '../../lib/db';

export default function SettingsScreen() {
  const [apiKey, setApiKeyState] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getApiKey().then(k => {
        if (k) setApiKeyState(k);
        setSaved(!!k);
      });
    }, [])
  );

  async function handleSave() {
    if (!apiKey.trim()) {
      Alert.alert('Erro', 'Digite uma API Key válida.');
      return;
    }
    await setApiKey(apiKey.trim());
    setSaved(true);
    Alert.alert('Salvo!', 'API Key configurada com sucesso.');
  }

  async function handleClearKey() {
    Alert.alert('Remover API Key', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          await clearApiKey();
          setApiKeyState('');
          setSaved(false);
        }
      },
    ]);
  }

  async function handleClearHistory() {
    Alert.alert('Limpar histórico de chat', 'Isso apagará toda a conversa com o treinador. Treinos salvos e histórico de sessões não serão afetados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar', style: 'destructive', onPress: async () => {
          await clearChatHistory();
          Alert.alert('Feito', 'Histórico de chat apagado.');
        }
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anthropic API Key</Text>
        <Text style={styles.sectionDesc}>
          Necessário para o treinador IA funcionar. Obtenha em console.anthropic.com
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={k => { setApiKeyState(k); setSaved(false); }}
            placeholder="sk-ant-..."
            placeholderTextColor="#333"
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(v => !v)}>
            {showKey
              ? <EyeOff size={18} color="#555" />
              : <Eye size={18} color="#555" />
            }
          </TouchableOpacity>
        </View>

        <View style={styles.keyActions}>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSaved]}
            onPress={handleSave}
          >
            {saved && <Check size={16} color="#0f0f0f" />}
            <Text style={styles.saveBtnText}>{saved ? 'Salvo' : 'Salvar'}</Text>
          </TouchableOpacity>
          {saved && (
            <TouchableOpacity style={styles.clearKeyBtn} onPress={handleClearKey}>
              <Text style={styles.clearKeyText}>Remover</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            A key é armazenada apenas neste dispositivo. Nunca é enviada para servidores externos — apenas para a API da Anthropic.
          </Text>
        </View>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados</Text>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearHistory}>
          <Trash2 size={16} color="#ef4444" />
          <Text style={styles.dangerText}>Limpar histórico de chat</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <Text style={styles.aboutText}>Gym Helper v1.0</Text>
        <Text style={styles.aboutText}>Treinador IA powered by Claude (Anthropic)</Text>
        <Text style={styles.aboutText}>Exercícios: wger REST API</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, gap: 8, paddingBottom: 60 },
  section: {
    backgroundColor: '#1a1a1a', borderRadius: 14,
    borderWidth: 1, borderColor: '#2a2a2a', padding: 16, gap: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionDesc: { fontSize: 13, color: '#666', lineHeight: 19 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#111', borderRadius: 10,
    borderWidth: 1, borderColor: '#2a2a2a', paddingHorizontal: 12,
  },
  input: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 12, fontFamily: 'monospace' },
  eyeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  keyActions: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4ade80', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnSaved: { backgroundColor: '#22c55e' },
  saveBtnText: { color: '#0f0f0f', fontWeight: '700', fontSize: 14 },
  clearKeyBtn: {
    borderWidth: 1, borderColor: '#2a2a2a', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  clearKeyText: { color: '#666', fontSize: 14 },
  hint: {
    backgroundColor: '#111', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#222',
  },
  hintText: { fontSize: 12, color: '#555', lineHeight: 18 },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a2a',
  },
  dangerText: { color: '#ef4444', fontSize: 14 },
  aboutText: { fontSize: 13, color: '#555', lineHeight: 22 },
});
