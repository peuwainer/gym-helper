import { getDebrief } from '../lib/claude';
import { WorkoutSession } from '../types';

// Mock react-native Platform so the module can be imported in node
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const mockSessions: WorkoutSession[] = [
  {
    id: 1,
    templateId: 1,
    date: '2026-03-22T10:00:00.000Z',
    durationMinutes: 45,
    exercises: [
      {
        exerciseId: 1,
        exerciseName: 'Supino',
        targetSets: 3,
        targetReps: 10,
        sets: [
          { setNumber: 1, weight: 80, repsCompleted: 10, completed: true },
          { setNumber: 2, weight: 80, repsCompleted: 10, completed: true },
          { setNumber: 3, weight: 80, repsCompleted: 8, completed: true },
        ],
      },
    ],
  },
  {
    id: 2,
    templateId: 1,
    date: '2026-03-20T10:00:00.000Z',
    durationMinutes: 50,
    exercises: [
      {
        exerciseId: 1,
        exerciseName: 'Supino',
        targetSets: 3,
        targetReps: 10,
        sets: [
          { setNumber: 1, weight: 75, repsCompleted: 10, completed: true },
          { setNumber: 2, weight: 75, repsCompleted: 10, completed: true },
          { setNumber: 3, weight: 75, repsCompleted: 10, completed: true },
        ],
      },
    ],
  },
  {
    id: 3,
    templateId: 1,
    date: '2026-03-18T10:00:00.000Z',
    durationMinutes: 40,
    exercises: [
      {
        exerciseId: 1,
        exerciseName: 'Supino',
        targetSets: 3,
        targetReps: 10,
        sets: [
          { setNumber: 1, weight: 75, repsCompleted: 10, completed: true },
          { setNumber: 2, weight: 75, repsCompleted: 10, completed: true },
          { setNumber: 3, weight: 75, repsCompleted: 9, completed: true },
        ],
      },
    ],
  },
];

function mockFetch(responseBody: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(
      ok
        ? { content: [{ text: JSON.stringify(responseBody) }] }
        : responseBody
    ),
  }) as jest.Mock;
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('returns parsed insights on happy path', async () => {
  const payload = [
    { type: 'up', text: 'Supino melhorou 5kg esta semana.' },
    { type: 'plateau', text: 'Agachamento estagnado há 3 sessões.' },
    { type: 'warning', text: 'Peito trabalhado 4x em 2 semanas.' },
  ];
  mockFetch(payload);

  const result = await getDebrief('test-key', mockSessions);

  expect(result).toHaveLength(3);
  expect(result[0]).toEqual({ type: 'up', text: 'Supino melhorou 5kg esta semana.' });
  expect(result[2].type).toBe('warning');
});

test('truncates to 5 when AI returns more than 5 insights', async () => {
  const payload = Array.from({ length: 7 }, (_, i) => ({
    type: 'up',
    text: `Insight ${i + 1}`,
  }));
  mockFetch(payload);

  const result = await getDebrief('test-key', mockSessions);

  expect(result).toHaveLength(5);
});

test('falls back to single insight when AI returns invalid JSON', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ content: [{ text: 'Not valid JSON here!' }] }),
  }) as jest.Mock;

  const result = await getDebrief('test-key', mockSessions);

  expect(result).toHaveLength(1);
  expect(result[0].type).toBe('warning');
  expect(result[0].text).toBe('Not valid JSON here!');
});

test('throws on non-ok HTTP response', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
  }) as jest.Mock;

  await expect(getDebrief('bad-key', mockSessions)).rejects.toThrow('Unauthorized');
});

test('filters out insights with invalid type values', async () => {
  const payload = [
    { type: 'up', text: 'Valid insight.' },
    { type: 'down', text: 'Unknown type — should be dropped.' },
    { type: 'plateau', text: 'Another valid one.' },
    { type: '', text: 'Empty type — dropped.' },
    { type: 'warning', text: 'Third valid.' },
  ];
  mockFetch(payload);

  const result = await getDebrief('test-key', mockSessions);

  expect(result).toHaveLength(3);
  expect(result.map(i => i.type)).toEqual(['up', 'plateau', 'warning']);
});

test('propagates AbortError when signal is aborted', async () => {
  const ctrl = new AbortController();

  global.fetch = jest.fn().mockImplementation(() => {
    ctrl.abort();
    const err = new DOMException('Aborted', 'AbortError');
    return Promise.reject(err);
  }) as jest.Mock;

  await expect(getDebrief('test-key', mockSessions, ctrl.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
});
