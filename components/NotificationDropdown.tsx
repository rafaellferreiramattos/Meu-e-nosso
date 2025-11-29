
import React from 'react';
import type { Notification } from '../types';
import { Bell, Check, Trash2, AlertCircle, Target, Wallet, Info, TrendingUp, UserPlus, AlertTriangle, Receipt, PiggyBank } from 'lucide-react';

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
    onClose: () => void;
    onNavigate?: (view: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkAsRead, onClearAll, onClose, onNavigate }) => {
    
    const handleItemClick = (notification: Notification) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (notification.actionLink && onNavigate) {
            onNavigate(notification.actionLink);
            onClose();
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'debt': return <Wallet className="w-5 h-5 text-red-500" />;
            case 'goal': return <Target className="w-5 h-5 text-teal-500" />;
            case 'revenue': return <TrendingUp className="w-5 h-5 text-green-500" />;
            case 'invitation': return <UserPlus className="w-5 h-5 text-purple-500" />;
            case 'alert': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'system': return <AlertCircle className="w-5 h-5 text-blue-500" />;
            case 'expense': return <Receipt className="w-5 h-5 text-orange-500" />;
            case 'contribution': return <PiggyBank className="w-5 h-5 text-teal-400" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950/50">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Notificações
                </h3>
                {notifications.length > 0 && (
                    <button 
                        onClick={onClearAll} 
                        className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" /> Limpar
                    </button>
                )}
            </div>
            
            <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <Bell className="w-12 h-12 mb-3 opacity-20" />
                        <p>Nenhuma notificação nova.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {notifications.slice().reverse().map(notif => (
                            <div 
                                key={notif.id} 
                                onClick={() => handleItemClick(notif)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 relative ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${!notif.read ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 pr-6">
                                    <h4 className={`text-sm font-semibold mb-0.5 ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {notif.message}
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                        {new Date(notif.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {!notif.read && (
                                    <div className="absolute top-4 right-4">
                                        <span className="block w-2 h-2 bg-teal-500 rounded-full"></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;