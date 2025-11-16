import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { salesStorage, refundsStorage, medicineStorage, Refund, Sale, RefundItem } from '@/lib/storage';
import { toast } from 'sonner';
import { Search, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { createAuditLog } from '@/lib/sync';

const Refunds = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [reason, setReason] = useState('');
  const [refundHistory, setRefundHistory] = useState<Refund[]>(refundsStorage.getAll());

  const handleSearch = () => {
    const sales = salesStorage.getAll();
    const found = sales.find(s => 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (found) {
      setSelectedSale(found);
      setRefundItems(found.items.map(item => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: 0,
        price: item.price,
        total: 0,
      })));
      toast.success('Sale found');
    } else {
      toast.error('Sale not found');
      setSelectedSale(null);
    }
  };

  const updateRefundQuantity = (index: number, quantity: number) => {
    const newItems = [...refundItems];
    const maxQty = selectedSale?.items[index].quantity || 0;
    const validQty = Math.min(Math.max(0, quantity), maxQty);
    
    newItems[index].quantity = validQty;
    newItems[index].total = validQty * newItems[index].price;
    setRefundItems(newItems);
  };

  const handleProcessRefund = () => {
    if (!selectedSale || !reason.trim()) {
      toast.error('Please select a sale and provide a reason');
      return;
    }

    const itemsToRefund = refundItems.filter(item => item.quantity > 0);
    
    if (itemsToRefund.length === 0) {
      toast.error('Please select items to refund');
      return;
    }

    const refundTotal = itemsToRefund.reduce((sum, item) => sum + item.total, 0);

    const newRefund: Refund = {
      id: crypto.randomUUID(),
      saleId: selectedSale.id,
      items: itemsToRefund,
      total: refundTotal,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };

    // Update medicine stock
    itemsToRefund.forEach(item => {
      medicineStorage.update(item.medicineId, {
        quantity: (medicineStorage.getAll().find(m => m.id === item.medicineId)?.quantity || 0) + item.quantity
      });
    });

    refundsStorage.add(newRefund);
    setRefundHistory(refundsStorage.getAll());
    
    // Create audit log
    createAuditLog(
      'Process Refund',
      'refund',
      newRefund.id,
      `Refund processed: Rs. ${refundTotal.toFixed(2)}, Sale ID: ${selectedSale.id.slice(0, 8)}, Reason: ${reason}`
    );
    
    toast.success(`Refund processed: Rs. ${refundTotal.toFixed(2)}`);
    
    // Reset form
    setSelectedSale(null);
    setRefundItems([]);
    setReason('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Refunds Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Search Sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by Sale ID or Customer Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedSale && (
        <Card>
          <CardHeader>
            <CardTitle>Process Refund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Sale ID:</span>
                <p className="font-medium">{selectedSale.id.slice(0, 8)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">{format(new Date(selectedSale.createdAt), 'PPp')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-medium">{selectedSale.customerName || 'Walk-in'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="font-medium">Rs. {selectedSale.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sold Qty</TableHead>
                    <TableHead>Refund Qty</TableHead>
                    <TableHead className="text-right">Refund Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSale.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.medicineName}</TableCell>
                      <TableCell>Rs. {item.price.toFixed(2)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={refundItems[index]?.quantity || 0}
                          onChange={(e) => updateRefundQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        Rs. {(refundItems[index]?.total || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Refund Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-lg font-semibold">
                Refund Total: Rs. {refundItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
              </div>
              <Button onClick={handleProcessRefund} size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Process Refund
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Refund History</CardTitle>
        </CardHeader>
        <CardContent>
          {refundHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No refunds processed yet</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundHistory.map((refund) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Refunds;
