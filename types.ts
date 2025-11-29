
export interface NotificationSettings {
  email: boolean; // For weekly digests (simulated)
  expenses: boolean; // When someone adds an expense
  goals: boolean; // When a goal is updated/reached
  debts: boolean; // Periodic reminders
  invitations: boolean; // Friend requests
}

export interface User {
  id: string;
  name: string;
  email: string; // Added for auth
  password?: string; // Added for auth (simulated)
  friendId: string; // e.g., 'Joana#1234'
  phone?: string; // Added for contact validation
  avatarUrl?: string;
  initials: string;
  bgColor: string;
  // New Preferences
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  pixKey?: string; // Added for Pix functionality
  notificationSettings?: NotificationSettings; // Added for notification management
}

export interface Group {
  id:string;
  name: string;
  memberIds: string[];
  members?: User[];
  icon: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  payers: { userId: string; amount: number }[];
  groupId: string;
  date: string; // ISO string for simplicity
  category: 'groceries' | 'dining' | 'entertainment' | 'bills' | 'transport' | 'health' | 'education' | 'housing' | 'pets' | 'gifts' | 'travel' | 'beauty' | 'other' | 'transfer';
  participantIds: string[];
  receiptUrl?: string; // Added for payment proof attachments
}

export interface Revenue {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: 'salary' | 'freelance' | 'investment' | 'gift' | 'other';
  received: boolean; // true = received, false = forecast
}

export interface Debt {
  from: User;
  to: User;
  amount: number;
}

export interface Balance {
  user: User;
  amount: number;
}

export interface Goal {
  id: string;
  groupId: string;
  name: string;
  targetAmount: number;
}

export interface Contribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: string; // ISO string
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Invitation {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: InvitationStatus;
  date: string; // ISO string
}

export interface Notification {
    id: string;
    userId: string;
    type: 'debt' | 'goal' | 'system' | 'info' | 'revenue' | 'invitation' | 'alert' | 'expense' | 'contribution';
    title: string;
    message: string;
    date: string;
    read: boolean;
    actionLink?: string; // Name of the view to navigate to
}