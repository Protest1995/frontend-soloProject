// 引入 React 相關鉤子和組件
import React, { useMemo } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';
// 引入類型定義和數據
import { BlogPostData, Page, CategoryInfo } from '../../types';
import { blogCategoryDefinitions } from '../data/blogData';
// 引入動畫變體
import { staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import SearchIcon from '../icons/SearchIcon';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';

// 側邊欄區塊標題組件
const SidebarSectionTitle: React.FC<{ titleKey: string }> = ({ titleKey }) => {
  const { t, i18n } = useTranslation();
  let title = t(titleKey);
  // 如果翻譯缺失，為特定的損壞鍵提供後備方案。
  if (title === 'blogSidebar.otherCategoryPosts') {
    title = i18n.language === 'zh-Hant' ? '其他分類文章' : 'Other Category Posts';
  }
  return (
    <div className="mb-6">
      <h3 className="text-xl font-playfair font-bold text-theme-primary relative pb-2">
        {title}
        <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-theme-primary/20"></span>
      </h3>
    </div>
  );
};

// 組件屬性介面
interface CategorySidebarProps {
  allPosts: BlogPostData[]; // 所有文章列表
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  currentCategoryInfo?: CategoryInfo; // 當前分類資訊，可選
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

/**
 * 分類頁面的側邊欄組件。
 * 顯示所有分類及其文章數量，以及最受歡迎的文章列表。
 */
const CategorySidebar: React.FC<CategorySidebarProps> = ({ allPosts, navigateTo, currentCategoryInfo, searchTerm, onSearchChange }) => {
  const { t, i18n } = useTranslation();

  // 計算每個大分類下的文章數量
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    blogCategoryDefinitions.forEach(def => {
      const allCategoryKeys = def.categoryKeys;
      const count = allPosts.filter(p => p.categoryKey && allCategoryKeys.includes(p.categoryKey)).length;
      counts[def.titleKey] = count;
    });
    return counts;
  }, [allPosts]);

  // 根據是否存在 currentCategoryInfo，決定顯示熱門文章還是最新文章
  const { titleKey, postsToList } = useMemo(() => {
    if (currentCategoryInfo) {
      // 顯示其他分類的最新文章
      const currentKeys = new Set(currentCategoryInfo.categoryKeys);
      const latestPostsFromOthers = allPosts
        .filter(p => !p.categoryKey || !currentKeys.has(p.categoryKey))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      return { titleKey: 'blogSidebar.otherCategoryPosts', postsToList: latestPostsFromOthers };
    } else {
      // 預設行為：顯示熱門文章
      const popularPosts = [...allPosts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);
      return { titleKey: 'blogSidebar.popularPosts', postsToList: popularPosts };
    }
  }, [allPosts, currentCategoryInfo]);

  return (
    <motion.aside
      className="space-y-12 bg-theme-secondary p-6 rounded-lg shadow-xl sticky top-24"
      variants={staggerContainerVariants(0.2, 0.4)}
      initial="initial"
      animate="animate"
    >
      {/* Search Bar Section */}
      <motion.section variants={fadeInUpItemVariants}>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-theme-secondary" />
            </span>
            <input
                type="search"
                placeholder={t('categoryPage.searchPlaceholder', '在此分類中搜尋...')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full bg-theme-tertiary border border-theme-primary text-theme-primary rounded-md py-2.5 pl-10 pr-4 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
            />
        </div>
      </motion.section>
      {/* 分類列表區塊 */}
      <motion.section variants={fadeInUpItemVariants}>
        <SidebarSectionTitle titleKey="blogPage.categoryLabel" />
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => navigateTo(Page.AllPostsArchive)}
              className={`w-full flex justify-between items-center hover:text-custom-cyan transition-colors py-2 border-b border-theme-primary/30 ${
                currentCategoryInfo?.titleKey === 'portfolioPage.filterAll' ? 'text-custom-cyan' : 'text-theme-secondary'
              }`}
            >
              <span className="font-medium">{t('portfolioPage.filterAll')}</span>
              <span className="bg-theme-tertiary text-theme-muted text-xs font-semibold px-2 py-0.5 rounded-md">
                {allPosts.length}
              </span>
            </button>
          </li>
          {blogCategoryDefinitions.map(cat => (
            <li key={cat.titleKey}>
              <button
                onClick={() => navigateTo(Page.CategoryPage, cat)}
                className={`w-full flex justify-between items-center hover:text-custom-cyan transition-colors py-2 border-b border-theme-primary/30 ${currentCategoryInfo?.titleKey === cat.titleKey ? 'text-custom-cyan' : 'text-theme-secondary'}`}
              >
                <span className="font-medium">{t(cat.titleKey)}</span>
                <span className="bg-theme-tertiary text-theme-muted text-xs font-semibold px-2 py-0.5 rounded-md">
                  {categoryCounts[cat.titleKey] || 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* 最新/熱門文章列表區塊 */}
      {postsToList.length > 0 && (
        <motion.section variants={fadeInUpItemVariants}>
          <SidebarSectionTitle titleKey={titleKey} />
          <ul className="space-y-5">
            {postsToList.map(post => {
              const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || '');
              const excerptText = (i18n.language === 'zh-Hant' ? (post.excerptZh || post.contentZh) : (post.excerpt || post.content)) || '';
              const cleanExcerpt = excerptText.replace(/<[^>]*>?/gm, '');

              return (
                <li key={post.id} className="popular-post-item flex items-start space-x-4 cursor-pointer" onClick={() => navigateTo(Page.BlogPostDetail, post)}>
                  <img src={post.imageUrl} alt={displayTitle || ''} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <h4 className="popular-post-title font-semibold text-sm text-theme-primary transition-colors leading-tight line-clamp-2">
                      {displayTitle}
                    </h4>
                    <p className="text-xs text-theme-secondary mt-1.5 line-clamp-2">
                      {cleanExcerpt}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}
    </motion.aside>
  );
};

export default CategorySidebar;