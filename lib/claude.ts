import { Platform } from 'react-native';
import { WorkoutTemplate, WorkoutSession } from '../types';
import { resolveExerciseImage } from './exercise-images';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3001/api/messages'
  : 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a personal fitness trainer AI assistant. Your job is to create personalized workout plans based on what the user tells you.

When the user asks for a workout, you MUST respond with a JSON block followed by a friendly message. The JSON MUST be valid and wrapped in <workout> tags like this:

<workout>
{
  "name": "Nome do Treino",
  "description": "Breve descrição",
  "exercises": [
    {
      "exercise": {
        "id": 1,
        "name": "Nome do Exercício",
        "nameEn": "Exercise Name in English",
        "category": "Categoria (ex: Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Core, Cardio)",
        "muscles": ["músculo primário", "músculo secundário"],
        "description": "Como executar o exercício corretamente",
        "imageUrl": null
      },
      "sets": 3,
      "reps": 12,
      "restSeconds": 60,
      "notes": "Dica opcional"
    }
  ]
}
</workout>

After the JSON, write a brief friendly message in the same language the user used (Portuguese or English), summarizing the workout and giving any relevant tips.

Rules:
- Always include 4-8 exercises
- Respect the time constraint (40min = ~5 exercises, 60min = ~7 exercises)
- Avoid muscle groups the user said are tired or recently worked
- Use exercise IDs that increment from 1 within each workout
- If the user asks to modify a workout, return the full modified workout JSON again
- For non-workout questions, just respond conversationally without the JSON block`;

const DEBRIEF_SYSTEM_PROMPT = `You are a workout analyst. Given a user's session history, identify 3-5 specific, actionable insights about their progression, plateaus, and recovery patterns. Be specific — use actual exercise names, weights, and dates. Be brief — one sentence per insight. Output ONLY a valid JSON array, no other text, no markdown:
[{"type": "up", "text": "..."}, ...]
Type must be one of: "up" (improvement), "plateau" (stalled), "warning" (overtraining or recovery concern).`;

export interface DebriefInsight {
  type: 'up' | 'plateau' | 'warning';
  text: string;
}

// Shared Anthropic API call — handles headers, error parsing, returns raw text
async function callClaudeAPI(
  apiKey: string,
  body: object,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Erro ${response.status}`);
  }

  const data = await response.json() as any;
  return data.content?.[0]?.text ?? '';
}

export async function sendMessage(
  apiKey: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<{ text: string; workout?: WorkoutTemplate }> {
  const allMessages = [
    ...messages,
    { role: 'user' as const, content: userMessage },
  ];

  const rawText = await callClaudeAPI(apiKey, {
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: allMessages,
  });

  // Extract workout JSON if present
  const workoutMatch = rawText.match(/<workout>([\s\S]*?)<\/workout>/);
  let workout: WorkoutTemplate | undefined;
  let text = rawText;

  if (workoutMatch) {
    try {
      const parsed = JSON.parse(workoutMatch[1].trim());
      workout = {
        id: 0,
        name: parsed.name,
        description: parsed.description,
        exercises: parsed.exercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      text = rawText.replace(/<workout>[\s\S]*?<\/workout>/, '').trim();
    } catch (e) {
      console.warn('Failed to parse workout JSON', e);
    }
  }

  // Pre-cache exercise images (fire-and-forget)
  if (workout) {
    for (const ex of workout.exercises) {
      resolveExerciseImage(ex.exercise.name, ex.exercise.nameEn).catch(() => {});
    }
  }

  return { text, workout };
}

// Format sessions into a compact text context for the debrief AI call
function formatSessionsForDebrief(sessions: WorkoutSession[]): string {
  if (sessions.length === 0) return 'Nenhuma sessão registrada.';

  const [current, ...history] = sessions;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
  const formatSets = (sets: WorkoutSession['exercises'][0]['sets']) =>
    sets.filter(s => s.completed).map(s => `${s.weight}kg×${s.repsCompleted}`).join(', ') || 'nenhuma';

  const currentLines = current.exercises
    .map(ex => `- ${ex.exerciseName}: ${formatSets(ex.sets)}`)
    .join('\n');
  const currentBlock = `=== SESSÃO MAIS RECENTE (${formatDate(current.date)}) ===\n${currentLines}`;

  if (history.length === 0) return currentBlock;

  const historyLines = history.map(s => {
    const summary = s.exercises
      .map(ex => {
        const best = ex.sets.filter(set => set.completed).sort((a, b) => b.weight - a.weight)[0];
        return best ? `${ex.exerciseName}: ${best.weight}kg×${best.repsCompleted}` : null;
      })
      .filter(Boolean)
      .join(', ');
    return `[${formatDate(s.date)}] ${summary}`;
  }).join('\n');

  return `${currentBlock}\n\n=== HISTÓRICO ANTERIOR ===\n${historyLines}`;
}

export async function getDebrief(
  apiKey: string,
  sessions: WorkoutSession[],
  signal?: AbortSignal
): Promise<DebriefInsight[]> {
  const context = formatSessionsForDebrief(sessions);

  const rawText = await callClaudeAPI(apiKey, {
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: DEBRIEF_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: context }],
  }, signal);

  try {
    const parsed = JSON.parse(rawText.trim());
    if (Array.isArray(parsed)) {
      const VALID_TYPES = new Set<string>(['up', 'plateau', 'warning']);
      return (parsed as DebriefInsight[])
        .filter(i => i && typeof i.text === 'string' && VALID_TYPES.has(i.type))
        .slice(0, 5);
    }
    throw new Error('Not an array');
  } catch {
    // Fallback: only use raw text if it looks like a readable response, not an error page
    const text = rawText.trim();
    if (text.length > 0 && text.length < 500 && !text.startsWith('<')) {
      return [{ type: 'warning', text }];
    }
    throw new Error('Invalid AI response format');
  }
}
