
import React, { useState } from 'react';
import type { Goal } from '../types';
import { X } from 'lucide-react';

interface AddGoalModalProps {
    onClose: () => void;
    onAddGoal: (goal: Omit<Goal, 'id' | 'groupId'>) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAddGoal }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Remove dots (thousands separators) and replace comma with dot
        const cleanAmount = targetAmount.replace(/\./g, '').replace(',', '.');
        const numericAmount = parseFloat(cleanAmount);

        if (!name.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        onAddGoal({
            name,
            targetAmount: numericAmount,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Nova Meta</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Meta</label>
                        <input
                            type="text"
                            id="goal-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Viagem para o Chile"
                        />
                    </div>
                    <div>
                        <label htmlFor="goal-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Alvo (R$)</label>
                        <input
                            type="text"
                            id="goal-amount"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="8000,00"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">Salvar Meta</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGoalModal;
