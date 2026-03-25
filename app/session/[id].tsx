import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WorkoutSession } from '../../types';
import { getSession } from '../../lib/db';
import { colors, fonts } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function SessionDetailScreen() {
  const { colors } = useTheme();
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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  date: { fontSize: 18, fontFamily: fonts.display, color: colors.text, textTransform: 'capitalize' },
  duration: { fontSize: 14, color: colors.textSubtle, marginTop: -8, fontFamily: fonts.body },
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6,
  },
  exerciseName: { fontSize: 15, fontFamily: fonts.displayMedium, color: colors.text },
  exerciseMeta: { fontSize: 12, color: colors.textSubtle, marginBottom: 4, fontFamily: fonts.body },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 4,
  },
  setRowSkipped: { opacity: 0.4 },
  setText: { fontSize: 14, color: colors.textSecondary, flex: 1, fontFamily: fonts.body },
  setStatus: { fontSize: 14, fontFamily: fonts.bodyBold },
  done: { color: colors.accent },
  skipped: { color: colors.textDisabled },
});
