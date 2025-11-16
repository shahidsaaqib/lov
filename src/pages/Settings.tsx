import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { settingsStorage, AppSettings } from '@/lib/storage';
import { toast } from 'sonner';
import { Building2, DollarSign, Receipt, Bell, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(settingsStorage.get());

  const handleSave = () => {
    settingsStorage.save(settings);
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    const defaultSettings = {
      businessName: 'Medical POS',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      taxNumber: '',
      defaultTaxRate: 5,
      enableTax: true,
      defaultDiscount: 0,
      maxDiscount: 100,
      lowStockThreshold: 10,
      expiryWarningDays: 30,
      enableStockAlerts: true,
      currencySymbol: 'Rs.',
      receiptHeader: 'Thank you for your purchase!',
      receiptFooter: 'Please visit again',
      showLogo: false,
    };
    setSettings(defaultSettings);
    settingsStorage.save(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  const updateField = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your application preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="tax">Tax & Discount</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Business Information</CardTitle>
              </div>
              <CardDescription>
                Configure your business details that will appear on receipts and invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  placeholder="Enter business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Address</Label>
                <Textarea
                  id="businessAddress"
                  value={settings.businessAddress}
                  onChange={(e) => updateField('businessAddress', e.target.value)}
                  placeholder="Enter business address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone Number</Label>
                  <Input
                    id="businessPhone"
                    value={settings.businessPhone}
                    onChange={(e) => updateField('businessPhone', e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => updateField('businessEmail', e.target.value)}
                    placeholder="business@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxNumber">GST/Tax Number</Label>
                <Input
                  id="taxNumber"
                  value={settings.taxNumber}
                  onChange={(e) => updateField('taxNumber', e.target.value)}
                  placeholder="Enter tax registration number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={(e) => updateField('currencySymbol', e.target.value)}
                  placeholder="Rs."
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle>Tax & Discount Settings</CardTitle>
              </div>
              <CardDescription>
                Configure default tax rates and discount policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Tax</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply tax to all sales transactions
                  </p>
                </div>
                <Switch
                  checked={settings.enableTax}
                  onCheckedChange={(checked) => updateField('enableTax', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultTaxRate}
                  onChange={(e) => updateField('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  disabled={!settings.enableTax}
                />
                <p className="text-sm text-muted-foreground">
                  This rate will be applied by default on all sales
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Default Discount (%)</Label>
                <Input
                  id="defaultDiscount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultDiscount}
                  onChange={(e) => updateField('defaultDiscount', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Default discount applied to sales (can be overridden)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Maximum Discount Allowed (%)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.maxDiscount}
                  onChange={(e) => updateField('maxDiscount', parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum discount that can be applied to any sale
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle>Receipt Settings</CardTitle>
              </div>
              <CardDescription>
                Customize how receipts and invoices appear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <Textarea
                  id="receiptHeader"
                  value={settings.receiptHeader}
                  onChange={(e) => updateField('receiptHeader', e.target.value)}
                  placeholder="Thank you message or header text"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <Textarea
                  id="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={(e) => updateField('receiptFooter', e.target.value)}
                  placeholder="Footer text or return policy"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Business Logo</Label>
                  <p className="text-sm text-muted-foreground">
                    Display logo on receipts (coming soon)
                  </p>
                </div>
                <Switch
                  checked={settings.showLogo}
                  onCheckedChange={(checked) => updateField('showLogo', checked)}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Inventory Alerts</CardTitle>
              </div>
              <CardDescription>
                Configure when to receive stock and expiry alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when stock runs low
                  </p>
                </div>
                <Switch
                  checked={settings.enableStockAlerts}
                  onCheckedChange={(checked) => updateField('enableStockAlerts', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={settings.lowStockThreshold}
                  onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 0)}
                  disabled={!settings.enableStockAlerts}
                />
                <p className="text-sm text-muted-foreground">
                  Alert when stock falls below this quantity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryWarningDays">Expiry Warning Period (days)</Label>
                <Input
                  id="expiryWarningDays"
                  type="number"
                  min="0"
                  value={settings.expiryWarningDays}
                  onChange={(e) => updateField('expiryWarningDays', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Alert when medicines will expire within this many days
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Alert Configuration</p>
                  <p className="text-sm text-muted-foreground">
                    These settings control when alerts appear in the dashboard and medicines page. 
                    Enable alerts to stay informed about inventory levels and upcoming expirations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
