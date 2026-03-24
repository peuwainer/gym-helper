import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Play, Pencil, Trash2, ChevronRight, Dumbbell } from 'lucide-react-native';
import { WorkoutTemplate } from '../../types';
import { getTemplates, deleteTemplate } from '../../lib/db';

function TemplateCard({
  template,
  onStart,
  onEdit,
  onDelete,
}: {
  template: WorkoutTemplate;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalSets = template.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const muscles = [...new Set(template.exercises.flatMap(ex => ex.exercise.muscles))].slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{template.name}</Text>
          {template.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{template.description}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            <Text style={styles.metaText}>{template.exercises.length} exercícios</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{totalSets} séries</Text>
            {muscles.length > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{muscles.join(', ')}</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={onStart}>
          <Play size={16} color="#0f0f0f" fill="#0f0f0f" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Pencil size={14} color="#888" />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
          <Trash2 size={14} color="#666" />
          <Text style={[styles.actionText, { color: '#666' }]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [])
  );

  async function loadTemplates() {
    const data = await getTemplates();
    setTemplates(data);
  }

  function handleStart(template: WorkoutTemplate) {
    router.push(`/workout/${template.id}`);
  }

  function handleEdit(template: WorkoutTemplate) {
    router.push(`/template/edit?id=${template.id}`);
  }

  async function handleDelete(template: WorkoutTemplate) {
    Alert.alert('Excluir template', `Excluir "${template.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          await deleteTemplate(template.id);
          setTemplates(prev => prev.filter(t => t.id !== template.id));
        }
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={t => t.id.toString()}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            onStart={() => handleStart(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Dumbbell size={28} color="#555" />
            </View>
            <Text style={styles.emptyTitle}>Nenhum treino salvo</Text>
            <Text style={styles.emptyText}>
              Peça um treino para o treinador IA e salve-o aqui, ou crie um manualmente.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/template/edit')}
          >
            <Plus size={18} color="#4ade80" />
            <Text style={styles.newBtnText}>Criar treino manualmente</Text>
            <ChevronRight size={16} color="#444" />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1a1a1a', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 4,
  },
  newBtnText: { flex: 1, color: '#4ade80', fontSize: 15, fontWeight: '500' },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 14,
    borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#888', marginBottom: 6, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaText: { fontSize: 12, color: '#555' },
  metaDot: { fontSize: 12, color: '#333' },
  startBtn: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#4ade80',
    alignItems: 'center', justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2a2a2a',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
  },
  actionText: { fontSize: 13, color: '#888' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});
