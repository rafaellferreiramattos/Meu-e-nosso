
import type { User, Group } from '../types';
import { mockUsers } from '../data';
import { supabase } from './supabaseClient';

const USERS_KEY = 'financenter_users';
const GROUPS_KEY = 'financenter_groups';
const CURRENT_USER_KEY = 'financenter_current_user_id';

// ==========================================
// LOCAL STORAGE HELPERS (FALLBACK)
// ==========================================
const getLocalUsers = (): User[] => {
    const storedUsersJson = localStorage.getItem(USERS_KEY);
    let storedUsers: User[] = storedUsersJson ? JSON.parse(storedUsersJson) : [];
    if (storedUsers.length === 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
        return mockUsers;
    }
    // Sync Mock Users logic (kept for consistency)
    let hasChanges = false;
    mockUsers.forEach(mockUser => {
        const existingIndex = storedUsers.findIndex(u => u.id === mockUser.id || u.email.toLowerCase() === mockUser.email.toLowerCase());
        if (existingIndex >= 0) {
             // Mock users are updated if code changes
             const stored = storedUsers[existingIndex];
             if (stored.password !== mockUser.password || stored.email !== mockUser.email) {
                 storedUsers[existingIndex] = { ...stored, ...mockUser };
                 hasChanges = true;
            }
        } else {
            storedUsers.push(mockUser);
            hasChanges = true;
        }
    });
    if (hasChanges) localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
    return storedUsers;
};

const getLocalGroups = (): Group[] => {
    const stored = localStorage.getItem(GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
}

const saveLocalGroup = (group: Group) => {
    const groups = getLocalGroups();
    groups.push(group);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

// ==========================================
// AUTH SERVICE (HYBRID SUPABASE + LOCAL)
// ==========================================

export const authService = {
    // Agora retorna uma Promise, pois pode vir da internet
    getAllUsers: async (): Promise<User[]> => {
        // Se tivéssemos uma tabela 'profiles' pública no Supabase, buscaríamos aqui.
        // Por enquanto, para garantir que as funcionalidades de grupo funcionem sem setup complexo de SQL,
        // retornamos os usuários locais + mockados.
        // Idealmente, no futuro, isso faria: const { data } = await supabase.from('profiles').select('*');
        return getLocalUsers();
    },

    login: async (email: string, password: string): Promise<{ user: User | null, error?: string }> => {
        // 1. Tenta Supabase (Nuvem)
        if (supabase) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) return { user: null, error: error.message };
                if (data.user) {
                    // Mapeia usuário do Supabase para nosso tipo User
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
                        notificationSettings: metadata.notificationSettings
                    };
                    return { user };
                }
            } catch (err) {
                console.error("Supabase login error:", err);
            }
        }

        // 2. Fallback para LocalStorage (Offline / Sem chaves configuradas)
        console.warn("Usando login local (fallback). Configure Supabase para login real.");
        const users = getLocalUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, user.id);
            return { user };
        }
        return { user: null, error: 'Email ou senha incorretos (Local).' };
    },

    register: async (name: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => {
        // Gerar dados auxiliares (FriendID, Cor, etc)
        const firstName = name.trim().split(' ')[0];
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const uniqueFriendId = `${firstName}#${randomNum}`;
        const initials = name.substring(0, 1).toUpperCase();
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        
        const notificationSettings = {
            email: true, expenses: true, goals: true, debts: true, invitations: true
        };

        // 1. Tenta Supabase (Nuvem)
        if (supabase) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            friendId: uniqueFriendId,
                            initials,
                            bgColor,
                            notificationSettings
                        }
                    }
                });

                if (error) return { user: null, error: error.message };
                
                if (data.user) {
                    const newUser: User = {
                        id: data.user.id,
                        email: data.user.email || '',
                        name: name,
                        friendId: uniqueFriendId,
                        initials: initials,
                        bgColor: bgColor,
                        notificationSettings
                    };
                    
                    // Cria grupo pessoal no localStorage para compatibilidade imediata
                    // (Em produção real, isso iria para uma tabela 'groups' no Supabase)
                    authService.ensurePersonalGroup(newUser);
                    
                    return { user: newUser };
                }
            } catch (err) {
                console.error("Supabase register error:", err);
            }
        }

        // 2. Fallback para LocalStorage
        const users = getLocalUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { user: null, error: 'email_exists' };
        }

        const id = `u${Date.now()}`;
        const newUser: User = {
            id, name, email, password, friendId: uniqueFriendId, initials, bgColor, notificationSettings
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);
        
        // Setup Personal Group
        authService.ensurePersonalGroup(newUser);

        return { user: newUser };
    },

    logout: async () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        if (supabase) {
            await supabase.auth.signOut();
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        // 1. Tenta Sessão Supabase
        if (supabase) {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                const metadata = data.user.user_metadata || {};
                return {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: metadata.name || 'Usuário',
                    friendId: metadata.friendId,
                    initials: metadata.initials,
                    bgColor: metadata.bgColor,
                    avatarUrl: metadata.avatarUrl,
                    phone: metadata.phone,
                    pixKey: metadata.pixKey,
                    notificationSettings: metadata.notificationSettings
                };
            }
        }

        // 2. Fallback Local
        const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
        if (!currentUserId) return null;
        const users = getLocalUsers();
        return users.find(u => u.id === currentUserId) || null;
    },

    updateUser: async (updatedUser: User) => {
        // Atualiza Local
        const users = getLocalUsers();
        const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));

        // Atualiza Supabase (Metadados)
        if (supabase) {
            await supabase.auth.updateUser({
                data: {
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    avatarUrl: updatedUser.avatarUrl,
                    pixKey: updatedUser.pixKey,
                    notificationSettings: updatedUser.notificationSettings,
                    initials: updatedUser.initials
                    // FriendID geralmente não muda
                }
            });
        }
    },

    deleteUser: async (userId: string) => {
        // Local cleanup
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

        // Supabase cleanup (In a real app, uses Admin API, but user can delete themselves generally via specific RPC or logic)
        // Here we just sign out as we can't easily delete user from client side without specific policies
        if (supabase) await supabase.auth.signOut();
    },

    getLocalGroups: (): Group[] => {
        return getLocalGroups();
    },
    
    ensurePersonalGroup: (user: User): Group => {
        const groups = getLocalGroups();
        const canonicalId = `pg-${user.id}`;
        const existingCanonical = groups.find(g => g.id === canonicalId);
        if (existingCanonical) {
            const duplicateGroups = groups.filter(g => g.memberIds.length === 1 && g.memberIds.includes(user.id) && g.id !== canonicalId);
            if (duplicateGroups.length > 0) {
                 const cleanGroups = groups.filter(g => g.memberIds.length > 1 || !g.memberIds.includes(user.id) || g.id === canonicalId);
                 localStorage.setItem(GROUPS_KEY, JSON.stringify(cleanGroups));
            }
            return existingCanonical;
        }
        const anyPersonal = groups.find(g => g.memberIds.length === 1 && g.memberIds.includes(user.id));
        if (anyPersonal) return anyPersonal;

        const newGroup: Group = {
            id: canonicalId,
            name: 'Minhas Finanças',
            memberIds: [user.id],
            icon: 'User',
        };
        saveLocalGroup(newGroup);
        return newGroup;
    }
};
