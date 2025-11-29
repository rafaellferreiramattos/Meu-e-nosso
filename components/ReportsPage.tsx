import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Transaction, User } from '../types';
import { BarChart2, Crown, Share2, FileDown, FileText, TrendingUp, Receipt, Hash, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { categoryColors, categoryIcons } from './TransactionHistory';
import Avatar from './Avatar';

interface ReportsPageProps {
    groupName: string;
    transactions: Transaction[];
    members: User[];
}

const categoryNameMap: { [key in Transaction['category']]: string } = {
    groceries: 'Mercado', dining: 'Restaurante', entertainment: 'Lazer', bills: 'Contas', transport: 'Transporte', health: 'Saúde', education: 'Educação', housing: 'Moradia', pets: 'Pets', gifts: 'Presentes', travel: 'Viagem', beauty: 'Beleza & Cuidados', other: 'Outros', transfer: 'Transferência'
};

const categoryChartColors: { [key in Transaction['category']]: string } = {
    groceries: '#60a5fa', dining: '#fb923c', entertainment: '#c084fc', bills: '#f87171', transport: '#4ade80', health: '#f472b6', education: '#818cf8', housing: '#2dd4bf', pets: '#facc15', gifts: '#fb7185', travel: '#38bdf8', beauty: '#e879f9', other: '#9ca3af', transfer: '#10b981'
};

interface KpiCardProps {
    icon: React.ElementType;
    title: string;
    value: string | number;
    colorClass: string;
    trend?: { value: number; isPositiveBad: boolean };
}

const KpiCard: React.FC<KpiCardProps> = ({ icon: Icon, title, value, colorClass, trend }) => {
    let trendColor = 'text-gray-500';
    let TrendIcon = null;

    if (trend) {
        if (trend.value > 0) {
            TrendIcon = ArrowUpRight;
            trendColor = trend.isPositiveBad ? 'text-red-500' : 'text-green-500';
        } else if (trend.value < 0) {
            TrendIcon = ArrowDownRight;
            trendColor = trend.isPositiveBad ? 'text-green-500' : 'text-red-500'; // Less expense is usually green
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg flex items-start gap-4 shadow-sm border border-gray-200 dark:border-transparent print-bg-transparent print-no-shadow print-border transition-colors">
            <div className={`p-3 rounded-lg bg-gray-100 dark:bg-slate-700/50 print-hidden`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 print-text-black">{title}</p>
                <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white print-text-black">{value}</p>
                    {trend && Math.abs(trend.value) > 0 && (
                        <div className={`flex items-center text-xs font-bold mb-1 ${trendColor} bg-gray-100 dark:bg-slate-900/50 px-1.5 py-0.5 rounded`}>
                            {TrendIcon && <TrendIcon className="w-3 h-3 mr-0.5" />}
                            {Math.abs(trend.value).toFixed(0)}%
                        </div>
                    )}
                </div>
                {trend && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">vs. mês anterior</p>
                )}
            </div>
        </div>
    );
};

const ReportsPage: React.FC<ReportsPageProps> = ({ groupName, transactions, members }) => {
    // Default to current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string } | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Logic
    const filterTransactions = (txs: Transaction[], start: string, end: string) => {
        if (!start && !end) return txs;
        const s = start ? new Date(`${start}T00:00:00`).getTime() : 0;
        const e = end ? new Date(`${end}T23:59:59`).getTime() : Infinity;
        return txs.filter(tx => {
            const txDate = new Date(tx.date).getTime();
            return txDate >= s && txDate <= e;
        });
    };

    const filteredTransactions = useMemo(() => filterTransactions(transactions, startDate, endDate), [transactions, startDate, endDate]);

    // Previous Period Logic (Simple approximation: subtract 30 days or same month last year logic)
    const previousTransactions = useMemo(() => {
        if (!startDate) return [];
        const currentStart = new Date(startDate);
        const currentEnd = new Date(endDate);
        const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day

        const prevEnd = new Date(currentStart);
        prevEnd.setDate(prevEnd.getDate() - 1);
        
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - diffDays + 1);

        return filterTransactions(
            transactions, 
            prevStart.toISOString().split('T')[0], 
            prevEnd.toISOString().split('T')[0]
        );
    }, [transactions, startDate, endDate]);

    const calculateTotal = (txs: Transaction[]) => txs.reduce((sum, tx) => sum + tx.amount, 0);

    // KPIs
    const totalExpenses = useMemo(() => calculateTotal(filteredTransactions), [filteredTransactions]);
    const prevTotalExpenses = useMemo(() => calculateTotal(previousTransactions), [previousTransactions]);
    
    const totalTrend = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;

    const totalTransactionsCount = filteredTransactions.length;
    const averageExpense = totalTransactionsCount > 0 ? totalExpenses / totalTransactionsCount : 0;

    const expensesByCategory = useMemo(() => {
        const categoryMap = new Map<Transaction['category'], number>();
        filteredTransactions.forEach(tx => {
            const currentAmount = categoryMap.get(tx.category) || 0;
            categoryMap.set(tx.category, currentAmount + tx.amount);
        });
        return Array.from(categoryMap.entries())
            .map(([category, amount]) => ({ category, amount, percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, totalExpenses]);

    const topCategory = useMemo(() => {
        if (expensesByCategory.length === 0) return { name: 'N/A', amount: 0 };
        const top = expensesByCategory[0];
        return { name: categoryNameMap[top.category], amount: top.amount };
    }, [expensesByCategory]);

    const expensesByMember = useMemo(() => {
        const memberMap = new Map<string, number>();
        filteredTransactions.forEach(tx => {
             tx.payers.forEach(payer => {
                const currentAmount = memberMap.get(payer.userId) || 0;
                memberMap.set(payer.userId, currentAmount + payer.amount);
            });
        });
        return Array.from(memberMap.entries())
            .map(([userId, amount]) => ({ user: members.find(m => m.id === userId), amount }))
            .filter(item => item.user).sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, members]);

    
    // Top 5 Expensive Transactions
    const topExpenses = useMemo(() => {
        return [...filteredTransactions]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [filteredTransactions]);

    // Export Handlers
    const handleExportCSV = () => { 
        const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Pago Por'];
        const rows = filteredTransactions.map(tx => [
            new Date(tx.date).toLocaleDateString('pt-BR'),
            tx.description,
            categoryNameMap[tx.category],
            tx.amount.toFixed(2).replace('.', ','),
            tx.payers.map(p => members.find(m => m.id === p.userId)?.name).join(', ')
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(";") + "\n" 
            + rows.map(e => e.join(";")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_${groupName}_${startDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handlePrint = () => { setIsShareMenuOpen(false); window.print(); };

    // Components for Charts
    const DonutChart = () => {
        const size = 180; // Reduced size slightly for mobile fit
        const strokeWidth = 25;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        let cumulativePercentage = 0;

        if (expensesByCategory.length === 0) {
            return (
                 <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle cx={size/2} cy={size/2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
                     </svg>
                     <div className="absolute text-center pointer-events-none">
                        <p className="text-xs text-gray-500">Sem dados</p>
                    </div>
                 </div>
            )
        }

        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-100 dark:text-slate-700" />
                    {expensesByCategory.map(({ category, percentage }) => {
                        const dash = (percentage / 100) * circumference;
                        const offset = (cumulativePercentage / 100) * circumference;
                        cumulativePercentage += percentage;
                        const isHovered = hoveredSlice === category;
                        return (
                            <circle
                                key={category}
                                cx={size / 2} cy={size / 2} r={radius}
                                stroke={categoryChartColors[category]}
                                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                fill="transparent"
                                strokeDasharray={`${dash} ${circumference - dash}`}
                                strokeDashoffset={-offset}
                                onMouseEnter={() => setHoveredSlice(category)}
                                onMouseLeave={() => { setHoveredSlice(null); setTooltip(null); }}
                                className="transition-all duration-300 origin-center cursor-pointer"
                                style={{ filter: isHovered ? `drop-shadow(0 0 4px ${categoryChartColors[category]})` : 'none' }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute text-center pointer-events-none">
                     <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">R$ {totalExpenses > 1000 ? (totalExpenses/1000).toFixed(1) + 'k' : totalExpenses.toFixed(0)}</p>
                </div>
            </div>
        );
    };

    const reportContent = (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard 
                    icon={TrendingUp} 
                    title="Total Gasto" 
                    value={`R$ ${totalExpenses.toFixed(2).replace('.', ',')}`} 
                    colorClass="text-teal-500 dark:text-teal-400" 
                    trend={{ value: totalTrend, isPositiveBad: true }}
                />
                <KpiCard icon={Receipt} title="Total de Despesas" value={totalTransactionsCount} colorClass="text-blue-500 dark:text-blue-400" />
                <KpiCard icon={Hash} title="Gasto Médio" value={`R$ ${averageExpense.toFixed(2).replace('.', ',')}`} colorClass="text-purple-500 dark:text-purple-400" />
                <KpiCard icon={Crown} title="Maior Categoria" value={topCategory.name} colorClass="text-amber-500 dark:text-amber-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Detailed Category List */}
                    <section className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-transparent print-border">
                         <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Detalhamento por Categoria</h3>
                         <div className="space-y-3">
                            {expensesByCategory.map(({ category, percentage, amount }) => (
                                <div key={category} className="relative">
                                    <div className="flex items-center justify-between text-sm z-10 relative mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full bg-opacity-20 ${categoryColors[category].split(' ')[0].replace('text-', 'bg-')}`}>
                                                {React.cloneElement(categoryIcons[category] as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" })}
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-200 capitalize">{categoryNameMap[category]}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                             <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{percentage.toFixed(1)}%</span>
                                             <span className="font-bold text-gray-900 dark:text-white w-20 text-right">R$ {amount.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full" style={{ width: `${percentage}%`, backgroundColor: categoryChartColors[category] }}></div>
                                    </div>
                                </div>
                            ))}
                            {expensesByCategory.length === 0 && <p className="text-gray-500 text-sm text-center">Nenhuma despesa categorizada.</p>}
                        </div>
                    </section>
                </div>

                {/* Side Column: Donut & Top Expenses */}
                <div className="space-y-6">
                     {/* Donut */}
                     <section className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-transparent print-border flex flex-col items-center">
                        <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white self-start">Distribuição</h3>
                        <DonutChart />
                        {expensesByCategory.length > 0 && (
                            <div className="mt-6 text-center p-3 bg-teal-50 dark:bg-teal-900/10 rounded-lg border border-teal-100 dark:border-teal-900/30">
                                <p className="text-sm text-teal-800 dark:text-teal-300">
                                    <strong>{topCategory.name}</strong> representa a maior fatia dos gastos, consumindo <strong>{expensesByCategory[0]?.percentage.toFixed(0)}%</strong> do total.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Top 5 Expenses */}
                    <section className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-transparent print-border">
                         <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Top 5 Maiores Gastos
                         </h3>
                         <div className="space-y-3">
                             {topExpenses.map((tx, idx) => (
                                 <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                                     <div className="flex items-center gap-3 overflow-hidden">
                                         <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                         <div className="truncate">
                                             <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{tx.description}</p>
                                             <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                         </div>
                                     </div>
                                     <span className="text-sm font-bold text-red-500 dark:text-red-400 whitespace-nowrap">
                                         R$ {tx.amount.toFixed(0)}
                                     </span>
                                 </div>
                             ))}
                             {topExpenses.length === 0 && <p className="text-gray-500 text-sm text-center">Sem dados.</p>}
                         </div>
                    </section>

                    {/* Spending by Member (Compact) */}
                    <section className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-transparent print-border">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Quem gastou mais?</h3>
                         <div className="space-y-4">
                            {expensesByMember.map(({ user, amount }) => {
                               const maxAmount = expensesByMember[0].amount;
                               const widthPercentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                               return user && (
                                <div key={user.id} className="group">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                       <div className="flex items-center gap-2">
                                           <Avatar user={user} className="w-5 h-5 text-[10px]" />
                                           <span className="font-medium text-gray-700 dark:text-gray-300">{user.name.split(' ')[0]}</span>
                                       </div>
                                       <span className="font-semibold text-gray-900 dark:text-white">R$ {amount.toFixed(0)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                                        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${widthPercentage}%` }}></div>
                                    </div>
                                </div>
                               );
                            })}
                            {expensesByMember.length === 0 && <p className="text-gray-500 text-sm text-center">Sem dados.</p>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );

    return (
        <div id="reports-page-printable" className="space-y-6 pb-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 print-hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios Detalhados</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Entenda para onde está indo o dinheiro do grupo.</p>
                </div>
                <div className="relative" ref={shareMenuRef}>
                    <button onClick={() => setIsShareMenuOpen(prev => !prev)} className="flex items-center gap-2 py-2 px-4 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-transparent text-gray-700 dark:text-white rounded-lg font-semibold transition-colors shadow-sm text-sm">
                        <Share2 className="w-4 h-4" /> Compartilhar / Exportar
                    </button>
                    {isShareMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl z-10 overflow-hidden">
                           <button onClick={handleExportCSV} className="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300 text-sm"><FileDown className="w-4 h-4 text-teal-500" /><span>Exportar CSV (Excel)</span></button>
                           <button onClick={handlePrint} className="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300 text-sm"><FileText className="w-4 h-4 text-teal-500" /><span>Salvar como PDF</span></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-transparent print-hidden transition-colors">
                <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                    <div className="flex-1 w-full grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">De</label>
                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 mt-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Até</label>
                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 mt-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setStartDate(firstDayOfMonth);
                            setEndDate(lastDayOfMonth);
                        }} 
                        className="w-full md:w-auto py-2.5 px-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
                    >
                        Mês Atual
                    </button>
                </div>
            </div>
            
            {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-slate-800/50 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-transparent print-bg-transparent transition-colors">
                    <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
                        <BarChart2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h2 className="text-lg font-bold mb-1 text-gray-900 dark:text-white print-text-black">Sem dados neste período</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 print-text-black">Tente alterar as datas ou adicione novas despesas.</p>
                </div>
            ) : ( reportContent )}
        </div>
    );
};

export default ReportsPage;