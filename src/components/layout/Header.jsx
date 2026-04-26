import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore.js';

export default function Header() {
    const location = useLocation();
    const { isDark, toggleTheme, currency, setCurrency, language, setLanguage } = useSettingsStore();

    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // =========================================================================
    // ĐA NGÔN NGỮ CHO TIÊU ĐỀ TRANG (Dùng trực tiếp state language)
    // =========================================================================
    const routeTitles = {
        en: {
            '/': 'Overview',
            '/dashboard': 'Overview',
            '/categories': 'Wallets & Tags',
            '/revenue': 'Money In',
            '/expense': 'Money Out',
            '/debts': 'Loans & Debts',
            '/calendar': 'Cash Flow',
            '/taxes': 'Tax Center',
            '/reports': 'Insights'
        },
        vi: {
            '/': 'Tổng quan',
            '/dashboard': 'Tổng quan',
            '/categories': 'Quản lý Danh mục',
            '/revenue': 'Ghi nhận Doanh Thu',
            '/expense': 'Quản lý Chi Phí',
            '/debts': 'Sổ Công Nợ',
            '/calendar': 'Lịch Dòng Tiền',
            '/taxes': 'Thuế & Giảm Trừ',
            '/reports': 'Báo cáo Phân tích'
        }
    };

    // Lấy tiêu đề theo ngôn ngữ hiện tại, nếu không có thì để mặc định 'Finance.'
    const displayTitle = routeTitles[language]?.[location.pathname] || 'Finance.';
    // =========================================================================

    // Fake Data Thông báo
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Loan Due Soon',
            message: 'Partner A loan is due for repayment tomorrow.',
            time: '10 min ago',
            isRead: false,
            type: 'warning'
        },
        {
            id: 2,
            title: 'Sync Completed',
            message: 'Monthly invoice data from GiayHub has been safely backed up.',
            time: '2 hours ago',
            isRead: false,
            type: 'success'
        },
        {
            id: 3,
            title: 'System Update',
            message: 'Finance. v1.2 has been updated with the new Apple Glassmorphism UI.',
            time: '1 day ago',
            isRead: true,
            type: 'info'
        }
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const toggleLanguage = () => setLanguage(language === 'vi' ? 'en' : 'vi');
    const toggleCurrency = (val) => setCurrency(val);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    // Logic Click Outside để đóng Dropdown Thông báo
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="apple-glass !rounded-[20px] mb-6 px-6 py-4 flex justify-between items-center sticky top-4 z-50 transition-all duration-300">

            <h2 className="text-[20px] font-black tracking-tight">{displayTitle}</h2>

            <div className="flex items-center gap-3 md:gap-4">

                {/* NÚT ĐỔI NGÔN NGỮ & TIỀN TỆ */}
                <div className="hidden sm:flex items-center bg-[var(--bg-elevated)] dark:bg-[var(--bg-elevated-secondary)] rounded-full p-1 border border-[var(--separator)] shadow-sm">
                    <button
                        onClick={toggleLanguage}
                        className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 outline-none ${language === 'vi' ? 'bg-[var(--label-primary)] text-[var(--bg-base)] shadow-sm' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}
                    >VI</button>
                    <button
                        onClick={toggleLanguage}
                        className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 outline-none ${language === 'en' ? 'bg-[var(--label-primary)] text-[var(--bg-base)] shadow-sm' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}
                    >EN</button>

                    <div className="w-[1px] h-3 bg-[var(--separator)] mx-1"></div>

                    <button
                        onClick={() => toggleCurrency('VND')}
                        className={`px-3.5 py-1.5 text-[13px] font-black rounded-full transition-all duration-300 outline-none ${currency === 'VND' ? 'text-[var(--system-orange)]' : 'text-[var(--label-secondary)] hover:text-[var(--system-orange)]'}`}
                    >₫</button>
                    <button
                        onClick={() => toggleCurrency('USD')}
                        className={`px-3.5 py-1.5 text-[13px] font-black rounded-full transition-all duration-300 outline-none ${currency === 'USD' ? 'text-[var(--system-orange)]' : 'text-[var(--label-secondary)] hover:text-[var(--system-orange)]'}`}
                    >$</button>
                </div>

                {/* NÚT ĐỔI THEME SÁNG/TỐI */}
                <button
                    onClick={toggleTheme}
                    className="apple-btn-icon !w-10 !h-10 !bg-[var(--bg-elevated)] dark:!bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] shadow-sm text-[var(--label-secondary)] hover:!text-[var(--label-primary)] hover:!bg-[var(--bg-base)] transition-all"
                >
                    {!isDark ? (
                        <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                    ) : (
                        <svg className="sf-icon sf-icon-bold w-4 h-4 text-[var(--system-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    )}
                </button>

                {/* KHU VỰC THÔNG BÁO */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative apple-btn-icon !w-10 !h-10 !bg-[var(--bg-elevated)] dark:!bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] shadow-sm text-[var(--label-primary)] hover:!bg-[var(--bg-base)] transition-all"
                    >
                        <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        {unreadCount > 0 && (
                            <span className="absolute top-[8px] right-[10px] w-[9px] h-[9px] bg-[var(--system-red)] rounded-full border-[1.5px] border-[var(--bg-elevated)] dark:border-[var(--bg-elevated-secondary)] shadow-sm"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute right-0 mt-4 w-80 sm:w-96 apple-glass !rounded-[24px] overflow-hidden z-[999] origin-top-right shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-[var(--separator)]"
                            >
                                <div className="px-5 py-4 border-b border-[var(--separator)] flex justify-between items-center bg-[var(--bg-elevated)]">
                                    <h3 className="text-[16px] font-bold">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[12px] font-bold text-[var(--system-blue)] hover:opacity-80 outline-none transition-opacity">
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[360px] overflow-y-auto custom-scrollbar bg-[var(--bg-elevated-secondary)]">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                                                <svg className="sf-icon sf-icon-regular w-6 h-6 text-[var(--label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                            </div>
                                            <p className="caption font-medium">You're all caught up.</p>
                                        </div>
                                    ) : (
                                        notifications.map(note => (
                                            <div key={note.id}
                                                 className={`p-4 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer flex gap-4 border-b border-[var(--separator)] last:border-b-0 ${!note.isRead ? 'bg-[var(--system-blue)]/5' : ''}`}
                                                 onClick={() => markAsRead(note.id)}>
                                                <div className="shrink-0 mt-1">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${note.type === 'warning' ? 'bg-[var(--system-orange)]/10 text-[var(--system-orange)]' : note.type === 'info' ? 'bg-[var(--system-blue)]/10 text-[var(--system-blue)]' : 'bg-[var(--system-green)]/10 text-[var(--system-green)]'}`}>
                                                        {note.type === 'warning' && <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                                                        {note.type === 'success' && <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                                                        {note.type === 'info' && <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <p className={`text-[14px] font-bold text-[var(--label-primary)] leading-tight ${note.isRead ? 'opacity-80' : ''}`}>{note.title}</p>
                                                        <span className="text-[10px] font-semibold text-[var(--label-tertiary)] whitespace-nowrap ml-2">{note.time}</span>
                                                    </div>
                                                    <p className="caption leading-snug line-clamp-2 mt-1">{note.message}</p>
                                                </div>

                                                {!note.isRead && (
                                                    <div className="shrink-0 flex items-center justify-center w-2">
                                                        <div className="w-2 h-2 bg-[var(--system-blue)] rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--separator)] text-center">
                                    <button className="text-[13px] font-bold text-[var(--system-blue)] hover:opacity-80 transition-opacity outline-none">View All</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* AVATAR NGƯỜI DÙNG */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA771C] text-[var(--bg-elevated)] flex items-center justify-center font-black text-[15px] shadow-glow-gold ring-2 ring-[var(--bg-base)] cursor-pointer hover:scale-105 transition-transform">
                    {/* Bạn có thể thay bằng chữ cái đầu của tên người dùng thật sau này */}
                    P
                </div>
            </div>
        </header>
    );
}