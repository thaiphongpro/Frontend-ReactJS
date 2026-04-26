import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AppleModal({
                                       show = false,
                                       title,
                                       confirmText = 'Lưu',
                                       isDanger = false,
                                       onClose,
                                       onConfirm,
                                       children
                                   }) {
    const [mounted, setMounted] = useState(false);

    // Đảm bảo document.body đã sẵn sàng trước khi dùng createPortal
    useEffect(() => {
        setMounted(true);
    }, []);

    // UX CAO CẤP: Khóa cuộn nền (Scroll Lock) và Hỗ trợ phím ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show) {
                onClose();
            }
        };

        if (show) {
            // Khóa không cho trang bên dưới cuộn khi Modal đang mở
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        // Dọn dẹp sự kiện khi Component unmount
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [show, onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onConfirm) onConfirm();
    };

    const modalContent = (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Lớp Overlay đen mờ */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    ></motion.div>

                    {/* Form Content - Hiệu ứng nảy Scale */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-md bg-[var(--bg-elevated)] rounded-[24px] shadow-2xl flex flex-col mx-4 overflow-hidden border border-[var(--separator)]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[var(--separator)] flex justify-between items-center bg-[var(--bg-elevated-secondary)]/50">
                            <h3 className="text-[17px] font-black tracking-tight text-[var(--label-primary)]">{title}</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-[var(--label-secondary)] hover:text-[var(--system-red)] transition-colors outline-none apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm"
                            >
                                <X className="sf-icon sf-icon-bold w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[var(--bg-elevated-secondary)]/50 flex justify-end gap-3 border-t border-[var(--separator)]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-[var(--label-secondary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--separator)] hover:text-[var(--label-primary)] transition-all outline-none shadow-sm hover:shadow-md"
                            >
                                Hủy
                            </button>

                            <button
                                type="submit"
                                className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 outline-none text-[var(--bg-base)] ${
                                    isDanger
                                        ? 'bg-[var(--system-red)] hover:bg-[#ff2a1f] shadow-[0_4px_14px_0_rgba(255,59,48,0.3)] hover:shadow-[0_6px_20px_0_rgba(255,59,48,0.4)]'
                                        : 'bg-gradient-to-r from-[#D4AF37] to-[#AA771C] hover:brightness-110 shadow-[0_4px_14px_0_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_0_rgba(212,175,55,0.4)]'
                                }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.form>
                </div>
            )}
        </AnimatePresence>
    );

    if (!mounted) return null;

    return createPortal(modalContent, document.body);
}