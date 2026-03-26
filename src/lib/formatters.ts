export const formatKES = (amount: number): string => {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const calculateMaxLoanAmount = (marketValue: number): number => {
  return (marketValue * 0.70) * 0.50;
};

export const calculateTotalRepayment = (principal: number, durationMonths: number, rate: number = 13): number => {
  const totalInterest = principal * (rate / 100) * durationMonths;
  const platformFee = principal * 0.01;
  const insuranceFee = principal * 0.01;
  return principal + totalInterest + platformFee + insuranceFee;
};

export const calculateMonthlyInterest = (principal: number, rate: number = 13): number => {
  return principal * (rate / 100);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
    case 'pending_collateral':
    case 'under_review':
      return 'bg-warning text-warning-foreground';
    case 'verified':
    case 'active':
    case 'paid':
      return 'bg-success text-success-foreground';
    case 'rejected':
    case 'cancelled':
    case 'released':
      return 'bg-destructive text-destructive-foreground';
    case 'listed':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
