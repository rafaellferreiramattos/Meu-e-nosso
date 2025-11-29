
import React from 'react';
import type { Debt, Balance, User, Revenue } from '../types';
import DebtSummary from './DebtSummary';
import BalanceSummary from './BalanceSummary';
import { Wallet, TrendingUp, AlertCircle, PieChart } from 'lucide-react';

interface DashboardProps {
    debts: Debt[];
    balances: Balance[];
    currentUser: User;
    onSettleDebt: (debt: Debt) => void;
    isPersonal?: boolean;
    totalSpent?: number;
    revenues?: Revenue[];
}

export const Dashboard: React.FC<DashboardProps> = ({ debts, balances, currentUser, onSettleDebt, isPersonal = false, totalSpent = 0, revenues = [] }) => {
    const userBalance = balances.find(b => b.user.id === currentUser.id)?.amount || 0;
    const isPositive = userBalance > 0.01;
    const isNegative = userBalance < -0.01;

    if (isPersonal) {
        // Calculate Forecast for Personal Mode
        const receivedAmount = revenues.filter(r => r.received).reduce((sum, r) => sum + r.amount, 0);
        const forecastAmount = revenues.filter(r => !r.received).reduce((sum, r) => sum + r.amount, 0);
        const currentCash = receivedAmount - totalSpent;
        const projectedCash = currentCash + forecastAmount;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Financial Summary Card */}
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <PieChart className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resumo de Gastos</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total acumulado (Saídas)</p>
                            </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                 R$ {totalSpent?.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    </div>

                    {/* Revenue Forecast Card */}
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-transparent">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Previsão de Caixa</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Atual + Receitas Futuras</p>
                            </div>
                        </div>
                        
                         <div className="flex flex-col gap-1">
                            <span className={`text-3xl font-bold ${projectedCash >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                 R$ {projectedCash.toFixed(2).replace('.', ',')}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <span>Saldo Hoje: <strong>R$ {currentCash.toFixed(2)}</strong></span>
                                <span>+</span>
                                <span>A Receber: <strong>R$ {forecastAmount.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert/Insight */}
                {forecastAmount > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div>
                            <p className="text-blue-800 dark:text-blue-200 font-semibold">Previsão de Recebimentos</p>
                            <p className="text-blue-700 dark:text-blue-300">
                                Você tem <strong>R$ {forecastAmount.toFixed(2)}</strong> previstos para entrar. Se tudo se confirmar, seu saldo final será positivo!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Group Dashboard
    return (
        <div className="space-y-8">
             {/* User Financial Status Card */}
             <div className={`p-6 rounded-xl shadow-sm border transition-colors ${
                 isPositive 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                    : isNegative 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-slate-800/50 border-gray-200 dark:border-transparent'
             }`}>
                <div className="flex items-start justify-between flex-col md:flex-row gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                            isPositive ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-white' : 
                            isNegative ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-white' :
                            'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-white'
                        }`}>
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Seu Saldo Atual</h3>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-bold ${
                                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 
                                    isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {isPositive ? '+' : ''} R$ {userBalance.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {isPositive ? '(Crédito)' : isNegative ? '(Débito)' : '(Zerado)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Explainer Text */}
                <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-slate-700/50 text-sm">
                    {isPositive && (
                        <p className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Você tem crédito disponível. Despesas futuras (individuais ou do grupo) serão <strong>automaticamente descontadas</strong> deste valor antes de gerar novas dívidas.
                        </p>
                    )}
                    {isNegative && (
                        <p className="text-red-800 dark:text-red-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Você deve ao grupo. Faça pagamentos para regularizar sua situação.
                        </p>
                    )}
                    {!isPositive && !isNegative && (
                        <p className="text-gray-600 dark:text-gray-400">
                            Você está em dia! Nenhuma dívida e nenhum crédito pendente.
                        </p>
                    )}
                </div>
            </div>

            <BalanceSummary balances={balances} />
            <DebtSummary debts={debts} currentUser={currentUser} onSettleDebt={onSettleDebt} />
        </div>
    );
};
