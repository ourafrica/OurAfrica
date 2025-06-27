// Environment-aware API client that routes to SQLite (local) or PostgreSQL (production)
import type { 
  User, 
  Module, 
  UserProgress, 
  ModuleContent 
} from '../types';

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// API-specific interfaces that match database schema
export interface LessonProgress {
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

export interface Certificate {
  id: number;
  user_id: number;
  module_id: number;
  certificate_code: string;
  certificate_data: Record<string, unknown>;
  verified: boolean;
  issued_at: string;
  created_at: string;
}

export interface ApiModule extends Omit<Module, 'content'> {
  content: ModuleContent;
  difficulty_level: string;
  tags: string[];
  updated_at: string;
}

class ApiClient {
  private baseUrl: string;
  private isLocal: boolean;

  constructor() {
    this.isLocal = this.detectLocalEnvironment();
    this.baseUrl = this.isLocal ? 'http://localhost:3001' : '';
    
    console.log(`🔧 API Client initialized for ${this.isLocal ? 'OFFLINE MODE' : 'ONLINE MODE'}`);
  }

  private detectLocalEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const token = localStorage.getItem(this.isLocal ? 'token_local' : 'token_production');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: this.normalizeError(data),
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          error: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  private normalizeError(errorData: unknown): ApiError {
    // Handle different error formats from Express vs Vercel
    if (typeof errorData === 'string') {
      return { error: errorData };
    }

    if (errorData && typeof errorData === 'object') {
      const errorObj = errorData as Record<string, unknown>;
      
      if (errorObj.error) {
        return {
          error: String(errorObj.error),
          code: errorObj.code ? String(errorObj.code) : undefined,
          details: errorObj.details,
        };
      }

      if (errorObj.message) {
        return {
          error: String(errorObj.message),
          code: errorObj.code ? String(errorObj.code) : undefined,
        };
      }
    }

    return {
      error: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  private setToken(token: string): void {
    const tokenKey = this.isLocal ? 'token_local' : 'token_production';
    localStorage.setItem(tokenKey, token);
  }

  private removeToken(): void {
    const tokenKey = this.isLocal ? 'token_local' : 'token_production';
    localStorage.removeItem(tokenKey);
  }

  // Authentication methods
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.makeRequest<{ user: User; token: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.makeRequest<{ user: User; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/api/auth/me');
  }

  async logout(): Promise<void> {
    this.removeToken();
  }

  // Module methods
  async getModules(): Promise<ApiResponse<Module[]>> {
    return this.makeRequest<Module[]>('/api/modules');
  }

  async getModule(id: number): Promise<ApiResponse<Module>> {
    return this.makeRequest<Module>(`/api/modules/${id}`);
  }

  async createModule(moduleData: Omit<Module, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Module>> {
    return this.makeRequest<Module>('/api/modules', {
      method: 'POST',
      body: JSON.stringify(moduleData),
    });
  }

  async uploadModule(moduleData: ModuleContent): Promise<ApiResponse<{ id: number; message: string; module: Module }>> {
    return this.makeRequest<{ id: number; message: string; module: Module }>('/api/modules/upload', {
      method: 'POST',
      body: JSON.stringify({ moduleData }),
    });
  }

  // Progress methods
  async getUserProgress(userId: number): Promise<ApiResponse<UserProgress[]>> {
    return this.makeRequest<UserProgress[]>(`/api/progress/${userId}`);
  }

  async getUserLessonProgress(userId: number): Promise<ApiResponse<LessonProgress[]>> {
    return this.makeRequest<LessonProgress[]>(`/api/progress/${userId}/lessons`);
  }

  async getUserCertificates(userId: number): Promise<ApiResponse<Certificate[]>> {
    return this.makeRequest<Certificate[]>(`/api/progress/${userId}/certificates`);
  }

  async getModuleProgress(userId: number, moduleId: number): Promise<ApiResponse<{
    moduleProgress: UserProgress | null;
    lessonProgress: LessonProgress[];
  }>> {
    return this.makeRequest(`/api/progress/${userId}/${moduleId}`);
  }

  async getLessonProgress(userId: number, moduleId: number, lessonId: string): Promise<ApiResponse<LessonProgress | null>> {
    return this.makeRequest<LessonProgress | null>(`/api/progress/${userId}/${moduleId}/${lessonId}`);
  }

  async updateLessonProgress(data: {
    userId: number;
    moduleId: number;
    lessonId: string;
    completed: boolean;
    timeSpent: number;
    quizScore?: number;
  }): Promise<ApiResponse<LessonProgress>> {
    return this.makeRequest<LessonProgress>('/api/progress/lesson', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateCertificate(userId: number, moduleId: number): Promise<ApiResponse<{
    certificateCode: string;
    message: string;
  }>> {
    return this.makeRequest('/api/progress/certificate', {
      method: 'POST',
      body: JSON.stringify({ userId, moduleId }),
    });
  }

  async getCertificate(userId: number, moduleId: number): Promise<ApiResponse<Certificate>> {
    return this.makeRequest<Certificate>(`/api/progress/certificate/${userId}/${moduleId}`);
  }

  async verifyCertificate(certificateCode: string): Promise<ApiResponse<{
    valid: boolean;
    certificate?: Certificate;
    message: string;
  }>> {
    return this.makeRequest(`/api/progress/verify/${certificateCode}`);
  }

  async resetProgress(userId: number, moduleId: number): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest('/api/progress/reset', {
      method: 'POST',
      body: JSON.stringify({ userId, moduleId }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    message: string;
    timestamp: string;
    environment?: string;
  }>> {
    return this.makeRequest('/api/health');
  }

  // Utility methods
  isAuthenticated(): boolean {
    const tokenKey = this.isLocal ? 'token_local' : 'token_production';
    return !!localStorage.getItem(tokenKey);
  }

  getEnvironment(): 'local' | 'production' {
    return this.isLocal ? 'local' : 'production';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
