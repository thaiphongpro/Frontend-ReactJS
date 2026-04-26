import { create } from 'zustand';

export const useToastStore = create((set) => ({
    toasts: [], // Thay cho const toasts = ref([])

    // Thay cho showToast
    addToast: (message, type = 'info', duration = 3000) => {
        const id = Date.now(); // Dùng timestamp thay cho biến đếm id
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));

        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, duration);
    },

    // Thay cho removeToast
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    })),
}));