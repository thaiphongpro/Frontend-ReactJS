import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import AppleModal from '../components/AppleModal.jsx';
import AppleSelect from '../components/AppleSelect.jsx';
import { useToastStore } from '../store/useToastStore.js';
import api from '../utils/useApi.js';

const tabs = [
    { label: 'Khoản Thu', val: 'REVENUE' },
    { label: 'Khoản Chi', val: 'EXPENSE' },
    { label: 'Thanh Toán', val: 'PAYMENT' }
];

const banks = [
    { label: 'Vietcombank', value: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
    { label: 'MB Bank', value: 'MB', logo: 'https://api.vietqr.io/img/MB.png' },
    { label: 'Techcombank', value: 'TCB', logo: 'https://api.vietqr.io/img/TCB.png' },
    { label: 'VietinBank', value: 'ICB', logo: 'https://api.vietqr.io/img/ICB.png' },
    { label: 'BIDV', value: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
    { label: 'Agribank', value: 'VBA', logo: 'https://api.vietqr.io/img/VBA.png' },
    { label: 'ACB', value: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
    { label: 'VPBank', value: 'VPB', logo: 'https://api.vietqr.io/img/VPB.png' },
    { label: 'TPBank', value: 'TPB', logo: 'https://api.vietqr.io/img/TPB.png' },
    { label: 'Sacombank', value: 'STB', logo: 'https://api.vietqr.io/img/STB.png' },
    { label: 'VIB', value: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
    { label: 'Tiền mặt / Khác', value: 'CASH', logo: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png' }
];

const getCatIcon = (name, type, bankCode) => {
    const n = (name || '').toLowerCase();

    if (type === 'PAYMENT') {
        const logo = banks.find(x => x.value === bankCode)?.logo;
        if (logo && bankCode !== 'CASH') return { type: 'img', src: logo, bg: 'bg-[var(--system-orange)]/10' };
        return {
            type: 'svg',
            path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
            bg: 'bg-[var(--system-green)]/10',
            text: 'text-[var(--system-green)]'
        };
    }

    if (n.includes('vay') || n.includes('mượn') || n.includes('nợ')) return {
        type: 'svg',
        path: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
        bg: 'bg-[var(--system-blue)]/10',
        text: 'text-[var(--system-blue)]'
    };
    if (n.includes('đầu tư') || n.includes('cổ phiếu') || n.includes('chứng khoán')) return {
        type: 'svg',
        path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        bg: 'bg-[#5856D6]/10',
        text: 'text-[#5856D6]'
    };
    if (n.includes('lương') || n.includes('thưởng') || n.includes('nhân viên') || n.includes('khách')) return {
        type: 'svg',
        path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        bg: 'bg-[var(--system-green)]/10',
        text: 'text-[var(--system-green)]'
    };

    if (type === 'REVENUE') {
        if (n.includes('cố định')) return {
            type: 'svg',
            path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            bg: 'bg-[var(--system-green)]/10',
            text: 'text-[var(--system-green)]'
        };
        if (n.includes('bonus')) return {
            type: 'svg',
            path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
            bg: 'bg-[#FFD60A]/10',
            text: 'text-[#FFD60A]'
        };
        return {
            type: 'svg',
            path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            bg: 'bg-[var(--system-green)]/10',
            text: 'text-[var(--system-green)]'
        };
    }

    if (type === 'EXPENSE') {
        if (n.includes('phần mềm') || n.includes('công cụ') || n.includes('app')) return {
            type: 'svg',
            path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            bg: 'bg-[var(--bg-elevated-secondary)]',
            text: 'text-[var(--label-secondary)]'
        };
        if (n.includes('vật tư') || n.includes('thiết bị') || n.includes('máy móc')) return {
            type: 'svg',
            path: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            bg: 'bg-[var(--bg-elevated-secondary)]',
            text: 'text-[var(--label-secondary)]'
        };
        if (n.includes('học') || n.includes('giáo dục') || n.includes('đào tạo') || n.includes('sách')) return {
            type: 'svg',
            path: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
            bg: 'bg-[var(--system-blue)]/10',
            text: 'text-[var(--system-blue)]'
        };
        if (n.includes('hiếu') || n.includes('hỉ') || n.includes('quan hệ') || n.includes('cưới') || n.includes('quà')) return {
            type: 'svg',
            path: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
            bg: 'bg-[#FF2D55]/10',
            text: 'text-[#FF2D55]'
        };

        if (n.includes('ăn') || n.includes('uống') || n.includes('chợ') || n.includes('thực phẩm')) return {
            type: 'svg',
            path: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
            bg: 'bg-[var(--system-orange)]/10',
            text: 'text-[var(--system-orange)]'
        };
        if (n.includes('xe') || n.includes('xăng') || n.includes('đi lại')) return {
            type: 'svg',
            path: 'M8 7h8M8 11h8M5 15h14l-1-10H6L5 15z',
            bg: 'bg-[var(--system-blue)]/10',
            text: 'text-[var(--system-blue)]'
        };
        if (n.includes('nhà') || n.includes('điện') || n.includes('nước') || n.includes('mạng')) return {
            type: 'svg',
            path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            bg: 'bg-[#AF52DE]/10',
            text: 'text-[#AF52DE]'
        };
        if (n.includes('sức khỏe') || n.includes('thuốc') || n.includes('y tế') || n.includes('bệnh')) return {
            type: 'svg',
            path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
            bg: 'bg-[#FF2D55]/10',
            text: 'text-[#FF2D55]'
        };
        if (n.includes('giải trí') || n.includes('phim') || n.includes('du lịch') || n.includes('chơi')) return {
            type: 'svg',
            path: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
            bg: 'bg-[#AF52DE]/10',
            text: 'text-[#AF52DE]'
        };

        return {
            type: 'svg',
            path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            bg: 'bg-[var(--system-red)]/10',
            text: 'text-[var(--system-red)]'
        };
    }

    return {
        type: 'svg',
        path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        bg: 'bg-[var(--bg-elevated-secondary)]',
        text: 'text-[var(--label-secondary)]'
    };
};

export default function Categories() {
    const { addToast } = useToastStore();

    // Khởi tạo công cụ Quản lý Cache của React Query
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('REVENUE');

    // =========================================================================
    // REACT QUERY: Fetch dữ liệu tự động, loại bỏ useEffect và useState
    // =========================================================================
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories')
    });
    // =========================================================================

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingCat, setViewingCat] = useState(null);
    const [confirm, setConfirm] = useState({ show: false, title: '', msg: '', btn: '', type: '', danger: false, id: null });

    // STATE VÀ LOGIC CHO MÃ QR
    const [qrCat, setQrCat] = useState(null);
    const [qrAmount, setQrAmount] = useState('');
    const [qrContent, setQrContent] = useState('');

    const initCat = () => ({ name: '', type: activeTab, bankCode: '', accountNo: '', accountName: '', isHidden: false });
    const [newCat, setNewCat] = useState(initCat());

    // Lọc mảng theo tab hiện tại
    const filtered = useMemo(() => categories.filter(c => c.type === activeTab), [categories, activeTab]);

    // QR Logics
    const formatQrAmount = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val) val = new Intl.NumberFormat('vi-VN').format(val);
        setQrAmount(val);
    };

    const addQuickAmount = (val) => {
        let currentAmount = 0;
        if (qrAmount) {
            currentAmount = parseInt(qrAmount.replace(/\D/g, ''), 10) || 0;
        }
        const newAmount = currentAmount + val;
        setQrAmount(new Intl.NumberFormat('vi-VN').format(newAmount));
    };

    const clearQrAmount = () => setQrAmount('');
    const closeQrModal = () => setQrCat(null);
    const openQrModal = (cat) => {
        setQrCat(cat);
        setQrAmount('');
        setQrContent('');
    };

    const generatedQrUrl = useMemo(() => {
        if (!qrCat || qrCat.type !== 'PAYMENT' || !qrCat.bankCode) return '';
        const bank = qrCat.bankCode;
        const accNo = qrCat.accountNo;
        const accName = qrCat.accountName ? qrCat.accountName.toUpperCase() : '';

        let url = `https://img.vietqr.io/image/${bank}-${accNo}-compact2.png?accountName=${encodeURIComponent(accName)}`;
        const amount = qrAmount.replace(/\D/g, '');
        if (amount) url += `&amount=${amount}`;
        if (qrContent) url += `&addInfo=${encodeURIComponent(qrContent)}`;
        return url;
    }, [qrCat, qrAmount, qrContent]);

    const openQrNewTab = () => {
        if (generatedQrUrl) window.open(generatedQrUrl, '_blank');
    };

    const downloadQr = async () => {
        if (!generatedQrUrl) return;
        try {
            const response = await fetch(generatedQrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `QR_${qrCat.bankCode}_${qrCat.accountNo}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            addToast("Đã tải mã QR thành công!", "success");
        } catch (error) {
            addToast("Trình duyệt chặn tải trực tiếp, đang mở thẻ mới...", "warning");
            openQrNewTab();
        }
    };

    // Actions
    const openView = (c) => setViewingCat(c);

    const openAddModal = () => {
        setEditingId(null);
        setNewCat({ name: '', type: activeTab, bankCode: '', accountNo: '', accountName: '', isHidden: false });
        setShowAddModal(true);
    };

    const openEditModal = (c) => {
        setEditingId(c.id);
        setNewCat({ ...c });
        setShowAddModal(true);
    };

    // =========================================================================
    // OPTIMISTIC UI: Cập nhật giao diện lập tức, call API ngầm, tự động Re-fetch
    // =========================================================================
    const toggleHiddenStatus = async (cat) => {
        const updatedCat = { ...cat, isHidden: !cat.isHidden };

        // 1. Cập nhật thẳng vào Cache để UI đổi trạng thái lập tức (Optimistic Update)
        queryClient.setQueryData(['categories'], (old) => old.map(c => c.id === cat.id ? updatedCat : c));

        try {
            // 2. Gửi lệnh lên Server
            await api.put(`/categories/${cat.id}`, updatedCat);
        } catch (error) {
            // 3. Nếu mạng lỗi, khôi phục lại Cache cũ
            queryClient.setQueryData(['categories'], (old) => old.map(c => c.id === cat.id ? cat : c));
            addToast("Lỗi cập nhật trạng thái!", "error");
        }
    };

    const executeAction = async () => {
        setConfirm({ ...confirm, show: false });
        try {
            if (confirm.type === 'SAVE') {
                if (editingId) {
                    await api.put(`/categories/${editingId}`, newCat);
                    addToast("Cập nhật thành công!", "success");
                } else {
                    await api.post('/categories', newCat);
                    addToast("Đã thêm danh mục mới!", "success");
                }
            } else {
                await api.delete(`/categories/${confirm.id}`);
                addToast("Đã xóa khỏi hệ thống!", "success");
            }

            // LÀM MỚI DỮ LIỆU TỰ ĐỘNG: Báo cho React Query biết data đã cũ, hãy gọi lại API lấy mới
            queryClient.invalidateQueries({ queryKey: ['categories'] });

        } catch (error) {
            addToast("Giao dịch thất bại! Vui lòng thử lại.", "error");
        }
    };
    // =========================================================================

    const promptSave = () => {
        if (!newCat.name.trim()) return addToast("Nhập tên hiển thị!", "error");
        setShowAddModal(false);
        setConfirm({
            show: true,
            title: editingId ? 'Cập nhật' : 'Thêm mới',
            msg: 'Xác nhận lưu thay đổi?',
            btn: 'Lưu',
            danger: false,
            type: 'SAVE',
            id: null
        });
    };

    const promptDelete = (id) => {
        setConfirm({
            show: true,
            title: 'Xác nhận xóa',
            msg: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?',
            btn: 'Xóa',
            danger: true,
            type: 'DELETE',
            id
        });
    };

    return (
        <div className="space-y-6 relative z-10 apple-container pb-safe">

            {/* TABS */}
            <div className="flex p-1 space-x-1 apple-glass w-fit">
                {tabs.map(t => (
                    <button
                        key={t.val}
                        onClick={() => setActiveTab(t.val)}
                        className={`px-6 py-2 text-[13px] font-semibold rounded-lg transition-all duration-300 outline-none ${
                            activeTab === t.val
                                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#AA771C]/20 border border-[#D4AF37]/50 text-viet-gold font-bold shadow-sm'
                                : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* BẢNG DANH MỤC */}
            <div className="apple-glass overflow-hidden !rounded-[24px]">
                <div className="p-4 sm:p-5 border-b border-[var(--separator)] flex justify-between items-center">
                    <h3 className="text-[17px] font-bold">
                        Quản lý {activeTab === 'PAYMENT' ? 'Tài Khoản' : (activeTab === 'REVENUE' ? 'Nguồn Thu' : 'Chi Tiêu')}
                    </h3>
                    <button onClick={openAddModal} className="btn-dong-son-gold px-5 py-2 text-[13px] outline-none">
                        + Thêm mới
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-elevated-secondary)] text-viet-gold text-[11px] uppercase font-bold tracking-widest border-b border-[var(--separator)]">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">STT</th>
                            <th className="px-6 py-4">Tên danh mục / Tài khoản</th>
                            {activeTab === 'PAYMENT' && <th className="px-6 py-4">Thông tin Ngân hàng</th>}
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--separator)]">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={activeTab === 'PAYMENT' ? 5 : 4} className="px-6 py-12 text-center text-[var(--label-secondary)] text-[13px] flex flex-col items-center justify-center">
                                    <svg className="sf-icon sf-icon-regular w-10 h-10 mb-3 text-viet-gold opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    Chưa có dữ liệu trong mục này.
                                </td>
                            </tr>
                        )}

                        {filtered.map((cat, index) => {
                            const iconInfo = getCatIcon(cat.name, cat.type, cat.bankCode);
                            return (
                                <tr
                                    key={cat.id}
                                    onClick={() => openView(cat)}
                                    className={`hover:bg-[var(--bg-elevated-secondary)] transition-colors duration-300 group cursor-pointer bg-transparent ${cat.isHidden ? 'opacity-50 grayscale-[30%]' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] font-bold text-[11px] mx-auto transition-colors ${cat.isHidden ? '' : 'group-hover:bg-[#D4AF37]/20 group-hover:text-viet-gold'}`}>
                                          {index + 1}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${iconInfo.bg} ${cat.isHidden ? '' : 'group-hover:scale-105 group-hover:shadow-glow-gold'}`}>
                                                {iconInfo.type === 'img' ? (
                                                    <img src={iconInfo.src} alt="logo" className="w-10 h-10 apple-squircle object-contain bg-white p-1 border border-gray-100 no-dim" />
                                                ) : (
                                                    <svg className={`sf-icon sf-icon-bold w-5 h-5 ${iconInfo.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={iconInfo.path}></path>
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-[15px] transition-colors ${cat.isHidden ? '' : 'group-hover:text-viet-gold'}`}>{cat.name}</p>
                                                {cat.accountName && <p className="caption uppercase tracking-wider mt-0.5">{cat.accountName}</p>}
                                            </div>
                                        </div>
                                    </td>

                                    {activeTab === 'PAYMENT' && (
                                        <td className="px-6 py-4">
                                            {cat.bankCode && cat.bankCode !== 'CASH' ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-viet-gold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded">{cat.bankCode}</span>
                                                    <span className="text-[14px] font-semibold font-mono tracking-wider">{cat.accountNo}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[13px] text-[var(--label-secondary)] font-medium">
                                                    Tiền mặt / Khác
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleHiddenStatus(cat); }}
                                                title="Bật/Tắt danh mục"
                                                className={`relative w-[34px] h-[20px] rounded-full outline-none transition-colors duration-300 ease-in-out shadow-inner border border-[var(--border-subtle)] ${cat.isHidden ? 'bg-[var(--bg-elevated-secondary)]' : 'bg-[var(--system-green)]'}`}
                                            >
                                                <span className={`absolute top-[1.5px] left-[2px] bg-white w-[15px] h-[15px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${cat.isHidden ? 'translate-x-0' : 'translate-x-[13px]'}`}></span>
                                            </button>
                                            {cat.isHidden && <span className="text-[9px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider">Đã ẩn</span>}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {activeTab === 'PAYMENT' && cat.bankCode && cat.bankCode !== 'CASH' && (
                                                <button onClick={(e) => { e.stopPropagation(); openQrModal(cat); }} title="Mã QR" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-viet-gold hover:!bg-[#D4AF37]/10">
                                                    <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                                </button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); openView(cat); }} title="Chi tiết" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-blue)] hover:!bg-[var(--system-blue)]/10"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                            <button onClick={(e) => { e.stopPropagation(); openEditModal(cat); }} title="Chỉnh sửa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-orange)] hover:!bg-[var(--system-orange)]/10"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                            <button onClick={(e) => { e.stopPropagation(); promptDelete(cat.id); }} title="Xóa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-red)] hover:!bg-[var(--system-red)]/10"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CHI TIẾT */}
            <AppleModal show={!!viewingCat} title="Chi tiết Tài khoản" confirmText="Đóng" onClose={() => setViewingCat(null)} onConfirm={() => setViewingCat(null)}>
                {viewingCat && (
                    <div className="px-2 pb-2 text-left">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-[var(--separator)] mb-5">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm ${getCatIcon(viewingCat.name, viewingCat.type, viewingCat.bankCode).bg}`}>
                                {getCatIcon(viewingCat.name, viewingCat.type, viewingCat.bankCode).type === 'img' ? (
                                    <img src={getCatIcon(viewingCat.name, viewingCat.type, viewingCat.bankCode).src} alt="icon" className="w-16 h-16 apple-squircle object-contain bg-white p-1.5 border border-[var(--border-subtle)] no-dim" />
                                ) : (
                                    <svg className={`sf-icon sf-icon-bold w-8 h-8 ${getCatIcon(viewingCat.name, viewingCat.type, viewingCat.bankCode).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={getCatIcon(viewingCat.name, viewingCat.type, viewingCat.bankCode).path}></path>
                                    </svg>
                                )}
                            </div>
                            <h2 className={`text-[22px] font-black text-gradient-gold text-center leading-tight drop-shadow-sm ${viewingCat.isHidden ? 'opacity-50 line-through' : ''}`}>{viewingCat.name}</h2>
                            <span className="text-[11px] font-bold text-[var(--label-tertiary)] uppercase tracking-widest mt-1.5">{tabs.find(t => t.val === viewingCat.type)?.label}</span>
                        </div>

                        <div className="space-y-4 text-[14px]">
                            {viewingCat.type === 'PAYMENT' && (
                                <>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="caption">Ngân hàng</span>
                                        {viewingCat.bankCode && viewingCat.bankCode !== 'CASH' ? (
                                            <span className="font-bold">{viewingCat.bankCode}</span>
                                        ) : (
                                            <span className="font-bold text-[var(--label-secondary)]">Tiền mặt / Khác</span>
                                        )}
                                    </div>
                                    {viewingCat.accountNo && (
                                        <div className="flex justify-between items-center py-2 border-t border-dashed border-[var(--separator)]">
                                            <span className="caption">Số tài khoản</span>
                                            <span className="font-bold font-mono tracking-wider text-[15px]">{viewingCat.accountNo}</span>
                                        </div>
                                    )}
                                    {viewingCat.accountName && (
                                        <div className="flex justify-between items-center py-2 border-t border-dashed border-[var(--separator)]">
                                            <span className="caption">Chủ tài khoản</span>
                                            <span className="font-bold uppercase">{viewingCat.accountName}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex justify-between items-center py-2 border-t border-dashed border-[var(--separator)]">
                                <span className="caption">Trạng thái</span>
                                {!viewingCat.isHidden ? (
                                    <span className="font-bold text-[var(--system-green)] flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[var(--system-green)] shadow-[0_0_8px_rgba(52,199,89,0.6)]"></span> Đang hoạt động
                                    </span>
                                ) : (
                                    <span className="font-bold text-[var(--label-tertiary)] flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[var(--label-tertiary)]"></span> Đã ẩn
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </AppleModal>

            {/* MODAL MÃ QR */}
            <AppleModal show={!!qrCat} title="Mã QR Nhận Tiền" confirmText="Đóng" onClose={closeQrModal} onConfirm={closeQrModal}>
                {qrCat && (
                    <div className="px-2 pb-2 text-left" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--separator)]">
                            <img src={banks.find(b => b.value === qrCat.bankCode)?.logo} alt="bank logo" className="w-12 h-12 object-contain bg-white apple-squircle p-1.5 shadow-sm border border-[var(--border-subtle)] no-dim" />
                            <div>
                                <p className="font-mono text-[16px] font-black tracking-wider leading-tight">{qrCat.accountNo}</p>
                                <p className="text-[11px] font-bold text-viet-gold uppercase mt-0.5 tracking-widest">{qrCat.accountName}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Số tiền (VNĐ) <span className="text-[var(--label-tertiary)] lowercase font-medium ml-1">Tùy chọn</span></label>
                                <input
                                    value={qrAmount}
                                    onChange={formatQrAmount}
                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                    placeholder="VD: 50,000"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[16px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all text-right font-mono tabular-nums tracking-tight shadow-sm"
                                />

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); addQuickAmount(amt); }}
                                            className="flex-1 min-w-[50px] py-1.5 bg-[#D4AF37]/10 text-viet-gold hover:bg-[#D4AF37] hover:text-[#1A1514] rounded-[8px] text-[12px] font-bold transition-colors outline-none text-center tabular-nums"
                                        >
                                            +{amt / 1000}k
                                        </button>
                                    ))}
                                    <button type="button" onClick={(e) => { e.preventDefault(); clearQrAmount(); }} title="Xóa" className="py-1.5 px-3 bg-[var(--bg-elevated-secondary)] hover:bg-[var(--system-red)]/10 hover:text-[var(--system-red)] text-[var(--label-secondary)] rounded-[8px] transition-colors outline-none flex items-center justify-center">
                                        <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Nội dung <span className="text-[var(--label-tertiary)] lowercase font-medium ml-1">Tùy chọn</span></label>
                                <input
                                    value={qrContent}
                                    onChange={e => setQrContent(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                    placeholder="VD: Thanh toan tien an..."
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center bg-[var(--bg-elevated-secondary)] p-4 rounded-3xl border border-[var(--separator)] shadow-inner">
                            <div className="bg-white p-3 rounded-[20px] shadow-sm w-full flex justify-center items-center">
                                <img src={generatedQrUrl} className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-[12px] no-dim" alt="VietQR" />
                            </div>

                            <div className="flex items-center gap-3 mt-5 w-full px-1">
                                <button type="button" onClick={(e) => { e.preventDefault(); openQrNewTab(); }} className="flex-1 flex justify-center items-center gap-2 bg-[var(--bg-elevated)] text-viet-gold hover:opacity-80 py-2.5 rounded-xl text-[13px] font-bold shadow-sm border border-[#D4AF37]/30 transition-opacity outline-none">
                                    <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                    Xem Web
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); downloadQr(); }} className="btn-dong-son-gold flex-1 flex justify-center items-center gap-2 py-2.5 outline-none">
                                    <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Lưu ảnh
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AppleModal>

            {/* MODAL THÊM / SỬA */}
            <AppleModal show={showAddModal} title={editingId ? 'Cập Nhật Danh Mục' : 'Thêm Mới'} onClose={() => setShowAddModal(false)} onConfirm={promptSave}>
                <div className="space-y-4 text-left">
                    <div>
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Tên hiển thị</label>
                        <input
                            value={newCat.name}
                            onChange={e => setNewCat({...newCat, name: e.target.value})}
                            placeholder="VD: Tiền lương, Ăn uống, VCB..."
                            className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                        />
                    </div>

                    <AppleSelect
                        value={newCat.type}
                        onChange={val => setNewCat({...newCat, type: val})}
                        label="Phân loại"
                        options={[{label:'Khoản Thu', value:'REVENUE'}, {label:'Khoản Chi', value:'EXPENSE'}, {label:'Thanh Toán', value:'PAYMENT'}]}
                    />

                    <AnimatePresence>
                        {newCat.type === 'PAYMENT' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-4 bg-[var(--bg-elevated-secondary)] p-4 rounded-2xl border border-[var(--separator)] mt-4">
                                    <AppleSelect
                                        value={newCat.bankCode}
                                        onChange={val => setNewCat({...newCat, bankCode: val})}
                                        label="Chọn Ngân hàng"
                                        options={banks}
                                        searchable
                                    />
                                    {newCat.bankCode && newCat.bankCode !== 'CASH' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider mb-1">Số tài khoản</label>
                                                <input
                                                    value={newCat.accountNo}
                                                    onChange={e => setNewCat({...newCat, accountNo: e.target.value})}
                                                    placeholder="VD: 1903..."
                                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-[10px] p-2.5 text-[14px] font-mono tracking-wider outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider mb-1">Tên chủ thẻ</label>
                                                <input
                                                    value={newCat.accountName}
                                                    onChange={e => setNewCat({...newCat, accountName: e.target.value})}
                                                    placeholder="VD: NGUYEN VAN A"
                                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-[10px] p-2.5 text-[14px] font-bold uppercase outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </AppleModal>

            {/* CONFIRM MODAL INLINE */}
            <AnimatePresence>
                {confirm.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="apple-glass !bg-[var(--bg-elevated)] w-[270px] !rounded-[14px] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="px-4 pt-5 pb-4 text-center">
                                <h3 className="font-semibold text-[17px] leading-snug mb-1 text-[var(--label-primary)]">{confirm.title}</h3>
                                <p className="text-[13px] leading-tight text-[var(--label-secondary)]">{confirm.msg}</p>
                            </div>
                            <div className="flex border-t border-[var(--separator)]">
                                <button type="button" onClick={() => setConfirm({...confirm, show: false})} className="flex-1 py-[11px] text-[17px] text-[var(--system-blue)] font-normal border-r border-[var(--separator)] hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors">
                                    Hủy
                                </button>
                                <button type="button" onClick={executeAction} className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirm.danger ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'}`}>
                                    {confirm.btn}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}