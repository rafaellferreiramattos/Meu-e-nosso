
import React from 'react';
import type { Goal, Contribution } from '../types';
import { Plus, Target, Award } from 'lucide-react';

interface GoalsPageProps {
    goals: Goal[];
    contributions: Contribution[];
    onOpenAddGoalModal: () => void;
    onOpenAddContributionModal: (goal: Goal) => void;
    onViewGoalDetails: (goal: Goal) => void;
}

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, contributions, onOpenAddGoalModal, onOpenAddContributionModal, onViewGoalDetails }) => {
    
    const getGoalProgress = (goalId: string) => {
        const goalContributions = contributions.filter(c => c.goalId === goalId);
        const totalContributed = goalContributions.reduce((sum, c) => sum + c.amount, 0);
        return totalContributed;
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Metas do Grupo</h2>
                <button
                    onClick={onOpenAddGoalModal}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Criar Nova Meta
                </button>
            </div>

            {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => {
                        const totalContributed = getGoalProgress(goal.id);
                        const progressPercentage = Math.min((totalContributed / goal.targetAmount) * 100, 100);
                        const isCompleted = totalContributed >= goal.targetAmount;

                        return (
                            <button 
                                key={goal.id} 
                                onClick={() => onViewGoalDetails(goal)}
                                className={`bg-white dark:bg-slate-800/50 rounded-lg p-6 flex flex-col justify-between text-left transition-all duration-300 hover:ring-2 hover:ring-teal-500 shadow-sm border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 ${isCompleted ? 'ring-2 ring-amber-400' : ''}`}
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{goal.name}</h3>
                                        {isCompleted && (
                                            <div className="flex items-center gap-1 text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-1 rounded-full">
                                                <Award className="w-4 h-4" />
                                                <span>Atingida!</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                                        <div 
                                            className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-amber-400' : 'bg-teal-500 dark:bg-teal-400'}`}
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-baseline text-sm mb-4">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            <span className="font-bold text-gray-900 dark:text-white">R$ {totalContributed.toFixed(2).replace('.', ',')}</span> / R$ {goal.targetAmount.toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className={`font-semibold ${isCompleted ? 'text-amber-500 dark:text-amber-300' : 'text-teal-600 dark:text-teal-400'}`}>{progressPercentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent modal from opening
                                        onOpenAddContributionModal(goal);
                                    }}
                                    className="w-full mt-4 py-2 px-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-semibold transition-colors text-sm text-center text-gray-800 dark:text-white"
                                >
                                    Adicionar Contribuição
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-slate-800/50 rounded-lg p-12 mt-8 shadow-sm border border-gray-200 dark:border-transparent">
                    <Target className="w-16 h-16 text-teal-500 dark:text-teal-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Nenhuma meta criada</h2>
                    <p className="text-gray-500 dark:text-gray-400">Crie a primeira meta do grupo e comecem a economizar juntos!</p>
                </div>
            )}
        </section>
    );
};

export default GoalsPage;
