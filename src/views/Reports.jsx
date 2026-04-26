import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, Title,
    LineElement, PointElement, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

import AppleDatePicker from '../components/AppleDatePicker.jsx';
import AppleSelect from '../components/AppleSelect.jsx';
import { useSettingsStore } from '../store/useSettingsStore.js';
import api from '../utils/useApi.js';

// Khởi tạo Chart.js
ChartJS.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, Filler);

// Cấu hình Biểu đồ tĩnh
const appleColors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#E5E5EA'];

const barChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(28, 28, 30, 0.85)', titleColor: '#8E8E93', bodyColor: '#FFFFFF',
            bodyFont: { weight: 'bold', size: 14 }, padding: 12, cornerRadius: 12, displayColors: false,
            callbacks: { label: (context) => `+ ${new Intl.NumberFormat('vi-VN').format(context.raw)} ₫` }
        }
    },
    scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: '#8E8E93', font: { weight: '600' } } },
        y: { border: { display: false }, grid: { color: 'rgba(150, 150, 150, 0.1)', tickLength: 0 },
            ticks: { color: '#8E8E93', font: { weight: '600' },
                callback: (value) => { if (value >= 1000000) return (value / 1000000) + 'M'; if (value >= 1000) return (value / 1000) + 'K'; return value; }
            }
        }
    }
};

const doughnutChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '78%',
    elements: { arc: { borderWidth: 0, borderRadius: 4 } },
    plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, padding: 20, color: '#8E8E93', font: { size: 12, weight: '600' } } },
        tooltip: {
            backgroundColor: 'rgba(28, 28, 30, 0.85)', titleColor: '#8E8E93', bodyColor: '#FFFFFF',
            bodyFont: { weight: 'bold', size: 14 }, padding: 12, cornerRadius: 12,
            callbacks: { label: (context) => `- ${new Intl.NumberFormat('vi-VN').format(context.raw)} ₫` }
        }
    }
};

const lineChartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: {
            position: 'top', align: 'end',
            labels: {
                usePointStyle: true, boxWidth: 8, color: '#8E8E93', font: { weight: 'bold' },
                filter: function(item) { return !item.text.includes('CI'); }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(28, 28, 30, 0.85)', titleColor: '#8E8E93', bodyColor: '#FFFFFF',
            bodyFont: { weight: 'bold', size: 14 }, padding: 12, cornerRadius: 12,
            callbacks: {
                label: (context) => {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.y !== null) label += new Intl.NumberFormat('vi-VN').format(context.parsed.y) + ' ₫';
                    return label;
                }
            }
        }
    },
    scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: '#8E8E93', font: { weight: '600' } } },
        y: { border: { display: false }, grid: { color: 'rgba(150, 150, 150, 0.1)', tickLength: 0 },
            ticks: {
                color: '#8E8E93', font: {weight: '600'},
                callback: (value) => {
                    if (value >= 1000000) return (value / 1000000) + 'M';
                    if (value >= 1000) return (value / 1000) + 'K';
                    return value;
                }
            }
        }
    }
};

export default function Reports() {
    const { currency } = useSettingsStore();

    const formatMoney = useCallback((amount) => {
        return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
            style: 'decimal'
        }).format(amount || 0);
    }, [currency]);

    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - tzOffset)).toISOString().slice(0, -1);

    const [reportMode, setReportMode] = useState('MONTH');
    const [selectedMonth, setSelectedMonth] = useState(localISOTime.substring(0, 7));
    const [selectedDate, setSelectedDate] = useState(localISOTime.substring(0, 10));
    const [selectedYear, setSelectedYear] = useState(localISOTime.substring(0, 4));

    // =========================================================================
    // REACT QUERY: Fetch dữ liệu Báo cáo & Dự báo (Cache Data)
    // =========================================================================
    const { data: allRevenues = [] } = useQuery({
        queryKey: ['transactions', 'REVENUE'],
        queryFn: async () => {
            const res = await api.get('/transactions/type/REVENUE');
            return res || [];
        }
    });

    const { data: allExpenses = [] } = useQuery({
        queryKey: ['transactions', 'EXPENSE'],
        queryFn: async () => {
            const res = await api.get('/transactions/type/EXPENSE');
            return res || [];
        }
    });

    const { data: forecastData = null, isLoading: isForecasting } = useQuery({
        queryKey: ['reports', 'forecast', 'EXPENSE'],
        queryFn: async () => {
            const res = await api.get('/reports/forecast?type=EXPENSE');
            return res || null;
        }
    });
    // =========================================================================

    // Các tuỳ chọn Ngày / Tháng / Năm
    const monthOptions = useMemo(() => {
        const opts = [];
        const d = new Date();
        for (let i = 0; i < 24; i++) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            opts.push({ value: `${y}-${m}`, label: `Tháng ${m}/${y}` });
            d.setMonth(d.getMonth() - 1);
        }
        return opts;
    }, []);

    const yearOptions = useMemo(() => {
        const opts = [];
        const y = new Date().getFullYear();
        for (let i = 0; i < 10; i++) {
            opts.push({ value: String(y - i), label: `Năm ${y - i}` });
        }
        return opts;
    }, []);

    // TÍNH TOÁN CƠ BẢN TOÀN THỜI GIAN
    const allTimeRev = useMemo(() => allRevenues.reduce((s, r) => s + (r.amount || 0), 0), [allRevenues]);
    const allTimeExp = useMemo(() => allExpenses.reduce((s, e) => s + (e.amount || 0), 0), [allExpenses]);
    const allTimeNet = useMemo(() => allTimeRev - allTimeExp, [allTimeRev, allTimeExp]);

    const allTimeSavingsRate = useMemo(() => {
        if (allTimeRev === 0) return 0;
        return ((allTimeNet / allTimeRev) * 100).toFixed(1);
    }, [allTimeRev, allTimeNet]);

    const allTimeAvgDailyExp = useMemo(() => {
        if (allExpenses.length === 0) return 0;
        const dates = allExpenses.map(e => new Date(e.date).getTime()).filter(t => !isNaN(t));
        if (dates.length === 0) return 0;
        const minDate = Math.min(...dates);
        const now = new Date().getTime();
        const diffTime = Math.abs(now - minDate);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) diffDays = 1;
        return allTimeExp / diffDays;
    }, [allExpenses, allTimeExp]);

    // LỌC THEO KỲ
    const filteredRevenues = useMemo(() => {
        return allRevenues.filter(r => {
            if (!r.date) return false;
            if (reportMode === 'MONTH') return r.date.startsWith(selectedMonth);
            if (reportMode === 'DAY') return r.date === selectedDate;
            if (reportMode === 'YEAR') return r.date.startsWith(String(selectedYear));
            return false;
        });
    }, [allRevenues, reportMode, selectedMonth, selectedDate, selectedYear]);

    const filteredExpenses = useMemo(() => {
        return allExpenses.filter(e => {
            if (!e.date) return false;
            if (reportMode === 'MONTH') return e.date.startsWith(selectedMonth);
            if (reportMode === 'DAY') return e.date === selectedDate;
            if (reportMode === 'YEAR') return e.date.startsWith(String(selectedYear));
            return false;
        });
    }, [allExpenses, reportMode, selectedMonth, selectedDate, selectedYear]);

    const totalRev = useMemo(() => filteredRevenues.reduce((s, r) => s + (r.amount || 0), 0), [filteredRevenues]);
    const totalExp = useMemo(() => filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0), [filteredExpenses]);
    const netProfit = useMemo(() => totalRev - totalExp, [totalRev, totalExp]);

    const savingsRate = useMemo(() => totalRev === 0 ? 0 : ((netProfit / totalRev) * 100).toFixed(1), [totalRev, netProfit]);
    const profitMargin = useMemo(() => totalRev === 0 ? 0 : ((netProfit / totalRev) * 100).toFixed(1), [totalRev, netProfit]);
    const expenseRatio = useMemo(() => totalRev === 0 ? 0 : ((totalExp / totalRev) * 100).toFixed(1), [totalRev, totalExp]);

    const prevPeriodExp = useMemo(() => {
        let prevStr = '';
        if (reportMode === 'DAY') {
            const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
            prevStr = new Date(d - tzOffset).toISOString().substring(0, 10);
        } else if (reportMode === 'MONTH') {
            const [y, m] = selectedMonth.split('-');
            const d = new Date(y, m - 2, 1);
            prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else {
            prevStr = String(Number(selectedYear) - 1);
        }
        return allExpenses.filter(e => e.date && e.date.startsWith(prevStr)).reduce((s, e) => s + (e.amount || 0), 0);
    }, [allExpenses, reportMode, selectedDate, selectedMonth, selectedYear, tzOffset]);

    const expTrend = useMemo(() => {
        if (prevPeriodExp === 0) return null;
        const diff = totalExp - prevPeriodExp;
        const pct = (diff / prevPeriodExp) * 100;
        return { val: pct, isBad: pct > 0, text: pct > 0 ? `Tăng ${Math.abs(pct).toFixed(1)}%` : `Giảm ${Math.abs(pct).toFixed(1)}%` };
    }, [totalExp, prevPeriodExp]);

    // ==========================================
    // THUẬT TOÁN AI & THỐNG KÊ
    // ==========================================
    const timeSeriesData = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const d = e.date.substring(0, 10);
            map[d] = (map[d] || 0) + (e.amount || 0);
        });
        const sortedDates = Object.keys(map).sort();
        const values = sortedDates.map(d => map[d]);
        return { dates: sortedDates, values };
    }, [filteredExpenses]);

    const advancedTrend = useMemo(() => {
        const { values } = timeSeriesData;
        if (values.length < 2) return { slope: 0, status: 'ổn định' };
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        const n = values.length;
        for (let i = 0; i < n; i++) { sumX += i; sumY += values[i]; sumXY += i * values[i]; sumXX += i * i; }
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const meanY = sumY / n;
        let status = 'ổn định';
        if (slope > meanY * 0.05) status = 'tăng';
        if (slope < -meanY * 0.05) status = 'giảm';
        return { slope, status };
    }, [timeSeriesData]);

    const anomalyData = useMemo(() => {
        const { dates, values } = timeSeriesData;
        if (values.length < 3) return [];
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
        let anomalies = [];
        values.forEach((val, idx) => {
            if (stdDev > 0 && Math.abs(val - mean) / stdDev > 2) {
                anomalies.push({ date: dates[idx], value: val, type: val > mean ? 'bất thường cao' : 'bất thường thấp' });
            }
        });
        return anomalies;
    }, [timeSeriesData]);

    const hwForecastResult = useMemo(() => {
        if (!forecastData || !forecastData.historicalData) return null;
        const historyVals = Object.values(forecastData.historicalData);
        if (historyVals.length < 2) return null;

        const alpha = 0.5, beta = 0.5;
        let level = historyVals[0];
        let trend = historyVals[1] - historyVals[0];

        for (let i = 1; i < historyVals.length; i++) {
            const lastLevel = level;
            level = alpha * historyVals[i] + (1 - alpha) * (lastLevel + trend);
            trend = beta * (level - lastLevel) + (1 - beta) * trend;
        }

        const predicted = level + trend;
        const mean = historyVals.reduce((a,b)=>a+b,0)/historyVals.length;
        const std = Math.sqrt(historyVals.map(x=>Math.pow(x-mean,2)).reduce((a,b)=>a+b,0)/historyVals.length);
        const interval = std * 1.96;

        return { predicted: Math.max(0, predicted), interval, min: Math.max(0, predicted - interval), max: predicted + interval };
    }, [forecastData]);

    const topExpenseCategories = useMemo(() => {
        const map = {};
        filteredExpenses.forEach(e => {
            const catName = e.category || 'Khác';
            map[catName] = (map[catName] || 0) + (e.amount || 0);
        });
        const sorted = Object.entries(map).map(([name, amount]) => ({
            name, amount, percent: totalExp ? ((amount/totalExp)*100).toFixed(1) : 0
        })).sort((a,b) => b.amount - a.amount);

        let cumulative = 0;
        sorted.forEach((item, idx) => {
            cumulative += parseFloat(item.percent);
            item.isPareto = (idx + 1) / sorted.length <= 0.3 && cumulative >= 70;
        });
        return sorted.slice(0, 5);
    }, [filteredExpenses, totalExp]);

    const financialScoreData = useMemo(() => {
        let score = 50;
        const rate = parseFloat(savingsRate);
        if (rate >= 20) score += 20;
        if (rate >= 50) score += 10;
        if (rate < 0) score -= 20;

        if (advancedTrend.status === 'giảm') score += 20;
        if (advancedTrend.status === 'tăng') score -= 15;

        score = Math.max(0, Math.min(100, score));
        let rating = 'Kém'; let color = 'text-[var(--system-red)]'; let borderColor = 'border-[var(--system-red)] text-[var(--system-red)]';
        if (score >= 80) { rating = 'Tốt'; color = 'text-[var(--system-green)]'; borderColor = 'border-[var(--system-green)] text-[var(--system-green)]'; }
        else if (score >= 50) { rating = 'Trung bình'; color = 'text-[#FF9500]'; borderColor = 'border-[#FF9500] text-[#FF9500]'; }

        return { score, rating, color, borderColor };
    }, [savingsRate, advancedTrend]);

    const burnRateData = useMemo(() => {
        const daysInPeriod = timeSeriesData.dates.length || 1;
        const dailyBurn = totalExp / daysInPeriod;
        const balance = allTimeNet;
        const daysLeft = dailyBurn > 0 ? Math.floor(balance / dailyBurn) : 999;
        return { dailyBurn, daysLeft };
    }, [totalExp, timeSeriesData.dates.length, allTimeNet]);

    const smartAlerts = useMemo(() => {
        let list = [];
        if (totalRev === 0 && totalExp > 0) {
            list.push({ type: 'danger', title: 'Chưa có dòng tiền vào', msg: 'Hệ thống nhận thấy bạn đang liên tục ghi nhận chi phí mà chưa có khoản thu nào trong kỳ. Hãy chú ý kiểm soát dòng tiền trôi ra nhé!'});
        } else if (totalExp > totalRev && totalRev > 0) {
            list.push({ type: 'danger', title: 'Báo động thâm hụt', msg: `Bạn đang chi tiêu vượt mức thu nhập ${formatMoney(totalExp - totalRev)}. AI gợi ý: Hãy đóng băng ngay các khoản mua sắm không thực sự thiết yếu.` });
        } else if (totalRev > 0) {
            if (savingsRate >= 50) {
                list.push({ type: 'success', title: 'Tích lũy xuất sắc', msg: `Tỷ lệ tiết kiệm đạt ${savingsRate}%. Một con số tuyệt vời! Hãy cân nhắc luân chuyển số tiền dư này vào các kênh đầu tư sinh lời thay vì để tiền ngủ yên.` });
            } else if (savingsRate >= 20) {
                list.push({ type: 'success', title: 'Tài chính ổn định', msg: `Bạn đang giữ lại được ${savingsRate}% thu nhập. Đây là mức lý tưởng chuẩn theo nguyên tắc tài chính 50/30/20 quốc tế.` });
            } else {
                list.push({ type: 'warning', title: 'Cảnh báo tiết kiệm thấp', msg: `Bạn chỉ đang tiết kiệm được ${savingsRate}% thu nhập (Dưới mức khuyến nghị 20%). Lời khuyên: Hãy rà soát lại các khoản chi phí sinh hoạt nhỏ lẻ.` });
            }
        }

        if (expTrend) {
            if (expTrend.val > 20) {
                list.push({ type: 'warning', title: 'Tốc độ tiêu tiền tăng', msg: `Mức chi tiêu đang tăng đột biến ${expTrend.text} so với kỳ trước. AI khuyên bạn nên xem lại báo cáo "Top Đốt Tiền" bên trái để tìm ra thủ phạm.` });
            } else if (expTrend.val < -10) {
                list.push({ type: 'info', title: 'Kiểm soát tốt', msg: `Chi tiêu đã ${expTrend.text} so với kỳ trước. Bạn đang làm rất tốt việc thắt chặt hầu bao!` });
            }
        }

        if (topExpenseCategories.length > 0) {
            const topCat = topExpenseCategories[0];
            if (topCat.percent > 40) {
                let advice = 'Hãy thiết lập một hạn mức ngân sách nghiêm ngặt cho hạng mục này.';
                const name = topCat.name.toLowerCase();
                if (name.includes('ăn') || name.includes('uống') || name.includes('cafe')) advice = 'Có vẻ bạn đang ăn ngoài khá nhiều. Việc tự nấu ăn hoặc pha cafe tại nhà có thể giúp bạn tiết kiệm một khoản khổng lồ!';
                if (name.includes('mua sắm') || name.includes('quần áo') || name.includes('shopee')) advice = 'Hãy áp dụng "Quy tắc 24h" (chờ 1 ngày trước khi bấm thanh toán) để tránh mua sắm bốc đồng nhé.';
                if (name.includes('giải trí') || name.includes('chơi')) advice = 'Có thể bạn đang dành quá nhiều ngân sách cho việc giải trí. Hãy cân đối lại để không ảnh hưởng đến quỹ dự phòng.';
                list.push({ type: 'info', title: 'Phân tích hành vi', msg: `Danh mục "${topCat.name}" đang "ngốn" tới ${topCat.percent}% túi tiền của bạn. ${advice}` });
            }
        }

        if (list.length === 0 && totalRev === 0 && totalExp === 0) {
            list.push({ type: 'info', title: 'Xin chào!', msg: 'Trợ lý AI chưa có đủ dữ liệu giao dịch trong kỳ này để tiến hành phân tích. Hãy ghi nhận thêm doanh thu hoặc chi phí nhé!'});
        }
        return list;
    }, [totalRev, totalExp, savingsRate, expTrend, topExpenseCategories, formatMoney]);

    const advancedSmartAlerts = useMemo(() => {
        let alerts = [...smartAlerts];
        if (anomalyData.length > 0) {
            const anom = anomalyData[0];
            alerts.unshift({ type: 'danger', title: 'Phát hiện Bất thường (Z-Score)', msg: `Thuật toán phát hiện khoản chi tiêu <strong>${formatMoney(anom.value)}</strong> vào ngày ${anom.date} vượt ngưỡng phương sai. Hãy rà soát lại biến động này.` });
        }
        if (advancedTrend.status === 'tăng') {
            alerts.push({ type: 'warning', title: 'Cảnh báo Xu hướng (Linear Reg)', msg: `Đường hồi quy tuyến tính cho thấy quỹ đạo chi tiêu của bạn đang <strong>đi lên</strong>. Cần cắt giảm ở nửa sau của kỳ báo cáo.`});
        }
        const paretoCats = topExpenseCategories.filter(c => c.isPareto);
        if (paretoCats.length > 0) {
            alerts.push({ type: 'info', title: 'Quy tắc Pareto (80/20)', msg: `Danh mục <strong>${paretoCats.map(c=>c.name).join(', ')}</strong> đang là "hố đen" hút tiền. Quản lý chặt nhóm này, bạn sẽ giải quyết được 80% vấn đề tài chính.`});
        }
        return alerts;
    }, [smartAlerts, anomalyData, advancedTrend, topExpenseCategories, formatMoney]);

    // DỮ LIỆU BIỂU ĐỒ
    const hasRevenueData = useMemo(() => filteredRevenues.length > 0, [filteredRevenues]);
    const hasExpenseData = useMemo(() => filteredExpenses.length > 0, [filteredExpenses]);

    const revenueChartData = useMemo(() => {
        const totals = {};
        filteredRevenues.forEach(item => {
            const catName = item.category || 'Khác';
            totals[catName] = (totals[catName] || 0) + (item.amount || 0);
        });
        return {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: 'rgba(52, 199, 89, 0.85)',
                hoverBackgroundColor: '#34C759',
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 36
            }]
        };
    }, [filteredRevenues]);

    const expenseChartData = useMemo(() => {
        const totals = {};
        filteredExpenses.forEach(item => {
            const catName = item.category || 'Khác';
            totals[catName] = (totals[catName] || 0) + (item.amount || 0);
        });
        return {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals),
                backgroundColor: appleColors.slice(0, Object.keys(totals).length),
                hoverOffset: 12, borderWidth: 0
            }]
        };
    }, [filteredExpenses]);

    const hasForecastDataBool = useMemo(() => {
        return forecastData && forecastData.historicalData && Object.keys(forecastData.historicalData).length > 1;
    }, [forecastData]);

    const lineChartData = useMemo(() => {
        if (!hasForecastDataBool) return { labels: [], datasets: [] };

        const history = forecastData.historicalData;
        const predicted = hwForecastResult ? hwForecastResult.predicted : forecastData.predictedAmount;

        const labels = Object.keys(history).map(k => k.substring(5,7) + '/' + k.substring(0,4));
        const dataPoints = Object.values(history);
        labels.push("Dự báo");

        const realData = [...dataPoints, null];
        const predData = new Array(dataPoints.length - 1).fill(null);
        predData.push(dataPoints[dataPoints.length - 1]);
        predData.push(predicted);

        const ciMaxData = new Array(dataPoints.length - 1).fill(null);
        const ciMinData = new Array(dataPoints.length - 1).fill(null);

        if (hwForecastResult) {
            ciMaxData.push(dataPoints[dataPoints.length - 1]);
            ciMaxData.push(hwForecastResult.max);
            ciMinData.push(dataPoints[dataPoints.length - 1]);
            ciMinData.push(hwForecastResult.min);
        }

        return {
            labels: labels,
            datasets: [
                { label: 'Max Dự Báo (+CI)', data: ciMaxData, borderColor: 'transparent', backgroundColor: 'rgba(255, 149, 0, 0.1)', fill: '+1', pointRadius: 0, tension: 0.3 },
                { label: 'Min Dự Báo (-CI)', data: ciMinData, borderColor: 'transparent', backgroundColor: 'transparent', fill: false, pointRadius: 0, tension: 0.3 },
                { label: 'Thực tế', data: realData, borderColor: '#007AFF', backgroundColor: '#007AFF', borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, tension: 0.3 },
                { label: 'AI Dự báo', data: predData, borderColor: '#FF9500', backgroundColor: '#FF9500', borderWidth: 3, borderDash: [5, 5], pointRadius: [0, 6], pointStyle: 'rectRot', tension: 0.3 }
            ]
        };
    }, [forecastData, hwForecastResult, hasForecastDataBool]);

    return (
        <div className="space-y-10 relative z-10 apple-container pb-safe">

            {/* SECTION 1: TỔNG QUAN ALL-TIME */}
            <section>
                <div className="apple-glass p-6 sm:p-8 !rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-[12px] font-black text-[var(--label-secondary)] uppercase tracking-widest mb-6">Tổng quan Toàn thời gian</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:divide-x divide-[var(--separator)] pb-8 mb-8 border-b border-[var(--separator)]">
                        <div>
                            <p className="text-[13px] font-semibold text-[var(--label-secondary)] mb-1.5">Tổng tiền đã THU</p>
                            <h2 className="text-2xl lg:text-3xl font-black text-[var(--system-green)] tabular-nums tracking-tight">+ {formatMoney(allTimeRev)}</h2>
                        </div>
                        <div className="md:pl-6">
                            <p className="text-[13px] font-semibold text-[var(--label-secondary)] mb-1.5">Tổng tiền đã CHI</p>
                            <h2 className="text-2xl lg:text-3xl font-black text-[var(--system-red)] tabular-nums tracking-tight">- {formatMoney(allTimeExp)}</h2>
                        </div>
                        <div className="md:pl-6">
                            <p className="text-[13px] font-semibold text-[var(--label-secondary)] mb-1.5">Trung bình chi</p>
                            <div className="flex items-baseline gap-1.5">
                                <h2 className="text-2xl lg:text-3xl font-black text-[var(--system-red)] opacity-90 tabular-nums tracking-tight">{formatMoney(allTimeAvgDailyExp)}</h2>
                                <span className="text-[10px] mb-1 font-bold text-[var(--label-secondary)] uppercase">/ Ngày</span>
                            </div>
                        </div>
                        <div className="md:pl-6">
                            <p className="text-[13px] font-semibold text-[var(--label-secondary)] mb-1.5">Tỷ lệ tích lũy</p>
                            <div className="flex items-baseline gap-1.5">
                                <h2 className={`text-2xl lg:text-3xl font-black tabular-nums tracking-tight ${allTimeSavingsRate >= 0 ? 'text-[var(--system-blue)]' : 'text-[#FF9500]'}`}>{allTimeSavingsRate}%</h2>
                                <span className="text-[10px] mb-1 font-bold text-[var(--label-secondary)] uppercase">/ Thu</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x divide-[var(--separator)]">
                        <div className="flex justify-between items-center pr-0 md:pr-6">
                            <div>
                                <p className="text-[11px] font-bold text-[var(--system-blue)] uppercase tracking-wider">Điểm Hành Vi Tài Chính</p>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-3xl font-black text-[var(--label-primary)] tabular-nums tracking-tight">{financialScoreData.score}</h3>
                                    <span className={`text-[13px] mb-1.5 font-bold ${financialScoreData.color}`}>{financialScoreData.rating}</span>
                                </div>
                            </div>
                            <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg bg-[var(--bg-elevated)] shadow-inner ${financialScoreData.borderColor}`}>
                                {financialScoreData.score}
                            </div>
                        </div>

                        <div className="flex justify-between items-center md:pl-6">
                            <div>
                                <p className="text-[11px] font-bold text-[var(--system-red)] uppercase tracking-wider">Burn Rate (Tốc Độ Đốt Tiền)</p>
                                <div className="flex flex-col mt-1">
                                    <h3 className="text-2xl font-black text-[var(--label-primary)] tabular-nums tracking-tight">{formatMoney(burnRateData.dailyBurn)} <span className="text-sm font-semibold text-[var(--label-secondary)]">/ ngày</span></h3>
                                    {burnRateData.daysLeft > 0 ? (
                                        <span className="text-[13px] font-medium text-[var(--label-secondary)] mt-1">Dự kiến cạn quỹ sau: <strong className="text-[var(--system-red)]">{burnRateData.daysLeft} ngày</strong></span>
                                    ) : (
                                        <span className="text-[13px] font-medium text-[var(--system-red)] mt-1">Đã âm quỹ / Không có số dư</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* SECTION 2: BÁO CÁO KỲ */}
            <section>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <h2 className="text-[20px] font-black tracking-tight text-[var(--label-primary)] flex items-center gap-2">Báo Cáo Chi Tiết</h2>
                        <div className="flex p-1 space-x-1 apple-glass w-fit mx-auto sm:mx-0">
                            <button onClick={() => setReportMode('DAY')} className={`px-5 py-1.5 text-[12px] font-semibold rounded-lg transition-all outline-none ${reportMode === 'DAY' ? 'bg-[var(--bg-elevated)] shadow-sm text-[var(--label-primary)] font-bold' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}>Theo Ngày</button>
                            <button onClick={() => setReportMode('MONTH')} className={`px-5 py-1.5 text-[12px] font-semibold rounded-lg transition-all outline-none ${reportMode === 'MONTH' ? 'bg-[var(--bg-elevated)] shadow-sm text-[var(--label-primary)] font-bold' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}>Theo Tháng</button>
                            <button onClick={() => setReportMode('YEAR')} className={`px-5 py-1.5 text-[12px] font-semibold rounded-lg transition-all outline-none ${reportMode === 'YEAR' ? 'bg-[var(--bg-elevated)] shadow-sm text-[var(--label-primary)] font-bold' : 'text-[var(--label-secondary)] hover:text-[var(--label-primary)]'}`}>Theo Năm</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto z-40">
                        {reportMode === 'DAY' && <div className="w-full lg:w-[160px]"><AppleDatePicker value={selectedDate} onChange={setSelectedDate} /></div>}
                        {reportMode === 'MONTH' && <div className="w-full lg:w-[150px]"><AppleSelect value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} /></div>}
                        {reportMode === 'YEAR' && <div className="w-full lg:w-[120px]"><AppleSelect value={selectedYear} onChange={setSelectedYear} options={yearOptions} /></div>}
                    </div>
                </div>

                <div className="apple-glass p-6 sm:p-8 !rounded-[24px] shadow-sm">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-[var(--separator)]">
                        <div className="pt-4 lg:pt-0 lg:pl-6 first:pt-0 first:pl-0">
                            <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--system-green)]"></span> Doanh Thu</p>
                            <h3 className="text-xl font-black text-[var(--label-primary)] tabular-nums tracking-tight">{formatMoney(totalRev)}</h3>
                        </div>
                        <div className="pt-4 lg:pt-0 lg:pl-6">
                            <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--system-red)]"></span> Chi Phí</p>
                            <h3 className="text-xl font-black text-[var(--label-primary)] tabular-nums tracking-tight">{formatMoney(totalExp)}</h3>
                            {expTrend && (
                                <p className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${expTrend.isBad ? 'text-[var(--system-red)]' : 'text-[var(--system-green)]'}`}>
                                    <svg className="sf-icon sf-icon-bold w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={expTrend.isBad ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l7 7m7 7V3'}></path></svg>
                                    {expTrend.text} so với kỳ trước
                                </p>
                            )}
                        </div>
                        <div className="pt-4 lg:pt-0 lg:pl-6">
                            <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${netProfit >= 0 ? 'bg-[var(--system-blue)]' : 'bg-[#FF9500]'}`}></span> Lợi Nhuận</p>
                            <h3 className={`text-xl font-black tabular-nums tracking-tight ${netProfit >= 0 ? 'text-[var(--system-blue)]' : 'text-[#FF9500]'}`}>{formatMoney(netProfit)}</h3>
                        </div>
                        <div className="pt-4 lg:pt-0 lg:pl-6">
                            <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Tỷ Suất LN</p>
                            <div className="flex items-end gap-1"><h3 className="text-xl font-black tabular-nums tracking-tight">{profitMargin}%</h3><span className="text-[10px] mb-1 text-[var(--label-secondary)] uppercase tracking-wider">/ Thu</span></div>
                        </div>
                        <div className="pt-4 lg:pt-0 lg:pl-6">
                            <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-1.5">Tỷ Lệ Chi</p>
                            <div className="flex items-end gap-1"><h3 className="text-xl font-black tabular-nums tracking-tight">{expenseRatio}%</h3><span className="text-[10px] mb-1 text-[var(--label-secondary)] uppercase tracking-wider">/ Thu</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3: FORECAST & ALERTS */}
            <section className="space-y-6">
                <div className="apple-glass p-6 sm:p-8 !rounded-[24px] border border-[var(--system-blue)]/20 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-[18px] font-black text-[var(--label-primary)] tracking-tight flex items-center gap-2">
                                <svg className="sf-icon sf-icon-bold w-5 h-5 text-[var(--system-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                AI Dự Báo Xu Hướng (Holt-Winters)
                            </h3>
                        </div>
                        {hwForecastResult ? (
                            <div className="text-right">
                                <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-0.5">Dự kiến chi kỳ tới</p>
                                <h4 className="text-2xl font-black text-[var(--system-blue)] tabular-nums tracking-tight">~ {formatMoney(hwForecastResult.predicted)}</h4>
                                <p className="caption">Biên độ dao động: ±{formatMoney(hwForecastResult.interval)}</p>
                            </div>
                        ) : (forecastData && forecastData.predictedAmount ? (
                            <div>
                                <p className="text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-0.5">Dự kiến chi tháng tới</p>
                                <h4 className="text-2xl font-black text-[var(--system-blue)] tabular-nums tracking-tight">~ {formatMoney(forecastData.predictedAmount)}</h4>
                            </div>
                        ) : null)}
                    </div>

                    <div className="relative min-h-[300px] w-full z-10">
                        {isForecasting ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-[var(--system-blue)] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (hasForecastDataBool || hwForecastResult) ? (
                            <Line data={lineChartData} options={lineChartOptions} />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--label-secondary)]">
                                <svg className="sf-icon sf-icon-regular w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                <span className="text-[13px] font-medium">Cần tối thiểu 2 tháng dữ liệu để AI phân tích xu hướng.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 apple-glass p-6 !rounded-[24px] flex flex-col shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-[16px] font-black text-[var(--label-primary)] tracking-tight">Top "Đốt Tiền" (Pareto)</h3>
                        </div>
                        {topExpenseCategories.length > 0 ? (
                            <div className="space-y-5 flex-1">
                                {topExpenseCategories.map((cat, idx) => (
                                    <div key={cat.name} className="relative group">
                                        <div className="flex justify-between text-[13px] font-bold mb-1.5">
                                            <span className="text-[var(--label-primary)] truncate pr-2">#{idx + 1} {cat.name} {cat.isPareto && <span className="text-[9px] ml-1 bg-[var(--system-red)] text-white px-1.5 py-0.5 rounded-sm relative -top-0.5">80/20</span>}</span>
                                            <span className="text-[var(--system-red)] tabular-nums tracking-tight shrink-0">{formatMoney(cat.amount)}</span>
                                        </div>
                                        <div className="w-full bg-[var(--bg-elevated-secondary)] rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-[var(--system-red)] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${cat.percent}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[13px] text-[var(--label-secondary)] font-medium flex-1 flex items-center justify-center">Chưa có chi phí.</div>
                        )}
                    </div>

                    <div className="lg:col-span-2 apple-glass p-6 sm:p-8 !rounded-[24px] relative shadow-sm">
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div>
                                <h3 className="text-[18px] font-black text-[var(--label-primary)] tracking-tight flex items-center gap-2">
                                    Trợ lý Lời Khuyên
                                    <span className="flex h-2.5 w-2.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--system-blue)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--system-blue)]"></span>
                                    </span>
                                </h3>
                                <p className="text-[12px] text-[var(--label-secondary)] font-medium mt-0.5">Dựa trên logic tài chính thực tế & Thống kê Z-Score</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {advancedSmartAlerts.map((alert, i) => (
                                <div key={i} className={`p-4 sm:p-5 rounded-[16px] border-l-[4px] bg-[var(--bg-elevated)] border-r border-t border-b border-[var(--separator)] flex items-start gap-4 transition-all cursor-default shadow-sm ${
                                    alert.type === 'danger' ? 'border-l-[var(--system-red)]' :
                                        (alert.type === 'warning' ? 'border-l-[var(--system-orange)]' :
                                            (alert.type === 'info' ? 'border-l-[var(--system-blue)]' : 'border-l-[var(--system-green)]'))
                                }`}>
                                    <div className="mt-0.5 flex-shrink-0">
                                        {alert.type === 'danger' && <svg className="sf-icon sf-icon-bold w-6 h-6 text-[var(--system-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>}
                                        {alert.type === 'warning' && <svg className="sf-icon sf-icon-bold w-6 h-6 text-[#FF9500]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                                        {alert.type === 'info' && <svg className="sf-icon sf-icon-bold w-6 h-6 text-[var(--system-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>}
                                        {alert.type === 'success' && <svg className="sf-icon sf-icon-bold w-6 h-6 text-[var(--system-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>}
                                    </div>
                                    <div className="flex-1">
                                        <strong className={`block mb-1 text-[15px] font-black tracking-tight ${alert.type === 'danger' ? 'text-[var(--system-red)]' : (alert.type === 'warning' ? 'text-[#FF9500]' : (alert.type === 'info' ? 'text-[var(--system-blue)]' : 'text-[var(--system-green)]'))}`}>{alert.title}</strong>
                                        <span className="text-[var(--label-primary)] block leading-snug" dangerouslySetInnerHTML={{ __html: alert.msg }}></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: CHARTS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="apple-glass p-6 sm:p-8 !rounded-[24px] flex flex-col shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-[18px] font-black text-[var(--label-primary)] tracking-tight">Cơ cấu Doanh Thu</h3>
                        <p className="caption mt-1">Nguồn thu trong kỳ được chọn</p>
                    </div>
                    <div className="flex-1 relative min-h-[300px]">
                        {hasRevenueData ? (
                            <Bar data={revenueChartData} options={barChartOptions} />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--label-secondary)]">
                                <svg className="sf-icon sf-icon-regular w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M12 20V4"></path></svg>
                                <span className="caption">Không có khoản thu nào.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="apple-glass p-6 sm:p-8 !rounded-[24px] flex flex-col shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-[18px] font-black text-[var(--label-primary)] tracking-tight">Cơ cấu Chi Phí</h3>
                        <p className="caption mt-1">Phân bổ chi tiêu trong kỳ được chọn</p>
                    </div>
                    <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
                        {hasExpenseData ? (
                            <Doughnut data={expenseChartData} options={doughnutChartOptions} />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--label-secondary)]">
                                <svg className="sf-icon sf-icon-regular w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"></path></svg>
                                <span className="caption">Không phát sinh chi phí.</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

        </div>
    );
}