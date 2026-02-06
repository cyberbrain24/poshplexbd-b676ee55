import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  color?: string;
  size?: string;
  sku?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, variantId: string | undefined, newQuantity: number) => void;
  removeFromCart: (id: string, variantId?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.variantId === item.variantId
      );
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }
      
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => !(item.id === id && item.variantId === variantId)));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === id && item.variantId === variantId 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((id: string, variantId?: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.variantId === variantId)));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
