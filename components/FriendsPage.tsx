
import React, { useState, useMemo } from 'react';
import type { User, Invitation } from '../types';
import { UserPlus, Check, X, Search, Users, Mail } from 'lucide-react';
import Avatar from './Avatar';

interface FriendsPageProps {
    currentUser: User;
    users: User[];
    friends: User[];
    pendingInvitations: Invitation[];
    onSendInvitation: (toFriendId: string) => 'success' | 'not_found' | 'already_friend' | 'pending' | 'self';
    onUpdateInvitation: (invitationId: string, status: 'accepted' | 'declined') => void;
}

const FriendsPage: React.FC<FriendsPageProps> = ({ currentUser, users, friends, pendingInvitations, onSendInvitation, onUpdateInvitation }) => {
    const [activeTab, setActiveTab] = useState('friends');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchStatus, setSearchStatus] = useState<'idle' | 'success' | 'not_found' | 'already_friend' | 'pending' | 'self'>('idle');

    const getUserById = (id: string) => users.find(u => u.id === id);

    const incomingInvitations = useMemo(() => {
        return pendingInvitations.filter(inv => inv.toUserId === currentUser.id);
    }, [pendingInvitations, currentUser.id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        const result = onSendInvitation(searchTerm.trim());
        setSearchStatus(result);
        if (result === 'success') {
            setSearchTerm('');
        }
    };
    
    const getStatusMessage = () => {
        switch (searchStatus) {
            case 'success':
                return 'Convite enviado com sucesso!';
            case 'not_found':
                return 'Usuário não encontrado. Verifique o ID e tente novamente.';
            case 'already_friend':
                return 'Você já é amigo deste usuário.';
            case 'pending':
                return 'Já existe um convite pendente para este usuário.';
            case 'self':
                return 'Você não pode adicionar a si mesmo como amigo.';
            default:
                return '';
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'friends':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Meus Amigos ({friends.length})</h3>
                        {friends.length > 0 ? (
                            <div className="space-y-3">
                                {friends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between bg-white dark:bg-slate-800/50 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-transparent">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={friend} className="w-10 h-10"/>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{friend.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{friend.friendId}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Você ainda não tem amigos. Adicione um para começar!</p>
                        )}
                    </div>
                );
            case 'invitations':
                return (
                     <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Convites Pendentes ({incomingInvitations.length})</h3>
                        {incomingInvitations.length > 0 ? (
                            <div className="space-y-3">
                                {incomingInvitations.map(inv => {
                                    const fromUser = getUserById(inv.fromUserId);
                                    if (!fromUser) return null;
                                    return (
                                        <div key={inv.id} className="flex items-center justify-between bg-white dark:bg-slate-800/50 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-transparent">
                                            <div className="flex items-center gap-3">
                                                <Avatar user={fromUser} className="w-10 h-10"/>
                                                <p className="font-semibold text-gray-900 dark:text-white">{fromUser.name}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => onUpdateInvitation(inv.id, 'accepted')} className="p-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-500/40 transition-colors"><Check className="w-5 h-5"/></button>
                                                <button onClick={() => onUpdateInvitation(inv.id, 'declined')} className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-500/40 transition-colors"><X className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                             <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum convite pendente.</p>
                        )}
                    </div>
                );
            case 'add':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Adicionar Amigo</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Peça ao seu amigo o Friend ID dele para enviar um convite. O seu é: <strong className="text-teal-600 dark:text-teal-400 select-all">{currentUser.friendId}</strong></p>
                        <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSearchStatus('idle');
                                    }}
                                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Ex: NomeDeUsuario#1234"
                                />
                            </div>
                            <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                Enviar Convite
                            </button>
                        </form>
                         {searchStatus !== 'idle' && (
                            <div className={`text-sm p-3 rounded-md ${searchStatus === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
                                {getStatusMessage()}
                             </div>
                        )}
                    </div>
                );
        }
    };

    const tabButtonStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors w-full";
    const activeTabStyle = "bg-white dark:bg-slate-700 text-teal-600 dark:text-white shadow-sm";
    const inactiveTabStyle = "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800";

    return (
        <section className="bg-gray-100 dark:bg-slate-800/50 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-transparent transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Amigos</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-gray-200 dark:bg-slate-900/50 rounded-lg">
                <button onClick={() => setActiveTab('friends')} className={`${tabButtonStyle} ${activeTab === 'friends' ? activeTabStyle : inactiveTabStyle}`}>
                    <Users className="w-5 h-5"/> Meus Amigos
                </button>
                <button onClick={() => setActiveTab('invitations')} className={`${tabButtonStyle} ${activeTab === 'invitations' ? activeTabStyle : inactiveTabStyle} relative`}>
                    <Mail className="w-5 h-5"/> Convites
                    {incomingInvitations.length > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {incomingInvitations.length}
                        </span>
                    )}
                </button>
                <button onClick={() => setActiveTab('add')} className={`${tabButtonStyle} ${activeTab === 'add' ? activeTabStyle : inactiveTabStyle}`}>
                    <UserPlus className="w-5 h-5"/> Adicionar
                </button>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </section>
    );
};

export default FriendsPage;
