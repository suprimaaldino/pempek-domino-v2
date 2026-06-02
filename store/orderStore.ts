'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, DeliveryMethod, PaymentMethod } from '@/types';

interface OrderState {
  // Cart
  items: CartItem[];
  // Customer info
  customerName: string;
  whatsappNumber: string;
  notes: string;
  // Delivery
  deliveryMethod: DeliveryMethod;
  pickupDateTime: string;
  deliveryAddress: string;
  deliveryFee: number;
  // Payment
  paymentMethod: PaymentMethod | null;

  // Computed
  subtotal: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerInfo: (data: Partial<Pick<OrderState, 'customerName' | 'whatsappNumber' | 'notes'>>) => void;
  setDelivery: (data: Partial<Pick<OrderState, 'deliveryMethod' | 'pickupDateTime' | 'deliveryAddress' | 'deliveryFee'>>) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
}

function computeSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      items: [],
      customerName: '',
      whatsappNumber: '',
      notes: '',
      deliveryMethod: 'pickup',
      pickupDateTime: '',
      deliveryAddress: '',
      deliveryFee: 0,
      paymentMethod: null,
      subtotal: 0,
      total: 0,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          const items = existing
            ? state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              )
            : [...state.items, { ...item, quantity: 1 }];
          const subtotal = computeSubtotal(items);
          return { items, subtotal, total: subtotal + state.deliveryFee };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter((i) => i.productId !== productId);
          const subtotal = computeSubtotal(items);
          return { items, subtotal, total: subtotal + state.deliveryFee };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                );
          const subtotal = computeSubtotal(items);
          return { items, subtotal, total: subtotal + state.deliveryFee };
        });
      },

      clearCart: () => {
        set({
          items: [],
          customerName: '',
          whatsappNumber: '',
          notes: '',
          deliveryMethod: 'pickup',
          pickupDateTime: '',
          deliveryAddress: '',
          deliveryFee: 0,
          paymentMethod: null,
          subtotal: 0,
          total: 0,
        });
      },

      setCustomerInfo: (data) => set(data),

      setDelivery: (data) => {
        set((state) => {
          const newFee = data.deliveryFee ?? state.deliveryFee;
          return {
            ...data,
            total: state.subtotal + newFee,
          };
        });
      },

      setPaymentMethod: (method) => set({ paymentMethod: method }),
    }),
    {
      name: 'pempek-domino-order',
      partialize: (state) => ({
        items: state.items,
        customerName: state.customerName,
        whatsappNumber: state.whatsappNumber,
        notes: state.notes,
        deliveryMethod: state.deliveryMethod,
        pickupDateTime: state.pickupDateTime,
        deliveryAddress: state.deliveryAddress,
        deliveryFee: state.deliveryFee,
        paymentMethod: state.paymentMethod,
        subtotal: state.subtotal,
        total: state.total,
      }),
    }
  )
);
