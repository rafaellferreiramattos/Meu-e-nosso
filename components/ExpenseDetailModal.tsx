
import React, { useState, useMemo } from 'react';
import type { User, Transaction } from '../types';
import { X, Plus, CheckCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import Avatar from './Avatar';
import { categoryIcons, categoryColors } from './TransactionHistory';

interface ExpenseDetailModalProps {
    transaction: Transaction;
    group: { members: User[] };
    onClose: () => void;
    onUpdateTransaction?: (updatedTransaction: Transaction) => void;
    onDeleteTransaction?: (transactionId: string) => void;
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ transaction, group, onClose, onUpdateTransaction, onDeleteTransaction }) => {
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [newPaymentUser, setNewPaymentUser] = useState(group.members[0]?.id || '');
    const [newPaymentAmount, setNewPaymentAmount] = useState('');
    const [isViewingReceipt, setIsViewingReceipt] = useState(false);

    const getUserById = (id: string) => group.members.find(u => u.id === id);

    const payers = transaction.payers
        .map(p => ({ user: getUserById(p.userId), amount: p.amount }))
        .filter(p => p.user);

    const participants = transaction.participantIds
        .map(id => getUserById(id))
        .filter(Boolean) as User[];
        
    const totalPaid = transaction.payers.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = transaction.amount - totalPaid;
    const isFullyPaid = remainingAmount < 0.01;
    
    // Calculate split based on what was PAID, if incomplete, we show projected
    const sharePerPerson = transaction.amount / participants.length;
    const categoryName = Object.keys(categoryIcons).find(key => key === transaction.category) || 'groceries';

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Remove dots (thousands separators) and replace comma with dot
        const cleanAmount = newPaymentAmount.replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(cleanAmount);
        
        if (!amount || amount <= 0) {
            alert('Insira um valor válido.');
            return;
        }
        if (amount > remainingAmount + 0.01) {
             alert('O valor excede o restante a pagar.');
             return;
        }
        
        if (onUpdateTransaction) {
            // Check if user already paid something, if so update their entry, else add new
            const updatedPayers = [...transaction.payers];
            const existingPayerIndex = updatedPayers.findIndex(p => p.userId === newPaymentUser);
            
            if (existingPayerIndex >= 0) {
                updatedPayers[existingPayerIndex] = {
                    ...updatedPayers[existingPayerIndex],
                    amount: updatedPayers[existingPayerIndex].amount + amount
                };
            } else {
                updatedPayers.push({ userId: newPaymentUser, amount });
            }
            
            onUpdateTransaction({
                ...transaction,
                payers: updatedPayers
            });
        }
    };

    const handleDelete = () => {
        if (onDeleteTransaction) {
            if (window.confirm('Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.')) {
                onDeleteTransaction(transaction.id);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{transaction.category === 'transfer' ? 'Comprovante de Pagamento' : 'Detalhes da Despesa'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className={`flex items-center p-4 rounded-lg border ${isFullyPaid ? 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-transparent' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                        <div className={`p-4 rounded-full mr-4 ${categoryColors[transaction.category]}`}>
                            {categoryIcons[transaction.category]}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-xl text-gray-900 dark:text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{categoryName}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-2xl text-teal-600 dark:text-teal-400">R$ {transaction.amount.toFixed(2).replace('.', ',')}</p>
                            {!isFullyPaid && <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">Parcial</p>}
                            <p className="text-sm text-gray-500 dark:text-gray-500">{new Date(transaction.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    
                    {/* Receipt Section */}
                    {transaction.receiptUrl && (
                        <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <ImageIcon className="w-5 h-5 text-teal-500" />
                                    <span className="text-sm font-medium">Comprovante Anexado</span>
                                </div>
                                <button 
                                    onClick={() => setIsViewingReceipt(!isViewingReceipt)}
                                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                                >
                                    {isViewingReceipt ? 'Ocultar' : 'Visualizar'}
                                </button>
                            </div>
                            {isViewingReceipt && (
                                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                                    <img src={transaction.receiptUrl} alt="Comprovante" className="w-full h-auto max-h-64 object-contain bg-white dark:bg-black" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress Bar for Partial Payments */}
                    {!isFullyPaid && (
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Pago: <strong>R$ {totalPaid.toFixed(2).replace('.', ',')}</strong></span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">Restante: R$ {remainingAmount.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${(totalPaid / transaction.amount) * 100}%` }}></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Paid By Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Pagamentos Realizados</h3>
                             {!isFullyPaid && !isAddingPayment && onUpdateTransaction && (
                                 <button onClick={() => setIsAddingPayment(true)} className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1">
                                     <Plus className="w-4 h-4"/> Adicionar Pagamento
                                 </button>
                             )}
                        </div>
                        
                        {isAddingPayment && (
                            <form onSubmit={handleAddPayment} className="mb-4 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
                                <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Novo Pagamento</p>
                                <div className="flex gap-2 mb-2">
                                    <select
                                        value={newPaymentUser}
                                        onChange={(e) => setNewPaymentUser(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-1 px-2 text-sm text-gray-900 dark:text-white"
                                    >
                                        {group.members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="text"
                                        value={newPaymentAmount}
                                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                                        placeholder="Valor"
                                        className="w-24 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-1 px-2 text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAddingPayment(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
                                    <button type="submit" className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md">Confirmar</button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-transparent">
                            {payers.map(({ user, amount }, index) => user && (
                               <div key={index} className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={user} className="w-8 h-8"/>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">R$ {amount.toFixed(2).replace('.', ',')}</span>
                               </div>
                           ))}
                        </div>
                    </div>

                    {/* Split With Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Dividido com (Previsto)</h3>
                            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                                R$ {sharePerPerson.toFixed(2).replace('.', ',')} / pessoa
                            </span>
                        </div>
                         <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-md max-h-48 overflow-y-auto border border-gray-200 dark:border-transparent">
                            {participants.map(user => (
                               <div key={user.id} className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={user} className="w-8 h-8"/>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                               </div>
                           ))}
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-between items-center">
                         {onDeleteTransaction && (
                            <button 
                                onClick={handleDelete}
                                className="flex items-center gap-2 py-2 px-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg font-semibold transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="py-2 px-6 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetailModal;
