
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '../icons/CloseIcon';
import ClipboardCopyIcon from '../icons/ClipboardCopyIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

interface BatchCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearBatch: () => void;
  title: string;
  jsonCode: string;
  targetPath: string;
}

const BatchCodeModal: React.FC<BatchCodeModalProps> = ({ isOpen, onClose, onClearBatch, title, jsonCode, targetPath }) => {
  const modalRoot = document.getElementById('lightbox-root');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setCopied(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCopy = () => {
    // We remove the outer brackets from the copied text for easier pasting
    const codeToCopy = JSON.parse(jsonCode).map((item: any) => JSON.stringify(item, null, 2)).join(',\n');
    navigator.clipboard.writeText(codeToCopy).then(() => {
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
                    <h4 className="font-semibold text-theme-primary mb-2">步驟: 複製並貼上 JSON 程式碼</h4>
                    <p className="text-sm text-theme-secondary mb-2">
                        圖片已自動上傳至雲端！您唯一需要做的就是複製以下程式碼，然後打開檔案 <code className="bg-theme-tertiary text-custom-cyan px-1 py-0.5 rounded">{targetPath}</code>，將其貼到陣列的開頭 (在第一個 <code className="bg-theme-tertiary text-custom-cyan px-1 rounded">[</code> 之後)。請確保在您貼上的內容和原有的第一個項目之間加上一個逗號。
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
            </div>

            <div className="mt-6 flex justify-end flex-shrink-0">
              <button
                onClick={onClearBatch}
                className="button-theme-accent text-zinc-900 font-semibold py-2 px-5 rounded-md transition-all"
              >
                清除批次並關閉
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, modalRoot);
};

export default BatchCodeModal;