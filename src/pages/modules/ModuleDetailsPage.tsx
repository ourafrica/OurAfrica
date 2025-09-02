import React, { useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Clock, BookOpen, Award, ArrowRight, Download } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useModules } from "../../hooks/useModules";
import { useProgress } from "../../hooks/useProgress";
import Button from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Progress from "../../components/ui/Progress";
import { formatTime } from "../../lib/utils";
import { useCertificateDownload } from "../../hooks/useCertificateDownload";

const ModuleDetailsPage: React.FC = () => {
  const { moduleId } = useParams({ from: "/modules/$moduleId" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentModule, loadModuleById, isLoading, error } = useModules();
  const { getModuleProgress, isModuleCompleted, loadProgress } = useProgress();
  const { downloadCertificate, isGenerating: isGeneratingCertificate } =
    useCertificateDownload();

  useEffect(() => {
    if (moduleId) {
      loadModuleById(parseInt(moduleId));
    }

    // Load progress data when user is available
    if (user) {
      // const {  } = useAuth.getState();
      loadProgress(user.id);
    }
  }, [moduleId, user, loadModuleById, loadProgress]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-dark/50 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-surface-dark/50 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-surface-dark/50 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-surface-dark/50 rounded"></div>
            <div className="h-32 bg-surface-dark/50 rounded"></div>
            <div className="h-32 bg-surface-dark/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentModule) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
            <p className="text-text-secondary mb-4">
              The module you're looking for doesn't exist or hasn't been
              downloaded yet.
            </p>
            <Button onClick={() => navigate({ to: "/modules/browse" })}>
              Browse Modules
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = user
    ? getModuleProgress(
        user.id,
        currentModule.id,
        currentModule.content.lessons.length,
        currentModule.content.quizzes.length
      )
    : null;

  // Calculate the correct percentage based on actual module structure
  let percentComplete = 0;
  if (progress && currentModule) {
    const totalLessons = currentModule.content.lessons.length;
    const totalQuizzes = currentModule.content.quizzes.length;
    const totalItems = totalLessons + totalQuizzes;

    // Count actual completed items from progress
    const completedItems =
      (progress.lessonsCompleted || 0) + (progress.quizzesCompleted || 0);
    percentComplete =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }

  // Check if module is completed
  const moduleCompleted =
    user && currentModule
      ? isModuleCompleted(
          user.id,
          currentModule.id,
          currentModule.content.lessons.length,
          currentModule.content.quizzes.length
        )
      : false;

  const handleDownloadCertificate = async () => {
    if (!user || !currentModule) return;
    await downloadCertificate(user, currentModule);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-text dark:text-text-dark">
          {currentModule.title}
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark">
          {currentModule.description}
        </p>
      </header>

      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">
          Your Progress
        </h2>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Overall Completion</span>
            <span>{percentComplete}%</span>
          </div>
          <Progress
            value={percentComplete}
            variant={percentComplete === 100 ? "success" : "default"}
            size="lg"
            showValue
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface/50 dark:bg-surface-dark/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <BookOpen
                size={20}
                className="mr-2 text-primary dark:text-primary-dark"
              />
              <h3 className="font-semibold">Lessons</h3>
            </div>
            <p className="text-2xl font-bold">
              {progress?.lessonsCompleted || 0}/
              {currentModule.content.lessons.length}
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
              lessons completed
            </p>
          </div>

          <div className="bg-surface/50 dark:bg-surface-dark/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Award
                size={20}
                className="mr-2 text-accent dark:text-accent-dark"
              />
              <h3 className="font-semibold">Quizzes</h3>
            </div>
            <p className="text-2xl font-bold">
              {progress?.quizzesCompleted || 0}/
              {currentModule.content.quizzes.length}
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
              quizzes completed
            </p>
          </div>

          <div className="bg-surface/50 dark:bg-surface-dark/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock
                size={20}
                className="mr-2 text-secondary dark:text-secondary-dark"
              />
              <h3 className="font-semibold">Time Spent</h3>
            </div>
            <p className="text-2xl font-bold">
              {formatTime(progress?.totalTimeSpent || 0)}
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
              learning time
            </p>
          </div>
        </div>
      </div>

      {/* Certificate Section */}
      {moduleCompleted && (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <Award
                  size={24}
                  className="mr-2 text-success dark:text-success-dark"
                />
                Certificate of Completion
              </h2>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Congratulations! You have completed this module. Download your
                certificate to showcase your achievement.
              </p>
            </div>
            <Button
              onClick={handleDownloadCertificate}
              isLoading={isGeneratingCertificate}
              leftIcon={<Download size={16} />}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {isGeneratingCertificate
                ? "Generating..."
                : "Download Certificate"}
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">
          Module Content
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border dark:divide-border-dark">
              {currentModule.content.lessons.map((lesson, index) => (
                <li key={lesson.id} className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-text-secondary text-sm mr-2">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigate({
                          to: `/modules/${currentModule.id}/learn/${lesson.id}`,
                        })
                      }
                      rightIcon={<ArrowRight size={16} />}
                    >
                      {progress?.lessonsCompleted &&
                      progress.lessonsCompleted > index
                        ? "Review"
                        : "Start"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border dark:divide-border-dark">
              {currentModule.content.quizzes.map((quiz, index) => {
                // Find the lesson that must be completed before this quiz
                const requiredLesson = currentModule.content.lessons.find(
                  (lesson) => lesson.id === quiz.afterLessonId
                );

                // Determine if the quiz is unlocked
                const requiredLessonIndex = requiredLesson
                  ? currentModule.content.lessons.findIndex(
                      (l) => l.id === requiredLesson.id
                    )
                  : -1;

                const isUnlocked = progress?.lessonsCompleted
                  ? progress.lessonsCompleted >= requiredLessonIndex + 1
                  : false;

                return (
                  <li key={quiz.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-text-secondary text-sm mr-2">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{quiz.title}</span>
                        {!isUnlocked && (
                          <span className="ml-2 text-sm text-text-secondary">
                            (Complete lesson {requiredLessonIndex + 1} to
                            unlock)
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate({
                            to: `/modules/${currentModule.id}/quiz/${quiz.id}`,
                          })
                        }
                        disabled={!isUnlocked}
                        rightIcon={<ArrowRight size={16} />}
                      >
                        Take Quiz
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button
          onClick={() =>
            navigate({ to: `/modules/${currentModule.id}/learn/lesson-1` })
          }
          size="lg"
        >
          {progress && progress.lessonsCompleted > 0
            ? "Continue Learning"
            : "Start Learning"}
        </Button>
      </div>
    </div>
  );
};

export default ModuleDetailsPage;
