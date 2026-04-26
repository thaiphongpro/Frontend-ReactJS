import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore.js';

export default function AppleInputNumber({ value, onChange, label, error, placeholder = '0', disabled = false }) {
    // Lấy tiền tệ hiện tại từ Store (VND hoặc USD)
    const { currency } = useSettingsStore();

    // 1. Tự động đổi ký hiệu tiền tệ
    const symbol = currency === 'USD' ? '$' : '₫';

    // 2. Tự động đổi dấu phân cách (USD dùng phẩy, VND dùng chấm)
    const formatSeparator = currency === 'USD' ? ',' : '.';
    const display = value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, formatSeparator) || '';

    const handleInput = (e) => {
        // Chỉ giữ lại các ký tự số
        const rawValue = e.target.value.replace(/\D/g, '');
        if (!rawValue) {
            onChange(null);
            return;
        }
        const num = parseInt(rawValue, 10);
        onChange(isNaN(num) ? null : num);
    };

    return (
        <div className="space-y-1 w-full">
            {label && (
                <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5 pl-1">
                    {label}
                </label>
            )}

            <div className="relative flex items-center">
                <span className="absolute left-3 text-[var(--label-tertiary)] font-bold text-[15px]">
                    {symbol}
                </span>

                <input
                    type="text"
                    inputMode="numeric" // Bật bàn phím số trên Mobile
                    value={display}
                    onChange={handleInput}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full bg-[var(--bg-elevated)] border rounded-xl pl-8 pr-3 py-2.5 text-[15px] font-black tabular-nums tracking-tight outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] ${
                        disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-elevated-secondary)]' : 'text-[var(--label-primary)] hover:border-[var(--separator)]'
                    } ${
                        error ? '!border-[var(--system-red)] !focus:ring-[var(--system-red)]/30' : 'border-[var(--border-subtle)]'
                    }`}
                />
            </div>

            {error && (
                <p className="text-[var(--system-red)] text-[11px] mt-1 px-1 font-medium">{error}</p>
            )}
        </div>
    );
}