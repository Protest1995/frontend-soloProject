export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  gender?: 'male' | 'female' | 'other' | 'not_specified';
  birthday?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other' | 'not_specified';
  birthday?: string;
  address?: string;
  phone?: string;
  password?: string; // 可選的新密碼
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_USER = 'SUPER_USER'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
} 