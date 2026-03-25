import * as SQLite from 'expo-sqlite';
import { WorkoutTemplate, WorkoutSession, LastWeight } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('gymhelper.db');
    await initDb(db);
  }
  return db;
}

async function initDb(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      exercises_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      date TEXT NOT NULL,
      duration_minutes INTEGER,
      exercises_json TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (template_id) REFERENCES workout_templates(id)
    );

    CREATE TABLE IF NOT EXISTS last_weights (
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (exercise_id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      workout_json TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_image_cache (
      exercise_name TEXT PRIMARY KEY COLLATE NOCASE,
      image_url TEXT NOT NULL,
      wger_exercise_id INTEGER,
      cached_at TEXT NOT NULL
    );
  `);
}

// Templates
export async function saveTemplate(template: Omit<WorkoutTemplate, 'id'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO workout_templates (name, description, exercises_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [template.name, template.description, JSON.stringify(template.exercises),
     template.createdAt, template.updatedAt]
  );
  return result.lastInsertRowId;
}

export async function updateTemplate(template: WorkoutTemplate): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE workout_templates SET name=?, description=?, exercises_json=?, updated_at=?
     WHERE id=?`,
    [template.name, template.description, JSON.stringify(template.exercises),
     new Date().toISOString(), template.id]
  );
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_templates WHERE id=?', [id]);
}

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM workout_templates ORDER BY updated_at DESC');
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    exercises: JSON.parse(row.exercises_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getTemplate(id: number): Promise<WorkoutTemplate | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM workout_templates WHERE id=?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    exercises: JSON.parse(row.exercises_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Sessions
export async function saveSession(session: Omit<WorkoutSession, 'id'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO workout_sessions (template_id, date, duration_minutes, exercises_json, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [session.templateId ?? null, session.date, session.durationMinutes ?? null,
     JSON.stringify(session.exercises), session.notes ?? null]
  );

  // Update last weights for each exercise
  for (const ex of session.exercises) {
    const lastSet = ex.sets.filter(s => s.completed).pop();
    if (lastSet) {
      await upsertLastWeight(ex.exerciseId, lastSet.weight, lastSet.repsCompleted);
    }
  }

  return result.lastInsertRowId;
}

export async function getSessions(limit = 30): Promise<WorkoutSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM workout_sessions ORDER BY date DESC LIMIT ?', [limit]
  );
  return rows.map(row => ({
    id: row.id,
    templateId: row.template_id,
    date: row.date,
    durationMinutes: row.duration_minutes,
    exercises: JSON.parse(row.exercises_json),
    notes: row.notes,
  }));
}

export async function getSession(id: number): Promise<WorkoutSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM workout_sessions WHERE id=?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    templateId: row.template_id,
    date: row.date,
    durationMinutes: row.duration_minutes,
    exercises: JSON.parse(row.exercises_json),
    notes: row.notes,
  };
}

// Last weights
export async function getLastWeight(exerciseId: number): Promise<LastWeight | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM last_weights WHERE exercise_id=?', [exerciseId]
  );
  if (!row) return null;
  return { exerciseId: row.exercise_id, weight: row.weight, reps: row.reps, date: row.date };
}

export async function getLastWeights(): Promise<Record<number, LastWeight>> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM last_weights');
  return Object.fromEntries(rows.map(r => [r.exercise_id, {
    exerciseId: r.exercise_id, weight: r.weight, reps: r.reps, date: r.date
  }]));
}

async function upsertLastWeight(exerciseId: number, weight: number, reps: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO last_weights (exercise_id, weight, reps, date) VALUES (?, ?, ?, ?)
     ON CONFLICT(exercise_id) DO UPDATE SET weight=excluded.weight, reps=excluded.reps, date=excluded.date`,
    [exerciseId, weight, reps, new Date().toISOString()]
  );
}

// Chat history
export async function saveChatMessage(msg: { id: string; role: string; content: string; workout?: any; timestamp: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO chat_history (id, role, content, workout_json, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [msg.id, msg.role, msg.content, msg.workout ? JSON.stringify(msg.workout) : null, msg.timestamp]
  );
}

export async function getChatHistory(limit = 50): Promise<any[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT ?', [limit]
  );
  return rows.reverse().map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    workout: row.workout_json ? JSON.parse(row.workout_json) : undefined,
    timestamp: row.timestamp,
  }));
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM chat_history');
}

// Exercise image cache
export async function getCachedExerciseImage(name: string): Promise<{ imageUrl: string; wgerExerciseId: number | null } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT image_url, wger_exercise_id FROM exercise_image_cache WHERE exercise_name = ?',
    [name]
  );
  if (!row) return null;
  return { imageUrl: row.image_url, wgerExerciseId: row.wger_exercise_id };
}

/** Deletes stale cache entries: empty sentinels and malformed double-URL entries. */
export async function clearBadImageCache(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM exercise_image_cache WHERE image_url = '' OR image_url LIKE 'https://wger.dehttps://%'`
  );
}

export async function cacheExerciseImage(name: string, imageUrl: string, wgerExerciseId?: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO exercise_image_cache (exercise_name, image_url, wger_exercise_id, cached_at)
     VALUES (?, ?, ?, ?)`,
    [name, imageUrl, wgerExerciseId ?? null, new Date().toISOString()]
  );
}
