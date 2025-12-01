
import type { User, Group } from '../types';
import { mockUsers } from '../data';
import { supabase } from './supabaseClient';

const USERS_KEY = 'financenter_users';
const GROUPS_KEY = 'financenter_groups';
const CURRENT_USER_KEY = 'financenter_current_user_id';

// Helpers para LocalStorage (Fallback apenas quando não há Supabase)
const getLocalUsers = (): User[] => {
    const storedUsersJson = localStorage.getItem(USERS_KEY);
    return storedUsersJson ? JSON.parse(storedUsersJson) : [...mockUsers];
};

const getLocalGroups = (): Group[] => {
    const stored = localStorage.getItem(GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export const authService = {
    getAllUsers: async (): Promise<User[]> => {
        return getLocalUsers();
    },

    login: async (email: string, password: string): Promise<{ user: User | null, error?: string }> => {
        // 1. TENTATIVA PRINCIPAL: SUPABASE (NUVEM)
        if (supabase) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error("Supabase Login Error:", error);
                    if (error.message.includes("Email not confirmed")) {
                        return { user: null, error: 'Email não confirmado. Verifique sua caixa de entrada.' };
                    }
                    if (error.message.includes("Invalid login credentials")) {
                        return { user: null, error: 'Email ou senha incorretos.' };
                    }
                    return { user: null, error: 'Erro ao entrar. Verifique seus dados.' };
                }

                if (data.user) {
                    const metadata = data.user.user_metadata || {};
                    const user: User = {
                        id: data.user.id,
                        email: data.user.email || '',
                        name: metadata.name || 'Usuário',
                        friendId: metadata.friendId || `User#${data.user.id.slice(0,4)}`,
                        initials: metadata.initials || 'U',
                        bgColor: metadata.bgColor || 'bg-teal-500',
                        avatarUrl: metadata.avatarUrl,
                        phone: metadata.phone,
                        pixKey: metadata.pixKey,
                        language: metadata.language as User['language'],
                        notificationSettings: metadata.notificationSettings
                    };
                    
                    authService.ensurePersonalGroup(user);
                    return { user };
                }
            } catch (err) {
                console.error("Critical Supabase connection error:", err);
                return { user: null, error: "Erro de conexão. Verifique sua internet." };
            }
        }

        // 2. FALLBACK: LOCAL STORAGE
        console.warn("Supabase não configurado. Usando modo offline.");
        const users = getLocalUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, user.id);
            return { user };
        }
        
        return { user: null, error: 'Email ou senha incorretos (Modo Local).' };
    },

    register: async (name: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => {
        const firstName = name.trim().split(' ')[0];
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const uniqueFriendId = `${firstName}#${randomNum}`;
        const initials = name.substring(0, 1).toUpperCase();
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        
        const userData = {
            name,
            friendId: uniqueFriendId,
            initials,
            bgColor,
            notificationSettings: { email: true, expenses: true, goals: true, debts: true, invitations: true },
            pixKey: '',
            phone: '',
            language: 'pt-BR' as const
        };

        if (supabase) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: userData }
                });

                if (error) return { user: null, error: error.message };
                
                if (data.user) {
                    if (!data.session) {
                        return { user: null, error: "Cadastro realizado! Verifique seu email para confirmar antes de logar." };
                    }
                    const newUser: User = { id: data.user.id, email: data.user.email || '', ...userData };
                    authService.ensurePersonalGroup(newUser);
                    return { user: newUser };
                }
            } catch (err) {
                return { user: null, error: "Erro ao conectar com o servidor." };
            }
        }

        // Fallback Local
        const users = getLocalUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { user: null, error: 'email_exists' };
        }
        const id = `u${Date.now()}`;
        const newUser: User = { id, email, password, ...userData };
        const updatedUsers = [...users, newUser];
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);
        authService.ensurePersonalGroup(newUser);
        return { user: newUser };
    },

    logout: async () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        if (supabase) await supabase.auth.signOut();
    },

    getCurrentUser: async (): Promise<User | null> => {
        if (supabase) {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                const metadata = data.user.user_metadata || {};
                const user: User = {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: metadata.name || 'Usuário',
                    friendId: metadata.friendId,
                    initials: metadata.initials,
                    bgColor: metadata.bgColor,
                    avatarUrl: metadata.avatarUrl,
                    phone: metadata.phone,
                    pixKey: metadata.pixKey,
                    language: metadata.language as User['language'],
                    notificationSettings: metadata.notificationSettings
                };
                authService.ensurePersonalGroup(user);
                return user;
            }
            return null;
        }
        const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
        if (!currentUserId) return null;
        const users = getLocalUsers();
        return users.find(u => u.id === currentUserId) || null;
    },

    updateUser: async (updatedUser: User) => {
        const users = getLocalUsers();
        const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));

        if (supabase) {
            await supabase.auth.updateUser({
                email: updatedUser.email,
                password: updatedUser.password,
                data: {
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    avatarUrl: updatedUser.avatarUrl,
                    pixKey: updatedUser.pixKey,
                    notificationSettings: updatedUser.notificationSettings,
                    initials: updatedUser.initials,
                    language: updatedUser.language
                }
            });
        }
    },

    deleteUser: async (userId: string) => {
        const users = getLocalUsers();
        const newUsers = users.filter(u => u.id !== userId);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
        localStorage.removeItem(CURRENT_USER_KEY);

        const groups = getLocalGroups();
        const updatedGroups = groups.map(g => ({
            ...g,
            memberIds: g.memberIds.filter(id => id !== userId)
        })).filter(g => g.memberIds.length > 0);
        localStorage.setItem(GROUPS_KEY, JSON.stringify(updatedGroups));

        if (supabase) await supabase.auth.signOut();
    },

    getLocalGroups: (): Group[] => {
        return getLocalGroups();
    },
    
    ensurePersonalGroup: (user: User): Group => {
        const groups = getLocalGroups();
        const canonicalId = `pg-${user.id}`;
        const cleanGroups = groups.filter(g => {
            const isPersonal = g.memberIds.length === 1 && g.memberIds.includes(user.id);
            return !isPersonal; 
        });
        const newGroup: Group = {
            id: canonicalId,
            name: 'Minhas Finanças',
            memberIds: [user.id],
            icon: 'User',
        };
        cleanGroups.push(newGroup);
        localStorage.setItem(GROUPS_KEY, JSON.stringify(cleanGroups));
        return newGroup;
    }
};
