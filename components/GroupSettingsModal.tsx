
import React, { useState } from 'react';
import type { User, Group } from '../types';
import { X, Trash2, UserPlus } from 'lucide-react';
import Avatar from './Avatar';

interface GroupSettingsModalProps {
    group: Group & { members: User[] };
    allUsers: User[];
    friends: User[];
    currentUser: User;
    onClose: () => void;
    onUpdateMembers: (groupId: string, newMemberIds: string[]) => void;
    onDeleteGroup: (groupId: string) => void;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ group, allUsers, friends, currentUser, onClose, onUpdateMembers, onDeleteGroup }) => {
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set(group.memberIds));

    const handleMemberToggle = (memberId: string) => {
        if (memberId === currentUser.id && group.memberIds.includes(currentUser.id)) return; // Cannot deselect the current user if they are already a member
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                // Ensure there's at least one member left
                if (newSet.size > 1) {
                    newSet.delete(memberId);
                }
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const handleSaveChanges = () => {
        onUpdateMembers(group.id, Array.from(selectedMemberIds));
    };
    
    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"? Todas as despesas associadas serão perdidas. Esta ação é irreversível.`)) {
            onDeleteGroup(group.id);
        }
    };
    
    // Combine current members with friends for the selection list, removing duplicates
    const availableUsers = [
      ...group.members,
      ...friends.filter(f => !group.memberIds.includes(f.id))
    ];


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Grupo: {group.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* Members Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Membros</label>
                        <div className="space-y-2">
                           {availableUsers.map(user => (
                               <div key={user.id} onClick={() => handleMemberToggle(user.id)} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${user.id === currentUser.id && group.memberIds.includes(currentUser.id) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${selectedMemberIds.has(user.id) ? 'bg-teal-100 dark:bg-slate-700/80' : 'hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <Avatar user={user} className="w-8 h-8"/>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</span>
                                        {user.id === currentUser.id && <span className="text-xs text-teal-600 dark:text-teal-400">(Você)</span>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedMemberIds.has(user.id)}
                                        readOnly
                                        disabled={user.id === currentUser.id && group.memberIds.includes(currentUser.id)}
                                        className="h-5 w-5 rounded bg-gray-200 dark:bg-slate-600 border-gray-300 dark:border-slate-500 text-teal-600 dark:text-teal-500 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                                    />
                               </div>
                           ))}
                        </div>
                    </div>

                    {/* Delete Group Section */}
                    <div className="pt-4">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Excluir este grupo</p>
                                <p className="text-sm text-red-600 dark:text-red-300/80">Esta ação não pode ser desfeita.</p>
                            </div>
                            <button 
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Cancelar</button>
                    <button onClick={handleSaveChanges} className="py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsModal;
