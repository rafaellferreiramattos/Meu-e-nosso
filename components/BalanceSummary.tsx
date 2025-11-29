
import React from 'react';
import type { Balance } from '../types';
import Avatar from './Avatar';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BalanceSummaryProps {
    balances: Balance[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ balances }) => {
    return (
        <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Balanço Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balances.map(({ user, amount }) => {
                    const isCreditor = amount > 0.01;
                    const isDebtor = amount < -0.01;
                    const isSettled = !isCreditor && !isDebtor;

                    const amountColor = isCreditor ? 'text-green-600 dark:text-green-400' : isDebtor ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400';
                    const Icon = isCreditor ? TrendingUp : isDebtor ? TrendingDown : Minus;
                    const label = isCreditor ? 'Crédito / A receber' : isDebtor ? 'A pagar' : 'Em dia';
                    
                    return (
                        <div key={user.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-lg flex items-center justify-between shadow-sm border border-gray-200 dark:border-transparent transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar user={user} className="w-10 h-10"/>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                    <p className={`text-sm ${amountColor}`}>{label}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 font-bold text-lg ${amountColor}`}>
                                <Icon className="w-5 h-5"/>
                                <span>R$ {Math.abs(amount).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default BalanceSummary;
