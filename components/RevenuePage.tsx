import React from 'react';
import type { Revenue } from '../types';
import { Plus, TrendingUp, CheckCircle, Clock, Calendar } from 'lucide-react';

interface RevenuePageProps {
    revenues: Revenue[];
    onAddRevenueClick: () => void;
    onToggleReceived: (id: string) => void;
    onDeleteRevenue: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
    salary: 'Salário',
    freelance: 'Freelance',
    investment: 'Investimento',
    gift: 'Presente',
    other: 'Outros'
};

const RevenueCard: React.FC<{ 
    revenue: Revenue; 
    isForecast?: boolean;
    onToggleReceived: (id: string) => void;
    onDeleteRevenue: (id: string) => void;
}> = ({ revenue, isForecast, onToggleReceived, onDeleteRevenue }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg border mb-3 shadow-sm transition-all ${isForecast ? 'bg-white dark:bg-slate-800 border-l-4 border-l-amber-400 border-y-gray-100 border-r-gray-100 dark:border-y-slate-700 dark:border-r-slate-700' : 'bg-white dark:bg-slate-800 border-l-4 border-l-green-500 border-y-gray-100 border-r-gray-100 dark:border-y-slate-700 dark:border-r-slate-700'}`}>
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${isForecast ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                {isForecast ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{revenue.description}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{categoryLabels[revenue.category]}</span>
                    <span>•</span>
                    <span>{new Date(revenue.date).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className={`font-bold text-lg ${isForecast ? 'text-gray-600 dark:text-gray-300' : 'text-green-600 dark:text-green-400'}`}>
                R$ {revenue.amount.toFixed(2).replace('.', ',')}
            </p>
            <div className="flex justify-end gap-3 mt-1">
                <button 
                    onClick={() => onToggleReceived(revenue.id)}
                    className={`text-xs font-medium hover:underline ${isForecast ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                    {isForecast ? 'Marcar Recebido' : 'Marcar Pendente'}
                </button>
                <button 
                    onClick={() => {
                            if(confirm('Excluir esta receita?')) onDeleteRevenue(revenue.id);
                    }}
                    className="text-xs text-red-500 hover:underline"
                >
                    Excluir
                </button>
            </div>
        </div>
    </div>
);

const RevenuePage: React.FC<RevenuePageProps> = ({ revenues, onAddRevenueClick, onToggleReceived, onDeleteRevenue }) => {
    
    // Separate Forecast vs Received
    const receivedRevenues = revenues.filter(r => r.received).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const forecastRevenues = revenues.filter(r => !r.received).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalReceived = receivedRevenues.reduce((sum, r) => sum + r.amount, 0);
    const totalForecast = forecastRevenues.reduce((sum, r) => sum + r.amount, 0);

    return (
        <section className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Receitas & Previsões</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie suas entradas e planeje o futuro.</p>
                </div>
                <button
                    onClick={onAddRevenueClick}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Nova Receita
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg text-green-700 dark:text-green-200">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">Total Recebido</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">R$ {totalReceived.toFixed(2).replace('.', ',')}</p>
                    <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">Valor já em caixa</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-700 dark:text-amber-200">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-200">Previsão Futura</h3>
                    </div>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">R$ {totalForecast.toFixed(2).replace('.', ',')}</p>
                    <p className="text-sm text-amber-600/70 dark:text-amber-400/70 mt-1">A receber nos próximos dias/meses</p>
                </div>
            </div>

            <div className="space-y-8">
                {forecastRevenues.length > 0 && (
                    <div>
                         <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" /> Próximos Recebimentos
                        </h3>
                        {forecastRevenues.map(r => (
                            <RevenueCard 
                                key={r.id} 
                                revenue={r} 
                                isForecast 
                                onToggleReceived={onToggleReceived}
                                onDeleteRevenue={onDeleteRevenue}
                            />
                        ))}
                    </div>
                )}

                {receivedRevenues.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Histórico de Recebidos
                        </h3>
                        {receivedRevenues.map(r => (
                            <RevenueCard 
                                key={r.id} 
                                revenue={r} 
                                onToggleReceived={onToggleReceived}
                                onDeleteRevenue={onDeleteRevenue}
                            />
                        ))}
                    </div>
                )}

                {revenues.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma receita registrada.</p>
                        <button onClick={onAddRevenueClick} className="text-green-600 dark:text-green-400 font-semibold hover:underline mt-2">
                            Adicionar sua primeira receita
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default RevenuePage;