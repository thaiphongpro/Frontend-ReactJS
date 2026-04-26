import { create } from 'zustand';
import i18n from '../i18n.js'; // Import file i18n.js đã tạo ở bước trước
import axios from 'axios';

export const useSettingsStore = create((set, get) => ({
    // 1. STATE (Dữ liệu)
    currency: localStorage.getItem('currency') || 'VND',
    language: localStorage.getItem('lang') || 'vi',
    exchangeRate: 25450, // Tỷ giá mặc định
    isFetching: false,
    isDark: document.documentElement.classList.contains('dark'),

    // 2. ACTIONS (Hàm xử lý)

    // Hàm gọi API lấy tỷ giá mới nhất
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

    // Đổi ngôn ngữ
    setLanguage: (lang) => {
        i18n.changeLanguage(lang); // Đổi ngôn ngữ trong react-i18next
        localStorage.setItem('lang', lang);
        set({ language: lang });
    },

    toggleLanguage: () => {
        const newLang = get().language === 'vi' ? 'en' : 'vi';
        get().setLanguage(newLang);
    },

    // Đổi tiền tệ
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

    // Đổi giao diện Sáng/Tối
    toggleTheme: () => {
        const newIsDark = !get().isDark;
        if (newIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        set({ isDark: newIsDark });
    },

    // Hàm format tiền tệ (Hàm này dùng trực tiếp trong Component)
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

// Gọi lấy tỷ giá ngay khi khởi tạo Store
useSettingsStore.getState().fetchRate();