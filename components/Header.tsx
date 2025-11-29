
import React, { useState, useRef, useEffect } from 'react';
import { Bell, MoreVertical, Heart, Users, Home, Plane, Briefcase, Gift, PiggyBank, GraduationCap, Utensils, ShoppingCart, Dog, Dumbbell, Music, Gamepad2, Receipt, Car, Building, PartyPopper, Film, Cat, User as UserIcon, Menu } from 'lucide-react';
import Avatar from './Avatar';
import type { User, Notification } from '../types';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
    group: {
        id: string;
        name: string;
        icon: string;
        members: User[];
    };
    currentUser: User | null;
    onOpenSettings: () => void;
    showSettings?: boolean;
    notifications?: Notification[];
    onMarkNotificationAsRead?: (id: string) => void;
    onClearNotifications?: () => void;
    onNavigate?: (view: string) => void;
    onOpenMobileMenu?: () => void;
}

const iconMap: { [key: string]: React.ElementType } = {
    Heart: Heart,
    Users: Users,
    Home: Home,
    Plane: Plane,
    Briefcase: Briefcase,
    Gift: Gift,
    PiggyBank: PiggyBank,
    GraduationCap: GraduationCap,
    Utensils: Utensils,
    ShoppingCart: ShoppingCart,
    Dog: Dog,
    Dumbbell: Dumbbell,
    Music: Music,
    Gamepad2: Gamepad2,
    Receipt: Receipt,
    Car: Car,
    Building: Building,
    PartyPopper: PartyPopper,
    Film: Film,
    Cat: Cat,
    User: UserIcon
};

const iconColorMap: { [key: string]: string } = {
    Heart: 'text-red-500',
    Users: 'text-yellow-500',
    Home: 'text-green-500',
    Plane: 'text-blue-500',
    Briefcase: 'text-indigo-500',
    Gift: 'text-pink-500',
    PiggyBank: 'text-teal-500',
    GraduationCap: 'text-purple-500',
    Utensils: 'text-orange-500',
    ShoppingCart: 'text-sky-500',
    Dog: 'text-amber-600',
    Dumbbell: 'text-slate-400',
    Music: 'text-rose-500',
    Gamepad2: 'text-lime-500',
    Receipt: 'text-cyan-500',
    Car: 'text-gray-400',
    Building: 'text-fuchsia-500',
    PartyPopper: 'text-yellow-400',
    Film: 'text-neutral-400',
    Cat: 'text-orange-400',
    User: 'text-teal-600'
};

export const Header: React.FC<HeaderProps> = ({ 
    group, 
    currentUser,
    onOpenSettings, 
    showSettings = true,
    notifications = [],
    onMarkNotificationAsRead,
    onClearNotifications,
    onNavigate,
    onOpenMobileMenu
}) => {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    
    const Icon = iconMap[group.icon] || Users;
    const iconColor = iconColorMap[group.icon] || 'text-gray-400';
    const memberNames = group.members.map(m => m.name).join(', ');
    
    const unreadCount = notifications.filter(n => !n.read).length;

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notifRef]);

    return (
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-200 z-20 relative">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                {/* Mobile Menu Button */}
                <button 
                    onClick={onOpenMobileMenu}
                    className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="p-2 md:p-3 bg-gray-100 dark:bg-slate-800 rounded-full shadow-sm flex-shrink-0">
                     <Icon className={`w-6 h-6 md:w-8 md:h-8 ${iconColor}`} />
                </div>
                <div className="overflow-hidden">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">{group.name}</h2>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{memberNames}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                 <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative"
                    >
                        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-teal-500' : 'text-gray-400'}`}/>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                        )}
                    </button>
                    {isNotifOpen && (
                        <NotificationDropdown 
                            notifications={notifications}
                            onMarkAsRead={onMarkNotificationAsRead || (() => {})}
                            onClearAll={onClearNotifications || (() => {})}
                            onClose={() => setIsNotifOpen(false)}
                            onNavigate={onNavigate}
                        />
                    )}
                </div>

                 {showSettings && (
                    <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Gerenciar Grupo">
                        <MoreVertical className="w-6 h-6 text-gray-400"/>
                    </button>
                 )}
                {/* Display Current User Avatar */}
                {currentUser && <Avatar user={currentUser} className="w-8 h-8 md:w-10 md:h-10 ml-1"/>}
            </div>
        </header>
    );
};
