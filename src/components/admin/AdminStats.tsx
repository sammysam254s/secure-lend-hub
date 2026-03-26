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
    { label: 'Total Users', value: usersCount, icon: Users, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Total Loans', value: loansCount, icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Total Invested', value: formatKES(totalInvested), icon: TrendingUp, color: 'bg-purple-500/10 text-purple-600' },
    { label: 'Platform Fees', value: formatKES(platformFees), icon: DollarSign, color: 'bg-amber-500/10 text-amber-600' },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((s) => (
        <Card key={s.label} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{s.label}</p>
              <p className="text-lg font-bold truncate">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
