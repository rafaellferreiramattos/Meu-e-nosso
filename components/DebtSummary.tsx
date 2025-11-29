
import React from 'react';
import type { Debt, User } from '../types';
import Avatar from './Avatar';
import { ArrowRight, QrCode } from 'lucide-react';

interface DebtSummaryProps {
    debts: Debt[];
    currentUser: User;
    onSettleDebt: (debt: Debt) => void;
}

const DebtSummary: React.FC<DebtSummaryProps> = ({ debts, currentUser, onSettleDebt }) => {
    return (
        <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Quem Deve a Quem</h2>
            <div className="space-y-3">
                {debts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-transparent transition-colors">
                        <p>Tudo certo por aqui! Ninguém deve a ninguém.</p>
                    </div>
                ) : (
                    debts.map((debt, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-transparent transition-colors gap-4 sm:gap-0">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar user={debt.from} className="w-10 h-10"/>
                                    <span className="font-semibold text-gray-900 dark:text-white">{debt.from.name}</span>
                                </div>
                                <div className="flex flex-col items-center text-center px-2">
                                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                        R$ {debt.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                    <ArrowRight className="text-gray-400 dark:text-gray-500 hidden sm:block"/>
                                    <span className="text-xs text-gray-400 sm:hidden">deve para</span>
                                </div>
                                 <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-900 dark:text-white sm:order-first">{debt.to.name}</span>
                                    <Avatar user={debt.to} className="w-10 h-10"/>
                                </div>
                            </div>
                            
                            {debt.from.id === currentUser.id && (
                                <button 
                                    onClick={() => onSettleDebt(debt)}
                                    className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-sm transition-all transform hover:scale-105 text-sm"
                                >
                                    <QrCode className="w-4 h-4" />
                                    Pagar com Pix
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default DebtSummary;