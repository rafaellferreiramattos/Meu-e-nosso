
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
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Registro de Despesas</h2>
                <button
                    onClick={onNewTransaction}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden md:inline">Nova Despesa</span>
                    <span className="md:hidden">Nova</span>
                </button>
            </div>

            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-transparent">
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma despesa registrada neste grupo.</p>
                    </div>
                ) : (
                    transactions.map(transaction => {
                        const totalPaid = transaction.payers.reduce((sum, p) => sum + p.amount, 0);
                        const isPartial = totalPaid < transaction.amount - 0.01;

                        return (
                            <div 
                                key={transaction.id} 
                                onClick={() => onViewTransaction(transaction)}
                                className={`flex items-center justify-between p-3 md:p-4 rounded-lg bg-white dark:bg-slate-800/50 shadow-sm border cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${isPartial ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                    <div className={`p-2 md:p-3 rounded-full flex-shrink-0 ${categoryColors[transaction.category]}`}>
                                        {categoryIcons[transaction.category]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate text-sm md:text-base">{transaction.description}</p>
                                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                            <span className="truncate">{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                                            <span className="hidden md:inline">•</span>
                                            <div className="hidden md:flex items-center gap-1">
                                                {transaction.payers.map((payer, idx) => {
                                                    const user = getUserById(payer.userId);
                                                    return user ? (
                                                        <span key={idx} className="flex items-center gap-1">
                                                            {idx > 0 && ", "}
                                                            <Avatar user={user} className="w-4 h-4 text-[8px]" />
                                                            {user.name.split(' ')[0]}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm md:text-lg">R$ {transaction.amount.toFixed(2).replace('.', ',')}</p>
                                    {isPartial && (
                                        <span className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                            Parcial
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default TransactionHistory;
