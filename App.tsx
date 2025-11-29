
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import AddExpenseModal from './components/AddExpenseModal';
import AddGroupModal from './components/AddGroupModal';
import TransactionHistory from './components/TransactionHistory';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import GroupSettingsModal from './components/GroupSettingsModal';
import GoalsPage from './components/GoalsPage';
import AddGoalModal from './components/AddGoalModal';
import AddContributionModal from './components/AddContributionModal';
import GoalDetailModal from './components/GoalDetailModal';
import Confetti from './components/Confetti';
import FriendsPage from './components/FriendsPage';
import ReportsPage from './components/ReportsPage';
import UserSettingsModal from './components/UserSettingsModal';
import AuthPage from './components/AuthPage';
import AiAssistantPage from './components/AiAssistantPage';
import PixPaymentModal from './components/PixPaymentModal';
import AddRevenueModal from './components/AddRevenueModal';
import RevenuePage from './components/RevenuePage';
import { mockGroups, mockTransactions, mockGoals, mockContributions, mockInvitations, mockRevenues } from './data';
import { authService } from './services/authService';
import type { Group, Transaction, User, Goal, Contribution, Invitation, Notification, Debt, Revenue } from './types';
import { calculateDebts, calculateBalances } from './services/financeService';
import { useNotifications } from './hooks/useNotifications';

const App: React.FC = () => {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    // App Data State
    const [groups, setGroups] = useState<Group[]>([]); // Initialize empty, load in useEffect
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [revenues, setRevenues] = useState<Revenue[]>(mockRevenues); // New State for Revenues
    const [goals, setGoals] = useState<Goal[]>(mockGoals);
    const [contributions, setContributions] = useState<Contribution[]>(mockContributions);
    const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations);
    
    // Event-based Notifications (Manual)
    const [customNotifications, setCustomNotifications] = useState<Notification[]>([]);
    
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('Dashboard');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Modal states
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false); // New Modal State
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState(false);
    const [isUserSettingsModalOpen, setIsUserSettingsModalOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [isAddContributionModalOpen, setIsAddContributionModalOpen] = useState(false);
    const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<Goal | null>(null);
    const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
    const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null);
    
    // Pix Modal State
    const [debtToPay, setDebtToPay] = useState<Debt | null>(null);
    
    // Initialize Auth, Theme and Data
    useEffect(() => {
        const allUsers = authService.getAllUsers();
        setUsers(allUsers);
        
        const loggedUser = authService.getCurrentUser();
        if (loggedUser) {
            setCurrentUser(loggedUser);
            // Ensure personal group exists and load all groups
            authService.ensurePersonalGroup(loggedUser);
        }

        // Load theme
        const savedTheme = localStorage.getItem('financenter_theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Load Groups (Mock + Local) whenever currentUser changes
    useEffect(() => {
        if (currentUser) {
            const localGroups = authService.getLocalGroups();
            // Merge mock groups (filtered for user) and local groups
            const userMockGroups = mockGroups.filter(g => g.memberIds.includes(currentUser.id));
            
            // Create a map to avoid duplicates by ID
            const groupMap = new Map<string, Group>();
            userMockGroups.forEach(g => groupMap.set(g.id, g));
            localGroups.forEach(g => groupMap.set(g.id, g));
            
            // Ensure personal group is in the list if not already (safety check)
            const personalGroup = authService.ensurePersonalGroup(currentUser);
            groupMap.set(personalGroup.id, personalGroup);

            setGroups(Array.from(groupMap.values()));
        }
    }, [currentUser]);

    // Apply Theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('financenter_theme', theme);
    }, [theme]);

    // Update selected group logic
    useEffect(() => {
        if (currentUser && groups.length > 0 && !selectedGroupId) {
            // Prefer personal group first if available
            const personalGroup = groups.find(g => g.memberIds.length === 1 && g.memberIds.includes(currentUser.id));
            if (personalGroup) {
                setSelectedGroupId(personalGroup.id);
            } else {
                setSelectedGroupId(groups[0].id);
            }
        }
    }, [currentUser, groups, selectedGroupId]);

    // ---------------- Derived State ----------------
    const selectedGroup = useMemo(() => {
        if (!selectedGroupId) return null;
        const group = groups.find(g => g.id === selectedGroupId);
        if (!group) return null;
        
        const groupMembers = users.filter(u => group.memberIds.includes(u.id));

        return {
            ...group,
            members: groupMembers
        };
    }, [selectedGroupId, groups, users]);

    const groupTransactions = useMemo(() => {
        if (!selectedGroupId) return [];
        return transactions
            .filter(t => t.groupId === selectedGroupId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedGroupId, transactions]);
    
    // Filter revenues for current user (Revenues are personal for now)
    const userRevenues = useMemo(() => {
        if (!currentUser) return [];
        return revenues.filter(r => r.userId === currentUser.id);
    }, [revenues, currentUser]);

    const groupGoals = useMemo(() => {
        if (!selectedGroupId) return [];
        return goals.filter(g => g.groupId === selectedGroupId);
    }, [selectedGroupId, goals]);

    const debts = useMemo(() => {
        if (!selectedGroup) return [];
        return calculateDebts(groupTransactions, selectedGroup.members);
    }, [groupTransactions, selectedGroup]);
    
    const memberBalances = useMemo(() => {
        if (!selectedGroup) return [];
        return calculateBalances(groupTransactions, selectedGroup.members);
    }, [groupTransactions, selectedGroup]);

    // ---------------- Notification System ----------------
    // 1. Get derived notifications (Debts, Late Revenues, etc.)
    const { notifications: systemNotifications, markAsRead: markSystemAsRead, clearAll: clearSystemAll } = useNotifications({
        currentUser,
        selectedGroupId,
        selectedGroupMembers: selectedGroup ? selectedGroup.members : [],
        debts,
        goals,
        contributions,
        revenues: userRevenues,
        invitations,
        transactionsTotal: groupTransactions.reduce((sum, t) => sum + t.amount, 0),
        users
    });

    // 2. Merge with Custom Event Notifications (New Expense, Contribution, etc.)
    // Filter custom notifications to only show those relevant to the current user
    const userCustomNotifications = useMemo(() => {
        if (!currentUser) return [];
        return customNotifications.filter(n => n.userId === currentUser.id);
    }, [customNotifications, currentUser]);

    const allNotifications = useMemo(() => {
        return [...systemNotifications, ...userCustomNotifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [systemNotifications, userCustomNotifications]);

    const markAsRead = (id: string) => {
        // Check if it's a system or custom notification
        if (customNotifications.some(n => n.id === id)) {
            setCustomNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } else {
            markSystemAsRead(id);
        }
    };

    const clearAll = () => {
        clearSystemAll();
        // Only clear current user's custom notifications
        if (currentUser) {
            setCustomNotifications(prev => prev.filter(n => n.userId !== currentUser.id));
        }
    };

    // Helper to add event notification for OTHER group members
    const notifyGroupMembers = (type: 'expense' | 'goal' | 'contribution', title: string, message: string, actionLink: string) => {
        if (!selectedGroup || !currentUser) return;
        
        const otherMembers = selectedGroup.members.filter(m => m.id !== currentUser.id);
        
        const newNotifs: Notification[] = [];
        
        otherMembers.forEach(member => {
            // Check user settings before notifying
            const settings = member.notificationSettings || { expenses: true, goals: true, debts: true, email: true, invitations: true };
            let shouldNotify = true;
            
            if (type === 'expense' && !settings.expenses) shouldNotify = false;
            if ((type === 'goal' || type === 'contribution') && !settings.goals) shouldNotify = false;

            if (shouldNotify) {
                 newNotifs.push({
                    id: `${type}_${Date.now()}_${member.id}`,
                    userId: member.id,
                    type: type,
                    title: title,
                    message: message,
                    date: new Date().toISOString(),
                    read: false,
                    actionLink: actionLink
                });
            }
        });

        if (newNotifs.length > 0) {
            setCustomNotifications(prev => [...prev, ...newNotifs]);
        }
    };


    const handleLogin = (user: User) => {
        setCurrentUser(user);
        authService.ensurePersonalGroup(user);
        setUsers(authService.getAllUsers());
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        setSelectedGroupId(null);
        setCustomNotifications([]);
    };

    const handleDeleteAccount = useCallback(() => {
        if (currentUser) {
            authService.deleteUser(currentUser.id);
            setUsers(prev => prev.filter(u => u.id !== currentUser.id));
            setCurrentUser(null);
            setSelectedGroupId(null);
            setIsUserSettingsModalOpen(false);
        }
    }, [currentUser]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const friends = useMemo(() => {
        if (!currentUser) return [];
        const friendIds = new Set<string>();
        invitations.forEach(inv => {
            if (inv.status === 'accepted') {
                if (inv.fromUserId === currentUser.id) friendIds.add(inv.toUserId);
                if (inv.toUserId === currentUser.id) friendIds.add(inv.fromUserId);
            }
        });
        return users.filter(u => friendIds.has(u.id));
    }, [invitations, currentUser, users]);

    const pendingInvitations = useMemo(() => {
        if (!currentUser) return [];
        return invitations.filter(inv => inv.status === 'pending' && (inv.toUserId === currentUser.id || inv.fromUserId === currentUser.id));
    }, [invitations, currentUser]);

    const handleAddExpense = useCallback((newTransaction: Omit<Transaction, 'id'>) => {
        setTransactions(prev => [
            ...prev,
            { ...newTransaction, id: `t${Date.now()}` }
        ]);
        setIsExpenseModalOpen(false);
        
        // Notify others
        if (currentUser) {
            notifyGroupMembers(
                'expense', 
                'Nova Despesa Adicionada', 
                `${currentUser.name} adicionou "${newTransaction.description}" (R$ ${newTransaction.amount.toFixed(0)}).`,
                'Despesas'
            );
        }
    }, [currentUser, selectedGroup]);

    // Revenue Handlers
    const handleAddRevenue = useCallback((newRevenue: Omit<Revenue, 'id' | 'userId'>) => {
        if (!currentUser) return;
        setRevenues(prev => [
            ...prev,
            { ...newRevenue, id: `r${Date.now()}`, userId: currentUser.id }
        ]);
        setIsRevenueModalOpen(false);
    }, [currentUser]);

    const handleToggleRevenueReceived = useCallback((id: string) => {
        setRevenues(prev => prev.map(r => r.id === id ? { ...r, received: !r.received } : r));
    }, []);

    const handleDeleteRevenue = useCallback((id: string) => {
        setRevenues(prev => prev.filter(r => r.id !== id));
    }, []);


    const handleUpdateTransaction = useCallback((updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        setViewingTransaction(null);
    }, []);

    const handleDeleteTransaction = useCallback((transactionId: string) => {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        setViewingTransaction(null);
    }, []);
    
    const handleAddGroup = useCallback((newGroupData: Omit<Group, 'id' | 'members'>) => {
        const newGroup: Group = {
            ...newGroupData,
            id: `g${Date.now()}`,
            members: [] // Logic handles fetching members
        };
        // We need to manually add the member object to display properly without refresh, though state logic handles it via ID
        const newGroupWithMembers = { ...newGroup, memberIds: newGroupData.memberIds, members: users.filter(u => newGroupData.memberIds.includes(u.id)) };
        
        setGroups(prev => [...prev, newGroupWithMembers]);
        setSelectedGroupId(newGroup.id);
        setActiveView('Dashboard');
        setIsGroupModalOpen(false);
    }, [users]);

    const handleUpdateGroupMembers = useCallback((groupId: string, newMemberIds: string[]) => {
        setGroups(prevGroups =>
            prevGroups.map(g =>
                g.id === groupId ? { ...g, memberIds: newMemberIds } : g
            )
        );
        setIsGroupSettingsModalOpen(false);
    }, []);

    const handleDeleteGroup = useCallback((groupId: string) => {
        setGroups(prevGroups => {
            const updatedGroups = prevGroups.filter(g => g.id !== groupId);
            // Revert to personal group if available
            if (currentUser && selectedGroupId === groupId) {
                const personal = updatedGroups.find(g => g.memberIds.length === 1 && g.memberIds.includes(currentUser.id));
                setSelectedGroupId(personal ? personal.id : (updatedGroups.length > 0 ? updatedGroups[0].id : null));
            }
            return updatedGroups;
        });
        setTransactions(prevTrans => prevTrans.filter(t => t.groupId !== groupId));
        const groupGoalIds = goals.filter(g => g.groupId === groupId).map(g => g.id);
        setGoals(prevGoals => prevGoals.filter(g => g.groupId !== groupId));
        setContributions(prevContribs => prevContribs.filter(c => !groupGoalIds.includes(c.goalId)));

        setIsGroupSettingsModalOpen(false);
    }, [selectedGroupId, goals, currentUser]);
    
    const handleSelectGroup = (groupId: string) => {
        setSelectedGroupId(groupId);
        setActiveView('Dashboard');
    };
    
    const handleAddGoal = useCallback((newGoalData: Omit<Goal, 'id' | 'groupId'>) => {
        if (!selectedGroupId) return;
        const newGoal: Goal = {
            ...newGoalData,
            id: `goal${Date.now()}`,
            groupId: selectedGroupId,
        };
        setGoals(prev => [...prev, newGoal]);
        setIsAddGoalModalOpen(false);
        
        // Notify
        if(currentUser) {
             notifyGroupMembers(
                'goal', 
                'Nova Meta Criada', 
                `${currentUser.name} criou a meta "${newGoal.name}" (Alvo: R$ ${newGoal.targetAmount}).`,
                'Metas'
            );
        }
    }, [selectedGroupId, currentUser, selectedGroup]);

    const handleAddContribution = useCallback((newContributionData: Omit<Contribution, 'id'>) => {
        const goal = goals.find(g => g.id === newContributionData.goalId);
        if (!goal) return;

        const contributionsForGoal = contributions.filter(c => c.goalId === goal.id);
        const totalBefore = contributionsForGoal.reduce((sum, c) => sum + c.amount, 0);

        const newContribution: Contribution = {
            ...newContributionData,
            id: `c${Date.now()}`,
        };
        
        const totalAfter = totalBefore + newContribution.amount;

        if (totalBefore < goal.targetAmount && totalAfter >= goal.targetAmount) {
            setCelebratingGoalId(goal.id);
            setTimeout(() => setCelebratingGoalId(null), 5000);
            
            // Special notification for completion
            notifyGroupMembers(
                'goal', 
                'Meta Atingida! 🎉', 
                `A meta "${goal.name}" foi concluída com sucesso!`,
                'Metas'
            );
        } else {
            // Regular contribution notification
            const contributor = users.find(u => u.id === newContribution.userId);
            if(contributor) {
                 notifyGroupMembers(
                    'contribution', 
                    'Nova Contribuição', 
                    `${contributor.name} adicionou R$ ${newContribution.amount.toFixed(0)} para "${goal.name}".`,
                    'Metas'
                );
            }
        }

        setContributions(prev => [...prev, newContribution]);
        setIsAddContributionModalOpen(false);
        setSelectedGoalForContribution(null);
    }, [goals, contributions, users, selectedGroup, currentUser]);

    const handleOpenAddContributionModal = (goal: Goal) => {
        setSelectedGoalForContribution(goal);
        setIsAddContributionModalOpen(true);
    };
    
    const handleSendInvitation = useCallback((toFriendId: string): 'success' | 'not_found' | 'already_friend' | 'pending' | 'self' => {
        if (!currentUser) return 'not_found';
        const targetUser = users.find(u => u.friendId.toLowerCase() === toFriendId.toLowerCase());
        if (!targetUser) return 'not_found';
        if (targetUser.id === currentUser.id) return 'self';

        const isAlreadyFriend = friends.some(f => f.id === targetUser.id);
        if (isAlreadyFriend) return 'already_friend';

        const hasPendingInvitation = invitations.some(inv => inv.status === 'pending' && ((inv.fromUserId === currentUser.id && inv.toUserId === targetUser.id) || (inv.fromUserId === targetUser.id && inv.toUserId === currentUser.id)));
        if (hasPendingInvitation) return 'pending';
        
        const newInvitation: Invitation = {
            id: `inv${Date.now()}`,
            fromUserId: currentUser.id,
            toUserId: targetUser.id,
            status: 'pending',
            date: new Date().toISOString(),
        };
        setInvitations(prev => [...prev, newInvitation]);
        return 'success';
    }, [users, currentUser, friends, invitations]);

    const handleUpdateInvitationStatus = useCallback((invitationId: string, status: 'accepted' | 'declined') => {
        setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, status } : inv));
    }, []);

    const handleUpdateUser = useCallback((updatedUser: User) => {
        authService.updateUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
    }, []);
    
    // Pix Payment Logic
    const handleSettleDebt = (debt: Debt) => {
        setDebtToPay(debt);
    };

    const handleConfirmPayment = (receiptUrl?: string) => {
        if (!debtToPay || !selectedGroupId) return;

        const newTransaction: Transaction = {
            id: `t${Date.now()}`,
            description: `Pagamento para ${debtToPay.to.name}`,
            amount: debtToPay.amount,
            payers: [{ userId: debtToPay.from.id, amount: debtToPay.amount }],
            groupId: selectedGroupId,
            date: new Date().toISOString(),
            category: 'transfer',
            participantIds: [debtToPay.to.id],
            receiptUrl: receiptUrl
        };

        setTransactions(prev => [...prev, newTransaction]);
        setDebtToPay(null);
        
        // Notify Recipient
        if (currentUser) {
            // Find the recipient user logic here is implicit in notify group members but let's target specifically if we wanted to be precise
            // For now, standard expense notification works or we can customize
             const settings = debtToPay.to.notificationSettings;
             if (settings && settings.debts) {
                 setCustomNotifications(prev => [...prev, {
                    id: `pay_${Date.now()}`,
                    userId: debtToPay.to.id,
                    type: 'debt',
                    title: 'Pagamento Recebido',
                    message: `${currentUser.name} registrou um pagamento de R$ ${debtToPay.amount.toFixed(2)} para você.`,
                    date: new Date().toISOString(),
                    read: false,
                    actionLink: 'Dashboard'
                 }]);
             }
        }
    };


    // Render Auth Page if not logged in
    if (!currentUser) {
        return <AuthPage onLogin={handleLogin} />;
    }
    
    if (!selectedGroup) {
        return (
            <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-200 items-center justify-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }
    
    const isPersonalGroup = selectedGroup.members.length === 1;

    const renderContent = () => {
        switch (activeView) {
            case 'Dashboard':
                return (
                    <Dashboard 
                        debts={debts} 
                        balances={memberBalances} 
                        currentUser={currentUser}
                        onSettleDebt={handleSettleDebt}
                        isPersonal={isPersonalGroup}
                        totalSpent={groupTransactions.reduce((sum, t) => sum + t.amount, 0)}
                        revenues={userRevenues}
                    />
                );
            case 'Despesas':
                return (
                    <TransactionHistory
                        transactions={groupTransactions}
                        users={selectedGroup.members}
                        onNewTransaction={() => setIsExpenseModalOpen(true)}
                        onViewTransaction={setViewingTransaction}
                    />
                );
            case 'Receitas': // New View
                return (
                    <RevenuePage
                        revenues={userRevenues}
                        onAddRevenueClick={() => setIsRevenueModalOpen(true)}
                        onToggleReceived={handleToggleRevenueReceived}
                        onDeleteRevenue={handleDeleteRevenue}
                    />
                );
            case 'Metas':
                return (
                    <GoalsPage
                        goals={groupGoals}
                        contributions={contributions}
                        onOpenAddGoalModal={() => setIsAddGoalModalOpen(true)}
                        onOpenAddContributionModal={handleOpenAddContributionModal}
                        onViewGoalDetails={setViewingGoal}
                    />
                );
            case 'Amigos':
                return (
                    <FriendsPage
                        currentUser={currentUser}
                        users={users}
                        friends={friends}
                        pendingInvitations={pendingInvitations}
                        onSendInvitation={handleSendInvitation}
                        onUpdateInvitation={handleUpdateInvitationStatus}
                    />
                );
            case 'Relatórios':
                 return (
                    <ReportsPage
                        groupName={selectedGroup.name}
                        transactions={groupTransactions}
                        members={selectedGroup.members}
                    />
                );
            case 'Assistente IA':
                return (
                    <AiAssistantPage
                        group={selectedGroup}
                        transactions={groupTransactions}
                        goals={groupGoals}
                        members={selectedGroup.members}
                        currentUser={currentUser}
                    />
                );
            default:
                return (
                    <Dashboard 
                        debts={debts} 
                        balances={memberBalances} 
                        currentUser={currentUser}
                        onSettleDebt={handleSettleDebt}
                        isPersonal={isPersonalGroup}
                        totalSpent={groupTransactions.reduce((sum, t) => sum + t.amount, 0)}
                        revenues={userRevenues}
                    />
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-200 transition-colors duration-200">
             {celebratingGoalId && <Confetti />}
            <Sidebar 
                groups={groups} 
                selectedGroupId={selectedGroupId!}
                onSelectGroup={handleSelectGroup}
                onOpenAddGroupModal={() => setIsGroupModalOpen(true)}
                activeView={activeView}
                onSelectView={setActiveView}
                onOpenSettings={() => setIsUserSettingsModalOpen(true)}
                onLogout={handleLogout}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    group={selectedGroup} 
                    onOpenSettings={() => setIsGroupSettingsModalOpen(true)}
                    showSettings={activeView === 'Dashboard' && !isPersonalGroup}
                    notifications={allNotifications}
                    onMarkNotificationAsRead={markAsRead}
                    onClearNotifications={clearAll}
                    onNavigate={setActiveView}
                />
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {activeView === 'Dashboard' ? (
                        <div className="space-y-8">
                             <Dashboard 
                                debts={debts} 
                                balances={memberBalances} 
                                currentUser={currentUser}
                                onSettleDebt={handleSettleDebt}
                                isPersonal={isPersonalGroup}
                                totalSpent={groupTransactions.reduce((sum, t) => sum + t.amount, 0)}
                                revenues={userRevenues}
                            />
                            {!isPersonalGroup && debts.length > 0 && (
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-transparent">
                                     <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Pagamentos Pendentes</h3>
                                     <div className="grid gap-4">
                                        {debts.map((debt, i) => (
                                            debt.from.id === currentUser?.id && (
                                                <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-200 dark:border-transparent">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">Você deve para</span>
                                                            <span className="font-bold text-gray-900 dark:text-white">{debt.to.name}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-red-500">R$ {debt.amount.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                        {debts.filter(d => d.from.id === currentUser?.id).length === 0 && (
                                            <p className="text-gray-500 text-sm">Você não tem dívidas pendentes.</p>
                                        )}
                                     </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        renderContent()
                    )}
                </div>
            </main>
            
            {isExpenseModalOpen && (
                <AddExpenseModal 
                    group={selectedGroup}
                    onClose={() => setIsExpenseModalOpen(false)}
                    onAddExpense={handleAddExpense}
                />
            )}
            {isRevenueModalOpen && (
                <AddRevenueModal
                    onClose={() => setIsRevenueModalOpen(false)}
                    onAddRevenue={handleAddRevenue}
                />
            )}
            {isGroupModalOpen && (
                <AddGroupModal
                    availableMembers={[currentUser, ...friends]}
                    currentUser={currentUser}
                    onClose={() => setIsGroupModalOpen(false)}
                    onAddGroup={handleAddGroup}
                />
            )}
            {viewingTransaction && (
                <ExpenseDetailModal 
                    transaction={viewingTransaction}
                    group={selectedGroup}
                    onClose={() => setViewingTransaction(null)}
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                />
            )}
            {isGroupSettingsModalOpen && (
                <GroupSettingsModal
                    group={selectedGroup}
                    allUsers={users}
                    friends={friends}
                    currentUser={currentUser}
                    onClose={() => setIsGroupSettingsModalOpen(false)}
                    onUpdateMembers={handleUpdateGroupMembers}
                    onDeleteGroup={handleDeleteGroup}
                />
            )}
            {isAddGoalModalOpen && (
                <AddGoalModal 
                    onClose={() => setIsAddGoalModalOpen(false)}
                    onAddGoal={handleAddGoal}
                />
            )}
            {isAddContributionModalOpen && selectedGoalForContribution && (
                <AddContributionModal
                    goal={selectedGoalForContribution}
                    groupMembers={selectedGroup.members}
                    onClose={() => {
                        setIsAddContributionModalOpen(false);
                        setSelectedGoalForContribution(null);
                    }}
                    onAddContribution={handleAddContribution}
                />
            )}
            {viewingGoal && (
                <GoalDetailModal
                    goal={viewingGoal}
                    contributions={contributions.filter(c => c.goalId === viewingGoal.id)}
                    groupMembers={selectedGroup.members}
                    onClose={() => setViewingGoal(null)}
                    onOpenAddContributionModal={() => handleOpenAddContributionModal(viewingGoal)}
                />
            )}
            {isUserSettingsModalOpen && (
                <UserSettingsModal
                    user={currentUser}
                    onClose={() => setIsUserSettingsModalOpen(false)}
                    onUpdateUser={handleUpdateUser}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                    onDeleteAccount={handleDeleteAccount}
                />
            )}
            {debtToPay && (
                <PixPaymentModal 
                    debt={debtToPay}
                    onClose={() => setDebtToPay(null)}
                    onConfirmPayment={handleConfirmPayment}
                />
            )}
        </div>
    );
};

export default App;
