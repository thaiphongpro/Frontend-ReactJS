import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IosAlert({
                                     show = false,
                                     title = "Xác nhận",
                                     message = "Bạn có chắc chắn muốn thực hiện hành động này?",
                                     confirmText = "Xóa",
                                     cancelText = "Hủy",
                                     isDanger = false,
                                     singleButton = false,
                                     onConfirm,
                                     onCancel
                                 }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
                >
                    {/* Hiệu ứng nảy (Spring animation) giống hệt iOS */}
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="bg-[var(--bg-elevated)]/90 backdrop-blur-2xl w-[270px] rounded-[14px] overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header Text */}
                        <div className="px-4 pt-5 pb-4 text-center">
                            <h3 className="font-semibold text-[17px] leading-snug text-[var(--label-primary)] mb-1">
                                {title}
                            </h3>
                            <p className="text-[13px] leading-tight text-[var(--label-secondary)]">
                                {message}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col border-t border-[var(--separator)]">
                            {!singleButton ? (
                                <div className="flex">
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 py-[11px] text-[17px] text-[var(--system-blue)] font-normal border-r border-[var(--separator)] hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${
                                            isDanger ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'
                                        }`}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={onConfirm}
                                    className="w-full py-[11px] text-[17px] text-[var(--system-blue)] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}