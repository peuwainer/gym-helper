import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { WorkoutTemplate, ExerciseLog, SetLog } from '../../types';
import { getTemplate, saveSession, getLastWeights } from '../../lib/db';

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
          placeholderTextColor="#444"
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
          placeholderTextColor="#444"
          keyboardType="number-pad"
          editable={!set.completed}
        />
      </View>

      <TouchableOpacity
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={() => onChange({ ...set, completed: !set.completed })}
      >
        {set.completed ? <Check size={16} color="#0f0f0f" /> : <Check size={16} color="#333" />}
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
        <View style={styles.exerciseHeaderLeft}>
          <Text style={styles.exerciseName}>{log.exerciseName}</Text>
          <Text style={styles.exerciseMeta}>
            {log.targetSets}x{log.targetReps}
            {lastWeight ? `  ·  última vez: ${lastWeight}kg` : ''}
          </Text>
        </View>
        <View style={styles.exerciseHeaderRight}>
          {allDone && <View style={styles.donePill}><Text style={styles.donePillText}>✓</Text></View>}
          <Text style={styles.setsProgress}>{completedSets}/{log.sets.length}</Text>
          {expanded ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [lastWeights, setLastWeights] = useState<Record<number, any>>({});
  const [startTime] = useState(Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, [id]);

  async function loadWorkout() {
    const t = await getTemplate(parseInt(id));
    if (!t) return;
    setTemplate(t);

    const lw = await getLastWeights();
    setLastWeights(lw);

    const initialLogs: ExerciseLog[] = t.exercises.map(ex => ({
      exerciseId: ex.exercise.id,
      exerciseName: ex.exercise.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: lw[ex.exercise.id]?.weight || 0,
        repsCompleted: ex.reps,
        completed: false,
      })),
    }));
    setLogs(initialLogs);
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
      templateId: parseInt(id),
      date: new Date().toISOString(),
      durationMinutes,
      exercises: logs,
    });

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
          <X size={20} color="#ef4444" />
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
            <Check size={20} color="#0f0f0f" />
            <Text style={styles.finishText}>Finalizar Treino</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  progressBar: { height: 3, backgroundColor: '#1a1a1a' },
  progressFill: { height: 3, backgroundColor: '#4ade80', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#555', textAlign: 'center', paddingVertical: 6 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  exercisePanel: {
    backgroundColor: '#1a1a1a', borderRadius: 14,
    borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden',
  },
  exercisePanelDone: { borderColor: '#1f4d2e' },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  exerciseHeaderLeft: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  exerciseMeta: { fontSize: 12, color: '#555' },
  exerciseHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donePill: {
    backgroundColor: '#4ade80', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  donePillText: { fontSize: 11, color: '#0f0f0f', fontWeight: '700' },
  setsProgress: { fontSize: 13, color: '#555' },
  setsContainer: { padding: 14, paddingTop: 0 },
  setHeader: {
    flexDirection: 'row', paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: '#222', marginBottom: 6,
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, borderRadius: 8, paddingHorizontal: 4,
  },
  setRowDone: { backgroundColor: '#0d2016' },
  setNumber: { width: 20, fontSize: 13, color: '#444', textAlign: 'center' },
  setField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  setLabel: { fontSize: 11, color: '#444' },
  setInput: {
    flex: 1, backgroundColor: '#111', borderRadius: 6, padding: 6,
    color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  checkBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBtnDone: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  finishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4ade80', padding: 16, borderRadius: 14, marginTop: 8,
  },
  finishText: { fontSize: 16, fontWeight: '700', color: '#0f0f0f' },
});
