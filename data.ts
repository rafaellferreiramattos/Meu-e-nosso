
import type { User, Group, Transaction, Goal, Contribution, Invitation, Revenue } from './types';

const defaultNotificationSettings = {
    email: true,
    expenses: true,
    goals: true,
    debts: true,
    invitations: true
};

export const mockUsers: User[] = [
    { id: 'u1', name: 'Joana', email: 'joana@email.com', password: '123', friendId: 'Joana#1234', phone: '(11) 98765-4321', initials: 'J', bgColor: 'bg-pink-500', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', pixKey: 'joana@email.com', notificationSettings: defaultNotificationSettings },
    { id: 'u2', name: 'Rafael Matos', email: 'rafael@email.com', password: '123', friendId: 'Rafael#5678', phone: '(11) 99999-8888', initials: 'R', bgColor: 'bg-blue-500', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', pixKey: '(11) 99999-9999', notificationSettings: defaultNotificationSettings },
    { id: 'u3', name: 'Bruno', email: 'bruno@email.com', password: '123', friendId: 'Bruno#9012', phone: '(21) 97777-6666', initials: 'B', bgColor: 'bg-green-500', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', pixKey: 'bruno.pix@bank.com', notificationSettings: defaultNotificationSettings },
    { id: 'u4', name: 'Carla', email: 'carla@email.com', password: '123', friendId: 'Carla#3456', phone: '(31) 95555-4444', initials: 'C', bgColor: 'bg-purple-500', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704g', pixKey: '123.456.789-00', notificationSettings: defaultNotificationSettings },
    { id: 'u5', name: 'Lucas', email: 'lucas@email.com', password: '123', friendId: 'Lucas#7890', phone: '(41) 93333-2222', initials: 'L', bgColor: 'bg-yellow-500', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704h', pixKey: '+5511988887777', notificationSettings: defaultNotificationSettings },
    { id: 'u6', name: 'Sofia', email: 'sofia@email.com', password: '123', friendId: 'Sofia#2345', phone: '(51) 91111-0000', initials: 'S', bgColor: 'bg-red-500', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704i', pixKey: 'sofia@email.com', notificationSettings: defaultNotificationSettings },
];

export const mockGroups: Group[] = [
    { id: 'g1', name: 'J & R', memberIds: ['u1', 'u2'], icon: 'Heart' }
];

export const mockTransactions: Transaction[] = [
    {
        id: 't1',
        description: 'Mercado',
        amount: 150.00,
        payers: [{ userId: 'u1', amount: 150.00 }],
        groupId: 'g1',
        date: '2025-11-13T10:00:00Z',
        category: 'groceries',
        participantIds: ['u1', 'u2'],
    },
];

export const mockRevenues: Revenue[] = [
    {
        id: 'r1',
        userId: 'u2',
        description: 'Salário Mensal',
        amount: 5000.00,
        date: '2025-11-05T10:00:00Z',
        category: 'salary',
        received: true
    },
    {
        id: 'r2',
        userId: 'u2',
        description: 'Freelance Design',
        amount: 1200.00,
        date: '2025-11-25T10:00:00Z',
        category: 'freelance',
        received: false
    },
    {
        id: 'r3',
        userId: 'u2',
        description: '13º Salário',
        amount: 5000.00,
        date: '2025-12-20T10:00:00Z',
        category: 'salary',
        received: false
    }
];

export const mockGoals: Goal[] = [
    {
        id: 'goal1',
        groupId: 'g1',
        name: 'Viagem para o Chile',
        targetAmount: 8000,
    },
];

export const mockContributions: Contribution[] = [
    { id: 'c1', goalId: 'goal1', userId: 'u1', amount: 500, date: '2025-10-01T10:00:00Z' },
    { id: 'c2', goalId: 'goal1', userId: 'u2', amount: 750, date: '2025-10-05T10:00:00Z' },
    { id: 'c3', goalId: 'goal1', userId: 'u1', amount: 500, date: '2025-11-01T10:00:00Z' },
];

export const mockInvitations: Invitation[] = [
    { id: 'inv1', fromUserId: 'u5', toUserId: 'u1', status: 'pending', date: new Date().toISOString() },
    { id: 'inv2', fromUserId: 'u1', toUserId: 'u6', status: 'pending', date: new Date().toISOString() },
    { id: 'inv3', fromUserId: 'u2', toUserId: 'u3', status: 'accepted', date: '2025-11-10T10:00:00Z' },
    // Adicionando convite aceito entre Rafael (u2) e Joana (u1) para a demonstração
    { id: 'inv_demo_joana', fromUserId: 'u2', toUserId: 'u1', status: 'accepted', date: new Date().toISOString() },
];
