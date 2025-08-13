

// 引入 React 相關鉤子
import React, { useState } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped } from 'framer-motion';
// 引入 UI 組件
import SectionTitle from '../ui/SectionTitle';
// 引入顏色與樣式常數
import { ACCENT_COLOR, ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
// 引入圖標組件
import PhoneIcon from '../icons/PhoneIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import MapPinIcon from '../icons/MapPinIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import ClockIcon from '../icons/ClockIcon';
// 引入動畫變體
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import IdentificationIcon from '../icons/IdentificationIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

/**
 * 聯絡我頁面組件。
 * 提供一個聯絡表單讓訪客可以發送訊息，並顯示聯絡資訊。
 */
const ContactPage: React.FC = () => {
  // 使用翻譯鉤子
  const { t } = useTranslation();
  // 表單提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  
  // 處理表單提交事件
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    // 您的 Formspree 端點
    const formspreeEndpoint = 'https://formspree.io/f/mnnvvolg'; 

    // 檢查是否已配置 Formspree 端點
    if (formspreeEndpoint.includes('YOUR_FORMSPREE_ID')) {
      console.warn(t('contactPage.formspreeInfo'));
      setSubmitMessage(t('contactPage.formspreeSetupNeededError'));
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // 發送 POST 請求到 Formspree
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // 請求成功
        setSubmitStatus('success');
        setSubmitMessage(t('contactPage.messageSentSuccess'));
        form.reset(); // 清空表單
      } else {
        // 請求失敗
        const data = await response.json();
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          setSubmitMessage(data.errors.map((error: { message: string }) => error.message).join(', '));
        } else if (typeof data.error === 'string') {
          setSubmitMessage(data.error);
        }
        else {
          setSubmitMessage(t('contactPage.messageSentError'));
        }
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitMessage(t('contactPage.messageSentError'));
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 定義表單項目動畫的延遲時間
  const formItemDelay = 0.05;

  return (
    <div className="space-y-12">
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="contactPage.title" subtitleKey="contactPage.subtitle" />
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 左側：聯絡表單 */}
        <motion.div 
          className="md:col-span-2 bg-theme-secondary p-8 rounded-lg shadow-xl"
          {...sectionDelayShow(0.2)}
        >
          <motion.h3 
            className="text-2xl font-semibold text-theme-primary mb-6"
            variants={fadeInUpItemVariants} initial="initial" animate="animate"
          >
            {t('contactPage.sendMessageTitle')}
          </motion.h3>
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            variants={staggerContainerVariants(formItemDelay)}
            initial="initial"
            animate="animate"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div variants={fadeInUpItemVariants}>
                <label htmlFor="name" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.fullNameLabel')}</label>
                <input type="text" name="name" id="name" required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.fullNamePlaceholder')} />
              </motion.div>
              <motion.div variants={fadeInUpItemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.emailAddressLabel')}</label>
                <input type="email" name="email" id="email" required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.emailAddressPlaceholder')} />
              </motion.div>
            </div>
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="subject" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.subjectLabel')}</label>
              <input type="text" name="subject" id="subject" required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.subjectPlaceholder')} />
            </motion.div>
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="message" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.messageLabel')}</label>
              <textarea name="message" id="message" rows={5} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.messagePlaceholder')}></textarea>
            </motion.div>
            <motion.div variants={fadeInUpItemVariants}>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`button-theme-accent font-semibold py-3 px-6 rounded-md transition-all duration-300 shadow-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                <PaperAirplaneIcon className="w-5 h-5 mr-2 transform -rotate-45" />
                {isSubmitting ? t('contactPage.sendingMessage') : t('contactPage.sendMessageButton')}
              </button>
            </motion.div>
            {/* 顯示提交狀態訊息 */}
            {submitMessage && (
              <motion.p 
                variants={fadeInUpItemVariants}
                className={`mt-4 text-sm ${submitStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}
                aria-live="assertive"
              >
                {submitMessage}
              </motion.p>
            )}
          </motion.form>
        </motion.div>

        {/* 右側：聯絡資訊 */}
        <motion.div 
          className="space-y-6"
          {...sectionDelayShow(0.3)} 
        >
            <motion.h3 
              className="text-2xl font-semibold text-theme-primary mb-6 flex items-center"
              variants={fadeInUpItemVariants} initial="initial" animate="animate"
            >
              <IdentificationIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
              {t('contactPage.contactInfoTitle')}
            </motion.h3>
            <motion.div 
              className="bg-theme-secondary p-6 rounded-lg shadow-xl space-y-4"
              variants={staggerContainerVariants(0.1)} initial="initial" animate="animate"
            >
                <motion.div className="flex items-start" variants={fadeInUpItemVariants}>
                    <MapPinIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                    <div>
                        <h4 className="font-semibold text-theme-primary">{t('contactPage.addressLabel')}</h4>
                        <p className="text-theme-secondary">{t('contactPage.addressValue')}</p>
                    </div>
                </motion.div>
                 <motion.div className="flex items-start" variants={fadeInUpItemVariants}>
                    <PhoneIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                    <div>
                        <h4 className="font-semibold text-theme-primary">{t('contactPage.phoneLabel')}</h4>
                        <p className="text-theme-secondary">{t('contactPage.phoneValue')}</p>
                    </div>
                </motion.div>
                 <motion.div className="flex items-start" variants={fadeInUpItemVariants}>
                    <EnvelopeIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                    <div>
                        <h4 className="font-semibold text-theme-primary">{t('contactPage.emailLabel')}</h4>
                        <p className="text-theme-secondary break-all">{t('contactPage.emailValue')}</p>
                    </div>
                </motion.div>
            </motion.div>
            <motion.div 
              className="bg-theme-secondary p-6 rounded-lg shadow-xl"
              variants={fadeInUpItemVariants} initial="initial" animate="animate"
            >
              <div className="flex items-start">
                  <ClockIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                  <div>
                      <h4 className="font-semibold text-theme-primary">{t('contactPage.workingHoursTitle')}</h4>
                      <p className="text-theme-secondary">{t('contactPage.workingHoursDays')}</p>
                      <p className="text-theme-secondary">{t('contactPage.workingHoursWeekend')}</p>
                  </div>
              </div>
            </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;
