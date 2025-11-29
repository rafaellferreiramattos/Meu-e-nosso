
import React from 'react';
import type { Transaction, User } from '../types';
import { 
    ShoppingCart, 
    UtensilsCrossed, 
    Clapperboard, 
    FileText, 
    Bus, 
    Plus,
    HeartPulse,
    GraduationCap,
    Home,
    Dog,
    Gift,
    Plane,
    Sparkles,
    MoreHorizontal,
    Clock,
    ArrowRightLeft
} from 'lucide-react';
import Avatar from './Avatar';

interface TransactionHistoryProps {
    transactions: Transaction[];
    users: User[];
    onNewTransaction: () => void;
    onViewTransaction: (transaction: Transaction) => void;
}

export const categoryIcons: { [key in Transaction['category']]: React.ReactNode } = {
    groceries: <ShoppingCart className="w-6 h-6" />,
    dining: <UtensilsCrossed className="w-6 h-6" />,
    entertainment: <Clapperboard className="w-6 h-6" />,
    bills: <FileText className="w-6 h-6" />,
    transport: <Bus className="w-6 h-6" />,
    health: <HeartPulse className="w-6 h-6" />,
    education: <GraduationCap className="w-6 h-6" />,
    housing: <Home className="w-6 h-6" />,
    pets: <Dog className="w-6 h-6" />,
    gifts: <Gift className="w-6 h-6" />,
    travel: <Plane className="w-6 h-6" />,
    beauty: <Sparkles className="w-6 h-6" />,
    other: <MoreHorizontal className="w-6 h-6" />,
    transfer: <ArrowRightLeft className="w-6 h-6" />,
};

export const categoryColors: { [key in Transaction['category']]: string } = {
    groceries: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
    dining: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50',
    entertainment: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50',
    bills: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50',
    transport: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50',
    health: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/50',
    education: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50',
    housing: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50',
    pets: 'text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50',
    gifts: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50',
    travel: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50',
    beauty: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/50',
    other: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50',
    transfer: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50',
};


const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, users, onNewTransaction, onViewTransaction }) => {
    const getUserById = (id: string) => users.find(u => u.id === id);

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Despesas</h2>
                <button
                    onClick={onNewTransaction} 
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Nova Despesa
                </button>
            </div>
            <div className="space-y-3">
                {transactions.length > 0 ? (
                    transactions.map(tx => {
                        const payers = tx.payers.map(p => getUserById(p.userId)).filter(Boolean) as User[];
                        
                        const totalPaid = tx.payers.reduce((sum, p) => sum + p.amount, 0);
                        const isPartial = totalPaid < tx.amount - 0.01;

                        return (
                            <button 
                                key={tx.id}
                                onClick={() => onViewTransaction(tx)}
                                className={`w-full flex items-center p-4 bg-white dark:bg-slate-800/50 rounded-lg text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm border ${isPartial ? 'border-amber-400 dark:border-amber-500/50' : 'border-gray-200 dark:border-transparent'}`}
                            >
                                <div className={`p-3 rounded-full mr-4 relative ${categoryColors[tx.category]}`}>
                                    {categoryIcons[tx.category]}
                                    {isPartial && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-white dark:border-slate-800" title="Pagamento Parcial">
                                            <Clock className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900 dark:text-white">{tx.description}</p>
                                        {isPartial && <span className="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">Parcial</span>}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        Pago por
                                        <div className="flex items-center -space-x-2">
                                            {payers.slice(0, 3).map(p => <Avatar key={p.id} user={p} className="w-6 h-6 text-xs border-white dark:border-slate-900" />)}
                                            {payers.length > 3 && (
                                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-900 text-gray-700 dark:text-white">
                                                    +{payers.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                                        R$ {tx.amount.toFixed(2).replace('.', ',')}
                                    </p>
                                    {isPartial ? (
                                         <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pago: R$ {totalPaid.toFixed(0)}</p>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })
                ) : (
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-transparent">
                        <p>Nenhuma despesa registrada neste grupo ainda. Clique em "Nova Despesa" para começar!</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TransactionHistory;
