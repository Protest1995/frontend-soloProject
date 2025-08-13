import React, { useState, useCallback, ChangeEvent, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import { BlogPostData, Page } from '../../types';
import SectionTitle from '../ui/SectionTitle';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CameraIcon from '../icons/CameraIcon';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { ApiService } from '../../src/services/api';

// 將 motionTyped 轉型為 any 以解決類型問題
const motion: any = motionTyped;

// 部落格文章分類選項
const blogCategoryOptions = [
    { value: 'blogPage.categoryPhotography', labelKey: 'blogPage.categoryPhotography' },
    { value: 'blogPage.categorySoloLearningDiary', labelKey: 'blogPage.categorySoloLearningDiary' },
    { value: 'blogPage.categoryToolSharing', labelKey: 'blogPage.categoryToolSharing' },
];

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

// 新增部落格文章頁面的屬性介面
interface AddBlogPostPageProps {
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  onSave: (postData: BlogPostData) => void; // 保存文章的回調
  isAuthenticated: boolean; // 用戶是否登入
  isSuperUser: boolean; // 是否為超級用戶
  navigateToLogin: () => void; // 導航到登入頁的函數
}

/**
 * 新增部落格文章頁面組件。
 * 提供一個表單讓超級用戶可以創建新的部落格文章，並支持 AI 生成標題和內容。
 */
const AddBlogPostPage: React.FC<AddBlogPostPageProps> = ({
  navigateTo,
  onSave,
  isAuthenticated,
  isSuperUser,
  navigateToLogin,
}) => {
  const { t } = useTranslation();

  // 表單狀態
  const [title, setTitle] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [content, setContent] = useState('');
  const [contentZh, setContentZh] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // UI 狀態
  const [activeContentLang, setActiveContentLang] = useState<'en' | 'zh'>('en'); // 當前內容編輯器語言
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');

  // AI 相關狀態
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 監聽主題變化以更新編輯器顏色模式
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

  // 取消新增並返回部落格主頁
  const handleCancel = useCallback(() => {
    navigateTo(Page.Blog);
  }, [navigateTo]);
  
  // 處理文件選擇變更
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
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
          setImageUploadError(t('blogPage.imageUploadError'));
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      } else {
        setSelectedFile(null);
        setPreviewUrl(null);
        setImageUploadError(t('blogPage.imageUploadError'));
      }
    }
  };

  // 使用 AI 生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle || isGeneratingContent) return;

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
      const prompt = `You are a professional blog writer. Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" },
      });

      let jsonStr = aiResponse.text?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();

      if (!jsonStr) {
        throw new Error("AI response is empty");
      }

      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) {
        setTitle(parsedData.titleEn);
        setTitleZh(parsedData.titleZh);
      } else {
        throw new Error("AI response did not contain the expected JSON structure for titles.");
      }
    } catch (e) {
      console.error("Failed to generate AI title:", e);
      alert("AI 標題生成失敗，請再試一次或手動填寫。");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 使用 AI 生成內容
  const handleGenerateContent = async () => {
    if (!previewUrl || isGeneratingContent || isGeneratingTitle) return;

    setIsGeneratingContent(true);
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
      const prompt = `You are a professional blog writer. Analyze this image. Write a short, engaging blog post excerpt/summary about it (around 150-200 words). Respond with a single JSON object containing two keys: "contentEn" for the English content and "contentZh" for the Traditional Chinese content.`;
      
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" },
      });
      
      let jsonStr = aiResponse.text?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();

      if (!jsonStr) {
        throw new Error("AI response is empty");
      }

      const parsedData = JSON.parse(jsonStr);
      if (parsedData.contentEn && parsedData.contentZh) {
        setContent(parsedData.contentEn);
        setContentZh(parsedData.contentZh);
      } else {
        throw new Error("AI response did not contain the expected JSON structure for content.");
      }
    } catch (e) {
      console.error("Failed to generate AI content:", e);
      alert("AI 內容生成失敗，請再試一次或手動填寫。");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSuperUser) {
      navigateToLogin();
      return;
    }
    if (!previewUrl || !title.trim() || !titleZh.trim() || !content.trim() || !contentZh.trim() || !categoryKey) {
      alert(t('blogPage.fillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const postData = {
        imageUrl: previewUrl,
        title,
        titleZh,
        content,
        contentZh,
        excerpt: content.substring(0, 150),
        excerptZh: contentZh.substring(0, 150),
        categoryKey,
        isLocked: false,
        isFeatured: false
      };

      const newPost = await ApiService.createPost(postData);
      
      // 調用 onSave 回調以更新父組件狀態
      onSave(newPost);
      
      // 導航到新文章的詳情頁
      navigateTo(Page.BlogPostDetail, newPost);
    } catch (error) {
      console.error('創建文章失敗:', error);
      alert('創建文章失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <motion.div {...sectionDelayShow(0)} className="flex justify-between items-center">
        <SectionTitle titleKey="blogPage.addFormTitle" />
        <button
          onClick={handleCancel}
          className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all flex items-center"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('blogPage.backToBlog')}
        </button>
      </motion.div>

      <motion.div
        className="bg-theme-secondary p-8 rounded-lg shadow-xl max-w-4xl mx-auto"
        variants={staggerContainerVariants(0.05)}
        initial="initial"
        animate="animate"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* 圖片上傳 */}
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="postImage" className="block text-sm font-medium text-theme-secondary mb-2">{t('blogPage.imageLabel')}</label>
            <label htmlFor="postImage" className="cursor-pointer aspect-video w-full rounded-lg border-2 border-dashed border-theme-primary flex items-center justify-center bg-theme-tertiary/50 transition-colors hover:border-custom-cyan">
                {previewUrl ? (
                    <img src={previewUrl} alt={t('blogPage.imagePreviewAlt')} className="max-h-full max-w-full object-contain rounded-md" />
                ) : (
                    <div className="text-center text-theme-secondary p-4">
                        <CameraIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">{t('blogPage.imagePreviewPlaceholder')}</p>
                    </div>
                )}
            </label>
            <input type="file" id="postImage" accept="image/*" onChange={handleFileChange} className="hidden" />
            {imageUploadError && <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>}
          </motion.div>

          {/* 分類選擇 */}
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="postCategory" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.categoryLabel')}</label>
            <div className="relative">
              <select 
                id="postCategory" 
                value={categoryKey} 
                onChange={e => setCategoryKey(e.target.value)} 
                required 
                className={`w-full bg-theme-tertiary border border-theme-secondary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer ${!categoryKey ? 'text-theme-secondary' : 'text-theme-primary'}`} 
              >
                <option value="" disabled>{t('blogPage.categorySelectPlaceholder')}</option>
                {blogCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary">
                <ChevronDownIcon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          {/* 標題輸入 */}
          <motion.div variants={fadeInUpItemVariants} className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="postTitleEn" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.titleEnLabel')}</label>
              <input id="postTitleEn" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('blogPage.titleEnPlaceholder')} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} />
            </div>
            <div>
              <label htmlFor="postTitleZh" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.titleZhLabel')}</label>
              <input id="postTitleZh" type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder={t('blogPage.titleZhPlaceholder')} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} />
            </div>
          </motion.div>

          {/* 內容編輯器 */}
          <motion.div variants={fadeInUpItemVariants}>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-theme-secondary">
                    {t('blogPage.contentLabel')}
                </label>
                <div className="flex space-x-1 p-0.5 bg-theme-tertiary rounded-lg">
                    <button type="button" onClick={() => setActiveContentLang('en')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeContentLang === 'en' ? 'bg-theme-secondary shadow' : 'text-theme-secondary hover:text-theme-primary'}`}>{t('blogPage.editorLangEn')}</button>
                    <button type="button" onClick={() => setActiveContentLang('zh')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeContentLang === 'zh' ? 'bg-theme-secondary shadow' : 'text-theme-secondary hover:text-theme-primary'}`}>{t('blogPage.editorLangZh')}</button>
                </div>
            </div>
             <div className="wmde-wrapper" data-color-mode={colorMode}>
                <MDEditor
                    height={300}
                    value={activeContentLang === 'en' ? content : contentZh}
                    onChange={(val) => {
                        if (activeContentLang === 'en') {
                            setContent(val || '');
                        } else {
                            setContentZh(val || '');
                        }
                    }}
                    previewOptions={{
                        rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
                        className: 'prose prose-custom-styles max-w-none'
                    }}
                />
            </div>
          </motion.div>

          {/* AI 功能按鈕 */}
          <motion.div variants={fadeInUpItemVariants} className="space-y-3 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <button type="button" onClick={handleGenerateTitle} disabled={!previewUrl || isGeneratingTitle || isGeneratingContent} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50`}>
                <SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingTitle ? 'animate-spin' : ''}`} />
                {isGeneratingTitle ? t('blogPage.generatingTitle') : t('blogPage.generateAITitle')}
              </button>
              <button type="button" onClick={handleGenerateContent} disabled={!previewUrl || isGeneratingContent || isGeneratingTitle} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50`}>
                <SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingContent ? 'animate-spin' : ''}`} />
                {isGeneratingContent ? t('blogPage.generatingContent') : t('blogPage.generateAIContent')}
              </button>
            </div>
            <p className="text-xs text-theme-muted text-center mt-2">{t('blogPage.aiFeatureInfo')}</p>
          </motion.div>

          {/* 表單操作按鈕 */}
          <motion.div variants={fadeInUpItemVariants} className="flex justify-end space-x-4 pt-4 border-t border-theme-primary">
            <button type="submit" disabled={isSubmitting} className={`${ACCENT_BG_COLOR} ${ACCENT_BG_HOVER_COLOR} text-zinc-900 font-semibold py-2.5 px-6 rounded-md transition-all disabled:opacity-50`}>
              {t('blogPage.savePostButton')}
            </button>
            <button type="button" onClick={handleCancel} className="button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-colors">{t('blogPage.cancelButton')}</button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddBlogPostPage;