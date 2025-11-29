
import React, { useState } from 'react';
import type { Goal, User, Contribution } from '../types';
import { X } from 'lucide-react';

interface AddContributionModalProps {
    goal: Goal;
    groupMembers: User[];
    onClose: () => void;
    onAddContribution: (contribution: Omit<Contribution, 'id'>) => void;
}

const AddContributionModal: React.FC<AddContributionModalProps> = ({ goal, groupMembers, onClose, onAddContribution }) => {
    const [userId, setUserId] = useState(groupMembers[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Remove dots (thousands separators) and replace comma with dot
        const cleanAmount = amount.replace(/\./g, '').replace(',', '.');
        const numericAmount = parseFloat(cleanAmount);

        if (!userId || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        // FIX: Force UTC Noon. This bypasses local timezone offset issues completely during creation.
        // It creates a string like "2025-11-25T12:00:00Z".
        const fixedDate = `${date}T12:00:00Z`;

        onAddContribution({
            goalId: goal.id,
            userId,
            amount: numericAmount,
            date: fixedDate,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Adicionar Contribuição</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">para "{goal.name}"</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="contribution-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quem está contribuindo?</label>
                        <select
                            id="contribution-user"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            {groupMembers.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contribution-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                            <input
                                type="text"
                                id="contribution-amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="500,00"
                            />
                        </div>
                         <div>
                            <label htmlFor="contribution-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                            <input
                                type="date"
                                id="contribution-date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">Salvar Contribuição</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContributionModal;
