import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Module } from "../types";

interface ModulesState {
  modules: Module[];
  currentModule: Module | null;
  isLoading: boolean;
  error: string | null;
  loadModules: (authHeaders?: Record<string, string>) => Promise<void>;
  loadModuleById: (
    id: number,
    authHeaders?: Record<string, string>
  ) => Promise<void>;
  downloadModule: (moduleId: number) => Promise<void>;
  addModule: (module: Module) => void;
  removeModule: (moduleId: number) => void;
  saveModule: (
    module: Module,
    authHeaders?: Record<string, string>
  ) => Promise<Module>;
}

export const useModules = create<ModulesState>()(
  persist(
    (set) => ({
      modules: [],
      currentModule: null,
      isLoading: false,
      error: null,

      loadModules: async (authHeaders = {}) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/modules", {
            headers: authHeaders,
          });
          if (!response.ok) {
            throw new Error("Failed to fetch modules");
          }
          const modules = await response.json();
          set({ modules, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load modules",
            isLoading: false,
          });
        }
      },

      loadModuleById: async (id: number, authHeaders = {}) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/modules/${id}`, {
            headers: authHeaders,
          });
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Module not found");
            }
            throw new Error("Failed to fetch module");
          }
          const module = await response.json();
          set({ currentModule: module, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load module",
            isLoading: false,
          });
        }
      },

      downloadModule: async (moduleId: number) => {
        // This function will be updated later to download from a remote source
        // and save to the database.
        console.log(`Downloading module ${moduleId}`);
      },

      saveModule: async (module: Module, authHeaders = {}) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/modules", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify(module),
          });

          if (!response.ok) {
            throw new Error("Failed to save module");
          }

          const savedModule = await response.json();

          set((state) => {
            const existingIndex = state.modules.findIndex(
              (m) => m.id === savedModule.id
            );
            if (existingIndex >= 0) {
              const updatedModules = [...state.modules];
              updatedModules[existingIndex] = savedModule;
              return { modules: updatedModules, isLoading: false };
            } else {
              return {
                modules: [...state.modules, savedModule],
                isLoading: false,
              };
            }
          });

          return savedModule;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to save module",
            isLoading: false,
          });
          throw error;
        }
      },

      addModule: (module: Module) => {
        set((state) => {
          // Check if module already exists (by ID)
          const existingIndex = state.modules.findIndex(
            (m) => m.id === module.id
          );

          if (existingIndex >= 0) {
            // Replace existing module
            const updatedModules = [...state.modules];
            updatedModules[existingIndex] = module;
            return { modules: updatedModules };
          } else {
            // Add new module
            return { modules: [...state.modules, module] };
          }
        });
      },

      removeModule: (moduleId: number) => {
        set((state) => ({
          modules: state.modules.filter((m) => m.id !== moduleId),
          // Clear current module if it's the one being removed
          currentModule:
            state.currentModule?.id === moduleId ? null : state.currentModule,
        }));
      },
    }),
    {
      name: "modules-storage",
    }
  )
);
