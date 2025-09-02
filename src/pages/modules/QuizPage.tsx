import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Check, X, Award, Download } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useModules } from "../../hooks/useModules";
import { useProgress } from "../../hooks/useProgress";
import Button from "../../components/ui/Button";
import Progress from "../../components/ui/Progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { useCertificateDownload } from "../../hooks/useCertificateDownload";

const QuizPage: React.FC = () => {
  const { moduleId, quizId } = useParams({
    from: "/modules/$moduleId/quiz/$quizId",
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentModule,
    loadModuleById,
    isLoading: moduleLoading,
  } = useModules();
  const { saveQuizScore, isModuleCompleted } = useProgress();
  const { downloadCertificate, isGenerating: isGeneratingCertificate } =
    useCertificateDownload();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [moduleCompleted, setModuleCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (moduleId) {
      loadModuleById(parseInt(moduleId));
    }
  }, [moduleId, loadModuleById]);

  if (moduleLoading || !currentModule) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-dark/50 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-surface-dark/50 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-surface-dark/50 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  const quiz = currentModule.content.quizzes.find((q) => q.id === quizId);

  if (!quiz) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz Not Found</h2>
          <p className="text-text-secondary mb-4">
            The quiz you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: `/modules/${moduleId}` })}>
            Back to Module
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeQuiz = async () => {
    // Calculate score
    let correctAnswers = 0;

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const calculatedScore = Math.round(
      (correctAnswers / quiz.questions.length) * 100
    );
    setScore(calculatedScore);
    setQuizComplete(true);

    // Save quiz score
    if (user) {
      try {
        // const { getAuthHeaders } = useAuth.getState();
        await saveQuizScore(
          user.id,
          parseInt(moduleId),
          quizId,
          calculatedScore,
        );

        // No artificial delay - saveQuizScore already reloads progress via updateLessonProgress
        // Check if the module is now completed (regardless of quiz order)
        const moduleIsCompleted = isModuleCompleted(
          user.id,
          parseInt(moduleId),
          currentModule.content.lessons.length,
          currentModule.content.quizzes.length
        );

        // Set module completion state if all lessons and quizzes are completed
        // and this quiz was passed
        if (moduleIsCompleted && calculatedScore >= quiz.passingScore) {
          setModuleCompleted(true);
        }
      } catch (error) {
        console.error("Failed to save quiz score:", error);
      }
    }
  };

  const handleDownloadCertificate = async () => {
    if (!user || !currentModule) return;
    await downloadCertificate(user, currentModule);
  };

  const handleFinish = () => {
    // Find the next lesson after the lesson associated with this quiz
    const afterLessonId = quiz.afterLessonId;
    const lessonIndex = currentModule.content.lessons.findIndex(
      (l) => l.id === afterLessonId
    );

    if (
      lessonIndex !== -1 &&
      lessonIndex < currentModule.content.lessons.length - 1
    ) {
      const nextLesson = currentModule.content.lessons[lessonIndex + 1];
      navigate({ to: `/modules/${moduleId}/learn/${nextLesson.id}` });
    } else {
      // If there's no next lesson, go back to the module details page
      navigate({ to: `/modules/${moduleId}` });
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isPassed = score >= quiz.passingScore;

  if (quizComplete) {
    // Helper: is this the final quiz?
    const isFinalQuiz = () => {
      if (
        !currentModule ||
        !currentModule.content ||
        !currentModule.content.quizzes
      )
        return false;
      const quizzes = currentModule.content.quizzes;
      return quizzes.length > 0 && quizzes[quizzes.length - 1].id === quizId;
    };

    // Handler: reset all progress and go to first lesson
    const handleStartOver = async () => {
      if (!user || !currentModule) return;
      try {
        await fetch("/api/progress/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            moduleId: currentModule.id,
          }),
        });
        // Navigate to the first lesson
        const firstLesson = currentModule.content.lessons[0];
        if (firstLesson) {
          navigate({
            to: `/modules/${currentModule.id}/learn/${firstLesson.id}`,
          });
        } else {
          navigate({ to: `/modules/${currentModule.id}` });
        }
      } catch {
        alert("Failed to reset progress. Please try again.");
      }
    };

    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fadeIn">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-surface/50 dark:bg-surface-dark/50">
              {isPassed ? (
                <Award
                  size={48}
                  className="text-success dark:text-success-dark"
                />
              ) : (
                <X size={48} className="text-error dark:text-error-dark" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold">
                {isPassed ? "Congratulations!" : "Almost there!"}
              </h3>
              <p className="text-text-secondary mt-1">
                {isPassed
                  ? moduleCompleted
                    ? "You have completed the entire module! Your certificate is ready."
                    : "You passed the quiz successfully."
                  : "You didn't reach the passing score. Try again?"}
              </p>
            </div>

            <div className="bg-surface/50 dark:bg-surface-dark/50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-text dark:text-text-dark">
                  Your Score
                </span>
                <span
                  className={`font-bold ${
                    isPassed
                      ? "text-success dark:text-success-dark"
                      : "text-error dark:text-error-dark"
                  }`}
                >
                  {score}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text dark:text-text-dark">
                  Passing Score
                </span>
                <span className="text-text dark:text-text-dark">
                  {quiz.passingScore}%
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            {isPassed ? (
              moduleCompleted ? (
                <Button
                  onClick={handleDownloadCertificate}
                  isLoading={isGeneratingCertificate}
                  leftIcon={<Download size={16} />}
                  variant="secondary"
                >
                  {isGeneratingCertificate
                    ? "Generating..."
                    : "Download Certificate"}
                </Button>
              ) : (
                <Button onClick={handleFinish}>Continue Learning</Button>
              )
            ) : (
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuizComplete(false);
                    setCurrentQuestionIndex(0);
                    setAnswers([]);
                  }}
                >
                  Try Again
                </Button>
                {/* Show Start Over only if this is the final quiz */}
                {isFinalQuiz() ? (
                  <Button color="danger" onClick={handleStartOver}>
                    Start Over
                  </Button>
                ) : (
                  <Button onClick={handleFinish}>Continue Anyway</Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark pb-16">
      {/* Top navigation bar */}
      <header className="sticky top-0 bg-surface dark:bg-surface-dark shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate({ to: `/modules/${moduleId}` })}
                className="text-text-secondary hover:text-text dark:text-text-secondary-dark dark:hover:text-text-dark"
              >
                <ChevronLeft size={20} />
                <span className="sr-only">Back to Module</span>
              </button>
              <div className="text-center">
                <h1 className="text-sm font-medium text-text dark:text-text-dark">
                  {quiz.title}
                </h1>
                <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
              <div className="w-5"></div> {/* Spacer for alignment */}
            </div>

            <div className="mt-2">
              <Progress value={progress} size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Quiz content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden p-6">
          <h2 className="text-xl font-bold mb-6 text-text dark:text-text-dark">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    answers[currentQuestionIndex] === index
                      ? "border-primary dark:border-primary-dark bg-primary/10 dark:bg-primary-dark/20"
                      : "border-border dark:border-border-dark hover:border-primary/50 dark:hover:border-primary-dark/50"
                  }
                `}
                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
              >
                <div className="flex items-center">
                  <div
                    className={`
                    w-5 h-5 rounded-full mr-3 flex items-center justify-center
                    ${
                      answers[currentQuestionIndex] === index
                        ? "bg-primary dark:bg-primary-dark text-white"
                        : "bg-surface/50 dark:bg-surface-dark/50"
                    }
                  `}
                  >
                    {answers[currentQuestionIndex] === index && (
                      <Check size={12} />
                    )}
                  </div>
                  <span className="text-text dark:text-text-dark">
                    {option}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Button
            onClick={handleNextQuestion}
            disabled={answers[currentQuestionIndex] === undefined}
          >
            {currentQuestionIndex === quiz.questions.length - 1
              ? "Submit"
              : "Next"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
