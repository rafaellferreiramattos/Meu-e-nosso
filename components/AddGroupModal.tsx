
import React, { useState, useRef, useEffect } from 'react';
import type { User, Group } from '../types';
import { X, Heart, Users, Home, Plane, Briefcase, Gift, PiggyBank, GraduationCap, Utensils, ShoppingCart, Dog, Dumbbell, Music, Gamepad2, Receipt, Car, Building, PartyPopper, Film, Cat, ChevronDown } from 'lucide-react';
import Avatar from './Avatar';

interface AddGroupModalProps {
    availableMembers: User[];
    currentUser: User;
    onClose: () => void;
    onAddGroup: (group: Omit<Group, 'id' | 'members'>) => void;
}

const availableIcons = [
    { name: 'Users', component: Users, label: 'Grupo', color: 'text-yellow-500', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-500/10' },
    { name: 'Heart', component: Heart, label: 'Casal', color: 'text-red-500', borderColor: 'border-red-500', bgColor: 'bg-red-500/10' },
    { name: 'Home', component: Home, label: 'Casa', color: 'text-green-500', borderColor: 'border-green-500', bgColor: 'bg-green-500/10' },
    { name: 'Building', component: Building, label: 'Apê', color: 'text-fuchsia-500', borderColor: 'border-fuchsia-500', bgColor: 'bg-fuchsia-500/10' },
    { name: 'Plane', component: Plane, label: 'Viagem', color: 'text-blue-500', borderColor: 'border-blue-500', bgColor: 'bg-blue-500/10' },
    { name: 'Briefcase', component: Briefcase, label: 'Trabalho', color: 'text-indigo-500', borderColor: 'border-indigo-500', bgColor: 'bg-indigo-500/10' },
    { name: 'Gift', component: Gift, label: 'Evento', color: 'text-pink-500', borderColor: 'border-pink-500', bgColor: 'bg-pink-500/10' },
    { name: 'PartyPopper', component: PartyPopper, label: 'Festa', color: 'text-yellow-400', borderColor: 'border-yellow-400', bgColor: 'bg-yellow-400/10' },
    { name: 'PiggyBank', component: PiggyBank, label: 'Economia', color: 'text-teal-500', borderColor: 'border-teal-500', bgColor: 'bg-teal-500/10' },
    { name: 'Receipt', component: Receipt, label: 'Contas', color: 'text-cyan-500', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-500/10' },
    { name: 'GraduationCap', component: GraduationCap, label: 'Estudos', color: 'text-purple-500', borderColor: 'border-purple-500', bgColor: 'bg-purple-500/10' },
    { name: 'Utensils', component: Utensils, label: 'Comida', color: 'text-orange-500', borderColor: 'border-orange-500', bgColor: 'bg-orange-500/10' },
    { name: 'ShoppingCart', component: ShoppingCart, label: 'Compras', color: 'text-sky-500', borderColor: 'border-sky-500', bgColor: 'bg-sky-500/10' },
    { name: 'Car', component: Car, label: 'Carro', color: 'text-gray-400', borderColor: 'border-gray-400', bgColor: 'bg-gray-400/10' },
    { name: 'Dog', component: Dog, label: 'Pets', color: 'text-amber-600', borderColor: 'border-amber-600', bgColor: 'bg-amber-600/10' },
    { name: 'Cat', component: Cat, label: 'Gatos', color: 'text-orange-400', borderColor: 'border-orange-400', bgColor: 'bg-orange-400/10' },
    { name: 'Dumbbell', component: Dumbbell, label: 'Fitness', color: 'text-slate-400', borderColor: 'border-slate-400', bgColor: 'bg-slate-400/10' },
    { name: 'Music', component: Music, label: 'Música', color: 'text-rose-500', borderColor: 'border-rose-500', bgColor: 'bg-rose-500/10' },
    { name: 'Gamepad2', component: Gamepad2, label: 'Jogos', color: 'text-lime-500', borderColor: 'border-lime-500', bgColor: 'bg-lime-500/10' },
    { name: 'Film', component: Film, label: 'Filmes', color: 'text-neutral-400', borderColor: 'border-neutral-400', bgColor: 'bg-neutral-400/10' },
];

const AddGroupModal: React.FC<AddGroupModalProps> = ({ availableMembers, currentUser, onClose, onAddGroup }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState<string>('Users');
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set([currentUser.id]));
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);

    const handleMemberToggle = (memberId: string) => {
        if (memberId === currentUser.id) return; // Cannot deselect the current user
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };
    
    // Close icon picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
                setIsIconPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [iconPickerRef]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Por favor, dê um nome ao grupo.');
            return;
        }

        onAddGroup({
            name,
            icon,
            memberIds: Array.from(selectedMemberIds),
        });
    };

    const selectedIconInfo = availableIcons.find(i => i.name === icon) || availableIcons[0];
    const SelectedIconComponent = selectedIconInfo.component;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Novo Grupo</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Grupo</label>
                        <div className="flex items-center gap-3">
                             <div className="relative" ref={iconPickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsIconPickerOpen(prev => !prev)}
                                    className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border-2 border-gray-300 dark:border-slate-600 hover:border-teal-500 transition-colors"
                                >
                                    <SelectedIconComponent className={`w-6 h-6 ${selectedIconInfo.color}`} />
                                </button>
                                {isIconPickerOpen && (
                                    <div className="absolute top-full mt-2 z-10 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl p-3">
                                         <div className="grid grid-cols-5 gap-2">
                                            {availableIcons.map((iconInfo) => {
                                                const { name, component: IconComponent, label, color } = iconInfo;
                                                return (
                                                    <button
                                                        key={name}
                                                        type="button"
                                                        onClick={() => {
                                                            setIcon(name);
                                                            setIsIconPickerOpen(false);
                                                        }}
                                                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors h-16 hover:bg-gray-100 dark:hover:bg-slate-800"
                                                        title={label}
                                                    >
                                                        <IconComponent className={`w-6 h-6 ${color}`} />
                                                        <span className="text-xs text-center text-gray-500 dark:text-gray-400">{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-3 px-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
                                placeholder="Ex: Viagem para a praia"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Membros</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {availableMembers.map(user => (
                               <div key={user.id} onClick={() => handleMemberToggle(user.id)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedMemberIds.has(user.id) ? 'bg-teal-100 dark:bg-slate-700/80' : 'hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <Avatar user={user} className="w-8 h-8"/>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedMemberIds.has(user.id)}
                                        readOnly
                                        disabled={user.id === currentUser.id}
                                        className="h-5 w-5 rounded bg-gray-200 dark:bg-slate-600 border-gray-300 dark:border-slate-500 text-teal-600 dark:text-teal-500 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                                    />
                               </div>
                           ))}
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">Criar Grupo</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGroupModal;
