import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BlogPostData } from '../../types';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface PostNavigationProps {
  currentPost: BlogPostData;
  allPosts: BlogPostData[];
}

/**
 * A component to navigate between previous and next blog posts.
 */
const PostNavigation: React.FC<PostNavigationProps> = ({ currentPost, allPosts }) => {
  const { t, i18n } = useTranslation();

  // Sort posts by date to establish a clear chronological order
  const sortedPosts = React.useMemo(() => 
    [...allPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
  [allPosts]);

  const currentIndex = sortedPosts.findIndex(p => p.id === currentPost.id);

  // Determine the previous and next posts based on the sorted array
  // Since it's sorted descending, previous post is at a higher index, next is at a lower index.
  const previousPost = currentIndex > -1 && currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

  const getDisplayTitle = (post: BlogPostData | null) => {
    if (!post) return '';
    return i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : (post.title || t('blogPage.untitledPost'));
  };

  return (
    <div className="post-navigation flex justify-between items-start gap-4 sm:gap-8 py-8">
      <div className="w-1/2 text-left">
        {previousPost && (
          <Link
            to={`/blog/${previousPost.id}`}
            state={{ fromCategory: null }}
            className="group inline-block p-2 -ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-md"
            aria-label={`${t('pagination.previous')}: ${getDisplayTitle(previousPost)}`}
          >
            <div className="flex items-center text-sm text-theme-secondary transition-colors mb-1">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              <span>{t('pagination.previous')}</span>
            </div>
            <p className="font-semibold text-theme-primary transition-colors line-clamp-2 pr-2">
              {getDisplayTitle(previousPost)}
            </p>
          </Link>
        )}
      </div>
      <div className="w-1/2 text-right">
        {nextPost && (
          <Link
            to={`/blog/${nextPost.id}`}
            state={{ fromCategory: null }}
            className="group inline-block p-2 -mr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-md"
            aria-label={`${t('pagination.next')}: ${getDisplayTitle(nextPost)}`}
          >
            <div className="flex items-center justify-end text-sm text-theme-secondary transition-colors mb-1">
              <span>{t('pagination.next')}</span>
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </div>
            <p className="font-semibold text-theme-primary transition-colors line-clamp-2 pl-2 text-right">
              {getDisplayTitle(nextPost)}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PostNavigation;