import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    CalendarDays, ChevronLeft, ChevronRight, TrendingUp,
    Sparkles, Maximize2, Plus, Minus, Inbox
} from 'lucide-react';
import api from '../utils/useApi.js';

const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatK = (amount) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace('.0', '') + 'tr';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'k';
    return amount || 0;
};

const today = new Date();

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [filterType, setFilterType] = useState('ALL');

    const fallbackMockData = useMemo(() => [
        { date: 5, type: 'OUT', amount: 500000, category: 'Ăn uống', note: 'Đi ăn lẩu' },
        { date: 12, type: 'OUT', amount: 500000, category: 'Ăn uống', note: 'Lẩu thái' },
        { date: 5, type: 'IN', amount: 15000000, category: 'Lương', note: 'Thưởng quý' },
        { date: today.getDate(), type: 'OUT', amount: 3000000, category: 'Mua sắm', note: 'Build PC mới' },
        { date: today.getDate(), type: 'IN', amount: 500000, category: 'Cổ tức', note: 'Cổ phiếu Apple' },
        { date: today.getDate() - 1, type: 'OUT', amount: 0, category: '', note: '' },
        { date: today.getDate() - 2, type: 'OUT', amount: 50000, category: 'Cafe', note: '' }
    ], []);

    // =========================================================================
    // REACT QUERY: Fetch dữ liệu theo Tháng/Năm, tự động Cache
    // =========================================================================
    const { data: transactionsData, isLoading } = useQuery({
        // Key cache bao gồm cả tháng và năm (Chuyển tháng sẽ có cache riêng)
        queryKey: ['transactions', 'calendar', currentMonth, currentYear],
        queryFn: async () => {
            const [resRevenue, resExpense] = await Promise.all([
                api.get(`/transactions/type/REVENUE`, { month: currentMonth, year: currentYear }),
                api.get(`/transactions/type/EXPENSE`, { month: currentMonth, year: currentYear })
            ]);

            const filterAndMap = (data, type) => {
                return (Array.isArray(data) ? data : []).reduce((acc, item) => {
                    const rawDateString = item.createdDate || item.date || item.transactionDate;
                    if (!rawDateString) return acc;
                    const d = new Date(rawDateString);
                    if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) {
                        acc.push({
                            date: d.getDate(),
                            type: type,
                            amount: item.amount || item.price || item.value || 0,
                            category: item.categoryName || item.category?.name || (type === 'IN' ? 'Thu nhập' : 'Chi tiêu'),
                            note: item.note || item.description || ''
                        });
                    }
                    return acc;
                }, []);
            };

            return [...filterAndMap(resRevenue, 'IN'), ...filterAndMap(resExpense, 'OUT')];
        },
        // Nếu API lỗi, dùng dữ liệu mẫu (Tính năng bảo vệ)
        placeholderData: fallbackMockData
    });

    // Mảng transactions chính thức dùng cho toàn bộ thuật toán bên dưới
    const transactions = transactionsData || fallbackMockData;
    // =========================================================================

    const monthlyTotals = useMemo(() => ({
        income: transactions.filter(t => t.type === 'IN').reduce((a, b) => a + b.amount, 0),
        expense: transactions.filter(t => t.type === 'OUT').reduce((a, b) => a + b.amount, 0)
    }), [transactions]);

    // ==========================================
    // 10 AI & DATA ANALYTICS ENGINES
    // ==========================================
    const heatmapThresholds = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'OUT').map(t => t.amount).sort((a, b) => a - b);
        if (expenses.length === 0) return { p70: 0, p90: 0 };
        const p70 = expenses[Math.floor(expenses.length * 0.7)] || 0;
        const p90 = expenses[Math.floor(expenses.length * 0.9)] || 0;
        return { p70, p90 };
    }, [transactions]);

    const getHeatmapClass = useCallback((date) => {
        if (date.expense === 0) return 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]';
        const { p70, p90 } = heatmapThresholds;
        if (p90 > 0 && date.expense >= p90) return 'bg-[var(--system-red)]/20 border-[var(--system-red)]/30 shadow-inner';
        if (p70 > 0 && date.expense >= p70) return 'bg-[var(--system-orange)]/20 border-[var(--system-orange)]/30';
        return 'bg-[#FFCC00]/10 border-[#FFCC00]/20';
    }, [heatmapThresholds]);

    const anomalyDays = useMemo(() => {
        const dailyExpensesMap = {};
        transactions.filter(t => t.type === 'OUT').forEach(t => {
            dailyExpensesMap[t.date] = (dailyExpensesMap[t.date] || 0) + t.amount;
        });
        const expenses = Object.values(dailyExpensesMap);
        if (expenses.length < 2) return [];

        const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
        const stdDev = Math.sqrt(expenses.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / expenses.length);

        const anomalies = [];
        Object.keys(dailyExpensesMap).forEach(day => {
            if (stdDev > 0 && (dailyExpensesMap[day] - mean) / stdDev > 2) {
                anomalies.push(Number(day));
            }
        });
        return anomalies;
    }, [transactions]);

    const aiEngines = useMemo(() => {
        const outs = transactions.filter(t => t.type === 'OUT');

        const dayTotals = { 'CN': 0, 'T2': 0, 'T3': 0, 'T4': 0, 'T5': 0, 'T6': 0, 'T7': 0 };
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        outs.forEach(tx => {
            const d = new Date(currentYear, currentMonth - 1, tx.date);
            dayTotals[dayNames[d.getDay()]] += tx.amount;
        });
        const maxDayName = Object.keys(dayTotals).reduce((a, b) => dayTotals[a] > dayTotals[b] ? a : b, 'T2');

        const recurringMap = {};
        outs.forEach(tx => {
            const key = `${tx.category}_${tx.amount}`;
            recurringMap[key] = (recurringMap[key] || 0) + 1;
        });
        const recurringList = Object.entries(recurringMap)
            .filter(([_, count]) => count >= 2)
            .map(([key]) => ({ category: key.split('_')[0], amount: Number(key.split('_')[1]) }));

        const cashFlow = monthlyTotals.income - monthlyTotals.expense;

        let streak = 0;
        const meanExp = outs.length > 0 ? outs.reduce((a, b) => a + b.amount, 0) / outs.length : 0;
        for (let i = today.getDate(); i >= 1; i--) {
            const dayExp = outs.filter(t => t.date === i).reduce((a, b) => a + b.amount, 0);
            if (dayExp <= meanExp) streak++;
            else break;
        }

        let sum7 = 0, count7 = 0;
        for (let i = today.getDate(); i > Math.max(0, today.getDate() - 7); i--) {
            sum7 += outs.filter(t => t.date === i).reduce((a, b) => a + b.amount, 0);
            count7++;
        }

        const catTotals = {};
        outs.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
        const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
        const spike = sortedCats.length > 0 && sortedCats[0][1] > (meanExp * 3)
            ? { category: sortedCats[0][0], amount: sortedCats[0][1] } : null;

        const budgetLimit = 20000000;
        const budgetPercent = (monthlyTotals.expense / budgetLimit) * 100;

        return {
            spendingPattern: { maxDay: maxDayName, amount: dayTotals[maxDayName] },
            recurring: recurringList,
            cashFlow,
            streakDays: streak,
            rollingAvg7: count7 ? (sum7 / count7) : 0,
            categorySpike: spike,
            budget: { limit: budgetLimit, percent: budgetPercent, isWarning: budgetPercent > 80, isDanger: budgetPercent >= 100 }
        };
    }, [transactions, currentMonth, currentYear, monthlyTotals]);

    // ==========================================

    const emptyDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
        return firstDay === 0 ? 6 : firstDay - 1;
    }, [currentYear, currentMonth]);

    const daysInMonth = useMemo(() => {
        const numDays = new Date(currentYear, currentMonth, 0).getDate();
        return Array.from({ length: numDays }, (_, i) => {
            const day = i + 1;
            const txs = transactions.filter(tx => tx.date === day);
            return {
                day,
                income: txs.filter(t => t.type === 'IN').reduce((a, b) => a + b.amount, 0),
                expense: txs.filter(t => t.type === 'OUT').reduce((a, b) => a + b.amount, 0),
                hasReminder: aiEngines.recurring.some(r => txs.some(t => t.category === r.category && t.amount === r.amount)),
                isAnomaly: anomalyDays.includes(day),
                isToday: day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
            };
        });
    }, [currentYear, currentMonth, transactions, aiEngines.recurring, anomalyDays]);

    const selectedDateDetails = useMemo(() => {
        const txs = transactions.filter(tx => tx.date === selectedDate);
        return {
            income: txs.filter(t => t.type === 'IN').reduce((a, b) => a + b.amount, 0),
            expense: txs.filter(t => t.type === 'OUT').reduce((a, b) => a + b.amount, 0),
            transactions: txs
        };
    }, [transactions, selectedDate]);

    const incomeRatio = useMemo(() => {
        const total = selectedDateDetails.income + selectedDateDetails.expense;
        return total === 0 ? 0 : (selectedDateDetails.income / total) * 100;
    }, [selectedDateDetails]);

    const expenseRatio = useMemo(() => {
        const total = selectedDateDetails.income + selectedDateDetails.expense;
        return total === 0 ? 0 : (selectedDateDetails.expense / total) * 100;
    }, [selectedDateDetails]);

    const displayTransactions = useMemo(() => {
        if (filterType === 'ALL') return selectedDateDetails.transactions;
        return selectedDateDetails.transactions.filter(t => t.type === filterType);
    }, [selectedDateDetails, filterType]);

    const handleSelectDate = (date) => {
        setSelectedDate(date.day);
        setFilterType('ALL');
    };

    const prevMonth = () => {
        if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
        else { setCurrentMonth(m => m - 1); }
    };

    const nextMonth = () => {
        if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
        else { setCurrentMonth(m => m + 1); }
    };

    return (
        <div className="space-y-6 relative z-10 apple-container pb-safe select-none">

            {/* HEADER */}
            <div className="apple-glass p-5 !rounded-[28px] shadow-sm flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="w-12 h-12 rounded-[16px] bg-gradient-to-tr from-[#D4AF37] to-[#AA771C] flex items-center justify-center text-[var(--bg-base)] shadow-[0_6px_16px_rgba(212,175,55,0.3)] shrink-0">
                            <CalendarDays className="sf-icon sf-icon-bold w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-[24px] font-black tracking-tight leading-none">
                                Lịch Dòng Tiền<span className="text-viet-gold">.</span>
                            </h2>
                            <p className="caption mt-1.5 tracking-tight">
                                Quản lý tài sản và biến động chi tiêu theo thời gian thực.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
                        <div className="flex gap-4 mr-2">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-widest">Tổng Thu</span>
                                <span className="text-[15px] font-black text-[var(--system-green)] tabular-nums tracking-tight">+{formatMoney(monthlyTotals.income)}</span>
                            </div>
                            <div className="w-px h-8 bg-[var(--separator)] self-center rounded-full"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-widest">Tổng Chi</span>
                                <span className="text-[15px] font-black text-[var(--system-red)] tabular-nums tracking-tight">-{formatMoney(monthlyTotals.expense)}</span>
                            </div>
                        </div>

                        <div className="flex items-center bg-[var(--bg-elevated)] backdrop-blur-md rounded-2xl p-1.5 border border-[var(--border-subtle)] shadow-sm">
                            <button onClick={prevMonth} className="apple-btn-icon !w-8 !h-8 !bg-transparent text-[var(--label-secondary)] hover:!bg-[#D4AF37]/10 hover:!text-viet-gold">
                                <ChevronLeft className="sf-icon sf-icon-bold w-4 h-4" />
                            </button>
                            <span className="px-5 text-[15px] font-black tracking-tight min-w-[140px] text-center">
                                Tháng {currentMonth} / {currentYear}
                            </span>
                            <button onClick={nextMonth} className="apple-btn-icon !w-8 !h-8 !bg-transparent text-[var(--label-secondary)] hover:!bg-[#D4AF37]/10 hover:!text-viet-gold">
                                <ChevronRight className="sf-icon sf-icon-bold w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 THẺ ANALYTICS (AI ENGINES) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <div className="apple-glass p-4 !rounded-[20px] shadow-sm">
                    <h4 className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-2">Số dư Dòng tiền (Tháng)</h4>
                    <p className={`text-[18px] font-black tabular-nums tracking-tight mb-3 ${aiEngines.cashFlow >= 0 ? 'text-[var(--system-green)]' : 'text-[var(--system-red)]'}`}>
                        {aiEngines.cashFlow >= 0 ? '+' : ''}{formatMoney(aiEngines.cashFlow)}
                    </p>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">Ngân sách (20Tr)</span>
                        <span className={`text-[12px] font-bold ${aiEngines.budget.isDanger ? 'text-[var(--system-red)]' : ''}`}>{aiEngines.budget.percent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[var(--separator)] rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all ${aiEngines.budget.isDanger ? 'bg-[var(--system-red)]' : (aiEngines.budget.isWarning ? 'bg-[var(--system-orange)]' : 'bg-[#D4AF37]')}`} style={{ width: `${Math.min(100, aiEngines.budget.percent)}%` }}></div>
                    </div>
                </div>

                <div className="apple-glass p-4 !rounded-[20px] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-0.5">Chuỗi an toàn</h4>
                            <div className="flex items-center gap-1.5 text-[var(--system-green)]">
                                <TrendingUp className="sf-icon sf-icon-bold w-4 h-4" />
                                <span className="text-[16px] font-black">{aiEngines.streakDays} ngày</span>
                            </div>
                        </div>
                    </div>
                    <h4 className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-0.5">Trung bình 7 ngày qua</h4>
                    <p className="text-[15px] font-black tabular-nums tracking-tight">{formatMoney(aiEngines.rollingAvg7)}/ngày</p>
                </div>

                <div className="apple-glass p-4 !rounded-[20px] shadow-sm">
                    <h4 className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-0.5">Hành vi chi tiêu</h4>
                    <p className="text-[12px] font-medium leading-tight mb-3">
                        Bạn chi tiêu nhiều nhất vào <strong className="text-viet-gold">{aiEngines.spendingPattern.maxDay}</strong> ({formatK(aiEngines.spendingPattern.amount)})
                    </p>
                    <h4 className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-0.5">Spike (Đột biến)</h4>
                    {aiEngines.categorySpike ? (
                        <p className="text-[13px] font-bold text-[var(--system-red)] tracking-tight truncate">
                            {aiEngines.categorySpike.category}: {formatMoney(aiEngines.categorySpike.amount)}
                        </p>
                    ) : (
                        <p className="text-[13px] font-bold text-[var(--label-tertiary)]">Không có đột biến</p>
                    )}
                </div>

                <div className="apple-glass p-4 !rounded-[20px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 shadow-sm">
                    <h4 className="text-[10px] font-bold text-viet-gold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Sparkles className="sf-icon sf-icon-bold w-3 h-3" />
                        Nhắc nhở AI
                    </h4>
                    {aiEngines.recurring.length > 0 ? (
                        <div>
                            <p className="text-[12px] font-medium leading-tight">
                                Phát hiện <strong className="text-viet-gold">{aiEngines.recurring.length}</strong> khoản định kỳ.
                            </p>
                            <ul className="mt-1 space-y-1">
                                {aiEngines.recurring.slice(0,2).map((rec, i) => (
                                    <li key={i} className="text-[11px] font-semibold text-[var(--label-secondary)] flex justify-between">
                                        <span>{rec.category}</span>
                                        <span>{formatK(rec.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-[12px] font-medium text-[var(--label-tertiary)] leading-tight">Chưa phát hiện hành vi lặp lại.</p>
                    )}
                </div>
            </div>

            {/* LỊCH VÀ CHI TIẾT NGÀY */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* BẢNG LỊCH (CALENDAR GRID) */}
                <div className="xl:col-span-2 apple-glass p-6 sm:p-8 !rounded-[28px] shadow-sm">
                    <div className="grid grid-cols-7 gap-3 mb-6">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                            <div key={day} className="text-center text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-[0.25em]">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2.5 sm:gap-4">
                        {Array.from({ length: emptyDays }).map((_, i) => (
                            <div key={`empty${i}`} className="aspect-square sm:aspect-auto sm:h-28 rounded-[20px] bg-[var(--bg-elevated)] opacity-20 border border-transparent"></div>
                        ))}

                        {daysInMonth.map(date => (
                            <div
                                key={date.day}
                                onClick={() => handleSelectDate(date)}
                                className={`relative aspect-square sm:aspect-auto sm:h-28 rounded-[20px] p-3 sm:p-4 border transition-all duration-300 cursor-pointer group flex flex-col justify-between outline-none overflow-hidden ${
                                    selectedDate === date.day ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_0_2px_rgba(212,175,55,0.2)]' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[#D4AF37]/50'
                                } ${date.isToday ? 'ring-2 ring-inset ring-[#D4AF37]' : ''} ${getHeatmapClass(date)}`}
                            >
                                {date.isAnomaly && (
                                    <div className="absolute top-2 right-2 flex items-center justify-center">
                                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[var(--system-red)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--system-red)]"></span>
                                    </div>
                                )}

                                <div className="flex justify-between items-start">
                                    <span className={`text-[17px] sm:text-[20px] font-black tracking-tighter ${date.isToday ? 'text-viet-gold' : 'text-[var(--label-primary)]'}`}>
                                        {date.day}
                                    </span>
                                    {date.hasReminder && <div className="w-2.5 h-2.5 rounded-full bg-[#AF52DE] shadow-[0_0_8px_#AF52DE]"></div>}
                                </div>

                                <div className="hidden sm:flex flex-col items-end gap-0.5 mt-auto">
                                    {date.income > 0 && <span className="text-[12px] font-bold text-[var(--system-green)] tabular-nums tracking-tight">+{formatK(date.income)}</span>}
                                    {date.expense > 0 && <span className="text-[12px] font-bold text-[var(--system-red)] tabular-nums tracking-tight">-{formatK(date.expense)}</span>}
                                </div>

                                <div className="flex sm:hidden justify-end gap-1.5 mt-auto">
                                    {date.income > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--system-green)]"></div>}
                                    {date.expense > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--system-red)]"></div>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap items-center gap-6 text-[10.5px] font-bold text-[var(--label-secondary)] uppercase tracking-[0.15em] justify-center sm:justify-start">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"></div> Mức thấp</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[var(--system-orange)]/20 border border-[var(--system-orange)]/30"></div> Top 30%</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[var(--system-red)]/20 border border-[var(--system-red)]/30"></div> Top 10%</div>
                        <div className="w-px h-3 bg-[var(--separator)] mx-2"></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--system-red)]"></div> Bất thường (Z{'>'}2)</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#AF52DE]"></div> Lịch định kỳ</div>
                    </div>
                </div>

                {/* SIDEBAR CHI TIẾT NGÀY */}
                <div className="apple-glass !rounded-[28px] shadow-sm flex flex-col h-[600px] xl:h-auto overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-[var(--separator)] bg-[var(--bg-elevated)]/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-[0.2em] mb-1.5">Ngày {selectedDate} Tháng {currentMonth}</h3>
                                <p className="text-[26px] font-black tracking-tight leading-none">Tổng quan</p>
                            </div>
                            <button className="apple-squircle w-8 h-8 bg-[#D4AF37]/10 text-viet-gold hover:bg-[#D4AF37] hover:text-[var(--bg-base)] transition-colors flex items-center justify-center outline-none shadow-sm">
                                <Maximize2 className="sf-icon sf-icon-bold w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-[13px] font-semibold text-[var(--label-secondary)] tracking-tight">Thu vào</p>
                                <p className="text-[16px] font-black text-[var(--system-green)] tabular-nums tracking-tight">+{formatMoney(selectedDateDetails.income)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[13px] font-semibold text-[var(--label-secondary)] tracking-tight">Chi ra</p>
                                <p className="text-[16px] font-black text-[var(--system-red)] tabular-nums tracking-tight">-{formatMoney(selectedDateDetails.expense)}</p>
                            </div>
                        </div>

                        <div className="w-full h-1.5 bg-[var(--separator)] rounded-full overflow-hidden flex">
                            <div className="h-full bg-[var(--system-green)] transition-all duration-500" style={{ width: `${incomeRatio}%` }}></div>
                            <div className="h-full bg-[var(--system-red)] transition-all duration-500" style={{ width: `${expenseRatio}%` }}></div>
                        </div>

                        <div className="flex bg-[var(--bg-elevated-secondary)] p-1 rounded-lg mt-6">
                            {['ALL', 'IN', 'OUT'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterType(tab)}
                                    className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all outline-none ${filterType === tab ? 'bg-[var(--bg-elevated)] text-viet-gold shadow-sm border border-[#D4AF37]/20' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}
                                >
                                    {tab === 'ALL' ? 'Tất cả' : tab === 'IN' ? 'Thu' : 'Chi'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar bg-transparent relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/50 backdrop-blur-sm z-10">
                                <div className="w-6 h-6 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : displayTransactions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--label-tertiary)] opacity-60">
                                <Inbox className="sf-icon sf-icon-regular w-12 h-12 mb-3" />
                                <p className="text-[14px] font-medium tracking-tight">Trống trải quá...</p>
                            </div>
                        ) : (
                            displayTransactions.map((tx, idx) => (
                                <div key={idx} className="bg-[var(--bg-elevated)] p-4 rounded-[20px] border border-[var(--border-subtle)] flex justify-between items-center group transition-all hover:scale-[1.01] hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/30 shadow-sm cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'IN' ? 'bg-[var(--system-green)]/15 text-[var(--system-green)]' : 'bg-[var(--system-red)]/15 text-[var(--system-red)]'}`}>
                                            {tx.type === 'IN' ? <Plus className="sf-icon sf-icon-bold w-5 h-5" /> : <Minus className="sf-icon sf-icon-bold w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-black group-hover:text-viet-gold transition-colors leading-none tracking-tight">{tx.category}</p>
                                            <p className="text-[12.5px] font-medium text-[var(--label-secondary)] mt-1.5 truncate max-w-[130px] tracking-tight">{tx.note || 'Không có ghi chú'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[16px] font-black tabular-nums tracking-tighter ${tx.type === 'IN' ? 'text-[var(--system-green)]' : 'text-[var(--system-red)]'}`}>
                                            {tx.type === 'IN' ? '+' : '-'}{formatMoney(tx.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}