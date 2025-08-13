
import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import { Page } from '../../types';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS, ACCENT_COLOR } from '../../constants';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import UserPlusIcon from '../icons/UserPlusIcon';
import { useAuth } from '../../src/contexts/AuthContext';
import { ApiError } from '../../src/services/api';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';

const motion: any = motionTyped;

interface RegisterPageProps {
  navigateTo: (page: Page) => void; 
}

const RegisterPage: React.FC<RegisterPageProps> = ({ navigateTo }) => {
  const { t } = useTranslation();
  const { register, error: authError, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => { // 進入頁面時清空殘留錯誤
    setError(null);
    setUsernameError(null);
    setEmailError(null);
    setSuccessMessage(null);
    return () => {
      clearError();
    };
  }, [clearError]);

  // 將全域的 authError 轉成欄位級錯誤或一般錯誤
  useEffect(() => {
    if (!authError) return;
    const msg = authError;
    // 與後端比對後的訊息透過 Context 帶入，這裡做局部更新
    if (/用戶名.*已存在|Username already exists/i.test(msg)) {
      setUsernameError(msg);
      setEmailError(null);
      setError(null);
      return;
    }
    if (/郵箱.*已被使用|郵箱已存在|Email already exists/i.test(msg)) {
      setEmailError(msg);
      setUsernameError(null);
      setError(null);
      return;
    }
    setError(msg);
  }, [authError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setUsernameError(null);
    setEmailError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    // 驗證使用者名稱長度
    if (username.length < 3) {
      setUsernameError('使用者名稱至少需要3個字元');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('registerPage.passwordsDoNotMatchError'));
      setIsSubmitting(false);
      return;
    }

    try {
      const ok = await register({
        username,
        email,
        password,
        confirmPassword,
      });
      if (ok) {
        setSuccessMessage(t('registerPage.registrationSuccessMessage'));
        // 成功後直接刷新進首頁，避免側邊欄先更新
        window.location.href = '/';
      } else if (authError) {
        // 顯示 Context 內的錯誤或通用錯誤
        setError(authError);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const m = err.message || '';
        if (/用戶名.*已存在|Username already exists/i.test(m)) {
          setUsernameError(m);
        } else if (/郵箱.*已被使用|郵箱已存在|Email already exists/i.test(m)) {
          setEmailError(m);
        } else {
          setError(m);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('註冊失敗');
      }
      // 不清除表單數據，讓用戶可以看到錯誤並修正
      setIsSubmitting(false);
      return; // 直接返回，不執行後面的 finally 塊
    }
    
    // 只有在沒有錯誤時才執行這裡
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 py-12 md:py-16">
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="registerPage.title" subtitleKey="registerPage.subtitle" />
      </motion.div>

      <motion.div
        className="bg-theme-secondary p-8 rounded-lg shadow-xl"
        {...sectionDelayShow(0.2)}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={staggerContainerVariants(0.07)} 
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="reg-username" className="block text-sm font-medium text-theme-secondary mb-1">
              {t('registerPage.usernameLabel')}
            </label>
            <input
              type="text"
              id="reg-username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError(null);
              }}
              required
              minLength={3}
              className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
              placeholder={t('registerPage.usernamePlaceholder')}
              autoComplete="username"
            />
            {usernameError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1 flex items-center"
                role="alert"
              >
                <span className="mr-1">⚠️</span>
                {usernameError}
              </motion.p>
            )}
          </motion.div>

          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="reg-email" className="block text-sm font-medium text-theme-secondary mb-1">
              {t('registerPage.emailLabel')}
            </label>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              required
              className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
              placeholder={t('registerPage.emailPlaceholder')}
              autoComplete="email"
            />
            {emailError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-1 flex items-center"
                role="alert"
              >
                <span className="mr-1">⚠️</span>
                {emailError}
              </motion.p>
            )}
          </motion.div>

          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="reg-password" className="block text-sm font-medium text-theme-secondary mb-1">
              {t('registerPage.passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="reg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                minLength={6}
                className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                placeholder={t('registerPage.passwordPlaceholder')}
                autoComplete="new-password"
              />
              <AnimatePresence>
                {(isPasswordFocused || password) && (
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
            <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-theme-secondary mb-1">
              {t('registerPage.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="reg-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={() => setIsConfirmPasswordFocused(false)}
                required
                minLength={6}
                className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                placeholder={t('registerPage.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
              <AnimatePresence>
                {(isConfirmPasswordFocused || confirmPassword) && (
                  <motion.button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-custom-cyan" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-custom-cyan" />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {(!usernameError && !emailError && (error || authError)) && (
            <motion.p 
              variants={fadeInUpItemVariants} 
              className="text-red-400 text-sm text-center flex items-center justify-center" 
              role="alert"
            >
              <span className="mr-1">⚠️</span>
              {error ?? authError}
            </motion.p>
          )}

          {successMessage && (
            <motion.p variants={fadeInUpItemVariants} className="text-green-400 text-sm text-center" role="alert">
              {successMessage}
            </motion.p>
          )}

          <motion.div variants={fadeInUpItemVariants}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${ACCENT_BG_COLOR} w-full text-zinc-900 font-semibold py-3 px-6 rounded-md ${ACCENT_BG_HOVER_COLOR} transition-all duration-300 shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <UserPlusIcon className="w-5 h-5 mr-2" />
              {isSubmitting ? t('registerPage.registeringButton') : t('registerPage.registerButton')}
            </button>
          </motion.div>
        </motion.form>

        <motion.div 
            className="mt-6 text-center"
            variants={fadeInUpItemVariants}
            initial="initial"
            animate="animate"
        >
          <Link
            to="/login"
            className={`text-sm ${ACCENT_COLOR} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-secondary focus:ring-custom-cyan rounded`}
          >
            {t('registerPage.alreadyHaveAccountLink')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
