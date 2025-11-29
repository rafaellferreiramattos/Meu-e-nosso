
import React, { useState, useMemo, useEffect } from 'react';
import type { User, Transaction } from '../types';
import { X, Plus, Trash2, AlertCircle, Check } from 'lucide-react';

interface AddExpenseModalProps {
    group: { id: string, members: User[] };
    onClose: () => void;
    onAddExpense: (transaction: Omit<Transaction, 'id'>) => void;
}

type Payer = { userId: string; amount: string };

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ group, onClose, onAddExpense }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payers, setPayers] = useState<Payer[]>([{ userId: group.members[0]?.id || '', amount: '' }]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<Transaction['category']>('groceries');
    const [participantIds, setParticipantIds] = useState<Set<string>>(new Set(group.members.map(m => m.id)));
    const [isNotSplit, setIsNotSplit] = useState(false);
    
    const isPersonalGroup = group.members.length === 1;

    // Helper to parse Brazilian formatted numbers (e.g. 1.000,00 -> 1000.00)
    const parseCurrency = (value: string) => {
        if (!value) return 0;
        // Remove dots (thousands separators) and replace comma with dot
        const cleanValue = value.replace(/\./g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
    };

    const numericTotalAmount = useMemo(() => parseCurrency(amount), [amount]);

    // Auto-fill payer amount when total changes (if single payer)
    useEffect(() => {
        if (payers.length === 1) {
            setPayers(prev => [{ ...prev[0], amount: amount }]);
        }
    }, [amount, payers.length]);

    // Handle "Not Split" toggle
    useEffect(() => {
        if (isNotSplit) {
            const payerIds = payers.map(p => p.userId).filter(Boolean);
            setParticipantIds(new Set(payerIds));
        } else {
             setParticipantIds(new Set(group.members.map(m => m.id)));
        }
    }, [isNotSplit, payers, group.members]);

    const handleParticipantToggle = (memberId: string) => {
        if (isNotSplit) return;
        setParticipantIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                // Prevent deselecting everyone (at least one person must pay)
                if (newSet.size > 1) newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const handlePayerChange = (index: number, field: keyof Payer, value: string) => {
        const newPayers = [...payers];
        newPayers[index][field] = value;
        setPayers(newPayers);
    };

    const addPayer = () => {
        const availableMembers = group.members.filter(m => !payers.some(p => p.userId === m.id));
        if (availableMembers.length > 0) {
            setPayers([...payers, { userId: availableMembers[0].id, amount: '' }]);
        }
    };

    const removePayer = (index: number) => {
        if (payers.length > 1) {
            setPayers(payers.filter((_, i) => i !== index));
        }
    };

    const totalPaid = useMemo(() => {
        return payers.reduce((sum, payer) => sum + parseCurrency(payer.amount), 0);
    }, [payers]);

    const remainingAmount = useMemo(() => {
        return numericTotalAmount - totalPaid;
    }, [numericTotalAmount, totalPaid]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!description || isNaN(numericTotalAmount) || numericTotalAmount <= 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const finalPayers = payers.map(p => ({
            userId: p.userId,
            amount: parseCurrency(p.amount)
        })).filter(p => p.amount > 0);

        if (finalPayers.length === 0) {
             alert('Defina quem pagou.');
             return;
        }
        
        // Check for overpayment (underpayment is allowed for partial, but warn?)
        // Using a small epsilon for float comparison safety
        if (remainingAmount < -0.01) {
            alert('O valor pago pelos membros excede o valor total da nota.');
            return;
        }

        // FIX: Force UTC Noon. This bypasses local timezone offset issues completely during creation.
        // It creates a string like "2025-11-25T12:00:00Z".
        const fixedDate = `${date}T12:00:00Z`;

        onAddExpense({
            description,
            amount: numericTotalAmount,
            payers: finalPayers,
            groupId: group.id,
            date: fixedDate,
            category,
            participantIds: Array.from(participantIds)
        });
    };

    const isPartial = remainingAmount > 0.01;
    const sharePerPerson = participantIds.size > 0 ? numericTotalAmount / participantIds.size : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isPersonalGroup ? 'Novo Gasto Pessoal' : 'Nova Despesa'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 flex-1">
                    <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="amount" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Valor Total (R$)</label>
                                <input
                                    type="text"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2.5 px-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                    placeholder="0,00"
                                    autoFocus
                                />
                            </div>
                             <div>
                                <label htmlFor="date" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data</label>
                                <input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2.5 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Descrição</label>
                            <input
                                type="text"
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                placeholder="Ex: Jantar no restaurante"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="category" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Categoria</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as Transaction['category'])}
                                className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="groceries">Mercado</option>
                                <option value="dining">Restaurante</option>
                                <option value="entertainment">Lazer</option>
                                <option value="housing">Moradia</option>
                                <option value="transport">Transporte</option>
                                <option value="bills">Contas</option>
                                <option value="travel">Viagem</option>
                                <option value="health">Saúde</option>
                                <option value="education">Educação</option>
                                <option value="pets">Pets</option>
                                <option value="other">Outros</option>
                            </select>
                        </div>

                        {/* Complex Payers Logic - HIDE for Personal Groups */}
                        {!isPersonalGroup && (
                            <div className="bg-gray-50 dark:bg-slate-900/40 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                 <div className="flex justify-between items-center mb-2">
                                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Quem Pagou?</label>
                                     <span className={`text-xs font-bold ${remainingAmount > 0.01 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
                                         Pago: R$ {totalPaid.toFixed(2).replace('.', ',')}
                                     </span>
                                 </div>
                                 {payers.map((payer, index) => (
                                     <div key={index} className="flex items-center gap-2 mb-2 last:mb-0">
                                        <select
                                            value={payer.userId}
                                            onChange={(e) => handlePayerChange(index, 'userId', e.target.value)}
                                            className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-1.5 px-2 text-sm text-gray-900 dark:text-white"
                                        >
                                            {group.members.map(member => (
                                                <option key={member.id} value={member.id} disabled={payers.some(p => p.userId === member.id && p.userId !== payer.userId)}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={payer.amount}
                                            onChange={(e) => handlePayerChange(index, 'amount', e.target.value)}
                                            className="w-24 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-1.5 px-2 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                                            placeholder="R$"
                                        />
                                        <button type="button" onClick={() => removePayer(index)} disabled={payers.length <= 1} className="text-gray-400 hover:text-red-500 disabled:opacity-30">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                     </div>
                                 ))}
                                 {group.members.length > payers.length && (
                                     <button type="button" onClick={addPayer} className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline mt-1 flex items-center gap-1">
                                         <Plus className="w-3 h-3"/> Adicionar Pagador
                                     </button>
                                 )}
                                 
                                 {Math.abs(remainingAmount) > 0.01 && !isNaN(numericTotalAmount) && (
                                    <div className={`flex items-center gap-2 text-xs p-2 mt-2 rounded ${remainingAmount > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        {remainingAmount > 0
                                            ? `Faltam R$ ${remainingAmount.toFixed(2)} (Parcial)`
                                            : `Valor excede o total em R$ ${Math.abs(remainingAmount).toFixed(2)}`
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Split Logic - HIDE for Personal Groups */}
                        {!isPersonalGroup && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Dividir Com</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="noSplit"
                                            checked={isNotSplit}
                                            onChange={(e) => setIsNotSplit(e.target.checked)}
                                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                                        />
                                        <label htmlFor="noSplit" className="text-xs text-gray-600 dark:text-gray-400 select-none">Não dividir (Pessoal)</label>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-2 gap-2 ${isNotSplit ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {group.members.map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => handleParticipantToggle(user.id)}
                                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                                participantIds.has(user.id) 
                                                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' 
                                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${participantIds.has(user.id) ? 'bg-teal-500 border-teal-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                                {participantIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-gray-200 truncate">{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                                {!isNotSplit && participantIds.size > 0 && numericTotalAmount > 0 && (
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                        ~ R$ {sharePerPerson.toFixed(2)} para cada selecionado
                                    </p>
                                )}
                            </div>
                        )}
                    </form>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0 mt-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Cancelar</button>
                    <button 
                        form="expense-form"
                        type="submit" 
                        className={`py-2 px-6 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-[1.02] ${isPartial ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'}`}
                        disabled={remainingAmount < -0.01}
                    >
                        {isPersonalGroup ? 'Salvar Gasto' : (isPartial ? 'Salvar Parcial' : 'Salvar Despesa')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseModal;
