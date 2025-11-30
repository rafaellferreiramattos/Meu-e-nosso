
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
    
    // GUARANTEE MOCK USERS EXIST (Critical for testing on new devices like mobile)
    let hasChanges = false;
    
    if (storedUsers.length === 0) {
        storedUsers = [...mockUsers];
        hasChanges = true;
    } else {
        // Ensure standard test users (like Rafael) are always present and up to date
        mockUsers.forEach(mockUser => {
            const index = storedUsers.findIndex(u => u.email.toLowerCase() === mockUser.email.toLowerCase());
            if (index === -1) {
                // User doesn't exist, add them
                storedUsers.push(mockUser);
                hasChanges = true;
            } else {
                // User exists, ensure password matches test credentials (in case it was corrupted)
                if (storedUsers[index].password !== mockUser.password) {
                    storedUsers[index].password = mockUser.password;
                    hasChanges = true;
                }
            }
        });
    }

    if (hasChanges) {
        localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
    }
    
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
    getAllUsers: async (): Promise<User[]> => {
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
                        notificationSettings: metadata.notificationSettings
                    };
                    return { user };
                }
                // Don't return error immediately, try local fallback for test users
                console.warn("Supabase login failed, trying local fallback:", error?.message);
            } catch (err) {
                console.error("Supabase connection error:", err);
            }
        }

        // 2. Fallback para LocalStorage (Offline / Test Users)
        const users = getLocalUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, user.id);
            return { user };
        }
        
        return { user: null, error: 'Email ou senha incorretos.' };
    },

    register: async (name: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => {
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
        const users = getLocalUsers();
        const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));

        if (supabase) {
            await supabase.auth.updateUser({
                data: {
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    avatarUrl: updatedUser.avatarUrl,
                    pixKey: updatedUser.pixKey,
                    notificationSettings: updatedUser.notificationSettings,
                    initials: updatedUser.initials
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
        const existingCanonical = groups.find(g => g.id === canonicalId);
        if (existingCanonical) {
            return existingCanonical;
        }
        
        // Cleanup old personal groups
        const cleanGroups = groups.filter(g => !(g.memberIds.length === 1 && g.memberIds.includes(user.id)));
        
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
