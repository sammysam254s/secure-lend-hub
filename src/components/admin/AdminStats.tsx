import { Card, CardContent } from '@/components/ui/card';
import { Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { formatKES } from '@/lib/formatters';

interface AdminStatsProps {
  usersCount: number;
  loansCount: number;
  totalInvested: number;
  platformFees: number;
}

const AdminStats = ({ usersCount, loansCount, totalInvested, platformFees }: AdminStatsProps) => {
  const stats = [
    { label: 'Total Users', value: usersCount, icon: Users },
    { label: 'Total Loans', value: loansCount, icon: CreditCard },
    { label: 'Total Invested', value: formatKES(totalInvested), icon: TrendingUp },
    { label: 'Platform Fees', value: formatKES(platformFees), icon: DollarSign },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      {stats.map((s) => (
        <Card key={s.label} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <s.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
