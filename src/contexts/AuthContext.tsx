import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

interface AuthContextType {
  // 狀態
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // 方法
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化認證狀態
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 若 URL 帶有 OAuth2 回傳的 hash，先行保存 token
        // 解析 OAuth2 回跳的 hash 並保存 token
        try { AuthService.bootstrapFromHash(); } catch {}
        // 優先以後端 /auth/me 取得最新使用者資訊
        const hasToken = AuthService.isAuthenticated();
        if (hasToken) {
          try {
            const me = await AuthService.getMe();
            setUser(me);
            setIsAuthenticated(true);
            AuthService.setCurrentUser(me);
          } catch {
            // 退回使用 localStorage 的使用者資料
            const storedUser = AuthService.getCurrentUser();
            if (storedUser) {
              setUser(storedUser);
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // 初始化失敗，清除認證狀態
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * 用戶登入
   */
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await AuthService.login(
        credentials.username, 
        credentials.password
      );
      
      setUser(response.user);
      setIsAuthenticated(true);
      AuthService.setCurrentUser(response.user);
      return true;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      const rawMessage = error instanceof Error ? error.message : '登入失敗';
      // 將與認證相關的錯誤統一為「用戶名或密碼錯誤」以利前端判斷
      const normalized = /用戶|密碼|認證|憑證|Invalid|credential/i.test(rawMessage)
        ? '用戶名或密碼錯誤'
        : rawMessage;
      setError(normalized);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 用戶註冊
   */
  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await AuthService.register(userData);
      
      setUser(response.user);
      setIsAuthenticated(true);
      AuthService.setCurrentUser(response.user);
      return true;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      const errorMessage = error instanceof Error ? error.message : '註冊失敗';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 用戶登出
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  /**
   * 刷新用戶信息
   */
  const refreshUser = async (): Promise<void> => {
    try {
      // 這裡可以調用後端 API 獲取最新的用戶信息
      // 暫時使用存儲的用戶信息
      const storedUser = AuthService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      await logout();
    }
  };

  /**
   * 清除錯誤信息
   */
  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用認證 Context 的 Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 