
import React, { useState } from 'react';
import type { Group } from '../types';
import { 
    Heart, 
    Users, 
    LogOut, 
    Settings, 
    LayoutDashboard, 
    Wallet, 
    Target, 
    BarChart2, 
    ChevronDown,
    PlusCircle,
    Home,
    Plane,
    Briefcase,
    Gift,
    PiggyBank,
    GraduationCap,
    Utensils,
    ShoppingCart,
    Dog,
    Dumbbell,
    Music,
    Gamepad2,
    Receipt,
    Car,
    Building,
    PartyPopper,
    Film,
    Cat,
    HeartHandshake,
    UsersRound,
    Sparkles,
    User as UserIcon,
    TrendingUp,
    HandCoins
} from 'lucide-react';

interface SidebarProps {
    groups: Group[];
    selectedGroupId: string;
    onSelectGroup: (id: string) => void;
    onOpenAddGroupModal: () => void;
    activeView: string;
    onSelectView: (view: string) => void;
    onOpenSettings: () => void;
    onLogout: () => void;
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

const menuIconMap: { [key: string]: React.ElementType } = {
    Dashboard: LayoutDashboard,
    Grupos: UsersRound,
    Despesas: Wallet,
    Receitas: TrendingUp,
    Metas: Target,
    Relatórios: BarChart2,
    Amigos: HeartHandshake,
    'Assistente IA': Sparkles,
};


export const Sidebar: React.FC<SidebarProps> = ({ groups, selectedGroupId, onSelectGroup, onOpenAddGroupModal, activeView, onSelectView, onOpenSettings, onLogout }) => {
    const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);

    const menuItems = ['Dashboard', 'Grupos', 'Despesas', 'Receitas', 'Metas', 'Relatórios', 'Amigos', 'Assistente IA'];

    const handleMenuClick = (name: string) => {
        if (name === 'Grupos') {
            setIsGroupsExpanded(!isGroupsExpanded);
        } else {
            onSelectView(name);
        }
    };

    return (
        <aside className="w-64 bg-white dark:bg-slate-950 p-4 flex-col justify-between hidden md:flex border-r border-gray-200 dark:border-slate-800 transition-colors duration-200">
            <div>
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-gradient-to-br from-teal-400 to-cyan-600 p-2 rounded-lg shadow-sm">
                        <HandCoins className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-wider text-gray-800 dark:text-white">MEU & NOSSO</h1>
                </div>
                
                <nav className="flex flex-col gap-2">
                    {menuItems.map((name) => {
                        const Icon = menuIconMap[name];
                        const isSelected = activeView === name;
                        const isAi = name === 'Assistente IA';

                        if (name === 'Grupos') {
                            return (
                                <div key={name}>
                                    <button
                                        onClick={() => handleMenuClick(name)}
                                        className="w-full flex items-center justify-between gap-3 p-2 rounded-lg text-left transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{name}</span>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isGroupsExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isGroupsExpanded && (
                                        <div className="pt-2 pl-4 flex flex-col gap-2 border-l-2 border-gray-200 dark:border-slate-800 ml-4 mt-2">
                                            {groups.map((group) => {
                                                const GroupIcon = iconMap[group.icon] || Users;
                                                const isGroupSelected = group.id === selectedGroupId;
                                                return (
                                                    <button
                                                        key={group.id}
                                                        onClick={() => onSelectGroup(group.id)}
                                                        className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 w-full ${
                                                            isGroupSelected ? 'bg-gray-100 dark:bg-slate-800/50 text-teal-600 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        <GroupIcon className={`w-5 h-5 ${isGroupSelected ? 'text-teal-500 dark:text-teal-400' : ''}`} />
                                                        <span className="font-medium text-sm">{group.name}</span>
                                                    </button>
                                                );
                                            })}
                                             <button
                                                onClick={onOpenAddGroupModal}
                                                className="flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                                <span className="font-medium text-sm">Novo Grupo</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <button
                                key={name}
                                onClick={() => handleMenuClick(name)}
                                className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 ${
                                    isSelected 
                                        ? 'bg-gray-100 dark:bg-slate-800/50 text-teal-600 dark:text-white' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-teal-500 dark:text-teal-400' : isAi ? 'text-purple-500' : ''}`} />
                                <span className={`font-medium ${isAi ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold' : ''}`}>{name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-slate-800 pt-4">
                 <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                 >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Configurações</span>
                </button>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-white"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair</span>
                </button>
            </div>
        </aside>
    );
};