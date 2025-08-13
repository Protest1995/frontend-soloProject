// 引入 React 相關鉤子和組件
import React, { useState, useMemo, useCallback, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PortfolioCard from '../ui/PortfolioCard';
import Lightbox from '../ui/Lightbox';
import { PortfolioItemData } from '../../types'; 
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants'; 
import Masonry from 'react-masonry-css';
import PortfolioSkeletonCard from '../ui/PortfolioSkeletonCard';
import SectionTitle from '../ui/SectionTitle';
import PortfolioCarousel from '../ui/PortfolioCarousel';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CameraIcon from '../icons/CameraIcon';
import { ApiService } from '../../src/services/api';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 新增作品時的分類選項
const addProjectCategoryOptions = [
  { value: 'portfolioPage.filterStreet', labelKey: 'portfolioPage.filterStreet' },
  { value: 'portfolioPage.filterPortrait', labelKey: 'portfolioPage.filterPortrait' },
  { value: 'portfolioPage.filterSport', labelKey: 'portfolioPage.filterSport' },
];

// 定義每頁顯示的項目數量、無限滾動加載的數量和排序鍵類型
const ITEMS_PER_PAGE = 12;
const ITEMS_TO_LOAD = 6;
type SortKey = 'date-desc' | 'date-asc' | 'views-desc' | 'views-asc' | 'title-asc' | 'title-desc' | 'category-asc' | 'category-desc';

// 作品集頁面的屬性介面
interface PortfolioPageProps {
  userAddedPortfolioItems: PortfolioItemData[];
  onAddPortfolioItem: (item: PortfolioItemData) => void;
  onDeletePortfolioItems: (itemIds: string[]) => void;
  isAuthenticated: boolean;
  isSuperUser: boolean;
  navigateToLogin: () => void;
}

// 分類篩選器的選項
const filterCategories = ['portfolioPage.filterAll', 'portfolioPage.filterStreet', 'portfolioPage.filterPortrait', 'portfolioPage.filterSport'];

/**
 * 作品集頁面組件。
 * 顯示作品集項目，支持篩選、排序、無限滾動、燈箱預覽以及管理員的 CRUD 操作。
 */
export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  userAddedPortfolioItems,
  onAddPortfolioItem,
  onDeletePortfolioItems,
  isAuthenticated,
  isSuperUser,
  navigateToLogin,
}) => {
  const { t, i18n } = useTranslation();
  const loaderRef = useRef<HTMLDivElement>(null);

  // 狀態管理
  const [activeFilter, setActiveFilter] = useState<string>('portfolioPage.filterAll');
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);
  const [lightboxItemsSource, setLightboxItemsSource] = useState<PortfolioItemData[] | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  // 管理員功能相關狀態
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false);
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  
  // 表單相關狀態
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoTitleZh, setNewPhotoTitleZh] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // 所有作品項目，按日期排序
  const allPortfolioItems = useMemo(() => {
    return [...userAddedPortfolioItems].sort((a,b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0)); 
  }, [userAddedPortfolioItems]);

  // 用於輪播的項目，優先顯示精選項目
  const carouselItems = useMemo(() => {
    // 1. 分離精選和非精選項目
    const featuredItems = allPortfolioItems
      .filter(item => item.isFeatured)
      .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

    const nonFeaturedItems = allPortfolioItems
      .filter(item => !item.isFeatured)
      .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
    
    // 2. 組合列表並取前 8 個
    const combined = [...featuredItems, ...nonFeaturedItems];
    return combined.slice(0, 8);
  }, [allPortfolioItems]);


  // 根據當前排序鍵排序所有項目
  const sortedItems = useMemo(() => {
    return [...allPortfolioItems].sort((a, b) => {
      const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || a.id);
      const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || b.id);
      const categoryA = t(a.categoryKey || '');
      const categoryB = t(b.categoryKey || '');
      switch (sortKey) {
        case 'date-asc': return (a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0);
        case 'title-asc': return titleA.localeCompare(titleB);
        case 'title-desc': return titleB.localeCompare(titleA);
        case 'category-asc': return categoryA.localeCompare(categoryB);
        case 'category-desc': return categoryB.localeCompare(categoryA);
        case 'views-desc': return (b.views || 0) - (a.views || 0);
        case 'views-asc': return (a.views || 0) - (b.views || 0);
        case 'date-desc': default: return (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0);
      }
    });
  }, [allPortfolioItems, sortKey, i18n.language, t]);

  // 根據當前篩選器過濾項目
  const filteredItems = useMemo(() => {
    if (activeFilter === 'portfolioPage.filterAll') return sortedItems;
    return sortedItems.filter(item => item.categoryKey === activeFilter);
  }, [activeFilter, sortedItems]);

  // 獲取當前要顯示的項目（用於無限滾動）
  const itemsToDisplay = useMemo(() => filteredItems.slice(0, displayCount), [filteredItems, displayCount]);
  
  // 重置表單
  const resetForm = useCallback(() => { setNewPhotoTitle(''); setNewPhotoTitleZh(''); setNewPhotoCategory(''); setSelectedFile(null); setPreviewUrl(null); setImageUploadError(null); }, []);

  // 處理管理員操作
  const handleShowAddForm = () => { if (!isSuperUser) { navigateToLogin(); return; } setIsAdding(true); setIsDeleteModeActive(false); setSelectedIdsForDeletion([]); };
  const handleCancelForm = () => { setIsAdding(false); resetForm(); };
  const handleToggleDeleteMode = () => { if (!isSuperUser) { navigateToLogin(); return; } setIsDeleteModeActive(prev => !prev); setSelectedIdsForDeletion([]); setIsAdding(false); };
  const handleDeleteConfirmed = () => { onDeletePortfolioItems(selectedIdsForDeletion); setSelectedIdsForDeletion([]); setIsDeleteModeActive(false); };
  const handleToggleSelectionForDeletion = (id: string) => { setSelectedIdsForDeletion(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]); };
  
  // 全選/取消全選
  const handleSelectAllForDeletion = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) { setSelectedIdsForDeletion(filteredItems.filter(item => !item.isStatic).map(item => item.id)); } else { setSelectedIdsForDeletion([]); }
  };
  
  // 計算可刪除項目的數量
  const deletableItemsCount = useMemo(() => filteredItems.filter(item => !item.isStatic).length, [filteredItems]);

  // 處理加載動畫
  useEffect(() => { setIsLoading(true); const timer = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(timer); }, [activeFilter]);
  useEffect(() => { setDisplayCount(ITEMS_PER_PAGE); }, [activeFilter]);

  // 無限滾動的 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 當觀察的元素進入視口時
        if (entries[0].isIntersecting && !isLoading && displayCount < filteredItems.length) {
          // 模擬延遲加載以顯示加載指示器
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + ITEMS_TO_LOAD, filteredItems.length));
          }, 300);
        }
      },
      { rootMargin: "200px" } // 在元素進入視口前 200px 就開始加載
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    // 清理函數
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [displayCount, filteredItems.length, isLoading]);
  
  // 燈箱相關操作
  const openLightbox = useCallback((itemToOpen: PortfolioItemData, sourceItems: PortfolioItemData[]) => { if (isDeleteModeActive) return; setSelectedItem(itemToOpen); setLightboxItemsSource(sourceItems); }, [isDeleteModeActive]);
  const closeLightbox = useCallback(() => { setSelectedItem(null); setLightboxItemsSource(null); }, []);

  // 處理篩選器變更
  const handleFilterChange = (newCategoryValue: string) => { setActiveFilter(newCategoryValue); setSelectedItem(null); };
  
  // 處理文件上傳
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        setSelectedFile(file);
        setImageUploadError(null);
        
        try {
          // 直接上傳到 Cloudinary
          const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          
          if (!uploadPreset || !cloudName) {
            throw new Error('缺少 Cloudinary 設定');
          }
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);
          
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary 上傳失敗: ${errorData.error?.message || '未知錯誤'}`);
          }
          
          const result = await response.json();
          // 使用 Cloudinary URL 而不是 base64
          setPreviewUrl(result.secure_url);
        } catch (error) {
          console.error('Image upload failed:', error);
          setImageUploadError(t('portfolioPage.imageUploadError'));
          setSelectedFile(null);
          setPreviewUrl(null);
        }
    } else {
        setImageUploadError(t('portfolioPage.imageUploadError'));
        setSelectedFile(null);
        setPreviewUrl(null);
    }
  };

  // 使用 AI 生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    try {
      if (!process.env.API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      
      // 現在 previewUrl 是 Cloudinary URL，不是 base64 數據
      // 我們需要下載圖片並轉換為 base64 來進行 AI 分析
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          if (base64Data) {
            resolve(base64Data);
          } else {
            reject(new Error("Failed to convert image to base64"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional photographer providing a title for a portfolio image. Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;
      
      const aiResponse = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash', 
        contents: { parts: [imagePart, { text: prompt }] }, 
        config: { responseMimeType: "application/json" } 
      });
      
      let jsonStr = aiResponse.text?.trim() || '';
      if (!jsonStr) {
        throw new Error("AI response is empty");
      }
      
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) { 
        setNewPhotoTitle(parsedData.titleEn); 
        setNewPhotoTitleZh(parsedData.titleZh); 
      } else { 
        throw new Error("AI response did not contain the expected JSON structure for titles."); 
      }
    } catch (e) {
      console.error("Failed to generate AI title:", e);
      alert("AI title generation failed. Please try again or write one manually.");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 提交表單（新增）
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPhotoTitle.trim() || !newPhotoTitleZh.trim() || !previewUrl || !newPhotoCategory) { 
      alert(t('portfolioPage.fillAllRequiredFields')); 
      return; 
    }
    
    try {
      // 使用後端 API 創建作品項目
      const newItemData = {
        imageUrl: previewUrl,
        title: newPhotoTitle,
        titleZh: newPhotoTitleZh,
        categoryKey: newPhotoCategory,
        isFeatured: false
      };
      
      // 調用後端 API
      const newItem = await ApiService.createPortfolioItem(newItemData);
      
      // 調用父組件的回調以更新狀態
      onAddPortfolioItem(newItem);
      handleCancelForm();
    } catch (error) {
      console.error('創建作品項目失敗:', error);
      alert('創建作品項目失敗，請重試');
    }
  };

  // Masonry 佈局的斷點設定
  const breakpointColumnsObj = { default: 4, 1199: 3, 767: 2, 500: 1 };

  return (
    <div>
      <motion.div {...sectionDelayShow(0)}> <SectionTitle titleKey="portfolioPage.title" subtitleKey="portfolioPage.subtitle" /> </motion.div>
      
      {/* 作品輪播 */}
      <motion.div className="my-12 relative overflow-hidden" variants={fadeInUpItemVariants} initial="initial" animate="animate">
        <PortfolioCarousel items={carouselItems} onItemClick={(item) => openLightbox(item, carouselItems)} />
      </motion.div>
      
      {/* 管理員操作按鈕 */}
      {isSuperUser && (
        <motion.div className="my-8 flex justify-center items-center space-x-4" {...sectionDelayShow(0.1)}>
          {isDeleteModeActive ? ( <> <button onClick={handleDeleteConfirmed} disabled={selectedIdsForDeletion.length === 0} className="button-theme-danger font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50 flex items-center"> <TrashIcon className="w-5 h-5 mr-2" /> {t('portfolioPage.confirmDeleteButton')} ({selectedIdsForDeletion.length}) </button> <button onClick={handleToggleDeleteMode} className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-colors">{t('portfolioPage.cancelButton')}</button> </> ) : ( <> <button onClick={handleShowAddForm} className="button-theme-accent font-semibold py-2 px-5 rounded-md transition-all flex items-center"> <PlusIcon className="w-5 h-5 mr-2" />{t('portfolioPage.addButton')} </button> <button onClick={handleToggleDeleteMode} className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-colors flex items-center"> <TrashIcon className="w-5 h-5 mr-2" />{t('portfolioPage.deleteButton')} </button> </> )}
        </motion.div>
      )}

      {/* 新增表單 */}
      <AnimatePresence>
        {isAdding && (
          <motion.div key="add-portfolio-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-12">
            <div className="bg-theme-secondary p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <h3 className="text-xl font-bold text-theme-primary">{t('portfolioPage.addFormTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* 左側：圖片上傳 */}
                    <div className="flex flex-col items-center justify-center">
                        <label htmlFor="photoUpload" className="cursor-pointer aspect-square w-full rounded-lg border-2 border-dashed border-theme-primary flex items-center justify-center bg-theme-tertiary/50 transition-colors hover:border-custom-cyan">
                            {previewUrl ? ( <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" /> ) : ( <div className="text-center text-theme-secondary p-4"> <CameraIcon className="w-12 h-12 mx-auto mb-2" /> <p className="text-sm">{t('blogPage.imagePreviewPlaceholder')}</p> </div> )}
                        </label>
                        <input type="file" id="photoUpload" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </div>
                    {/* 右側：詳細資訊與 AI 功能 */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="photoTitleEn" className="block text-sm font-medium text-theme-secondary mb-1">{t('portfolioPage.titleEnLabel')}</label>
                            <input type="text" id="photoTitleEn" value={newPhotoTitle} onChange={e => setNewPhotoTitle(e.target.value)} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('portfolioPage.titleEnPlaceholder')} />
                        </div>
                        <div>
                            <label htmlFor="photoTitleZh" className="block text-sm font-medium text-theme-secondary mb-1">{t('portfolioPage.titleZhLabel')}</label>
                            <input type="text" id="photoTitleZh" value={newPhotoTitleZh} onChange={e => setNewPhotoTitleZh(e.target.value)} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('portfolioPage.titleZhPlaceholder')} />
                        </div>
                        <div>
                            <label htmlFor="photoCategory" className="block text-sm font-medium text-theme-secondary mb-1">{t('portfolioPage.categoryLabel')}</label>
                            <div className="relative">
                                <select id="photoCategory" value={newPhotoCategory} onChange={e => setNewPhotoCategory(e.target.value)} required className={`w-full bg-theme-tertiary border border-theme-secondary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none ${!newPhotoCategory ? 'text-theme-secondary' : 'text-theme-primary'}`}>
                                    <option value="" disabled>{t('blogPage.categorySelectPlaceholder')}</option>
                                    {addProjectCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-theme-primary">
                            <button type="button" onClick={handleGenerateTitle} disabled={!previewUrl || isGeneratingTitle} className="w-full flex items-center justify-center button-theme-neutral font-semibold py-2.5 px-5 rounded-md transition-all disabled:opacity-50">
                                <SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingTitle ? 'animate-spin' : ''}`} />
                                {isGeneratingTitle ? t('portfolioPage.generatingTitle') : t('portfolioPage.generateAITitle')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4 border-t border-theme-primary"> <button type="submit" className={`button-theme-accent font-semibold py-2.5 px-6 rounded-md transition-all`}>{t('portfolioPage.saveProjectButton')}</button> <button type="button" onClick={handleCancelForm} className="button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-colors">{t('portfolioPage.cancelButton')}</button> </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 篩選與排序控制欄 */}
      <div className="my-8">
        {/* 桌面版 */}
        <div className="hidden md:relative md:flex md:items-center md:justify-center h-10">
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <AnimatePresence> {isDeleteModeActive && deletableItemsCount > 0 && ( <motion.div className="flex items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}> <input type="checkbox" id="select-all-deletable" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-0 cursor-pointer" checked={selectedIdsForDeletion.length === deletableItemsCount && deletableItemsCount > 0} onChange={handleSelectAllForDeletion} aria-label={t('portfolioPage.selectAllDeletableAriaLabel')} /> <label htmlFor="select-all-deletable" className="ml-2 text-sm text-theme-primary cursor-pointer">{t('portfolioPage.selectAllLabel')}</label> </motion.div> )} </AnimatePresence>
            </div>
            <motion.div className="flex items-center space-x-8" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
                {filterCategories.map((category) => ( <motion.button key={category} onClick={() => handleFilterChange(category)} className="relative text-lg font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap" variants={fadeInUpItemVariants}> <span className={activeFilter === category ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}> {t(category)} </span> {activeFilter === category && ( <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-custom-cyan" layoutId="portfolio-filter-underline" transition={{ type: 'spring', stiffness: 350, damping: 30 }} /> )} </motion.button> ))}
            </motion.div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="relative">
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className={`bg-theme-tertiary border border-theme-primary text-theme-primary text-sm font-medium rounded-md p-2 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer`} aria-label={t('blogPage.sortByLabel')}>
                        <option value="date-desc">{t('blogPage.sortDateDesc')}</option><option value="date-asc">{t('blogPage.sortDateAsc')}</option><option value="title-asc">{t('blogPage.sortTitleAsc')}</option><option value="title-desc">{t('blogPage.sortTitleDesc')}</option><option value="category-asc">{t('postManagementPage.sortCategoryAsc')}</option><option value="category-desc">{t('postManagementPage.sortCategoryDesc')}</option><option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option><option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div>
                </div>
            </div>
        </div>
        {/* 行動裝置版 */}
        <div className="md:hidden space-y-4">
            <div className="overflow-x-auto flex justify-center">
                <motion.div className="flex items-center space-x-4 sm:space-x-8 pb-2 w-max" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
                    {filterCategories.map((category) => ( <motion.button key={category} onClick={() => handleFilterChange(category)} className="relative text-base font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap" variants={fadeInUpItemVariants}> <span className={activeFilter === category ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}> {t(category)} </span> {activeFilter === category && ( <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-custom-cyan" layoutId="portfolio-filter-underline-mobile" /> )} </motion.button> ))}
                </motion.div>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <AnimatePresence> {isDeleteModeActive && deletableItemsCount > 0 && ( <motion.div className="flex items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}> <input type="checkbox" id="select-all-deletable-mobile" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-0 cursor-pointer" checked={selectedIdsForDeletion.length === deletableItemsCount && deletableItemsCount > 0} onChange={handleSelectAllForDeletion} aria-label={t('portfolioPage.selectAllDeletableAriaLabel')} /> <label htmlFor="select-all-deletable-mobile" className="ml-2 text-sm text-theme-primary cursor-pointer">{t('portfolioPage.selectAllLabel')}</label> </motion.div> )} </AnimatePresence>
                </div>
                <div>
                    <div className="relative">
                        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className={`bg-theme-tertiary border border-theme-primary text-theme-primary text-sm font-medium rounded-md p-2 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer`} aria-label={t('blogPage.sortByLabel')}>
                             <option value="date-desc">{t('blogPage.sortDateDesc')}</option><option value="date-asc">{t('blogPage.sortDateAsc')}</option><option value="title-asc">{t('blogPage.sortTitleAsc')}</option><option value="title-desc">{t('blogPage.sortTitleDesc')}</option><option value="category-asc">{t('postManagementPage.sortCategoryAsc')}</option><option value="category-desc">{t('postManagementPage.sortCategoryDesc')}</option><option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option><option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* 內容網格 */}
      {isLoading ? ( <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column"> {Array.from({ length: 9 }).map((_, index) => <PortfolioSkeletonCard key={index} index={index} />)} </Masonry> ) : (
        <>
          <motion.div transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
              {itemsToDisplay.map((item) => ( <motion.div key={item.id} layout variants={fadeInUpItemVariants} initial="initial" animate="animate" exit="initial" transition={{ duration: 0.5, delay: 0.05 }} className="w-full"> <PortfolioCard {...item} onClick={() => openLightbox(item, filteredItems)} isDeleteModeActive={isDeleteModeActive} isSelectedForDeletion={selectedIdsForDeletion.includes(item.id)} onToggleSelectionForDeletion={handleToggleSelectionForDeletion} isCardDisabled={isDeleteModeActive && !!item.isStatic} /> </motion.div> ))}
            </Masonry>
            {itemsToDisplay.length === 0 && ( <motion.div className="col-span-full text-center text-theme-secondary py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}> <p className="flex items-center justify-center space-x-2"> <span>{t(allPortfolioItems.length > 0 ? 'portfolioPage.noItemsFound' : 'portfolioPage.noItemsOnView')}</span> </p> </motion.div> )}
          </motion.div>
           {/* Loader for infinite scroll */}
          <div ref={loaderRef} className="h-10 text-center text-theme-secondary">
             {displayCount < filteredItems.length && !isLoading && t('loading')}
          </div>
        </>
      )}

      {/* 燈箱 */}
      {selectedItem && lightboxItemsSource && ( <Lightbox currentItem={selectedItem} filteredItems={lightboxItemsSource} onClose={closeLightbox} onSelectItem={setSelectedItem} /> )}
    </div>
  );
};