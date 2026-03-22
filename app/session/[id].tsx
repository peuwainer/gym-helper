import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WorkoutSession } from '../../types';
import { getSession } from '../../lib/db';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    getSession(parseInt(id)).then(setSession);
  }, [id]);

  if (!session) return null;

  const date = new Date(session.date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Sessão' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.date}>{date}</Text>
        {session.durationMinutes && (
          <Text style={styles.duration}>{session.durationMinutes} minutos</Text>
        )}

        {session.exercises.map((ex, i) => {
          const completedSets = ex.sets.filter(s => s.completed);
          return (
            <View key={i} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
              <Text style={styles.exerciseMeta}>
                Alvo: {ex.targetSets}x{ex.targetReps}
              </Text>
              {ex.sets.map((set, j) => (
                <View key={j} style={[styles.setRow, !set.completed && styles.setRowSkipped]}>
                  <Text style={styles.setText}>Série {j + 1}</Text>
                  <Text style={styles.setText}>{set.weight}kg</Text>
                  <Text style={styles.setText}>{set.repsCompleted} reps</Text>
                  <Text style={[styles.setStatus, set.completed ? styles.done : styles.skipped]}>
                    {set.completed ? '✓' : '—'}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  date: { fontSize: 18, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  duration: { fontSize: 14, color: '#555', marginTop: -8 },
  exerciseCard: {
    backgroundColor: '#1a1a1a', borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a2a', padding: 14, gap: 6,
  },
  exerciseName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  exerciseMeta: { fontSize: 12, color: '#555', marginBottom: 4 },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 4,
  },
  setRowSkipped: { opacity: 0.4 },
  setText: { fontSize: 14, color: '#ccc', flex: 1 },
  setStatus: { fontSize: 14, fontWeight: '700' },
  done: { color: '#4ade80' },
  skipped: { color: '#444' },
});
