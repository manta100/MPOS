import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  CreditCardIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useCartStore } from '../../stores/cartStore';
import { itemsApi, categoriesApi, ticketsApi, customersApi, paymentsApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  color?: string;
  _count?: { items: number };
}

interface Item {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  barcode?: string;
  category?: Category;
  hasModifiers?: boolean;
  hasVariants?: boolean;
  variants?: Variant[];
  modifierGroups?: ModifierGroup[];
}

interface Variant {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

export default function POS() {
  const {
    items: cartItems,
    customer,
    diningOption,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    addItem,
    updateItemQuantity,
    removeItem,
    setCustomer,
    setDiningOption,
    clearCart,
    setTicketId,
  } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHoldList, setShowHoldList] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [heldTickets, setHeldTickets] = useState<any[]>([]);

  // Fetch categories
  useEffect(() => {
    categoriesApi.getAll().then((res) => {
      if (res.data.success) {
        setCategories(res.data.data);
      }
    });
  }, []);

  // Fetch items
  useEffect(() => {
    const params: any = {};
    if (selectedCategory) params.categoryId = selectedCategory;
    if (search) params.search = search;

    itemsApi.getAll(params).then((res) => {
      if (res.data.success) {
        setItems(res.data.data);
      }
    });
  }, [selectedCategory, search]);

  // Fetch payments
  useEffect(() => {
    paymentsApi.getAll().then((res) => {
      if (res.data.success) {
        setPayments(res.data.data);
      }
    });
  }, []);

  // Fetch held tickets
  useEffect(() => {
    ticketsApi.getAll({ status: 'HOLD' }).then((res) => {
      if (res.data.success) {
        setHeldTickets(res.data.data);
      }
    });
  }, []);

  // Customer search
  useEffect(() => {
    if (customerSearch.length > 2) {
      customersApi.getAll({ search: customerSearch }).then((res) => {
        if (res.data.success) {
          setCustomers(res.data.data);
        }
      });
    }
  }, [customerSearch]);

  // Handle add item to cart - check for modifiers/variants first
  const handleItemClick = (item: Item) => {
    if (item.hasModifiers || (item.modifierGroups && item.modifierGroups.length > 0)) {
      setSelectedItem(item);
      setSelectedVariant(null);
      setSelectedModifiers([]);
      setShowModifierModal(true);
    } else if (item.hasVariants || (item.variants && item.variants.length > 0)) {
      setSelectedItem(item);
      setSelectedVariant(item.variants?.[0] || null);
      setSelectedModifiers([]);
      setShowModifierModal(true);
    } else {
      addItem({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl,
      });
      toast.success(`Added ${item.name}`);
    }
  };

  // Confirm item with modifiers/variants
  const handleConfirmItem = () => {
    if (!selectedItem) return;
    
    let finalPrice = selectedItem.price;
    if (selectedVariant) {
      finalPrice = selectedVariant.price;
    }
    const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
    finalPrice += modifierTotal;

    addItem({
      itemId: selectedItem.id,
      variantId: selectedVariant?.id,
      name: selectedItem.name + (selectedVariant ? ` (${selectedVariant.name})` : ''),
      price: finalPrice,
      quantity: 1,
      imageUrl: selectedItem.imageUrl,
      modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
    });
    
    toast.success(`Added ${selectedItem.name}`);
    setShowModifierModal(false);
    setSelectedItem(null);
    setSelectedVariant(null);
    setSelectedModifiers([]);
  };

  // Toggle modifier selection
  const toggleModifier = (modifier: Modifier, group: ModifierGroup) => {
    const isSelected = selectedModifiers.some((m) => m.id === modifier.id);
    
    if (isSelected) {
      setSelectedModifiers(selectedModifiers.filter((m) => m.id !== modifier.id));
    } else {
      // Check max selections
      const groupModifiers = selectedModifiers.filter((m) => 
        selectedItem?.modifierGroups?.some((g) => g.id === group.id && g.modifiers.some((gm) => gm.id === m.id))
      );
      if (group.maxSelections <= groupModifiers.length) {
        toast.error(`Maximum ${group.maxSelections} selection(s) allowed`);
        return;
      }
      setSelectedModifiers([...selectedModifiers, modifier]);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && search.length > 0) {
      itemsApi.getByBarcode(search).then((res) => {
        if (res.data.success) {
          handleItemClick(res.data.data);
        } else {
          toast.error('Item not found');
        }
        setSearch('');
      });
    }
  }, [search]);

  useEffect(() => {
    window.addEventListener('keypress', handleBarcodeScan);
    return () => window.removeEventListener('keypress', handleBarcodeScan);
  }, [handleBarcodeScan]);

  // Handle payment
  const handlePayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const payment = payments.find((p) => p.isDefault) || payments[0];
    if (!payment) {
      toast.error('No payment method configured');
      return;
    }

    toast.success('Payment processed!');
    clearCart();
    setShowPaymentModal(false);
  };

  // Handle hold ticket
  const handleHoldTicket = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      // Create ticket first, then hold it
      const ticketData = {
        customerId: customer?.id,
        diningOption,
        notes: '',
      };
      
      const res = await ticketsApi.create(ticketData);
      if (res.data.success) {
        const ticketId = res.data.data.id;
        
        // Add all items to the ticket
        for (const item of cartItems) {
          await ticketsApi.addItem(ticketId, {
            itemId: item.itemId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.price,
            notes: item.notes,
            modifiers: item.modifiers?.map(m => m.id) || [],
          });
        }
        
        // Hold the ticket
        await ticketsApi.hold(ticketId);
        
        toast.success('Ticket held');
        clearCart();
        
        // Refresh held tickets
        const heldRes = await ticketsApi.getAll({ status: 'HOLD' });
        if (heldRes.data.success) {
          setHeldTickets(heldRes.data.data);
        }
      }
    } catch (error) {
      console.error('Hold ticket error:', error);
      toast.error('Failed to hold ticket');
    }
  };

  // Recall held ticket
  const handleRecallTicket = async (ticketId: string) => {
    try {
      const res = await ticketsApi.getById(ticketId);
      if (res.data.success) {
        const ticket = res.data.data;
        
        // Load ticket items into cart
        setTicketId(ticket.id);
        if (ticket.customer) {
          setCustomer(ticket.customer);
        }
        if (ticket.diningOption) {
          setDiningOption(ticket.diningOption);
        }
        
        // Add items to cart
        for (const item of ticket.items) {
          addItem({
            itemId: item.itemId || '',
            variantId: item.variantId,
            name: item.name,
            price: item.unitPrice.toNumber(),
            quantity: item.quantity,
            modifiers: item.modifiers?.map((m: any) => ({
              id: m.modifierId,
              name: m.name,
              priceAdjustment: m.priceAdjustment.toNumber(),
            })),
          });
        }
        
        toast.success('Ticket recalled');
        setShowHoldList(false);
        
        // Remove from held list (reopen it)
        await ticketsApi.reopen(ticketId);
        
        const heldRes = await ticketsApi.getAll({ status: 'HOLD' });
        if (heldRes.data.success) {
          setHeldTickets(heldRes.data.data);
        }
      }
    } catch (error) {
      console.error('Recall ticket error:', error);
      toast.error('Failed to recall ticket');
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Items */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search & Dining Options */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items or scan barcode..."
              className="input pl-10"
            />
          </div>
          <select
            value={diningOption}
            onChange={(e) => setDiningOption(e.target.value as any)}
            className="input w-40"
          >
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEOUT">Takeout</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={selectedCategory === cat.id ? {} : { borderLeft: cat.color ? `3px solid ${cat.color}` : undefined }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="card p-3 hover:shadow-md transition-shadow text-left"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                  {(item.hasModifiers || item.hasVariants) && (
                    <div className="absolute top-1 right-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">
                      {item.hasModifiers ? 'MOD' : 'VAR'}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-sm font-mono text-primary-600 dark:text-primary-400">
                  ${item.price.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5" />
              <h2 className="font-semibold">Current Order</h2>
            </div>
            <button
              onClick={() => setShowHoldList(!showHoldList)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Held ({heldTickets.length})
            </button>
          </div>

          {/* Customer */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className="mt-3 w-full flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <UserIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {customer ? customer.name : 'Add Customer'}
            </span>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-sm font-mono text-gray-500">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax (8%)</span>
            <span className="font-mono">${taxAmount.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span className="font-mono">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span className="font-mono">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
          <button
            onClick={handleHoldTicket}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Hold
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cartItems.length === 0}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="h-5 w-5" />
            Pay ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Payment</h3>
            <div className="space-y-4">
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-4xl font-bold font-mono">${total.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                {payments.map((payment) => (
                  <button
                    key={payment.id}
                    className={`w-full p-3 rounded-lg border-2 transition-colors ${
                      payment.isDefault
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    }`}
                  >
                    <span>{payment.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handlePayment} className="btn-primary flex-1">
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Select Customer</h3>
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="input mb-4"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              autoFocus
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => { setCustomer(null); setShowCustomerModal(false); setCustomerSearch(''); }}
                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                Walk-in Customer
              </button>
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCustomer({ id: c.id, name: c.name, phone: c.phone, loyaltyPoints: c.loyaltyPoints });
                    setShowCustomerModal(false);
                    setCustomerSearch('');
                    toast.success(`Customer: ${c.name}`);
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone || 'No phone'}</p>
                  </div>
                  <span className="text-sm text-primary-600">{c.loyaltyPoints || 0} pts</span>
                </button>
              ))}
              {customerSearch.length > 2 && customers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No customers found</p>
              )}
            </div>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="btn-secondary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modifier/Variant Selection Modal */}
      {showModifierModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedItem.name}</h3>
              <button onClick={() => setShowModifierModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Variants Selection */}
            {selectedItem.variants && selectedItem.variants.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Select Size/Variant</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedItem.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                      }`}
                    >
                      <span className="block font-medium">{variant.name}</span>
                      <span className="text-sm text-gray-500">${variant.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers Selection */}
            {selectedItem.modifierGroups && selectedItem.modifierGroups.map((group) => (
              <div key={group.id} className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  {group.name}
                  {group.minSelections > 0 && <span className="text-red-500"> *</span>}
                </p>
                <div className="space-y-2">
                  {group.modifiers.map((modifier) => {
                    const isSelected = selectedModifiers.some((m) => m.id === modifier.id);
                    return (
                      <button
                        key={modifier.id}
                        onClick={() => toggleModifier(modifier, group)}
                        className={`w-full p-3 rounded-lg border-2 transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                        }`}
                      >
                        <span>{modifier.name}</span>
                        {modifier.priceAdjustment > 0 && (
                          <span className="text-sm text-gray-500">+${modifier.priceAdjustment.toFixed(2)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Price Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Price:</span>
                <span className="text-2xl font-bold font-mono">
                  ${((selectedVariant?.price || selectedItem.price) + selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModifierModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleConfirmItem} className="btn-primary flex-1">
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
