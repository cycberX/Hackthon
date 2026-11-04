/**
 * Centralized API Client for OneAPI Backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  _oneapi?: {
    category: string;
    primaryProvider: string;
    finalProvider: string;
    fallbackTriggered: boolean;
    fallbackReason?: string;
    latencyMs: number;
  };
}

// Token & Session Storage Helpers (Client-side)
// Required tokens only: Auth Token (JWT Access), Refresh Token (JWT Refresh), OneAPI Developer Key (sk_live_...)
export const authStorage = {
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_access_token') : null),
  setToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_access_token', token);
  },
  getRefreshToken: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_refresh_token') : null),
  setRefreshToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_refresh_token', token);
  },
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('oneapi_user');
    return u ? JSON.parse(u) : null;
  },
  setUser: (user: any) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_user', JSON.stringify(user));
  },
  getApiKey: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_developer_key') : null),
  setApiKey: (key: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_developer_key', key);
  },
  getProjectId: () => (typeof window !== 'undefined' ? localStorage.getItem('oneapi_project_id') : null),
  setProjectId: (id: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('oneapi_project_id', id);
  },
  getActiveProject: () => {
    if (typeof window === 'undefined') return null;
    const p = localStorage.getItem('oneapi_active_project');
    return p ? JSON.parse(p) : null;
  },
  setActiveProject: (p: any) => {
    if (typeof window !== 'undefined') {
      if (p) {
        localStorage.setItem('oneapi_active_project', JSON.stringify(p));
        if (p._id || p.id) {
          localStorage.setItem('oneapi_project_id', p._id || p.id);
        }
      } else {
        localStorage.removeItem('oneapi_active_project');
        localStorage.removeItem('oneapi_project_id');
      }
    }
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oneapi_access_token');
      localStorage.removeItem('oneapi_refresh_token');
      localStorage.removeItem('oneapi_user');
      localStorage.removeItem('oneapi_developer_key');
      localStorage.removeItem('oneapi_project_token');
      localStorage.removeItem('oneapi_project_id');
      localStorage.removeItem('oneapi_active_project');
    }
  },
};

// Generic fetch wrapper with single unified Authorization header and project scoping
export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  const token = authStorage.getToken();
  const apiKey = authStorage.getApiKey();
  const projectId = authStorage.getProjectId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(options.headers as Record<string, string>),
  };

  // Attach project scope identifier if available and not explicitly provided
  if (projectId && !headers['x-project-id']) {
    headers['x-project-id'] = projectId;
  }

  // Single unified authentication header: Bearer token or OneAPI developer key
  if (!headers['Authorization']) {
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers,
    });

    if (res.status === 204) {
      return { success: true } as ApiResponse<T>;
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      return { success: res.ok } as ApiResponse<T>;
    }

    const data: ApiResponse<T> = JSON.parse(text);
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to communicate with backend server. Make sure it is running on http://localhost:5000.',
      },
    };
  }
}
