import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const SectionDivider: React.FC<{ title?: string }> = ({ title }) => {
  const ref = useRef(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: title ? 0 : 0.1,
      },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 0.8, ease: 'easeInOut' as const },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3 },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="max-w-4xl mx-auto pt-8 pb-8 flex items-center"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      aria-hidden="true"
    >
      {title ? (
        <div className="flex w-full items-center gap-4 sm:gap-6">
          <motion.div className="h-px flex-grow" style={{ backgroundColor: 'var(--border-primary)', transformOrigin: 'right' }} variants={lineVariants} />
          <motion.h3 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider text-theme-primary text-center whitespace-nowrap" variants={titleVariants}>
            {title}
          </motion.h3>
          <motion.div className="h-px flex-grow" style={{ backgroundColor: 'var(--border-primary)', transformOrigin: 'left' }} variants={lineVariants} />
        </div>
      ) : (
        null
      )}
    </motion.div>
  );
};

export default SectionDivider;