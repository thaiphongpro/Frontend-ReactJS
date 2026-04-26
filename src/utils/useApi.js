import axios from 'axios';
import { useToastStore } from '../store/useToastStore.js';

const api = axios.create({
    // Dùng biến môi trường Vite, nếu chưa cấu hình thì mặc định chạy Localhost
    baseURL: import.meta.env.VITE_API_URL || 'https://finance-management-backend-k25i.onrender.com/api/',
    // Nâng lên 15s để đề phòng những API truy vấn Báo cáo phức tạp tốn nhiều thời gian
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor: Tự động nhét Mã PIN vào Header của mọi request
api.interceptors.request.use(
    (config) => {
        const pin = localStorage.getItem('app_pin');
        if (pin) {
            config.headers['X-PIN-Secret'] = pin;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Khóa chống spam 401: Ngăn việc hiển thị 10 cái Toast nếu 10 API cùng tạch do sai mã PIN
let isRedirecting = false;

// Response interceptor: Xử lý dữ liệu trả về & Bắt lỗi toàn cục
api.interceptors.response.use(
    (response) => {
        // Bóc tách lớp dữ liệu bọc ngoài của Spring Boot
        if (response.data && response.data.data !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        // Lôi cái Két sắt Toast ra để dùng bên ngoài React Component
        const addToast = useToastStore.getState().addToast;

        // Xử lý Timeout (Mạng quá chậm hoặc Server xử lý không kịp)
        if (error.code === 'ECONNABORTED') {
            addToast('Máy chủ phản hồi quá lâu. Vui lòng thử lại!', 'error');
            return Promise.reject(error);
        }

        if (error.response) {
            // 1. Lỗi từ phía Server (VD: 400, 401, 403, 404, 500)
            const status = error.response.status;
            const data = error.response.data;

            // Trích xuất câu thông báo lỗi thông minh (Hỗ trợ Spring Boot @Valid)
            let message = data?.message || 'Có lỗi xảy ra từ máy chủ!';
            if (data?.errors && Array.isArray(data.errors)) {
                // Nếu Backend trả về danh sách lỗi cụ thể của từng trường, nối chúng lại
                message = data.errors.map(err => err.defaultMessage || err).join(' • ');
            }

            if (status === 401) {
                if (!isRedirecting) {
                    isRedirecting = true; // Khóa lại ngay lập tức

                    // Xóa PIN sai và PHÁT TÍN HIỆU KHÓA APP (Không reload trang nữa)
                    localStorage.removeItem('app_pin');
                    window.dispatchEvent(new Event('lock_app'));

                    addToast('Dữ liệu đã bị khóa. Vui lòng nhập đúng mã PIN!', 'error');

                    // Nhả khóa chống spam sau 1.5s để lần sau vẫn bắt được lỗi
                    setTimeout(() => {
                        isRedirecting = false;
                    }, 1500);
                }
            } else if (status === 403) {
                addToast('Bạn không có quyền thực hiện thao tác này!', 'error');
            } else {
                // Server báo lỗi logic (VD: Trùng tên, mã lỗi nghiệp vụ...)
                addToast(message, 'error');
            }
        } else if (error.request) {
            // 2. Không nhận được phản hồi (Server Spring Boot chưa bật hoặc đứt cáp quang)
            addToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend!', 'error');
            console.error("Backend offline:", error.request);
        } else {
            // 3. Lỗi do code Frontend
            addToast('Lỗi hệ thống: ' + error.message, 'error');
        }

        return Promise.reject(error);
    }
);

export default api;