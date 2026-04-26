// Chỉ cần export object này ra, không cần import thư viện nào cả
export const translations = {
    en: {
        menu: {
            dashboard: 'Dashboard',
            categories: 'Categories',
            revenue: 'Revenue',
            expense: 'Expenses',
            reports: 'Reports',
            calendar: 'Cashflow Calendar',
            debts: 'Debt Management',
            taxes: 'Taxes'
        },
        dashboard: {
            overview: 'Overview this month',
            recent: 'Recent transaction',
            addNew: '+ Add New',
            noData: 'No Data Available',
            noDataDesc: 'The feature interface is under construction.'
        }
        // ... các từ khác
    },
    vi: {
        menu: {
            dashboard: 'Tổng quan',
            categories: 'Danh mục tài chính',
            revenue: 'Doanh Thu',
            // ...
        }
    }
};