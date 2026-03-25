import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Plus, Trash2, Check } from 'lucide-react-native';
import { WorkoutTemplate, WorkoutExercise } from '../../types';
import { getTemplate, saveTemplate, updateTemplate } from '../../lib/db';
import { colors, fonts } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

const EMPTY_EXERCISE: WorkoutExercise = {
  exercise: { id: Date.now(), name: '', category: '', muscles: [], description: '' },
  sets: 3,
  reps: 12,
  restSeconds: 60,
};

export default function EditTemplateScreen() {
  const { colors } = useTheme();
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
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Treino focado em força, com exercícios compostos"
            placeholderTextColor={colors.textDisabled}
            multiline
          />
        </View>

        <Text style={styles.sectionTitle}>Exercícios</Text>

        {exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>{i + 1}</Text>
              <TouchableOpacity onPress={() => removeExercise(i)}>
                <Trash2 size={16} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome do exercício</Text>
            <TextInput
              style={styles.input}
              value={ex.exercise.name}
              onChangeText={v => updateExercise(i, 'name', v)}
              placeholder="Ex: Supino reto"
              placeholderTextColor={colors.textDisabled}
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
              placeholderTextColor={colors.textDisabled}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
          <Plus size={18} color={colors.accent} />
          <Text style={styles.addBtnText}>Adicionar exercício</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Check size={18} color={colors.bg} />
          <Text style={styles.saveBtnText}>Salvar treino</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 60 },
  field: { gap: 6 },
  label: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 12,
    color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border,
    fontFamily: fonts.body,
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 14, fontFamily: fonts.displayMedium, color: colors.accent, marginTop: 8, letterSpacing: 0.5 },
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseNumber: { fontSize: 13, fontFamily: fonts.display, color: colors.accent },
  row: { flexDirection: 'row', gap: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    padding: 14, borderRadius: 12,
  },
  addBtnText: { color: colors.accent, fontSize: 15, fontFamily: fonts.bodyMedium },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.accent, padding: 16, borderRadius: 14, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.bg },
});
