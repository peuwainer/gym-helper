import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, FlatList, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { WorkoutTemplate, ExerciseLog, SetLog } from '../../types';
import { getTemplate, saveSession, getLastWeights } from '../../lib/db';
import { ExerciseImage } from '../../components/ExerciseImage';
import { fonts } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';
import { getWorkoutDraft, saveWorkoutDraft, clearWorkoutDraft } from '../../lib/storage';

function SetRow({
  set,
  index,
  lastWeight,
  onChange,
}: {
  set: SetLog;
  index: number;
  lastWeight?: number;
  onChange: (set: SetLog) => void;
}) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    setRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 6, borderRadius: 8, paddingHorizontal: 4,
    },
    setRowDone: { backgroundColor: colors.accentSurface },
    setNumber: { width: 20, fontSize: 13, color: colors.textDisabled, textAlign: 'center', fontFamily: fonts.body },
    setField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
    setLabel: { fontSize: 11, color: colors.textDisabled, fontFamily: fonts.body },
    setInput: {
      flex: 1, backgroundColor: colors.surface2, borderRadius: 6, padding: 6,
      color: colors.text, fontSize: 15, fontFamily: fonts.bodyMedium, textAlign: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    checkBtn: {
      width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    checkBtnDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  });

  return (
    <View style={[styles.setRow, set.completed && styles.setRowDone]}>
      <Text style={styles.setNumber}>{index + 1}</Text>

      <View style={styles.setField}>
        <Text style={styles.setLabel}>kg</Text>
        <TextInput
          style={styles.setInput}
          value={set.weight > 0 ? set.weight.toString() : ''}
          onChangeText={v => onChange({ ...set, weight: parseFloat(v) || 0 })}
          placeholder={lastWeight ? lastWeight.toString() : '0'}
          placeholderTextColor={colors.textDisabled}
          keyboardType="decimal-pad"
          editable={!set.completed}
        />
      </View>

      <View style={styles.setField}>
        <Text style={styles.setLabel}>reps</Text>
        <TextInput
          style={styles.setInput}
          value={set.repsCompleted > 0 ? set.repsCompleted.toString() : ''}
          onChangeText={v => onChange({ ...set, repsCompleted: parseInt(v) || 0 })}
          placeholder={set.repsCompleted.toString()}
          placeholderTextColor={colors.textDisabled}
          keyboardType="number-pad"
          editable={!set.completed}
        />
      </View>

      <TouchableOpacity
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={() => onChange({ ...set, completed: !set.completed })}
      >
        {set.completed ? <Check size={16} color={colors.bg} /> : <Check size={16} color={colors.textDisabled} />}
      </TouchableOpacity>
    </View>
  );
}

function ExercisePanel({
  log,
  lastWeights,
  onChange,
}: {
  log: ExerciseLog;
  lastWeights: Record<number, any>;
  onChange: (log: ExerciseLog) => void;
}) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    exercisePanel: {
      backgroundColor: colors.surface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    exercisePanelDone: { borderColor: colors.accentBorder },
    exerciseHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 14, gap: 12,
    },
    exerciseHeaderLeft: { flex: 1 },
    exerciseName: { fontSize: 16, fontFamily: fonts.displayMedium, color: colors.text, marginBottom: 2 },
    exerciseMeta: { fontSize: 12, color: colors.textSubtle, fontFamily: fonts.body },
    exerciseHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    donePill: {
      backgroundColor: colors.accent, borderRadius: 10,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    donePillText: { fontSize: 11, color: colors.bg, fontFamily: fonts.bodyBold },
    setsProgress: { fontSize: 13, color: colors.textSubtle, fontFamily: fonts.body },
    setsContainer: { padding: 14, paddingTop: 0 },
    setHeader: {
      flexDirection: 'row', paddingBottom: 6,
      borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 6,
    },
    setLabel: { fontSize: 11, color: colors.textDisabled, fontFamily: fonts.body },
  });

  const [expanded, setExpanded] = useState(true);
  const lastWeight = lastWeights[log.exerciseId]?.weight;
  const completedSets = log.sets.filter(s => s.completed).length;
  const allDone = completedSets === log.sets.length;

  function updateSet(index: number, set: SetLog) {
    const sets = [...log.sets];
    sets[index] = set;
    onChange({ ...log, sets });
  }

  return (
    <View style={[styles.exercisePanel, allDone && styles.exercisePanelDone]}>
      <TouchableOpacity style={styles.exerciseHeader} onPress={() => setExpanded(v => !v)}>
        <ExerciseImage exerciseName={log.exerciseName} exerciseNameEn={log.exerciseNameEn} size={48} />
        <View style={styles.exerciseHeaderLeft}>
          <TouchableOpacity
            onPress={() => {
              const query = encodeURIComponent(log.exerciseNameEn || log.exerciseName);
              Linking.openURL(`https://www.google.com/search?q=${query}&tbm=isch`);
            }}
          >
            <Text style={styles.exerciseName}>{log.exerciseName}</Text>
          </TouchableOpacity>
          <Text style={styles.exerciseMeta}>
            {log.targetSets}x{log.targetReps}
            {lastWeight ? `  ·  última vez: ${lastWeight}kg` : ''}
          </Text>
        </View>
        <View style={styles.exerciseHeaderRight}>
          {allDone && <View style={styles.donePill}><Text style={styles.donePillText}>✓</Text></View>}
          <Text style={styles.setsProgress}>{completedSets}/{log.sets.length}</Text>
          {expanded ? <ChevronUp size={16} color={colors.textSubtle} /> : <ChevronDown size={16} color={colors.textSubtle} />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.setsContainer}>
          <View style={styles.setHeader}>
            <Text style={[styles.setLabel, { width: 24 }]}>#</Text>
            <Text style={[styles.setLabel, { flex: 1 }]}>kg</Text>
            <Text style={[styles.setLabel, { flex: 1 }]}>reps</Text>
            <Text style={[styles.setLabel, { width: 36 }]}>ok</Text>
          </View>
          {log.sets.map((set, i) => (
            <SetRow
              key={i}
              set={set}
              index={i}
              lastWeight={lastWeight}
              onChange={s => updateSet(i, s)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Number(id);
  const router = useRouter();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [lastWeights, setLastWeights] = useState<Record<number, any>>({});
  const [startTime, setStartTime] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDraftRestored, setShowDraftRestored] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    progressBar: { height: 3, backgroundColor: colors.surface },
    progressFill: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
    progressText: { fontSize: 12, color: colors.textSubtle, textAlign: 'center', paddingVertical: 6, fontFamily: fonts.body },
    draftRestoredBanner: {
      alignSelf: 'center',
      backgroundColor: colors.accentSurface,
      borderColor: colors.accentBorder,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 6,
    },
    draftRestoredText: { fontSize: 12, color: colors.accent, fontFamily: fonts.bodyBold },
    list: { padding: 16, gap: 12, paddingBottom: 40 },
    finishBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: colors.accent, padding: 16, borderRadius: 14, marginTop: 8,
    },
    finishText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.bg },
  });

  useEffect(() => {
    loadWorkout();
  }, [templateId]);

  useEffect(() => {
    if (!isLoaded || !Number.isFinite(templateId) || !logs.length || finished) return;

    const timeout = setTimeout(() => {
      saveWorkoutDraft(templateId, startTime, logs).catch(() => {
        // Silent fail: autosave must never block the workout flow.
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [templateId, logs, startTime, finished, isLoaded]);

  useEffect(() => {
    if (!showDraftRestored) return;

    const timeout = setTimeout(() => setShowDraftRestored(false), 3000);
    return () => clearTimeout(timeout);
  }, [showDraftRestored]);

  async function loadWorkout() {
    if (!Number.isFinite(templateId)) return;

    setIsLoaded(false);
    const t = await getTemplate(templateId);
    if (!t) return;
    setTemplate(t);

    const lw = await getLastWeights();
    setLastWeights(lw);

    const initialLogs: ExerciseLog[] = t.exercises.map(ex => ({
      exerciseId: ex.exercise.id,
      exerciseName: ex.exercise.name,
      exerciseNameEn: ex.exercise.nameEn,
      targetSets: ex.sets,
      targetReps: ex.reps,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: lw[ex.exercise.id]?.weight || 0,
        repsCompleted: ex.reps,
        completed: false,
      })),
    }));

    const draft = await getWorkoutDraft(templateId);
    if (draft && isDraftCompatible(t, draft.logs)) {
      setLogs(draft.logs);
      setStartTime(draft.startedAt);
      setShowDraftRestored(true);
    } else {
      setLogs(initialLogs);
      setStartTime(Date.now());
      setShowDraftRestored(false);
    }

    setIsLoaded(true);
  }

  function updateLog(index: number, log: ExerciseLog) {
    const updated = [...logs];
    updated[index] = log;
    setLogs(updated);
  }

  async function handleFinish() {
    if (finished) return;
    const completedAny = logs.some(l => l.sets.some(s => s.completed));
    if (!completedAny) {
      Alert.alert('Nenhuma série completada', 'Complete ao menos uma série antes de finalizar.');
      return;
    }

    const durationMinutes = Math.round((Date.now() - startTime) / 60000);

    const sessionId = await saveSession({
      templateId,
      date: new Date().toISOString(),
      durationMinutes,
      exercises: logs,
    });

    await clearWorkoutDraft(templateId);
    setFinished(true);
    router.push(`/debrief/${sessionId}`);
  }

  function handleQuit() {
    Alert.alert('Sair do treino', 'Sair sem salvar?', [
      { text: 'Continuar treinando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  const completedCount = logs.filter(l => l.sets.every(s => s.completed)).length;

  if (!template) return null;

  return (
    <>
      <Stack.Screen options={{ title: template.name, headerLeft: () => (
        <TouchableOpacity onPress={handleQuit}>
          <X size={20} color={colors.error} />
        </TouchableOpacity>
      )}} />

      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(completedCount / logs.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedCount}/{logs.length} exercícios completos
        </Text>
        {showDraftRestored && (
          <View style={styles.draftRestoredBanner}>
            <Text style={styles.draftRestoredText}>Rascunho restaurado</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.list}>
          {logs.map((log, i) => (
            <ExercisePanel
              key={log.exerciseId + '-' + i}
              log={log}
              lastWeights={lastWeights}
              onChange={l => updateLog(i, l)}
            />
          ))}

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Check size={20} color={colors.bg} />
            <Text style={styles.finishText}>Finalizar Treino</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

function isDraftCompatible(template: WorkoutTemplate, draftLogs: ExerciseLog[]): boolean {
  if (template.exercises.length !== draftLogs.length) return false;

  return template.exercises.every((exercise, index) => {
    const draftExercise = draftLogs[index];
    if (!draftExercise) return false;
    return (
      exercise.exercise.id === draftExercise.exerciseId &&
      exercise.sets === draftExercise.targetSets &&
      exercise.reps === draftExercise.targetReps &&
      draftExercise.sets.length === exercise.sets
    );
  });
}
