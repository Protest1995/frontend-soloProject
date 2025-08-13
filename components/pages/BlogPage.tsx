import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { BlogPostData, Page } from '../../types';
import { sectionDelayShow, fadeInUpItemVariants, staggerContainerVariants } from '../../animationVariants';
import BlogHeroCard from '../ui/BlogHeroCard';
import { blogCategoryDefinitions } from '../data/blogData';
import PostcardCarousel from '../ui/PostcardCarousel';
import BlogTabs from '../ui/BlogTabs';
import BlogCard from '../ui/BlogCardMasonry';
import SectionTitle from '../ui/SectionTitle';
import TopicCard from '../ui/TopicCard';
import SectionDivider from '../ui/SectionDivider';


// 將 motionTyped 轉型為 any 以解決類型問題
const motion: any = motionTyped;

// 部落格頁面的屬性介面
export const BlogPage: React.FC<{
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  allPosts: BlogPostData[]; // 所有部落格文章數據
  onDeletePosts: (postIds: string[]) => void; // 刪除文章的回調
  isSuperUser: boolean; // 是否為超級用戶
  navigateToLogin: () => void; // 導航到登入頁的函數
}> = ({ navigateTo, allPosts, onDeletePosts, isSuperUser, navigateToLogin }) => {
  const { t } = useTranslation();
  
  // 狀態管理
  const [activeTabKey, setActiveTabKey] = useState(blogCategoryDefinitions[0].titleKey); // 當前活動的分類標籤

  // 將所有文章按創建時間倒序排列
  const sortedPosts = useMemo(() => 
    [...allPosts].sort((a, b) => b.createdAt - a.createdAt),
  [allPosts]);

  // 獲取最新的6篇文章作為英雄區塊的內容
  const heroPosts = sortedPosts.slice(0, 6);
  // 獲取接下來的12篇文章作為明信片輪播的內容
  const postcardPosts = useMemo(() => sortedPosts.slice(6, 18), [sortedPosts]);
  
  // 從分類定義中生成標籤頁數據
  const tabs = useMemo(() => 
    blogCategoryDefinitions.map(def => ({ key: def.titleKey, titleKey: def.titleKey })), 
  []);

  // 話題卡片的數據，包含圖片路徑
  const topicsData = [
    {
      ...blogCategoryDefinitions[0], // 攝影
      image: '/images/photography.jpg',
    },
    {
      ...blogCategoryDefinitions[1], // Solo學習日記
      image: '/images/diary.jpg',
    },
    {
      ...blogCategoryDefinitions[2], // 工具分享
      image: '/images/tools.jpg',
    },   
  ];

  // 根據當前活動的標籤過濾出對應的文章
  const postsForActiveTab = useMemo(() => {
    const activeCategoryDef = blogCategoryDefinitions.find(def => def.titleKey === activeTabKey);
    if (!activeCategoryDef) return [];
    
    return sortedPosts
      .filter(post => post.categoryKey && activeCategoryDef.categoryKeys.includes(post.categoryKey))
      .slice(0, 4); // 只取前4篇
  }, [activeTabKey, sortedPosts]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {heroPosts.length > 0 && (
        <motion.div 
          className="-m-6 md:-m-12"
          variants={sectionDelayShow(0)} 
          initial="initial" 
          animate="animate"
        >
          <BlogHeroCard posts={heroPosts} navigateTo={navigateTo} />
        </motion.div>
      )}

      {/* 明信片風格的輪播區塊 */}
      {postcardPosts.length > 0 && (
        <motion.section {...sectionDelayShow(0.1)}>
          <SectionDivider title={t('blogPage.trendingNow')} />
          <PostcardCarousel posts={postcardPosts} navigateTo={navigateTo} />
        </motion.section>
      )}

      {/* 話題/分類區塊 */}
      <motion.section {...sectionDelayShow(0.2)}>
        <SectionDivider title={t('blogPage.relatedTopics')} />
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainerVariants(0.1, 0.3)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          {topicsData.map((topic) => (
            <motion.div key={topic.titleKey} variants={fadeInUpItemVariants}>
              <TopicCard
                titleKey={topic.titleKey}
                image={topic.image}
                onClick={() => navigateTo(Page.CategoryPage, topic)}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* 分類標籤頁與文章列表 */}
      <section className="max-w-7xl mx-auto">
        <SectionDivider title={t('blogPage.latestPosts')} />
        <motion.div
          variants={staggerContainerVariants(0.1, 0.2)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={fadeInUpItemVariants}>
            <BlogTabs 
              tabs={tabs}
              activeTabKey={activeTabKey}
              onTabClick={setActiveTabKey}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }}
            >
              {postsForActiveTab.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {postsForActiveTab.map(post => (
                    <BlogCard 
                      key={post.id}
                      post={post}
                      onClick={() => navigateTo(Page.BlogPostDetail, post)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-theme-secondary py-10">{t('blogPage.noPostsFound')}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 如果沒有任何文章，顯示提示信息 */}
      {allPosts.length === 0 && (
        <p className="text-center text-theme-secondary py-10">{t('blogPage.noPostsFound')}</p>
      )}      
      <hr className="my-12 border-theme-primary" />      
    </div>
  );
};