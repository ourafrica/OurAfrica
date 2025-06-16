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
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  const quiz = currentModule.content.quizzes.find((q) => q.id === quizId);

  if (!quiz) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz Not Found</h2>
          <p className="text-gray-500 mb-4">
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
        const { getAuthHeaders } = useAuth.getState();
        await saveQuizScore(
          user.id,
          parseInt(moduleId),
          quizId,
          calculatedScore,
          getAuthHeaders()
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fadeIn">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              {isPassed ? (
                <Award size={48} className="text-success-500" />
              ) : (
                <X size={48} className="text-error-500" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold">
                {isPassed ? "Congratulations!" : "Almost there!"}
              </h3>
              <p className="text-gray-500 mt-1">
                {isPassed
                  ? moduleCompleted
                    ? "You have completed the entire module! Your certificate is ready."
                    : "You passed the quiz successfully."
                  : "You didn't reach the passing score. Try again?"}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Your Score</span>
                <span
                  className={`font-bold ${
                    isPassed ? "text-success-500" : "text-error-500"
                  }`}
                >
                  {score}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Passing Score</span>
                <span>{quiz.passingScore}%</span>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Top navigation bar */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate({ to: `/modules/${moduleId}` })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ChevronLeft size={20} />
                <span className="sr-only">Back to Module</span>
              </button>
              <div className="text-center">
                <h1 className="text-sm font-medium">{quiz.title}</h1>
                <p className="text-xs text-gray-500">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-6">
          <h2 className="text-xl font-bold mb-6">
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
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                    }
                  `}
                  >
                    {answers[currentQuestionIndex] === index && (
                      <Check size={12} />
                    )}
                  </div>
                  <span>{option}</span>
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
