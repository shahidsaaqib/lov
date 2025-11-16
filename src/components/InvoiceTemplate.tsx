/* ==== INVOICE PRINT TEMPLATE ==== */

import { forwardRef } from 'react';
import { Sale } from '@/lib/storage';
import { format } from 'date-fns';

interface InvoiceTemplateProps {
  sale: Sale;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ sale }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold">Medical POS System</h1>
          <p className="text-sm mt-2">Your Trusted Pharmacy Partner</p>
          <p className="text-xs mt-1">Contact: +1234567890 | Email: info@medicalpos.com</p>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold">Invoice No:</p>
            <p className="text-sm">{sale.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Date:</p>
            <p className="text-sm">{format(new Date(sale.createdAt), 'dd MMM yyyy HH:mm')}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Customer:</p>
            <p className="text-sm">{sale.customerName || 'Walk-in Customer'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Payment Method:</p>
            <p className="text-sm capitalize">{sale.paymentMethod}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 text-sm">#</th>
              <th className="text-left py-2 text-sm">Medicine</th>
              <th className="text-center py-2 text-sm">Qty</th>
              <th className="text-right py-2 text-sm">Price</th>
              <th className="text-right py-2 text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-2 text-sm">{index + 1}</td>
                <td className="py-2 text-sm">{item.medicineName}</td>
                <td className="text-center py-2 text-sm">{item.quantity}</td>
                <td className="text-right py-2 text-sm">Rs. {item.price.toFixed(2)}</td>
                <td className="text-right py-2 text-sm">Rs. {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>Rs. {sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Discount:</span>
              <span>-Rs. {sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Tax (5%):</span>
            <span>Rs. {sale.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2">
            <span>Total:</span>
            <span>Rs. {sale.total.toFixed(2)}</span>
          </div>
          {sale.isCredit && (
            <div className="text-center mt-2">
              <span className="bg-yellow-200 px-3 py-1 text-sm font-semibold">
                CREDIT SALE
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-xs">Thank you for your business!</p>
          <p className="text-xs mt-1">
            No returns without this invoice. Valid for 7 days from purchase date.
          </p>
          <p className="text-xs mt-2 font-semibold">
            This is a computer-generated invoice and does not require a signature.
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

/* ==== END OF INVOICE PRINT TEMPLATE ==== */
