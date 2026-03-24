import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { TrendingUp, Minus, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { WorkoutSession } from '../../types';
import { getSession, getSessions } from '../../lib/db';
import { getApiKey } from '../../lib/storage';
import { getDebrief, DebriefInsight } from '../../lib/claude';
import { colors } from '../../lib/theme';

const MIN_SESSIONS_FOR_DEBRIEF = 3;

const INSIGHT_CONFIG = {
  up:      { icon: TrendingUp,    color: colors.accent,   bg: colors.accentSurface },
  plateau: { icon: Minus,         color: colors.warning,  bg: colors.warningSurface },
  warning: { icon: AlertTriangle, color: colors.errorText, bg: colors.errorSurface },
} as const;

export default function DebriefScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [insights, setInsights] = useState<DebriefInsight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  }, [id]);

  async function loadData() {
    const [currentSession, allSessions, apiKey] = await Promise.all([
      getSession(parseInt(id)),
      getSessions(15),
      getApiKey(),
    ]);

    setSession(currentSession);
    setTotalSessions(allSessions.length);

    if (allSessions.length >= MIN_SESSIONS_FOR_DEBRIEF && apiKey) {
      fetchInsights(allSessions, apiKey);
    }
  }

  async function fetchInsights(sessions: WorkoutSession[], apiKey: string) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(false);

    try {
      const result = await getDebrief(apiKey, sessions, ctrl.signal);
      setInsights(result);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry() {
    const [allSessions, apiKey] = await Promise.all([getSessions(15), getApiKey()]);
    if (apiKey) fetchInsights(allSessions, apiKey);
  }

  if (!session) return null;

  const completedExercises = session.exercises.filter(ex => ex.sets.some(s => s.completed));
  const totalVolume = session.exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(s => s.completed).reduce((a, s) => a + s.weight * s.repsCompleted, 0)
  , 0);

  const date = new Date(session.date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Debrief', headerBackTitle: 'Voltar' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.headline}>Treino finalizado</Text>
        <Text style={styles.subheadline}>{date}</Text>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <StatItem label="Duração" value={`${session.durationMinutes ?? '—'} min`} />
          <View style={styles.statDivider} />
          <StatItem label="Exercícios" value={`${completedExercises.length}`} />
          <View style={styles.statDivider} />
          <StatItem label="Volume" value={`${Math.round(totalVolume)} kg`} />
        </View>

        {/* AI Insights */}
        {totalSessions < MIN_SESSIONS_FOR_DEBRIEF ? (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Insights de IA</Text>
            <Text style={styles.placeholderText}>
              Complete mais {MIN_SESSIONS_FOR_DEBRIEF - totalSessions} treino{MIN_SESSIONS_FOR_DEBRIEF - totalSessions !== 1 ? 's' : ''} para desbloquear análises personalizadas.
            </Text>
          </View>
        ) : (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Análise do Coach</Text>

            {loading && (
              <View style={styles.skeletonContainer}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.skeletonText}>Analisando seu treino...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Não foi possível gerar a análise.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                  <RefreshCw size={14} color="#fff" />
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            {insights && insights.map((insight, i) => {
              const cfg = INSIGHT_CONFIG[insight.type as keyof typeof INSIGHT_CONFIG] ?? INSIGHT_CONFIG.up;
              const Icon = cfg.icon;
              return (
                <View key={i} style={[styles.insightRow, { backgroundColor: cfg.bg }]}>
                  <Icon size={16} color={cfg.color} style={styles.insightIcon} />
                  <Text style={styles.insightText}>{insight.text}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/(tabs)/history')}
        >
          <Text style={styles.historyBtnText}>Ver histórico completo</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16, paddingBottom: 48 },

  headline: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 2 },
  subheadline: { fontSize: 14, color: colors.textSubtle, textTransform: 'capitalize' },

  statsCard: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },

  insightsCard: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, gap: 10,
  },
  insightsTitle: { fontSize: 13, fontWeight: '600', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },

  skeletonContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  skeletonText: { fontSize: 14, color: colors.textSubtle },

  errorContainer: { alignItems: 'flex-start', gap: 10 },
  errorText: { fontSize: 14, color: colors.errorText },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  retryText: { fontSize: 13, color: colors.text },

  insightRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 10, padding: 12,
  },
  insightIcon: { marginTop: 2 },
  insightText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  placeholderCard: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 16, gap: 6,
  },
  placeholderTitle: { fontSize: 13, fontWeight: '600', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  placeholderText: { fontSize: 14, color: colors.textDisabled, lineHeight: 20 },

  historyBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  historyBtnText: { fontSize: 15, color: colors.textMuted },
});
