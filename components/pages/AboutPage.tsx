

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import SectionTitle from '../ui/SectionTitle';
import ServiceCard from '../ui/ServiceCard';
import { ACCENT_COLOR, ACCENT_TEXT_GRADIENT_COLOR } from '../../constants';
import CodeIcon from '../icons/CodeIcon';
import PaletteIcon from '../icons/PaletteIcon';
import CameraIcon from '../icons/CameraIcon'; 
import PlayIcon from '../icons/PlayIcon';     
import CakeIcon from '../icons/CakeIcon';
import MapPinIcon from '../icons/MapPinIcon';
import PhoneIcon from '../icons/PhoneIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import { ServiceItem } from '../../types';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import GlobeAltIcon from '../icons/GlobeAltIcon';
import HeartIcon from '../icons/HeartIcon';
import FilmIcon from '../icons/FilmIcon';
import WeightIcon from '../icons/WeightIcon';
import SparklesIcon from '../icons/SparklesIcon';
import UsersGroupIcon from '../icons/UsersGroupIcon';

// 將 motionTyped 轉型為 any 以解決類型問題
const motion: any = motionTyped;

// "我的服務" 區塊的數據，不包含圖標
const servicesData: Omit<ServiceItem, 'icon'>[] = [
  {
    titleKey: 'aboutPage.serviceProgramDevelopmentTitle',
    descriptionKey: 'aboutPage.serviceProgramDevelopmentDesc',
  },
  {
    titleKey: 'aboutPage.serviceWebDesignTitle',
    descriptionKey: 'aboutPage.serviceWebDesignDesc',
  },
  {
    titleKey: 'aboutPage.servicePhotographyTitle',
    descriptionKey: 'aboutPage.servicePhotographyDesc',
  },
  {
    titleKey: 'aboutPage.serviceVideoPostProductionTitle',
    descriptionKey: 'aboutPage.serviceVideoPostProductionDesc',
  },
];

// 對應 "我的服務" 的圖標數組
const serviceIcons = [
  <CodeIcon />,    
  <PaletteIcon />, 
  <CameraIcon />,  
  <PlayIcon />,    
];

// "我的愛好" 區塊的數據，不包含圖標
const hobbiesData: Omit<ServiceItem, 'icon'>[] = [
  {
    titleKey: 'aboutPage.hobbyFilmStudyTitle',
    descriptionKey: 'aboutPage.hobbyFilmStudyDesc',
  },
  {
    titleKey: 'aboutPage.hobbyFitnessSportsTitle',
    descriptionKey: 'aboutPage.hobbyFitnessSportsDesc',
  },
  {
    titleKey: 'aboutPage.hobbyTalentExplorationTitle',
    descriptionKey: 'aboutPage.hobbyTalentExplorationDesc',
  },
  {
    titleKey: 'aboutPage.hobbyCommunicationSharingTitle',
    descriptionKey: 'aboutPage.hobbyCommunicationSharingDesc',
  },
];

// 對應 "我的愛好" 的圖標數組
const hobbyIcons = [
  <FilmIcon />,
  <WeightIcon />,
  <SparklesIcon />,
  <UsersGroupIcon />,
];

/**
 * 關於我頁面組件。
 * 顯示個人簡介、服務項目和興趣愛好。
 */
const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-16">
      {/* 關於我主要區塊，經過重新結構和放大 */}
      <motion.section 
        className="flex flex-col justify-center min-h-[60vh] md:min-h-[70vh]"
        variants={staggerContainerVariants(0.1, 0)}
        initial="initial"
        animate="animate"
      >
        <div className="mb-12">
            <SectionTitle titleKey="aboutPage.title" subtitleKey="aboutPage.subtitle" />
        </div>
        
        <div className="flex flex-col lg:grid lg:grid-cols-7 gap-x-12 gap-y-8 items-center">
            {/* 個人照片 - 在手機和中尺寸時在上方，大尺寸時在左側 */}
            <motion.div className="w-full max-w-md mx-auto lg:col-span-3 lg:max-w-none" variants={fadeInUpItemVariants}>
                <div className="service-card-wrapper shadow-xl">
                    <div className="service-card-inner">
                       <img src="/images/about-me.jpg" alt={t('sidebar.profileName')} className="w-full h-full object-cover" />
                    </div>
                </div>
            </motion.div>

            {/* 個人資訊 - 在手機和中尺寸時在下方，大尺寸時在右側 */}
            <motion.div 
                className="w-full lg:col-span-4 text-theme-secondary space-y-6 text-lg"
                variants={fadeInUpItemVariants}
            >
                <h3 className="text-4xl md:text-5xl font-semibold text-theme-primary">
                    {t('aboutPage.greetingText')} <span className={ACCENT_TEXT_GRADIENT_COLOR}>{t('sidebar.profileName')}</span>
                </h3>
                <p className="leading-relaxed">{t('aboutPage.bioFull')}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-4">
                    <li className="flex items-center">
                        <CakeIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div>
                            <strong className="text-theme-primary mr-2">{t('aboutPage.birthday')}:</strong> {t('aboutPage.birthdayValue', '1995/02/02')}
                        </div>
                    </li>
                    <li className="flex items-center">
                        <MapPinIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div>
                            <strong className="text-theme-primary mr-2">{t('aboutPage.address')}:</strong> {t('contactPage.addressValue')}
                        </div>
                    </li>
                    <li className="flex items-center">
                        <PhoneIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div>
                            <strong className="text-theme-primary mr-2">{t('aboutPage.phone')}:</strong> {t('contactPage.phoneValue')}
                        </div>
                    </li>
                    <li className="flex items-center">
                        <EnvelopeIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div className="break-all">
                            <strong className="text-theme-primary mr-2">{t('aboutPage.email')}:</strong> {t('contactPage.emailValue')}
                        </div>
                    </li>
                </ul>
            </motion.div>
        </div>
      </motion.section>
      
      {/* "我的服務" 區塊 */}
      <motion.div {...sectionDelayShow(0.4)}>
        <h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center justify-center">
            <GlobeAltIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('aboutPage.whatIDo')}
        </h3>
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainerVariants(0.15)}
          initial="initial"
          animate="animate"
        >
          {servicesData.map((service, index) => (
            <motion.div key={service.titleKey} variants={fadeInUpItemVariants} className="h-full">
              <ServiceCard 
                icon={React.cloneElement(serviceIcons[index], { className: `w-10 h-10 ${ACCENT_COLOR} mb-4` })}
                titleKey={service.titleKey}
                descriptionKey={service.descriptionKey}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* "我的愛好" 區塊 */}
      <motion.div {...sectionDelayShow(0.6)}>
        <h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center justify-center">
            <HeartIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('aboutPage.myHobbies')}
        </h3>
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainerVariants(0.15)}
          initial="initial"
          animate="animate"
        >
          {hobbiesData.map((hobby, index) => (
            <motion.div key={hobby.titleKey} variants={fadeInUpItemVariants} className="h-full">
              <ServiceCard 
                icon={React.cloneElement(hobbyIcons[index], { className: `w-10 h-10 ${ACCENT_COLOR} mb-4` })}
                titleKey={hobby.titleKey}
                descriptionKey={hobby.descriptionKey}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AboutPage;