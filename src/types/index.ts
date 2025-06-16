// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  created_at: string;
}

export interface AuthUser extends User {
  token: string;
}

// Module types
export interface Module {
  id: number;
  title: string;
  description: string;
  content: ModuleContent;
  version: string;
  author?: string;
  difficulty_level?: string;
  tags?: string[];
  estimated_duration?: number;
  created_at: string;
  updated_at?: string;
}

export interface ModuleContent {
  lessons: Lesson[];
  quizzes: Quiz[];
  estimatedTime: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: LessonContent[];
  order: number;
}

export type LessonContent =
  | { type: "text"; content: string }
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; title: string }
  | { type: "code"; language: string; content: string };

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  afterLessonId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

// Progress types
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

export interface LessonProgressData {
  id: number;
  user_id: number;
  module_id: number;
  lesson_id: string;
  completed: boolean;
  time_spent: number;
  quiz_score?: number;
  quiz_attempts: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  timeSpent: number;
}

export interface ModuleProgress {
  moduleId: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  totalTimeSpent: number;
  percentComplete: number;
}

// Certificate types
export interface Certificate {
  id: number;
  user_id: number;
  module_id: number;
  issued_at: string;
  certificate_code: string;
}
