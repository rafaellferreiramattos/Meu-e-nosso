
import type { User, Group } from '../types';
import { mockUsers, mockGroups } from '../data';

const USERS_KEY = 'financenter_users';
const GROUPS_KEY = 'financenter_groups'; // Added to manage local groups
const CURRENT_USER_KEY = 'financenter_current_user_id';

// Initialize users in local storage if empty
const initializeUsers = (): User[] => {
    const storedUsers = localStorage.getItem(USERS_KEY);
    if (!storedUsers) {
        localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
        return mockUsers;
    }
    return JSON.parse(storedUsers);
};

// Helper to get local groups
const getLocalGroups = (): Group[] => {
    const stored = localStorage.getItem(GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
}

const saveLocalGroup = (group: Group) => {
    const groups = getLocalGroups();
    groups.push(group);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export const authService = {
    getAllUsers: (): User[] => {
        return initializeUsers();
    },

    login: (email: string, password: string): User | null => {
        const users = initializeUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, user.id);
            return user;
        }
        return null;
    },

    register: (name: string, email: string, password: string): User | string => {
        const users = initializeUsers();
        
        // Check if email exists
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return 'email_exists';
        }

        // Generate Unique Friend ID (Name#1234)
        const firstName = name.trim().split(' ')[0];
        let uniqueFriendId = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 100) {
            const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
            uniqueFriendId = `${firstName}#${randomNum}`;
            
            // Check if this specific ID exists
            if (!users.some(u => u.friendId === uniqueFriendId)) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            // Fallback unique ID using timestamp if collision loop fails (very rare)
            uniqueFriendId = `${firstName}#${Date.now().toString().slice(-4)}`;
        }

        const id = `u${Date.now()}`;
        const initials = name.substring(0, 1).toUpperCase();
        
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];

        const newUser: User = {
            id,
            name,
            email,
            password,
            friendId: uniqueFriendId, // Use the automatically generated ID
            initials,
            bgColor,
            notificationSettings: {
                email: true,
                expenses: true,
                goals: true,
                debts: true,
                invitations: true
            }
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);

        // Create Personal Group automatically
        const personalGroup: Group = {
            id: `pg-${id}`,
            name: 'Minhas Finanças',
            memberIds: [id],
            icon: 'User', // Special icon logic can be handled in UI
            members: [newUser]
        };
        saveLocalGroup(personalGroup);
        
        return newUser;
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: (): User | null => {
        const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
        if (!currentUserId) return null;
        
        const users = initializeUsers();
        return users.find(u => u.id === currentUserId) || null;
    },

    updateUser: (updatedUser: User) => {
        const users = initializeUsers();
        const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    },

    deleteUser: (userId: string) => {
        // 1. Remove User from User List
        const users = initializeUsers();
        const newUsers = users.filter(u => u.id !== userId);
        localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
        
        // 2. Remove Session
        localStorage.removeItem(CURRENT_USER_KEY);
        
        // 3. Clean up Groups (Remove user from members, delete empty groups)
        const groups = getLocalGroups();
        const updatedGroups = groups.map(g => ({
            ...g,
            memberIds: g.memberIds.filter(id => id !== userId)
        })).filter(g => g.memberIds.length > 0); // Keep only groups that still have members

        localStorage.setItem(GROUPS_KEY, JSON.stringify(updatedGroups));
    },

    // Exposed for App.tsx to merge with mockGroups
    getLocalGroups: (): Group[] => {
        return getLocalGroups();
    },
    
    // Ensure a personal group exists (for legacy or dev data)
    ensurePersonalGroup: (user: User): Group => {
        const groups = getLocalGroups();
        const canonicalId = `pg-${user.id}`;
        
        // Find existing canonical group
        const existingCanonical = groups.find(g => g.id === canonicalId);
        
        if (existingCanonical) {
            // CLEANUP: If there are OTHER personal groups for this user (with diff IDs), remove them now.
            const duplicateGroups = groups.filter(g => g.memberIds.length === 1 && g.memberIds.includes(user.id) && g.id !== canonicalId);
            
            if (duplicateGroups.length > 0) {
                 const cleanGroups = groups.filter(g => g.memberIds.length > 1 || !g.memberIds.includes(user.id) || g.id === canonicalId);
                 localStorage.setItem(GROUPS_KEY, JSON.stringify(cleanGroups));
            }
            return existingCanonical;
        }

        // If no canonical group, assume the first personal group found is the one we want (legacy migration)
        const anyPersonal = groups.find(g => g.memberIds.length === 1 && g.memberIds.includes(user.id));
        if (anyPersonal) {
             // Optional: We could migrate its ID here, but for now just returning it is safer.
             return anyPersonal;
        }

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
