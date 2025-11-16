import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { salesStorage, expensesStorage, medicineStorage, refundsStorage } from '@/lib/storage';
import { DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { useAutoSync } from '@/hooks/useAutoSync';

type DateFilter = 'today' | '7days' | 'month' | 'all';

const Dashboard = () => {
  const { isOnline, isConfigured } = useAutoSync();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalStock: 0,
    totalRefunds: 0,
    lowStock: 0,
    expired: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [dateFilter]);

  const calculateStats = () => {
    const now = new Date();
    const filterDate = getFilterDate(dateFilter, now);

    const sales = salesStorage.getAll().filter(s => 
      dateFilter === 'all' || new Date(s.createdAt) >= filterDate
    );
    
    const refunds = refundsStorage.getAll().filter(r =>
      dateFilter === 'all' || new Date(r.createdAt) >= filterDate
    );
    
    const expenses = expensesStorage.getAll().filter(e =>
      dateFilter === 'all' || new Date(e.createdAt) >= filterDate
    );

    const medicines = medicineStorage.getAll();

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalRefunds = refunds.reduce((sum, refund) => sum + refund.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate actual profit: (salePrice - costPrice) × qtySold - expenses
    let actualProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medicineId);
        if (medicine) {
          const itemProfit = (item.price - medicine.costPrice) * item.quantity;
          actualProfit += itemProfit;
        }
      });
    });
    
    const totalProfit = actualProfit - totalRefunds - totalExpenses;

    const totalStock = medicines.reduce((sum, m) => sum + m.quantity, 0);
    const lowStock = medicines.filter(m => m.quantity <= m.reorderLevel).length;
    const expired = medicines.filter(m => new Date(m.expiry) < now).length;

    setStats({
      totalSales,
      totalProfit,
      totalStock,
      totalRefunds,
      lowStock,
      expired,
    });
  };

  const getFilterDate = (filter: DateFilter, now: Date): Date => {
    const date = new Date(now);
    switch (filter) {
      case 'today':
        date.setHours(0, 0, 0, 0);
        break;
      case '7days':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      default:
        return new Date(0);
    }
    return date;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full transition-all ${isOnline ? 'bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-destructive'}`} />
            <span className="text-sm text-muted-foreground font-medium">
              {isOnline ? 'Online' : 'Offline'} 
              {isConfigured && isOnline && ' • Auto-sync enabled'}
            </span>
          </div>
        </div>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-soft-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">Rs. {stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Refunds: Rs. {stats.totalRefunds.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-soft-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">Rs. {stats.totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              After refunds & expenses
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-soft-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Items</CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <Package className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalStock}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.lowStock} items low stock
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-soft-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerts</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.expired + stats.lowStock}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.expired} expired, {stats.lowStock} low stock
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
