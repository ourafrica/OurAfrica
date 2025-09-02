import { query } from './db';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Define proper types for module content
export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive';
  duration?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface ModuleContent {
  lessons?: Lesson[];
  quizzes?: Quiz[];
  estimatedTime?: number;
  prerequisites?: string[];
  learningObjectives?: string[];
}

// Database row interfaces (what we get from the migration)
interface ModuleRow {
  id: number;
  title: string;
  description: string;
  content: string | ModuleContent; // Could be JSON string or parsed object
  version: string;
  author?: string;
  difficulty_level: string;
  tags: string | string[]; // Could be JSON string or parsed array
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

// Main exported interfaces
export interface Module {
  id: number;
  title: string;
  description: string;
  content: ModuleContent;
  version: string;
  author?: string;
  difficulty_level: string;
  tags: string[];
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UserProgress {
  id: number;
  user_id: number;
  module_id: number;
  progress_percentage: number;
  completed: boolean;
  completion_date?: string;
  total_time_spent: number;
  last_accessed: string;
}

export interface LessonProgress {
  id: number;
  user_id: number;
  module_id: number;
  lesson_id: string;
  completed: boolean;
  time_spent: number;
  quiz_score?: number;
  completed_at?: string;
  updated_at: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  module_id: number;
  certificate_code: string;
  certificate_data: string | Record<string, unknown>;
  verified: boolean;
  issued_at: string;
}

// Helper function to parse JSON safely
function parseJSON<T>(value: string | T, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value;
}

// Module functions
export async function getModules(): Promise<Module[]> {
  const result = await query('SELECT * FROM modules ORDER BY created_at DESC');

  return result.rows.map((module: ModuleRow) => ({
    ...module,
    content: parseJSON<ModuleContent>(module.content, { lessons: [], quizzes: [] }),
    tags: parseJSON<string[]>(module.tags, [])
  }));
}

export async function getModuleById(id: number): Promise<Module | null> {
  const result = await query('SELECT * FROM modules WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const module = result.rows[0] as ModuleRow;
  return {
    ...module,
    content: parseJSON<ModuleContent>(module.content, { lessons: [], quizzes: [] }),
    tags: parseJSON<string[]>(module.tags, [])
  };
}

export async function saveModule(moduleData: Omit<Module, 'id' | 'created_at' | 'updated_at'>): Promise<Module> {
  const result = await query(
      `INSERT INTO modules (title, description, content, version, author, difficulty_level, tags, estimated_duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
      [
        moduleData.title,
        moduleData.description,
        JSON.stringify(moduleData.content),
        moduleData.version || '1.0.0',
        moduleData.author || null,
        moduleData.difficulty_level || 'beginner',
        JSON.stringify(moduleData.tags || []),
        moduleData.estimated_duration || null
      ]
  );

  const moduleId = result.rows[0].id as number;
  const savedModule = await getModuleById(moduleId);

  if (!savedModule) {
    throw new Error('Failed to retrieve saved module');
  }

  return savedModule;
}

// Progress functions
export async function getUserProgress(userId: number, moduleId: number): Promise<UserProgress | null> {
  const result = await query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND module_id = $2',
      [userId, moduleId]
  );

  return result.rows.length > 0 ? (result.rows[0] as UserProgress) : null;
}

export async function updateLessonProgress(
    userId: number,
    moduleId: number,
    lessonId: string,
    completed: boolean,
    timeSpent: number,
    quizScore?: number
): Promise<void> {
  await query(
      `INSERT INTO lesson_progress (user_id, module_id, lesson_id, completed, time_spent, quiz_score, completed_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (user_id, module_id, lesson_id) 
     DO UPDATE SET
       completed = EXCLUDED.completed,
       time_spent = EXCLUDED.time_spent,
       quiz_score = EXCLUDED.quiz_score,
       completed_at = CASE WHEN EXCLUDED.completed = true THEN NOW() ELSE lesson_progress.completed_at END,
       updated_at = NOW()`,
      [userId, moduleId, lessonId, completed, timeSpent, quizScore || null]
  );

  // Update module-level progress
  await updateModuleProgress(userId, moduleId);
}

export async function updateModuleProgress(userId: number, moduleId: number): Promise<{ progressPercentage: number; isCompleted: boolean } | undefined> {
  // Get module content to calculate total lessons/quizzes
  const module = await getModuleById(moduleId);
  if (!module) return;

  const totalLessons = module.content.lessons?.length || 0;
  const totalQuizzes = module.content.quizzes?.length || 0;

  // Avoid division by zero
  if (totalLessons + totalQuizzes === 0) {
    return { progressPercentage: 100, isCompleted: true };
  }

  // Get completed lessons and quizzes
  const completedLessonsResult = await query(
      `SELECT COUNT(*) as count FROM lesson_progress 
     WHERE user_id = $1 AND module_id = $2 AND completed = true AND quiz_score IS NULL`,
      [userId, moduleId]
  );

  const completedQuizzesResult = await query(
      `SELECT COUNT(*) as count FROM lesson_progress 
     WHERE user_id = $1 AND module_id = $2 AND completed = true AND quiz_score IS NOT NULL`,
      [userId, moduleId]
  );

  const totalTimeResult = await query(
      `SELECT COALESCE(SUM(time_spent), 0) as total FROM lesson_progress 
     WHERE user_id = $1 AND module_id = $2`,
      [userId, moduleId]
  );

  const completedLessons = parseInt(String(completedLessonsResult.rows[0].count));
  const completedQuizzes = parseInt(String(completedQuizzesResult.rows[0].count));
  const totalTimeSpent = parseInt(String(totalTimeResult.rows[0].total));

  const progressPercentage = Math.round(
      ((completedLessons + completedQuizzes) / (totalLessons + totalQuizzes)) * 100
  );

  const isCompleted = progressPercentage === 100;

  // Update module progress
  await query(
      `INSERT INTO user_progress (user_id, module_id, progress_percentage, completed, completion_date, total_time_spent, last_accessed)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id, module_id) 
     DO UPDATE SET
       progress_percentage = EXCLUDED.progress_percentage,
       completed = EXCLUDED.completed,
       completion_date = CASE WHEN EXCLUDED.completed = true AND user_progress.completed = false THEN NOW() ELSE user_progress.completion_date END,
       total_time_spent = EXCLUDED.total_time_spent,
       last_accessed = NOW()`,
      [userId, moduleId, progressPercentage, isCompleted, isCompleted ? new Date().toISOString() : null, totalTimeSpent]
  );

  return { progressPercentage, isCompleted };
}

export async function getLessonProgress(userId: number, moduleId: number, lessonId: string): Promise<LessonProgress | null> {
  const result = await query(
      'SELECT * FROM lesson_progress WHERE user_id = $1 AND module_id = $2 AND lesson_id = $3',
      [userId, moduleId, lessonId]
  );

  return result.rows.length > 0 ? (result.rows[0] as LessonProgress) : null;
}

export async function getModuleProgressDetailed(userId: number, moduleId: number): Promise<{
  moduleProgress: UserProgress | null;
  lessonProgress: LessonProgress[];
}> {
  const moduleProgress = await getUserProgress(userId, moduleId);
  const lessonProgressResult = await query(
      'SELECT * FROM lesson_progress WHERE user_id = $1 AND module_id = $2',
      [userId, moduleId]
  );

  return {
    moduleProgress,
    lessonProgress: lessonProgressResult.rows as LessonProgress[]
  };
}

export async function getAllUserProgress(userId: number): Promise<UserProgress[]> {
  const result = await query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
  return result.rows as UserProgress[];
}

export async function getAllLessonProgress(userId: number): Promise<LessonProgress[]> {
  const result = await query('SELECT * FROM lesson_progress WHERE user_id = $1', [userId]);
  return result.rows as LessonProgress[];
}

export async function getAllUserCertificates(userId: number): Promise<Certificate[]> {
  const result = await query('SELECT * FROM certificates WHERE user_id = $1', [userId]);
  return result.rows as Certificate[];
}

// Certificate functions
export async function generateCertificate(userId: number, moduleId: number): Promise<string> {
  // Check if module is completed
  const progress = await getUserProgress(userId, moduleId);
  if (!progress || !progress.completed) {
    throw new Error('Module must be completed before generating certificate');
  }

  // Check if certificate already exists
  const existingCertResult = await query(
      'SELECT certificate_code FROM certificates WHERE user_id = $1 AND module_id = $2',
      [userId, moduleId]
  );

  if (existingCertResult.rows.length > 0) {
    return existingCertResult.rows[0].certificate_code as string;
  }

  // Generate unique certificate code
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const certificateCode = `VC-${userId}-${moduleId}-${timestamp}-${random}`.toUpperCase();

  // Get user and module info for certificate data
  const userResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
  const module = await getModuleById(moduleId);

  const certificateData = {
    user: userResult.rows[0]?.username as string,
    module: module?.title,
    completionDate: progress.completion_date,
    timeSpent: progress.total_time_spent,
  };

  // Save certificate to migration
  await query(
      'INSERT INTO certificates (user_id, module_id, certificate_code, certificate_data) VALUES ($1, $2, $3, $4)',
      [userId, moduleId, certificateCode, JSON.stringify(certificateData)]
  );

  return certificateCode;
}

export async function getCertificate(userId: number, moduleId: number): Promise<Certificate | null> {
  const result = await query(
      'SELECT * FROM certificates WHERE user_id = $1 AND module_id = $2',
      [userId, moduleId]
  );

  return result.rows.length > 0 ? (result.rows[0] as Certificate) : null;
}

export async function verifyCertificate(certificateCode: string): Promise<(Certificate & { username: string; module_title: string }) | null> {
  const result = await query(
      `SELECT c.*, u.username, m.title as module_title 
     FROM certificates c
     JOIN users u ON c.user_id = u.id
     JOIN modules m ON c.module_id = m.id
     WHERE c.certificate_code = $1 AND c.verified = true`,
      [certificateCode]
  );

  return result.rows.length > 0 ? (result.rows[0] as Certificate & { username: string; module_title: string }) : null;
}

export async function resetModuleProgress(userId: number, moduleId: number): Promise<void> {
  // Delete all lesson progress for this user/module
  await query('DELETE FROM lesson_progress WHERE user_id = $1 AND module_id = $2', [userId, moduleId]);

  // Delete module-level progress
  await query('DELETE FROM user_progress WHERE user_id = $1 AND module_id = $2', [userId, moduleId]);

  // Delete any certificate for this user/module
  await query('DELETE FROM certificates WHERE user_id = $1 AND module_id = $2', [userId, moduleId]);
}

// Auth functions - using password_hash consistently
export async function registerUser(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
  // Check if user already exists
  const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error('User already exists with this email or username');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert user
  const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword]
  );

  const user = result.rows[0] as User;

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  // Get user by email
  const userResult = await query(
      'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = $1',
      [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = userResult.rows[0] as UserRow;

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  // Return user without password_hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as User, token };
}

export function verifyToken(token: string): { userId: number; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
  return result.rows.length > 0 ? (result.rows[0] as User) : null;
}