// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Swiper 相關組件和類型
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { Autoplay, EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
// 引入類型定義和圖標
import { PortfolioItemData } from '../../types';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

// 組件屬性介面
interface PortfolioCarouselProps {
  items: PortfolioItemData[]; // 要顯示的作品集項目列表
  onItemClick: (item: PortfolioItemData) => void; // 點擊項目時的回調
}

/**
 * 作品集輪播組件。
 * 使用 Swiper 庫創建一個具有 Coverflow 效果的響應式輪播。
 */
const PortfolioCarousel: React.FC<PortfolioCarouselProps> = ({ items, onItemClick }) => {
  const { t, i18n } = useTranslation();

  if (!items || items.length === 0) {
    return null;
  }

  /**
   * 處理 Swiper 點擊事件。
   * 如果點擊的是中心的活動 slide，則打開燈箱。
   * 如果點擊的是旁邊的 slide，則滾動到該 slide。
   * @param {SwiperCore} swiper - Swiper 實例。
   */
  const handleSwiperClick = (swiper: SwiperCore) => {
    if (!swiper.clickedSlide) return;

    if (swiper.clickedIndex === swiper.activeIndex) {
      // 點擊的是中心的活動 slide，打開燈箱
      const item = items[swiper.realIndex];
      if (item) {
        onItemClick(item);
      }
    } else if (swiper.clickedIndex > swiper.activeIndex) {
      // 點擊的是右側的 slide
      swiper.slideNext();
    } else {
      // 點擊的是左側的 slide
      swiper.slidePrev();
    }
  };

  return (
    <div className="portfolio-swiper-container">
      <Swiper
        // Swiper 模塊
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        // Coverflow 效果配置
        coverflowEffect={{
          rotate: 30,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        // 分頁器和導航按鈕的 DOM 選擇器
        pagination={{ el: '.swiper-pagination-custom', clickable: true }}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="mySwiper"
        onClick={handleSwiperClick}
      >
        {items.map((item) => {
          // 根據語言選擇顯示的標題
          const displayTitle = (i18n.language === 'zh-Hant' && item.titleZh) ? item.titleZh : (item.title || '');
          
          return (
            <SwiperSlide key={item.id}>
              <img src={item.imageUrl} alt={displayTitle} />
            </SwiperSlide>
          );
        })}
      </Swiper>
      {/* 自定義導航按鈕 */}
      <div className="swiper-button-prev-custom">
        <ChevronLeftIcon className="w-6 h-6" />
      </div>
      <div className="swiper-button-next-custom">
        <ChevronRightIcon className="w-6 h-6" />
      </div>
      {/* 自定義分頁器容器 */}
      <div className="swiper-pagination-custom"></div>
    </div>
  );
};

export default PortfolioCarousel;