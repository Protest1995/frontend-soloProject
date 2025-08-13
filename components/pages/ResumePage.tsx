

// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped } from 'framer-motion';
// 引入 UI 組件
import SectionTitle from '../ui/SectionTitle';
import SkillBar from '../ui/SkillBar';
import TimelineEvent from '../ui/TimelineEvent';
// 引入類型定義
import { Skill, TimelineItem } from '../../types';
// 引入圖標組件
import AcademicCapIcon from '../icons/AcademicCapIcon';
import BriefcaseIconWork from '../icons/BriefcaseIconWork';
import RocketIcon from '../icons/RocketIcon';
import WrenchScrewdriverIcon from '../icons/WrenchScrewdriverIcon';
// 引入動畫變體
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
// 引入顏色常數
import { ACCENT_COLOR, ACCENT_SOLID_BG_COLOR } from '../../constants'; 

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 工作經歷數據 (不含日期，日期單獨處理以保持結構清晰)
const experienceData: Omit<TimelineItem, 'date'>[] = [
  {
    titleKey: 'resumePage.exp1Title',
    institutionKey: 'resumePage.exp1Institution',
    descriptionKey: 'resumePage.exp1Description',
  },
];
const experienceDates = ['2024 - 2023'];

// 教育背景數據
const educationData: Omit<TimelineItem, 'date'>[] = [
  {
    titleKey: 'resumePage.edu1Title',
    institutionKey: 'resumePage.edu1Institution',
    descriptionKey: 'resumePage.edu1Description',
  },
  {
    titleKey: 'resumePage.edu2Title',
    institutionKey: 'resumePage.edu2Institution',
    descriptionKey: 'resumePage.edu2Description',
  },
];
const educationDates = ['2017 - 2013', '2013 - 2010'];

// 技能數據
const devSkills: Skill[] = [
    { nameKey: 'resumePage.skillApiDev', level: 95 },
    { nameKey: 'resumePage.skillReportDesign', level: 90 },
    { nameKey: 'resumePage.skillUiDesign', level: 92 },
    { nameKey: 'resumePage.skillDbMaint', level: 85 },
];
const videoSkills: Skill[] = [
    { nameKey: 'resumePage.skillVideoPhoto', level: 88 },
    { nameKey: 'resumePage.skillColor', level: 85 },
    { nameKey: 'resumePage.skillScriptStory', level: 82 },
    { nameKey: 'resumePage.skillEditSub', level: 92 },
];
const allSkills: Skill[] = [...devSkills, ...videoSkills];

// 工具數據
const devTools: { nameKey: string }[] = [ { nameKey: 'resumePage.toolVsCode' }, { nameKey: 'resumePage.toolIdea' }, { nameKey: 'resumePage.toolAndroidStudio' }, { nameKey: 'resumePage.toolGit' }, { nameKey: 'resumePage.toolPostman' }, { nameKey: 'resumePage.toolStimulsoft' }, { nameKey: 'resumePage.toolObsidian' }, ];
const videoTools: { nameKey: string }[] = [ { nameKey: 'resumePage.toolLightroom' }, { nameKey: 'resumePage.toolPhotoshop' }, { nameKey: 'resumePage.toolDavinci' }, { nameKey: 'resumePage.toolPremiere' }, { nameKey: 'resumePage.toolArctime' }, ];
const allTools: { nameKey: string }[] = [...devTools, ...videoTools];

/**
 * 履歷頁面組件。
 * 顯示個人履歷，包括工作經歷、教育背景、技能和使用的工具。
 */
const ResumePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      {/* 頁面標題 */}
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="resumePage.title" subtitleKey="resumePage.subtitle" />
      </motion.div>

      {/* 經歷與教育背景網格佈局 */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* 工作經歷區塊 */}
        <motion.div {...sectionDelayShow(0.2)}>
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <BriefcaseIconWork className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.experience')}
          </motion.h3>
          <motion.div className="relative" variants={staggerContainerVariants(0.2)} initial="initial" animate="animate">
            {/* 時間軸的垂直線 */}
            <motion.div 
              className="absolute top-0 bottom-0 left-[1px] w-0.5 bg-custom-cyan origin-top" 
              initial={{ scaleY: 0 }} 
              animate={{ scaleY: 1 }} 
              transition={{ duration: 1.5, ease: 'circOut' }} 
              aria-hidden="true" 
            />
            <div className="pl-6">
              {experienceData.map((item, index) => (
                <motion.div key={item.titleKey} variants={fadeInUpItemVariants} className={index < experienceData.length - 1 ? 'mb-6' : ''}>
                  <TimelineEvent date={experienceDates[index]} titleKey={item.titleKey} institutionKey={item.institutionKey} descriptionKey={item.descriptionKey} renderWithHeaders={true} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
        {/* 教育背景區塊 */}
        <motion.div {...sectionDelayShow(0.3)}> 
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <AcademicCapIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.education')}
          </motion.h3>
          <motion.div className="relative" variants={staggerContainerVariants(0.2)} initial="initial" animate="animate">
            <motion.div 
              className="absolute top-0 bottom-0 left-[1px] w-0.5 bg-custom-cyan origin-top" 
              initial={{ scaleY: 0 }} 
              animate={{ scaleY: 1 }} 
              transition={{ duration: 1.5, ease: 'circOut' }} 
              aria-hidden="true" 
            />
            <div className="pl-6">
              {educationData.map((item, index) => (
                <motion.div key={item.titleKey} variants={fadeInUpItemVariants} className={index < educationData.length - 1 ? 'mb-6' : ''}>
                  <TimelineEvent date={educationDates[index]} titleKey={item.titleKey} institutionKey={item.institutionKey} descriptionKey={item.descriptionKey} renderWithHeaders={true} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="space-y-16">
        {/* 技能區塊 */}
        <div>
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-8 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <RocketIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.skillsSubTitle')}
          </motion.h3>
          <motion.div className="grid sm:grid-cols-2 gap-x-8 gap-y-6" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
            {allSkills.map((skill) => (
              <motion.div key={skill.nameKey} variants={fadeInUpItemVariants}>
                <SkillBar nameKey={skill.nameKey} level={skill.level} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 工具區塊 */}
        <div>
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-8 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <WrenchScrewdriverIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.toolsSubTitle')}
          </motion.h3>
          <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3" variants={staggerContainerVariants(0.05)} initial="initial" animate="animate">
            {allTools.map((tool) => (
              <motion.div key={tool.nameKey} variants={fadeInUpItemVariants} className="flex items-center">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-3 ${ACCENT_SOLID_BG_COLOR}`}></span>
                <span className="text-theme-primary text-base font-medium">{t(tool.nameKey)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;