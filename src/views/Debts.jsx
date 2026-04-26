import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Sparkles } from 'lucide-react';

import AppleModal from '../components/AppleModal.jsx';
import AppleSelect from '../components/AppleSelect.jsx';
import AppleInputNumber from '../components/AppleInputNumber.jsx';
import AppleDatePicker from '../components/AppleDatePicker.jsx';
import { useToastStore } from '../store/useToastStore.js';
import { useSettingsStore } from '../store/useSettingsStore.js';
import api from '../utils/useApi.js';

export default function Debts() {
    const { addToast } = useToastStore();
    const { currency } = useSettingsStore();

    // Khởi tạo Query Client để điều khiển Cache
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
    // REACT QUERY: Fetch danh sách Công nợ tự động (Loại bỏ useEffect)
    // =========================================================================
    const { data: debts = [] } = useQuery({
        queryKey: ['debts'],
        queryFn: async () => {
            const data = await api.get('/debts');
            return data || [];
        }
    });
    // =========================================================================

    const [showDebtModal, setShowDebtModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingDebt, setViewingDebt] = useState(null);

    const [confirmAlert, setConfirmAlert] = useState({ show: false, type: '', id: null, title: '', msg: '', btn: '', isDanger: false, debtObj: null });

    const calculateDebtDetails = useCallback((d) => {
        if (!d) return { principal: 0, interest: 0, totalLiability: 0, paid: 0, remain: 0, days: 0 };
        const principal = (d.disbursedAmount && d.disbursedAmount > 0) ? Number(d.disbursedAmount) : (Number(d.total) || 0);
        const rate = Number(d.interestRate) || 0;
        const paid = Number(d.paid) || 0;
        const startDate = new Date(d.regDate);
        const nowDate = new Date();
        let diffTime = nowDate.getTime() - startDate.getTime();
        if (diffTime < 0) diffTime = 0;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const interest = principal * (rate / 100) * (diffDays / 365);
        const totalLiability = principal + interest;
        const remain = totalLiability - paid;
        return {
            principal: Math.round(principal),
            interest: Math.round(interest),
            totalLiability: Math.round(totalLiability),
            paid: Math.round(paid),
            remain: remain > 0 ? Math.round(remain) : 0,
            days: diffDays
        };
    }, []);

    const [selectedLedger, setSelectedLedger] = useState(null);
    const [ledgerData, setLedgerData] = useState([]);
    const [riskProfile, setRiskProfile] = useState(null);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);

    const openLedger = async (partnerName) => {
        setSelectedLedger(partnerName);
        setLedgerData([]);
        setRiskProfile(null);
        setIsLedgerLoading(true);
        try {
            const formattedName = partnerName.trim().toUpperCase().replace(/\s+/g, "_");
            const [statementRes, riskRes] = await Promise.all([
                api.get(`/ledger/statement/${formattedName}`),
                api.get(`/ledger/risk-score/${formattedName}`)
            ]);
            if (statementRes) setLedgerData(statementRes);
            if (riskRes) setRiskProfile(riskRes);
        } catch (error) {
            addToast("Không thể tải dữ liệu Sổ cái Kép lúc này!", "error");
        } finally {
            setIsLedgerLoading(false);
        }
    };

    const [showSimplifyModal, setShowSimplifyModal] = useState(false);
    const [isSimplifying, setIsSimplifying] = useState(false);
    const [debtSuggestions, setDebtSuggestions] = useState([]);

    const openSimplify = async () => {
        setShowSimplifyModal(true);
        setIsSimplifying(true);
        setDebtSuggestions([]);
        try {
            const res = await api.get('/debts/simplify');
            if (res) setDebtSuggestions(res);
        } catch (error) {
            addToast("Không thể tính toán cấn trừ lúc này!", "error");
        } finally {
            setIsSimplifying(false);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterMonth, setFilterMonth] = useState('ALL');
    const [sortBy, setSortBy] = useState('REMAIN_DESC');

    const sortOptions = [
        { label: 'Dư nợ giảm dần', value: 'REMAIN_DESC' },
        { label: 'Hạn mức giảm dần', value: 'LIMIT_DESC' },
        { label: 'Tên đối tác (A-Z)', value: 'NAME_ASC' },
        { label: 'Giao dịch Mới nhất', value: 'DATE_DESC' },
        { label: 'Giao dịch Cũ nhất', value: 'DATE_ASC' }
    ];

    const uniqueDebtors = useMemo(() => {
        const names = new Set(debts.map(d => d.debtor?.trim()).filter(Boolean));
        return Array.from(names).sort();
    }, [debts]);

    const monthOptions = useMemo(() => {
        const opts = [{ value: 'ALL', label: 'Tất cả thời gian' }];
        const months = new Set(debts.map(d => d.regDate?.substring(0, 7)).filter(Boolean));
        Array.from(months).sort().reverse().forEach(m => {
            const [y, mm] = m.split('-');
            opts.push({ value: m, label: `Tháng ${mm}/${y}` });
        });
        return opts;
    }, [debts]);

    const filteredDebts = useMemo(() => {
        return debts.filter(d => {
            if (filterType === 'CHO_VAY' && d.type !== 'Cho vay' && d.type !== 'Cho người khác mượn') return false;
            if (filterType === 'DI_VAY' && d.type !== 'Đi vay' && d.type !== 'Mình đi mượn') return false;
            if (filterMonth !== 'ALL' && !d.regDate?.startsWith(filterMonth)) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = d.debtor?.toLowerCase().includes(q);
                const matchDesc = d.description?.toLowerCase().includes(q);
                if (!matchName && !matchDesc) return false;
            }
            return true;
        });
    }, [debts, filterType, filterMonth, searchQuery]);

    const debtStats = useMemo(() => {
        let totalLend = 0;
        let totalBorrow = 0;
        filteredDebts.forEach(d => {
            const details = calculateDebtDetails(d);
            if (d.status !== 'Đã thanh toán') {
                if (d.type === 'Cho vay' || d.type === 'Cho người khác mượn') totalLend += details.remain;
                else totalBorrow += details.remain;
            }
        });
        return { totalLend, totalBorrow };
    }, [filteredDebts, calculateDebtDetails]);

    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
    const toggleGroup = (name) => {
        const newSet = new Set(collapsedGroups);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setCollapsedGroups(newSet);
    };

    const groupedDebts = useMemo(() => {
        const map = {};
        filteredDebts.forEach(d => {
            const name = d.debtor || 'Đối tác khác';
            if (!map[name]) map[name] = { name, items: [], totalLimit: 0, totalRemain: 0, latestDate: '' };
            map[name].items.push(d);
            map[name].totalLimit += (d.total || 0);

            const details = calculateDebtDetails(d);
            if (d.status !== 'Đã thanh toán') {
                map[name].totalRemain += details.remain;
            }
            if (!map[name].latestDate || d.regDate > map[name].latestDate) {
                map[name].latestDate = d.regDate;
            }
        });

        Object.values(map).forEach(group => {
            group.items.sort((a, b) => {
                if (a.status === 'Đã thanh toán' && b.status !== 'Đã thanh toán') return 1;
                if (a.status !== 'Đã thanh toán' && b.status === 'Đã thanh toán') return -1;
                return new Date(b.regDate) - new Date(a.regDate);
            });
        });

        return Object.values(map).sort((a, b) => {
            if (sortBy === 'REMAIN_DESC') return b.totalRemain - a.totalRemain;
            if (sortBy === 'LIMIT_DESC') return b.totalLimit - a.totalLimit;
            if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
            if (sortBy === 'DATE_DESC') return new Date(b.latestDate) - new Date(a.latestDate);
            if (sortBy === 'DATE_ASC') return new Date(a.latestDate) - new Date(b.latestDate);
            return 0;
        });
    }, [filteredDebts, calculateDebtDetails, sortBy]);

    const [currentPage, setCurrentPage] = useState(1);
    const [groupsPerPage, setGroupsPerPage] = useState(5);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(groupedDebts.length / groupsPerPage)), [groupedDebts.length, groupsPerPage]);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * groupsPerPage;
        return groupedDebts.slice(start, start + Number(groupsPerPage));
    }, [groupedDebts, currentPage, groupsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType, filterMonth, sortBy, groupsPerPage]);

    const initDebt = () => ({
        type: 'Cho vay', debtor: '', total: null, term: 1, isTermIndefinite: false,
        interestRate: 0, regDate: getTodayString(), description: '',
        disbursements: [], repayments: []
    });
    const [newDebt, setNewDebt] = useState(initDebt());
    const [showDebtorDropdown, setShowDebtorDropdown] = useState(false);

    const filteredDebtors = useMemo(() => {
        const q = (newDebt.debtor || '').toLowerCase();
        if (!q) return uniqueDebtors;
        return uniqueDebtors.filter(n => n.toLowerCase().includes(q));
    }, [newDebt.debtor, uniqueDebtors]);

    const selectDebtor = (name) => {
        setNewDebt(prev => ({ ...prev, debtor: name }));
        setShowDebtorDropdown(false);
    };

    const addQuickTotal = (amt) => {
        let current = Number(newDebt.total) || 0;
        setNewDebt(prev => ({ ...prev, total: current + amt }));
    };
    const clearTotal = () => setNewDebt(prev => ({ ...prev, total: null }));

    const autoCalculatedDisbursed = useMemo(() => {
        if (!newDebt.disbursements) return 0;
        return newDebt.disbursements.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [newDebt.disbursements]);

    const autoCalculatedPaid = useMemo(() => {
        if (!newDebt.repayments) return 0;
        return newDebt.repayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [newDebt.repayments]);

    const addDisbursement = () => {
        const list = newDebt.disbursements || [];
        setNewDebt({ ...newDebt, disbursements: [...list, { date: getTodayString(), amount: null, note: '' }] });
    };
    const removeDisbursement = (idx) => {
        const list = [...newDebt.disbursements];
        list.splice(idx, 1);
        setNewDebt({ ...newDebt, disbursements: list });
    };
    const updateDisbursement = (idx, field, val) => {
        const list = [...newDebt.disbursements];
        list[idx][field] = val;
        setNewDebt({ ...newDebt, disbursements: list });
    };

    const addRepayment = () => {
        const list = newDebt.repayments || [];
        setNewDebt({ ...newDebt, repayments: [...list, { date: getTodayString(), amount: null, note: '' }] });
    };
    const removeRepayment = (idx) => {
        const list = [...newDebt.repayments];
        list.splice(idx, 1);
        setNewDebt({ ...newDebt, repayments: list });
    };
    const updateRepayment = (idx, field, val) => {
        const list = [...newDebt.repayments];
        list[idx][field] = val;
        setNewDebt({ ...newDebt, repayments: list });
    };

    const getChatTimeline = (d) => {
        let timeline = [];
        const isBorrow = d.type === 'Đi vay' || d.type === 'Mình đi mượn';
        if (d.disbursements && d.disbursements.length > 0) {
            d.disbursements.forEach((dis) => {
                timeline.push({
                    timestamp: new Date(dis.date).getTime(),
                    date: formatDate(dis.date),
                    title: isBorrow ? 'Họ gửi giải ngân' : 'Mình giải ngân',
                    amountStr: formatMoney(dis.amount),
                    align: isBorrow ? 'left' : 'right',
                    desc: dis.note
                });
            });
        }
        if (d.repayments && d.repayments.length > 0) {
            d.repayments.forEach((pay) => {
                timeline.push({
                    timestamp: new Date(pay.date).getTime() + 1,
                    date: formatDate(pay.date),
                    title: isBorrow ? 'Mình trả nợ' : 'Họ trả nợ',
                    amountStr: formatMoney(pay.amount),
                    align: isBorrow ? 'right' : 'left',
                    desc: pay.note
                });
            });
        }
        return timeline.sort((a, b) => a.timestamp - b.timestamp);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const openView = (d) => setViewingDebt(d);

    const openAdd = () => {
        setEditingId(null);
        setNewDebt(initDebt());
        setShowDebtorDropdown(false);
        setShowDebtModal(true);
    };

    const openEdit = (d) => {
        setEditingId(d.id);
        setNewDebt({
            type: d.type === 'Mình đi mượn' ? 'Đi vay' : (d.type === 'Cho người khác mượn' ? 'Cho vay' : d.type),
            debtor: d.debtor, total: d.total,
            term: d.term, isTermIndefinite: !d.term,
            interestRate: d.interestRate || 0, regDate: d.regDate,
            description: d.description || '',
            disbursements: d.disbursements ? JSON.parse(JSON.stringify(d.disbursements)) : [],
            repayments: d.repayments ? JSON.parse(JSON.stringify(d.repayments)) : [],
            status: d.status
        });
        setShowDebtorDropdown(false);
        setShowDebtModal(true);
    };

    const saveDebt = async () => {
        if (!newDebt.debtor || !newDebt.debtor.trim()) return addToast("Vui lòng nhập Đối tác!", "error");
        if (!newDebt.total || newDebt.total <= 0) return addToast("Tổng hạn mức phải lớn hơn 0!", "error");
        if (!newDebt.regDate) return addToast("Vui lòng chọn ngày ký hợp đồng!", "error");

        const payload = {
            debtType: newDebt.type,
            debtorName: newDebt.debtor.trim(),
            totalAmount: newDebt.total,
            disbursedAmount: editingId ? autoCalculatedDisbursed : 0,
            paidAmount: editingId ? autoCalculatedPaid : 0,
            loanTerm: newDebt.isTermIndefinite ? null : newDebt.term,
            interestRate: newDebt.interestRate || 0,
            registrationDate: newDebt.regDate,
            description: newDebt.description,
            disbursements: newDebt.disbursements,
            repayments: newDebt.repayments,
            status: newDebt.status || 'Đang hiệu lực'
        };

        try {
            if (editingId) {
                await api.put(`/debts/${editingId}`, payload);
                addToast("Cập nhật hợp đồng thành công!", "success");
            } else {
                await api.post('/debts', payload);
                addToast("Đã tạo hợp đồng mới!", "success");
            }
            setShowDebtModal(false);

            // Xóa Cache, buộc hệ thống lấy danh sách nợ mới nhất
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        } catch (err) {
            addToast("Lỗi khi lưu dữ liệu vào hệ thống!", "error");
        }
    };

    const promptDelete = (id) => {
        setConfirmAlert({
            show: true, type: 'DELETE', id,
            title: 'Xóa Hợp Đồng',
            msg: 'Hành động này không thể hoàn tác. Sổ cái Kép sẽ bị xóa liên đới. Tiếp tục?',
            btn: 'Xóa', isDanger: true, debtObj: null
        });
    };

    const promptComplete = (d) => {
        setConfirmAlert({
            show: true, type: 'COMPLETE', id: d.id, debtObj: d,
            title: 'Tất toán khoản vay',
            msg: 'Xác nhận hợp đồng này đã hoàn thành? (Hợp đồng sẽ được đóng gói vào lịch sử).',
            btn: 'Tất toán', isDanger: false
        });
    };

    const executeAlertAction = async () => {
        setConfirmAlert({ ...confirmAlert, show: false });
        try {
            if (confirmAlert.type === 'DELETE') {
                await api.delete(`/debts/${confirmAlert.id}`);
                addToast("Đã xóa hợp đồng khỏi hệ thống!", "success");
            } else if (confirmAlert.type === 'COMPLETE') {
                const d = confirmAlert.debtObj;
                const payload = {
                    debtType: d.type === 'Mình đi mượn' ? 'Đi vay' : (d.type === 'Cho người khác mượn' ? 'Cho vay' : d.type),
                    debtorName: d.debtor,
                    totalAmount: d.total,
                    disbursedAmount: d.disbursedAmount || 0,
                    paidAmount: d.paid || 0,
                    loanTerm: d.term,
                    interestRate: d.interestRate,
                    registrationDate: d.regDate,
                    description: d.description,
                    disbursements: d.disbursements || [],
                    repayments: d.repayments || [],
                    status: 'Đã thanh toán'
                };
                await api.put(`/debts/${d.id}`, payload);
                addToast("Đã gói thành công vào lịch sử vay!", "success");
            }
            // Xóa Cache, buộc hệ thống lấy danh sách nợ mới nhất
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        } catch (err) {
            addToast("Thao tác thất bại!", "error");
        }
    };

    return (
        <div className="space-y-6 relative z-10 apple-container pb-safe">

            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="apple-glass p-5 !rounded-[20px] border-l-[4px] border-l-[var(--system-blue)] shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Tổng Tiền Mình Cho Vay (Tài Sản)</p>
                    <h3 className="text-2xl font-black text-[var(--system-blue)] mt-1 tabular-nums tracking-tight">+ {formatMoney(debtStats.totalLend)}</h3>
                </div>
                <div className="apple-glass p-5 !rounded-[20px] border-l-[4px] border-l-[var(--system-red)] shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Tổng Tiền Mình Đi Vay (Nợ Phải Trả)</p>
                    <h3 className="text-2xl font-black text-[var(--system-red)] mt-1 tabular-nums tracking-tight">- {formatMoney(debtStats.totalBorrow)}</h3>
                </div>
            </div>

            {/* HEADER & CONTROLS */}
            <div className="apple-glass p-4 sm:p-5 !rounded-[24px] space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h2 className="text-[20px] font-black w-full lg:w-auto">Sổ Quản Lý Công Nợ</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
                        <button onClick={() => setShowGuideModal(true)} className="group relative px-4 py-2.5 rounded-xl font-bold text-[13px] outline-none flex items-center justify-center gap-2 overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-sm bg-[var(--bg-elevated)] border border-[var(--separator)] w-full sm:w-auto">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#007AFF]/10 to-[#AF52DE]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Info className="sf-icon sf-icon-bold w-4 h-4 text-[var(--system-blue)]" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--system-blue)] to-[#AF52DE]">Cẩm nang AI</span>
                        </button>

                        <button onClick={openSimplify} className="group relative px-4 py-2.5 rounded-xl font-bold text-[13px] outline-none flex items-center justify-center gap-2 overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-sm bg-[var(--bg-elevated)] border border-[#D4AF37]/40 w-full sm:w-auto">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-[#FF9500]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Sparkles className="sf-icon sf-icon-bold w-4 h-4 text-[#D4AF37] transition-transform group-hover:rotate-12" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#FF9500]">Cấn trừ thông minh</span>
                        </button>

                        <button onClick={openAdd} className="btn-dong-son-gold px-5 py-2.5 outline-none w-full sm:w-auto flex items-center justify-center gap-2">
                            <svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                            Ghi nhận hợp đồng
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-wrap gap-3 pt-4 border-t border-[var(--separator)]">
                    <div className="flex-1 min-w-[250px] relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="sf-icon sf-icon-bold w-4 h-4 text-[var(--label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            type="text"
                            placeholder="Tìm theo tên Đối tác, Ghi chú..."
                            className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                        />
                    </div>

                    <div className="w-full sm:w-auto min-w-[140px]">
                        <AppleSelect value={filterType} onChange={setFilterType} options={[{label:'Tất cả loại nợ', value:'ALL'}, {label:'Mình Cho Vay', value:'CHO_VAY'}, {label:'Mình Đi Vay', value:'DI_VAY'}]} />
                    </div>
                    <div className="w-full sm:w-auto min-w-[150px]">
                        <AppleSelect value={filterMonth} onChange={setFilterMonth} options={monthOptions} />
                    </div>
                    <div className="w-full sm:w-auto min-w-[170px]">
                        <AppleSelect value={sortBy} onChange={setSortBy} options={sortOptions} />
                    </div>
                </div>
            </div>

            {/* BẢNG CHÍNH */}
            <div className="apple-glass overflow-hidden !rounded-[24px] flex flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-elevated-secondary)] text-viet-gold text-[11px] uppercase font-bold tracking-widest border-b border-[var(--separator)]">
                        <tr>
                            <th className="px-4 py-4 w-12 text-center">STT</th>
                            <th className="px-4 py-4 whitespace-nowrap">Đối tác / Người liên quan</th>
                            <th className="px-4 py-4 text-center">Số khoản vay</th>
                            <th className="px-4 py-4 text-right">Tổng Hạn Mức</th>
                            <th className="px-4 py-4 text-right">Tổng Dư Nợ Hiện Tại</th>
                            <th className="px-4 py-4 text-right">Hồ sơ Sổ cái</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--separator)]">
                        {paginatedGroups.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-[var(--label-secondary)] text-[13px] flex flex-col items-center justify-center">
                                    <svg className="sf-icon sf-icon-regular w-10 h-10 mb-3 opacity-50 text-viet-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Không tìm thấy dữ liệu phù hợp.
                                </td>
                            </tr>
                        )}

                        {paginatedGroups.map((group, gIdx) => (
                            <React.Fragment key={group.name}>
                                <tr className="bg-[var(--bg-elevated)] cursor-pointer hover:bg-[#D4AF37]/10 transition-colors" onClick={() => toggleGroup(group.name)}>
                                    <td className="px-4 py-4 text-center font-black text-[var(--label-secondary)] text-[13px]">
                                        {(currentPage - 1) * groupsPerPage + gIdx + 1}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <svg className={`sf-icon sf-icon-bold w-4 h-4 text-viet-gold transition-transform duration-200 ${collapsedGroups.has(group.name) ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black bg-[var(--bg-elevated-secondary)] text-viet-gold border border-[#D4AF37]/30 shadow-sm">
                                                {getInitials(group.name)}
                                            </div>
                                            <p className="font-bold text-[16px]">{group.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold text-[14px] text-[var(--label-primary)]">{group.items.length}</td>
                                    <td className="px-4 py-4 font-black text-[15px] tabular-nums tracking-tight text-right text-viet-gold">{formatMoney(group.totalLimit)}</td>
                                    <td className={`px-4 py-4 font-black text-[15px] tabular-nums tracking-tight text-right ${group.totalRemain > 0 ? 'text-[var(--system-red)]' : 'text-[var(--system-green)]'}`}>{formatMoney(group.totalRemain)}</td>
                                    <td className="px-4 py-4 text-right">
                                        <button onClick={(e) => { e.stopPropagation(); openLedger(group.name); }} className="text-[12px] font-bold text-[var(--system-blue)] bg-[var(--system-blue)]/10 px-3 py-1.5 rounded-lg border border-[var(--system-blue)]/20 hover:bg-[var(--system-blue)]/20 transition-colors shadow-sm outline-none inline-flex items-center gap-1.5">
                                            <svg className="sf-icon sf-icon-bold w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            Xem Sổ cái
                                        </button>
                                    </td>
                                </tr>

                                {!collapsedGroups.has(group.name) && group.items.map((d, index) => (
                                    <tr key={d.id} onClick={() => openView(d)} className={`hover:bg-[var(--bg-elevated-secondary)] transition-colors cursor-pointer group bg-transparent ${d.status === 'Đã thanh toán' ? 'opacity-50 grayscale-[30%]' : ''}`}>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center items-center w-5 h-5 rounded-full bg-[var(--bg-elevated-secondary)] text-[var(--label-tertiary)] font-bold text-[10px] mx-auto transition-colors group-hover:bg-[#D4AF37]/20 group-hover:text-viet-gold">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 pl-8">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="font-bold text-[14px] group-hover:text-viet-gold transition-colors flex items-center gap-1.5 truncate">
                                                        {d.status === 'Đã thanh toán' ? (
                                                            <svg className="sf-icon sf-icon-bold w-4 h-4 text-[var(--label-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                                        ) : (
                                                            <svg className="sf-icon sf-icon-bold w-4 h-4 text-viet-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                        )}
                                                        {d.status === 'Đã thanh toán' ? 'Lịch sử vay' : 'Đang hiệu lực'}
                                                    </p>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 inline-block ${(d.type === 'Mình đi mượn' || d.type === 'Đi vay') ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'}`}>
                                                        {(d.type === 'Mình đi mượn' || d.type === 'Đi vay') ? 'Mình Đi Vay' : 'Mình Cho Vay'} • {formatDate(d.regDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${d.status === 'Đã thanh toán' ? 'bg-[var(--system-green)]/10 text-[var(--system-green)]' : 'bg-[#D4AF37]/10 text-viet-gold border border-[#D4AF37]/30'}`}>
                                                {d.status === 'Đã thanh toán' ? 'Đã tất toán' : 'Đang vay'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4" colSpan={2}>
                                            <div className="flex flex-col gap-1.5 w-[90%] float-right">
                                                <div className="flex justify-between items-end">
                                                    <span className={`text-[14px] font-black tracking-tight tabular-nums ${d.type.includes('Cho') ? 'text-[var(--system-green)]' : 'text-[var(--system-red)]'}`}>
                                                        {formatMoney(d.total)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[var(--label-secondary)]">Đã trả: {formatMoney(d.paid)}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--separator)] rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full transition-all duration-1000 rounded-full ${calculateDebtDetails(d).remain <= 0 ? 'bg-[var(--system-green)]' : 'bg-[#D4AF37]'}`}
                                                         style={{ width: `${calculateDebtDetails(d).totalLiability ? (d.paid / calculateDebtDetails(d).totalLiability) * 100 : 0}%` }}>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1.5 transition-opacity opacity-0 group-hover:opacity-100">
                                                {d.status !== 'Đã thanh toán' && (
                                                    <button onClick={(e) => { e.stopPropagation(); promptComplete(d); }} title="Tất toán hợp đồng" className="apple-btn-icon !bg-[var(--system-green)]/10 text-[var(--system-green)] hover:!text-[var(--bg-elevated)] hover:!bg-[var(--system-green)]"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); openView(d); }} title="Xem" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-blue)] hover:!bg-[var(--system-blue)]/10"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></button>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} title="Sửa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-orange)] hover:!bg-[var(--system-orange)]/10"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                                <button onClick={(e) => { e.stopPropagation(); promptDelete(d.id); }} title="Xóa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-red)] hover:!bg-[var(--system-red)]/10"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>

                {groupedDebts.length > 0 && (
                    <div className="p-4 border-t border-[var(--separator)] bg-[var(--bg-elevated-secondary)]/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Hiển thị:</span>
                            <select value={groupsPerPage} onChange={e => setGroupsPerPage(Number(e.target.value))} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[12px] font-medium px-2 py-1 outline-none cursor-pointer hover:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/40 shadow-sm">
                                <option value={5}>5 Đối tác / Trang</option>
                                <option value={10}>10 Đối tác / Trang</option>
                                <option value={20}>20 Đối tác / Trang</option>
                                <option value={1000}>Tất cả</option>
                            </select>
                            <span className="text-[12px] font-medium text-[var(--label-secondary)] hidden sm:inline-block">
                                (Đã lọc được {groupedDebts.length} đối tác)
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--separator)] !rounded-lg text-[var(--label-primary)] hover:!text-viet-gold hover:border-[#D4AF37] hover:!bg-[#D4AF37]/10 disabled:opacity-40 disabled:hover:border-[var(--separator)] disabled:hover:!text-[var(--label-primary)] disabled:cursor-not-allowed shadow-sm"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg></button>
                            <button onClick={() => setCurrentPage(c => c - 1)} disabled={currentPage === 1} className="apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--separator)] !rounded-lg text-[var(--label-primary)] hover:!text-viet-gold hover:border-[#D4AF37] hover:!bg-[#D4AF37]/10 disabled:opacity-40 disabled:hover:border-[var(--separator)] disabled:hover:!text-[var(--label-primary)] disabled:cursor-not-allowed shadow-sm"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg></button>
                            <span className="text-[12px] font-bold px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-lg mx-1 shadow-sm">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button onClick={() => setCurrentPage(c => c + 1)} disabled={currentPage === totalPages} className="apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--separator)] !rounded-lg text-[var(--label-primary)] hover:!text-viet-gold hover:border-[#D4AF37] hover:!bg-[#D4AF37]/10 disabled:opacity-40 disabled:hover:border-[var(--separator)] disabled:hover:!text-[var(--label-primary)] disabled:cursor-not-allowed shadow-sm"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--separator)] !rounded-lg text-[var(--label-primary)] hover:!text-viet-gold hover:border-[#D4AF37] hover:!bg-[#D4AF37]/10 disabled:opacity-40 disabled:hover:border-[var(--separator)] disabled:hover:!text-[var(--label-primary)] disabled:cursor-not-allowed shadow-sm"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CẨM NANG */}
            <AppleModal show={showGuideModal} title="Cẩm nang Hệ thống Kế toán AI" confirmText="Đã hiểu" onClose={() => setShowGuideModal(false)} onConfirm={() => setShowGuideModal(false)}>
                <div className="px-2 pb-4 text-left space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="group relative bg-[var(--bg-elevated-secondary)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--system-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-[var(--system-blue)]/10 flex items-center justify-center shrink-0 border border-[var(--system-blue)]/20 shadow-inner">
                                <svg className="sf-icon sf-icon-bold w-5 h-5 text-[var(--system-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-[14px] font-black mb-1 group-hover:text-[var(--system-blue)] transition-colors">1. Sổ cái Kép (Double-entry)</h4>
                                <p className="text-[13px] text-[var(--label-secondary)] leading-relaxed">Mỗi khi bạn ghi nhận 1 hợp đồng, hệ thống tự động ghi sổ 2 chiều: trừ tiền mặt và cộng khoản phải thu. Chuẩn nghiệp vụ Ngân hàng.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppleModal>

            {/* MODAL CẤN TRỪ */}
            <AppleModal show={showSimplifyModal} title="Đề xuất Cấn trừ Thông minh" confirmText="Đóng" onClose={() => setShowSimplifyModal(false)} onConfirm={() => setShowSimplifyModal(false)}>
                <div className="px-2 pb-4 text-left">
                    <p className="caption mb-5 text-center px-4">Thuật toán AI phát hiện chu trình nợ chéo và rút gọn dòng tiền, giúp bạn thanh toán với số lần chuyển khoản tối thiểu nhất.</p>
                    {isSimplifying ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : debtSuggestions.length === 0 ? (
                        <div className="text-center py-10 bg-[var(--bg-elevated)] rounded-[20px] border border-[var(--separator)]">
                            <Sparkles className="sf-icon sf-icon-regular w-14 h-14 mx-auto mb-4 text-[#D4AF37]/50" />
                            <p className="text-[16px] font-black">Không phát hiện chu trình nợ chéo.</p>
                            <p className="caption mt-1.5">Dòng tiền của bạn đang rất tối ưu!</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                            {debtSuggestions.map((sug, idx) => (
                                <div key={idx} className="relative bg-[var(--bg-elevated)] p-5 rounded-[20px] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group flex items-center justify-between gap-2 overflow-hidden cursor-default">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--system-red)]/5 via-transparent to-[var(--system-green)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="flex flex-col items-center flex-1 relative z-10">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--system-red)]/20 to-[var(--system-red)]/5 text-[var(--system-red)] flex items-center justify-center font-black text-[14px] border border-[var(--system-red)]/20 mb-2 shadow-sm relative">
                                            {getInitials(sug.fromPerson)}
                                        </div>
                                        <span className="text-[13px] font-bold text-center line-clamp-1 w-full px-2">{sug.fromPerson}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center shrink-0 w-[120px] relative z-10">
                                        <span className="text-[10px] font-black text-[var(--label-secondary)] uppercase tracking-widest mb-1.5">Chuyển trực tiếp</span>
                                        <div className="flex items-center text-viet-gold font-black tabular-nums tracking-tighter text-[15px] bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl border border-[#D4AF37]/30 shadow-inner">
                                            {formatMoney(sug.amount)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center flex-1 relative z-10">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--system-green)]/20 to-[var(--system-green)]/5 text-[var(--system-green)] flex items-center justify-center font-black text-[14px] border border-[var(--system-green)]/20 mb-2 shadow-sm relative">
                                            {getInitials(sug.toPerson)}
                                        </div>
                                        <span className="text-[13px] font-bold text-center line-clamp-1 w-full px-2">{sug.toPerson}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AppleModal>

            {/* MODAL SỔ CÁI */}
            <AppleModal show={!!selectedLedger} title={'Hồ Sơ Sổ Cái: ' + selectedLedger} confirmText="Đóng" onClose={() => setSelectedLedger(null)} onConfirm={() => setSelectedLedger(null)}>
                <div className="space-y-5 text-left pb-2 relative min-h-[300px]">
                    {isLedgerLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]/60 backdrop-blur-sm z-50 rounded-2xl">
                            <div className="w-8 h-8 border-4 border-[var(--system-blue)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {riskProfile && (
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-all ${riskProfile.riskLevel === 'TỐT' ? 'bg-[var(--system-green)]/10 border-[var(--system-green)]/20' : (riskProfile.riskLevel === 'CẢNH BÁO' ? 'bg-[#FF9500]/10 border-[#FF9500]/20' : 'bg-[var(--system-red)]/10 border-[var(--system-red)]/20')}`}>
                            <div className={`w-14 h-14 shrink-0 rounded-full flex flex-col items-center justify-center font-black text-[18px] border-4 bg-[var(--bg-elevated)] shadow-sm ${riskProfile.riskLevel === 'TỐT' ? 'text-[var(--system-green)] border-[var(--system-green)]/30' : (riskProfile.riskLevel === 'CẢNH BÁO' ? 'text-[#FF9500] border-[#FF9500]/30' : 'text-[var(--system-red)] border-[var(--system-red)]/30')}`}>
                                {riskProfile.score}
                            </div>
                            <div>
                                <h4 className={`text-[14px] font-black uppercase tracking-wider ${riskProfile.riskLevel === 'TỐT' ? 'text-[var(--system-green)]' : (riskProfile.riskLevel === 'CẢNH BÁO' ? 'text-[#FF9500]' : 'text-[var(--system-red)]')}`}>
                                    Đánh giá AI: {riskProfile.riskLevel}
                                </h4>
                                <p className="text-[12px] text-[var(--label-secondary)] font-medium mt-0.5">
                                    Phát hiện <strong>{riskProfile.overdueLoansCount}</strong> hợp đồng trễ hạn (Tổng cộng {riskProfile.totalOverdueDays} ngày).
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="border border-[var(--border-subtle)] rounded-[20px] overflow-hidden shadow-sm bg-[var(--bg-elevated)]">
                        <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-[12.5px]">
                                <thead className="bg-[var(--bg-elevated-secondary)] sticky top-0 border-b border-[var(--separator)] z-10">
                                <tr className="text-[var(--label-secondary)]">
                                    <th className="px-4 py-3 font-bold text-left tracking-wider">Ngày</th>
                                    <th className="px-4 py-3 font-bold text-left tracking-wider">Diễn giải</th>
                                    <th className="px-4 py-3 font-bold text-right tracking-wider">Biến động</th>
                                    <th className="px-4 py-3 font-bold text-right tracking-wider">Lũy kế</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--separator)]">
                                {ledgerData.length === 0 && !isLedgerLoading && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-[var(--label-secondary)] font-medium">Chưa có dữ liệu giao dịch sổ cái.</td>
                                    </tr>
                                )}
                                {ledgerData.map((row, i) => (
                                    <tr key={i} className="hover:bg-[var(--bg-elevated-secondary)] transition-colors">
                                        <td className="px-4 py-3.5 text-[var(--label-secondary)]">{formatDate(row.transactionDate)}</td>
                                        <td className="px-4 py-3.5 font-medium">{row.description}</td>
                                        <td className={`px-4 py-3.5 text-right font-black tabular-nums ${row.amount > 0 ? 'text-[var(--system-green)]' : 'text-[var(--system-red)]'}`}>
                                            {row.amount > 0 ? '+' : ''}{formatMoney(row.amount)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-black tabular-nums">
                                            {formatMoney(row.runningBalance)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AppleModal>

            {/* MODAL CHI TIẾT KHOẢN NỢ */}
            <AppleModal show={!!viewingDebt} title={viewingDebt ? viewingDebt.debtor : ''} confirmText="Đóng" onClose={() => setViewingDebt(null)} onConfirm={() => setViewingDebt(null)}>
                {viewingDebt && (
                    <div className="px-1 pb-2 text-left">
                        <div className="flex items-center gap-4 pb-4 border-b border-[var(--separator)] mb-5">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-black bg-[var(--system-blue)]/10 text-[var(--system-blue)] border border-[var(--system-blue)]/20">
                                {getInitials(viewingDebt.debtor)}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-[17px] font-black leading-tight tracking-tight">{viewingDebt.debtor}</h2>
                                <div className="text-[11px] text-[var(--label-secondary)] font-medium mt-0.5 flex flex-wrap gap-x-2">
                                    <span className={`uppercase font-black tracking-wider ${(viewingDebt.type === 'Mình đi mượn' || viewingDebt.type === 'Đi vay') ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'}`}>
                                        {(viewingDebt.type === 'Mình đi mượn' || viewingDebt.type === 'Đi vay') ? 'Mình Đi Vay' : 'Mình Cho Vay'}
                                    </span>
                                    <span>•</span>
                                    <span className="font-bold">Lãi: {viewingDebt.interestRate || 0}%</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${viewingDebt.status === 'Đã thanh toán' ? 'bg-[var(--system-green)]/10 text-[var(--system-green)]' : 'bg-[#ff9900]/10 text-[#ff9900]'}`}>
                                    {viewingDebt.status === 'Đã thanh toán' ? 'Đã tất toán' : 'Đang hiệu lực'}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6 bg-[var(--bg-elevated)] rounded-[20px] p-4 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${(viewingDebt.type === 'Mình đi mượn' || viewingDebt.type === 'Đi vay') ? 'bg-[var(--system-red)]' : 'bg-[var(--system-blue)]'}`}></div>
                            <h3 className="text-[12px] font-black text-[var(--label-secondary)] uppercase tracking-wider mb-3 pl-2">Bảng Tính Toán Dư Nợ (Real-time)</h3>
                            <div className="grid grid-cols-2 gap-4 pl-2">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--label-secondary)] mb-0.5">Tiền Gốc (Đã giải ngân)</p>
                                        <p className="text-[14px] font-black tabular-nums">{formatMoney(calculateDebtDetails(viewingDebt).principal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--label-secondary)] mb-0.5">Tiền Lãi (Tạm tính {calculateDebtDetails(viewingDebt).days} ngày)</p>
                                        <p className="text-[14px] font-black tabular-nums text-[#ff9900]">+ {formatMoney(calculateDebtDetails(viewingDebt).interest)}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 border-l border-[var(--separator)] pl-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--label-secondary)] mb-0.5">Đã Thanh Toán</p>
                                        <p className="text-[14px] font-black tabular-nums text-[var(--system-green)]">- {formatMoney(calculateDebtDetails(viewingDebt).paid)}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[11px] font-black ${(viewingDebt.type === 'Mình đi mượn' || viewingDebt.type === 'Đi vay') ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'}`}>CẦN TRẢ ĐỂ TẤT TOÁN</p>
                                        <p className={`text-[18px] font-black tabular-nums tracking-tight ${(viewingDebt.type === 'Mình đi mượn' || viewingDebt.type === 'Đi vay') ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'}`}>
                                            {formatMoney(calculateDebtDetails(viewingDebt).remain)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pl-2">
                                <div className="flex justify-between text-[10px] font-bold mb-1.5 text-[var(--label-secondary)]">
                                    <span>Tiến độ thanh toán (Gồm cả Lãi)</span>
                                    <span>{calculateDebtDetails(viewingDebt).totalLiability ? Math.min(100, (calculateDebtDetails(viewingDebt).paid / calculateDebtDetails(viewingDebt).totalLiability) * 100).toFixed(1) : 0}%</span>
                                </div>
                                <div className="w-full bg-[var(--separator)] rounded-full h-1.5 overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${calculateDebtDetails(viewingDebt).remain <= 0 ? 'bg-[var(--system-green)]' : 'bg-[#D4AF37]'}`}
                                         style={{ width: `${calculateDebtDetails(viewingDebt).totalLiability ? (calculateDebtDetails(viewingDebt).paid / calculateDebtDetails(viewingDebt).totalLiability) * 100 : 0}%` }}>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-elevated-secondary)] rounded-[24px] p-4 h-[45vh] overflow-y-auto flex flex-col space-y-4 shadow-inner border border-[var(--border-subtle)] custom-scrollbar relative">
                            <div className="flex flex-col items-center w-full my-2">
                                <span className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">{formatDate(viewingDebt.regDate)}</span>
                                <div className="bg-[var(--separator)] px-4 py-1.5 rounded-full shadow-sm">
                                    <p className="text-[11px] font-bold text-[var(--label-secondary)] text-center">Bắt đầu hợp đồng hạn mức: {formatMoney(viewingDebt.total)}</p>
                                </div>
                            </div>

                            {getChatTimeline(viewingDebt).map((msg, i) => (
                                <div key={i} className="w-full flex flex-col">
                                    <div className={`w-full flex ${msg.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[9px] font-bold text-[var(--label-secondary)] mb-1 mx-1">{msg.date}</span>
                                    </div>
                                    <div className={`w-full flex ${msg.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={msg.align === 'right' ? 'bg-[var(--system-blue)] text-white px-4 py-2.5 rounded-[20px] rounded-br-sm max-w-[85%] shadow-md' : 'bg-[var(--bg-elevated)] px-4 py-2.5 rounded-[20px] rounded-bl-sm max-w-[85%] shadow-md border border-[var(--separator)]'}>
                                            <p className={`text-[12px] font-semibold mb-0.5 ${msg.align === 'right' ? 'text-white/90' : 'text-[var(--label-secondary)]'}`}>{msg.title}</p>
                                            <p className={`text-[16px] font-black tabular-nums tracking-tight ${msg.align === 'right' ? 'text-white' : ''}`}>{msg.amountStr}</p>
                                            {msg.desc && <p className={`text-[14px] mt-1.5 leading-tight font-medium ${msg.align === 'right' ? 'text-white' : 'text-[var(--label-secondary)]'}`}>{msg.desc}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AppleModal>

            {/* MODAL THÊM / SỬA */}
            <AppleModal show={showDebtModal} title={editingId ? 'Cập Nhật Hồ Sơ Nợ' : 'Khai Báo Khoản Nợ'} onClose={() => setShowDebtModal(false)} onConfirm={saveDebt}>
                <div className="space-y-5 text-left" onClick={() => setShowDebtorDropdown(false)}>
                    <div className="bg-[var(--bg-elevated-secondary)] p-4 rounded-[20px] border border-[var(--border-subtle)] space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AppleSelect value={newDebt.type} onChange={val => setNewDebt({ ...newDebt, type: val })} label="Loại Hợp Đồng" options={[{label:'Mình cho vay (Tài sản)', value:'Cho vay'}, {label:'Mình đi vay (Phải trả)', value:'Đi vay'}]} />

                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Đối tác / Người liên quan <span className="text-[var(--system-red)]">*</span></label>
                                <input
                                    value={newDebt.debtor}
                                    onChange={e => setNewDebt({ ...newDebt, debtor: e.target.value })}
                                    onFocus={() => setShowDebtorDropdown(true)}
                                    type="text"
                                    placeholder="Gõ tên hoặc chọn bên dưới..."
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm"
                                />
                                <AnimatePresence>
                                    {showDebtorDropdown && filteredDebtors.length > 0 && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[99] w-full mt-1 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--separator)] rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                                            <ul className="p-1.5">
                                                {filteredDebtors.map(name => (
                                                    <li key={name} onClick={() => selectDebtor(name)} className="px-3 py-2.5 text-[14px] font-bold hover:bg-[#D4AF37]/10 hover:text-viet-gold rounded-[8px] cursor-pointer transition-colors flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated-secondary)] flex items-center justify-center text-[10px] text-[var(--label-secondary)] border border-[var(--border-subtle)] shadow-inner">
                                                            {getInitials(name)}
                                                        </div>
                                                        {name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-50">
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Ngày ký hợp đồng <span className="text-[var(--system-red)]">*</span></label>
                                <AppleDatePicker value={newDebt.regDate} onChange={val => setNewDebt({ ...newDebt, regDate: val })} />
                            </div>
                            <div>
                                <AppleInputNumber value={newDebt.total} onChange={val => setNewDebt({ ...newDebt, total: val })} label="Tổng Hạn Mức (VNĐ)" />
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                                        <button key={amt} type="button" onClick={(e) => { e.preventDefault(); addQuickTotal(amt); }} className="flex-1 min-w-[42px] py-1 bg-[#D4AF37]/10 text-viet-gold hover:bg-[#D4AF37] hover:text-[#1A1514] rounded-[8px] text-[11px] font-bold transition-colors outline-none text-center tabular-nums border border-[#D4AF37]/20">
                                            +{amt / 1000}k
                                        </button>
                                    ))}
                                    <button type="button" onClick={(e) => { e.preventDefault(); clearTotal(); }} title="Làm lại" className="py-1 px-3 bg-[var(--bg-elevated)] hover:bg-[var(--system-red)]/10 hover:text-[var(--system-red)] text-[var(--label-secondary)] rounded-[8px] transition-colors outline-none flex items-center justify-center border border-[var(--separator)]">
                                        <svg className="sf-icon sf-icon-bold w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Kỳ hạn (Tháng)</label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={newDebt.isTermIndefinite} onChange={e => setNewDebt({ ...newDebt, isTermIndefinite: e.target.checked })} className="w-3.5 h-3.5 accent-[#D4AF37] rounded cursor-pointer" />
                                        <span className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Không rõ</span>
                                    </label>
                                </div>
                                {!newDebt.isTermIndefinite ? (
                                    <input value={newDebt.term} onChange={e => setNewDebt({ ...newDebt, term: Number(e.target.value) })} type="number" min="1" placeholder="Nhập số tháng" className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" />
                                ) : (
                                    <div className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold text-[var(--label-tertiary)] italic select-none shadow-inner">
                                        Vô thời hạn
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Lãi suất (% / Năm)</label>
                                <input value={newDebt.interestRate} onChange={e => setNewDebt({ ...newDebt, interestRate: Number(e.target.value) })} type="number" step="0.1" min="0" placeholder="VD: 8.5" className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Ghi chú & Tài sản đảm bảo</label>
                            <textarea value={newDebt.description} onChange={e => setNewDebt({ ...newDebt, description: e.target.value })} placeholder="Hợp đồng, sổ đỏ, thông tin thỏa thuận..." className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] h-16 resize-none shadow-sm transition-all"></textarea>
                        </div>
                    </div>

                    <AnimatePresence>
                        {editingId && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                                <div className="p-4 bg-[var(--system-blue)]/5 border border-[var(--system-blue)]/20 rounded-[20px]">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-[12px] font-black uppercase tracking-wider">Lịch sử Giải ngân / Nhận vốn</label>
                                        <button onClick={addDisbursement} type="button" className="text-[12px] font-bold text-[var(--system-blue)] hover:underline outline-none">+ Thêm đợt</button>
                                    </div>
                                    {newDebt.disbursements?.map((dis, idx) => (
                                        <div key={'dis' + idx} className="bg-[var(--bg-elevated)] p-3 rounded-xl mb-3 relative shadow-sm border border-[var(--border-subtle)]">
                                            <button onClick={() => removeDisbursement(idx)} type="button" className="absolute top-2.5 right-2 text-[var(--system-red)]/70 hover:text-[var(--system-red)] outline-none"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                            <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--system-blue)] uppercase tracking-wider mb-1">Ngày thực hiện <span className="text-[var(--system-red)]">*</span></label>
                                                    <AppleDatePicker value={dis.date} onChange={val => updateDisbursement(idx, 'date', val)} />
                                                </div>
                                                <AppleInputNumber value={dis.amount} onChange={val => updateDisbursement(idx, 'amount', val)} label="Số tiền *" />
                                            </div>
                                            <input type="text" value={dis.note} onChange={e => updateDisbursement(idx, 'note', e.target.value)} placeholder="Ghi chú (Căn cứ UNC số...)" className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-lg p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--system-blue)]/30 transition-all" />
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-[var(--system-green)]/5 border border-[var(--system-green)]/20 rounded-[20px]">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-[12px] font-black uppercase tracking-wider">Lịch sử Thu hồi / Thanh toán</label>
                                        <button onClick={addRepayment} type="button" className="text-[12px] font-bold text-[var(--system-green)] hover:underline outline-none">+ Thêm đợt</button>
                                    </div>
                                    {newDebt.repayments?.map((pay, idx) => (
                                        <div key={'pay' + idx} className="bg-[var(--bg-elevated)] p-3 rounded-xl mb-3 relative shadow-sm border border-[var(--border-subtle)]">
                                            <button onClick={() => removeRepayment(idx)} type="button" className="absolute top-2.5 right-2 text-[var(--system-red)]/70 hover:text-[var(--system-red)] outline-none"><svg className="sf-icon sf-icon-bold w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                            <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-[var(--system-green)] uppercase tracking-wider mb-1">Ngày thực hiện <span className="text-[var(--system-red)]">*</span></label>
                                                    <AppleDatePicker value={pay.date} onChange={val => updateRepayment(idx, 'date', val)} />
                                                </div>
                                                <AppleInputNumber value={pay.amount} onChange={val => updateRepayment(idx, 'amount', val)} label="Số tiền *" />
                                            </div>
                                            <input type="text" value={pay.note} onChange={e => updateRepayment(idx, 'note', e.target.value)} placeholder="Ghi chú (Thu nợ gốc đợt 1...)" className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-lg p-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[var(--system-green)]/30 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </AppleModal>

            {/* CONFIRM ALERT */}
            <AnimatePresence>
                {confirmAlert.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                        <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="apple-glass !bg-[var(--bg-elevated)] w-[270px] !rounded-[14px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-4 pt-5 pb-4 text-center">
                                <h3 className="font-semibold text-[17px] leading-snug mb-1 text-[var(--label-primary)]">{confirmAlert.title}</h3>
                                <p className="text-[13px] leading-tight text-[var(--label-secondary)]">{confirmAlert.msg}</p>
                            </div>
                            <div className="flex border-t border-[var(--separator)]">
                                <button type="button" onClick={() => setConfirmAlert({ ...confirmAlert, show: false })} className="flex-1 py-[11px] text-[17px] text-[var(--system-blue)] font-normal border-r border-[var(--separator)] hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors">
                                    Hủy
                                </button>
                                <button type="button" onClick={executeAlertAction} className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirmAlert.isDanger ? 'text-[var(--system-red)]' : 'text-[var(--system-blue)]'}`}>
                                    {confirmAlert.btn}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}