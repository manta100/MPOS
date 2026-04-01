import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { itemsApi, categoriesApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Item {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  hasVariants: boolean;
  trackInventory: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  itemCount?: number;
}

interface Variant {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  stockQuantity?: number;
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [search, selectedCategory, pagination.page]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await itemsApi.getAll({
        search,
        categoryId: selectedCategory || undefined,
        page: pagination.page,
        limit: viewMode === 'grid' ? 24 : 50,
      });
      if (res.data.success) {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await itemsApi.delete(id);
      if (res.data.success) {
        toast.success('Item deleted');
        fetchItems();
      }
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchItems();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Items</h1>
          <p className="text-gray-500">Manage your product catalog</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Item
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 card p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="input pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-48"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''
            }`}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No items found
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="card p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => { setEditingItem(item); setShowModal(true); }}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <PhotoIcon className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.categoryName || 'Uncategorized'}</p>
                  <p className="font-semibold font-mono">${item.price.toFixed(2)}</p>
                  {item.trackInventory && (
                    <p className={`text-xs ${(item.stockQuantity || 0) <= (item.lowStockThreshold || 5) ? 'text-red-500' : 'text-gray-500'}`}>
                      Stock: {item.stockQuantity || 0}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="flex-1 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <TrashIcon className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
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
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <PhotoIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.hasVariants && (
                              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                                Has variants
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">{item.sku || '-'}</td>
                      <td className="px-6 py-4">
                        {item.categoryName ? (
                          <span className="inline-flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            {item.categoryName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-500">
                        {item.cost ? `$${item.cost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.trackInventory ? (
                          <span className={`font-mono ${(item.stockQuantity || 0) <= (item.lowStockThreshold || 5) ? 'text-red-500' : ''}`}>
                            {item.stockQuantity || 0}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingItem(item); setShowModal(true); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchItems(); }}
        />
      )}
    </div>
  );
}

function ItemModal({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: Item | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    sku: item?.sku || '',
    barcode: item?.barcode || '',
    price: item?.price?.toString() || '0',
    cost: item?.cost?.toString() || '',
    categoryId: item?.categoryId || '',
    imageUrl: item?.imageUrl || '',
    trackInventory: item?.trackInventory || false,
    lowStockThreshold: item?.lowStockThreshold?.toString() || '5',
    stockQuantity: item?.stockQuantity?.toString() || '0',
    isActive: item?.isActive ?? true,
    hasVariants: item?.hasVariants || false,
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'inventory' | 'variants'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...form,
        price: parseFloat(form.price) || 0,
        cost: form.cost ? parseFloat(form.cost) : null,
        trackInventory: form.trackInventory,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        stockQuantity: parseInt(form.stockQuantity) || 0,
      };

      if (item) {
        await itemsApi.update(item.id, data);
        toast.success('Item updated');
      } else {
        await itemsApi.create(data);
        toast.success('Item created');
      }
      onSave();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { id: `variant_${Date.now()}`, name: '', sku: '', price: parseFloat(form.price), cost: 0, stockQuantity: 0 },
    ]);
    setForm({ ...form, hasVariants: true });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
    if (updated.length === 0) {
      setForm({ ...form, hasVariants: false });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl m-4">
        <h2 className="text-xl font-bold mb-4">
          {item ? 'Edit Item' : 'Add Item'}
        </h2>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {['basic', 'inventory', 'variants'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Barcode</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input pl-8"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      className="input pl-8"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="trackInventory"
                  checked={form.trackInventory}
                  onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="trackInventory" className="text-sm font-medium">
                  Track inventory for this item
                </label>
              </div>

              {form.trackInventory && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Stock</label>
                      <input
                        type="number"
                        value={form.stockQuantity}
                        onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                      <input
                        type="number"
                        value={form.lowStockThreshold}
                        onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Item is active (available for sale)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Create variants for items with different sizes, colors, or options.
                </p>
                <button type="button" onClick={addVariant} className="btn-secondary flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Variant
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No variants added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Variant {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          className="input"
                          placeholder="Variant name (e.g., Small)"
                        />
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          className="input"
                          placeholder="SKU"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                          className="input"
                          placeholder="Price"
                        />
                        <input
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value))}
                          className="input"
                          placeholder="Stock"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
