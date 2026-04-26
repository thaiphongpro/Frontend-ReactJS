import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2, Percent, Calculator, Edit2, Trash2, Check, X, Inbox } from 'lucide-react';

import AppleModal from '../components/AppleModal.jsx';
import AppleSelect from '../components/AppleSelect.jsx';
import { useToastStore } from '../store/useToastStore.js';
import { useSettingsStore } from '../store/useSettingsStore.js';
import api from '../utils/useApi.js';

const tabs = [
    { label: 'Chính sách Thuế', val: 'POLICIES' },
    { label: 'Giảm trừ', val: 'DEDUCTIONS' },
    { label: 'Máy tính Thuế Live', val: 'CALCULATOR' }
];

export default function Taxes() {
    const { addToast } = useToastStore();
    const { currency } = useSettingsStore();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('POLICIES');

    const formatMoney = useCallback((amount) => {
        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: currency || 'VND'
        }).format(amount || 0);
    }, [currency]);

    const formatInputNumber = (val) => {
        if (val === null || val === undefined || val === '') return '';
        return String(val).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseInputNumber = (val) => {
        if (!val) return '';
        return Number(String(val).replace(/\D/g, ''));
    };

    // =========================================================================
    // REACT QUERY: Fetch dữ liệu Thuế và Giảm trừ (Hỗ trợ chạy Offline)
    // =========================================================================
    const { data: policies = [] } = useQuery({
        queryKey: ['taxes', 'policies'],
        queryFn: async () => {
            try {
                const data = await api.get('/taxes/policies');
                return data || [];
            } catch (error) {
                console.warn("Chưa kết nối Backend, tải dữ liệu Thuế Mẫu...");
                return [
                    { id: "1", name: 'Thuế TNCN (Chuẩn VN)', type: 'PROGRESSIVE', isActive: true, brackets: [
                            { minIncome: 0, maxIncome: 5000000, rate: 5 },
                            { minIncome: 5000000, maxIncome: 10000000, rate: 10 },
                            { minIncome: 10000000, maxIncome: 18000000, rate: 15 },
                            { minIncome: 18000000, maxIncome: 32000000, rate: 20 },
                            { minIncome: 32000000, maxIncome: 52000000, rate: 25 },
                            { minIncome: 52000000, maxIncome: 80000000, rate: 30 },
                            { minIncome: 80000000, maxIncome: null, rate: 35 }
                        ]},
                    { id: "2", name: 'Thuế VAT', type: 'FLAT', isActive: true, brackets: [{ minIncome: 0, maxIncome: null, rate: 10 }] }
                ];
            }
        }
    });

    const { data: deductions = [] } = useQuery({
        queryKey: ['taxes', 'deductions'],
        queryFn: async () => {
            try {
                const data = await api.get('/taxes/deductions');
                return data || [];
            } catch (error) {
                console.warn("Chưa kết nối Backend, tải dữ liệu Giảm trừ Mẫu...");
                return [
                    { id: "1", name: 'Bản thân', amount: 11000000, type: 'FIXED_AMOUNT', isActive: true },
                    { id: "2", name: 'Bảo hiểm (BHXH, BHYT)', amount: 10.5, type: 'PERCENTAGE', isActive: true }
                ];
            }
        }
    });
    // =========================================================================

    // STATE MODAL CHÍNH SÁCH
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const initPolicy = () => ({ id: null, name: '', type: 'PROGRESSIVE', isActive: true, brackets: [{ minIncome: 0, maxIncome: '', rate: 0 }] });
    const [policyForm, setPolicyForm] = useState(initPolicy());

    const openPolicyModal = (p = null) => {
        if (p) setPolicyForm(JSON.parse(JSON.stringify(p)));
        else setPolicyForm(initPolicy());
        setShowPolicyModal(true);
    };

    const addBracket = () => {
        setPolicyForm(prev => ({ ...prev, brackets: [...prev.brackets, { minIncome: 0, maxIncome: '', rate: 0 }] }));
    };

    const removeBracket = (idx) => {
        const newBrackets = [...policyForm.brackets];
        newBrackets.splice(idx, 1);
        setPolicyForm(prev => ({ ...prev, brackets: newBrackets }));
    };

    const updateBracket = (idx, field, val) => {
        const newBrackets = [...policyForm.brackets];
        newBrackets[idx][field] = val;
        setPolicyForm(prev => ({ ...prev, brackets: newBrackets }));
    };

    const savePolicy = async () => {
        if (!policyForm.name) return addToast("Vui lòng nhập tên chính sách", "error");

        const payload = { ...policyForm };
        if (payload.type === 'FLAT') payload.brackets = [payload.brackets[0]];

        try {
            if (payload.id) {
                await api.put(`/taxes/policies/${payload.id}`, payload);
                addToast("Đã cập nhật chính sách", "success");
            } else {
                await api.post('/taxes/policies', payload);
                addToast("Đã thêm chính sách mới", "success");
            }
            setShowPolicyModal(false);
            queryClient.invalidateQueries({ queryKey: ['taxes', 'policies'] });
        } catch (e) {
            // Hỗ trợ lưu Offline (Vào Cache tạm) nếu Backend chưa bật
            queryClient.setQueryData(['taxes', 'policies'], (old) => {
                if (payload.id) return old.map(x => x.id === payload.id ? payload : x);
                return [...old, { ...payload, id: Date.now() + "" }];
            });
            setShowPolicyModal(false);
        }
    };

    // STATE MODAL GIẢM TRỪ
    const [showDeductionModal, setShowDeductionModal] = useState(false);
    const initDeduction = () => ({ id: null, name: '', amount: '', type: 'FIXED_AMOUNT', isActive: true });
    const [deductionForm, setDeductionForm] = useState(initDeduction());

    const openDeductionModal = (d = null) => {
        if (d) setDeductionForm({ ...d });
        else setDeductionForm(initDeduction());
        setShowDeductionModal(true);
    };

    const saveDeduction = async () => {
        if (!deductionForm.name || !deductionForm.amount) return addToast("Nhập đầy đủ thông tin giảm trừ", "error");

        try {
            if (deductionForm.id) {
                await api.put(`/taxes/deductions/${deductionForm.id}`, deductionForm);
                addToast("Đã cập nhật giảm trừ", "success");
            } else {
                await api.post('/taxes/deductions', deductionForm);
                addToast("Đã thêm khoản giảm trừ", "success");
            }
            setShowDeductionModal(false);
            queryClient.invalidateQueries({ queryKey: ['taxes', 'deductions'] });
        } catch (e) {
            // Hỗ trợ lưu Offline
            queryClient.setQueryData(['taxes', 'deductions'], (old) => {
                if (deductionForm.id) return old.map(x => x.id === deductionForm.id ? deductionForm : x);
                return [...old, { ...deductionForm, id: Date.now() + "" }];
            });
            setShowDeductionModal(false);
        }
    };

    // STATE XÓA
    const [confirm, setConfirm] = useState({ show: false, type: '', id: null, title: '', msg: '', btn: '', danger: true });
    const promptDelete = (type, id) => {
        setConfirm({ show: true, type, id, title: 'Xác nhận xóa', msg: 'Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.', btn: 'Xóa ngay', danger: true });
    };

    const executeDelete = async () => {
        try {
            if (confirm.type === 'POLICY') {
                await api.delete(`/taxes/policies/${confirm.id}`);
                if (selectedPolicyId === confirm.id) setSelectedPolicyId("");
                queryClient.invalidateQueries({ queryKey: ['taxes', 'policies'] });
            } else {
                await api.delete(`/taxes/deductions/${confirm.id}`);
                setSelectedDeductions(prev => prev.filter(d => d.id !== confirm.id));
                queryClient.invalidateQueries({ queryKey: ['taxes', 'deductions'] });
            }
            addToast("Đã xóa dữ liệu thành công", "success");
        } catch (e) {
            // Hỗ trợ xóa Offline
            if (confirm.type === 'POLICY') {
                queryClient.setQueryData(['taxes', 'policies'], old => old.filter(p => p.id !== confirm.id));
                if (selectedPolicyId === confirm.id) setSelectedPolicyId("");
            } else {
                queryClient.setQueryData(['taxes', 'deductions'], old => old.filter(d => d.id !== confirm.id));
                setSelectedDeductions(prev => prev.filter(d => d.id !== confirm.id));
            }
        }
        setConfirm({ ...confirm, show: false });
    };

    // STATE CALCULATOR
    const activePolicies = useMemo(() => policies.filter(p => p.isActive), [policies]);
    const activeDeductions = useMemo(() => deductions.filter(d => d.isActive), [deductions]);

    const [selectedPolicyId, setSelectedPolicyId] = useState("");
    const [calcIncome, setCalcIncome] = useState('');
    const [selectedDeductions, setSelectedDeductions] = useState([]);

    const selectedPolicyDetails = useMemo(() => policies.find(p => p.id === selectedPolicyId), [policies, selectedPolicyId]);
    const policyOptions = useMemo(() => activePolicies.map(p => ({ label: `${p.name} (${p.type === 'FLAT' ? 'Cố định' : 'Lũy tiến'})`, value: p.id })), [activePolicies]);

    const [taxResult, setTaxResult] = useState({ grossIncome: 0, totalDeductions: 0, taxableIncome: 0, totalTaxAmount: 0, netIncome: 0, breakdown: [] });

    const totalDeductionAmount = taxResult.totalDeductions || 0;
    const taxableIncome = taxResult.taxableIncome || 0;
    const totalTaxAmount = taxResult.totalTaxAmount || 0;
    const netIncome = taxResult.netIncome || 0;
    const taxBreakdown = taxResult.breakdown || [];

    // TÍNH THUẾ MÔ PHỎNG (Sử dụng logic Client-side nếu server lỗi để Calculator không bao giờ chết)
    useEffect(() => {
        const incomeVal = Number(calcIncome) || 0;

        if (incomeVal <= 0) {
            setTaxResult({ grossIncome: 0, totalDeductions: 0, taxableIncome: 0, totalTaxAmount: 0, netIncome: 0, breakdown: [] });
            return;
        }

        const timerId = setTimeout(async () => {
            try {
                const payload = {
                    income: incomeVal,
                    policyId: selectedPolicyId || null,
                    deductionIds: selectedDeductions.map(d => d.id)
                };
                const response = await api.post('/taxes/calculate', payload);
                if (response) setTaxResult(response);
            } catch (e) {
                // Tính toán Client-side fallback nếu Server chưa chạy (để người dùng trải nghiệm mượt mà)
                if (!selectedPolicyDetails) return;

                let totalDed = 0;
                selectedDeductions.forEach(d => {
                    if (d.type === 'FIXED_AMOUNT') totalDed += Number(d.amount);
                    else if (d.type === 'PERCENTAGE') totalDed += (incomeVal * Number(d.amount)) / 100;
                });

                let taxable = incomeVal - totalDed;
                if (taxable < 0) taxable = 0;

                let taxAmt = 0;
                let bd = [];

                if (selectedPolicyDetails.type === 'FLAT') {
                    const rate = selectedPolicyDetails.brackets[0]?.rate || 0;
                    taxAmt = taxable * (rate / 100);
                } else {
                    let remainTaxable = taxable;
                    for (let i = 0; i < selectedPolicyDetails.brackets.length; i++) {
                        const b = selectedPolicyDetails.brackets[i];
                        const min = b.minIncome || 0;
                        const max = b.maxIncome || Infinity;

                        if (remainTaxable <= 0) break;

                        const incomeInBracket = Math.min(remainTaxable, max === Infinity ? Infinity : (max - min));
                        const taxInBracket = incomeInBracket * (b.rate / 100);

                        taxAmt += taxInBracket;
                        remainTaxable -= incomeInBracket;

                        bd.push({
                            level: i + 1,
                            rate: b.rate,
                            incomeInBracket: incomeInBracket,
                            taxAmount: taxInBracket
                        });
                    }
                }

                setTaxResult({
                    grossIncome: incomeVal,
                    totalDeductions: totalDed,
                    taxableIncome: taxable,
                    totalTaxAmount: taxAmt,
                    netIncome: incomeVal - taxAmt,
                    breakdown: bd
                });
            }
        }, 300);

        return () => clearTimeout(timerId);
    }, [calcIncome, selectedPolicyId, selectedDeductions, selectedPolicyDetails]);

    const toggleDeduction = (d) => {
        setSelectedDeductions(prev => {
            const exists = prev.find(x => x.id === d.id);
            if (exists) return prev.filter(x => x.id !== d.id);
            return [...prev, d];
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
                        className={`px-6 py-2 text-[13px] font-semibold rounded-lg transition-all duration-300 outline-none ${activeTab === t.val ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#AA771C]/20 border border-[#D4AF37]/50 text-viet-gold font-bold shadow-sm' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB: CHÍNH SÁCH */}
            {activeTab === 'POLICIES' && (
                <div className="apple-glass overflow-hidden !rounded-[24px]">
                    <div className="p-4 sm:p-5 border-b border-[var(--separator)] flex justify-between items-center">
                        <h3 className="text-[18px] font-black tracking-tight">Chính Sách Thuế</h3>
                        <button onClick={() => openPolicyModal()} className="btn-dong-son-gold px-5 py-2.5 outline-none">
                            + Thêm Chính sách
                        </button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--bg-elevated-secondary)] text-viet-gold text-[11px] uppercase font-bold tracking-widest border-b border-[var(--separator)]">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">STT</th>
                                <th className="px-6 py-4 whitespace-nowrap">Tên Chính Sách</th>
                                <th className="px-6 py-4 whitespace-nowrap">Loại Thuế</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                            {policies.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-[var(--label-secondary)] text-[13px] flex flex-col items-center justify-center">
                                        <Inbox className="sf-icon sf-icon-regular w-10 h-10 mb-3 opacity-50 text-viet-gold" />
                                        Chưa có chính sách thuế nào.
                                    </td>
                                </tr>
                            )}
                            {policies.map((p, index) => (
                                <tr key={p.id} className={`hover:bg-[var(--bg-elevated-secondary)] transition-colors group bg-transparent ${!p.isActive ? 'opacity-50 grayscale-[30%]' : ''}`}>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] font-bold text-[11px] mx-auto group-hover:bg-[#D4AF37]/20 group-hover:text-viet-gold transition-colors">
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold group-hover:text-viet-gold transition-colors">{p.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${p.type === 'FLAT' ? 'bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] border border-[var(--border-subtle)]' : 'bg-[#D4AF37]/10 text-viet-gold border border-[#D4AF37]/30'}`}>
                                            {p.type === 'FLAT' ? 'Cố định (Flat)' : 'Lũy tiến'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center">
                                            <div className={`relative w-[34px] h-[20px] rounded-full outline-none transition-colors duration-300 ease-in-out shadow-inner border border-[var(--border-subtle)] ${p.isActive ? 'bg-[var(--system-green)]' : 'bg-[var(--bg-elevated-secondary)]'}`}>
                                                <span className={`absolute top-[1.5px] left-[2px] bg-white w-[15px] h-[15px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${p.isActive ? 'translate-x-[13px]' : 'translate-x-0'}`}></span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1.5 transition-opacity opacity-0 group-hover:opacity-100">
                                            <button onClick={() => openPolicyModal(p)} title="Sửa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-orange)] hover:!bg-[var(--system-orange)]/10"><Edit2 className="w-4 h-4 sf-icon-bold" /></button>
                                            <button onClick={() => promptDelete('POLICY', p.id)} title="Xóa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-red)] hover:!bg-[var(--system-red)]/10"><Trash2 className="w-4 h-4 sf-icon-bold" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: GIẢM TRỪ */}
            {activeTab === 'DEDUCTIONS' && (
                <div className="apple-glass overflow-hidden !rounded-[24px]">
                    <div className="p-4 sm:p-5 border-b border-[var(--separator)] flex justify-between items-center">
                        <h3 className="text-[18px] font-black tracking-tight">Giảm trừ & Ưu đãi</h3>
                        <button onClick={() => openDeductionModal()} className="btn-dong-son-gold px-5 py-2.5 outline-none">
                            + Thêm Giảm trừ
                        </button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--bg-elevated-secondary)] text-viet-gold text-[11px] uppercase font-bold tracking-widest border-b border-[var(--separator)]">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">STT</th>
                                <th className="px-6 py-4 whitespace-nowrap">Tên Khoản Giảm Trừ</th>
                                <th className="px-6 py-4 text-right">Mức Giảm</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                            {deductions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-[var(--label-secondary)] text-[13px] flex flex-col items-center justify-center">
                                        <Inbox className="sf-icon sf-icon-regular w-10 h-10 mb-3 opacity-50 text-viet-gold" />
                                        Chưa có khoản giảm trừ nào.
                                    </td>
                                </tr>
                            )}
                            {deductions.map((d, index) => (
                                <tr key={d.id} className={`hover:bg-[var(--bg-elevated-secondary)] transition-colors group bg-transparent ${!d.isActive ? 'opacity-50 grayscale-[30%]' : ''}`}>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] font-bold text-[11px] mx-auto group-hover:bg-[#D4AF37]/20 group-hover:text-viet-gold transition-colors">
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold group-hover:text-viet-gold transition-colors">{d.name}</td>
                                    <td className="px-6 py-4 text-right font-black text-viet-gold tabular-nums tracking-tight text-[15px]">
                                        {d.type === 'PERCENTAGE' ? d.amount + '%' : formatMoney(d.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center">
                                            <div className={`relative w-[34px] h-[20px] rounded-full outline-none transition-colors duration-300 ease-in-out shadow-inner border border-[var(--border-subtle)] ${d.isActive ? 'bg-[var(--system-green)]' : 'bg-[var(--bg-elevated-secondary)]'}`}>
                                                <span className={`absolute top-[1.5px] left-[2px] bg-white w-[15px] h-[15px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${d.isActive ? 'translate-x-[13px]' : 'translate-x-0'}`}></span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1.5 transition-opacity opacity-0 group-hover:opacity-100">
                                            <button onClick={() => openDeductionModal(d)} title="Sửa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-orange)] hover:!bg-[var(--system-orange)]/10"><Edit2 className="w-4 h-4 sf-icon-bold" /></button>
                                            <button onClick={() => promptDelete('DEDUCTION', d.id)} title="Xóa" className="apple-btn-icon !bg-[var(--bg-elevated-secondary)] text-[var(--label-secondary)] hover:!text-[var(--system-red)] hover:!bg-[var(--system-red)]/10"><Trash2 className="w-4 h-4 sf-icon-bold" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: MÁY TÍNH */}
            {activeTab === 'CALCULATOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="apple-glass p-6 sm:p-8 !rounded-[24px] space-y-6">
                        <h3 className="text-[18px] font-black tracking-tight flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                                <Calculator className="sf-icon sf-icon-bold w-4 h-4 text-viet-gold" />
                            </div>
                            Mô phỏng Tính thuế
                        </h3>

                        <AppleSelect value={selectedPolicyId} onChange={setSelectedPolicyId} label="Áp dụng chính sách thuế" options={policyOptions} />

                        <div>
                            <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-2">Tổng thu nhập (VNĐ)</label>
                            <div className="relative">
                                <input
                                    value={formatInputNumber(calcIncome)}
                                    onChange={e => setCalcIncome(parseInputNumber(e.target.value))}
                                    type="tel"
                                    placeholder="VD: 20.000.000"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl py-3 pl-4 pr-12 text-[18px] font-black outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all tabular-nums tracking-tight shadow-sm"
                                />
                                <span className="absolute right-4 top-3 text-[var(--label-secondary)] font-bold text-[16px]">₫</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-2">Các khoản giảm trừ áp dụng</label>
                            <div className="space-y-2">
                                {activeDeductions.map(d => (
                                    <label key={d.id} className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl cursor-pointer transition-all hover:bg-[var(--bg-elevated-secondary)] shadow-sm">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedDeductions.some(x => x.id === d.id)}
                                                onChange={() => toggleDeduction(d)}
                                                className="peer sr-only"
                                            />
                                            <div className="w-5 h-5 rounded-full border border-[var(--separator)] bg-[var(--bg-elevated-secondary)] peer-checked:bg-[#D4AF37] peer-checked:border-[#D4AF37] transition-all flex items-center justify-center shadow-inner">
                                                <Check className="sf-icon sf-icon-bold w-3 h-3 text-[var(--bg-base)] opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex justify-between items-center">
                                            <span className="text-[14px] font-semibold">{d.name}</span>
                                            <span className="text-[14px] font-black text-[var(--label-secondary)] tabular-nums tracking-tight">-{d.type === 'PERCENTAGE' ? d.amount + '%' : formatMoney(d.amount)}</span>
                                        </div>
                                    </label>
                                ))}
                                {activeDeductions.length === 0 && <p className="caption italic">Chưa có khoản giảm trừ nào được tạo.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="apple-glass p-6 sm:p-8 !rounded-[24px] bg-gradient-to-br from-[var(--bg-elevated)] to-[#D4AF37]/5 flex flex-col">
                        <h3 className="text-[18px] font-black tracking-tight mb-6 border-b border-[var(--separator)] pb-4">Bóc tách Thuế Tự Động</h3>

                        <div className="space-y-4 text-[14px] flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--label-secondary)] font-medium">Tổng thu nhập:</span>
                                <span className="font-black tabular-nums tracking-tight text-[16px]">{formatMoney(calcIncome || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[var(--system-red)]">
                                <span className="font-medium">Tổng giảm trừ:</span>
                                <span className="font-black tabular-nums tracking-tight text-[16px]">-{formatMoney(totalDeductionAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-dashed border-[var(--separator)]">
                                <span className="font-bold text-viet-gold uppercase tracking-wider text-[11px]">Thu nhập tính thuế:</span>
                                <span className="font-black text-viet-gold tabular-nums tracking-tight text-[18px]">{formatMoney(taxableIncome)}</span>
                            </div>

                            {taxableIncome > 0 && selectedPolicyDetails?.type === 'PROGRESSIVE' && (
                                <div className="mt-6 bg-[var(--bg-elevated)] rounded-[16px] border border-[var(--separator)] overflow-hidden shadow-sm">
                                    <div className="bg-[var(--bg-elevated-secondary)] px-4 py-2.5 text-[10px] font-black text-[var(--label-secondary)] uppercase tracking-widest border-b border-[var(--separator)]">Diễn giải theo Bậc thuế</div>
                                    <div className="divide-y divide-[var(--separator)]">
                                        {taxBreakdown.map((step, i) => (
                                            <div key={i} className="p-3.5 flex justify-between items-center">
                                                <div>
                                                    <span className="font-bold text-[13px]">Bậc {step.level || i + 1} ({step.rate}%)</span>
                                                    <p className="caption mt-0.5">Khoản chịu thuế: <span className="font-bold tabular-nums tracking-tight">{formatMoney(step.incomeInBracket)}</span></p>
                                                </div>
                                                <span className="font-black text-[var(--system-red)] tabular-nums tracking-tight text-[14px]">{formatMoney(step.taxAmount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {taxableIncome > 0 && selectedPolicyDetails?.type === 'FLAT' && (
                                <div className="mt-6 p-5 rounded-[16px] border border-[#D4AF37]/30 bg-[#D4AF37]/10 shadow-inner">
                                    <p className="text-[12px] font-black text-viet-gold uppercase tracking-wider mb-1.5">Thuế Cố Định ({selectedPolicyDetails.brackets[0]?.rate || 0}%)</p>
                                    <p className="caption leading-snug">Toàn bộ thu nhập tính thuế sẽ bị áp dụng mức thuế suất phẳng này mà không chia bậc.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-[var(--separator)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[var(--label-secondary)] font-bold text-[12px] uppercase tracking-wider">Thuế phải nộp:</span>
                                <span className="text-[22px] font-black text-[var(--system-red)] tabular-nums tracking-tight">- {formatMoney(totalTaxAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--system-green)]/10 p-5 rounded-[20px] border border-[var(--system-green)]/30 shadow-[0_4px_14px_rgba(52,199,89,0.15)]">
                                <span className="text-[var(--system-green)] font-black text-[13px] uppercase tracking-widest">Thực nhận (Net)</span>
                                <span className="text-[32px] leading-none font-black text-[var(--system-green)] tabular-nums tracking-tight">{formatMoney(netIncome)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHÍNH SÁCH THUẾ */}
            <AppleModal show={showPolicyModal} title={policyForm.id ? 'Cập Nhật Chính Sách' : 'Thêm Chính Sách Mới'} onClose={() => setShowPolicyModal(false)} onConfirm={savePolicy}>
                <div className="space-y-4 text-left">
                    <div>
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Tên Chính Sách</label>
                        <input value={policyForm.name} onChange={e => setPolicyForm({...policyForm, name: e.target.value})} placeholder="VD: Thuế TNCN 2026, Thuế VAT..." className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Trạng thái</label>
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={policyForm.isActive} onChange={e => setPolicyForm({...policyForm, isActive: e.target.checked})} className="peer sr-only" />
                                <div className={`relative w-[34px] h-[20px] rounded-full outline-none transition-colors duration-300 ease-in-out shadow-inner border border-[var(--border-subtle)] ${policyForm.isActive ? 'bg-[var(--system-green)]' : 'bg-[var(--bg-elevated-secondary)]'}`}>
                                    <span className={`absolute top-[1.5px] left-[2px] bg-white w-[15px] h-[15px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${policyForm.isActive ? 'translate-x-[13px]' : 'translate-x-0'}`}></span>
                                </div>
                            </div>
                            <span className="text-[14px] font-semibold">Đang áp dụng</span>
                        </label>
                    </div>

                    <AppleSelect value={policyForm.type} onChange={val => setPolicyForm({...policyForm, type: val})} label="Loại hình tính thuế" options={[{label:'Lũy tiến từng phần (Progressive)', value:'PROGRESSIVE'}, {label:'Cố định (Flat)', value:'FLAT'}]} />

                    <div className="bg-[var(--bg-elevated-secondary)] p-4 rounded-[20px] border border-[var(--separator)]">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-[12px] font-black text-viet-gold uppercase tracking-wider">Cấu hình Thuế Suất (%)</label>
                            {policyForm.type === 'PROGRESSIVE' && <button type="button" onClick={addBracket} className="text-[12px] font-bold text-viet-gold bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg outline-none hover:bg-[#D4AF37]/20 transition-colors">+ Thêm Bậc</button>}
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {policyForm.brackets.map((b, i) => (
                                <div key={i} className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] shadow-sm relative">
                                    {policyForm.type === 'PROGRESSIVE' && policyForm.brackets.length > 1 && (
                                        <button type="button" onClick={() => removeBracket(i)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--system-red)]/10 text-[var(--system-red)] flex items-center justify-center outline-none transition-colors hover:bg-[var(--system-red)] hover:text-white">
                                            <X className="sf-icon sf-icon-bold w-3 h-3" />
                                        </button>
                                    )}

                                    {policyForm.type === 'PROGRESSIVE' && <div className="text-[11px] font-black text-[var(--label-tertiary)] mb-3 uppercase tracking-wider">Bậc {i + 1}</div>}

                                    {policyForm.type === 'PROGRESSIVE' && (
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1">Từ thu nhập</label>
                                                <input type="tel" value={formatInputNumber(b.minIncome)} onChange={e => updateBracket(i, 'minIncome', parseInputNumber(e.target.value))} className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-lg p-2.5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 tabular-nums tracking-tight" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1">Đến (Trống = Lớn hơn)</label>
                                                <input type="tel" value={formatInputNumber(b.maxIncome)} onChange={e => updateBracket(i, 'maxIncome', parseInputNumber(e.target.value))} className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-lg p-2.5 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 tabular-nums tracking-tight" />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1">Thuế suất (%)</label>
                                        <input type="number" value={b.rate} onChange={e => updateBracket(i, 'rate', Number(e.target.value))} placeholder="VD: 5" className="w-full bg-[var(--bg-elevated-secondary)] border border-[var(--separator)] rounded-lg p-2.5 text-[16px] font-black outline-none focus:ring-2 focus:ring-[#D4AF37]/40 text-viet-gold tabular-nums tracking-tight" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AppleModal>

            {/* MODAL GIẢM TRỪ */}
            <AppleModal show={showDeductionModal} title={deductionForm.id ? 'Cập Nhật Giảm Trừ' : 'Thêm Giảm Trừ Mới'} onClose={() => setShowDeductionModal(false)} onConfirm={saveDeduction}>
                <div className="space-y-4 text-left">
                    <div>
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Tên Khoản Giảm Trừ</label>
                        <input value={deductionForm.name} onChange={e => setDeductionForm({...deductionForm, name: e.target.value})} placeholder="VD: Giảm trừ bản thân..." className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl p-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 shadow-sm transition-all" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Trạng thái</label>
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={deductionForm.isActive} onChange={e => setDeductionForm({...deductionForm, isActive: e.target.checked})} className="peer sr-only" />
                                <div className={`relative w-[34px] h-[20px] rounded-full outline-none transition-colors duration-300 ease-in-out shadow-inner border border-[var(--border-subtle)] ${deductionForm.isActive ? 'bg-[var(--system-green)]' : 'bg-[var(--bg-elevated-secondary)]'}`}>
                                    <span className={`absolute top-[1.5px] left-[2px] bg-white w-[15px] h-[15px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${deductionForm.isActive ? 'translate-x-[13px]' : 'translate-x-0'}`}></span>
                                </div>
                            </div>
                            <span className="text-[14px] font-semibold">Đang áp dụng</span>
                        </label>
                    </div>
                    <AppleSelect value={deductionForm.type} onChange={val => setDeductionForm({...deductionForm, type: val})} label="Loại giảm trừ" options={[{label:'Số tiền cố định (VNĐ)', value:'FIXED_AMOUNT'}, {label:'Phần trăm (%) theo thu nhập', value:'PERCENTAGE'}]} />
                    <div>
                        <label className="block text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Định mức</label>
                        <div className="relative">
                            {deductionForm.type === 'PERCENTAGE' ? (
                                <input value={deductionForm.amount} onChange={e => setDeductionForm({...deductionForm, amount: Number(e.target.value)})} type="number" placeholder="Nhập %..." className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl py-3 pl-4 pr-10 text-[18px] font-black outline-none focus:ring-2 focus:ring-[#D4AF37]/40 tabular-nums tracking-tight shadow-sm transition-all text-viet-gold" />
                            ) : (
                                <input value={formatInputNumber(deductionForm.amount)} onChange={e => setDeductionForm({...deductionForm, amount: parseInputNumber(e.target.value)})} type="tel" placeholder="Nhập số tiền..." className="w-full bg-[var(--bg-elevated)] border border-[var(--separator)] rounded-xl py-3 pl-4 pr-10 text-[18px] font-black outline-none focus:ring-2 focus:ring-[#D4AF37]/40 tabular-nums tracking-tight shadow-sm transition-all text-viet-gold" />
                            )}
                            <span className="absolute right-4 top-3 text-[var(--label-secondary)] font-bold text-[16px]">
                                {deductionForm.type === 'PERCENTAGE' ? '%' : '₫'}
                            </span>
                        </div>
                    </div>
                </div>
            </AppleModal>

            {/* CONFIRM ALERT */}
            <AnimatePresence>
                {confirm.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                        <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="apple-glass !bg-[var(--bg-elevated)] w-[270px] !rounded-[14px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-4 pt-5 pb-4 text-center">
                                <h3 className="font-semibold text-[17px] leading-snug mb-1 text-[var(--label-primary)]">{confirm.title}</h3>
                                <p className="caption mt-1">{confirm.msg}</p>
                            </div>
                            <div className="flex border-t border-[var(--separator)]">
                                <button type="button" onClick={() => setConfirm({...confirm, show: false})} className="flex-1 py-[11px] text-[17px] text-[var(--label-primary)] font-normal border-r border-[var(--separator)] hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors">
                                    Hủy
                                </button>
                                <button type="button" onClick={executeDelete} className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-[var(--bg-elevated-secondary)] outline-none transition-colors ${confirm.danger ? 'text-[var(--system-red)]' : 'text-viet-gold'}`}>
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