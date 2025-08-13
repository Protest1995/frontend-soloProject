import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Page, BlogPostData, Comment, UserProfile, CategoryInfo } from '../../types';
import { ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../../constants';
import PencilSquareIcon from '../icons/PencilSquareIcon'; 
import CommentSection from '../ui/CommentSection'; 
import PenPaperIcon from '../icons/PenPaperIcon';
import { getCategoryInfoFromKey } from '../data/blogData';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import PostNavigation from '../ui/PostNavigation';

const motion: any = motionTyped;

// 自訂的 rehype-sanitize schema，允許 iframe
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    iframe: [
      'src',
      'width',
      'height',
      'frameborder',
      'allow',
      'allowfullscreen',
      'allowFullScreen', 
      'title',
      'referrerpolicy',
    ],
  },
};

interface BlogPostDetailPageProps {
  post: BlogPostData; 
  allPosts: BlogPostData[];
  navigateTo: (page: Page, data?: any) => void; 
  isAuthenticated: boolean;
  comments: Comment[];
  onAddComment: (postId: string, text: string, parentId?: string | null) => void;
  onDeleteComment: (commentId: string) => void;
  isSuperUser: boolean;
  currentUserProfile: UserProfile;
  originCategoryInfo: CategoryInfo | null; // 來自哪個分類頁，若無則為 null
}

const BlogPostDetailPage: React.FC<BlogPostDetailPageProps> = ({ 
  post, 
  allPosts,
  navigateTo, 
  isAuthenticated,
  comments,
  onAddComment,
  onDeleteComment,
  isSuperUser,
  currentUserProfile,
  originCategoryInfo
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.id]); 

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      setColorMode(newMode);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const initialMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    setColorMode(initialMode);
    return () => observer.disconnect();
  }, []);

  const categoryInfo = useMemo(() => getCategoryInfoFromKey(post.categoryKey), [post.categoryKey]);

  const { displayTitle, displayContent, postCategory } = useMemo(() => {
    let title: string, content: string, category: string;

    title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    content = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || t('blogPage.noContent'));
    category = categoryInfo ? t(categoryInfo.titleKey) : (post.categoryKey ? t(post.categoryKey) : 'Uncategorized');

    return { 
        displayTitle: title, 
        displayContent: content, 
        postCategory: category
    };
  }, [post, t, i18n.language, categoryInfo]);
  
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="-m-6 md:-m-12">
        {/* Hero Section */}
        <div className="relative h-screen min-h-[500px] text-white flex items-center justify-center">
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-black opacity-60" />
            <div className="relative z-10 text-center max-w-4xl p-8">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">{displayTitle}</h1>
                <div className={`text-sm font-medium uppercase tracking-wider text-custom-cyan`}>
                    <span>{new Date(post.date).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="mx-2">/</span>
                    <span>{postCategory}</span>
                    <span className="mx-2">/</span>
                    <span>{t('blogPage.writtenBy')} {t('sidebar.profileName')}</span>
                </div>
            </div>
        </div>

        <div className="bg-theme-primary py-3 sticky top-0 z-30">
             <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBackClick}
                        className="flex items-center text-sm font-medium py-2 px-4 rounded-md transition-all duration-200 bg-theme-tertiary hover:bg-theme-hover text-theme-primary hover:text-custom-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-primary focus-visible:ring-custom-cyan"
                    >
                        <ArrowLeftIcon className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">{t('blogPostDetail.backButton')}</span>
                    </button>
                    <div className="text-sm text-theme-secondary flex items-center space-x-2 truncate">
                        <Link to="/blog" className="flex items-center hover:text-custom-cyan transition-colors flex-shrink-0">
                            <PenPaperIcon className="w-4 h-4 mr-1.5" />
                            <span>{t('blogPage.viewAll')}</span>
                        </Link>
                        {categoryInfo && (
                            <>
                                <span className="flex-shrink-0">&gt;</span>
                                <Link to={`/blog/category/${categoryInfo.titleKey.split('.').pop()}`} className="hover:text-custom-cyan transition-colors truncate">
                                    <span>{postCategory}</span>
                                </Link>
                            </>
                        )}
                        <span className="flex-shrink-0">&gt;</span>
                        <span className="text-theme-primary truncate">{displayTitle}</span>
                    </div>
                </div>
                <div className="flex justify-end">
                    {isSuperUser && (
                      <button
                        onClick={() => navigateTo(Page.EditBlogPost, post)}
                        className={`inline-flex items-center text-sm font-medium py-2 px-4 rounded-md focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} transition-all duration-200 bg-theme-tertiary hover:bg-theme-hover text-theme-primary hover:text-custom-cyan`}
                      >
                        <PencilSquareIcon className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">{t('blogPage.editButton')}</span>
                      </button>
                    )}
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <div className="w-full lg:w-4/5 mx-auto">
                <article className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        data-color-mode={colorMode}
                    >
                         <MDEditor.Markdown 
                            source={displayContent}
                            rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                            style={{ backgroundColor: 'transparent' }}
                            className="prose prose-lg lg:prose-xl max-w-none prose-custom-styles"
                         />
                    </motion.div>

                    <div className="border-t border-theme-primary">
                        <PostNavigation currentPost={post} allPosts={allPosts} />
                    </div>
                    
                    <CommentSection
                        postId={post.id}
                        comments={comments}
                        isAuthenticated={isAuthenticated}
                        currentUserProfile={currentUserProfile}
                        onAddComment={onAddComment}
                        onDeleteComment={onDeleteComment}
                        isSuperUser={isSuperUser}
                    />
                </article>
            </div>
        </div>
    </div>
  );
};

export default BlogPostDetailPage;
