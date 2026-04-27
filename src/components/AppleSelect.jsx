import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronsUpDown, Search, Check } from 'lucide-react';

export default function AppleSelect({
                                        value,
                                        onChange,
                                        options = [],
                                        label,
                                        error,
                                        placeholder = 'Chọn...',
                                        searchable = false
                                    }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    useEffect(() => {
        if (!isOpen) setSearchQuery('');
    }, [isOpen]);

    // Tọa độ Portal
    useEffect(() => {
        if (isOpen) {
            const updatePosition = () => {
                if (triggerRef.current) {
                    const rect = triggerRef.current.getBoundingClientRect();
                    const isDropUpCalc = rect.top > window.innerHeight / 1.8;
                    const isAlignRightCalc = rect.left > window.innerWidth / 2;

                    setDropdownStyle({
                        top: isDropUpCalc ? 'auto' : rect.bottom + 8,
                        bottom: isDropUpCalc ? window.innerHeight - rect.top + 8 : 'auto',
                        left: isAlignRightCalc ? 'auto' : rect.left,
                        right: isAlignRightCalc ? window.innerWidth - rect.right : 'auto',
                        width: rect.width
                    });
                }
            };
            updatePosition();
            window.addEventListener('resize', updatePosition);

            const handleScroll = (e) => {
                if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
                setIsOpen(false);
            };
            window.addEventListener('scroll', handleScroll, true);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }
    }, [isOpen]);

    const normalizedOptions = useMemo(() => {
        return options.map(opt => {
            if (typeof opt === 'object' && opt !== null) return opt;
            return { label: String(opt), value: opt, logo: null, subLabel: null };
        });
    }, [options]);

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchQuery) return normalizedOptions;
        const query = searchQuery.toLowerCase();
        return normalizedOptions.filter(opt =>
            opt.label.toLowerCase().includes(query) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(query)) ||
            String(opt.value).toLowerCase().includes(query)
        );
    }, [normalizedOptions, searchable, searchQuery]);

    const selected = useMemo(() => normalizedOptions.find(opt => opt.value === value), [normalizedOptions, value]);

    const selectOption = (opt) => {
        onChange(opt.value);
        setIsOpen(false);
    };

    return (
        <div className="w-full text-left relative">
            {label && (
                <label className="block text-[11px] font-semibold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">
                    {label}
                </label>
            )}

            <div
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative z-10 flex items-center justify-between w-full bg-[var(--bg-elevated)] border shadow-sm rounded-xl px-3 py-2.5 text-[13px] outline-none cursor-pointer transition-all ${
                    error ? 'border-[var(--system-red)] ring-[3px] ring-[var(--system-red)]/30' : 'border-[var(--border-subtle)] hover:border-[var(--separator)]'
                } ${isOpen && !error ? 'ring-[3px] ring-[#D4AF37]/30 border-[#D4AF37]' : ''}`}
            >
                <div className="flex items-center overflow-hidden">
                    {selected?.logo && (
                        <img src={selected.logo} alt="logo" className="w-5 h-5 mr-2 rounded-full object-contain bg-white p-0.5 border border-gray-100 flex-shrink-0 no-dim" />
                    )}
                    <div className="flex items-center gap-1 truncate">
                        <span className={selected ? 'text-[var(--label-primary)] font-bold' : 'text-[var(--label-secondary)] font-medium'}>
                            {selected?.label || placeholder}
                        </span>
                        {selected?.subLabel && (
                            <span className="text-[var(--label-secondary)] text-[11px] font-normal">
                                ({selected.subLabel})
                            </span>
                        )}
                    </div>
                </div>
                <ChevronsUpDown className={`sf-icon sf-icon-regular w-4 h-4 text-[var(--label-secondary)] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-viet-gold' : ''}`} />
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-[99998]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>

                            <motion.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, scaleY: 0.95, y: -10 }}
                                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                                exit={{ opacity: 0, scaleY: 0.95, y: -5 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                style={{ ...dropdownStyle, originY: 0 }}
                                className="fixed z-[99999] bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-[14px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
                            >
                                {searchable && (
                                    <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated-secondary)]">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 sf-icon sf-icon-bold w-3.5 h-3.5 text-[var(--label-secondary)]" />
                                            <input
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                type="text"
                                                placeholder="Tìm kiếm..."
                                                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[13px] font-medium text-[var(--label-primary)] rounded-[8px] pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition-all shadow-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* DANH SÁCH NGUYÊN THỦY: Vứt bỏ ảo hóa, dùng flex-col xếp dọc chuẩn chỉ */}
                                <div className="overflow-y-auto max-h-64 py-1 custom-scrollbar w-full flex flex-col">
                                    {filteredOptions.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-[12px] font-medium text-[var(--label-secondary)]">
                                            Không tìm thấy kết quả
                                        </div>
                                    ) : (
                                        filteredOptions.map((opt, index) => (
                                            <div
                                                key={opt.value || index}
                                                onClick={() => selectOption(opt)}
                                                className={`flex items-center justify-between px-3 py-2 text-[13px] cursor-pointer transition-colors hover:bg-[var(--bg-elevated)] ${
                                                    value === opt.value ? 'bg-[#D4AF37]/10 text-viet-gold' : 'text-[var(--label-primary)]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {opt.logo && (
                                                        <img src={opt.logo} alt="logo" className="w-6 h-6 rounded bg-white p-0.5 border border-[var(--border-subtle)] no-dim object-contain" />
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className={value === opt.value ? 'font-bold' : 'font-medium'}>{opt.label}</span>
                                                        {opt.subLabel && (
                                                            <span className={`text-[10px] font-medium ${value === opt.value ? 'text-viet-gold/70' : 'text-[var(--label-tertiary)]'}`}>
                                                                {opt.subLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {value === opt.value && (
                                                    <Check className="sf-icon sf-icon-bold w-4 h-4 text-viet-gold" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {error && (
                <p className="text-[var(--system-red)] text-[11px] mt-1.5 pl-1 font-medium">{error}</p>
            )}
        </div>
    );
}