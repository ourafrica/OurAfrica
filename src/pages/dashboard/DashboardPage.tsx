import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Clock, Award, Calendar, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useModulesStore, useModuleCount } from "../../hooks/useModules";
import { useProgress } from "../../hooks/useProgress";
import Button from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import Progress from "../../components/ui/Progress";
import { formatDate, formatTime } from "../../lib/utils";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use the safe store selector - modules is guaranteed to be an array
  const { modules, loadModules, isLoading: isModulesLoading } = useModulesStore();
  const moduleCount = useModuleCount();

  const {
    getModuleProgress,
    getCertificateCount,
    isLoading: isProgressLoading,
  } = useProgress();

  // Load modules when component mounts
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  if (!user || isProgressLoading || isModulesLoading) {
    return (
        <div className="p-6 max-w-7xl mx-auto text-center">
          <p>Loading dashboard...</p>
        </div>
    );
  }

  console.log('=== DEBUGGING MODULES BEFORE REDUCE ===');
  console.log('modules:', modules);
  console.log('typeof modules:', typeof modules);
  console.log('Array.isArray(modules):', Array.isArray(modules));
  console.log('modules === null:', modules === null);
  console.log('modules === undefined:', modules === undefined);
  console.log('modules constructor:', modules?.constructor?.name);
  if (modules && typeof modules === 'object') {
    console.log('modules keys:', Object.keys(modules));
  }
  console.log('=======================================');

  // Calculate total learning time - modules is guaranteed to be an array now
  const totalLearningTime = modules.reduce((total, module) => {
    // Safety checks for module structure
    if (!module || typeof module !== 'object') return total;
    if (!module.content || typeof module.content !== 'object') return total;

    const lessonsLength = Array.isArray(module.content.lessons) ? module.content.lessons.length : 0;
    const quizzesLength = Array.isArray(module.content.quizzes) ? module.content.quizzes.length : 0;

    const progress = user
        ? getModuleProgress(user.id, module.id, lessonsLength, quizzesLength)
        : null;

    return total + (progress?.totalTimeSpent || 0);
  }, 0);

  return (
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-text dark:text-text-dark">
            Welcome back, {user.username}!
          </h1>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            Continue your learning journey right where you left off.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                    Enrolled Modules
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{moduleCount}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full dark:bg-primary-dark/20">
                  <BookOpen className="h-6 w-6 text-primary dark:text-primary-dark" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                    Total Learning Time
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatTime(totalLearningTime)}
                  </h3>
                </div>
                <div className="p-2 bg-secondary/10 rounded-full dark:bg-secondary-dark/20">
                  <Clock className="h-6 w-6 text-secondary dark:text-secondary-dark" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                    Certificates Earned
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {user ? getCertificateCount(user.id) : 0}
                  </h3>
                </div>
                <div className="p-2 bg-accent/10 rounded-full dark:bg-accent-dark/20">
                  <Award className="h-6 w-6 text-accent dark:text-accent-dark" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                    Joined On
                  </p>
                  <h3 className="text-lg font-bold mt-1">
                    {formatDate(new Date(user.created_at))}
                  </h3>
                </div>
                <div className="p-2 bg-warning/10 rounded-full dark:bg-warning-dark/20">
                  <Calendar className="h-6 w-6 text-warning dark:text-warning-dark" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-text dark:text-text-dark">
          Your Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {modules.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">No modules yet</h3>
                  <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
                    You haven't downloaded any modules yet. Get started by
                    downloading your first module.
                  </p>
                  <Button
                      onClick={() => navigate({ to: "/modules/browse" })}
                      rightIcon={<ArrowUpRight size={16} />}
                  >
                    Browse Modules
                  </Button>
                </CardContent>
              </Card>
          ) : (
              modules.map((module) => {
                // Safety checks for module structure
                if (!module || typeof module !== 'object' || !module.id) {
                  console.warn('Invalid module data:', module);
                  return null;
                }

                if (!module.content || typeof module.content !== 'object') {
                  console.warn('Invalid module content:', module);
                  return null;
                }

                const lessonsLength = Array.isArray(module.content.lessons) ? module.content.lessons.length : 0;
                const quizzesLength = Array.isArray(module.content.quizzes) ? module.content.quizzes.length : 0;

                const progress = user
                    ? getModuleProgress(user.id, module.id, lessonsLength, quizzesLength)
                    : null;

                const percentComplete = progress?.percentComplete || 0;
                const isCompleted = percentComplete === 100;

                return (
                    <Card
                        key={module.id}
                        className="overflow-hidden group hover:shadow-md transition-shadow duration-300"
                    >
                      <CardHeader className="p-6 pb-0">
                        <CardTitle className="text-xl">{module.title || 'Untitled Module'}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {module.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm">{percentComplete}%</span>
                            </div>
                            <Progress
                                value={percentComplete}
                                variant={
                                  percentComplete === 100 ? "success" : "default"
                                }
                            />
                          </div>

                          <div className="flex items-center text-sm text-text-secondary dark:text-text-secondary-dark">
                            <Clock size={16} className="mr-1" />
                            <span>
                        {formatTime(module.content.estimatedTime || 0)} estimated
                      </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0 flex justify-between">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: `/modules/${module.id}` })}
                        >
                          View Details
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                              if (isCompleted) {
                                navigate({ to: `/modules/${module.id}` });
                              } else {
                                navigate({
                                  to: `/modules/${module.id}/learn/${
                                      progress && progress.lessonsCompleted > 0
                                          ? `lesson-${progress.lessonsCompleted + 1}`
                                          : "lesson-1"
                                  }`,
                                });
                              }
                            }}
                        >
                          {isCompleted
                              ? "Review"
                              : progress && progress.lessonsCompleted > 0
                                  ? "Continue"
                                  : "Start Learning"}
                        </Button>
                      </CardFooter>
                    </Card>
                );
              }).filter(Boolean)
          )}
        </div>

        {modules.length > 0 && (
            <div className="text-center">
              <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/modules/browse" })}
                  rightIcon={<ArrowUpRight size={16} />}
              >
                Browse More Modules
              </Button>
            </div>
        )}
      </div>
  );
};

export default DashboardPage;