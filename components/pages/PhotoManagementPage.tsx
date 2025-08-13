import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioItemData, Page } from '../../types';
import SectionTitle from '../ui/SectionTitle';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import ViewColumnsIcon from '../icons/ViewColumnsIcon';
import Squares2X2Icon from '../icons/Squares2X2Icon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import PencilIcon from '../icons/PencilIcon';
import EyeIcon from '../icons/EyeIcon';
import PaginationControls from '../ui/PaginationControls';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import { staggerContainerVariants, sectionDelayShow } from '../../animationVariants';

type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';
type ViewMode = 'list' | 'grid';

const portfolioCategoryOptions = [
    { value: 'all', labelKey: 'portfolioPage.filterAll' },
    { value: 'portfolioPage.filterStreet', labelKey: 'portfolioPage.filterStreet' },
    { value: 'portfolioPage.filterPortrait', labelKey: 'portfolioPage.filterPortrait' },
    { value: 'portfolioPage.filterSport', labelKey: 'portfolioPage.filterSport' },
];

interface PhotoManagementPageProps {
  portfolioItems: PortfolioItemData[];
  onDelete: (itemIds: string[]) => void;
  navigateTo: (page: Page, data?: any) => void;
}

const PhotoManagementPage: React.FC<PhotoManagementPageProps> = ({ portfolioItems = [], onDelete, navigateTo }) => {
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
  
  const processedItems = useMemo(() => {
    let items = [...portfolioItems];
    
    // Filtering
    if (filterCategory !== 'all') {
      items = items.filter(item => item.categoryKey === filterCategory);
    }

    // Sorting
    items.sort((a, b) => {
        const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || '');
        const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || '');
        switch (sortOrder) {
            case 'date-asc': return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'views-desc': return (b.views || 0) - (a.views || 0);
            case 'views-asc': return (a.views || 0) - (b.views || 0);
            case 'date-desc':
            default: return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
    });

    return items;
  }, [portfolioItems, filterCategory, sortOrder, i18n.language]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [processedItems, currentPage, itemsPerPage]);

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map(item => item.id));
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
        <SectionTitle titleKey="photoManagementPage.title" subtitleKey="photoManagementPage.subtitle" />
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
                onClick={() => alert(t('photoManagementPage.addPhotoComingSoon'))}
                className="button-theme-accent font-semibold py-2 px-4 rounded-md flex items-center"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('photoManagementPage.newPhotoButton', '新增相片')}
            </button>
            <button
                onClick={() => { setItemToDelete(null); setIsDeleteModalOpen(true); }}
                disabled={selectedIds.length === 0}
                className="button-theme-danger font-semibold py-2 px-4 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <TrashIcon className="w-5 h-5 mr-2" />
                {t('photoManagementPage.deleteButton', '刪除')} ({selectedIds.length})
            </button>
          </div>
          <div className="flex items-center space-x-2">
              <div className="relative">
                  <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}
                  >
                      {portfolioCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
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
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'list' ? 'active' : ''}`} aria-label={t('photoManagementPage.listViewAriaLabel')}><ViewColumnsIcon className="w-5 h-5"/></button>
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`} aria-label={t('photoManagementPage.gridViewAriaLabel')}><Squares2X2Icon className="w-5 h-5"/></button>
              </div>
          </div>
        </div>

        <div className="overflow-x-auto">
            {paginatedItems.length > 0 ? (
                viewMode === 'list' ? (
                    <table className="w-full text-sm text-left text-theme-secondary">
                        <thead className="text-xs text-theme-primary uppercase bg-theme-tertiary">
                        <tr>
                            <th scope="col" className="p-4">
                            <input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan" onChange={handleSelectAll} checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} />
                            </th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('photoManagementPage.titleHeader', i18n.language.startsWith('zh') ? '標題' : 'Title')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.image', '圖片')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.category')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.views')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedItems.map((item) => {
                            const displayTitle = (i18n.language === 'zh-Hant' && item.titleZh) ? item.titleZh : (item.title || '');
                            return (
                            <tr key={item.id} className="bg-theme-secondary border-b border-theme-primary hover:bg-theme-hover cursor-pointer" onClick={() => handleSelectOne(item.id)}>
                                <td className="w-4 p-4"><input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan pointer-events-none" checked={selectedIds.includes(item.id)} readOnly /></td>
                                <td className="px-6 py-4">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4 font-medium text-theme-primary whitespace-nowrap">{displayTitle}</td>
                                <td className="px-6 py-4"><img src={item.imageUrl} alt={displayTitle} className="w-16 h-10 object-cover rounded"/></td>
                                <td className="px-6 py-4">{item.categoryKey ? t(item.categoryKey) : 'N/A'}</td>
                                <td className="px-6 py-4">{item.views || 0}</td>
                                <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <button className="text-theme-secondary hover:text-custom-cyan disabled:opacity-50" disabled onClick={(e) => e.stopPropagation()}><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); openDeleteModal(item.id); }} className="text-theme-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" variants={staggerContainerVariants(0.05)} initial="initial" animate="animate">
                        {paginatedItems.map((item) => {
                            const displayTitle = (i18n.language === 'zh-Hant' && item.titleZh) ? item.titleZh : (item.title || '');
                            return (
                                <motion.div key={item.id} className={`bg-theme-secondary rounded-lg shadow-lg border-2 group relative cursor-pointer ${selectedIds.includes(item.id) ? 'border-custom-cyan' : 'border-transparent'}`} onClick={() => handleSelectOne(item.id)}>
                                    <div className="absolute top-2 right-2 z-10">
                                        <input type="checkbox" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan pointer-events-none" checked={selectedIds.includes(item.id)} readOnly/>
                                    </div>
                                    <div className="relative overflow-hidden rounded-t-lg">
                                        <img src={item.imageUrl} alt={displayTitle} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"/>
                                    </div>
                                    <div className="p-4">
                                        <p className="font-medium text-theme-primary whitespace-nowrap truncate" title={displayTitle}>{displayTitle}</p>
                                        <div className="flex justify-between items-center text-xs text-theme-secondary mt-1">
                                            <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                                            <span className="flex items-center"><EyeIcon className="w-3 h-3 mr-1"/> {item.views || 0}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 mt-4 pt-2 border-t border-theme-primary">
                                            <button className="text-theme-secondary hover:text-custom-cyan disabled:opacity-50" disabled onClick={(e) => e.stopPropagation()}><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(item.id); }} className="text-theme-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )
            ) : (
                <div className="text-center py-16 text-theme-secondary">{t('photoManagementPage.noItemsFound')}</div>
            )}
        </div>

        <div className="mt-6">
          <PaginationControls currentPage={currentPage} totalItems={processedItems.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
        </div>
      </motion.div>
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title={t('photoManagementPage.deleteConfirmationTitle')} message={t('photoManagementPage.deleteConfirmationMessage', { count: itemToDelete ? 1 : selectedIds.length })} />
    </div>
  );
};

export default PhotoManagementPage;