import { create } from 'zustand';

export interface CartItem {
  id: string;
  itemId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
  notes?: string;
  modifiers?: Modifier[];
  taxAmount?: number;
}

export interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

export interface CartState {
  ticketId: string | null;
  items: CartItem[];
  customer: Customer | null;
  diningOption: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  tableName?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;

  // Actions
  setTicketId: (id: string | null) => void;
  addItem: (item: Omit<CartItem, 'id' | 'total'>) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItemNotes: (id: string, notes: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiningOption: (option: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY') => void;
  setTableName: (name: string) => void;
  applyDiscount: (amount: number) => void;
  clearCart: () => void;
  recalculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  ticketId: null,
  items: [],
  customer: null,
  diningOption: 'DINE_IN',
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  total: 0,

  setTicketId: (id) => set({ ticketId: id }),

  addItem: (item) => {
    const items = [...get().items];
    const existingIndex = items.findIndex(
      (i) => i.itemId === item.itemId && 
             i.variantId === item.variantId &&
             JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += item.quantity;
      items[existingIndex].total = items[existingIndex].price * items[existingIndex].quantity;
    } else {
      items.push({
        ...item,
        id: crypto.randomUUID(),
        total: item.price * item.quantity,
      });
    }

    set({ items });
    get().recalculateTotals();
  },

  updateItemQuantity: (id, quantity) => {
    const items = get().items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          total: item.price * quantity,
        };
      }
      return item;
    });
    set({ items });
    get().recalculateTotals();
  },

  removeItem: (id) => {
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    get().recalculateTotals();
  },

  updateItemNotes: (id, notes) => {
    const items = get().items.map((item) => {
      if (item.id === id) {
        return { ...item, notes };
      }
      return item;
    });
    set({ items });
  },

  setCustomer: (customer) => set({ customer }),

  setDiningOption: (option) => set({ diningOption: option }),

  setTableName: (name) => set({ tableName: name }),

  applyDiscount: (amount) => {
    set({ discountAmount: amount });
    get().recalculateTotals();
  },

  clearCart: () => {
    set({
      ticketId: null,
      items: [],
      customer: null,
      diningOption: 'DINE_IN',
      tableName: undefined,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0,
    });
  },

  recalculateTotals: () => {
    const items = get().items;
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * 0.08; // 8% tax (configurable)
    const discountAmount = get().discountAmount;
    const total = subtotal + taxAmount - discountAmount;

    set({
      subtotal,
      taxAmount,
      total: Math.max(0, total),
    });
  },
}));
