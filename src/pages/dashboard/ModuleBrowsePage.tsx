import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, CheckCircle, Info, Plus } from "lucide-react";
import { useModules } from "../../hooks/useModules";
import { useAuth } from "../../hooks/useAuth";
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
import { formatTime } from "../../lib/utils";
import ModuleLoader from "../../components/modules/ModuleLoader";
import { Module } from "../../types";

const ModuleBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const { modules, saveModule, isLoading: isModulesLoading } = useModules();
  const { user } = useAuth();
  const { getModuleProgress, isLoading: isProgressLoading } = useProgress();
  const [isModuleLoaderOpen, setIsModuleLoaderOpen] = useState(false);

  const handleModuleLoaded = async (module: Module) => {
    try {
      await saveModule(module);
      setIsModuleLoaderOpen(false);
    } catch (error) {
      console.error("Failed to save module:", error);
      // The error will be handled by the useModules hook
    }
  };

  // Show loading state while either modules or progress is loading
  if (isProgressLoading || isModulesLoading) {
    return (
        <div className="p-6 max-w-7xl mx-auto text-center">
          <p>Loading modules...</p>
        </div>
    );
  }

  // Debug logging
  console.log("🔍 ModuleBrowsePage render - modules:", modules);
  console.log("🔍 ModuleBrowsePage render - modules length:", modules?.length);
  console.log("🔍 ModuleBrowsePage render - modules type:", typeof modules);

  // Debug the first module structure
  if (modules && modules.length > 0) {
    console.log("🔍 First module object:", modules[0]);
    console.log("🔍 First module keys:", Object.keys(modules[0]));
    console.log("🔍 First module id:", modules[0].id);
    console.log("🔍 First module title:", modules[0].title);
  }

  // Handle case where modules is not an array or is empty
  if (!modules || !Array.isArray(modules)) {
    console.warn("⚠️ Modules is not an array:", modules);
    return (
        <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-text dark:text-text-dark">
                Browse Modules
              </h1>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Discover and download new learning modules to expand your knowledge.
              </p>
            </div>
            <Button
                onClick={() => setIsModuleLoaderOpen(true)}
                leftIcon={<Plus size={16} />}
            >
              Load Module
            </Button>
          </header>

          <div className="text-center py-12">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              No modules available. Click "Load Module" to add your first module.
            </p>
          </div>

          <ModuleLoader
              isOpen={isModuleLoaderOpen}
              onClose={() => setIsModuleLoaderOpen(false)}
              onModuleLoaded={handleModuleLoaded}
              existingModules={modules || []}
          />
        </div>
    );
  }

  if (modules.length === 0) {
    return (
        <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-text dark:text-text-dark">
                Browse Modules
              </h1>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Discover and download new learning modules to expand your knowledge.
              </p>
            </div>
            <Button
                onClick={() => setIsModuleLoaderOpen(true)}
                leftIcon={<Plus size={16} />}
            >
              Load Module
            </Button>
          </header>

          <div className="text-center py-12">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              No modules found. Click "Load Module" to add your first module.
            </p>
          </div>

          <ModuleLoader
              isOpen={isModuleLoaderOpen}
              onClose={() => setIsModuleLoaderOpen(false)}
              onModuleLoaded={handleModuleLoaded}
              existingModules={modules}
          />
        </div>
    );
  }

  return (
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-text dark:text-text-dark">
              Browse Modules
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Discover and download new learning modules to expand your knowledge.
            </p>
          </div>
          <Button
              onClick={() => setIsModuleLoaderOpen(true)}
              leftIcon={<Plus size={16} />}
          >
            Load Module
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {modules.map((module: Module, index: number) => {
            console.log(`🔄 Rendering module ${index}:`, module);
            console.log(`🔄 Module keys:`, Object.keys(module || {}));
            console.log(`🔄 Module id:`, module?.id);
            console.log(`🔄 Module title:`, module?.title);

            // Ensure we have a valid module object
            if (!module || typeof module !== 'object') {
              console.warn(`⚠️ Invalid module at index ${index}:`, module);
              return null;
            }

            const progress = user
                ? getModuleProgress(
                    user.id,
                    module.id,
                    module.content?.lessons?.length || 0,
                    module.content?.quizzes?.length || 0
                )
                : null;

            const isCompleted = progress?.percentComplete === 100;
            // All modules in the store are already downloaded/loaded
            const isDownloaded = true;

            return (
                <Card
                    key={module.id || `module-${index}`}
                    className="overflow-hidden group hover:shadow-md transition-shadow duration-300"
                >
                  <CardHeader className="p-6 pb-0">
                    <CardTitle className="text-xl">
                      {module.title || "Untitled Module"}
                      {isDownloaded && (
                          <CheckCircle
                              className="inline-block ml-2 text-success dark:text-success-dark"
                              size={16}
                          />
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {module.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-text-secondary">
                        <Clock size={16} className="mr-1" />
                        <span>
                      {formatTime(module.content?.estimatedTime || module.estimated_duration || 0)} estimated
                    </span>
                      </div>

                      <div className="flex items-start space-x-2 text-sm">
                        <Info
                            size={16}
                            className="text-text-secondary mt-0.5 shrink-0"
                        />
                        <p className="text-text-secondary">
                          This module includes{" "}
                          {module.content?.lessons?.length || 0} lessons and{" "}
                          {module.content?.quizzes?.length || 0} quizzes.
                        </p>
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
          })}
        </div>

        <ModuleLoader
            isOpen={isModuleLoaderOpen}
            onClose={() => setIsModuleLoaderOpen(false)}
            onModuleLoaded={handleModuleLoaded}
            existingModules={modules}
        />
      </div>
  );
};

export default ModuleBrowsePage;