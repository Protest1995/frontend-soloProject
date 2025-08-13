
import React, { useState, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import { Page, SocialLoginProvider } from '../../types';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS, ACCENT_COLOR } from '../../constants';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import LoginIcon from '../icons/LoginIcon';
import SocialLoginButton from '../ui/SocialLoginButton';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import { useAuth } from '../../src/contexts/AuthContext';
import { ApiError } from '../../src/services/api';
import { LoginRequest } from '../../src/types/auth';

const motion: any = motionTyped;

// 保持原有的 props 接口以確保向後兼容
interface LoginPageProps {
  onLogin: (username: string, password_param: string) => boolean; 
  navigateTo: (page: Page) => void; 
  onSocialLogin: (provider: SocialLoginProvider) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, clearError, isAuthenticated, error: authError } = useAuth() as any;
  
  // 表單狀態
  const [isLoginMode] = useState(true);
  const [formData, setFormData] = useState<LoginRequest & { email: string; confirmPassword: string }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  // 註冊模式才需確認密碼；目前頁面以路由分離註冊頁，暫不使用
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 進入頁時清空殘留錯誤；若已登入，直接回首頁
  useEffect(() => {
    clearError();
    setError(null);
    if (isAuthenticated) {
      navigate('/');
    }
    return () => clearError();
  }, [clearError, isAuthenticated, navigate]);

  // 將全域的認證錯誤同步到本地錯誤，確保畫面穩定顯示
  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  /**
   * 處理表單輸入變化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
    
    // 清除錯誤信息（僅清本頁錯誤）
    if (error) {
      clearError();
      setError(null);
    }
  };

  /**
   * 處理表單提交
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (isLoginMode) {
        // 登入模式
        const ok = await login({
          username: formData.username,
          password: formData.password
        });
        if (ok) {
          // 登入成功，直接導向首頁（不依賴外部 onLogin 以避免誤導向）
          navigate('/');
          return;
        }
        // 登入失敗，顯示錯誤（以 Context 錯誤為主）直到使用者修改輸入
        setError(authError || '用戶名或密碼錯誤');
        setIsSubmitting(false);
        return;
        
      } else {
        // 註冊模式
        if (formData.password !== formData.confirmPassword) {
          setError('密碼確認不匹配');
          setIsSubmitting(false);
          return;
        }
        
        const registered = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        
        if (registered) {
          // 註冊成功後自動登入並導向首頁
          navigate('/');
          return;
        }
        setError('註冊失敗');
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error('Login/Register error:', error);
      
      // 設置錯誤訊息
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        const errorMessage = error instanceof Error ? error.message : '操作失敗';
        setError(errorMessage);
      }
      
      // 錯誤維持顯示，直到使用者修改輸入
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 切換登入/註冊模式
   */
  // 切換模式由路由控制，此函式保留以後擴充

  return (
    <div className="max-w-md mx-auto space-y-8 py-12 md:py-16">
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="loginPage.title" subtitleKey="loginPage.subtitle" />
      </motion.div>

      <motion.div
        className="bg-theme-secondary p-8 rounded-lg shadow-xl"
        {...sectionDelayShow(0.2)}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={staggerContainerVariants(0.1)}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="username" className="block text-sm font-medium text-theme-secondary mb-1">
              {t('loginPage.usernameLabel')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
              placeholder={t('loginPage.usernamePlaceholder')}
              autoComplete="username"
            />
          </motion.div>

          {/* 郵箱輸入（僅註冊模式顯示） */}
          {!isLoginMode && (
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">
                {t('loginPage.emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required={!isLoginMode}
                className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                placeholder={t('loginPage.emailPlaceholder')}
                autoComplete="email"
              />
            </motion.div>
          )}

          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="password_id" className="block text-sm font-medium text-theme-secondary mb-1">
              {t('loginPage.passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password_id"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                placeholder={t('loginPage.passwordPlaceholder')}
                autoComplete="current-password"
              />
              <AnimatePresence>
                {(isPasswordFocused || formData.password) && (
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-custom-cyan" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-custom-cyan" />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

           <motion.div variants={fadeInUpItemVariants}>
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={`h-4 w-4 rounded border-theme-secondary text-custom-cyan bg-theme-tertiary focus:ring-custom-cyan focus:ring-offset-theme-secondary ${ACCENT_FOCUS_RING_CLASS}`}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-theme-secondary cursor-pointer">
                        {t('loginPage.rememberMeLabel')}
                    </label>
                </div>
            </motion.div>

          {(error || authError) && (
            <motion.p variants={fadeInUpItemVariants} className="text-red-500 text-sm text-center" role="alert">
              {error ?? authError}
            </motion.p>
          )}

          <motion.div variants={fadeInUpItemVariants}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${ACCENT_BG_COLOR} w-full text-zinc-900 font-semibold py-3 px-6 rounded-md ${ACCENT_BG_HOVER_COLOR} transition-all duration-300 shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <LoginIcon className="w-5 h-5 mr-2" />
              {isSubmitting ? t('loginPage.loggingInButton') : t('loginPage.loginButton')}
            </button>
          </motion.div>
        </motion.form>

        <motion.div 
          className="my-6 flex items-center"
          variants={fadeInUpItemVariants} initial="initial" animate="animate"
        >
          <hr className="flex-grow border-t border-theme-primary" />
          <span className="mx-4 text-xs text-theme-muted uppercase font-semibold">{t('loginPage.orDivider')}</span>
          <hr className="flex-grow border-t border-theme-primary" />
        </motion.div>
        
        <motion.div 
            className="space-y-3"
            variants={staggerContainerVariants(0.1, 0.3)}
            initial="initial"
            animate="animate"
        >
          <motion.div variants={fadeInUpItemVariants}>
            <SocialLoginButton
              provider="google"
              onClick={() => {
                import('../../src/services/authService').then(mod => mod.AuthService.loginWithGoogle());
              }}
              textKey="loginPage.signInWithGoogle"
            />
          </motion.div>
          <motion.div variants={fadeInUpItemVariants}>
            <SocialLoginButton
              provider="facebook"
              onClick={() => {
                alert('目前僅實作 Google OAuth2');
              }}
              textKey="loginPage.signInWithFacebook"
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-6 text-center"
          variants={fadeInUpItemVariants} 
          initial="initial" 
          animate="animate"   
        >
          <Link
            to="/register"
            className={`text-sm ${ACCENT_COLOR} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-secondary focus:ring-custom-cyan rounded`}
          >
            {t('loginPage.dontHaveAccountLink')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
