import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Eye, EyeOff, Check, Trash2 } from 'lucide-react-native';
import { getApiKey, setApiKey, clearApiKey } from '../../lib/storage';
import { clearChatHistory } from '../../lib/db';
import { fonts } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [apiKey, setApiKeyState] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, gap: 8, paddingBottom: 60 },
    section: {
      backgroundColor: colors.surface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 13, fontFamily: fonts.displayMedium, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.2 },
    sectionDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19, fontFamily: fonts.body },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.surface2, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
    },
    input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12, fontFamily: fonts.body },
    eyeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    keyActions: { flexDirection: 'row', gap: 10 },
    saveBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10,
      borderRadius: 8,
    },
    saveBtnSaved: { backgroundColor: colors.accentDark },
    saveBtnText: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },
    clearKeyBtn: {
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10,
      borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    },
    clearKeyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
    hint: {
      backgroundColor: colors.surface2, borderRadius: 8, padding: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    hintText: { fontSize: 12, color: colors.textSubtle, lineHeight: 18, fontFamily: fonts.body },
    dangerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    },
    dangerText: { color: colors.error, fontSize: 14, fontFamily: fonts.body },
    aboutText: { fontSize: 13, color: colors.textSubtle, lineHeight: 22, fontFamily: fonts.body },
  });

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
            placeholderTextColor={colors.textDisabled}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(v => !v)}>
            {showKey
              ? <EyeOff size={18} color={colors.textSubtle} />
              : <Eye size={18} color={colors.textSubtle} />
            }
          </TouchableOpacity>
        </View>

        <View style={styles.keyActions}>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSaved]}
            onPress={handleSave}
          >
            {saved && <Check size={16} color={colors.bg} />}
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
          <Trash2 size={16} color={colors.error} />
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
