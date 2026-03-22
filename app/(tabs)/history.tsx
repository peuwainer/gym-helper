import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { WorkoutSession } from '../../types';
import { getSessions } from '../../lib/db';
import { ChevronRight } from 'lucide-react-native';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SessionCard({ session, onPress }: { session: WorkoutSession; onPress: () => void }) {
  const completedSets = session.exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(s => s.completed).length, 0
  );
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const muscles = [...new Set(session.exercises.flatMap(ex => {
    // We only have exercise name, so just show names
    return [ex.exerciseName];
  }))].slice(0, 3);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardLeft}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>
            {new Date(session.date).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(session.date).toLocaleDateString('pt-BR', { month: 'short' })}
          </Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardRelDate}>{formatDate(session.date)}</Text>
        <Text style={styles.cardExercises} numberOfLines={2}>
          {muscles.join(', ')}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{session.exercises.length} exercícios</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{completedSets}/{totalSets} séries</Text>
          {session.durationMinutes && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{session.durationMinutes} min</Text>
            </>
          )}
        </View>
      </View>
      <ChevronRight size={16} color="#444" />
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id.toString()}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onPress={() => router.push(`/session/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Nenhum treino realizado ainda</Text>
            <Text style={styles.emptyText}>
              Complete seu primeiro treino e ele aparecerá aqui.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a1a1a', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  cardLeft: {},
  dateBox: {
    width: 44, alignItems: 'center',
    backgroundColor: '#0f0f0f', borderRadius: 8, padding: 6,
  },
  dateDay: { fontSize: 18, fontWeight: '700', color: '#4ade80', lineHeight: 20 },
  dateMonth: { fontSize: 11, color: '#555', textTransform: 'uppercase' },
  cardInfo: { flex: 1 },
  cardRelDate: { fontSize: 12, color: '#555', marginBottom: 2 },
  cardExercises: { fontSize: 14, color: '#ccc', marginBottom: 4, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaText: { fontSize: 12, color: '#555' },
  metaDot: { fontSize: 12, color: '#333' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});
