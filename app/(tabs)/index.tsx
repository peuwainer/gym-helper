import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Send, Trash2, Play } from 'lucide-react-native';
import { ChatMessage, WorkoutTemplate } from '../../types';
import { colors, fonts } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { sendMessage } from '../../lib/claude';
import { getApiKey } from '../../lib/storage';
import { saveChatMessage, getChatHistory, clearChatHistory, saveTemplate } from '../../lib/db';
import { ExerciseImage } from '../../components/ExerciseImage';

function WorkoutCard({ workout, onStart, onSave }: {
  workout: WorkoutTemplate;
  onStart: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.workoutCard}>
      <Text style={styles.workoutTitle}>{workout.name}</Text>
      {workout.description ? (
        <Text style={styles.workoutDesc}>{workout.description}</Text>
      ) : null}
      <View style={styles.exerciseList}>
        {workout.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseRow}>
            <ExerciseImage exerciseName={ex.exercise.name} exerciseNameEn={ex.exercise.nameEn} size={32} />
            <Text style={styles.exerciseItem}>
              {ex.exercise.name} — {ex.sets}x{ex.reps}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.workoutActions}>
        <TouchableOpacity style={styles.btnStart} onPress={onStart}>
          <Play size={14} color={colors.bg} />
          <Text style={styles.btnStartText}>Começar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={onSave}>
          <Text style={styles.btnSaveText}>Salvar como template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MessageBubble({ msg, onStartWorkout, onSaveWorkout }: {
  msg: ChatMessage;
  onStartWorkout: (w: WorkoutTemplate) => void;
  onSaveWorkout: (w: WorkoutTemplate) => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      {msg.workout && (
        <WorkoutCard
          workout={msg.workout}
          onStart={() => onStartWorkout(msg.workout!)}
          onSave={() => onSaveWorkout(msg.workout!)}
        />
      )}
      {msg.content ? (
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {msg.content}
        </Text>
      ) : null}
    </View>
  );
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const key = await getApiKey();
    setApiKey(key);
    const history = await getChatHistory();
    setMessages(history);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    if (!apiKey) {
      Alert.alert('API Key necessária', 'Configure sua Anthropic API Key em Configurações.');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    await saveChatMessage(userMsg);

    try {
      const history = updatedMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.workout
          ? `<workout>${JSON.stringify({ name: m.workout.name, description: m.workout.description, exercises: m.workout.exercises })}</workout>\n${m.content}`
          : m.content,
      }));

      const { text, workout } = await sendMessage(apiKey, history.slice(0, -1), userMsg.content);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        workout,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      await saveChatMessage(assistantMsg);
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao conectar com Claude.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWorkout(workout: WorkoutTemplate) {
    // Save as temp template with id=0
    const id = await saveTemplate({
      ...workout,
      name: workout.name + ' (sessão)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    router.push(`/workout/${id}`);
  }

  async function handleSaveWorkout(workout: WorkoutTemplate) {
    const id = await saveTemplate({
      ...workout,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    Alert.alert('Salvo!', `"${workout.name}" foi salvo nos seus templates.`);
  }

  async function handleClear() {
    Alert.alert('Limpar conversa', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar', style: 'destructive', onPress: async () => {
          await clearChatHistory();
          setMessages([]);
        }
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treinador IA</Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Trash2 size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      {!apiKey && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Configure sua API Key em Configurações para começar.
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => (
          <MessageBubble
            msg={item}
            onStartWorkout={handleStartWorkout}
            onSaveWorkout={handleSaveWorkout}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💪</Text>
            <Text style={styles.emptyTitle}>Olá! Sou seu treinador pessoal.</Text>
            <Text style={styles.emptyText}>
              Diga quanto tempo tem disponível, quais grupos musculares quer trabalhar, ou se há algo que quer evitar.
            </Text>
            <Text style={styles.emptyExample}>
              Exemplo: "Quero treinar 45 minutos. Ontem fiz pernas, então prefiro fazer parte superior."
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Fale com seu treinador..."
          placeholderTextColor={colors.textDisabled}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && !loading && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Send size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  headerTitle: { fontSize: 20, fontFamily: fonts.display, color: colors.text },
  banner: {
    backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.accent,
    marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 8,
  },
  bannerText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  bubble: { maxWidth: '92%', borderRadius: 16, padding: 12 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.userBubbleBg },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  bubbleText: { fontSize: 15, lineHeight: 22, fontFamily: fonts.body },
  bubbleTextUser: { color: colors.userBubbleText },
  bubbleTextAssistant: { color: colors.assistantBubbleText },
  workoutCard: {
    backgroundColor: colors.surface2, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  workoutTitle: { fontSize: 17, fontFamily: fonts.display, color: colors.accent, marginBottom: 4 },
  workoutDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 10, fontFamily: fonts.body },
  exerciseList: { gap: 8, marginBottom: 12 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseItem: { fontSize: 14, color: colors.textSecondary, flex: 1, fontFamily: fonts.body },
  workoutActions: { flexDirection: 'row', gap: 8 },
  btnStart: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, flex: 1, justifyContent: 'center',
  },
  btnStartText: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 14 },
  btnSave: {
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, flex: 1, alignItems: 'center',
  },
  btnSaveText: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.body },
  inputRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, color: colors.text,
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end',
  },
  sendBtnDisabled: { backgroundColor: colors.accentDisabled, opacity: 0.5 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.displayMedium, color: colors.text, marginBottom: 12, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16, fontFamily: fonts.body },
  emptyExample: {
    fontSize: 13, color: colors.textSubtle, textAlign: 'center', lineHeight: 20,
    fontFamily: fonts.body, backgroundColor: colors.surface, padding: 12, borderRadius: 8,
  },
});
