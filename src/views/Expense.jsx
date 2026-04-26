import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// ĐÃ FIX: Thêm Minus, Plus vào import
import { Search, Inbox, ChevronRight, Copy, Edit2, Trash2, Eye, X, Minus, Plus } from 'lucide-react';

import AppleModal from '../components/AppleModal.jsx';
import AppleInputNumber from '../components/AppleInputNumber.jsx';
import AppleSelect from '../components/AppleSelect.jsx';
import AppleDatePicker from '../components/AppleDatePicker.jsx';
import { useSettingsStore } from '../store/useSettingsStore.js';
import { useToastStore } from '../store/useToastStore.js';
import api from '../utils/useApi.js';

export default function Expense() {
    const { currency } = useSettingsStore();
    const { addToast } = useToastStore();
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
    // REACT QUERY: Fetch danh sách Chi phí và Danh mục
    // =========================================================================
    const { data: expenses = [] } = useQuery({
        queryKey: ['transactions', 'EXPENSE'],
        queryFn: async () => {
            const data = await api.get('/transactions/type/EXPENSE');
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

    // Biến đổi Danh mục cho Dropdown
    const categoryOptions = useMemo(() =>
            rawCategories.filter(c => c.type === 'EXPENSE' && !c.isHidden).map(c => ({ label: c.name, value: c.id })),
        [rawCategories]);

    const sourceOptions = useMemo(() =>
            rawCategories.filter(c => c.type === 'PAYMENT' && !c.isHidden).map(c => ({
                label: c.name, value: c.id, subLabel: c.accountNo,
                logo: c.bankCode && c.bankCode !== 'CASH' ? `https://api.vietqr.io/img/${c.bankCode}.png` : 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png'
            })),
        [rawCategories]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('ALL');

    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingTx, setViewingTx] = useState(null);
    const [confirm, setConfirm] = useState({ show: false, title: '', msg: '', btn: '', type: '', danger: false, id: null });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Lọc Tháng
    const monthOptions = useMemo(() => {
        const opts = [{ value: 'ALL', label: 'Tất cả thời gian' }];
        const uniqueMonths = new Set();
        expenses.forEach(tx => {
            if (tx.date && tx.date.length >= 7) uniqueMonths.add(tx.date.substring(0, 7));
        });
        const sortedMonths = Array.from(uniqueMonths).sort().reverse();
        sortedMonths.forEach(m => {
            const [y, mm] = m.split('-');
            opts.push({ value: m, label: `Tháng ${mm}/${y}` });
        });
        return opts;
    }, [expenses]);

    // TÌM KIẾM MỜ
    const removeTones = (str) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
    };

    const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    };

    const fuzzyMatch = (text, query) => {
        if (!text) return false;
        const t = removeTones(text);
        const q = removeTones(query);
        if (t.includes(q)) return true;
        if (q.length > 3 && levenshtein(t, q) <= 2) return true;
        return false;
    };

    const filteredExpenses = useMemo(() => {
        let result = expenses;
        if (filterMonth !== 'ALL') {
            result = result.filter(r => r.date && r.date.startsWith(filterMonth));
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.trim();
            result = result.filter(r => fuzzyMatch(r.category, q) || fuzzyMatch(r.source, q) || fuzzyMatch(r.description, q));
        }
        return result;
    }, [expenses, filterMonth, searchQuery]);

    const groupedExpenses = useMemo(() => {
        const groups = {};
        filteredExpenses.forEach(tx => {
            if (!groups[tx.date]) groups[tx.date] = { date: tx.date, items: [], total: 0 };
            groups[tx.date].items.push(tx);
            groups[tx.date].total += tx.amount;
        });
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredExpenses]);

    const [collapsedDates, setCollapsedDates] = useState(new Set());
    const toggleDate = (date) => {
        const newSet = new Set(collapsedDates);
        if (newSet.has(date)) newSet.delete(date);
        else newSet.add(date);
        setCollapsedDates(newSet);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 10;
    const totalPages = useMemo(() => Math.max(1, Math.ceil(groupedExpenses.length / groupsPerPage)), [groupedExpenses, groupsPerPage]);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * groupsPerPage;
        return groupedExpenses.slice(start, start + groupsPerPage);
    }, [groupedExpenses, currentPage]);

    // STATE FORM
    const initForm = () => ({
        transactionDate: getTodayString(),
        items: [{ categoryId: '', categorySearch: '', paymentSourceId: '', sourceSearch: '', amount: null, description: '' }]
    });
    const [form, setForm] = useState(initForm());
    const [activeDropdown, setActiveDropdown] = useState(null);

    const closeAllDropdowns = () => setActiveDropdown(null);

    const filteredCategoryOptions = useCallback((search) => {
        if (!search) return categoryOptions;
        const q = removeTones(search);
        return categoryOptions.filter(opt => removeTones(opt.label).includes(q));
    }, [categoryOptions]);

    const selectCategory = (index, opt) => {
        const newItems = [...form.items];
        newItems[index].categoryId = opt.value;
        newItems[index].categorySearch = opt.label;
        setForm({ ...form, items: newItems });
        closeAllDropdowns();
    };

    const filteredSourceOptions = useCallback((search) => {
        if (!search) return sourceOptions;
        const q = removeTones(search);
        return sourceOptions.filter(opt => removeTones(opt.label).includes(q) || (opt.subLabel && removeTones(opt.subLabel).includes(q)));
    }, [sourceOptions]);

    const selectSource = (index, opt) => {
        const newItems = [...form.items];
        newItems[index].paymentSourceId = opt.value;
        newItems[index].sourceSearch = opt.label;
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
        setForm({ ...form, items: [...form.items, { categoryId: '', categorySearch: '', paymentSourceId: '', sourceSearch: '', amount: null, description: '' }] });
    };
    const removeItem = (idx) => {
        const newItems = [...form.items];
        newItems.splice(idx, 1);
        setForm({ ...form, items: newItems });
    };

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
        const src = sourceOptions.find(s => s.label === r.source);
        setForm({
            transactionDate: r.date,
            items: [{
                categoryId: cat ? cat.value : '', categorySearch: r.category,
                paymentSourceId: src ? src.value : '', sourceSearch: r.source,
                amount: r.amount, description: r.description
            }]
        });
        closeAllDropdowns();
        setShowAdd(true);
    };
    const openClone = (r) => {
        setEditingId(null);
        const cat = categoryOptions.find(c => c.label === r.category);
        const src = sourceOptions.find(s => s.label === r.source);
        setForm({
            transactionDate: r.date,
            items: [{
                categoryId: cat ? cat.value : '', categorySearch: r.category,
                paymentSourceId: src ? src.value : '', sourceSearch: r.source,
                amount: r.amount, description: r.description ? r.description + ' (Bản sao)' : '(Bản sao)'
            }]
        });
        closeAllDropdowns();
        setShowAdd(true);
    };

    const promptSave = async () => {
        const isValid = form.items.every(i => i.amount && i.categoryId && i.paymentSourceId);
        if (!isValid) return addToast("Vui lòng chọn Khoản mục, Nguồn tiền từ danh sách và nhập Số tiền!", "error");

        setIsAnalyzing(true);
        let anomalyDetected = null;
        for (const item of form.items) {
            try {
                const res = await api.post(`/transactions/analyze-anomaly?amount=${item.amount}&categoryId=${item.categoryId}&type=EXPENSE`);
                if (res && res.anomaly) { anomalyDetected = res; break; }
            } catch (e) { console.warn("Lỗi Z-Score", e); }
        }
        setIsAnalyzing(false);
        setShowAdd(false);

        if (anomalyDetected) {
            setConfirm({ show: true, title: 'Cảnh Báo Bất Thường', msg: anomalyDetected.message, btn: 'Vẫn Lưu', danger: true, type: 'SAVE' });
            return;
        }

        const isMultiple = form.items.length > 1;
        setConfirm({ show: true, title: editingId ? 'Cập nhật' : 'Xác nhận Lưu', msg: isMultiple ? `Lưu ${form.items.length} giao dịch cùng lúc?` : 'Xác nhận lưu thay đổi?', btn: 'Lưu', danger: false, type: 'SAVE' });
    };

    const promptDelete = (id) => {
        setConfirm({ show: true, title: 'Xóa giao dịch', msg: 'Hành động này không thể hoàn tác?', btn: 'Xóa', danger: true, type: 'DELETE', id });
    };

    // =========================================================================
    // OPTIMISTIC UI KẾT HỢP REACT QUERY
    // =========================================================================
    const executeAction = async () => {
        setConfirm({ ...confirm, show: false });

        if (confirm.type === 'SAVE') {
            const tempItems = form.items.map(item => ({
                id: 'temp-' + Math.random().toString(36).substr(2, 9),
                date: form.transactionDate, amount: item.amount,
                category: item.categorySearch || 'Đang cập nhật...', source: item.sourceSearch || '...',
                description: item.description || '', isTemp: true
            }));

            queryClient.setQueryData(['transactions', 'EXPENSE'], (old) => {
                if (!old) return tempItems;
                if (editingId) return old.map(e => e.id === editingId ? { ...e, ...tempItems[0] } : e);
                return [...tempItems, ...old];
            });

            addToast(editingId ? "Đang lưu thay đổi..." : "Đã thêm! Đang đồng bộ nền...", "info");

            try {
                const promises = form.items.map(item => {
                    const payload = {
                        transactionDate: form.transactionDate, amount: item.amount, type: 'EXPENSE', description: item.description,
                        category: { id: item.categoryId }, paymentSource: { id: item.paymentSourceId }
                    };
                    if (editingId) { payload.id = editingId; return api.put(`/transactions/${editingId}`, payload); }
                    else return api.post('/transactions', payload);
                });
                await Promise.all(promises);
                addToast("Đồng bộ Server hoàn tất!", "success");

                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['report-general'] });
            } catch (error) {
                addToast("Lỗi đồng bộ! Đang hoàn tác...", "error");
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
            }

        } else if (confirm.type === 'DELETE') {
            const targetId = confirm.id;

            queryClient.setQueryData(['transactions', 'EXPENSE'], (old) => old ? old.filter(e => e.id !== targetId) : []);
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

    return (
        <div className="space-y-6 relative z-10 apple-container pb-safe">
            {/* Tương tự đoạn HTML return của Expense cũ, chỉ thay là đã fix được lỗi thiếu Icon */}
            <div className="apple-glass p-4 sm:p-5 !rounded-[24px] space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h2 className="w-full lg:w-auto text-[20px] font-black">Quản lý Chi Phí</h2>
                    <button onClick={openAdd} className="btn-dong-son-gold px-6 py-2.5 outline-none w-full lg:w-auto">
                        + Ghi nhận chi
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-[var(--separator)]">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="sf-icon sf-icon-bold w-4 h-4 text-[var(--label-tertiary)]" />
                        </div>
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Tìm mờ: Gõ không dấu hoặc sai chính tả vẫn ra..." className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" />
                    </div>
                    <div className="w-full md:w-48">
                        <AppleSelect value={filterMonth} onChange={setFilterMonth} options={monthOptions} />
                    </div>
                </div>
            </div>

            <div className="apple-glass overflow-hidden !rounded-[24px] flex flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-elevated-secondary)] text-viet-gold text-[11px] uppercase font-bold tracking-widest border-b border-[var(--separator)]">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">STT</th>
                            <th className="px-6 py-4 whitespace-nowrap">Khoản mục</th>
                            <th className="px-6 py-4 whitespace-nowrap">Thanh toán qua</th>
                            <th className="px-6 py-4 w-1/3">Diễn giải</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">Số tiền</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--separator)]">
                        {paginatedGroups.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-[var(--label-secondary)] text-[13px] flex flex-col items-center justify-center">
                                    <Inbox className="sf-icon sf-icon-regular w-10 h-10 mb-3 opacity-50 text-viet-gold" />
                                    Không tìm thấy dữ liệu phù hợp.
                                </td>
                            </tr>
                        )}
                        {paginatedGroups.map((group) => (
                            <React.Fragment key={group.date}>
                                <tr className="bg-[var(--bg-elevated)] cursor-pointer hover:bg-[#D4AF37]/10 transition-colors" onClick={() => toggleDate(group.date)}>
                                    <td colSpan={6} className="px-6 py-3.5 border-b-2 border-[#D4AF37]/20">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight className={`sf-icon sf-icon-bold w-4 h-4 text-viet-gold transition-transform duration-200 ${collapsedDates.has(group.date) ? 'rotate-0' : 'rotate-90'}`} />
                                                <span className="font-bold">Ngày {formatDate(group.date)}</span>
                                                <span className="text-[10px] bg-[#D4AF37]/10 text-viet-gold border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider">{group.items.length} giao dịch</span>
                                            </div>
                                            <span className="font-black tabular-nums tracking-tight text-[var(--system-red)] text-[15px]">- {formatMoney(group.total)}</span>
                                        </div>
                                    </td>
                                </tr>
                                <AnimatePresence>
                                    {!collapsedDates.has(group.date) && group.items.map((r, index) => (
                                        <motion.tr key={r.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className={`group transition-colors bg-transparent ${r.isTemp ? 'opacity-60 bg-[var(--system-blue)]/5 pointer-events-none' : 'hover:bg-[var(--bg-elevated-secondary)]'}`}>
                                            <td className="px-6 py-4 border-b border-[var(--separator)]">
                                                <div className="flex justify-center items-center w-6 h-6 rounded-full bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] font-bold text-[11px] mx-auto group-hover:bg-[#D4AF37]/20 group-hover:text-viet-gold transition-colors">{index + 1}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-[var(--separator)]">
                                                <span className="px-2.5 py-1 bg-[var(--system-red)]/10 text-[var(--system-red)] rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">{r.category}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[13px] whitespace-nowrap border-b border-[var(--separator)]">{r.source}</td>
                                            <td className="px-6 py-4 text-[var(--label-secondary)] font-medium text-[13px] border-b border-[var(--separator)]">
                                                <div className="line-clamp-2 min-w-[120px] max-w-[200px] md:max-w-[300px]" title={r.description}>{r.description || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold tabular-nums tracking-tight text-right text-[var(--system-red)] whitespace-nowrap text-[15px] border-b border-[var(--separator)]">- {formatMoney(r.amount)}</td>
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
                <div className="flex items-center justify-between p-4 border-t border-[var(--separator)] bg-[var(--bg-elevated-secondary)]/50">
                    <span className="text-[12px] font-medium text-[var(--label-secondary)]">Trang {currentPage} / {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-lg text-[13px] hover:text-viet-gold disabled:opacity-50 outline-none">Trang trước</button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-lg text-[13px] hover:text-viet-gold disabled:opacity-50 outline-none">Trang sau</button>
                    </div>
                </div>
            </div>

            <AppleModal show={!!viewingTx} title="Biên Lai Chi Tiết" confirmText="Đóng" onClose={() => setViewingTx(null)} onConfirm={() => setViewingTx(null)}>
                {viewingTx && (
                    <div className="px-2 pb-2 text-left">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-[var(--separator)] mb-5">
                            <div className="w-14 h-14 rounded-full bg-[var(--system-red)]/10 flex items-center justify-center mb-3 shadow-sm border border-[var(--system-red)]/30">
                                <Minus className="sf-icon sf-icon-bold w-7 h-7 text-[var(--system-red)]" />
                            </div>
                            <h2 className="text-[32px] leading-none font-black text-[var(--system-red)] tabular-nums tracking-tight drop-shadow-sm">- {formatMoney(viewingTx.amount)}</h2>
                            <p className="text-[12px] font-bold text-viet-gold uppercase mt-2 tracking-widest">{viewingTx.category}</p>
                        </div>
                        <div className="space-y-4 text-[14px]">
                            <div className="flex justify-between items-center"><span className="caption">Ngày giao dịch</span><span className="font-bold text-[var(--label-primary)]">{formatDate(viewingTx.date)}</span></div>
                            <div className="flex justify-between items-center"><span className="caption">Thanh toán qua</span><span className="font-bold text-viet-gold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1 rounded-lg text-[12px]">{viewingTx.source}</span></div>
                            <div className="flex justify-between items-start mt-4 pt-4 border-t border-dashed border-[var(--separator)]">
                                <span className="caption whitespace-nowrap mr-4">Diễn giải</span>
                                <span className="font-medium text-right leading-relaxed text-[var(--label-primary)]">{viewingTx.description || 'Không có ghi chú'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </AppleModal>

            <AppleModal show={showAdd} title={editingId ? 'Cập nhật giao dịch' : 'Ghi nhận chi phí'} onClose={() => setShowAdd(false)} onConfirm={promptSave}>
                <div className="space-y-4 text-left relative" onClick={closeAllDropdowns}>
                    {isAnalyzing && (
                        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-elevated)]/60 backdrop-blur-md rounded-2xl">
                            <div className="w-10 h-10 border-4 border-[var(--system-red)] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[14px] font-bold text-[var(--system-red)] animate-pulse">AI đang phân tích bất thường...</p>
                        </div>
                    )}
                    <div className="bg-[var(--bg-elevated-secondary)] p-4 rounded-2xl border border-[var(--border-subtle)]">
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Ngày giao dịch chung</label>
                        <AppleDatePicker value={form.transactionDate} onChange={(val) => setForm({...form, transactionDate: val})}/>
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Khoản mục</label>
                                            <input value={item.categorySearch} onChange={(e) => updateItemField(index, 'categorySearch', e.target.value)} onFocus={() => setActiveDropdown(`cat-${index}`)} type="text" placeholder="Gõ hoặc chọn..." className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" />
                                            <AnimatePresence>
                                                {activeDropdown === `cat-${index}` && (
                                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[99] w-full mt-1 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--separator)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto custom-scrollbar">
                                                        <ul className="p-1.5">
                                                            {filteredCategoryOptions(item.categorySearch).map(opt => (
                                                                <li key={opt.value} onClick={() => selectCategory(index, opt)} className="px-3 py-2.5 text-[14px] font-bold hover:bg-[#D4AF37]/10 hover:text-viet-gold rounded-[8px] cursor-pointer transition-colors">{opt.label}</li>
                                                            ))}
                                                        </ul>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Nguồn tiền</label>
                                            <input value={item.sourceSearch} onChange={(e) => updateItemField(index, 'sourceSearch', e.target.value)} onFocus={() => setActiveDropdown(`src-${index}`)} type="text" placeholder="Gõ hoặc chọn..." className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" />
                                            <AnimatePresence>
                                                {activeDropdown === `src-${index}` && (
                                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[99] w-full mt-1 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--separator)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto custom-scrollbar">
                                                        <ul className="p-1.5">
                                                            {filteredSourceOptions(item.sourceSearch).map(opt => (
                                                                <li key={opt.value} onClick={() => selectSource(index, opt)} className="px-3 py-2.5 text-[14px] font-bold hover:bg-[#D4AF37]/10 hover:text-viet-gold rounded-[8px] cursor-pointer transition-colors flex items-center gap-2.5">
                                                                    {opt.logo && <img src={opt.logo} alt="logo" className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-gray-200 no-dim" />}
                                                                    <div className="flex flex-col"><span>{opt.label}</span>{opt.subLabel && <span className="text-[10px] font-mono text-[var(--label-tertiary)]">{opt.subLabel}</span>}</div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div>
                                        <AppleInputNumber value={item.amount} onChange={val => updateItemField(index, 'amount', val)} label="Số tiền (VNĐ)" />
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                            {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                                                <button key={amt} type="button" onClick={(e) => { e.preventDefault(); addQuickAmount(index, amt); }} className="flex-1 min-w-[42px] py-1 bg-[#D4AF37]/10 text-viet-gold hover:bg-[#D4AF37] hover:text-[#1A1514] rounded-[8px] text-[11px] font-bold transition-colors outline-none text-center tabular-nums border border-[#D4AF37]/20">+{amt / 1000}k</button>
                                            ))}
                                            <button type="button" onClick={(e) => { e.preventDefault(); clearAmount(index); }} title="Làm lại" className="py-1 px-3 bg-[var(--bg-elevated-secondary)] hover:bg-[var(--system-red)]/10 hover:text-[var(--system-red)] text-[var(--label-secondary)] rounded-[8px] transition-colors outline-none flex items-center justify-center border border-[var(--border-subtle)]"><X className="sf-icon sf-icon-bold w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    <textarea value={item.description} onChange={e => updateItemField(index, 'description', e.target.value)} placeholder="Diễn giải / Ghi chú..." className="w-full p-3 bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] shadow-sm h-16 resize-none text-[14px] transition-all text-[var(--label-primary)]"></textarea>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!editingId && (
                        <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-[#D4AF37]/50 text-viet-gold hover:bg-[#D4AF37]/10 rounded-[16px] font-bold text-[13px] transition-colors outline-none">+ Thêm một giao dịch khác</button>
                    )}
                </div>
            </AppleModal>

            <AnimatePresence>
                {confirm.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                        <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="apple-glass !bg-[var(--bg-elevated)] w-[270px] !rounded-[14px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-4 pt-5 pb-4 text-center">
                                <h3 className={`font-semibold text-[17px] leading-snug mb-1 ${confirm.danger ? 'text-[var(--system-red)]' : 'text-[var(--label-primary)]'}`}>{confirm.title}</h3>
                                <p className="text-[13px] leading-tight text-[var(--label-secondary)] mt-1">{confirm.msg}</p>
                            </div>
                            <div className="flex border-t border-[var(--separator)]">
                                <button type="button" onClick={() => setConfirm({...confirm, show: false})} className={`flex-1 py-[11px] text-[17px] font-normal border-r border-[var(--separator)] hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirm.danger ? 'text-[var(--label-primary)]' : 'text-viet-gold'}`}>Hủy</button>
                                <button type="button" onClick={executeAction} className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirm.danger ? 'text-[var(--system-red)]' : 'text-viet-gold'}`}>{confirm.btn}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}