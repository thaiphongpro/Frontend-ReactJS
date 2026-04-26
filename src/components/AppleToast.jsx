import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../store/useToastStore.js';

export default function AppleToast() {
    // Lấy danh sách toast và hàm xóa từ "Két sắt"
    const { toasts, removeToast } = useToastStore();

    // Cấu hình UI đồng bộ theo từng loại thông báo (Màu sắc, Icon, Viền, Đổ bóng)
    const getConfig = (type) => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-[var(--system-green)]',
                    icon: <Check className="w-4 h-4 text-white sf-icon-bold" />,
                    glow: 'shadow-[0_4px_20px_-4px_rgba(52,199,89,0.4)]',
                    border: 'border-[var(--system-green)]/20'
                };
            case 'error':
                return {
                    bg: 'bg-[var(--system-red)]',
                    icon: <X className="w-4 h-4 text-white sf-icon-bold" />,
                    glow: 'shadow-[0_4px_20px_-4px_rgba(255,59,48,0.4)]',
                    border: 'border-[var(--system-red)]/20'
                };
            case 'warning':
                return {
                    bg: 'bg-[#FF9500]',
                    icon: <AlertTriangle className="w-4 h-4 text-white sf-icon-bold" />,
                    glow: 'shadow-[0_4px_20px_-4px_rgba(255,149,0,0.4)]',
                    border: 'border-[#FF9500]/20'
                };
            default: // info
                return {
                    bg: 'bg-[var(--system-blue)]',
                    icon: <Info className="w-4 h-4 text-white sf-icon-bold" />,
                    glow: 'shadow-[0_4px_20px_-4px_rgba(0,122,255,0.4)]',
                    border: 'border-[var(--system-blue)]/20'
                };
        }
    };

    return (
        <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-3 items-center pointer-events-none"
            aria-live="polite" // Hỗ trợ Accessibility cho trình đọc màn hình
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => {
                    const config = getConfig(toast.type);
                    return (
                        <motion.div
                            key={toast.id}
                            layout // Tự động trượt mượt mà khi có thông báo mới chèn vào
                            initial={{ opacity: 0, y: -40, scale: 0.85, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            // Chuyển sang hiệu ứng Lò xo (Spring) chuẩn Apple thay vì Linear/Ease cũ
                            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 1 }}
                            className={`pointer-events-auto flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-elevated)]/85 backdrop-blur-2xl border ${config.border} rounded-[20px] min-w-[280px] max-w-md ${config.glow}`}
                        >
                            {/* Cục Icon tròn */}
                            <div className={`${config.bg} w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-inner`}>
                                {config.icon}
                            </div>

                            {/* Nội dung chữ */}
                            <p className="text-[14px] font-semibold tracking-tight text-[var(--label-primary)] flex-1 line-clamp-2 leading-tight">
                                {toast.message}
                            </p>

                            {/* Nút X tắt thông báo */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="w-7 h-7 rounded-full hover:bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:text-[var(--label-primary)] flex items-center justify-center transition-colors outline-none shrink-0"
                            >
                                <X className="w-4 h-4 sf-icon-bold" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}