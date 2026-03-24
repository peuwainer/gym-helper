import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Dumbbell } from 'lucide-react-native';
import { useExerciseImage } from '../lib/useExerciseImage';
import { colors } from '../lib/theme';

interface Props {
  exerciseName: string;
  exerciseNameEn?: string;
  size?: number;
}

export function ExerciseImage({ exerciseName, exerciseNameEn, size = 48 }: Props) {
  const { imageUrl, loading } = useExerciseImage(exerciseName, exerciseNameEn);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 4,
  };

  if (loading) {
    return <View style={[styles.skeleton, containerStyle]} />;
  }

  if (!imageUrl) {
    return (
      <View style={[styles.fallback, containerStyle]}>
        <Dumbbell size={size * 0.45} color={colors.textSubtle} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[styles.image, containerStyle]}
      contentFit="cover"
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  fallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: colors.surface,
  },
});
