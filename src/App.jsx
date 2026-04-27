import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Import Layout
import AdminLayout from './components/layout/AdminLayout.jsx';

// =========================================================================
// CODE SPLITTING: Tải lười (Lazy Load) các trang Views
// =========================================================================
const Home = lazy(() => import('./views/Home.jsx'));
const Dashboard = lazy(() => import('./views/Dashboard.jsx'));
const Categories = lazy(() => import('./views/Categories.jsx'));
const Revenue = lazy(() => import('./views/Revenue.jsx'));
const Expense = lazy(() => import('./views/Expense.jsx'));
const Reports = lazy(() => import('./views/Reports.jsx'));
const Debts = lazy(() => import('./views/Debts.jsx'));
const Calendar = lazy(() => import('./views/Calendar.jsx'));
const Taxes = lazy(() => import('./views/Taxes.jsx'));

function PageTitleUpdater() {
    const location = useLocation();

    useEffect(() => {
        const defaultTitle = 'Góc Tài Chính';
        const routeNames = {
            '/': 'Trang Chủ',
            '/dashboard': 'Tổng Quan',
            '/categories': 'Quản Lý Danh Mục',
            '/revenue': 'Doanh Thu',
            '/expense': 'Chi Phí',
            '/reports': 'Báo Cáo Tài Chính',
            '/debts': 'Quản Lý Công Nợ',
            '/calendar': 'Lịch Dòng Tiền',
            '/taxes': 'Thuế',
        };
        const currentName = routeNames[location.pathname];
        document.title = currentName ? (currentName === 'Trang Chủ' ? defaultTitle : `${currentName} | ${defaultTitle}`) : defaultTitle;
    }, [location]);

    return null;
}

const LoadingScreen = () => (
    <div className="flex-1 w-full h-[80vh] flex items-center justify-center bg-transparent">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
    </div>
);

// MỞ CỬA CHO VÀO THẲNG BÊN TRONG LAYOUT
export default function App() {
    return (
        <BrowserRouter>
            <PageTitleUpdater />
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    <Route element={<AdminLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/revenue" element={<Revenue />} />
                        <Route path="/expense" element={<Expense />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/debts" element={<Debts />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/taxes" element={<Taxes />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}