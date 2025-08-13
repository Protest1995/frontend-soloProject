import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Page, NavItem, CategoryInfo } from '../types';
import { NAVIGATION_ITEMS, AUTH_NAVIGATION_ITEMS, ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../constants';
import LinkedInIcon from './icons/LinkedInIcon';
import GithubIcon from './icons/GithubIcon';
import InstagramIcon from './icons/InstagramIcon';
import LanguageSwitcher from './ui/LanguageSwitcher';
import LoginIcon from './icons/LoginIcon';
import LogoutIcon from './icons/LogoutIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { blogCategoryDefinitions } from './data/blogData';
import SuperUserIcon from './icons/SuperUserIcon';
import PhotoIcon from './icons/PhotoIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CloseIcon from './icons/CloseIcon';
import { useAuth } from '../src/contexts/AuthContext';

const motion: any = motionTyped;

type Theme = 'light' | 'dark';

interface SidebarProps {
  navigateTo: (page: Page, data?: any) => void;
  isOpen: boolean;
  closeSidebar: () => void;
  isAuthenticated: boolean;
  handleLogout: () => void;
  avatarUrl: string;
  username: string;
  currentTheme: Theme;
  toggleTheme: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isSuperUser: boolean;
  isLandscape: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigateTo,
  isOpen,
  closeSidebar,
  isAuthenticated,
  handleLogout,
  avatarUrl,
  username,
  currentTheme,
  toggleTheme,
  isCollapsed,
  toggleCollapse,
  isSuperUser,
  isLandscape,
}) => {
  const { t, i18n } = useTranslation();
  const { logout: authLogout } = useAuth();
  const location = useLocation();
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [isBlogSubMenuOpen, setIsBlogSubMenuOpen] = useState(false);
  const [isSuperUserMenuOpen, setIsSuperUserMenuOpen] = useState(false);

  useEffect(() => {
    setImageStatus('loading');
  }, [avatarUrl]);

  const isDesktopCollapsed = isCollapsed && !isOpen;

  const isBlogSectionActive = location.pathname.startsWith('/blog');
  const isSuperUserSectionActive = location.pathname.startsWith('/manage');

  useEffect(() => {
    if (isBlogSectionActive) setIsBlogSubMenuOpen(true);
    if (isSuperUserSectionActive) setIsSuperUserMenuOpen(true);
  }, [location.pathname]);

  const handleImageLoad = () => setImageStatus('loaded');
  const handleImageError = () => setImageStatus('failed');
  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'zh-Hant' : 'en');
  
  const allNavItems = isAuthenticated ? [...NAVIGATION_ITEMS, ...AUTH_NAVIGATION_ITEMS] : NAVIGATION_ITEMS;

  const sidebarBaseClasses = "fixed inset-y-0 left-0 flex flex-col transform transition-all duration-300 ease-in-out z-40";
  const mobileOpenClasses = isLandscape ? "translate-x-0 w-full bg-theme-secondary" : "translate-x-0 w-full bg-theme-secondary px-8 pb-8 pt-20";
  const mobileClosedClasses = "-translate-x-full w-full bg-theme-secondary";
  const desktopBaseClasses = "lg:translate-x-0 lg:bg-theme-secondary";
  const desktopExpandedClasses = "lg:w-80 lg:p-8";
  const desktopCollapsedClasses = "lg:w-20 lg:p-3 lg:items-center";
  const collapseButtonBaseClasses = `flex items-center justify-center rounded-full transition-all duration-300 ease-in-out text-custom-cyan hover:bg-theme-hover focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`;
  
  const ProfileHeaderContent = () => {
    const destinationPath = isAuthenticated ? '/account' : '/login';
    const ariaLabel = isAuthenticated ? t('sidebar.account') : t('sidebar.login');

    return (
      <Link to={destinationPath} className="flex items-center cursor-pointer group" onClick={closeSidebar} aria-label={ariaLabel}>
        <div className="profile-image-wrapper w-12 h-12">
          <div className="profile-image-inner flex items-center justify-center">
            {imageStatus === 'failed' ? (
              <span className="text-2xl font-bold text-theme-primary select-none">{username.substring(0, 1).toUpperCase()}</span>
            ) : (
              <img src={avatarUrl} alt={username} className={`w-full h-full object-cover rounded-full transition-opacity duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`} onLoad={handleImageLoad} onError={handleImageError} />
            )}
          </div>
        </div>
        <div className="ml-3 flex items-center space-x-1.5">
          <h1 className="text-lg font-semibold text-theme-primary group-hover:text-custom-cyan transition-colors duration-200">{username}</h1>
        </div>
      </Link>
    );
  };

  return (
    <aside className={`${sidebarBaseClasses} ${isOpen ? mobileOpenClasses : mobileClosedClasses} ${desktopBaseClasses} ${isDesktopCollapsed ? desktopCollapsedClasses : desktopExpandedClasses}`}>
      <div className={`w-full shrink-0 ${isDesktopCollapsed ? 'h-20 flex items-center justify-center' : 'mb-8'}`}>
        <div className={`w-full items-center justify-between ${isDesktopCollapsed ? 'hidden' : 'flex'}`}>
          <ProfileHeaderContent />
          <button onClick={toggleCollapse} className={`${collapseButtonBaseClasses} w-9 h-9 hidden lg:inline-flex`} aria-label={t('sidebar.collapseSidebar')}> <ChevronDoubleLeftIcon className="w-5 h-5" /> </button>
        </div>
        <div className={`w-full justify-center ${isDesktopCollapsed ? 'flex' : 'hidden'}`}>
          <button onClick={toggleCollapse} className={`${collapseButtonBaseClasses} w-12 h-12`} aria-label={t('sidebar.expandSidebar')}> <motion.div animate={{ rotate: 180 }} transition={{ duration: 0.3 }}> <ChevronDoubleLeftIcon className="w-5 h-5" /> </motion.div> </button>
        </div>
      </div>
      <nav className="flex-grow w-full overflow-y-auto min-h-0">
        <ul>
          {allNavItems.map((item) => {
            if (item.page === Page.Blog && !isDesktopCollapsed) {
              return (
                <li key="blog-expandable" className="mb-1">
                  <button onClick={() => setIsBlogSubMenuOpen(p => !p)} className={`flex items-center rounded-full transition-all duration-200 ease-in-out relative w-full py-3 px-4 justify-between bg-transparent ${isBlogSectionActive ? `text-custom-cyan font-semibold` : `text-theme-secondary hover:text-custom-cyan`}`} aria-expanded={isBlogSubMenuOpen}>
                    <div className="flex items-center"> <item.icon className={`w-5 h-5 transition-colors duration-200 ease-in-out mr-3`} /> <span>{t(item.label)}</span> </div>
                    <motion.div animate={{ rotate: isBlogSubMenuOpen ? 180 : 0 }}> <ChevronDownIcon className="w-4 h-4" /> </motion.div>
                  </button>
                  <AnimatePresence> {isBlogSubMenuOpen && (<motion.ul className="pl-8 pr-2 pt-1 space-y-1 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                      <li> <Link to="/blog" onClick={closeSidebar} className={`block w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors ${location.pathname === '/blog' ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> {t('blogPage.viewAll')} </Link> </li>
                      {blogCategoryDefinitions.map(cat => (<li key={cat.titleKey}> <Link to={`/blog/category/${cat.titleKey.split('.').pop()}`} onClick={closeSidebar} className={`block w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors ${location.pathname.includes(`/blog/category/${cat.titleKey.split('.').pop()}`) ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> {t(cat.titleKey)} </Link> </li>))}
                  </motion.ul> )} </AnimatePresence>
                </li>
              );
            }
            const isActive = item.page === Page.Blog ? isBlogSectionActive : location.pathname === item.path;
            return ( <li key={item.path} className="mb-1"> <Link to={item.path} onClick={closeSidebar} className={`flex items-center rounded-full transition-all duration-200 ease-in-out relative ${isDesktopCollapsed ? 'w-12 h-12 justify-center mx-auto' : 'w-full py-3 px-4'} bg-transparent ${isActive ? `text-custom-cyan font-semibold` : `text-theme-secondary hover:text-custom-cyan`}`} aria-current={isActive ? 'page' : undefined} title={isDesktopCollapsed ? t(item.label) : undefined}> <item.icon className={`w-5 h-5 transition-colors duration-200 ease-in-out ${isDesktopCollapsed ? '' : 'mr-3'}`} /> <span className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>{t(item.label)}</span> </Link> </li> );
          })}
        </ul>
        {isSuperUser && (
          <div className="mt-4 pt-4 border-t border-theme-primary">
            {isDesktopCollapsed ? (
              <div className="space-y-1">
                  <Link to="/manage/photos" title={t('sidebar.photoManagement')} className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-colors bg-transparent hover:text-custom-cyan ${location.pathname === '/manage/photos' ? 'text-custom-cyan' : 'text-theme-secondary'}`}> <PhotoIcon className="w-5 h-5"/> </Link>
                  <Link to="/manage/posts" title={t('sidebar.postManagement')} className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-colors bg-transparent hover:text-custom-cyan ${location.pathname === '/manage/posts' ? 'text-custom-cyan' : 'text-theme-secondary'}`}> <DocumentTextIcon className="w-5 h-5"/> </Link>
              </div>
            ) : (
              <div>
                <button onClick={() => setIsSuperUserMenuOpen(p => !p)} className={`flex items-center justify-between w-full py-3 px-4 rounded-full transition-all duration-200 ease-in-out bg-transparent ${isSuperUserSectionActive ? `text-custom-cyan font-semibold` : 'text-theme-secondary hover:text-custom-cyan'}`} aria-expanded={isSuperUserMenuOpen}>
                  <div className="flex items-center"> <SuperUserIcon className="w-5 h-5 mr-3" /> <span className="font-semibold">{t('sidebar.SuperUserTools')}</span> </div>
                  <motion.div animate={{ rotate: isSuperUserMenuOpen ? 180 : 0 }}> <ChevronDownIcon className="w-4 h-4" /> </motion.div>
                </button>
                <AnimatePresence> {isSuperUserMenuOpen && (<motion.ul className="pl-8 pr-2 pt-1 space-y-1 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <li> <Link to="/manage/photos" onClick={closeSidebar} className={`w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors flex items-center ${location.pathname === '/manage/photos' ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> <PhotoIcon className="w-4 h-4 mr-2" />{t('sidebar.photoManagement')} </Link> </li>
                  <li> <Link to="/manage/posts" onClick={closeSidebar} className={`w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors flex items-center ${location.pathname === '/manage/posts' ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> <DocumentTextIcon className="w-4 h-4 mr-2" />{t('sidebar.postManagement')} </Link> </li>
                </motion.ul>)} </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className={`w-full mt-auto pt-4 flex flex-col items-center space-y-4 ${isDesktopCollapsed ? 'lg:px-0' : ''} ${isSuperUser ? '' : 'border-t border-theme-primary'}`}>
        {isAuthenticated ? (
          <button
            onClick={async () => {
              try {
                await authLogout();
              } finally {
                handleLogout();
                closeSidebar();
              }
            }}
            className={`flex items-center justify-center rounded-full transition-all duration-200 ease-in-out text-sm button-theme-danger font-semibold shadow-md focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} ${isDesktopCollapsed ? 'w-12 h-12' : 'w-full py-2.5 px-4'}`}
            aria-label={t('sidebar.logout') || 'Logout'}
            title={isDesktopCollapsed ? (t('sidebar.logout') || 'Logout') : undefined}
          >
            <LogoutIcon className={`w-5 h-5 ${isDesktopCollapsed ? '' : 'mr-2'}`} />
            <span className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>{t('sidebar.logout') || 'Logout'}</span>
          </button>
        ) : (
          <button
            onClick={() => { navigateTo(Page.Login); closeSidebar(); }}
            className={`flex items-center justify-center rounded-full transition-all duration-200 ease-in-out text-sm button-theme-accent font-semibold shadow-md focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} ${isDesktopCollapsed ? 'w-12 h-12' : 'w-full py-2.5 px-4'}`}
            aria-label={t('sidebar.login') || 'Login'}
            title={isDesktopCollapsed ? (t('sidebar.login') || 'Login') : undefined}
          >
            <LoginIcon className={`w-5 h-5 ${isDesktopCollapsed ? '' : 'mr-2'}`} />
            <span className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>{t('sidebar.login') || 'Login'}</span>
          </button>
        )}
        <div className={`flex w-full ${isDesktopCollapsed ? 'lg:flex-col lg:items-center lg:space-y-2 lg:space-x-0' : 'justify-center space-x-2'}`}>
          {!isDesktopCollapsed && <LanguageSwitcher isCollapsed={isDesktopCollapsed} />}
          {isDesktopCollapsed && ( <button onClick={toggleLanguage} className={`w-12 h-12 flex items-center justify-center text-sm button-theme-neutral rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`} aria-label={i18n.language === 'en' ? t('switchToChinese') : t('switchToEnglish')} title={i18n.language === 'en' ? t('switchToChinese') : t('switchToEnglish')}> <span>{i18n.language === 'en' ? '中' : 'E'}</span> </button> )}
          <button onClick={toggleTheme} className={`flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} button-theme-toggle ${isDesktopCollapsed ? 'w-12 h-12' : 'flex-1 px-3 py-1.5 text-sm'}`} aria-label={currentTheme === 'light' ? t('sidebar.switchToDarkMode') : t('sidebar.switchToLightMode')} title={isDesktopCollapsed ? (currentTheme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')) : undefined}> {currentTheme === 'light' ? <MoonIcon className={`w-4 h-4 ${isDesktopCollapsed ? '' : 'mr-1.5'}`} /> : <SunIcon className={`w-4 h-4 ${isDesktopCollapsed ? '' : 'mr-1.5'}`} />} <span className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>{currentTheme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}</span> </button>
        </div>
      </div>
      <div className={`text-center pb-4 mt-6 ${isDesktopCollapsed ? 'lg:hidden' : ''}`}>
        <div className="flex justify-center space-x-4 mb-4"> <a href="#" aria-label={t('sidebar.profileName') + " LinkedIn"} className="text-theme-primary transition-colors hover:text-custom-cyan"> <LinkedInIcon className="w-5 h-5" /> </a> <a href="#" aria-label={t('sidebar.profileName') + " GitHub"} className="text-theme-primary transition-colors hover:text-custom-cyan"> <GithubIcon className="w-5 h-5" /> </a> <a href="#" aria-label={t('sidebar.instagramAriaLabel')} className="text-theme-primary transition-colors hover:text-custom-cyan"> <InstagramIcon className="w-5 h-5" /> </a> </div>
        <p className="text-xs text-theme-muted">{t('sidebar.copyright')}</p>
      </div>
    </aside>
  );
};

export default Sidebar;