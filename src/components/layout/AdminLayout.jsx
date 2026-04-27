import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, LayoutGrid, Tag, ArrowDownToLine, ArrowUpToLine,
    Users, CalendarDays, Calculator, PieChart, ChevronLeft,
    ChevronRight, Menu, X
} from 'lucide-react';

import Header from './Header';
import Footer from './Footer';
import { useSettingsStore } from '../../store/useSettingsStore.js';
import logoImg from '../../assets/logo-1.png';

export default function AdminLayout() {
    // State gốc y hệt Vue
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const location = useLocation();
    const { language } = useSettingsStore();

    // ==========================================
    // ĐÃ TẠM THỜI XÓA BỎ HOÀN TOÀN LOGIC MÃ PIN
    // ==========================================

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeOnMobile = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuDict = {
        vi: { home: "Trang chủ", overview: "Tổng quan", categories: "Ví & Nhãn", revenue: "Tiền vào", expense: "Tiền ra", debts: "Vay & Nợ", calendar: "Lịch", taxes: "Thuế", reports: "Báo cáo" },
        en: { home: "Home", overview: "Overview", categories: "Wallets", revenue: "Money In", expense: "Money Out", debts: "Loans", calendar: "Calendar", taxes: "Taxes", reports: "Reports" }
    };
    const getMenuLabel = (key) => menuDict[language]?.[key] || menuDict['vi'][key];

    return (
        <div className="flex min-h-screen bg-transparent transition-colors duration-300 selection:bg-orange-500/20 overflow-x-hidden relative">

            <div className="fixed inset-0 z-0 pointer-events-none trong-dong-pattern"></div>

            {/* Transition fade của Vue sang Framer Motion */}
            <AnimatePresence>
                {isSidebarOpen && window.innerWidth < 768 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 z-[90] backdrop-blur-sm cursor-pointer"
                    ></motion.div>
                )}
            </AnimatePresence>

            {/* ASIDE - Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 apple-glass !rounded-l-none !border-y-0 !border-l-0 transition-all duration-300 flex flex-col py-6 px-4 z-[100] group pb-safe ${
                    isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64 md:w-[88px]'
                }`}
            >
                <button onClick={toggleSidebar} className="hidden md:flex absolute -right-3.5 top-10 apple-btn-icon shadow-sm bg-white dark:bg-[#1c1c1e] border border-[var(--separator)] z-50">
                    {isSidebarOpen ? <ChevronLeft className="sf-icon sf-icon-bold" /> : <ChevronRight className="sf-icon sf-icon-bold" />}
                </button>

                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 top-6 apple-btn-icon !bg-transparent !text-gray-500 hover:!text-[#ff3b30] z-50 cursor-pointer outline-none">
                    <X className="sf-icon sf-icon-bold w-6 h-6" />
                </button>

                <div className={`flex items-center justify-center px-2 mb-8 pt-safe overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'h-20' : 'h-14'}`}>
                    <div className={`logo-custom transition-all duration-300 bg-contain bg-center bg-no-repeat ${isSidebarOpen ? 'w-44 h-full' : 'w-12 h-12'}`} style={{ backgroundImage: `url(${logoImg})` }}></div>
                </div>

                <nav className="flex-1 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar pr-1 block w-full">
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
            <main className={`flex-1 w-full max-w-full flex flex-col min-h-screen relative z-10 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-[88px]'}`}>

                <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 pt-safe apple-glass !rounded-none !border-x-0 !border-t-0">
                    <div className="flex items-center h-12">
                        <div className="logo-custom w-36 h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoImg})` }}></div>
                    </div>

                    <button onClick={() => setIsSidebarOpen(true)} className="apple-btn-icon !bg-transparent text-[var(--label-primary)] outline-none cursor-pointer">
                        <Menu className="sf-icon sf-icon-bold w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 md:p-8 pb-safe flex-1 flex flex-col relative w-full overflow-x-hidden">
                    <Header />

                    <div className="flex-1 relative w-full mt-4 md:mt-0">
                        {/* Router View với hiệu ứng chuyển trang (Tương đương transition name="fade" của Vue) */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.99 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <Footer />
                </div>
            </main>
        </div>
    );
}

// Sub-component cho các đường link (Y hệt thẻ router-link của bản Vue)
function NavItem({ to, icon: Icon, label, isOpen, onClick, exact }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            end={exact}
            className={({ isActive }) =>
                `nav-item relative group/item outline-none cursor-pointer block ${isActive ? 'router-link-active' : ''}`
            }
        >
            <Icon className="sf-icon sf-icon-regular w-5 h-5 shrink-0" />
            <span className={`transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100 ml-3' : 'opacity-0 w-0 hidden md:block'}`}>
                {label}
            </span>

            {!isOpen && (
                <div className="hidden md:block absolute left-14 px-3 py-1.5 bg-[var(--label-primary)] text-[var(--bg-base)] text-[12px] font-bold rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {label}
                </div>
            )}
        </NavLink>
    );
}