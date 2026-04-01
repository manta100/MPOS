import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { itemsApi, inventoryApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Item {
  id: string;
  name: string;
  sku?: string;
  price: string;
  category?: { name: string };
  variants: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    price: string;
  }>;
  trackInventory: boolean;
  lowStockThreshold: number;
}

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'all' | 'low'>('all');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [adjustment, setAdjustment] = useState({ quantity: 0, reason: '', type: 'ADJUSTMENT' });

  useEffect(() => {
    fetchInventory();
  }, [search, view]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await itemsApi.getAll({ search, limit: 100 });
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockItems = items.filter((item) => {
    if (item.variants.length > 0) {
      return item.variants.some((v) => v.stockQuantity <= item.lowStockThreshold);
    }
    return false;
  });

  const displayedItems = view === 'low' ? lowStockItems : items;

  const handleAdjust = async (item: Item, variantId?: string) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  const submitAdjustment = async () => {
    if (!selectedItem) return;
    
    try {
      await inventoryApi.adjustStock(selectedItem.id, {
        quantity: adjustment.quantity,
        reason: adjustment.reason,
      });
      toast.success('Inventory adjusted');
      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustment({ quantity: 0, reason: '', type: 'ADJUSTMENT' });
      fetchInventory();
    } catch (error) {
      toast.error('Failed to adjust inventory');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-gray-500">Track and manage stock levels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-xl font-bold">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-xl font-bold">
                {items.filter((i) => i.variants.every((v) => v.stockQuantity > 0)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-red-600">{lowStockItems.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-yellow-600">
                {items.filter((i) => i.variants.some((v) => v.stockQuantity <= 0)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'all' ? 'bg-white dark:bg-gray-600 shadow' : ''
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setView('low')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'low' ? 'bg-white dark:bg-gray-600 shadow' : ''
            }`}
          >
            Low Stock
          </button>
        </div>
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {view === 'low' ? 'No low stock items' : 'No items found'}
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          📦
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{item.sku || '-'}</td>
                    <td className="px-6 py-4">{item.category?.name || '-'}</td>
                    <td className="px-6 py-4">
                      {item.variants.length > 0 ? (
                        <div className="space-y-1">
                          {item.variants.slice(0, 2).map((v) => (
                            <div key={v.id} className="text-sm">
                              {v.name}: <span className="font-mono">{v.stockQuantity}</span>
                            </div>
                          ))}
                          {item.variants.length > 2 && (
                            <div className="text-sm text-gray-500">+{item.variants.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No variants</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.variants.length > 0 ? (
                        item.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.variants.some((v) => v.stockQuantity <= 0) ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                          Out of Stock
                        </span>
                      ) : item.variants.some((v) => v.stockQuantity <= item.lowStockThreshold) ? (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleAdjust(item)}
                        className="btn-secondary text-sm"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Adjust Inventory</h2>
            <p className="text-gray-500 mb-4">{selectedItem.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                <select
                  value={adjustment.type}
                  onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
                  className="input"
                >
                  <option value="ADJUSTMENT">Manual Adjustment</option>
                  <option value="PURCHASE">Purchase/Receive</option>
                  <option value="DAMAGE">Damage/Loss</option>
                  <option value="RETURN">Return</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity Change</label>
                <input
                  type="number"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
                  className="input"
                  placeholder="Enter positive to add, negative to subtract"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                  className="input"
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdjustModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={submitAdjustment} className="btn-primary flex-1">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
