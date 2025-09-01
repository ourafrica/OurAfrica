import sql from "./database/index";
import { Module, UserProgress, User } from "../types"; // Fixed import path
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define interfaces for database row types
interface ModuleRow {
  id: number;
  title: string;
  description: string;
  content: string;
  version: string;
  author?: string;
  difficulty_level?: string;
  tags: string;
  estimated_duration?: number;
  created_at: string;
  updated_at?: string;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  password: string;
  role?: string;
  created_at: string;
}

// Module functions
export async function getModules(): Promise<Module[]> {
  const result = await sql`SELECT * FROM modules ORDER BY created_at DESC` as ModuleRow[];
  return result.map((module) => ({
    ...module,
    content: JSON.parse(module.content),
    tags: JSON.parse(module.tags || '[]')
  }));
}

export async function getModuleById(id: number): Promise<Module | null> {
  const result = await sql`SELECT * FROM modules WHERE id = ${id}` as ModuleRow[];
  if (result.length === 0) return null;

  const module = result[0];
  return {
    ...module,
    content: JSON.parse(module.content),
    tags: JSON.parse(module.tags || '[]')
  };
}

export async function getUserProgress(
    userId: number,
    moduleId: number
): Promise<UserProgress | null> {
  const result = await sql`
    SELECT * FROM user_progress 
    WHERE user_id = ${userId} AND module_id = ${moduleId}
  ` as UserProgress[];
  return result.length > 0 ? result[0] : null;
}

export async function updateUserProgress(
    userId: number,
    moduleId: number,
    progress: Partial<UserProgress>
) {
  await sql`
    INSERT INTO user_progress (user_id, module_id, progress, last_accessed)
    VALUES (${userId}, ${moduleId}, ${JSON.stringify(progress)}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, module_id) DO UPDATE SET
      progress = EXCLUDED.progress,
                                            last_accessed = EXCLUDED.last_accessed
  `;
}

export async function saveModule(moduleData: Module): Promise<Module> {
  const result = await sql`
    INSERT INTO modules (title, description, content, version, author, difficulty_level, tags, estimated_duration)
    VALUES (
      ${moduleData.title},
      ${moduleData.description},
      ${JSON.stringify(moduleData.content)},
      ${moduleData.version || "1.0.0"},
      ${moduleData.author || null},
      ${moduleData.difficulty_level || "beginner"},
      ${JSON.stringify(moduleData.tags || [])},
      ${moduleData.content.estimatedTime || null}
    )
    RETURNING id
  ` as { id: number }[];

  const moduleId = result[0].id;
  const savedModule = await getModuleById(moduleId);

  if (!savedModule) {
    throw new Error("Failed to retrieve saved module");
  }

  return savedModule;
}

// Authentication functions
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function registerUser(
    username: string,
    email: string,
    password: string
): Promise<{ user: User; token: string }> {
  // Check if user already exists
  const existingUsers = await sql`
    SELECT id FROM users WHERE email = ${email} OR username = ${username}
  ` as { id: number }[];

  if (existingUsers.length > 0) {
    throw new Error("User already exists with this email or username");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert user
  const result = await sql`
    INSERT INTO users (username, email, password)
    VALUES (${username}, ${email}, ${hashedPassword})
    RETURNING id, username, email, role, created_at
  ` as User[];

  const user = result[0];

  // Generate JWT token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}

export async function loginUser(
    email: string,
    password: string
): Promise<{ user: User; token: string }> {
  // Get user by email
  const result = await sql`SELECT * FROM users WHERE email = ${email}` as UserRow[];

  if (result.length === 0) {
    throw new Error("Invalid email or password");
  }

  const userWithPassword = result[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, userWithPassword.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = jwt.sign({ userId: userWithPassword.id, email: userWithPassword.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Return user without password field
  const user: User = {
    id: userWithPassword.id,
    username: userWithPassword.username,
    email: userWithPassword.email,
    role: userWithPassword.role,
    created_at: userWithPassword.created_at
  };

  return { user, token };
}

export function verifyToken(token: string): { userId: number; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
    };
    return decoded;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await sql`
    SELECT id, username, email, role, created_at FROM users WHERE id = ${id}
  ` as User[];
  return result.length > 0 ? result[0] : null;
}

// Progress tracking functions
export async function updateLessonProgress(
    userId: number,
    moduleId: number,
    lessonId: string,
    completed: boolean,
    timeSpent: number,
    quizScore?: number
) {
  await sql`
    INSERT INTO lesson_progress (user_id, module_id, lesson_id, completed, time_spent, quiz_score, completed_at, updated_at)
    VALUES (
             ${userId},
             ${moduleId},
             ${lessonId},
             ${completed},
             ${timeSpent},
             ${quizScore || null},
             ${completed ? sql`CURRENT_TIMESTAMP` : null},
             CURRENT_TIMESTAMP
           )
      ON CONFLICT (user_id, module_id, lesson_id) DO UPDATE SET
      completed = EXCLUDED.completed,
                                                       time_spent = EXCLUDED.time_spent,
                                                       quiz_score = EXCLUDED.quiz_score,
                                                       completed_at = CASE WHEN EXCLUDED.completed = TRUE THEN CURRENT_TIMESTAMP ELSE lesson_progress.completed_at END,
    updated_at = CURRENT_TIMESTAMP
  `;

  // Update module-level progress
  await updateModuleProgress(userId, moduleId);
}

export async function updateModuleProgress(userId: number, moduleId: number) {
  // Get module content to calculate total lessons/quizzes
  const module = await getModuleById(moduleId);
  if (!module) return;

  const totalLessons = module.content.lessons.length;
  const totalQuizzes = module.content.quizzes.length;

  // Get completed lessons and quizzes
  const completedLessons = await sql`
    SELECT COUNT(*) as count FROM lesson_progress 
    WHERE user_id = ${userId} AND module_id = ${moduleId} 
    AND completed = TRUE AND quiz_score IS NULL
  ` as { count: string }[];

  const completedQuizzes = await sql`
    SELECT COUNT(*) as count FROM lesson_progress 
    WHERE user_id = ${userId} AND module_id = ${moduleId} 
    AND completed = TRUE AND quiz_score IS NOT NULL
  ` as { count: string }[];

  const timeSpentResult = await sql`
    SELECT COALESCE(SUM(time_spent), 0) as total FROM lesson_progress 
    WHERE user_id = ${userId} AND module_id = ${moduleId}
  ` as { total: string }[];

  const progressPercentage = Math.round(
      ((Number(completedLessons[0].count) + Number(completedQuizzes[0].count)) /
          (totalLessons + totalQuizzes)) * 100
  );

  const isCompleted = progressPercentage === 100;

  // Update module progress
  await sql`
    INSERT INTO user_progress (
      user_id, module_id, progress_percentage, completed,
      completion_date, total_time_spent, last_accessed
    )
    VALUES (
             ${userId}, ${moduleId}, ${progressPercentage}, ${isCompleted},
             ${isCompleted ? sql`CURRENT_TIMESTAMP` : null},
             ${Number(timeSpentResult[0].total)}, CURRENT_TIMESTAMP
           )
      ON CONFLICT (user_id, module_id) DO UPDATE SET
      progress_percentage = EXCLUDED.progress_percentage,
                                            completed = EXCLUDED.completed,
                                            completion_date = CASE
                                            WHEN EXCLUDED.completed = TRUE AND user_progress.completed = FALSE
                                            THEN CURRENT_TIMESTAMP
                                            ELSE user_progress.completion_date
    END,
    total_time_spent = EXCLUDED.total_time_spent,
    last_accessed = CURRENT_TIMESTAMP
  `;

  return { progressPercentage, isCompleted };
}

export async function getLessonProgress(
    userId: number,
    moduleId: number,
    lessonId: string
) {
  const result = await sql`
    SELECT * FROM lesson_progress
    WHERE user_id = ${userId} AND module_id = ${moduleId} AND lesson_id = ${lessonId}
  `;
  return result.length > 0 ? result[0] : null;
}

export async function getModuleProgressDetailed(userId: number, moduleId: number) {
  const moduleProgress = await getUserProgress(userId, moduleId);
  const lessonProgress = await sql`
    SELECT * FROM lesson_progress
    WHERE user_id = ${userId} AND module_id = ${moduleId}
  `;

  return {
    moduleProgress,
    lessonProgress,
  };
}

export async function getAllUserProgress(userId: number) {
  return await sql`SELECT * FROM user_progress WHERE user_id = ${userId}` as UserProgress[];
}

export async function getAllLessonProgress(userId: number) {
  return await sql`SELECT * FROM lesson_progress WHERE user_id = ${userId}`;
}

export async function getAllUserCertificates(userId: number) {
  return await sql`SELECT * FROM certificates WHERE user_id = ${userId}`;
}

// Certificate functions
export async function generateCertificate(userId: number, moduleId: number): Promise<string> {
  // Check if module is completed
  const progress = await getUserProgress(userId, moduleId);
  if (!progress || !progress.completed) {
    throw new Error("Module must be completed before generating certificate");
  }

  // Check if certificate already exists
  const existingCerts = await sql`
    SELECT certificate_code FROM certificates 
    WHERE user_id = ${userId} AND module_id = ${moduleId}
  ` as { certificate_code: string }[];

  if (existingCerts.length > 0) {
    return existingCerts[0].certificate_code;
  }

  // Generate unique certificate code
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const certificateCode = `VC-${userId}-${moduleId}-${timestamp}-${random}`.toUpperCase();

  // Get user and module info for certificate data
  const user = await getUserById(userId);
  const module = await getModuleById(moduleId);

  const certificateData = {
    user: user?.username,
    module: module?.title,
    completionDate: progress.completion_date,
    timeSpent: progress.total_time_spent,
  };

  // Save certificate to database
  await sql`
    INSERT INTO certificates (user_id, module_id, certificate_code, certificate_data)
    VALUES (${userId}, ${moduleId}, ${certificateCode}, ${JSON.stringify(certificateData)})
  `;

  return certificateCode;
}

export async function getCertificate(userId: number, moduleId: number) {
  const result = await sql`
    SELECT * FROM certificates
    WHERE user_id = ${userId} AND module_id = ${moduleId}
  `;
  return result.length > 0 ? result[0] : null;
}

export async function verifyCertificate(certificateCode: string) {
  const result = await sql`
    SELECT c.*, u.username, m.title as module_title
    FROM certificates c
           JOIN users u ON c.user_id = u.id
           JOIN modules m ON c.module_id = m.id
    WHERE c.certificate_code = ${certificateCode} AND c.verified = TRUE
  `;
  return result.length > 0 ? result[0] : null;
}

export async function resetModuleProgress(userId: number, moduleId: number) {
  // Delete all lesson progress for this user/module
  await sql`DELETE FROM lesson_progress WHERE user_id = ${userId} AND module_id = ${moduleId}`;

  // Delete module-level progress
  await sql`DELETE FROM user_progress WHERE user_id = ${userId} AND module_id = ${moduleId}`;

  // Delete any certificate for this user/module
  await sql`DELETE FROM certificates WHERE user_id = ${userId} AND module_id = ${moduleId}`;
}