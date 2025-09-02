import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Module } from "../types";
import { apiClient } from "../lib/apiClient";

interface ModulesState {
  modules: Module[];
  currentModule: Module | null;
  isLoading: boolean;
  error: string | null;
  loadModules: () => Promise<void>;
  loadModuleById: (id: number) => Promise<void>;
  downloadModule: (moduleId: number) => Promise<void>;
  addModule: (module: Module) => void;
  removeModule: (moduleId: number) => void;
  saveModule: (module: Module) => Promise<Module>;
  clearError: () => void;
}

export const useModules = create<ModulesState>()(
    persist<ModulesState>(
        (set, get) => ({
          modules: [] as Module[],
          currentModule: null,
          isLoading: false,
          error: null,

          clearError: () => set({ error: null }),

          loadModules: async () => {
            console.log('🚀 Starting loadModules...');
            set({ isLoading: true, error: null });

            try {
              const result = await apiClient.getModules();

              if (!result.success) {
                throw new Error(result.error?.error || "Failed to fetch modules");
              }

              // Handle double-wrapped response
              // Backend returns: {success: true, data: Array}
              // API client wraps it as: {success: true, data: {success: true, data: Array}}
              let modulesData = result.data;
              console.log('📊 Initial data from API:', modulesData);

              // Check if the data is double-wrapped
              if (modulesData && typeof modulesData === 'object' && 'success' in modulesData && 'data' in modulesData) {
                console.log('🔄 Detected double-wrapped response, extracting inner data...');
                modulesData = (modulesData as any).data;
              }

              console.log('📊 Final modules data:', modulesData);

              if (!Array.isArray(modulesData)) {
                console.error('❌ API returned non-array data after unwrapping:', modulesData);
                throw new Error('Invalid data format received from server');
              }

              console.log('✅ Setting modules in store:', modulesData.length, 'modules');
              set({ modules: modulesData, isLoading: false });

              const currentState = get();
              console.log('🔍 State after setting - module count:', currentState.modules.length);

            } catch (error) {
              console.error("❌ Error loading modules:", error);
              set({
                error: error instanceof Error ? error.message : "Failed to load modules",
                modules: [],
                isLoading: false,
              });
            }
          },

          loadModuleById: async (id: number) => {
            set({ isLoading: true, error: null });

            try {
              const result = await apiClient.getModule(id);

              if (!result.success) {
                if (result.error?.error === "Module not found") {
                  throw new Error("Module not found");
                }
                throw new Error(result.error?.error || "Failed to fetch module");
              }

              // Handle potential double-wrapping for single module too
              let moduleData = result.data;
              if (moduleData && typeof moduleData === 'object' && 'success' in moduleData && 'data' in moduleData) {
                moduleData = (moduleData as any).data;
              }

              set({ currentModule: moduleData || null, isLoading: false });
            } catch (error) {
              console.error("Error loading module:", error);
              set({
                error: error instanceof Error ? error.message : "Failed to load module",
                isLoading: false,
              });
            }
          },

          downloadModule: async (moduleId: number) => {
            console.log(`Downloading module ${moduleId}`);
          },

          saveModule: async (module: Module) => {
            set({ isLoading: true, error: null });

            try {
              const result = await apiClient.createModule(module);

              if (!result.success) {
                throw new Error(result.error?.error || "Failed to save module");
              }

              // Handle potential double-wrapping for saved module
              let savedModule = result.data!;
              if (savedModule && typeof savedModule === 'object' && 'success' in savedModule && 'data' in savedModule) {
                savedModule = (savedModule as any).data;
              }

              set((state) => {
                const currentModules = Array.isArray(state.modules) ? state.modules : [];

                const existingIndex = currentModules.findIndex(
                    (m) => m.id === savedModule.id
                );

                let updatedModules: Module[];
                if (existingIndex >= 0) {
                  updatedModules = [...currentModules];
                  updatedModules[existingIndex] = savedModule;
                } else {
                  updatedModules = [savedModule, ...currentModules];
                }

                console.log('✅ Updating store with saved module:', updatedModules.length, 'total modules');
                return { modules: updatedModules, isLoading: false };
              });

              return savedModule;
            } catch (error) {
              console.error("Error saving module:", error);
              set({
                error: error instanceof Error ? error.message : "Failed to save module",
                isLoading: false,
              });
              throw error;
            }
          },

          addModule: (module: Module) => {
            set((state) => {
              const currentModules = Array.isArray(state.modules) ? state.modules : [];

              const existingIndex = currentModules.findIndex(
                  (m) => m.id === module.id
              );

              if (existingIndex >= 0) {
                const updatedModules = [...currentModules];
                updatedModules[existingIndex] = module;
                return { modules: updatedModules };
              } else {
                return { modules: [module, ...currentModules] };
              }
            });
          },

          removeModule: (moduleId: number) => {
            set((state) => {
              const currentModules = Array.isArray(state.modules) ? state.modules : [];

              return {
                modules: currentModules.filter((m) => m.id !== moduleId),
                currentModule:
                    state.currentModule?.id === moduleId ? null : state.currentModule,
              };
            });
          },
        }),
        {
          name: "modules-storage",
          migrate: (persistedState: unknown) => {
            console.log('🔄 Migrating zustand state:', persistedState);

            if (
                persistedState &&
                typeof persistedState === 'object' &&
                'modules' in persistedState
            ) {
              const state = persistedState as Record<string, unknown>;

              if (!Array.isArray(state.modules)) {
                console.warn('⚠️ Fixing corrupted modules field:', state.modules);
                state.modules = [];
              }

              const migratedState: ModulesState = {
                modules: Array.isArray(state.modules) ? state.modules : [],
                currentModule: (state.currentModule as Module) || null,
                isLoading: false,
                error: null,
                clearError: () => {},
                loadModules: async () => {},
                loadModuleById: async () => {},
                downloadModule: async () => {},
                addModule: () => {},
                removeModule: () => {},
                saveModule: async (module: Module) => module,
              };

              console.log('✅ Migrated state:', migratedState);
              return migratedState;
            }

            console.log('🆕 Using default state');
            return {
              modules: [] as Module[],
              currentModule: null,
              isLoading: false,
              error: null,
              clearError: () => {},
              loadModules: async () => {},
              loadModuleById: async () => {},
              downloadModule: async () => {},
              addModule: () => {},
              removeModule: () => {},
              saveModule: async (module: Module) => module,
            } as ModulesState;
          },
          version: 1,
        }
    )
);

// Safe selectors that guarantee array returns
export const useModulesArray = () => {
  const modules = useModules(state => state.modules);
  return Array.isArray(modules) ? modules : [];
};

export const useModulesStore = () => {
  const store = useModules();
  return {
    ...store,
    modules: Array.isArray(store.modules) ? store.modules : []
  };
};

// Type-safe selector for getting a specific module
export const useModuleById = (id: number) => {
  return useModules(state => {
    const modules = Array.isArray(state.modules) ? state.modules : [];
    return modules.find(module => module.id === id) || null;
  });
};

// Selector for module count
export const useModuleCount = () => {
  return useModules(state => {
    const modules = Array.isArray(state.modules) ? state.modules : [];
    return modules.length;
  });
};