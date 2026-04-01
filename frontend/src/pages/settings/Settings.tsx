import { useState, useEffect } from 'react';
import {
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UserGroupIcon,
  TagIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  currency: string;
  currencySymbol: string;
  decimalPlaces: number;
  taxIncluded: boolean;
  receiptPrinter: string;
  kitchenPrinter: string;
  autoLogout: number;
}

interface TaxSettings {
  taxes: Array<{
    id: string;
    name: string;
    rate: number;
    enabled: boolean;
    isDefault: boolean;
  }>;
}

interface ReceiptSettings {
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showBarcode: boolean;
  showQRCode: boolean;
  printReceipt: boolean;
  receiptWidth: number;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    currency: 'USD',
    currencySymbol: '$',
    decimalPlaces: 2,
    taxIncluded: false,
    receiptPrinter: '',
    kitchenPrinter: '',
    autoLogout: 15,
  });
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({ taxes: [] });
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    headerText: 'Thank you for your purchase!',
    footerText: 'Please come again',
    showLogo: true,
    showBarcode: true,
    showQRCode: false,
    printReceipt: true,
    receiptWidth: 80,
  });
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [storeRes, taxRes, receiptRes, paymentRes] = await Promise.all([
        api.get('/settings/store'),
        api.get('/settings/taxes'),
        api.get('/settings/receipt'),
        api.get('/payments'),
      ]);

      if (storeRes.data.success) {
        setStoreSettings(storeRes.data.data);
      }
      if (taxRes.data.success) {
        setTaxSettings(taxRes.data.data);
      }
      if (receiptRes.data.success) {
        setReceiptSettings(receiptRes.data.data);
      }
      if (paymentRes.data.success) {
        setPaymentMethods(paymentRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStoreSettings = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/settings/store', storeSettings);
      if (res.data.success) {
        toast.success('Store settings saved');
      }
    } catch (error) {
      toast.error('Failed to save store settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveTaxSettings = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/settings/taxes', taxSettings);
      if (res.data.success) {
        toast.success('Tax settings saved');
      }
    } catch (error) {
      toast.error('Failed to save tax settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveReceiptSettings = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/settings/receipt', receiptSettings);
      if (res.data.success) {
        toast.success('Receipt settings saved');
      }
    } catch (error) {
      toast.error('Failed to save receipt settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addTax = async () => {
    const newTax = {
      id: `tax_${Date.now()}`,
      name: 'New Tax',
      rate: 0,
      enabled: true,
      isDefault: false,
    };
    setTaxSettings({ ...taxSettings, taxes: [...taxSettings.taxes, newTax] });
  };

  const updateTax = (index: number, field: string, value: any) => {
    const updated = [...taxSettings.taxes];
    updated[index] = { ...updated[index], [field]: value };
    setTaxSettings({ ...taxSettings, taxes: updated });
  };

  const deleteTax = async (id: string) => {
    try {
      await api.delete(`/taxes/${id}`);
      setTaxSettings({ ...taxSettings, taxes: taxSettings.taxes.filter(t => t.id !== id) });
      toast.success('Tax deleted');
    } catch (error) {
      toast.error('Failed to delete tax');
    }
  };

  const addPaymentMethod = async (name: string) => {
    try {
      const res = await api.post('/payments', { name, type: 'CASH', enabled: true });
      if (res.data.success) {
        setPaymentMethods([...paymentMethods, res.data.data]);
        toast.success('Payment method added');
      }
    } catch (error) {
      toast.error('Failed to add payment method');
    }
  };

  const togglePaymentMethod = async (id: string, enabled: boolean) => {
    try {
      await api.put(`/payments/${id}`, { enabled });
      setPaymentMethods(paymentMethods.map(p => p.id === id ? { ...p, enabled } : p));
    } catch (error) {
      toast.error('Failed to update payment method');
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await api.delete(`/payments/${id}`);
      setPaymentMethods(paymentMethods.filter(p => p.id !== id));
      toast.success('Payment method deleted');
    } catch (error) {
      toast.error('Failed to delete payment method');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: BuildingStorefrontIcon },
    { id: 'taxes', label: 'Taxes', icon: ReceiptPercentIcon },
    { id: 'receipts', label: 'Receipts', icon: DocumentTextIcon },
    { id: 'payments', label: 'Payments', icon: CreditCardIcon },
    { id: 'employees', label: 'Employees', icon: UserGroupIcon },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500">Configure your store preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="card p-8 text-center text-gray-500">Loading settings...</div>
          ) : (
            <>
              {activeTab === 'general' && (
                <div className="card p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BuildingStorefrontIcon className="h-5 w-5" />
                    Store Information
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Store Name</label>
                      <input
                        type="text"
                        value={storeSettings.storeName}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Store Phone</label>
                      <input
                        type="tel"
                        value={storeSettings.storePhone}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Store Address</label>
                    <input
                      type="text"
                      value={storeSettings.storeAddress}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Store Email</label>
                    <input
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                      className="input"
                    />
                  </div>

                  <hr className="dark:border-gray-700" />

                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    Currency & Format
                  </h2>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Currency</label>
                      <select
                        value={storeSettings.currency}
                        onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                        className="input"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Symbol</label>
                      <input
                        type="text"
                        value={storeSettings.currencySymbol}
                        onChange={(e) => setStoreSettings({ ...storeSettings, currencySymbol: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Decimal Places</label>
                      <select
                        value={storeSettings.decimalPlaces}
                        onChange={(e) => setStoreSettings({ ...storeSettings, decimalPlaces: parseInt(e.target.value) })}
                        className="input"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="taxIncluded"
                      checked={storeSettings.taxIncluded}
                      onChange={(e) => setStoreSettings({ ...storeSettings, taxIncluded: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="taxIncluded" className="text-sm">
                      Prices include tax
                    </label>
                  </div>

                  <hr className="dark:border-gray-700" />

                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Cog6ToothIcon className="h-5 w-5" />
                    Hardware
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Receipt Printer</label>
                      <select
                        value={storeSettings.receiptPrinter}
                        onChange={(e) => setStoreSettings({ ...storeSettings, receiptPrinter: e.target.value })}
                        className="input"
                      >
                        <option value="">None</option>
                        <option value="epson_tm88">Epson TM-T88</option>
                        <option value="star_sp700">Star SP700</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Kitchen Printer</label>
                      <select
                        value={storeSettings.kitchenPrinter}
                        onChange={(e) => setStoreSettings({ ...storeSettings, kitchenPrinter: e.target.value })}
                        className="input"
                      >
                        <option value="">None</option>
                        <option value="epson_tm82">Epson TM-T82</option>
                        <option value="star_sp742">Star SP742</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Auto Logout (minutes)</label>
                    <select
                      value={storeSettings.autoLogout}
                      onChange={(e) => setStoreSettings({ ...storeSettings, autoLogout: parseInt(e.target.value) })}
                      className="input w-32"
                    >
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="0">Never</option>
                    </select>
                  </div>

                  <button
                    onClick={saveStoreSettings}
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}

              {activeTab === 'taxes' && (
                <div className="card p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <ReceiptPercentIcon className="h-5 w-5" />
                      Tax Rates
                    </h2>
                    <button onClick={addTax} className="btn-primary flex items-center gap-2">
                      Add Tax
                    </button>
                  </div>

                  <div className="space-y-4">
                    {taxSettings.taxes.map((tax, index) => (
                      <div key={tax.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={tax.name}
                            onChange={(e) => updateTax(index, 'name', e.target.value)}
                            className="input"
                            placeholder="Tax name"
                          />
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={tax.rate}
                              onChange={(e) => updateTax(index, 'rate', parseFloat(e.target.value))}
                              className="input pr-8"
                              placeholder="Rate"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={tax.enabled}
                            onChange={(e) => updateTax(index, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <label className="text-sm">Enabled</label>
                        </div>
                        <button
                          onClick={() => deleteTax(tax.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>

                  {taxSettings.taxes.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No taxes configured</p>
                  )}

                  <button
                    onClick={saveTaxSettings}
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? 'Saving...' : 'Save Tax Settings'}
                  </button>
                </div>
              )}

              {activeTab === 'receipts' && (
                <div className="card p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    Receipt Settings
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Header Text</label>
                      <input
                        type="text"
                        value={receiptSettings.headerText}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Footer Text</label>
                      <textarea
                        value={receiptSettings.footerText}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                        className="input"
                        rows={3}
                      />
                    </div>
                  </div>

                  <hr className="dark:border-gray-700" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showLogo"
                        checked={receiptSettings.showLogo}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, showLogo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="showLogo" className="text-sm">Show store logo on receipt</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showBarcode"
                        checked={receiptSettings.showBarcode}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, showBarcode: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="showBarcode" className="text-sm">Show barcode on receipt</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showQRCode"
                        checked={receiptSettings.showQRCode}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, showQRCode: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="showQRCode" className="text-sm">Show QR code on receipt</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="printReceipt"
                        checked={receiptSettings.printReceipt}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, printReceipt: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="printReceipt" className="text-sm">Auto-print receipts</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Receipt Width (mm)</label>
                    <select
                      value={receiptSettings.receiptWidth}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, receiptWidth: parseInt(e.target.value) })}
                      className="input w-32"
                    >
                      <option value="58">58mm</option>
                      <option value="80">80mm</option>
                    </select>
                  </div>

                  <button
                    onClick={saveReceiptSettings}
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? 'Saving...' : 'Save Receipt Settings'}
                  </button>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="card p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    Payment Methods
                  </h2>

                  <AddPaymentModal onAdd={addPaymentMethod} />

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={method.enabled}
                            onChange={(e) => togglePaymentMethod(method.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="font-medium">{method.name}</span>
                          <span className="text-sm text-gray-500">({method.type})</span>
                        </div>
                        <button
                          onClick={() => deletePaymentMethod(method.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>

                  {paymentMethods.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No payment methods configured</p>
                  )}
                </div>
              )}

              {activeTab === 'employees' && (
                <div className="card p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5" />
                    Employee Management
                  </h2>

                  <p className="text-gray-500">
                    Manage employee roles, permissions, and PIN codes from the Employees page.
                  </p>

                  <a href="/employees" className="btn-primary inline-flex items-center gap-2">
                    Go to Employees
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddPaymentModal({ onAdd }: { onAdd: (name: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name);
    setName('');
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary flex items-center gap-2">
        Add Payment Method
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="e.g., Credit Card"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
