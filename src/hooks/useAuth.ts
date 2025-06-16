import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "../types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Login failed");
          }

          const data = await response.json();

          const authUser: AuthUser = {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            created_at: data.user.created_at,
            token: data.token,
          };

          set({ user: authUser, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An error occurred during login",
            isLoading: false,
          });
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Registration failed");
          }

          const data = await response.json();

          const authUser: AuthUser = {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            created_at: data.user.created_at,
            token: data.token,
          };

          set({ user: authUser, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An error occurred during registration",
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      clearError: () => {
        set({ error: null });
      },

      getAuthHeaders: () => {
        const user = get().user;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`;
        }

        return headers;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
