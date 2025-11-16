import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { medicineStorage, Medicine } from '@/lib/storage';
import { Plus, Search, AlertCircle, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import MedicineDialog from '@/components/MedicineDialog';
import { Badge } from '@/components/ui/badge';
import { createAuditLog } from '@/lib/sync';

const Medicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = () => {
    const data = medicineStorage.getAll();
    setMedicines(data);
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingMedicine(null);
    setDialogOpen(true);
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      const medicine = medicines.find(m => m.id === id);
      medicineStorage.delete(id);
      loadMedicines();
      toast.success('Medicine deleted');
      
      if (medicine) {
        createAuditLog('Delete Medicine', 'medicine', id, `Deleted medicine: ${medicine.name}`);
      }
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        let imported = 0;
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.trim());
          const nameIndex = headers.indexOf('name');
          
          if (nameIndex === -1 || !values[nameIndex]) {
            skipped++;
            continue;
          }

          // Check for duplicates
          const existing = medicineStorage.getAll();
          if (existing.some(m => m.name.toLowerCase() === values[nameIndex].toLowerCase())) {
            skipped++;
            continue;
          }

          const newMedicine: Medicine = {
            id: crypto.randomUUID(),
            name: values[nameIndex],
            type: values[headers.indexOf('type')] || '',
            strength: values[headers.indexOf('strength')] || '',
            quantity: parseInt(values[headers.indexOf('quantity')] || '0') || 0,
            costPrice: parseFloat(values[headers.indexOf('costprice')] || '0') || 0,
            salePrice: parseFloat(values[headers.indexOf('saleprice')] || '0') || 0,
            expiry: values[headers.indexOf('expiry')] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reorderLevel: parseInt(values[headers.indexOf('reorderlevel')] || '10') || 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          medicineStorage.add(newMedicine);
          createAuditLog('Import Medicine', 'medicine', newMedicine.id, `Imported medicine: ${newMedicine.name} from CSV`);
          imported++;
        }

        loadMedicines();
        toast.success(`Imported ${imported} medicines. Skipped ${skipped} (duplicates or invalid).`);
      } catch (error) {
        toast.error('Failed to import CSV. Please check the format.');
        console.error('CSV import error:', error);
      }
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleCSVExport = () => {
    if (medicines.length === 0) {
      toast.error('No medicines to export');
      return;
    }

    const headers = ['name', 'type', 'strength', 'quantity', 'costPrice', 'salePrice', 'expiry', 'reorderLevel'];
    const csvContent = [
      headers.join(','),
      ...medicines.map(m => 
        `${m.name},${m.type},${m.strength},${m.quantity},${m.costPrice},${m.salePrice},${m.expiry},${m.reorderLevel}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `medicines_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Medicines exported to CSV');
  };

  const isExpired = (expiry: string) => new Date(expiry) < new Date();
  const isLowStock = (quantity: number, reorderLevel: number) => quantity <= reorderLevel;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Medicines</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={handleCSVExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMedicines.map((medicine) => (
          <Card key={medicine.id} className="relative">
            <CardHeader>
              <CardTitle className="text-lg flex items-start justify-between">
                <span>{medicine.name}</span>
                <div className="flex gap-1">
                  {isExpired(medicine.expiry) && (
                    <Badge variant="destructive" className="text-xs">
                      Expired
                    </Badge>
                  )}
                  {isLowStock(medicine.quantity, medicine.reorderLevel) && !isExpired(medicine.expiry) && (
                    <Badge variant="warning" className="text-xs bg-warning text-warning-foreground">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{medicine.type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Strength:</span>
                  <p className="font-medium">{medicine.strength}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <p className="font-medium">{medicine.quantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-medium">Rs. {medicine.salePrice}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Expiry:</span>
                  <p className="font-medium">{new Date(medicine.expiry).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(medicine)} className="flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(medicine.id)} className="flex-1">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMedicines.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No medicines found</p>
            <p className="text-sm text-muted-foreground">Add your first medicine to get started</p>
          </CardContent>
        </Card>
      )}

      <MedicineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        medicine={editingMedicine}
        onSave={loadMedicines}
      />
    </div>
  );
};

export default Medicines;
