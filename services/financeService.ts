
import type { Transaction, User, Debt, Balance } from '../types';

export const calculateBalances = (transactions: Transaction[], members: User[]): Balance[] => {
    if (members.length === 0) {
        return [];
    }

    const balancesMap = new Map<string, number>();
    members.forEach(member => balancesMap.set(member.id, 0));

    transactions.forEach(transaction => {
        // 1. Calculate total actually paid by payers
        const totalPaid = transaction.payers.reduce((sum, payer) => sum + payer.amount, 0);

        // 2. Credit the Payers (They put money IN)
        transaction.payers.forEach(payer => {
            const payerBalance = balancesMap.get(payer.userId) || 0;
            balancesMap.set(payer.userId, payerBalance + payer.amount);
        });

        // 3. Debit the Participants (They consumed value OUT)
        // If no specific participants are listed, assume everyone in the group (legacy compatibility)
        const participants = transaction.participantIds || members.map(m => m.id);
        const participantCount = participants.length;

        if (participantCount > 0 && totalPaid > 0) {
            const share = totalPaid / participantCount;
            participants.forEach(participantId => {
                const participantBalance = balancesMap.get(participantId) || 0;
                balancesMap.set(participantId, participantBalance - share);
            });
        }
    });

    const finalBalances: Balance[] = [];
    balancesMap.forEach((amount, userId) => {
        const user = members.find(m => m.id === userId);
        if (user) {
            // Round to 2 decimal places to fix tiny float errors like -0.000000004
            const cleanAmount = Math.round(amount * 100) / 100;
            finalBalances.push({ user, amount: cleanAmount });
        }
    });

    return finalBalances.sort((a, b) => b.amount - a.amount);
};


export const calculateDebts = (transactions: Transaction[], members: User[]): Debt[] => {
    // We reuse calculateBalances logic to ensure consistency
    const balancesList = calculateBalances(transactions, members);
    
    const debtors: { userId: string, amount: number }[] = [];
    const creditors: { userId: string, amount: number }[] = [];

    balancesList.forEach(b => {
        if (b.amount < -0.01) debtors.push({ userId: b.user.id, amount: -b.amount });
        if (b.amount > 0.01) creditors.push({ userId: b.user.id, amount: b.amount });
    });
    
    // Sort by magnitude to optimize matching (simple heuristic)
    debtors.sort((a,b) => a.amount - b.amount);
    creditors.sort((a,b) => a.amount - b.amount);

    const debts: Debt[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];
        
        // The amount to settle is the minimum of what one owes and the other is owed
        // We round to 2 decimals to avoid hanging pennies
        let amount = Math.min(debtor.amount, creditor.amount);
        amount = Math.round(amount * 100) / 100;

        if (amount > 0) {
            const fromUser = members.find(m => m.id === debtor.userId);
            const toUser = members.find(m => m.id === creditor.userId);

            if (fromUser && toUser) {
                debts.push({
                    from: fromUser,
                    to: toUser,
                    amount: amount,
                });
            }
        }

        // Update remaining amounts
        debtor.amount -= amount;
        creditor.amount -= amount;

        // Move indices if settled (using small epsilon for float safety)
        if (debtor.amount < 0.01) debtorIndex++;
        if (creditor.amount < 0.01) creditorIndex++;
    }

    return debts;
};
