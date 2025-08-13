import { ApiService } from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User, UpdateUserRequest } from '../types/auth';

export class AuthService {
  /**
   * 用戶登入
   * @param username 用戶名
   * @param password 密碼
   * @returns Promise<AuthResponse> 登入響應
   */
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await ApiService.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      // 登入成功後自動保存 token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('authProvider', 'local');
      }
      
      return response;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  /**
   * 觸發後端 Google OAuth2 流程（後端導向）
   */
  static loginWithGoogle(): void {
    const base = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api';
    try { localStorage.setItem('authProvider', 'google'); } catch {}
    window.location.href = `${base}/auth/oauth2/authorize/google`;
  }

  /**
   * 從 URL hash 解析 token 並保存
   */
  static bootstrapFromHash(): boolean {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return false;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    if (token) localStorage.setItem('authToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (token) {
      // 清掉網址 hash，避免殘留
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }
    return false;
  }

  /**
   * 從後端取得目前登入使用者
   */
  static async getMe(): Promise<User> {
    const resp = await ApiService.request<{ success: boolean; message?: string; user: User }>(
      '/auth/me',
      { method: 'GET' }
    );
    return resp.user;
  }

  /**
   * 更新目前登入使用者資料
   */
  static async updateMe(payload: UpdateUserRequest): Promise<User> {
    const resp = await ApiService.request<{ success: boolean; user: User }>(
      '/auth/me',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    if (resp?.user) this.setCurrentUser(resp.user);
    return resp.user;
  }

  /**
   * 用戶註冊
   * @param userData 註冊數據
   * @returns Promise<AuthResponse> 註冊響應
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // 註冊成功後自動保存 token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('authProvider', 'local');
      }
      
      return response;
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  }

  /**
   * 刷新訪問令牌
   * @returns Promise<AuthResponse> 新的令牌響應
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('沒有刷新令牌');
      }
      
      const response = await ApiService.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      
      // 更新存儲的令牌
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('Refresh Token Error:', error);
      // 刷新失敗，清除所有認證信息
      this.logout();
      throw error;
    }
  }

  /**
   * 用戶登出
   */
  static async logout(): Promise<void> {
    try {
      // 調用後端登出接口，附帶 Refresh-Token 讓後端清理刷新令牌
      const refreshToken = localStorage.getItem('refreshToken') || '';
      await ApiService.request('/auth/logout', {
        method: 'POST',
        headers: { 'Refresh-Token': refreshToken },
      });
    } catch (error) {
      console.error('Logout Error:', error);
    } finally {
      // 無論後端是否成功，都清除本地存儲
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('authProvider');
    }
  }

  /**
   * 檢查用戶是否已登入
   * @returns boolean 是否已登入
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  /**
   * 獲取當前用戶信息
   * @returns User | null 用戶信息或 null
   */
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('userProfile');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * 設置當前用戶信息
   * @param user 用戶信息
   */
  static setCurrentUser(user: User): void {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }
} 