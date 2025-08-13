// 引入 React 相關鉤子
import React, { useMemo } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入 UI 組件
import RecentPostItem from './RecentPostItem';

// 側邊欄區塊標題組件
const SidebarSectionTitle: React.FC<{ titleKey: string }> = ({ titleKey }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-theme-primary relative">
        {t(titleKey)}
        <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-custom-cyan"></span>
      </h3>
    </div>
  );
};

// "焦點" 文章卡片組件
const BreakingPostCard: React.FC<{ post: BlogPostData; onClick: () => void }> = ({ post, onClick }) => {
    const { t, i18n } = useTranslation();
    const displayTitle = post.isStatic ? t(post.titleKey || '') : (i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : post.title || '');
    const formattedDate = new Date(post.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div 
            className="rounded-lg overflow-hidden relative group cursor-pointer shadow-lg"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if(e.key === 'Enter') onClick(); }}
        >
            <img src={post.imageUrl} alt={displayTitle} className="w-full h-48 object-cover transition-all duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
                <div className="flex items-center space-x-2 mb-1">
                    <span className="bg-red-600 text-white text-xs font-bold uppercase px-2 py-0.5 rounded-md">{t('blogSidebar.breaking')}</span>
                    {post.categoryKey && <span className="text-xs font-semibold uppercase">{t(post.categoryKey)}</span>}
                </div>
                <h4 className="font-bold leading-tight transition-colors group-hover:text-custom-cyan">{displayTitle}</h4>
                <p className="text-xs text-gray-300 mt-1">{formattedDate}</p>
            </div>
        </div>
    );
};

// 組件屬性介面
interface BlogSidebarProps {
  allPosts: BlogPostData[]; // 所有文章列表
  navigateTo: (page: Page, data?: BlogPostData) => void; // 導航函數
}

/**
 * 部落格頁面的側邊欄組件。
 * 顯示焦點文章和熱門文章列表。
 */
const BlogSidebar: React.FC<BlogSidebarProps> = ({ allPosts, navigateTo }) => {

  // 根據點讚數對文章進行排序，以找出熱門文章
  const popularPosts = useMemo(() => {
    return [...allPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [allPosts]);

  // 最熱門的文章作為焦點文章
  const breakingPost = popularPosts[0];
  // 其餘熱門文章
  const otherPopularPosts = popularPosts.slice(1, 5);

  return (
    <aside className="space-y-12 bg-theme-secondary p-6 rounded-lg shadow-xl">
      {/* 焦點文章區塊 */}
      {breakingPost && (
        <section>
          <BreakingPostCard post={breakingPost} onClick={() => navigateTo(Page.BlogPostDetail, breakingPost)} />
        </section>
      )}

      {/* 熱門文章列表區塊 */}
      {otherPopularPosts.length > 0 && (
        <section>
          <SidebarSectionTitle titleKey="blogSidebar.popularPosts" />
          <div className="space-y-5">
            {otherPopularPosts.map(post => (
              <RecentPostItem 
                key={post.id} 
                post={post} 
                onClick={() => navigateTo(Page.BlogPostDetail, post)}
              />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
};

export default BlogSidebar;
