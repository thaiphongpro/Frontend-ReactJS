import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    CreditCard, ArrowDownLeft, ArrowUpRight,
    ChevronRight, ChevronLeft, Inbox, Plus, Minus
} from 'lucide-react';

import AppleModal from '../components/AppleModal.jsx';
import { useSettingsStore } from '../store/useSettingsStore.js';
import api from '../utils/useApi.js';

export default function Dashboard() {
    // 1. Chỉ lấy currency từ Store (Đã xóa formatMoney ở đây để tránh lỗi)
    const { currency } = useSettingsStore();

    // 2. Viết hàm formatMoney cục bộ ngay trong Component
    const formatMoney = (amount) => {
        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: currency || 'VND'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('-').reverse().join('/');
    };

    // =========================================================================
    // REACT QUERY: Lấy data, tự động Cache, hiển thị tức thì
    // =========================================================================

    const { data: report = { totalRevenue: 0, totalExpense: 0, netBalance: 0 } } = useQuery({
        queryKey: ['report-general'],
        queryFn: () => api.get('/transactions/report/general')
    });

    const { data: allRevenues = [] } = useQuery({
        queryKey: ['transactions', 'REVENUE'],
        queryFn: () => api.get('/transactions/type/REVENUE')
    });

    const { data: allExpenses = [] } = useQuery({
        queryKey: ['transactions', 'EXPENSE'],
        queryFn: () => api.get('/transactions/type/EXPENSE')
    });

    // =========================================================================

    // State điều khiển giao diện
    const [viewingTx, setViewingTx] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 3. Tính toán gộp mảng với LỚP BẢO VỆ CHỐNG CRASH
    const allTransactions = useMemo(() => {
        // Đảm bảo dữ liệu luôn là mảng trước khi gộp
        const safeRevenues = Array.isArray(allRevenues) ? allRevenues : [];
        const safeExpenses = Array.isArray(allExpenses) ? allExpenses : [];

        const combined = [...safeRevenues, ...safeExpenses];
        // Lọc bỏ những dòng dữ liệu bị hỏng (nếu có)
        const validCombined = combined.filter(tx => tx && tx.date);
        validCombined.sort((a, b) => new Date(b.date) - new Date(a.date));
        return validCombined;
    }, [allRevenues, allExpenses]);

    // Logic phân trang
    const totalPages = useMemo(() => Math.ceil(allTransactions.length / itemsPerPage) || 1, [allTransactions.length]);

    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return allTransactions.slice(start, start + itemsPerPage);
    }, [allTransactions, currentPage]);

    const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
    const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

    return (
        <div className="space-y-6 relative z-10 apple-container pb-safe">

            {/* ========================================================= */}
            {/* 3 THẺ THỐNG KÊ (NET BALANCE, REVENUE, EXPENSE)            */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                {/* Thẻ Net Balance (Sơn Mài) */}
                <div className="lacquer-glass shadow-glow-red md:col-span-1 p-6 flex flex-col justify-between h-40 transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-viet-gold shadow-glow-gold">
                            <CreditCard className="sf-icon sf-icon-bold w-5 h-5" />
                        </div>
                        <h3 className="text-[13px] font-bold text-white/80 uppercase tracking-wider">Net Balance</h3>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[34px] font-black tabular-nums tracking-tight text-gradient-gold drop-shadow-md">
                                {formatMoney(report.netBalance)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Thẻ Money In */}
                    <div className="apple-glass p-6 flex flex-col justify-between h-40 hover:bg-white/60 dark:hover:bg-[#2C2C2E]/80 hover:shadow-glow-gold transition-all cursor-default group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--system-green)]/10 flex items-center justify-center text-[var(--system-green)] group-hover:bg-[var(--system-green)] group-hover:text-white transition-colors">
                                <ArrowDownLeft className="sf-icon sf-icon-bold w-5 h-5" />
                            </div>
                            <h3 className="text-[13px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Money In</h3>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-1 text-[var(--system-green)]">
                                <span className="text-[34px] font-black tabular-nums tracking-tight drop-shadow-sm">+ {formatMoney(report.totalRevenue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thẻ Money Out */}
                    <div className="apple-glass p-6 flex flex-col justify-between h-40 hover:bg-white/60 dark:hover:bg-[#2C2C2E]/80 hover:shadow-glow-red transition-all cursor-default group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--system-red)]/10 flex items-center justify-center text-[var(--system-red)] group-hover:bg-[var(--system-red)] group-hover:text-white transition-colors">
                                <ArrowUpRight className="sf-icon sf-icon-bold w-5 h-5" />
                            </div>
                            <h3 className="text-[13px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Money Out</h3>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-baseline gap-1 text-[var(--system-red)]">
                                <span className="text-[34px] font-black tabular-nums tracking-tight drop-shadow-sm">- {formatMoney(report.totalExpense)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* DANH SÁCH GIAO DỊCH GẦN ĐÂY                               */}
            {/* ========================================================= */}
            <div className="apple-glass flex flex-col">
                <div className="p-5 border-b border-[var(--separator)] flex justify-between items-center">
                    <h3 className="text-[17px] font-bold">Recent Transactions</h3>
                    <Link to="/reports" className="text-viet-gold text-[13px] font-bold hover:text-[#AA771C] transition-colors outline-none flex items-center gap-1">
                        View All <ChevronRight className="sf-icon sf-icon-bold w-3 h-3" />
                    </Link>
                </div>

                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                    {/* Trạng thái trống */}
                    {allTransactions.length === 0 && (
                        <div className="text-center py-12 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                                <Inbox className="sf-icon sf-icon-regular w-6 h-6 text-viet-gold" />
                            </div>
                            <span className="caption">No transactions found.</span>
                        </div>
                    )}

                    {/* Render danh sách */}
                    <div className="flex-1">
                        {paginatedTransactions.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => setViewingTx(tx)}
                                className="cursor-pointer flex justify-between items-center py-3.5 border-b border-[var(--separator)] last:border-0 hover:bg-[var(--bg-elevated-secondary)] transition-all px-3 rounded-xl -mx-3 group"
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                                        tx.type === 'REVENUE' ? 'bg-[var(--system-green)]/10 text-[var(--system-green)]' : 'bg-[var(--system-red)]/10 text-[var(--system-red)]'
                                    }`}>
                                        {tx.type === 'REVENUE' ? <Plus className="sf-icon sf-icon-bold w-5 h-5" /> : <Minus className="sf-icon sf-icon-bold w-5 h-5" />}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-semibold text-[15px] truncate group-hover:text-viet-gold transition-colors">{tx.category}</p>
                                        <p className="caption truncate mt-0.5">
                                            {formatDate(tx.date)}
                                            {tx.source && (
                                                <span className="text-viet-gold ml-1 px-1.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-md font-bold uppercase tracking-wider text-[9px]">
                                                    {tx.source}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <p className={`font-bold text-[15px] tabular-nums tracking-tight whitespace-nowrap pl-4 ${
                                    tx.type === 'REVENUE' ? 'text-[var(--system-green)]' : 'text-[var(--system-red)]'
                                }`}>
                                    {tx.type === 'REVENUE' ? '+' : '-'} {formatMoney(tx.amount)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-between pt-5 mt-3 border-t border-[var(--separator)] gap-4">
                            <p className="caption">
                                Showing <span className="font-bold text-[var(--label-primary)]">{(currentPage - 1) * itemsPerPage + 1}</span> -
                                <span className="font-bold text-[var(--label-primary)]">{Math.min(currentPage * itemsPerPage, allTransactions.length)}</span>
                                {' '}of <span className="font-bold text-[var(--label-primary)]">{allTransactions.length}</span>
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--separator)] text-[var(--label-primary)] hover:!text-viet-gold hover:border-[#D4AF37] disabled:opacity-40 disabled:hover:border-[var(--separator)] disabled:hover:!text-[var(--label-primary)] disabled:cursor-not-allowed shadow-sm"
                                >
                                    <ChevronLeft className="sf-icon sf-icon-bold w-4 h-4" />
                                </button>

                                <span className="text-[13px] font-bold px-2">Page {currentPage} of {totalPages}</span>

                                <button
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                    className="apple-btn-icon !w-8 !h-8 !bg-[var(--bg-elevated)] border border-[var(--separator)] text-[var(--label-primary)] hover:!text-viet-gold hover:border-[#D4AF37] disabled:opacity-40 disabled:hover:border-[var(--separator)] disabled:hover:!text-[var(--label-primary)] disabled:cursor-not-allowed shadow-sm"
                                >
                                    <ChevronRight className="sf-icon sf-icon-bold w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL CHI TIẾT GIAO DỊCH (Transaction Receipt)            */}
            {/* ========================================================= */}
            <AppleModal
                show={!!viewingTx}
                title="Transaction Receipt"
                confirmText="Close"
                onClose={() => setViewingTx(null)}
                onConfirm={() => setViewingTx(null)}
            >
                {viewingTx && (
                    <div className="px-2 pb-2 text-left">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-[var(--separator)] mb-5">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-sm border ${
                                viewingTx.type === 'REVENUE' ? 'bg-[var(--system-green)]/10 text-[var(--system-green)] border-[var(--system-green)]/30' : 'bg-[var(--system-red)]/10 text-[var(--system-red)] border-[var(--system-red)]/30'
                            }`}>
                                {viewingTx.type === 'REVENUE' ? <Plus className="sf-icon sf-icon-bold w-7 h-7" /> : <Minus className="sf-icon sf-icon-bold w-7 h-7" />}
                            </div>
                            <h2 className={`text-[32px] font-black tabular-nums tracking-tight leading-none drop-shadow-sm ${
                                viewingTx.type === 'REVENUE' ? 'text-[var(--system-green)]' : 'text-[var(--system-red)]'
                            }`}>
                                {viewingTx.type === 'REVENUE' ? '+' : '-'} {formatMoney(viewingTx.amount)}
                            </h2>
                            <p className="text-[13px] font-bold text-viet-gold uppercase mt-2 tracking-widest">{viewingTx.category}</p>
                        </div>

                        <div className="space-y-4 text-[14px]">
                            <div className="flex justify-between items-center">
                                <span className="caption">Date</span>
                                <span className="font-bold text-[var(--label-primary)]">{formatDate(viewingTx.date)}</span>
                            </div>
                            {viewingTx.source && (
                                <div className="flex justify-between items-center">
                                    <span className="caption">Source / Wallet</span>
                                    <span className="font-bold text-viet-gold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1 rounded-lg text-[12px]">{viewingTx.source}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-start mt-4 pt-4 border-t border-dashed border-[var(--separator)]">
                                <span className="caption whitespace-nowrap mr-4">Notes</span>
                                <span className="font-medium text-[var(--label-primary)] text-right leading-relaxed">{viewingTx.description || 'No additional notes'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </AppleModal>

        </div>
    );
}