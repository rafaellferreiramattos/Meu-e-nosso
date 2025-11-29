import { useState, useEffect } from 'react';
import type { Notification, User, Debt, Goal, Contribution, Revenue, Invitation } from '../types';

interface UseNotificationsProps {
    currentUser: User | null;
    selectedGroupId: string | null;
    selectedGroupMembers: User[]; // To check if it's a group or personal
    debts: Debt[];
    goals: Goal[];
    contributions: Contribution[];
    revenues: Revenue[];
    invitations: Invitation[];
    transactionsTotal: number; // Total spent (for personal alerts)
    users: User[]; // To lookup names for invitations
}

export const useNotifications = ({
    currentUser,
    selectedGroupId,
    selectedGroupMembers,
    debts,
    goals,
    contributions,
    revenues,
    invitations,
    transactionsTotal,
    users
}: UseNotificationsProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        const newNotifications: Notification[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Debt Notifications (Only for Multi-member groups)
        if (selectedGroupMembers.length > 1) {
            const myDebts = debts.filter(d => d.from.id === currentUser.id && d.amount > 1);
            myDebts.forEach(debt => {
                const notifId = `debt_${selectedGroupId}_${debt.to.id}_${Math.floor(debt.amount)}`;
                if (!notifications.some(n => n.id === notifId)) {
                    newNotifications.push({
                        id: notifId,
                        userId: currentUser.id,
                        type: 'debt',
                        title: 'Pagamento Pendente',
                        message: `Lembre-se de pagar R$ ${debt.amount.toFixed(2)} para ${debt.to.name}.`,
                        date: new Date().toISOString(),
                        read: false,
                        actionLink: 'Dashboard'
                    });
                }
            });
        }

        // 2. Goal Notifications (Progress & Engagement)
        goals.forEach(goal => {
            // Filter goals related to current context (group)
            if (selectedGroupId && goal.groupId !== selectedGroupId) return;

            const goalContributions = contributions.filter(c => c.goalId === goal.id);
            const total = goalContributions.reduce((sum, c) => sum + c.amount, 0);
            const progress = (total / goal.targetAmount) * 100;

            if (progress < 100 && progress > 80) {
                const notifId = `goal_near_${goal.id}`;
                if (!notifications.some(n => n.id === notifId)) {
                    newNotifications.push({
                        id: notifId,
                        userId: currentUser.id,
                        type: 'goal',
                        title: 'Quase lá!',
                        message: `A meta "${goal.name}" está ${progress.toFixed(0)}% concluída. Falta pouco!`,
                        date: new Date().toISOString(),
                        read: false,
                        actionLink: 'Metas'
                    });
                }
            }
        });

        // 3. Revenue Notifications (Late Forecasts)
        // Check for revenues that are NOT received AND date is in the past
        revenues.forEach(revenue => {
            if (revenue.userId !== currentUser.id) return;
            if (revenue.received) return;

            const revenueDate = new Date(revenue.date);
            revenueDate.setHours(0,0,0,0);

            if (revenueDate < today) {
                const notifId = `rev_late_${revenue.id}`;
                if (!notifications.some(n => n.id === notifId)) {
                    newNotifications.push({
                        id: notifId,
                        userId: currentUser.id,
                        type: 'revenue',
                        title: 'Recebimento Atrasado?',
                        message: `A receita "${revenue.description}" estava prevista para ${revenueDate.toLocaleDateString('pt-BR')}. Já recebeu?`,
                        date: new Date().toISOString(),
                        read: false,
                        actionLink: 'Receitas'
                    });
                }
            }
        });

        // 4. Personal Finance Alert (Spending > Income)
        // Only triggers if in personal group mode and total spent > total revenues (forecast + received)
        if (selectedGroupMembers.length === 1 && selectedGroupMembers[0].id === currentUser.id) {
            const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
            if (totalRevenue > 0 && transactionsTotal > totalRevenue) {
                 const notifId = `alert_overspend_${new Date().getMonth()}`; // Once per month/session logic roughly
                 if (!notifications.some(n => n.id === notifId)) {
                    newNotifications.push({
                        id: notifId,
                        userId: currentUser.id,
                        type: 'alert',
                        title: 'Atenção ao Orçamento',
                        message: `Suas despesas (R$ ${transactionsTotal.toFixed(0)}) ultrapassaram suas receitas previstas.`,
                        date: new Date().toISOString(),
                        read: false,
                        actionLink: 'Dashboard'
                    });
                 }
            }
        }

        // 5. Invitation Notifications
        const myPendingInvitations = invitations.filter(inv => inv.toUserId === currentUser.id && inv.status === 'pending');
        myPendingInvitations.forEach(inv => {
             const fromUser = users.find(u => u.id === inv.fromUserId);
             if (fromUser) {
                 const notifId = `inv_${inv.id}`;
                 if (!notifications.some(n => n.id === notifId)) {
                    newNotifications.push({
                        id: notifId,
                        userId: currentUser.id,
                        type: 'invitation',
                        title: 'Novo Convite de Amizade',
                        message: `${fromUser.name} quer adicionar você como amigo.`,
                        date: inv.date,
                        read: false,
                        actionLink: 'Amigos'
                    });
                 }
             }
        });

        if (newNotifications.length > 0) {
            setNotifications(prev => [...prev, ...newNotifications]);
        }

    }, [currentUser, selectedGroupId, selectedGroupMembers, debts, goals, contributions, revenues, invitations, transactionsTotal, users]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return {
        notifications,
        markAsRead,
        clearAll
    };
};
