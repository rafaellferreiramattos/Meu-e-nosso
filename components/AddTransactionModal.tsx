import React, { useState } from 'react';
import type { User, Transaction, Group } from '../types';
import { X } from 'lucide-react';

interface AddExpenseModalProps {
    group: { id: string, members: User[] };
    onClose: () => void;
    onAddExpense: (transaction: Omit<Transaction, 'id'>) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ group, onClose, onAddExpense }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidById, setPaidById] = useState(group.members[0]?.id || '');
    const [category, setCategory] = useState<Transaction['category']>('groceries');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount.replace(',', '.'));
        if (!description || isNaN(numericAmount) || numericAmount <= 0 || !paidById) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        onAddExpense({
            description,
            amount: numericAmount,
            payers: [{ userId: paidById, amount: numericAmount }],
            participantIds: group.members.map(m => m.id),
            groupId: group.id,
            date: new Date().toISOString(),
            category
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Nova Despesa</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Jantar no restaurante"
                        />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Valor (R$)</label>
                        <input
                            type="text"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="150,00"
                        />
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Transaction['category'])}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="groceries">Mercado</option>
                            <option value="dining">Restaurante</option>
                            <option value="entertainment">Lazer</option>
                            <option value="bills">Contas</option>
                            <option value="transport">Transporte</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="paidBy" className="block text-sm font-medium text-gray-300 mb-1">Pago por</label>
                        <select
                            id="paidBy"
                            value={paidById}
                            onChange={(e) => setPaidById(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            {group.members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;