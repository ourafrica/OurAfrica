import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  LessonProgress,
  ModuleProgress,
  UserProgress,
  Certificate,
  LessonProgressData,
} from "../types";
import { calculateProgress } from "../lib/utils";

interface ProgressState {
  progress: UserProgress[];
  lessonProgress: LessonProgressData[];
  certificates: Certificate[];
  isLoading: boolean;
  error: string | null;
  loadProgress: (
    userId: number,
    authHeaders?: Record<string, string>
  ) => Promise<void>;
  getModuleProgress: (
    userId: number,
    moduleId: number,
    totalLessons: number,
    totalQuizzes: number
  ) => ModuleProgress | null;
  getLessonProgress: (
    userId: number,
    moduleId: number,
    lessonId: string
  ) => LessonProgress | null;
  updateLessonProgress: (
    userId: number,
    moduleId: number,
    lessonId: string,
    progressData: {
      completed?: boolean;
      timeSpent?: number;
      quizScore?: number;
    },
    authHeaders?: Record<string, string>
  ) => Promise<void>;
  saveQuizScore: (
    userId: number,
    moduleId: number,
    lessonId: string,
    score: number,
    authHeaders?: Record<string, string>
  ) => Promise<void>;
  isModuleCompleted: (
    userId: number,
    moduleId: number,
    totalLessons: number,
    totalQuizzes: number
  ) => boolean;
  getCertificate: (userId: number, moduleId: number) => Certificate | null;
  getCertificateCount: (userId: number) => number;
  generateCertificate: (
    userId: number,
    moduleId: number,
    authHeaders?: Record<string, string>
  ) => Promise<void>;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: [],
      lessonProgress: [],
      certificates: [],
      isLoading: false,
      error: null,

      loadProgress: async (userId: number, authHeaders = {}) => {
        set({ isLoading: true, error: null });
        try {
          // Load user progress for all modules
          const progressResponse = await fetch(`/api/progress/${userId}`, {
            headers: authHeaders,
          });

          // Load lesson progress for all modules
          const lessonProgressResponse = await fetch(
            `/api/progress/${userId}/lessons`,
            {
              headers: authHeaders,
            }
          );

          if (!progressResponse.ok || !lessonProgressResponse.ok) {
            throw new Error("Failed to fetch progress");
          }

          const progress = await progressResponse.json();
          const lessonProgress = await lessonProgressResponse.json();

          // Load certificates
          const certificatesResponse = await fetch(
            `/api/progress/${userId}/certificates`,
            {
              headers: authHeaders,
            }
          );

          if (!certificatesResponse.ok) {
            throw new Error("Failed to fetch certificates");
          }

          const certificates = await certificatesResponse.json();

          set({
            progress: Array.isArray(progress) ? progress : [],
            lessonProgress: Array.isArray(lessonProgress) ? lessonProgress : [],
            certificates: Array.isArray(certificates) ? certificates : [],
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load progress",
            isLoading: false,
          });
        }
      },

      getModuleProgress: (
        userId: number,
        moduleId: number,
        totalLessons: number,
        totalQuizzes: number
      ) => {
        // Get module-level progress
        const moduleProgress = get().progress.find(
          (p) => p.user_id === userId && p.module_id === moduleId
        );

        // Get lesson-level progress for this module
        const lessonProgressData = get().lessonProgress.filter(
          (lp) => lp.user_id === userId && lp.module_id === moduleId
        );

        const lessonsCompleted = lessonProgressData.filter(
          (lp) => lp.completed && lp.quiz_score === null
        ).length;

        const quizzesCompleted = lessonProgressData.filter(
          (lp) => lp.completed && lp.quiz_score !== null
        ).length;

        const totalTimeSpent = lessonProgressData.reduce(
          (acc, lp) => acc + lp.time_spent,
          0
        );

        const percentComplete =
          moduleProgress?.progress_percentage ||
          calculateProgress(
            lessonsCompleted + quizzesCompleted,
            totalLessons + totalQuizzes
          );

        return {
          moduleId,
          lessonsCompleted,
          totalLessons,
          quizzesCompleted,
          totalQuizzes,
          totalTimeSpent,
          percentComplete,
        };
      },

      getLessonProgress: (
        userId: number,
        moduleId: number,
        lessonId: string
      ) => {
        const lessonProgressData = get().lessonProgress.find(
          (lp) =>
            lp.user_id === userId &&
            lp.module_id === moduleId &&
            lp.lesson_id === lessonId
        );

        if (!lessonProgressData) {
          return null;
        }

        return {
          lessonId,
          completed: lessonProgressData.completed,
          timeSpent: lessonProgressData.time_spent,
        };
      },

      updateLessonProgress: async (
        userId: number,
        moduleId: number,
        lessonId: string,
        progressData: {
          completed?: boolean;
          timeSpent?: number;
          quizScore?: number;
        },
        authHeaders = {}
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/progress/lesson", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              userId,
              moduleId,
              lessonId,
              completed: progressData.completed || false,
              timeSpent: progressData.timeSpent || 0,
              quizScore: progressData.quizScore,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update lesson progress");
          }

          const updatedProgress = await response.json();

          set((state) => {
            const existingIndex = state.lessonProgress.findIndex(
              (lp) =>
                lp.user_id === userId &&
                lp.module_id === moduleId &&
                lp.lesson_id === lessonId
            );

            if (existingIndex >= 0) {
              const updatedLessonProgress = [...state.lessonProgress];
              updatedLessonProgress[existingIndex] = updatedProgress;
              return {
                lessonProgress: updatedLessonProgress,
                isLoading: false,
              };
            } else {
              return {
                lessonProgress: [...state.lessonProgress, updatedProgress],
                isLoading: false,
              };
            }
          });

          // Reload all progress to get updated module-level progress
          await get().loadProgress(userId, authHeaders);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update progress",
            isLoading: false,
          });
          throw error; // Re-throw to allow calling code to handle the error
        }
      },

      saveQuizScore: async (
        userId: number,
        moduleId: number,
        lessonId: string,
        score: number,
        authHeaders = {}
      ) => {
        await get().updateLessonProgress(
          userId,
          moduleId,
          lessonId,
          {
            completed: true,
            quizScore: score,
          },
          authHeaders
        );
      },

      isModuleCompleted: (
        userId: number,
        moduleId: number,
        totalLessons: number,
        totalQuizzes: number
      ) => {
        // Get lesson-level progress for this module
        const lessonProgressData = get().lessonProgress.filter(
          (lp) => lp.user_id === userId && lp.module_id === moduleId
        );

        // Count completed lessons (entries with lesson IDs like "lesson-1", "lesson-2", etc.)
        const completedLessons = lessonProgressData.filter(
          (lp) => lp.completed && lp.lesson_id.startsWith("lesson-")
        ).length;

        // Count completed quizzes (entries with quiz IDs like "quiz-1", "quiz-2", etc.)
        const completedQuizzes = lessonProgressData.filter(
          (lp) =>
            lp.completed &&
            lp.lesson_id.startsWith("quiz-") &&
            lp.quiz_score !== null
        ).length;

        // Module is completed when all lessons and all quizzes are completed
        return (
          completedLessons === totalLessons && completedQuizzes === totalQuizzes
        );
      },

      getCertificate: (userId: number, moduleId: number) => {
        return (
          get().certificates.find(
            (cert) => cert.user_id === userId && cert.module_id === moduleId
          ) || null
        );
      },

      getCertificateCount: (userId: number) => {
        return get().certificates.filter((cert) => cert.user_id === userId)
          .length;
      },

      generateCertificate: async (
        userId: number,
        moduleId: number,
        authHeaders = {}
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/progress/certificate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              userId,
              moduleId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to generate certificate");
          }

          const certificate = await response.json();

          set((state) => ({
            certificates: [...state.certificates, certificate],
            isLoading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate certificate",
            isLoading: false,
          });
          throw error; // Re-throw to allow calling code to handle the error
        }
      },
    }),
    {
      name: "progress-storage",
    }
  )
);
