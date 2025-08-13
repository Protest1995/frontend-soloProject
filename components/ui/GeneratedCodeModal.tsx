import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '../icons/CloseIcon';
import ClipboardCopyIcon from '../icons/ClipboardCopyIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

interface GeneratedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  jsonCode: string;
  imageFileName: string;
  targetPath: string;
}

const GeneratedCodeModal: React.FC<GeneratedCodeModalProps> = ({ isOpen, onClose, title, jsonCode, imageFileName, targetPath }) => {
  const modalRoot = document.getElementById('lightbox-root');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setCopied(false), 300); // Reset after closing
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!modalRoot) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-theme-secondary rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-auto flex flex-col"
            style={{ maxHeight: '90vh' }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="modal-title"
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 id="modal-title" className="text-xl font-semibold text-theme-primary">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-full text-theme-secondary hover:bg-theme-hover hover:text-theme-primary transition-colors" aria-label="Close">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                <div>
                    <h4 className="font-semibold text-theme-primary mb-2">Step 1: Copy JSON Code</h4>
                    <p className="text-sm text-theme-secondary mb-2">
                        Click the button to copy the code, then open the file <code className="bg-theme-tertiary text-custom-cyan px-1 py-0.5 rounded">{targetPath}</code> in your editor and paste it at the beginning of the array (right after the opening <code className="bg-theme-tertiary text-custom-cyan px-1 rounded">[</code> and before the first existing item). Add a comma after your new item if it's not the last one.
                    </p>
                    <div className="relative">
                        <pre className="bg-theme-tertiary p-4 rounded-md text-sm text-theme-primary overflow-x-auto">
                        <code>{jsonCode}</code>
                        </pre>
                        <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md bg-theme-secondary hover:bg-theme-hover transition-colors">
                        {copied ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <ClipboardCopyIcon className="w-5 h-5 text-theme-secondary" />}
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-theme-primary mb-2">Step 2: Move Image File</h4>
                    <p className="text-sm text-theme-secondary">
                        Find the image file <code className="bg-theme-tertiary text-custom-cyan px-1 py-0.5 rounded">{imageFileName}</code> on your computer and move it into the following folder in your project:
                    </p>
                    <p className="bg-theme-tertiary text-custom-cyan p-2 mt-2 rounded-md text-sm">public/images/{targetPath.includes('Posts') ? 'posts' : 'portfolio'}/</p>
                </div>
            </div>

            <div className="mt-6 flex justify-end flex-shrink-0">
              <button
                onClick={onClose}
                className="button-theme-accent text-zinc-900 font-semibold py-2 px-5 rounded-md transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, modalRoot);
};

export default GeneratedCodeModal;
