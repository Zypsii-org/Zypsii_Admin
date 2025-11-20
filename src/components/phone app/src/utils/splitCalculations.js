export const calculateSplitBalances = (participants, expenses) => {
  if (!participants || !Array.isArray(participants)) {
    return { balances: [], totalGetBack: 0, totalSettle: 0 };
  }

  // Initialize balances for each participant
  const balances = participants
    .filter(participant => participant && participant.user && participant.user._id)
    .map(participant => ({
      userId: participant.user._id.toString(),
      name: participant.user.fullName || participant.user.email,
      paid: 0,
      share: 0,
      balance: 0,
      status: 'settled'
    }));

  // Calculate balances per expense
  if (expenses && Array.isArray(expenses)) {
    expenses.forEach(expense => {
      if (!expense || !expense.amount || !expense.paidBy) return;

      const payerId = typeof expense.paidBy === 'object' && expense.paidBy.user 
        ? expense.paidBy.user.toString() 
        : expense.paidBy.toString();

      // Handle different split types
      if (expense.splitType === 'EQUAL') {
        // Equal split among all participants
        const sharePerPerson = expense.amount / balances.length;
        
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
            balance.share += sharePerPerson;
          } else {
            balance.share += sharePerPerson;
          }
        });
      } else if (expense.splitType === 'EXACT' && expense.splitDetails) {
        // Exact amounts specified
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
          }
          
          // Find this user's share in splitDetails
          const userSplit = expense.splitDetails.find(
            split => split.user.toString() === balance.userId
          );
          if (userSplit) {
            balance.share += userSplit.amount;
          }
        });
      } else if (expense.splitType === 'PERCENTAGE' && expense.splitDetails) {
        // Percentage-based split
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
          }
          
          // Find this user's percentage in splitDetails
          const userSplit = expense.splitDetails.find(
            split => split.user.toString() === balance.userId
          );
          if (userSplit && userSplit.percentage) {
            balance.share += (expense.amount * userSplit.percentage) / 100;
          }
        });
      } else if (expense.splitType === 'SHARES' && expense.splitDetails) {
        // Shares-based split
        const totalShares = expense.splitDetails.reduce((sum, split) => sum + (split.shares || 0), 0);
        
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
          }
          
          // Find this user's shares in splitDetails
          const userSplit = expense.splitDetails.find(
            split => split.user.toString() === balance.userId
          );
          if (userSplit && userSplit.shares && totalShares > 0) {
            balance.share += (expense.amount * userSplit.shares) / totalShares;
          }
        });
      }
    });
  }

  // Calculate final balances
  balances.forEach(balance => {
    balance.balance = balance.paid - balance.share;
    balance.status = balance.balance > 0 ? 'getBack' : balance.balance < 0 ? 'owe' : 'settled';
  });

  // Calculate total amounts
  const totalGetBack = balances
    .filter(balance => balance.status === 'getBack')
    .reduce((sum, balance) => sum + balance.balance, 0);

  const totalSettle = balances
    .filter(balance => balance.status === 'owe')
    .reduce((sum, balance) => sum + Math.abs(balance.balance), 0);

  return {
    balances,
    totalGetBack,
    totalSettle
  };
};

// Calculate overall balance summary from backend balance data
export const calculateBalanceSummary = (balances) => {
  if (!balances || !Array.isArray(balances)) {
    return {
      totalOwing: 0,
      totalOwed: 0,
      settleAmount: 0,
      getBackAmount: 0,
      netBalance: 0
    };
  }

  // Aggregate balances by user
  const userBalances = new Map();
  
  balances.forEach(balance => {
    // Determine which user is the "other" user in this balance
    const currentUserId = balance.user?._id?.toString() || balance.user;
    const otherUserId = balance.otherUser?._id?.toString() || balance.otherUser;
    
    // Skip if we can't determine the users
    if (!currentUserId || !otherUserId) return;
    
    // The balance.amount represents the amount from the perspective of balance.user
    // If balance.user is the current user, then:
    // - Positive amount means current user is owed money by otherUser
    // - Negative amount means current user owes money to otherUser
    const amount = balance.amount || 0;
    
    if (!userBalances.has(otherUserId)) {
      userBalances.set(otherUserId, {
        userId: otherUserId,
        userName: balance.otherUser?.fullName || balance.otherUser?.userName || 'Unknown User',
        amount: 0
      });
    }
    
    // Add the balance amount (this will be aggregated across all balance records)
    userBalances.get(otherUserId).amount += amount;
  });

  // Calculate summary amounts
  let totalOwing = 0;
  let totalOwed = 0;
  
  userBalances.forEach(balance => {
    if (balance.amount < 0) {
      // Current user owes this person
      totalOwing += Math.abs(balance.amount);
    } else if (balance.amount > 0) {
      // Current user is owed by this person
      totalOwed += balance.amount;
    }
  });

  // PhonePe Split Logic:
  // Settle Amount = How much you still need to pay (if any)
  // Get Back Amount = How much you should get back (calculated from backend)
  // Note: Frontend should use backend calculation for accurate PhonePe Split logic
  const settleAmount = totalOwing;
  const getBackAmount = totalOwed; // This will be overridden by backend calculation
  const netBalance = getBackAmount - settleAmount;

  return {
    totalOwing: parseFloat(totalOwing.toFixed(2)),
    totalOwed: parseFloat(totalOwed.toFixed(2)),
    settleAmount: parseFloat(settleAmount.toFixed(2)),
    getBackAmount: parseFloat(getBackAmount.toFixed(2)),
    netBalance: parseFloat(netBalance.toFixed(2))
  };
};

// Calculate group-specific balances
export const calculateGroupBalances = (groupMembers, groupExpenses) => {
  if (!groupMembers || !Array.isArray(groupMembers)) {
    return { balances: [], totalGetBack: 0, totalSettle: 0 };
  }

  // Initialize balances for each group member
  const balances = groupMembers
    .filter(member => member && member.user && member.user._id)
    .map(member => ({
      userId: member.user._id.toString(),
      name: member.user.fullName || member.user.email,
      paid: 0,
      share: 0,
      balance: 0,
      status: 'settled'
    }));

  // Calculate balances per expense
  if (groupExpenses && Array.isArray(groupExpenses)) {
    groupExpenses.forEach(expense => {
      if (!expense || !expense.amount) return;

      const payerId = typeof expense.paidBy === 'object' && expense.paidBy.user 
        ? expense.paidBy.user.toString() 
        : expense.paidBy.toString();

      // Handle different split types
      if (expense.splitType === 'EQUAL') {
        const sharePerPerson = expense.amount / balances.length;
        
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
            balance.share += sharePerPerson;
          } else {
            balance.share += sharePerPerson;
          }
        });
      } else if (expense.splitType === 'EXACT' && expense.splitDetails) {
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
          }
          
          const userSplit = expense.splitDetails.find(
            split => split.user.toString() === balance.userId
          );
          if (userSplit) {
            balance.share += userSplit.amount;
          }
        });
      } else if (expense.splitType === 'PERCENTAGE' && expense.splitDetails) {
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
          }
          
          const userSplit = expense.splitDetails.find(
            split => split.user.toString() === balance.userId
          );
          if (userSplit && userSplit.percentage) {
            balance.share += (expense.amount * userSplit.percentage) / 100;
          }
        });
      } else if (expense.splitType === 'SHARES' && expense.splitDetails) {
        const totalShares = expense.splitDetails.reduce((sum, split) => sum + (split.shares || 0), 0);
        
        balances.forEach(balance => {
          if (balance.userId === payerId) {
            balance.paid += expense.amount;
          }
          
          const userSplit = expense.splitDetails.find(
            split => split.user.toString() === balance.userId
          );
          if (userSplit && userSplit.shares && totalShares > 0) {
            balance.share += (expense.amount * userSplit.shares) / totalShares;
          }
        });
      }
    });
  }

  // Calculate final balances
  balances.forEach(balance => {
    balance.balance = balance.paid - balance.share;
    balance.status = balance.balance > 0 ? 'getBack' : balance.balance < 0 ? 'owe' : 'settled';
  });

  // Calculate total amounts
  const totalGetBack = balances
    .filter(balance => balance.status === 'getBack')
    .reduce((sum, balance) => sum + balance.balance, 0);

  const totalSettle = balances
    .filter(balance => balance.status === 'owe')
    .reduce((sum, balance) => sum + Math.abs(balance.balance), 0);

  return {
    balances,
    totalGetBack,
    totalSettle
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}; 