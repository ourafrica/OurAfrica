import db from "./database/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export function getModules() {
    const stmt = db.prepare("SELECT * FROM modules");
    const modules = stmt.all();
    return modules.map((module) => {
        return {
            ...module,
            content: JSON.parse(module.content),
        };
    });
}
export function getModuleById(id) {
    const stmt = db.prepare("SELECT * FROM modules WHERE id = ?");
    const module = stmt.get(id);
    if (module) {
        return {
            ...module,
            content: JSON.parse(module.content),
        };
    }
    return null;
}
export function getUserProgress(userId, moduleId) {
    const stmt = db.prepare("SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?");
    return stmt.get(userId, moduleId);
}
export function updateUserProgress(userId, moduleId, progress) {
    const stmt = db.prepare(`
    INSERT INTO user_progress (user_id, module_id, progress, last_accessed)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, module_id) DO UPDATE SET
    progress = excluded.progress,
    last_accessed = excluded.last_accessed
  `);
    stmt.run(userId, moduleId, JSON.stringify(progress));
}
export function saveModule(moduleData) {
    const stmt = db.prepare(`
    INSERT INTO modules (title, description, content, version, author, difficulty_level, tags, estimated_duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(moduleData.title, moduleData.description, JSON.stringify(moduleData.content), moduleData.version || "1.0.0", moduleData.author || null, moduleData.difficulty_level || "beginner", JSON.stringify(moduleData.tags || []), moduleData.content.estimatedTime || null);
    const moduleId = result.lastInsertRowid;
    // Retrieve the saved module from database to ensure consistent format
    const savedModule = getModuleById(moduleId);
    if (!savedModule) {
        throw new Error("Failed to retrieve saved module");
    }
    return savedModule;
}
// Authentication functions
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
export async function registerUser(username, email, password) {
    // Check if user already exists
    const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
        .get(email, username);
    if (existingUser) {
        throw new Error("User already exists with this email or username");
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // Insert user
    const stmt = db.prepare(`
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
  `);
    const result = stmt.run(username, email, hashedPassword);
    const userId = result.lastInsertRowid;
    // Get created user
    const user = db
        .prepare("SELECT id, username, email, role, created_at FROM users WHERE id = ?")
        .get(userId);
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
    });
    return { user, token };
}
export async function loginUser(email, password) {
    // Get user by email
    const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email);
    if (!user) {
        throw new Error("Invalid email or password");
    }
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
    });
    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
}
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch {
        throw new Error("Invalid or expired token");
    }
}
export function getUserById(id) {
    const stmt = db.prepare("SELECT id, username, email, role, created_at FROM users WHERE id = ?");
    return stmt.get(id);
}
// Progress tracking functions
export function updateLessonProgress(userId, moduleId, lessonId, completed, timeSpent, quizScore) {
    const stmt = db.prepare(`
    INSERT INTO lesson_progress (user_id, module_id, lesson_id, completed, time_spent, quiz_score, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, module_id, lesson_id) DO UPDATE SET
    completed = excluded.completed,
    time_spent = excluded.time_spent,
    quiz_score = excluded.quiz_score,
    completed_at = CASE WHEN excluded.completed = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END,
    updated_at = CURRENT_TIMESTAMP
  `);
    stmt.run(userId, moduleId, lessonId, completed ? 1 : 0, timeSpent, quizScore || null);
    // Update module-level progress
    updateModuleProgress(userId, moduleId);
}
export function updateModuleProgress(userId, moduleId) {
    // Get module content to calculate total lessons/quizzes
    const module = getModuleById(moduleId);
    if (!module)
        return;
    const totalLessons = module.content.lessons.length;
    const totalQuizzes = module.content.quizzes.length;
    // Get completed lessons and quizzes
    const completedLessons = db
        .prepare(`
    SELECT COUNT(*) as count FROM lesson_progress 
    WHERE user_id = ? AND module_id = ? AND completed = 1 AND quiz_score IS NULL
  `)
        .get(userId, moduleId);
    const completedQuizzes = db
        .prepare(`
    SELECT COUNT(*) as count FROM lesson_progress 
    WHERE user_id = ? AND module_id = ? AND completed = 1 AND quiz_score IS NOT NULL
  `)
        .get(userId, moduleId);
    const totalTimeSpent = db
        .prepare(`
    SELECT COALESCE(SUM(time_spent), 0) as total FROM lesson_progress 
    WHERE user_id = ? AND module_id = ?
  `)
        .get(userId, moduleId);
    const progressPercentage = Math.round(((completedLessons.count + completedQuizzes.count) /
        (totalLessons + totalQuizzes)) *
        100);
    const isCompleted = progressPercentage === 100;
    // Update module progress
    const stmt = db.prepare(`
    INSERT INTO user_progress (user_id, module_id, progress_percentage, completed, completion_date, total_time_spent, last_accessed)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, module_id) DO UPDATE SET
    progress_percentage = excluded.progress_percentage,
    completed = excluded.completed,
    completion_date = CASE WHEN excluded.completed = 1 AND completed = 0 THEN CURRENT_TIMESTAMP ELSE completion_date END,
    total_time_spent = excluded.total_time_spent,
    last_accessed = CURRENT_TIMESTAMP
  `);
    stmt.run(userId, moduleId, progressPercentage, isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null, totalTimeSpent.total);
    return { progressPercentage, isCompleted };
}
export function getLessonProgress(userId, moduleId, lessonId) {
    const stmt = db.prepare(`
    SELECT * FROM lesson_progress 
    WHERE user_id = ? AND module_id = ? AND lesson_id = ?
  `);
    return stmt.get(userId, moduleId, lessonId);
}
export function getModuleProgressDetailed(userId, moduleId) {
    const moduleProgress = getUserProgress(userId, moduleId);
    const lessonProgress = db
        .prepare(`
    SELECT * FROM lesson_progress 
    WHERE user_id = ? AND module_id = ?
  `)
        .all(userId, moduleId);
    return {
        moduleProgress,
        lessonProgress,
    };
}
export function getAllUserProgress(userId) {
    const stmt = db.prepare("SELECT * FROM user_progress WHERE user_id = ?");
    return stmt.all(userId);
}
export function getAllLessonProgress(userId) {
    const stmt = db.prepare("SELECT * FROM lesson_progress WHERE user_id = ?");
    return stmt.all(userId);
}
export function getAllUserCertificates(userId) {
    const stmt = db.prepare("SELECT * FROM certificates WHERE user_id = ?");
    return stmt.all(userId);
}
// Certificate functions
export function generateCertificate(userId, moduleId) {
    // Check if module is completed
    const progress = getUserProgress(userId, moduleId);
    if (!progress || !progress.completed) {
        throw new Error("Module must be completed before generating certificate");
    }
    // Check if certificate already exists
    const existingCert = db
        .prepare(`
    SELECT certificate_code FROM certificates 
    WHERE user_id = ? AND module_id = ?
  `)
        .get(userId, moduleId);
    if (existingCert) {
        return existingCert.certificate_code;
    }
    // Generate unique certificate code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const certificateCode = `VC-${userId}-${moduleId}-${timestamp}-${random}`.toUpperCase();
    // Get user and module info for certificate data
    const user = getUserById(userId);
    const module = getModuleById(moduleId);
    const certificateData = {
        user: user?.username,
        module: module?.title,
        completionDate: progress.completion_date,
        timeSpent: progress.total_time_spent,
    };
    // Save certificate to database
    const stmt = db.prepare(`
    INSERT INTO certificates (user_id, module_id, certificate_code, certificate_data)
    VALUES (?, ?, ?, ?)
  `);
    stmt.run(userId, moduleId, certificateCode, JSON.stringify(certificateData));
    return certificateCode;
}
export function getCertificate(userId, moduleId) {
    const stmt = db.prepare(`
    SELECT * FROM certificates 
    WHERE user_id = ? AND module_id = ?
  `);
    return stmt.get(userId, moduleId);
}
export function verifyCertificate(certificateCode) {
    const stmt = db.prepare(`
    SELECT c.*, u.username, m.title as module_title 
    FROM certificates c
    JOIN users u ON c.user_id = u.id
    JOIN modules m ON c.module_id = m.id
    WHERE c.certificate_code = ? AND c.verified = 1
  `);
    return stmt.get(certificateCode);
}
/**
 * Reset all progress and certificates for a user/module
 */
export function resetModuleProgress(userId, moduleId) {
    // Delete all lesson progress for this user/module
    db.prepare("DELETE FROM lesson_progress WHERE user_id = ? AND module_id = ?").run(userId, moduleId);
    // Delete module-level progress
    db.prepare("DELETE FROM user_progress WHERE user_id = ? AND module_id = ?").run(userId, moduleId);
    // Delete any certificate for this user/module
    db.prepare("DELETE FROM certificates WHERE user_id = ? AND module_id = ?").run(userId, moduleId);
}
