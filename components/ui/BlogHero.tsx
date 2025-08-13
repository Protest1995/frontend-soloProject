
// 引入 React 相關鉤子
import React, { useState } from 'react';
// 引入翻譯鉤子和類型
import { useTranslation } from 'react-i18next';
import { i18n as I18n, TFunction } from 'i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入圖標組件
import NewspaperIcon from '../icons/NewspaperIcon';
// 引入 Framer Motion 動畫庫
import { AnimatePresence, motion } from 'framer-motion';
// 引入 Swiper 相關組件和模塊
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperCore } from 'swiper';

// --- 可重用的內部組件 ---

// BreakingNewsItem 組件屬性介面
interface BreakingNewsItemProps {
  post: BlogPostData;
  navigateTo: (page: Page, data: BlogPostData) => void;
  t: TFunction;
  i18n: I18n;
}

// 最新文章列表項組件
const BreakingNewsItem: React.FC<BreakingNewsItemProps> = ({ post, navigateTo, t, i18n }) => {
    const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    const formattedDate = new Date(post.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div 
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => navigateTo(Page.BlogPostDetail, post)}
        >
            <img src={post.imageUrl} alt={displayTitle} className="w-14 h-10 object-cover rounded flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <h4 className="text-sm font-semibold leading-tight text-white group-hover:text-custom-cyan transition-colors truncate">{displayTitle}</h4>
                <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
            </div>
        </div>
    );
};

// SingleHeroSlide 組件屬性介面
interface SingleHeroSlideProps {
    post: BlogPostData;
    isActive: boolean;
    navigateTo: (page: Page, data: BlogPostData) => void;
    t: TFunction;
    i18n: I18n;
}

// 單個輪播頁面組件
const SingleHeroSlide: React.FC<SingleHeroSlideProps> = ({ post, isActive, navigateTo, t, i18n }) => {
    const contentVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const, staggerChildren: 0.2 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" as const } },
    };
    
    const itemVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
    };

    const getDisplayValue = (primaryValue: string | null | undefined, secondaryValue: string | null | undefined, fallbackKey: string) => {
        if (primaryValue && primaryValue.trim()) return primaryValue;
        if (secondaryValue && secondaryValue.trim()) return secondaryValue;
        return t(fallbackKey);
    };

    const featuredTitle = i18n.language === 'zh-Hant'
        ? getDisplayValue(post.titleZh, post.title, 'blogPage.untitledPost')
        : getDisplayValue(post.title, post.titleZh, 'blogPage.untitledPost');

    const featuredExcerpt = (i18n.language === 'zh-Hant'
        ? getDisplayValue(post.excerptZh, post.excerpt, 'blogPage.noExcerpt')
        : getDisplayValue(post.excerpt, post.excerptZh, 'blogPage.noExcerpt')
    ).replace(/<[^>]*>?/gm, '');
    
    return (
        <div className="w-full h-full">
            <motion.div
                key={post.id + '-bg'}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.imageUrl})` }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: isActive ? 1 : 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' as const }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-12 z-10 px-4">
                 <AnimatePresence>
                    {isActive && (
                        <motion.div 
                            key={post.id + '-content'} 
                            variants={contentVariants} 
                            initial="initial" 
                            animate="animate" 
                            exit="exit"
                            className="max-w-3xl mx-auto text-center flex flex-col items-center"
                        >
                           <motion.span variants={itemVariants} className="bg-category-hot text-white text-xs font-bold uppercase px-3 py-1 rounded-md mb-4 inline-block">{t('blogPage.hotNow')}</motion.span>
                            <motion.h1 variants={itemVariants} className="text-3xl md:text-5xl font-bold leading-tight text-white font-playfair">
                                {featuredTitle}
                            </motion.h1>
                            <motion.p variants={itemVariants} className="mt-4 text-gray-300 text-sm md:text-base hidden sm:block line-clamp-2 max-w-2xl">{featuredExcerpt}</motion.p>
                             <motion.div variants={itemVariants} className="mt-8">
                                <button
                                    onClick={() => navigateTo(Page.BlogPostDetail, post)}
                                    className="px-6 py-3 bg-white text-black dark:bg-black dark:text-white rounded-lg font-semibold transition-opacity hover:opacity-90 shadow-lg"
                                >
                                    {t('blogPage.startReading')}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


// --- 主要的 BlogHero 組件 ---

// 組件屬性介面
interface BlogHeroProps {
    posts: BlogPostData[];
    navigateTo: (page: Page, data: BlogPostData) => void;
}

/**
 * 部落格頁面的英雄區塊組件。
 * 使用 Swiper.js 實現一個穩定、可靠且具備淡入淡出效果的文章輪播。
 */
const BlogHero: React.FC<BlogHeroProps> = ({ posts, navigateTo }) => {
    // 將 useTranslation 提升到父組件層級
    const { t, i18n } = useTranslation();
    const [swiper, setSwiper] = useState<SwiperCore | null>(null);
    const [realIndex, setRealIndex] = useState(0);

    // 如果沒有文章數據，則不渲染任何內容
    if (!posts || posts.length === 0) {
        return null; 
    }

    // 計算要在側邊欄顯示的“即將發佈”文章列表
    const upcomingPosts = posts.length < 2
        ? []
        : Array.from({ length: Math.min(4, posts.length - 1) }, (_, i) => {
            const nextIndex = (realIndex + 1 + i) % posts.length;
            return posts[nextIndex];
        });

    return (
        <div className="relative h-72 md:h-[600px] lg:h-screen bg-black -mx-6 md:-mx-12 -mt-6 md:-mt-12 mb-12">
            <Swiper
                modules={[EffectFade, Autoplay]}
                onSwiper={setSwiper}
                onSlideChange={(s) => setRealIndex(s.realIndex)}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={true}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                className="w-full h-full"
            >
                {posts.map((post) => (
                    <SwiperSlide key={post.id}>
                        {({ isActive }) => (
                            // 將 t 和 i18n 作為 props 傳遞下去
                            <SingleHeroSlide 
                                post={post} 
                                isActive={isActive} 
                                navigateTo={navigateTo}
                                t={t}
                                i18n={i18n}
                            />
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>
            
            {/* 右側最新文章列表 */}
            {upcomingPosts.length > 0 && (
                <div className="hidden lg:block absolute top-12 right-12 z-20 w-full max-w-sm p-6 bg-black/30 backdrop-blur-md rounded-lg border border-white/10">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
                        <NewspaperIcon className="w-4 h-4" />
                        <span>{t('blogPage.breakingNews')}</span>
                    </div>
                    <div className="space-y-4">
                        {upcomingPosts.map(post => (
                            // 將 t 和 i18n 作為 props 傳遞下去
                            <BreakingNewsItem 
                                key={post.id} 
                                post={post} 
                                navigateTo={navigateTo}
                                t={t}
                                i18n={i18n}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 自訂分頁器 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center space-x-3">
                {posts.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => swiper?.slideToLoop(index)}
                        className="relative w-3 h-3 flex items-center justify-center rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <div className={`w-2 h-2 rounded-full transition-colors ${realIndex === index ? 'bg-custom-cyan' : 'bg-gray-400 bg-opacity-70 group-hover:bg-white'}`} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BlogHero;
