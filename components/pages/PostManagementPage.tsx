import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BlogPostData, Page } from '../../types';
import SectionTitle from '../ui/SectionTitle';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import ViewColumnsIcon from '../icons/ViewColumnsIcon';
import Squares2X2Icon from '../icons/Squares2X2Icon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import PencilIcon from '../icons/PencilIcon';
import { blogCategoryDefinitions } from '../data/blogData';
import PaginationControls from '../ui/PaginationControls';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import { staggerContainerVariants, sectionDelayShow, fadeInUpItemVariants } from '../../animationVariants';


type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';
type ViewMode = 'list' | 'grid';

const postCategoryOptions = [
    { value: 'all', labelKey: 'portfolioPage.filterAll' },
    ...blogCategoryDefinitions.map(def => ({ value: def.titleKey, labelKey: def.titleKey }))
];


interface PostManagementPageProps {
  posts: BlogPostData[];
  onDelete: (postIds: string[]) => void;
  navigateTo: (page: Page, data?: any) => void;
}

const PostManagementPage: React.FC<PostManagementPageProps> = ({ posts = [], onDelete, navigateTo }) => {
  const { t, i18n } = useTranslation();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);
  
  const processedPosts = useMemo(() => {
    let items = [...posts];

    // Filtering
    if (filterCategory !== 'all') {
        const activeCategoryDef = blogCategoryDefinitions.find(def => def.titleKey === filterCategory);
        if (activeCategoryDef) {
            items = items.filter(post => post.categoryKey && activeCategoryDef.categoryKeys.includes(post.categoryKey));
        }
    }

    // Sorting
    items.sort((a, b) => {
        const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || '');
        const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || '');
        switch (sortOrder) {
            case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'views-desc': return (b.views || 0) - (a.views || 0);
            case 'views-asc': return (a.views || 0) - (b.views || 0);
            case 'date-desc':
            default: return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
    });

    return items;
  }, [posts, filterCategory, sortOrder, i18n.language]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedPosts.slice(startIndex, startIndex + itemsPerPage);
  }, [processedPosts, currentPage, itemsPerPage]);

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedPosts.map(post => post.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openDeleteModal = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete([itemToDelete]);
      setItemToDelete(null);
    } else if (selectedIds.length > 0) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="postManagementPage.title" subtitleKey="postManagementPage.subtitle" />
      </motion.div>

      <motion.div
        className="bg-theme-secondary p-6 rounded-lg shadow-xl"
        variants={staggerContainerVariants(0.1, 0.2)}
        initial="initial"
        animate="animate"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <button
                onClick={() => navigateTo(Page.AddBlogPost)}
                className="button-theme-accent font-semibold py-2 px-4 rounded-md flex items-center"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('postManagementPage.newPostButton', '新增文章')}
            </button>
            <button
                onClick={() => { setItemToDelete(null); setIsDeleteModalOpen(true); }}
                disabled={selectedIds.length === 0}
                className="button-theme-danger font-semibold py-2 px-4 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <TrashIcon className="w-5 h-5 mr-2" />
                {t('postManagementPage.deleteButton', '刪除')} ({selectedIds.length})
            </button>
          </div>
          <div className="flex items-center space-x-2">
              <div className="relative">
                  <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}
                  >
                      {postCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary">
                      <ChevronDownIcon className="w-4 h-4" />
                  </div>
              </div>
              <div className="relative">
                  <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}
                  >
                      <option value="date-desc">{t('blogPage.sortDateDesc')}</option>
                      <option value="date-asc">{t('blogPage.sortDateAsc')}</option>
                      <option value="title-asc">{t('blogPage.sortTitleAsc')}</option>
                      <option value="title-desc">{t('blogPage.sortTitleDesc')}</option>
                      <option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option>
                      <option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary">
                      <ChevronDownIcon className="w-4 h-4" />
                  </div>
              </div>
               <div className="bg-theme-tertiary p-1 rounded-lg flex items-center">
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'list' ? 'active' : ''}`} aria-label={t('postManagementPage.listViewAriaLabel')}><ViewColumnsIcon className="w-5 h-5"/></button>
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`} aria-label={t('postManagementPage.gridViewAriaLabel')}><Squares2X2Icon className="w-5 h-5"/></button>
              </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {paginatedPosts.length > 0 ? (
            viewMode === 'list' ? (
                <table className="w-full text-sm text-left text-theme-secondary">
                  <thead className="text-xs text-theme-primary uppercase bg-theme-tertiary">
                    <tr>
                      <th scope="col" className="p-4"><input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan" onChange={handleSelectAll} checked={selectedIds.length === paginatedPosts.length && paginatedPosts.length > 0} /></th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.date')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.titleHeader', i18n.language.startsWith('zh') ? '標題' : 'Title')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.image', '圖片')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.category')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.views')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.comments')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.map((post) => {
                      const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || '');
                      return (
                        <tr key={post.id} className="bg-theme-secondary border-b border-theme-primary hover:bg-theme-hover cursor-pointer" onClick={() => handleSelectOne(post.id)}>
                          <td className="w-4 p-4"><input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan pointer-events-none" checked={selectedIds.includes(post.id)} readOnly/></td>
                          <td className="px-6 py-4">{new Date(post.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium text-theme-primary whitespace-nowrap">{displayTitle}</td>
                          <td className="px-6 py-4"><img src={post.imageUrl} alt={displayTitle} className="w-16 h-10 object-cover rounded"/></td>
                          <td className="px-6 py-4">{post.categoryKey ? t(post.categoryKey) : 'N/A'}</td>
                          <td className="px-6 py-4">{post.views || 0}</td>
                          <td className="px-6 py-4">{post.commentsCount || 0}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <button onClick={(e) => { e.stopPropagation(); navigateTo(Page.EditBlogPost, post); }} className="text-theme-secondary hover:text-custom-cyan"><PencilIcon className="w-4 h-4"/></button>
                              <button onClick={(e) => { e.stopPropagation(); openDeleteModal(post.id); }} className="text-theme-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            ) : (
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" variants={staggerContainerVariants(0.05)} initial="initial" animate="animate">
                    {paginatedPosts.map((post) => {
                        const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || '');
                        return (
                            <motion.div key={post.id} className={`bg-theme-secondary rounded-lg shadow-lg border-2 group relative cursor-pointer ${selectedIds.includes(post.id) ? 'border-custom-cyan' : 'border-transparent'}`} variants={fadeInUpItemVariants} onClick={() => handleSelectOne(post.id)}>
                                <input type="checkbox" className="absolute top-2 right-2 z-10 form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan pointer-events-none" checked={selectedIds.includes(post.id)} readOnly />
                                <div className="relative overflow-hidden rounded-t-lg">
                                    <img src={post.imageUrl} alt={displayTitle} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"/>
                                </div>
                                <div className="p-4">
                                    <p className="font-medium text-theme-primary whitespace-nowrap truncate" title={displayTitle}>{displayTitle}</p>
                                    <p className="text-xs text-theme-secondary">{post.categoryKey ? t(post.categoryKey) : 'N/A'}</p>
                                    <div className="flex justify-between text-xs text-theme-secondary mt-2">
                                        <span>{t('postManagementPage.views')}: {post.views || 0}</span>
                                        <span>{t('postManagementPage.comments')}: {post.commentsCount || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 mt-4 pt-2 border-t border-theme-primary">
                                        <button onClick={(e) => { e.stopPropagation(); navigateTo(Page.EditBlogPost, post); }} className="text-theme-secondary hover:text-custom-cyan"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); openDeleteModal(post.id); }} className="text-theme-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )
          ) : (
            <div className="text-center py-16 text-theme-secondary">{t('postManagementPage.noPostsFound')}</div>
          )}
        </div>

        <div className="mt-6">
          <PaginationControls currentPage={currentPage} totalItems={processedPosts.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
        </div>
      </motion.div>
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title={t('postManagementPage.deleteConfirmationTitle')} message={t('postManagementPage.deleteConfirmationMessage', { count: itemToDelete ? 1 : selectedIds.length })} />
    </div>
  );
};

export default PostManagementPage;