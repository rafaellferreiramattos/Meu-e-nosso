
import React, { useState } from 'react';
import type { Revenue } from '../types';
import { X, DollarSign, Calendar, Tag } from 'lucide-react';

interface AddRevenueModalProps {
    onClose: () => void;
    onAddRevenue: (revenue: Omit<Revenue, 'id' | 'userId'>) => void;
}

const AddRevenueModal: React.FC<AddRevenueModalProps> = ({ onClose, onAddRevenue }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<Revenue['category']>('salary');
    const [received, setReceived] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Remove dots (thousands separators) and replace comma with dot
        const cleanAmount = amount.replace(/\./g, '').replace(',', '.');
        const numericAmount = parseFloat(cleanAmount);
        
        if (!description || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        // FIX: Force UTC Noon. This bypasses local timezone offset issues completely during creation.
        // It creates a string like "2025-11-25T12:00:00Z".
        const fixedDate = `${date}T12:00:00Z`;

        onAddRevenue({
            description,
            amount: numericAmount,
            date: fixedDate,
            category,
            received
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-500" />
                        Nova Receita
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                            placeholder="Ex: Salário, Freelance..."
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Valor (R$)</label>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                                placeholder="0,00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Prevista</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Categoria</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Revenue['category'])}
                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                        >
                            <option value="salary">Salário</option>
                            <option value="freelance">Freelance / Extra</option>
                            <option value="investment">Investimento</option>
                            <option value="gift">Presente</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer" onClick={() => setReceived(!received)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${received ? 'bg-green-500 border-green-500' : 'border-gray-400 dark:border-gray-500'}`}>
                            {received && <DollarSign className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                            Já recebido? (Entrou na conta)
                        </span>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Salvar Receita</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRevenueModal;
