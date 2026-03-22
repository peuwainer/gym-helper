import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Plus, Trash2, Check } from 'lucide-react-native';
import { WorkoutTemplate, WorkoutExercise } from '../../types';
import { getTemplate, saveTemplate, updateTemplate } from '../../lib/db';

const EMPTY_EXERCISE: WorkoutExercise = {
  exercise: { id: Date.now(), name: '', category: '', muscles: [], description: '' },
  sets: 3,
  reps: 12,
  restSeconds: 60,
};

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isNew = !id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([{ ...EMPTY_EXERCISE, exercise: { ...EMPTY_EXERCISE.exercise, id: Date.now() } }]);

  useEffect(() => {
    if (id) {
      getTemplate(parseInt(id)).then(t => {
        if (t) {
          setName(t.name);
          setDescription(t.description);
          setExercises(t.exercises);
        }
      });
    }
  }, [id]);

  function updateExercise(index: number, field: string, value: any) {
    const updated = [...exercises];
    if (field === 'name') {
      updated[index] = { ...updated[index], exercise: { ...updated[index].exercise, name: value } };
    } else if (field === 'sets') {
      updated[index] = { ...updated[index], sets: parseInt(value) || 0 };
    } else if (field === 'reps') {
      updated[index] = { ...updated[index], reps: parseInt(value) || 0 };
    } else if (field === 'rest') {
      updated[index] = { ...updated[index], restSeconds: parseInt(value) || 0 };
    } else if (field === 'notes') {
      updated[index] = { ...updated[index], notes: value };
    }
    setExercises(updated);
  }

  function addExercise() {
    setExercises(prev => [...prev, { ...EMPTY_EXERCISE, exercise: { ...EMPTY_EXERCISE.exercise, id: Date.now() } }]);
  }

  function removeExercise(index: number) {
    setExercises(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome do treino é obrigatório.');
      return;
    }
    const validExercises = exercises.filter(e => e.exercise.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Erro', 'Adicione ao menos um exercício.');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim(),
      exercises: validExercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      await saveTemplate(data);
    } else {
      await updateTemplate({ ...data, id: parseInt(id!) });
    }

    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Novo treino' : 'Editar treino' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Nome do treino</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Peito e Tríceps"
            placeholderTextColor="#333"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Treino focado em força, com exercícios compostos"
            placeholderTextColor="#333"
            multiline
          />
        </View>

        <Text style={styles.sectionTitle}>Exercícios</Text>

        {exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>{i + 1}</Text>
              <TouchableOpacity onPress={() => removeExercise(i)}>
                <Trash2 size={16} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome do exercício</Text>
            <TextInput
              style={styles.input}
              value={ex.exercise.name}
              onChangeText={v => updateExercise(i, 'name', v)}
              placeholder="Ex: Supino reto"
              placeholderTextColor="#333"
            />

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Séries</Text>
                <TextInput
                  style={styles.input}
                  value={ex.sets.toString()}
                  onChangeText={v => updateExercise(i, 'sets', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Repetições</Text>
                <TextInput
                  style={styles.input}
                  value={ex.reps.toString()}
                  onChangeText={v => updateExercise(i, 'reps', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Descanso (s)</Text>
                <TextInput
                  style={styles.input}
                  value={ex.restSeconds.toString()}
                  onChangeText={v => updateExercise(i, 'rest', v)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={styles.input}
              value={ex.notes || ''}
              onChangeText={v => updateExercise(i, 'notes', v)}
              placeholder="Ex: Foco na contração excêntrica"
              placeholderTextColor="#333"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
          <Plus size={18} color="#4ade80" />
          <Text style={styles.addBtnText}>Adicionar exercício</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Check size={18} color="#0f0f0f" />
          <Text style={styles.saveBtnText}>Salvar treino</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20, gap: 12, paddingBottom: 60 },
  field: { gap: 6 },
  label: { fontSize: 12, color: '#555', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a',
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#4ade80', marginTop: 8 },
  exerciseCard: {
    backgroundColor: '#1a1a1a', borderRadius: 14,
    borderWidth: 1, borderColor: '#2a2a2a', padding: 14, gap: 8,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseNumber: { fontSize: 13, fontWeight: '700', color: '#4ade80' },
  row: { flexDirection: 'row', gap: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#2a2a2a', borderStyle: 'dashed',
    padding: 14, borderRadius: 12,
  },
  addBtnText: { color: '#4ade80', fontSize: 15 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4ade80', padding: 16, borderRadius: 14, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#0f0f0f' },
});
