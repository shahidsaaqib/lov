import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { medicineStorage, salesStorage, Sale, SaleItem, settingsStorage } from '@/lib/storage';
import { toast } from 'sonner';
import { Search, Plus, Trash2, ShoppingCart, Printer } from 'lucide-react';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import { createAuditLog } from '@/lib/sync';
import { useReactToPrint } from 'react-to-print';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const settings = settingsStorage.get();
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate);
  const [cashReceived, setCashReceived] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const medicines = medicineStorage.getAll().filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicineId: string) => {
    const medicine = medicineStorage.getAll().find(m => m.id === medicineId);
    if (!medicine) return;

    if (medicine.quantity <= 0) {
      toast.error('Medicine out of stock');
      return;
    }

    const existingItem = cart.find(item => item.medicineId === medicineId);
    if (existingItem) {
      if (existingItem.quantity >= medicine.quantity) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.medicineId === medicineId
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        medicineId,
        medicineName: medicine.name,
        quantity: 1,
        price: medicine.salePrice,
        total: medicine.salePrice,
      }]);
    }
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    const medicine = medicineStorage.getAll().find(m => m.id === medicineId);
    if (!medicine || quantity > medicine.quantity) {
      toast.error('Insufficient stock');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCart(cart.map(item =>
      item.medicineId === medicineId
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const tax = ((subtotal - discountAmount) * taxRate) / 100;
    const total = subtotal - discountAmount + tax;
    const change = cashReceived > 0 ? cashReceived - total : 0;

    return { subtotal, discountAmount, tax, total, change };
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const { subtotal, discountAmount, tax, total, change } = calculateTotals();

    const sale: Sale = {
      id: crypto.randomUUID(),
      items: cart,
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod: 'cash',
      customerName: customerName || undefined,
      isCredit,
      createdAt: new Date().toISOString(),
    };

    // Save sale
    salesStorage.add(sale);

    // Update stock
    cart.forEach(item => {
      const medicine = medicineStorage.getAll().find(m => m.id === item.medicineId);
      if (medicine) {
        medicineStorage.update(item.medicineId, {
          quantity: medicine.quantity - item.quantity,
        });
      }
    });

    // Create audit log
    createAuditLog(
      'Create Sale',
      'sale',
      sale.id,
      `Sale completed: Rs. ${sale.total.toFixed(2)}, ${sale.items.length} items, Customer: ${sale.customerName || 'Walk-in'}`
    );

    // Reset form
    setCart([]);
    setDiscount(0);
    setCashReceived(0);
    setCustomerName('');
    setIsCredit(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${lastSale?.id.slice(0, 8)}`,
  });

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchTerm && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {medicines.map(medicine => (
                    <div
                      key={medicine.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => addToCart(medicine.id)}
                    >
                      <div>
                        <p className="font-medium">{medicine.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {medicine.quantity} | Rs. {medicine.salePrice}
                        </p>
                      </div>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.medicineId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.medicineName}</p>
                        <p className="text-sm text-muted-foreground">Rs. {item.price} each</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.medicineId, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <div className="text-right w-24">
                        <p className="font-medium">Rs. {item.total.toFixed(2)}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeFromCart(item.medicineId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCredit"
                  checked={isCredit}
                  onChange={(e) => setIsCredit(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="isCredit">Credit Sale (Udhar)</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>Rs. {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="text-destructive">-Rs. {totals.discountAmount.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({taxRate}%):</span>
                  <span>Rs. {totals.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>Rs. {totals.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-3 pt-3 border-t">
                <div className="space-y-2">
                  <Label htmlFor="cashReceived">Cash Received</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    className="text-lg font-semibold"
                  />
                </div>
                
                {cashReceived > 0 && (
                  <div className="flex justify-between text-xl font-bold">
                    <span>Change:</span>
                    <span className={totals.change < 0 ? 'text-destructive' : 'text-primary'}>
                      Rs. {Math.abs(totals.change).toFixed(2)}
                      {totals.change < 0 && ' (Short)'}
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Complete Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Billing;
