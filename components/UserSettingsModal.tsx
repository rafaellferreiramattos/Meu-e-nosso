
import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { X, Save, Lock, User as UserIcon, Sun, Moon, Trash2, Palette, Camera, Globe, QrCode, Bell, Phone, Check, RotateCcw } from 'lucide-react';
import Avatar from './Avatar';

interface UserSettingsModalProps {
    user: User;
    onClose: () => void;
    onUpdateUser: (user: User) => void;
    currentTheme: 'light' | 'dark';
    onToggleTheme: () => void;
    onDeleteAccount: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ user, onClose, onUpdateUser, currentTheme, onToggleTheme, onDeleteAccount }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security'>('profile');
    
    // Profile State
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phone || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const [language, setLanguage] = useState<User['language']>(user.language || 'pt-BR');
    const [pixKey, setPixKey] = useState(user.pixKey || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image Cropping State
    const [editImage, setEditImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Notification Settings State
    const [notifSettings, setNotifSettings] = useState(user.notificationSettings || {
        email: true,
        expenses: true,
        goals: true,
        debts: true,
        invitations: true
    });

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Photo Upload Handler - Starts Editing Mode
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result as string);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Draw image on canvas for cropping preview
    useEffect(() => {
        if (!editImage || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const image = new Image();
        image.src = editImage;
        image.onload = () => {
            imageRef.current = image;
            drawCanvas();
        };
    }, [editImage]);

    // Redraw on zoom/pan changes
    useEffect(() => {
        drawCanvas();
    }, [zoom, position]);

    const drawCanvas = () => {
        if (!canvasRef.current || !imageRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const size = 250; // Canvas size
        canvas.width = size;
        canvas.height = size;
        
        ctx.clearRect(0, 0, size, size);
        
        // Circular Clipping
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw Image
        const img = imageRef.current;
        // Calculate dimensions to cover
        const scale = Math.max(size / img.width, size / img.height) * zoom;
        const x = (size - img.width * scale) / 2 + position.x;
        const y = (size - img.height * scale) / 2 + position.y;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
    
    const handleSaveCrop = () => {
         if (canvasRef.current) {
             const croppedDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
             setAvatarUrl(croppedDataUrl);
             setEditImage(null);
         }
    };

    const handleCancelCrop = () => {
        setEditImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Phone Mask Handler (Only for the Phone field, NOT Pix Key)
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 11) value = value.slice(0, 11);

        // Apply Mask (XX) XXXXX-XXXX
        let formatted = value;
        if (value.length > 2) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 7) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        }
        
        setPhone(formatted);
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            alert('Nome e E-mail são obrigatórios.');
            return;
        }

        // Phone Validation (Basic length check for Brazil: 10 or 11 digits)
        const rawPhone = phone.replace(/\D/g, '');
        if (phone && (rawPhone.length < 10 || rawPhone.length > 11)) {
            alert('Por favor, insira um telefone válido com DDD (ex: 11999998888).');
            return;
        }
        
        const initials = name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        onUpdateUser({
            ...user,
            name,
            email,
            phone: phone.trim() || undefined,
            avatarUrl: avatarUrl.trim() || undefined,
            initials,
            language,
            pixKey: pixKey.trim() || undefined
        });
        onClose();
    };

    const handleNotificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({
            ...user,
            notificationSettings: notifSettings
        });
        onClose();
    }

    const handleSecuritySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle Password Change logic if fields are filled
        if (currentPassword || newPassword || confirmNewPassword) {
            setPasswordError('');
            setPasswordSuccess('');

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                setPasswordError('Para alterar a senha, preencha todos os campos.');
                return;
            }
            if (currentPassword !== user.password) {
                setPasswordError('Senha atual incorreta.');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                setPasswordError('As novas senhas não coincidem.');
                return;
            }
            if (newPassword.length < 3) {
                setPasswordError('A nova senha é muito curta.');
                return;
            }
            setPasswordSuccess('Senha atualizada!');
        }

        // Update User with Security Settings
        onUpdateUser({
            ...user,
            password: newPassword || user.password, // Update password only if changed
        });
        
        // Only close if it wasn't just a password feedback update
        if (!passwordError) {
             // If user just wanted to toggle switches, we show a brief success or close
             if (!newPassword) onClose();
        }
    };
    
    const handleDeleteConfirm = () => {
        const confirmText = prompt(`Para confirmar a exclusão, digite "${user.friendId}" abaixo. Esta ação não pode ser desfeita.`);
        if (confirmText && confirmText.toLowerCase() === user.friendId.toLowerCase()) {
            onDeleteAccount();
        } else if (confirmText !== null) {
            alert('ID incorreto. A conta não foi excluída.');
        }
    };

    const getTabTitle = () => {
        switch (activeTab) {
            case 'profile': return 'Editar Perfil';
            case 'appearance': return 'Aparência do App';
            case 'notifications': return 'Gerenciar Notificações';
            case 'security': return 'Segurança e Login';
            default: return '';
        }
    };

    const NotificationToggle = ({ label, description, checked, field }: { label: string, description: string, checked: boolean, field: keyof typeof notifSettings }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-700 last:border-0">
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button 
                type="button"
                onClick={() => setNotifSettings(prev => ({ ...prev, [field]: !prev[field] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${checked ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
                <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl m-4 border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                
                {/* Sidebar */}
                <div className="bg-gray-50 dark:bg-slate-900 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700 flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h2>
                    </div>
                    <div className="p-2 space-y-1 flex-grow">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                            <UserIcon className="w-5 h-5" />
                            Perfil
                        </button>
                        <button 
                            onClick={() => setActiveTab('appearance')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                            <Palette className="w-5 h-5" />
                            Aparência
                        </button>
                        <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                            <Bell className="w-5 h-5" />
                            Notificações
                        </button>
                        <button 
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                            <Lock className="w-5 h-5" />
                            Segurança
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white dark:bg-slate-800 relative">
                    {/* Image Editor Overlay */}
                    {editImage && (
                        <div className="absolute inset-0 bg-white dark:bg-slate-800 z-10 flex flex-col items-center justify-center p-6">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Ajustar Foto</h3>
                            <div className="relative border-4 border-gray-200 dark:border-slate-600 rounded-full overflow-hidden shadow-lg mb-6 w-[250px] h-[250px] bg-black">
                                <canvas ref={canvasRef} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="w-full max-w-xs space-y-4 mb-6">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Zoom</label>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="3" 
                                        step="0.1" 
                                        value={zoom} 
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Mover Horizontal</label>
                                        <input 
                                            type="range" 
                                            min="-150" 
                                            max="150" 
                                            value={position.x} 
                                            onChange={(e) => setPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Mover Vertical</label>
                                        <input 
                                            type="range" 
                                            min="-150" 
                                            max="150" 
                                            value={position.y} 
                                            onChange={(e) => setPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleCancelCrop}
                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white font-medium flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" /> Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveCrop}
                                    className="px-6 py-2 rounded-lg bg-teal-600 text-white font-medium flex items-center gap-2 shadow-lg"
                                >
                                    <Check className="w-4 h-4" /> Cortar e Salvar
                                </button>
                            </div>
                        </div>
                    )}


                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {getTabTitle()}
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                {/* Photo Upload */}
                                <div className="flex flex-col items-center gap-3">
                                     <div className="relative group">
                                        <Avatar user={{ ...user, name, avatarUrl: avatarUrl || undefined }} className="w-24 h-24 text-3xl" />
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                        >
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                     </div>
                                     <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        accept="image/*"
                                     />
                                     <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline">
                                        Alterar Foto
                                     </button>
                                </div>

                                {/* Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                            <Phone className="w-4 h-4"/> Telefone / WhatsApp
                                        </label>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                            <Globe className="w-4 h-4"/> Idioma
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value as User['language'])}
                                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="pt-BR">Português (Brasil)</option>
                                            <option value="en-US">English (US)</option>
                                            <option value="es-ES">Español</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                            <QrCode className="w-4 h-4"/> Chave Pix
                                        </label>
                                        <input
                                            type="text"
                                            value={pixKey}
                                            onChange={(e) => setPixKey(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="CPF, E-mail, Telefone ou Aleatória"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Facilite o recebimento de pagamentos cadastrando sua chave.</p>
                                    </div>
                                </div>

                                 <div className="bg-gray-100 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Seu ID Único</p>
                                    <p className="text-sm font-mono text-teal-600 dark:text-teal-400 font-bold">{user.friendId}</p>
                                </div>

                                <div className="pt-2 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700">
                                    <button type="submit" className="flex items-center gap-2 py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">
                                        <Save className="w-4 h-4" />
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {currentTheme === 'dark' ? <Moon className="text-teal-400 w-8 h-8" /> : <Sun className="text-amber-500 w-8 h-8" />}
                                        <div>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">Tema do Aplicativo</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Alterne entre modo claro e escuro.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={onToggleTheme}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${currentTheme === 'dark' ? 'bg-teal-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`${currentTheme === 'dark' ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm`}
                                        />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    O tema escolhido será salvo e aplicado automaticamente sempre que você acessar o MEU & NOSSO neste dispositivo.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                         <div className="space-y-6">
                             <form onSubmit={handleNotificationSubmit} className="space-y-4">
                                <div className="bg-white dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-700 p-4 space-y-2">
                                    <NotificationToggle 
                                        label="Novas Despesas" 
                                        description="Seja notificado quando alguém adicionar uma despesa ao grupo."
                                        checked={notifSettings.expenses}
                                        field="expenses"
                                    />
                                    <NotificationToggle 
                                        label="Metas e Contribuições" 
                                        description="Receba atualizações sobre o progresso das metas compartilhadas."
                                        checked={notifSettings.goals}
                                        field="goals"
                                    />
                                    <NotificationToggle 
                                        label="Lembretes de Dívidas" 
                                        description="Avisos periódicos sobre pagamentos pendentes."
                                        checked={notifSettings.debts}
                                        field="debts"
                                    />
                                    <NotificationToggle 
                                        label="Convites de Amizade" 
                                        description="Notificar quando alguém quiser ser seu amigo."
                                        checked={notifSettings.invitations}
                                        field="invitations"
                                    />
                                    <NotificationToggle 
                                        label="E-mails de Resumo" 
                                        description="Receba um resumo semanal da sua vida financeira por e-mail (simulado)."
                                        checked={notifSettings.email}
                                        field="email"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700">
                                    <button type="submit" className="flex items-center gap-2 py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">
                                        <Save className="w-4 h-4" />
                                        Salvar Preferências
                                    </button>
                                </div>
                             </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8">
                            <form onSubmit={handleSecuritySubmit} className="space-y-6">
                                
                                {/* Alterar Senha */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Alterar Senha</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Atual</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nova Senha</label>
                                            <input
                                                type="password"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md py-2 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                    </div>
                                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                                    {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button type="submit" className="flex items-center gap-2 py-2 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105">
                                        <Save className="w-4 h-4" />
                                        Salvar Segurança
                                    </button>
                                </div>
                            </form>

                            <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                                <h4 className="text-md font-bold text-gray-900 dark:text-white mb-2">Conta</h4>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Excluir Conta</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sua conta e dados pessoais serão removidos.</p>
                                    </div>
                                    <button 
                                        onClick={handleDeleteConfirm}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSettingsModal;