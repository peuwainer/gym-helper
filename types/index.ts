export interface Exercise {
  id: number;
  name: string;
  nameEn?: string;
  category: string;
  muscles: string[];
  description: string;
  imageUrl?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface SetLog {
  setNumber: number;
  weight: number;
  repsCompleted: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: number;
  exerciseName: string;
  exerciseNameEn?: string;
  targetSets: number;
  targetReps: number;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: number;
  templateId?: number;
  date: string;
  durationMinutes?: number;
  exercises: ExerciseLog[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  workout?: WorkoutTemplate;
  timestamp: string;
}

export interface LastWeight {
  exerciseId: number;
  weight: number;
  reps: number;
  date: string;
}
