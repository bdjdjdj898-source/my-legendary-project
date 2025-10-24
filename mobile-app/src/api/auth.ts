import { apiFetch } from './client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string | null;
    role: 'admin' | 'user';
    isVerified: boolean;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiFetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiFetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshResponse> {
  const response = await apiFetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  return response.data;
}

/**
 * Logout (invalidate refresh token)
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiFetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const response = await apiFetch(`${API_URL}/api/auth/me`);
  return response.data.user;
}
