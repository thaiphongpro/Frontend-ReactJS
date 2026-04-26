import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 1. IMPORT TANSTACK QUERY
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import cấu hình đa ngôn ngữ
// import './i18n';

// Import CSS toàn cục
import './index.css';

// 2. KHỞI TẠO QUERY CLIENT (Cấu hình "đầu não" quản lý Cache)
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Dữ liệu sẽ được coi là "tươi" (fresh) trong 5 phút.
            // Trong thời gian này, React Query sẽ không gọi lại API nếu bạn chuyển trang qua lại.
            staleTime: 1000 * 60 * 5,

            // Tự động thử lại 1 lần nếu API bị lỗi mạng
            retry: 1,

            // Không tự động gọi lại API khi bạn quay lại tab trình duyệt (giảm tải cho server)
            refetchOnWindowFocus: false,
        },
    },
});

// =========================================================
// BỨC TƯỜNG CHỐNG COPY VÀ BẢO VỆ SOURCE CODE (ENTERPRISE)
// =========================================================

// Chặn hành vi Kéo/Thả (Drag & Drop)
document.addEventListener('dragstart', (e) => e.preventDefault());

// Bạn có thể mở comment các phần dưới nếu cần bảo mật cao hơn:
// document.addEventListener('contextmenu', (e) => e.preventDefault());

// =========================================================

// 3. KHỞI CHẠY ỨNG DỤNG VỚI PROVIDER
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* Bọc App trong QueryClientProvider để kích hoạt tính năng Cache toàn hệ thống */}
        <QueryClientProvider client={queryClient}>
            <App />

            {/* Công cụ soi Cache (Chỉ xuất hiện khi đang phát triển - Dev mode) */}
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </QueryClientProvider>
    </React.StrictMode>
);