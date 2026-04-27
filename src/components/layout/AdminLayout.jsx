import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, LayoutGrid, Tag, ArrowDownToLine, ArrowUpToLine,
    Users, CalendarDays, Calculator, PieChart, Menu, X, LockKeyhole
} from 'lucide-react';

import Header from './Header';
import Footer from './Footer';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import logoImg from '../../assets/logo-1.png';

export default function AdminLayout() {
    // Chỉ dùng state này cho Mobile Menu
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const location = useLocation();
    const { language } = useSettingsStore();

    const [isLocked, setIsLocked] = useState(!localStorage.getItem('app_pin'));
    const [pinInput, setPinInput] = useState('');

    useEffect(() => {
        const handleLock = () => setIsLocked(true);
        window.addEventListener('lock_app', handleLock);
        return () => window.removeEventListener('lock_app', handleLock);
    }, []);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (pinInput.length >= 4) {
            localStorage.setItem('app_pin', pinInput);
            setIsLocked(false);
            setPinInput('');
            window.location.reload();
        }
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const openMobileMenu = () => setIsMobileMenuOpen(true);

    const menuDict = {
        vi: { home: "Trang chủ", overview: "Tổng quan", categories: "Ví & Nhãn", revenue: "Tiền vào", expense: "Tiền ra", debts: "Vay & Nợ", calendar: "Lịch", taxes: "Thuế", reports: "Báo cáo" },
        en: { home: "Home", overview: "Overview", categories: "Wallets", revenue: "Money In", expense: "Money Out", debts: "Loans", calendar: "Calendar", taxes: "Taxes", reports: "Reports" }
    };
    const getMenuLabel = (key) => menuDict[language]?.[key] || menuDict['vi'][key];

    // Dữ liệu Menu để map cho lẹ
    const menuItems = [
        { path: "/", icon: Home, label: getMenuLabel('home'), exact: true },
        { path: "/dashboard", icon: LayoutGrid, label: getMenuLabel('overview') },
        { path: "/categories", icon: Tag, label: getMenuLabel('categories') },
        { path: "/revenue", icon: ArrowDownToLine, label: getMenuLabel('revenue') },
        { path: "/expense", icon: ArrowUpToLine, label: getMenuLabel('expense') },
        { path: "/debts", icon: Users, label: getMenuLabel('debts') },
        { path: "/calendar", icon: CalendarDays, label: getMenuLabel('calendar') },
        { path: "/taxes", icon: Calculator, label: getMenuLabel('taxes') },
        { path: "/reports", icon: PieChart, label: getMenuLabel('reports') }
    ];

    return (
        <div className="flex min-h-screen bg-transparent transition-colors duration-300 selection:bg-[var(--system-orange)]/20 overflow-x-hidden relative">
            <div className="fixed inset-0 z-0 pointer-events-none trong-dong-pattern"></div>

            {/* ========================================================= */}
            {/* 1. MÀN HÌNH ĐIỆN THOẠI (MOBILE COMPONENTS)                */}
            {/* ========================================================= */}

            {/* Màn đen mờ Mobile */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        onClick={closeMobileMenu}
                        className="md:hidden fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm cursor-pointer"
                    ></motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR DÀNH RIÊNG CHO ĐIỆN THOẠI (Rộng 256px - Có chữ) */}
            <aside className={`md:hidden fixed inset-y-0 left-0 w-64 apple-glass !rounded-l-none !border-y-0 !border-l-0 transition-transform duration-300 flex flex-col py-6 px-4 z-[100] pb-safe ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <button onClick={closeMobileMenu} className="absolute right-4 top-6 p-2 z-50 text-[var(--label-secondary)] active:text-[var(--system-red)] outline-none cursor-pointer">
                    <X className="w-7 h-7" />
                </button>

                <div className="flex items-center justify-center px-2 mb-8 pt-safe h-20">
                    <div className="logo-custom w-44 h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoImg})` }}></div>
                </div>

                <nav className="flex-1 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar pr-1 w-full block">
                    {menuItems.map((item, idx) => (
                        <MobileNavItem key={idx} {...item} onClick={closeMobileMenu} />
                    ))}
                </nav>
            </aside>

            {/* THANH HEADER DÀNH RIÊNG CHO ĐIỆN THOẠI (Chứa nút 3 gạch) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 pt-safe apple-glass !rounded-none !border-x-0 !border-t-0 shadow-sm">
                <div className="flex items-center h-10">
                    <div className="logo-custom w-32 h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoImg})` }}></div>
                </div>
                <button onClick={openMobileMenu} className="p-2 text-[var(--label-primary)] outline-none bg-transparent border-none cursor-pointer">
                    <Menu className="w-7 h-7" />
                </button>
            </div>


            {/* ========================================================= */}
            {/* 2. MÀN HÌNH MÁY TÍNH (DESKTOP COMPONENTS)                 */}
            {/* ========================================================= */}

            {/* SIDEBAR DÀNH RIÊNG CHO MÁY TÍNH (Rộng 88px - Chỉ Icon) */}
            <aside className="hidden md:flex fixed inset-y-0 left-0 w-[88px] apple-glass !rounded-l-none !border-y-0 !border-l-0 flex-col py-6 px-4 z-[100] pb-safe group hover:w-64 transition-all duration-300">
                <div className="flex items-center justify-center px-2 mb-8 pt-safe h-14 group-hover:h-20 transition-all duration-300">
                    <div className="logo-custom w-12 h-12 group-hover:w-44 group-hover:h-full transition-all duration-300 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoImg})` }}></div>
                </div>

                <nav className="flex-1 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar pr-1 w-full block">
                    {menuItems.map((item, idx) => (
                        <DesktopNavItem key={idx} {...item} />
                    ))}
                </nav>
            </aside>

            {/* ========================================================= */}
            {/* 3. MAIN CONTENT (CHUNG)                                   */}
            {/* ========================================================= */}
            <main className="flex-1 w-full max-w-full flex flex-col min-h-screen relative z-10 transition-all duration-300 md:ml-[88px] pt-[72px] md:pt-0">
                <div className="p-4 md:p-8 pb-safe flex-1 flex flex-col relative w-full overflow-x-hidden">
                    <Header />

                    <div className="flex-1 relative w-full mt-4 md:mt-0">
                        <div className={`h-full transition-all duration-700 ease-in-out ${isLocked ? 'blur-[10px] pointer-events-none select-none opacity-30 grayscale-[30%]' : 'blur-0 opacity-100'}`}>
                            <AnimatePresence mode="wait">
                                <motion.div key={location.pathname} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.2, ease: "easeOut" }} className="h-full">
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Ô Khóa Vàng */}
                        <AnimatePresence>
                            {isLocked && (
                                <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="absolute inset-0 z-50 flex items-center justify-center p-4">
                                    <div className="apple-glass p-8 rounded-[32px] w-full max-w-[340px] flex flex-col items-center shadow-2xl border border-[var(--border-subtle)] relative">
                                        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-[32px] pointer-events-none"></div>
                                        <div className="w-16 h-16 rounded-[20px] bg-[var(--bg-elevated)] border border-[#D4AF37]/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                            <LockKeyhole className="w-8 h-8 text-[#D4AF37]" strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-[20px] font-black text-[var(--label-primary)] mb-2 tracking-tight">Vui Lòng Nhập Mã PIN</h3>
                                        <form onSubmit={handleUnlock} className="w-full relative z-10 mt-6">
                                            <input type="password" inputMode="numeric" autoFocus value={pinInput} onChange={e => setPinInput(e.target.value)} className="w-full text-center text-[26px] tracking-[0.4em] font-black p-4 bg-[var(--bg-elevated-secondary)] border-2 border-[var(--separator)] rounded-2xl outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all shadow-inner mb-6 text-[var(--label-primary)]" placeholder="••••" />
                                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-[#1A1514] font-black text-[15px] rounded-2xl hover:brightness-110 hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all outline-none">MỞ KHÓA</button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <Footer />
                </div>
            </main>
        </div>
    );
}

// NÚT BẤM RIÊNG CHO MOBILE (Luôn hiện chữ)
function MobileNavItem({ to, icon: Icon, label, onClick, exact }) {
    return (
        <NavLink to={to} onClick={onClick} end={exact} className={({ isActive }) => `flex items-center w-full px-3 py-3 mb-1.5 rounded-xl transition-colors relative outline-none cursor-pointer ${isActive ? 'bg-[var(--system-orange)]/20 text-[var(--system-orange)] font-bold' : 'text-[var(--label-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--label-primary)] font-medium'}`}>
            <Icon className="sf-icon sf-icon-regular w-6 h-6 shrink-0" />
            <span className="ml-3.5 whitespace-nowrap tracking-wide text-[15px] block">{label}</span>
        </NavLink>
    );
}

// NÚT BẤM RIÊNG CHO DESKTOP (Ẩn chữ, hiện khi hover)
function DesktopNavItem({ to, icon: Icon, label, exact }) {
    return (
        <NavLink to={to} end={exact} className={({ isActive }) => `flex items-center w-full px-3 py-3 mb-1.5 rounded-xl transition-colors relative outline-none cursor-pointer overflow-hidden ${isActive ? 'bg-[var(--system-orange)]/20 text-[var(--system-orange)] font-bold' : 'text-[var(--label-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--label-primary)] font-medium'}`}>
            <Icon className="sf-icon sf-icon-regular w-6 h-6 shrink-0" />
            <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto group-hover:ml-3.5 transition-all duration-300 whitespace-nowrap tracking-wide text-[15px] block">{label}</span>
        </NavLink>
    );
}