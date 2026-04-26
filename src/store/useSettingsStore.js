import { create } from 'zustand';
// import i18n from '../i18n';
import axios from 'axios';

// =========================================================
// THUẬT TOÁN THEME: Chạy ngay lập tức khi load trang (Tránh chớp trắng)
// =========================================================
const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme === 'dark';
    }
    // Đọc trí nhớ hệ thống nếu user chưa chọn
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Áp dụng class ngay vào thẻ HTML gốc (Giống tham số immediate: true trong Vue)
const initialIsDark = getInitialTheme();
if (initialIsDark) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// =========================================================
// KHỞI TẠO STORE
// =========================================================
export const useSettingsStore = create((set, get) => ({
    // 1. STATE
    currency: localStorage.getItem('currency') || 'VND',
    language: localStorage.getItem('lang') || 'vi',
    exchangeRate: 25450,
    isFetching: false,

    // Gán trạng thái Theme ban đầu
    isDark: initialIsDark,

    // 2. ACTIONS
    fetchRate: async () => {
        set({ isFetching: true });
        try {
            const res = await axios.get('https://open.er-api.com/v6/latest/USD');
            if (res.data?.rates?.VND) {
                set({ exchangeRate: res.data.rates.VND });
            }
        } catch (e) {
            console.error("Lỗi API tỷ giá, dùng giá dự phòng:", e);
        } finally {
            set({ isFetching: false });
        }
    },

    setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
        set({ language: lang });
    },

    toggleLanguage: () => {
        const newLang = get().language === 'vi' ? 'en' : 'vi';
        get().setLanguage(newLang);
    },

    setCurrency: async (val) => {
        localStorage.setItem('currency', val);
        set({ currency: val });
        if (val === 'USD') {
            await get().fetchRate();
        }
    },

    toggleCurrency: async () => {
        const nextCurrency = get().currency === 'VND' ? 'USD' : 'VND';
        await get().setCurrency(nextCurrency);
    },

    // Hàm đổi Theme hoàn thiện
    toggleTheme: () => {
        const newIsDark = !get().isDark;
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        set({ isDark: newIsDark });
    },

    formatMoney: (amount) => {
        const { currency, language, exchangeRate } = get();
        if (amount == null) return language === 'vi' ? '0 ₫' : '$0.00';

        let val = currency === 'USD' ? amount / exchangeRate : amount;

        return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: currency === 'USD' ? 2 : 0
        }).format(val);
    }
}));

// Gọi lấy tỷ giá lần đầu
useSettingsStore.getState().fetchRate();