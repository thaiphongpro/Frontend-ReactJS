import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Inbox, ChevronRight, Copy, Edit2, Trash2, Eye, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import AppleModal from '../components/AppleModal.jsx';
import AppleInputNumber from '../components/AppleInputNumber.jsx';
import AppleSelect from '../components/AppleSelect.jsx';
import AppleDatePicker from '../components/AppleDatePicker.jsx';
import { useSettingsStore } from '../store/useSettingsStore.js';
import { useToastStore } from '../store/useToastStore.js';
import api from '../utils/useApi.js';

export default function Revenue() {
    const { currency } = useSettingsStore();
    const { addToast } = useToastStore();
    const fileInRef = useRef(null);
    const queryClient = useQueryClient();

    const formatMoney = useCallback((amount) => {
        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: currency || 'VND'
        }).format(amount || 0);
    }, [currency]);

    const formatDate = (s) => s ? s.split('-').reverse().join('/') : '';
    const getTodayString = () => {
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzOffset)).toISOString().substr(0, 10);
    };

    // =========================================================================
    // REACT QUERY: Lấy danh sách Doanh thu & Danh mục tự động
    // =========================================================================
    const { data: revenues = [] } = useQuery({
        queryKey: ['transactions', 'REVENUE'],
        queryFn: async () => {
            const data = await api.get('/transactions/type/REVENUE');
            return data || [];
        }
    });

    const { data: rawCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const data = await api.get('/categories');
            return data || [];
        }
    });
    // =========================================================================

    const categoryOptions = useMemo(() =>
            rawCategories.filter(c => c.type === 'REVENUE' && !c.isHidden).map(c => ({ label: c.name, value: c.id })),
        [rawCategories]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('ALL');

    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingTx, setViewingTx] = useState(null);
    const [confirm, setConfirm] = useState({ show: false, title: '', msg: '', btn: '', type: '', danger: false, id: null });

    // Lọc tháng
    const monthOptions = useMemo(() => {
        const opts = [{ value: 'ALL', label: 'Tất cả thời gian' }];
        const uniqueMonths = new Set();
        revenues.forEach(tx => {
            if (tx.date && tx.date.length >= 7) {
                uniqueMonths.add(tx.date.substring(0, 7)); // YYYY-MM
            }
        });

        const sortedMonths = Array.from(uniqueMonths).sort().reverse();
        sortedMonths.forEach(m => {
            const [y, mm] = m.split('-');
            opts.push({ value: m, label: `Tháng ${mm}/${y}` });
        });
        return opts;
    }, [revenues]);

    const filteredRevenues = useMemo(() => {
        let result = revenues;
        if (filterMonth !== 'ALL') {
            result = result.filter(r => r.date && r.date.startsWith(filterMonth));
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.category && r.category.toLowerCase().includes(q)) ||
                (r.description && r.description.toLowerCase().includes(q))
            );
        }
        return result;
    }, [revenues, filterMonth, searchQuery]);

    const groupedRevenues = useMemo(() => {
        const groups = {};
        filteredRevenues.forEach(tx => {
            if (!groups[tx.date]) groups[tx.date] = { date: tx.date, items: [], total: 0 };
            groups[tx.date].items.push(tx);
            groups[tx.date].total += tx.amount;
        });
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredRevenues]);

    const [collapsedDates, setCollapsedDates] = useState(new Set());
    const toggleDate = (date) => {
        const newSet = new Set(collapsedDates);
        if (newSet.has(date)) newSet.delete(date);
        else newSet.add(date);
        setCollapsedDates(newSet);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [groupsPerPage, setGroupsPerPage] = useState(5);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(groupedRevenues.length / groupsPerPage));
    }, [groupedRevenues.length, groupsPerPage]);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * groupsPerPage;
        return groupedRevenues.slice(start, start + groupsPerPage);
    }, [groupedRevenues, currentPage, groupsPerPage]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterMonth, groupsPerPage]);

    // STATE FORM
    const initForm = () => ({
        transactionDate: getTodayString(),
        items: [{ categoryId: '', categorySearch: '', amount: null, description: '' }]
    });
    const [form, setForm] = useState(initForm());
    const [activeDropdown, setActiveDropdown] = useState(null);

    const closeAllDropdowns = () => setActiveDropdown(null);

    const filteredCategoryOptions = useCallback((search) => {
        if (!search) return categoryOptions;
        const q = search.toLowerCase();
        return categoryOptions.filter(opt => opt.label.toLowerCase().includes(q));
    }, [categoryOptions]);

    const selectCategory = (index, opt) => {
        const newItems = [...form.items];
        newItems[index].categoryId = opt.value;
        newItems[index].categorySearch = opt.label;
        setForm({ ...form, items: newItems });
        closeAllDropdowns();
    };

    const addQuickAmount = (index, amt) => {
        const newItems = [...form.items];
        let current = Number(newItems[index].amount) || 0;
        newItems[index].amount = current + amt;
        setForm({ ...form, items: newItems });
    };

    const clearAmount = (index) => {
        const newItems = [...form.items];
        newItems[index].amount = null;
        setForm({ ...form, items: newItems });
    };

    const updateItemField = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index][field] = value;
        setForm({ ...form, items: newItems });
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { categoryId: '', categorySearch: '', amount: null, description: '' }] });
    };

    const removeItem = (idx) => {
        const newItems = [...form.items];
        newItems.splice(idx, 1);
        setForm({ ...form, items: newItems });
    };

    // THỐNG KÊ NHANH
    const total = useMemo(() => filteredRevenues.reduce((s, r) => s + (r.amount || 0), 0), [filteredRevenues]);
    const stats = useMemo(() => [
        { l: 'Doanh thu (Lọc)', v: formatMoney(total), c: 'var(--system-green)' },
        { l: 'Trung bình (Lọc)', v: formatMoney(total / (filteredRevenues.length || 1)), c: 'var(--system-blue)' },
        { l: 'Giao dịch (Lọc)', v: `${filteredRevenues.length} lần`, c: 'var(--system-orange)' }
    ], [total, filteredRevenues.length, formatMoney]);

    // ACTIONS
    const openView = (r) => setViewingTx(r);

    const openAdd = () => {
        setEditingId(null);
        setForm(initForm());
        closeAllDropdowns();
        setShowAdd(true);
    };

    const openEdit = (r) => {
        setEditingId(r.id);
        const cat = categoryOptions.find(c => c.label === r.category);
        setForm({
            transactionDate: r.date,
            items: [{
                categoryId: cat ? cat.value : '',
                categorySearch: r.category,
                amount: r.amount,
                description: r.description
            }]
        });
        closeAllDropdowns();
        setShowAdd(true);
    };

    const openClone = (r) => {
        setEditingId(null);
        const cat = categoryOptions.find(c => c.label === r.category);
        setForm({
            transactionDate: r.date,
            items: [{
                categoryId: cat ? cat.value : '',
                categorySearch: r.category,
                amount: r.amount,
                description: r.description ? r.description + ' (Bản sao)' : '(Bản sao)'
            }]
        });
        closeAllDropdowns();
        setShowAdd(true);
    };

    const promptSave = () => {
        const isValid = form.items.every(i => i.amount && i.categoryId);
        if (!isValid) return addToast("Vui lòng chọn Khoản mục từ danh sách và nhập Số tiền!", "error");

        setShowAdd(false);
        const isMultiple = form.items.length > 1;
        setConfirm({
            show: true, title: editingId ? 'Cập nhật' : 'Xác nhận Lưu',
            msg: isMultiple ? `Bạn sắp lưu ${form.items.length} giao dịch doanh thu cùng lúc. Tiếp tục?` : 'Xác nhận lưu thay đổi?',
            btn: 'Lưu', danger: false, type: 'SAVE', id: null
        });
    };

    const promptDelete = (id) => {
        setConfirm({ show: true, title: 'Xóa giao dịch', msg: 'Hành động này không thể hoàn tác. Bạn có muốn tiếp tục?', btn: 'Xóa', danger: true, type: 'DELETE', id });
    };

    // =========================================================================
    // OPTIMISTIC UI KẾT HỢP REACT QUERY
    // =========================================================================
    const executeAction = async () => {
        setConfirm({ ...confirm, show: false });

        if (confirm.type === 'SAVE') {
            // Cập nhật giao diện mồi (Giả vờ data đã vào)
            const tempItems = form.items.map(item => ({
                id: 'temp-' + Math.random().toString(36).substring(2, 9),
                date: form.transactionDate, amount: item.amount,
                category: item.categorySearch || 'Đang cập nhật...',
                description: item.description || '', isTemp: true
            }));

            queryClient.setQueryData(['transactions', 'REVENUE'], (old) => {
                if (!old) return tempItems;
                if (editingId) return old.map(e => e.id === editingId ? { ...e, ...tempItems[0] } : e);
                return [...tempItems, ...old];
            });

            addToast(editingId ? "Đang lưu thay đổi..." : "Đã thêm! Đang đồng bộ nền...", "info");

            try {
                // Gửi dữ liệu thật lên Server
                const promises = form.items.map(item => {
                    const payload = {
                        transactionDate: form.transactionDate,
                        amount: item.amount, type: 'REVENUE',
                        description: item.description,
                        category: { id: item.categoryId }
                    };
                    if (editingId) {
                        payload.id = editingId;
                        return api.put(`/transactions/${editingId}`, payload);
                    } else {
                        return api.post('/transactions', payload);
                    }
                });

                await Promise.all(promises);
                addToast(editingId ? "Cập nhật thành công!" : "Đồng bộ Server hoàn tất!", "success");

                // Yêu cầu Fetch lại để xóa bản mồi, hiển thị bản chuẩn
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['report-general'] });
            } catch (error) {
                addToast("Lỗi đồng bộ! Đang hoàn tác...", "error");
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }
        } else if (confirm.type === 'DELETE') {
            const targetId = confirm.id;

            // Xóa UI tức thì
            queryClient.setQueryData(['transactions', 'REVENUE'], (old) => old ? old.filter(e => e.id !== targetId) : []);
            addToast("Đã ẩn! Đang xóa ngầm...", "info");

            try {
                await api.delete(`/transactions/${targetId}`);
                addToast("Đã xóa vĩnh viễn khỏi Server!", "success");
                queryClient.invalidateQueries({ queryKey: ['report-general'] });
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } catch (e) {
                addToast("Lỗi khi xóa! Đang hoàn tác...", "error");
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }
        }
    };
    // =========================================================================

    // EXPORT FUNCTIONS
    const exportExcel = () => {
        if (filteredRevenues.length === 0) return addToast("Không có dữ liệu để xuất!", "error");
        const ws = XLSX.utils.json_to_sheet(filteredRevenues.map((r, i) => ({
            'STT': i + 1, 'Ngày': formatDate(r.date), 'Hạng mục': r.category, 'Diễn giải': r.description, 'Tiền': r.amount
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Thu");
        XLSX.writeFile(wb, "DoanhThu.xlsx");
        addToast("Đã xuất Excel!", "success");
    };

    const exportPDF = () => {
        if (filteredRevenues.length === 0) return addToast("Không có dữ liệu để xuất!", "error");
        const doc = new jsPDF();
        doc.text("BAO CAO DOANH THU", 14, 15);
        doc.autoTable({
            head: [['STT', 'Ngay', 'Hang muc', 'Dien giai', 'So tien']],
            body: filteredRevenues.map((r, i) => [i + 1, formatDate(r.date), r.category, r.description || '', formatMoney(r.amount)])
        });
        doc.save("DoanhThu.pdf");
        addToast("Đã xuất PDF!", "success");
    };

    const importData = (e) => {
        // Placeholder cho logic Import
        addToast("Tính năng Import đang được phát triển!", "info");
        e.target.value = null; // Reset file input
    };

    // Tái sử dụng class button outline của bạn
    const appleBtnOutlineClass = "bg-[var(--bg-elevated)] border border-[var(--separator)] px-4 py-2.5 rounded-xl text-[12px] font-bold shadow-sm hover:bg-[var(--bg-elevated-secondary)] transition-all outline-none text-[var(--label-primary)]";

    return (
        <div className="space-y-6 relative z-10 apple-container pb-safe">

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((s, idx) => (
                    <div key={idx} className="apple-glass p-5 !rounded-[20px] border-l-[4px] shadow-sm" style={{ borderLeftColor: s.c }}>
                        <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">{s.l}</p>
                        <h3 className="text-2xl font-black mt-1 tabular-nums tracking-tight text-[var(--label-primary)]">{s.v}</h3>
                    </div>
                ))}
            </div>

            {/* HEADER & CONTROLS */}
            <div className="apple-glass p-4 !rounded-[24px] space-y-4">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        <input type="file" ref={fileInRef} className="hidden" onChange={importData} accept=".xlsx, .xls" />
                        <button onClick={() => fileInRef.current?.click()} className={appleBtnOutlineClass}>Nhập Excel</button>
                        <button onClick={exportExcel} className={appleBtnOutlineClass}>Xuất Excel</button>
                        <button onClick={exportPDF} className={`${appleBtnOutlineClass} !text-[var(--system-red)] hover:!border-[var(--system-red)]`}>Xuất PDF</button>
                    </div>

                    <button onClick={openAdd} className="btn-dong-son-gold px-6 py-2.5 outline-none w-full lg:w-auto">
                        + Ghi nhận thu
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-[var(--separator)]">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="sf-icon sf-icon-bold w-4 h-4 text-[var(--label-tertiary)]" />
                        </div>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            type="text"
                            placeholder="Tìm theo Khoản mục, Diễn giải..."
                            className="w-full pl-10 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <AppleSelect value={filterMonth} onChange={setFilterMonth} options={monthOptions} />
                    </div>
                </div>
            </div>

            {/* BẢNG DOANH THU */}
            <div className="apple-glass overflow-hidden !rounded-[24px] flex flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-elevated-secondary)] text-viet-gold text-[11px] uppercase font-bold tracking-widest border-b border-[var(--separator)]">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">STT</th>
                            <th className="px-6 py-4 whitespace-nowrap">Khoản mục</th>
                            <th className="px-6 py-4 w-1/2">Diễn giải</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">Số tiền</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--separator)]">
                        {paginatedGroups.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-[var(--label-secondary)] text-[13px] flex flex-col items-center justify-center">
                                    <Inbox className="sf-icon sf-icon-regular w-10 h-10 mb-3 opacity-50 text-viet-gold" />
                                    Không tìm thấy dữ liệu phù hợp.
                                </td>
                            </tr>
                        )}

                        {paginatedGroups.map(group => (
                            <React.Fragment key={group.date}>
                                {/* Dòng Header Ngày */}
                                <tr className="bg-[var(--bg-elevated)] cursor-pointer hover:bg-[#D4AF37]/10 transition-colors" onClick={() => toggleDate(group.date)}>
                                    <td colSpan={5} className="px-6 py-3.5 border-b-2 border-[#D4AF37]/20">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight className={`sf-icon sf-icon-bold w-4 h-4 text-viet-gold transition-transform duration-200 ${collapsedDates.has(group.date) ? 'rotate-0' : 'rotate-90'}`} />
                                                <span className="font-bold">Ngày {formatDate(group.date)}</span>
                                                <span className="text-[10px] bg-[#D4AF37]/10 text-viet-gold border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider">{group.items.length} giao dịch</span>
                                            </div>
                                            <span className="font-black tabular-nums tracking-tight text-[var(--system-green)] text-[15px]">+ {formatMoney(group.total)}</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Danh sách Giao dịch trong Ngày */}
                                <AnimatePresence>
                                    {!collapsedDates.has(group.date) && group.items.map((r, index) => (
                                        <motion.tr
                                            key={r.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`group transition-colors bg-transparent ${r.isTemp ? 'opacity-60 bg-[var(--system-blue)]/5 pointer-events-none' : 'hover:bg-[var(--bg-elevated-secondary)]'}`}
                                        >
                                            <td className="px-6 py-4 border-b border-[var(--separator)]">
                                                <div className="flex justify-center items-center w-6 h-6 rounded-full bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] font-bold text-[11px] mx-auto group-hover:bg-[#D4AF37]/20 group-hover:text-viet-gold transition-colors">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-[var(--separator)]">
                                                <span className="px-2.5 py-1 bg-[var(--system-green)]/10 text-[var(--system-green)] rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">{r.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--label-primary)] font-medium border-b border-[var(--separator)]">
                                                <div className="line-clamp-2 min-w-[120px] max-w-[200px] md:max-w-[400px]" title={r.description}>
                                                    {r.description || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold tabular-nums tracking-tight text-right text-[var(--system-green)] whitespace-nowrap text-[15px] border-b border-[var(--separator)]">+ {formatMoney(r.amount)}</td>
                                            <td className="px-6 py-4 text-right border-b border-[var(--separator)]">
                                                {r.isTemp ? (
                                                    <div className="flex justify-end pr-2" title="Đang đồng bộ..."><div className="w-4 h-4 border-2 border-[var(--system-blue)] border-t-transparent rounded-full animate-spin"></div></div>
                                                ) : (
                                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); openView(r); }} title="Xem" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-blue)] hover:!bg-[var(--system-blue)]/10"><Eye className="w-4 h-4 sf-icon-bold" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); openClone(r); }} title="Nhân bản" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-viet-gold hover:!bg-[#D4AF37]/10"><Copy className="w-4 h-4 sf-icon-bold" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} title="Sửa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-orange)] hover:!bg-[var(--system-orange)]/10"><Edit2 className="w-4 h-4 sf-icon-bold" /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); promptDelete(r.id); }} title="Xóa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-red)] hover:!bg-[var(--system-red)]/10"><Trash2 className="w-4 h-4 sf-icon-bold" /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* PHÂN TRANG */}
                <div className="flex items-center justify-between p-4 border-t border-[var(--separator)] bg-[var(--bg-elevated-secondary)]/50">
                    <span className="text-[12px] font-medium text-[var(--label-secondary)]">Trang {currentPage} / {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-lg text-[13px] hover:text-viet-gold disabled:opacity-50 outline-none">Trang trước</button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-lg text-[13px] hover:text-viet-gold disabled:opacity-50 outline-none">Trang sau</button>
                    </div>
                </div>
            </div>

            {/* MODAL BIÊN LAI */}
            <AppleModal show={!!viewingTx} title="Biên Lai Chi Tiết" confirmText="Đóng" onClose={() => setViewingTx(null)} onConfirm={() => setViewingTx(null)}>
                {viewingTx && (
                    <div className="px-2 pb-2 text-left">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-[var(--separator)] mb-5">
                            <div className="w-14 h-14 rounded-full bg-[var(--system-green)]/10 flex items-center justify-center mb-3 shadow-sm border border-[var(--system-green)]/30">
                                <svg className="sf-icon sf-icon-bold w-7 h-7 text-[var(--system-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h2 className="text-[32px] leading-none font-black text-[var(--system-green)] tabular-nums tracking-tight drop-shadow-sm">+ {formatMoney(viewingTx.amount)}</h2>
                            <p className="text-[12px] font-bold text-viet-gold uppercase mt-2 tracking-widest">{viewingTx.category}</p>
                        </div>
                        <div className="space-y-4 text-[14px]">
                            <div className="flex justify-between items-center"><span className="caption">Ngày giao dịch</span><span className="font-bold text-[var(--label-primary)]">{formatDate(viewingTx.date)}</span></div>
                            <div className="flex justify-between items-start mt-4 pt-4 border-t border-dashed border-[var(--separator)]">
                                <span className="caption whitespace-nowrap mr-4">Diễn giải</span>
                                <span className="font-medium text-right leading-relaxed text-[var(--label-primary)]">{viewingTx.description || 'Không có ghi chú'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </AppleModal>

            {/* MODAL GHI NHẬN DOANH THU */}
            <AppleModal show={showAdd} title={editingId ? 'Cập nhật giao dịch' : 'Ghi nhận doanh thu'} onClose={() => setShowAdd(false)} onConfirm={promptSave}>
                <div className="space-y-4 text-left" onClick={closeAllDropdowns}>
                    <div className="bg-[var(--bg-elevated-secondary)] p-4 rounded-2xl border border-[var(--border-subtle)]">
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Ngày giao dịch chung</label>
                        <AppleDatePicker value={form.transactionDate} onChange={(val) => setForm({ ...form, transactionDate: val })}/>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        {form.items.map((item, index) => (
                            <div key={index} className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[20px] relative shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[13px] font-black text-viet-gold">GIAO DỊCH #{index + 1}</h4>
                                    {form.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="text-[var(--system-red)] hover:bg-[var(--system-red)]/10 p-1.5 rounded-lg text-[11px] font-bold transition-colors outline-none">
                                            Xóa dòng
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Khoản mục</label>
                                        <input
                                            value={item.categorySearch}
                                            onChange={(e) => updateItemField(index, 'categorySearch', e.target.value)}
                                            onFocus={() => setActiveDropdown(`cat-${index}`)}
                                            type="text"
                                            placeholder="Gõ hoặc chọn..."
                                            className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                                        />

                                        <AnimatePresence>
                                            {activeDropdown === `cat-${index}` && (
                                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[99] w-full mt-1 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--separator)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto custom-scrollbar">
                                                    <ul className="p-1.5">
                                                        {filteredCategoryOptions(item.categorySearch).map(opt => (
                                                            <li key={opt.value}
                                                                onClick={() => selectCategory(index, opt)}
                                                                className="px-3 py-2.5 text-[14px] font-bold hover:bg-[#D4AF37]/10 hover:text-viet-gold rounded-[8px] cursor-pointer transition-colors flex items-center gap-2.5">
                                                                {opt.label}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div>
                                        <AppleInputNumber value={item.amount} onChange={(val) => updateItemField(index, 'amount', val)} label="Số tiền (VNĐ)" />
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                            {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                                                <button key={amt} type="button" onClick={(e) => { e.preventDefault(); addQuickAmount(index, amt); }} className="flex-1 min-w-[42px] py-1 bg-[#D4AF37]/10 text-viet-gold hover:bg-[#D4AF37] hover:text-[#1A1514] rounded-[8px] text-[11px] font-bold transition-colors outline-none text-center tabular-nums border border-[#D4AF37]/20">
                                                    +{amt / 1000}k
                                                </button>
                                            ))}
                                            <button type="button" onClick={(e) => { e.preventDefault(); clearAmount(index); }} title="Làm lại" className="py-1 px-3 bg-[var(--bg-elevated-secondary)] hover:bg-[var(--system-red)]/10 hover:text-[var(--system-red)] text-[var(--label-secondary)] rounded-[8px] transition-colors outline-none flex items-center justify-center border border-[var(--border-subtle)]">
                                                <X className="sf-icon sf-icon-bold w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        value={item.description}
                                        onChange={(e) => updateItemField(index, 'description', e.target.value)}
                                        placeholder="Diễn giải / Ghi chú..."
                                        className="w-full p-3 bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] shadow-sm h-16 resize-none text-[14px] transition-all text-[var(--label-primary)]"
                                    ></textarea>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!editingId && (
                        <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-[#D4AF37]/50 text-viet-gold hover:bg-[#D4AF37]/10 rounded-[16px] font-bold text-[13px] transition-colors outline-none">
                            + Thêm một giao dịch khác
                        </button>
                    )}
                </div>
            </AppleModal>

            {/* CONFIRM ALERT */}
            <AnimatePresence>
                {confirm.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                        <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="apple-glass !bg-[var(--bg-elevated)] w-[270px] !rounded-[14px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-4 pt-5 pb-4 text-center">
                                <h3 className={`font-semibold text-[17px] leading-snug mb-1 ${confirm.danger ? 'text-[var(--system-red)]' : 'text-[var(--label-primary)]'}`}>{confirm.title}</h3>
                                <p className="text-[13px] leading-tight text-[var(--label-secondary)] mt-1">{confirm.msg}</p>
                            </div>
                            <div className="flex border-t border-[var(--separator)]">
                                <button type="button" onClick={() => setConfirm({ ...confirm, show: false })} className={`flex-1 py-[11px] text-[17px] font-normal border-r border-[var(--separator)] hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirm.danger ? 'text-[var(--label-primary)]' : 'text-viet-gold'}`}>
                                    Hủy
                                </button>
                                <button type="button" onClick={executeAction} className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirm.danger ? 'text-[var(--system-red)]' : 'text-viet-gold'}`}>
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