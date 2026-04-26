import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, LayoutGrid, Tag, ArrowDownToLine, ArrowUpToLine,
    Users, CalendarDays, Calculator, PieChart, ChevronLeft,
    ChevronRight, Menu, X, LockKeyhole
} from 'lucide-react';

import Header from './Header';
import Footer from './Footer';

// IMPORT ZUSTAND ĐỂ LẤY NGÔN NGỮ
import { useSettingsStore } from '../../store/useSettingsStore.js';

// IMPORT LOGO
import logoImg from '../../assets/logo-1.png';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const location = useLocation();

    // Lấy biến language từ Store
    const { language } = useSettingsStore();

    // ==========================================
    // STATE BẢO MẬT: Kiểm soát việc hiển thị ổ khóa
    // ==========================================
    const [isLocked, setIsLocked] = useState(!localStorage.getItem('app_pin'));
    const [pinInput, setPinInput] = useState('');

    useEffect(() => {
        // Lắng nghe tín hiệu báo động từ useApi.js
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
            // Nhập xong load lại trang 1 lần để API gọi lấy dữ liệu thật
            window.location.reload();
        }
    };
    // ==========================================

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const closeOnMobile = () => {
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    // ==========================================
    // FIX LỖI KẸT SIDEBAR TRÊN MOBILE
    // ==========================================
    useEffect(() => {
        let lastWidth = window.innerWidth;
        const handleResize = () => {
            const currentWidth = window.innerWidth;
            // Chỉ chạy logic đóng mở khi chiều NGANG thực sự thay đổi
            // (Phớt lờ việc cuộn trang làm đổi chiều cao trên điện thoại)
            if (currentWidth !== lastWidth) {
                setIsSidebarOpen(currentWidth >= 768);
                lastWidth = currentWidth;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // TỪ ĐIỂN CHO MENU
    const menuDict = {
        vi: {
            home: "Trang chủ",
            overview: "Tổng quan",
            categories: "Ví & Nhãn",
            revenue: "Tiền vào",
            expense: "Tiền ra",
            debts: "Vay & Nợ",
            calendar: "Lịch",
            taxes: "Thuế",
            reports: "Báo cáo"
        },
        en: {
            home: "Home",
            overview: "Overview",
            categories: "Wallets",
            revenue: "Money In",
            expense: "Money Out",
            debts: "Loans",
            calendar: "Calendar",
            taxes: "Taxes",
            reports: "Reports"
        }
    };

    // Hàm lấy chữ theo ngôn ngữ hiện tại
    const getMenuLabel = (key) => menuDict[language]?.[key] || menuDict['vi'][key];

    return (
        <div className="flex min-h-screen bg-transparent transition-colors duration-300 selection:bg-[var(--system-orange)]/20 overflow-x-hidden">

            {/* Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none trong-dong-pattern"></div>

            {/* Overlay Mobile (Đã tối ưu để có thể chạm vào phần nền tối tắt menu) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-[90] backdrop-blur-sm cursor-pointer"
                    ></motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 apple-glass !rounded-l-none !border-y-0 !border-l-0 transition-transform duration-300 flex flex-col py-6 px-4 z-[100] group pb-safe ${
                    isSidebarOpen
                        ? 'translate-x-0 w-64 shadow-2xl md:shadow-none'
                        : '-translate-x-full md:translate-x-0 w-64 md:w-[88px]'
                }`}
            >
                <button
                    onClick={toggleSidebar}
                    className="hidden md:flex absolute -right-3.5 top-10 apple-btn-icon shadow-sm bg-[var(--bg-elevated)] border border-[var(--separator)] z-50 text-[var(--label-primary)] hover:text-[var(--system-orange)]"
                >
                    {isSidebarOpen ? (
                        <ChevronLeft className="sf-icon sf-icon-bold w-4 h-4" />
                    ) : (
                        <ChevronRight className="sf-icon sf-icon-bold w-4 h-4" />
                    )}
                </button>

                {/* NÚT X ĐÓNG MENU (Đã fix lỗi bị Tai thỏ iPhone che khuất) */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden absolute right-4 z-50 apple-btn-icon !bg-[var(--bg-elevated)] border border-[var(--separator)] text-[var(--label-secondary)] hover:!text-[var(--system-red)] shadow-lg"
                    style={{ top: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}
                >
                    <X className="sf-icon sf-icon-bold w-4 h-4" />
                </button>

                <div className={`flex items-center justify-center px-2 mb-8 pt-safe overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'h-20' : 'h-14'}`}>
                    <div className={`logo-custom transition-all duration-300 bg-contain bg-center bg-no-repeat ${isSidebarOpen ? 'w-44 h-full' : 'w-12 h-12'}`} style={{ backgroundImage: `url(${logoImg})` }}></div>
                </div>

                <nav className="flex-1 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar pr-1 w-full">
                    <NavItem to="/" icon={Home} label={getMenuLabel('home')} isOpen={isSidebarOpen} onClick={closeOnMobile} exact />
                    <NavItem to="/dashboard" icon={LayoutGrid} label={getMenuLabel('overview')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/categories" icon={Tag} label={getMenuLabel('categories')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/revenue" icon={ArrowDownToLine} label={getMenuLabel('revenue')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/expense" icon={ArrowUpToLine} label={getMenuLabel('expense')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/debts" icon={Users} label={getMenuLabel('debts')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/calendar" icon={CalendarDays} label={getMenuLabel('calendar')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/taxes" icon={Calculator} label={getMenuLabel('taxes')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                    <NavItem to="/reports" icon={PieChart} label={getMenuLabel('reports')} isOpen={isSidebarOpen} onClick={closeOnMobile} />
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main
                className={`flex-1 w-full max-w-full flex flex-col min-h-screen relative z-10 transition-all duration-300 ${
                    isSidebarOpen ? 'md:ml-64' : 'md:ml-[88px]'
                }`}
            >
                {/* Mobile Header (Cho màn hình nhỏ) */}
                <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 pt-safe apple-glass !rounded-none !border-x-0 !border-t-0 shadow-sm">
                    <div className="flex items-center h-10">
                        <div className="logo-custom w-32 h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoImg})` }}></div>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="apple-btn-icon !bg-[var(--bg-elevated)] border border-[var(--separator)] text-[var(--label-primary)] outline-none"
                    >
                        <Menu className="sf-icon sf-icon-bold w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 md:p-8 pb-safe flex-1 flex flex-col relative w-full overflow-x-hidden">
                    {/* Header nằm NGOÀI vùng bị mờ */}
                    <Header />

                    <div className="flex-1 relative w-full mt-4 md:mt-0">

                        {/* VÙNG DỮ LIỆU CHÍNH - BỊ LÀM MỜ NẾU ISLOCKED = TRUE */}
                        <div className={`h-full transition-all duration-700 ease-in-out ${isLocked ? 'blur-[10px] pointer-events-none select-none opacity-30 grayscale-[30%]' : 'blur-0 opacity-100'}`}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="h-full"
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Ô KHÓA HIỂN THỊ NỔI LÊN TRÊN KHI isLocked = TRUE */}
                        <AnimatePresence>
                            {isLocked && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="absolute inset-0 z-50 flex items-center justify-center p-4"
                                >
                                    <div className="apple-glass p-8 rounded-[32px] w-full max-w-[340px] flex flex-col items-center shadow-2xl border border-[var(--border-subtle)] relative">
                                        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-[32px] pointer-events-none"></div>

                                        {/* Icon Ổ Khóa Vàng */}
                                        <div className="w-16 h-16 rounded-[20px] bg-[var(--bg-elevated)] border border-[#D4AF37]/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                            <LockKeyhole className="w-8 h-8 text-[#D4AF37]" strokeWidth={2.5} />
                                        </div>

                                        <h3 className="text-[20px] font-black text-[var(--label-primary)] mb-2 tracking-tight">Vui Lòng Nhập Mã PIN</h3>
                                        <p className="caption text-center mb-8 text-[13px]">Nhập mã PIN để giải mã và hiển thị dữ liệu tài chính.</p>

                                        <form onSubmit={handleUnlock} className="w-full relative z-10">
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                autoFocus
                                                value={pinInput}
                                                onChange={e => setPinInput(e.target.value)}
                                                className="w-full text-center text-[26px] tracking-[0.4em] font-black p-4 bg-[var(--bg-elevated-secondary)] border-2 border-[var(--separator)] rounded-2xl outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all shadow-inner mb-6 text-[var(--label-primary)]"
                                                placeholder="••••"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-[#1A1514] font-black text-[15px] rounded-2xl hover:brightness-110 hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all outline-none"
                                            >
                                                MỞ KHÓA
                                            </button>
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

// ==========================================
// COMPONENT MENU ITEM (Đã Fix Lỗi Tàng Hình Chữ Bằng Inline Style)
// ==========================================
// CẬP NHẬT NAV ITEM: ÉP SAFARI RENDER BẰNG GPU
function NavItem({ to, icon: Icon, label, isOpen, onClick, exact }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            end={exact}
            className={({ isActive }) =>
                `nav-item relative group/item flex items-center w-full ${isActive ? 'router-link-active' : ''}`
            }
        >
            <Icon className={`sf-icon sf-icon-regular w-5 h-5 shrink-0 transition-colors duration-200`} />

            <div
                className="transition-all duration-300 font-medium whitespace-nowrap overflow-hidden"
                style={{
                    opacity: isOpen ? 1 : 0,
                    maxWidth: isOpen ? '200px' : '0px',
                    marginLeft: isOpen ? '12px' : '0px',
                    visibility: isOpen ? 'visible' : 'hidden',
                    // ĐÂY LÀ "THẦN CHÚ" TRỊ SAFARI: Ép nó dùng GPU vẽ lại chữ
                    transform: 'translateZ(0)',
                    WebkitTransform: 'translateZ(0)'
                }}
            >
                {label}
            </div>

            {!isOpen && (
                <div className="hidden md:block absolute left-14 px-3 py-1.5 bg-[var(--label-primary)] text-[var(--bg-base)] text-[12px] font-bold rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {label}
                </div>
            )}
        </NavLink>
    );
}