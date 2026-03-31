import {
  saveWorkoutDraft,
  getWorkoutDraft,
  clearWorkoutDraft,
} from '../lib/storage';
import { ExerciseLog } from '../types';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        store.delete(key);
      }),
    },
  };
});

const logs: ExerciseLog[] = [
  {
    exerciseId: 1,
    exerciseName: 'Supino',
    targetSets: 3,
    targetReps: 10,
    sets: [
      { setNumber: 1, weight: 80, repsCompleted: 10, completed: true },
      { setNumber: 2, weight: 80, repsCompleted: 9, completed: true },
      { setNumber: 3, weight: 80, repsCompleted: 8, completed: false },
    ],
  },
];

test('persists and restores workout draft by template id', async () => {
  await saveWorkoutDraft(7, 123456789, logs);

  const draft = await getWorkoutDraft(7);

  expect(draft).not.toBeNull();
  expect(draft?.startedAt).toBe(123456789);
  expect(draft?.logs).toEqual(logs);
});

test('clears workout draft', async () => {
  await saveWorkoutDraft(8, 987654321, logs);
  await clearWorkoutDraft(8);

  const draft = await getWorkoutDraft(8);
  expect(draft).toBeNull();
});
