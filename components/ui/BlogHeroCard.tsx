// 引入 React 相關鉤子
import React, { useState, useCallback, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入 Swiper 相關組件和模塊
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { EffectFade, Navigation, Autoplay } from 'swiper/modules';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入動畫變體
import { fadeInUpItemVariants } from '../../animationVariants';
// 引入圖標組件
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import { stripMarkdown } from '../../utils';

// 輪播卡片屬性介面
interface BlogHeroCarouselProps {
  posts: BlogPostData[];
  navigateTo: (page: Page, data?: BlogPostData) => void;
}

// 單個輪播頁的內部組件 (現在只負責顯示內容，不包含按鈕)
const SingleSlide: React.FC<{ post: BlogPostData; isActive: boolean; onClick: () => void; }> = ({ post, isActive, onClick }) => {
  const { t, i18n } = useTranslation();

  // 根據語言選擇顯示的標題和摘要
  const { displayTitle, displayExcerpt } = React.useMemo(() => {
    const title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || '');
    const excerpt = stripMarkdown(rawContent);
    return { displayTitle: title, displayExcerpt: excerpt };
  }, [post, t, i18n.language]);

  // 定義內容和圖片的動畫變體
  const contentVariants = {
    inactive: { opacity: 0 },
    active: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.4, ease: "easeOut" as const } },
  };
  const itemVariants = {
    inactive: { opacity: 0, y: 20 },
    active: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const }},
  };
  const imageVariants = {
    inactive: { scale: 1.15, transition: { duration: 8, ease: 'linear' as const } },
    active: { scale: 1, transition: { duration: 8, ease: 'linear' as const } }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
        {/* 背景圖片，帶有縮放動畫 */}
        <motion.img
          key={post.id + "-img"}
          src={post.imageUrl}
          alt={displayTitle}
          className="absolute inset-0 w-full h-full max-w-full max-h-full object-cover"
          variants={imageVariants}
          initial="inactive"
          animate={isActive ? "active" : "inactive"}
        />
        {/* 遮罩層 */}
        <div className="absolute inset-0 bg-black opacity-40" />
        {/* 內容區域 */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-8">
            <motion.div
              className="max-w-3xl w-full text-center flex flex-col items-center"
              variants={contentVariants}
              initial="inactive"
              animate={isActive ? "active" : "inactive"}
            >
                <motion.h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight" variants={itemVariants}>
                    {displayTitle}
                </motion.h2>
                <motion.p className="text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto line-clamp-3 mb-8" variants={itemVariants}>
                      {displayExcerpt}
                </motion.p>
                <motion.div variants={itemVariants}>
                    <button
                        onClick={onClick}
                        className="btn-hero-neon px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:ring-custom-cyan"
                    >
                      {t('blogPage.startReading')}
                    </button>
                </motion.div>
            </motion.div>
        </div>
    </div>
  );
};

/**
 * 部落格英雄區塊輪播組件。
 * 使用 Swiper 庫來實現文章的淡入淡出輪播效果。
 */
const BlogHeroCard: React.FC<BlogHeroCarouselProps> = ({ posts, navigateTo }) => {
  const { t } = useTranslation();
  // 狀態：追蹤當前活動的文章數據
  const [activePost, setActivePost] = useState<BlogPostData | null>(posts[0] || null);

  // 當輪播切換時，更新活動的文章
  const handleSlideChange = useCallback((swiper: SwiperCore) => {
    if (posts.length > 0) {
      setActivePost(posts[swiper.realIndex]);
    }
  }, [posts]);

  if (!posts || posts.length === 0) {
    return null;
  }
  
  return (
    <motion.div className="relative blog-hero-swiper group" variants={fadeInUpItemVariants}>
      <Swiper
        modules={[EffectFade, Navigation, Autoplay]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={true}
        autoplay={{ delay: 8000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ nextEl: '.hero-swiper-button-next', prevEl: '.hero-swiper-button-prev' }}
        className="h-full"
        onSlideChange={handleSlideChange}
        onSwiper={handleSlideChange} // 初始化時設置 activePost
      >
        {posts.map((post) => (
          <SwiperSlide key={post.id}>
            {({ isActive }) => (
              <SingleSlide post={post} isActive={isActive} onClick={() => navigateTo(Page.BlogPostDetail, post)} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      {/* 導航按鈕 */}
      <AnimatePresence>
        <motion.div className="hero-swiper-button-prev opacity-0 group-hover:opacity-100 transition-opacity duration-300" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{delay: 0.2}}>
          <ChevronLeftIcon className="w-7 h-7" />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        <motion.div className="hero-swiper-button-next opacity-0 group-hover:opacity-100 transition-opacity duration-300" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{delay: 0.2}}>
          <ChevronRightIcon className="w-7 h-7" />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default BlogHeroCard;