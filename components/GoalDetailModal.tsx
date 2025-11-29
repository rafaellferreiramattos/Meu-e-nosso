
import React, { useMemo } from 'react';
import type { Goal, Contribution, User } from '../types';
import { X, Award } from 'lucide-react';
import Avatar from './Avatar';

interface GoalDetailModalProps {
    goal: Goal;
    contributions: Contribution[];
    groupMembers: User[];
    onClose: () => void;
    onOpenAddContributionModal: () => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, contributions, groupMembers, onClose, onOpenAddContributionModal }) => {

    const totalContributed = useMemo(() => {
        return contributions.reduce((sum, c) => sum + c.amount, 0);
    }, [contributions]);

    const progressPercentage = Math.min((totalContributed / goal.targetAmount) * 100, 100);
    const isCompleted = totalContributed >= goal.targetAmount;

    const contributionsByUser = useMemo(() => {
        const summary = new Map<string, { user: User, total: number }>();
        groupMembers.forEach(member => {
            const memberContributions = contributions.filter(c => c.userId === member.id);
            if (memberContributions.length > 0) {
                const total = memberContributions.reduce((sum, c) => sum + c.amount, 0);
                const existing = summary.get(member.id);
                if (existing) {
                    existing.total += total;
                } else {
                    summary.set(member.id, { user: member, total });
                }
            }
        });
        return Array.from(summary.values()).sort((a, b) => b.total - a.total);
    }, [contributions, groupMembers]);
    
    const getUserById = (id: string) => groupMembers.find(u => u.id === id);


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl m-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{goal.name}</h2>
                        {isCompleted && (
                             <div className="flex items-center gap-1 text-sm font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-1 rounded-full w-fit mt-2">
                                <Award className="w-4 h-4" />
                                <span>Meta Atingida!</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6 flex-shrink-0">
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-amber-400' : 'bg-teal-500 dark:bg-teal-400'}`}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-baseline text-sm mt-2">
                        <span className="text-gray-600 dark:text-gray-300">
                            <span className="font-bold text-gray-900 dark:text-white">R$ {totalContributed.toFixed(2).replace('.', ',')}</span> / R$ {goal.targetAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className={`font-semibold ${isCompleted ? 'text-amber-500 dark:text-amber-300' : 'text-teal-600 dark:text-teal-400'}`}>{progressPercentage.toFixed(0)}%</span>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* Contributions Summary */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Resumo por Membro</h3>
                        <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-transparent">
                            {contributionsByUser.length > 0 ? contributionsByUser.map(({ user, total }) => (
                               <div key={user.id} className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={user} className="w-8 h-8"/>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">R$ {total.toFixed(2).replace('.', ',')}</span>
                               </div>
                           )) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center p-2">Nenhuma contribuição ainda.</p>}
                        </div>
                    </div>

                    {/* Contributions History */}
                    <div>
                         <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Histórico de Contribuições</h3>
                         <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-transparent">
                            {contributions.length > 0 ? [...contributions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => {
                                const user = getUserById(c.userId);
                                return user ? (
                                    <div key={c.id} className="flex items-center justify-between p-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={user} className="w-8 h-8"/>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(c.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">R$ {c.amount.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                ) : null;
                            }) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center p-2">Nenhuma contribuição ainda.</p>}
                         </div>
                    </div>
                </div>
                
                <div className="pt-6 flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Fechar</button>
                    {!isCompleted && (
                        <button 
                            onClick={() => {
                                onClose(); // Close this modal before opening the other
                                onOpenAddContributionModal();
                            }} 
                            className="py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                            Adicionar Contribuição
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoalDetailModal;
