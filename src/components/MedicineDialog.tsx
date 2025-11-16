import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { medicineStorage, Medicine } from '@/lib/storage';
import { toast } from 'sonner';
import { createAuditLog } from '@/lib/sync';

interface MedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: Medicine | null;
  onSave: () => void;
}

const MedicineDialog = ({ open, onOpenChange, medicine, onSave }: MedicineDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    strength: '',
    quantity: 0,
    costPrice: 0,
    salePrice: 0,
    expiry: '',
    reorderLevel: 10,
  });

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name,
        type: medicine.type,
        strength: medicine.strength,
        quantity: medicine.quantity,
        costPrice: medicine.costPrice,
        salePrice: medicine.salePrice,
        expiry: medicine.expiry,
        reorderLevel: medicine.reorderLevel,
      });
    } else {
      setFormData({
        name: '',
        type: '',
        strength: '',
        quantity: 0,
        costPrice: 0,
        salePrice: 0,
        expiry: '',
        reorderLevel: 10,
      });
    }
  }, [medicine, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Medicine name is required');
      return;
    }

    // Check for duplicates
    const existing = medicineStorage.getAll();
    const duplicate = existing.find(
      m => m.name.toLowerCase() === formData.name.toLowerCase() && m.id !== medicine?.id
    );

    if (duplicate) {
      toast.error('Medicine with this name already exists');
      return;
    }

    if (medicine) {
      // Update existing
      medicineStorage.update(medicine.id, formData);
      toast.success('Medicine updated');
      createAuditLog('Update Medicine', 'medicine', medicine.id, `Updated medicine: ${formData.name}`);
    } else {
      // Add new
      const newMedicine: Medicine = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      medicineStorage.add(newMedicine);
      toast.success('Medicine added');
      createAuditLog('Add Medicine', 'medicine', newMedicine.id, `Added new medicine: ${formData.name}`);
    }

    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{medicine ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
          <DialogDescription>
            {medicine ? 'Update the medicine information below.' : 'Fill in the details to add a new medicine to inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Tablet, Syrup, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="500mg, 10ml, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (Rs.)</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (Rs.)</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={formData.expiry}
                onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {medicine ? 'Update' : 'Add'} Medicine
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineDialog;
