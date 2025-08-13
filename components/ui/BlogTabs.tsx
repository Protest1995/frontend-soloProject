// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';

// 定義單個標籤的數據結構
interface Tab {
  key: string;
  titleKey: string;
}

// 定義 BlogTabs 組件的屬性介面
interface BlogTabsProps {
  tabs: Tab[]; // 標籤列表
  activeTabKey: string; // 當前活動的標籤 key
  onTabClick: (key: string) => void; // 點擊標籤時的回調函數
}

/**
 * 部落格分類標籤頁組件。
 * 顯示一系列可點擊的分類標籤，並帶有動畫下劃線指示當前選中的標籤。
 */
const BlogTabs: React.FC<BlogTabsProps> = ({ tabs, activeTabKey, onTabClick }) => {
  const { t } = useTranslation();

  return (
    <div className="flex space-x-4 sm:space-x-8 border-b border-theme-primary overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabClick(tab.key)}
          className={`relative py-3 px-1 text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap
            ${activeTabKey === tab.key ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}
          `}
        >
          {t(tab.titleKey)}
          {/* 當前活動標籤的動畫下劃線 */}
          {activeTabKey === tab.key && (
            <motion.div
              className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-custom-cyan"
              layoutId="blog-tab-underline" // `layoutId` 用於在不同元素間創建共享佈局動畫
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default BlogTabs;
