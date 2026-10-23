'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  reference: string;
  slug: string;
  name: string;
  unit: string;
  logLength: string;
  packaging: string;
  priceHT: number;
  priceTTC: number;
  quantity: number;
  imageUrl: string;
  weightKg: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number, variant?: any) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotalTTC: number;
  subtotalHT: number;
  totalItemsCount: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('allo_maison_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('allo_maison_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (product: any, quantity = 1, variant?: any) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const effectivePriceTTC = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.priceTTC;
      const effectivePriceHT = Number((effectivePriceTTC / 1.055).toFixed(2));
      
      let parsedImages: string[] = [];
      try {
        parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      } catch {
        parsedImages = ['/images/chene-33.jpg'];
      }

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          reference: product.reference,
          slug: product.slug,
          name: product.name,
          unit: product.unit,
          logLength: variant?.logLength || product.logLength,
          packaging: variant?.packaging || product.packaging,
          priceHT: effectivePriceHT,
          priceTTC: effectivePriceTTC,
          quantity,
          imageUrl: parsedImages?.[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
          weightKg: product.weightKg || 900,
        },
      ];
    });
    setIsCartDrawerOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotalTTC = items.reduce((sum, item) => sum + item.priceTTC * item.quantity, 0);
  const subtotalHT = items.reduce((sum, item) => sum + item.priceHT * item.quantity, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotalTTC,
        subtotalHT,
        totalItemsCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
