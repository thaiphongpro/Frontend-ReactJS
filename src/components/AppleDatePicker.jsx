import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';

export default function AppleDatePicker({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const [isDropUp, setIsDropUp] = useState(false);
    const [isSelectingMonthYear, setIsSelectingMonthYear] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});

    // Sync viewDate when value changes from outside
    useEffect(() => {
        if (value) {
            const parts = value.split('-');
            if (parts.length === 3) {
                setViewDate(new Date(parts[0], parts[1] - 1, parts[2]));
            }
        }
    }, [value]);

    // Reset view when closing
    useEffect(() => {
        if (!isOpen) setIsSelectingMonthYear(false);
    }, [isOpen]);

    const togglePicker = () => {
        setIsOpen(!isOpen);
    };

    // =========================================================================
    // LOGIC TÍNH TỌA ĐỘ PORTAL (Chống bị che khuất bởi Modal)
    // =========================================================================
    useEffect(() => {
        if (isOpen) {
            const updatePosition = () => {
                if (triggerRef.current) {
                    const rect = triggerRef.current.getBoundingClientRect();
                    const isDropUpCalc = rect.top > window.innerHeight / 1.8;
                    const isAlignRightCalc = rect.left > window.innerWidth / 2;

                    setIsDropUp(isDropUpCalc);

                    setDropdownStyle({
                        top: isDropUpCalc ? 'auto' : rect.bottom + 8,
                        bottom: isDropUpCalc ? window.innerHeight - rect.top + 8 : 'auto',
                        left: isAlignRightCalc ? 'auto' : rect.left,
                        right: isAlignRightCalc ? window.innerWidth - rect.right : 'auto'
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

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const monthName = monthNames[viewDate.getMonth()];
    const currentYear = viewDate.getFullYear();

    const daysInMonth = new Date(currentYear, viewDate.getMonth() + 1, 0).getDate();
    const blankDays = new Date(currentYear, viewDate.getMonth(), 1).getDay();

    const prevMonth = () => setViewDate(new Date(currentYear, viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(currentYear, viewDate.getMonth() + 1, 1));

    const prevYear = () => setViewDate(new Date(currentYear - 1, viewDate.getMonth(), 1));
    const nextYear = () => setViewDate(new Date(currentYear + 1, viewDate.getMonth(), 1));

    const selectMonth = (monthIndex) => {
        setViewDate(new Date(currentYear, monthIndex, 1));
        setIsSelectingMonthYear(false);
    };

    const selectDate = (day) => {
        const d = new Date(currentYear, viewDate.getMonth(), day);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localIsoDate = new Date(d - tzOffset).toISOString().split('T')[0];

        onChange(localIsoDate);
        setIsOpen(false);
    };

    const isSelected = (day) => {
        if (!value) return false;
        const [y, m, d] = value.split('-').map(Number);
        return y === currentYear && m === viewDate.getMonth() + 1 && d === day;
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getFullYear() === currentYear && today.getMonth() === viewDate.getMonth() && today.getDate() === day;
    };

    const formattedDate = useMemo(() => {
        if (!value) return '';
        return value.split('-').reverse().join('/');
    }, [value]);

    return (
        <div className="relative w-full">
            {/* TRIGGER INPUT */}
            <div
                ref={triggerRef}
                onClick={togglePicker}
                className={`w-full bg-[var(--bg-elevated)] border rounded-[10px] p-2.5 text-[13px] text-[var(--label-primary)] outline-none cursor-pointer flex justify-between items-center transition-all shadow-sm z-10 relative ${
                    isOpen ? 'ring-[3px] ring-[var(--system-orange)]/30 border-[var(--system-orange)]' : 'border-[var(--border-subtle)] hover:border-[var(--separator)]'
                }`}
            >
                <span className={`font-medium ${!value ? 'text-[var(--label-secondary)] font-normal' : ''}`}>
                    {formattedDate || label || 'Chọn ngày...'}
                </span>
                <Calendar className="sf-icon sf-icon-regular w-4 h-4 text-[var(--label-secondary)]" />
            </div>

            {/* REACT PORTAL: Bắn Lịch ra ngoài <body> */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* LỚP MÀN CLICK OUTSIDE */}
                            <div className="fixed inset-0 z-[99998]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>

                            {/* DROPDOWN CALENDAR */}
                            <motion.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, y: isDropUp ? 10 : -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: isDropUp ? 10 : -10, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                style={{ ...dropdownStyle, originY: isDropUp ? 1 : 0 }}
                                className="fixed z-[99999] p-4 bg-[var(--bg-elevated)]/95 backdrop-blur-2xl border border-[var(--separator)] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] w-[260px]"
                            >
                                {/* HEADER ĐIỀU HƯỚNG */}
                                <div className="flex justify-between items-center mb-4">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsSelectingMonthYear(!isSelectingMonthYear); }}
                                        className="font-bold text-[15px] text-[var(--label-primary)] pl-1 hover:text-[var(--system-orange)] cursor-pointer transition-colors flex items-center gap-1.5 select-none"
                                    >
                                        {isSelectingMonthYear ? currentYear : `${monthName} ${currentYear}`}
                                        <ChevronRight
                                            className={`sf-icon sf-icon-bold w-3.5 h-3.5 text-[var(--system-orange)] transition-transform duration-300 ${isSelectingMonthYear ? 'rotate-90' : ''}`}
                                        />
                                    </div>

                                    <div className="flex gap-3 pr-1">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); isSelectingMonthYear ? prevYear() : prevMonth(); }}
                                            className="text-[var(--system-orange)] hover:opacity-70 transition-opacity outline-none"
                                        >
                                            <ChevronLeft className="sf-icon sf-icon-bold w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); isSelectingMonthYear ? nextYear() : nextMonth(); }}
                                            className="text-[var(--system-orange)] hover:opacity-70 transition-opacity outline-none"
                                        >
                                            <ChevronRight className="sf-icon sf-icon-bold w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* CHỌN NGÀY */}
                                {!isSelectingMonthYear ? (
                                    <div>
                                        <div className="grid grid-cols-7 gap-1 mb-2">
                                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                                                <div key={day} className="text-center text-[10px] font-bold text-[var(--label-tertiary)]">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                                            {Array.from({ length: blankDays }).map((_, i) => (
                                                <div key={`blank${i}`} className="w-8 h-8"></div>
                                            ))}

                                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                                const date = i + 1;
                                                return (
                                                    <button
                                                        key={date}
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); selectDate(date); }}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] outline-none transition-all duration-200 mx-auto ${
                                                            isSelected(date)
                                                                ? 'bg-[var(--system-orange)] text-[var(--bg-base)] font-bold shadow-sm'
                                                                : isToday(date)
                                                                    ? 'text-[var(--system-orange)] font-bold bg-[var(--system-orange)]/10'
                                                                    : 'text-[var(--label-primary)] hover:bg-[var(--bg-elevated-secondary)] font-medium'
                                                        }`}
                                                    >
                                                        {date}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    // CHỌN THÁNG
                                    <div className="grid grid-cols-3 gap-2 pb-2">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); selectMonth(i); }}
                                                className={`py-2.5 text-[13px] font-medium rounded-xl outline-none transition-all duration-200 ${
                                                    viewDate.getMonth() === i
                                                        ? 'bg-[var(--system-orange)] text-[var(--bg-base)] font-bold shadow-sm'
                                                        : 'text-[var(--label-primary)] hover:bg-[var(--system-orange)]/10 hover:text-[var(--system-orange)]'
                                                }`}
                                            >
                                                Tháng {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}