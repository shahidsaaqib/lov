import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { salesStorage, refundsStorage, expensesStorage, medicineStorage } from '@/lib/storage';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

const Reports = () => {
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  });

  const sales = salesStorage.getAll();
  const refunds = refundsStorage.getAll();
  const expenses = expensesStorage.getAll();
  const medicines = medicineStorage.getAll();

  const filterByDate = <T extends { createdAt: string }>(items: T[]) => {
    if (!dateFilter.from && !dateFilter.to) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.createdAt);
      const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
      const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
      
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const exportSales = () => {
    const filtered = filterByDate(sales);
    const data = filtered.flatMap(sale =>
      sale.items.map(item => ({
        date: format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm'),
        saleId: sale.id.slice(0, 8),
        customer: sale.customerName || 'Walk-in',
        medicine: item.medicineName,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: item.total.toFixed(2),
        paymentMethod: sale.paymentMethod,
        isCredit: sale.isCredit ? 'Yes' : 'No',
      }))
    );
    
    exportToCSV(data, 'sales_report', [
      'date', 'saleId', 'customer', 'medicine', 'quantity', 'price', 'total', 'paymentMethod', 'isCredit'
    ]);
  };

  const exportRefunds = () => {
    const filtered = filterByDate(refunds);
    const data = filtered.flatMap(refund =>
      refund.items.map(item => ({
        date: format(new Date(refund.createdAt), 'yyyy-MM-dd HH:mm'),
        refundId: refund.id.slice(0, 8),
        saleId: refund.saleId.slice(0, 8),
        medicine: item.medicineName,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: item.total.toFixed(2),
        reason: refund.reason,
      }))
    );
    
    exportToCSV(data, 'refunds_report', [
      'date', 'refundId', 'saleId', 'medicine', 'quantity', 'price', 'total', 'reason'
    ]);
  };

  const exportExpenses = () => {
    const filtered = expenses.filter(exp => {
      if (!dateFilter.from && !dateFilter.to) return true;
      const expDate = new Date(exp.date);
      const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
      const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
      if (fromDate && expDate < fromDate) return false;
      if (toDate && expDate > toDate) return false;
      return true;
    });

    const data = filtered.map(exp => ({
      date: format(new Date(exp.date), 'yyyy-MM-dd'),
      category: exp.type,
      amount: exp.amount.toFixed(2),
      note: exp.note || '',
    }));
    
    exportToCSV(data, 'expenses_report', ['date', 'category', 'amount', 'note']);
  };

  const exportMedicines = () => {
    const data = medicines.map(med => ({
      name: med.name,
      type: med.type,
      strength: med.strength,
      quantity: med.quantity,
      costPrice: med.costPrice.toFixed(2),
      salePrice: med.salePrice.toFixed(2),
      expiry: format(new Date(med.expiry), 'yyyy-MM-dd'),
      reorderLevel: med.reorderLevel,
    }));
    
    exportToCSV(data, 'medicines_inventory', [
      'name', 'type', 'strength', 'quantity', 'costPrice', 'salePrice', 'expiry', 'reorderLevel'
    ]);
  };

  const filteredSales = filterByDate(sales);
  const filteredRefunds = filterByDate(refunds);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      <Card>
        <CardHeader>
          <CardTitle>Date Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Report</CardTitle>
              <Button onClick={exportSales}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {filteredSales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">{filteredSales.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">
                        Rs. {filteredSales.reduce((sum, s) => sum + s.total, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Items Sold</p>
                      <p className="text-2xl font-bold">
                        {filteredSales.reduce((sum, s) => sum + s.items.reduce((qty, i) => qty + i.quantity, 0), 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{format(new Date(sale.createdAt), 'PP')}</TableCell>
                            <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                            <TableCell>{sale.items.length} item(s)</TableCell>
                            <TableCell>{sale.paymentMethod}</TableCell>
                            <TableCell className="text-right font-medium">Rs. {sale.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Refunds Report</CardTitle>
              <Button onClick={exportRefunds}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {filteredRefunds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No refunds data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Total Refunds</p>
                      <p className="text-2xl font-bold">{filteredRefunds.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Refunded Amount</p>
                      <p className="text-2xl font-bold text-destructive">
                        Rs. {filteredRefunds.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Sale ID</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRefunds.map((refund) => (
                          <TableRow key={refund.id}>
                            <TableCell>{format(new Date(refund.createdAt), 'PP')}</TableCell>
                            <TableCell className="font-mono text-sm">{refund.saleId.slice(0, 8)}</TableCell>
                            <TableCell>{refund.items.length} item(s)</TableCell>
                            <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                            <TableCell className="text-right font-medium">Rs. {refund.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expenses Report</CardTitle>
              <Button onClick={exportExpenses}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">
                View detailed expenses in the Expenses page
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Report</CardTitle>
              <Button onClick={exportMedicines}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">
                View detailed inventory in the Medicines page
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
