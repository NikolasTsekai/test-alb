import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Product, Variant, CartItem } from "@/lib/store";

interface CartContextValue {
  cartItems: CartItem[];
  cartOpen: boolean;
  checkoutActive: boolean;
  checkoutSnapshot: { items: CartItem[]; total: number };
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variant: Variant) => void;
  removeFromCart: (productId: string, variantWeight: string) => void;
  updateCartQty: (productId: string, variantWeight: string, delta: number) => void;
  clearCart: () => void;
  handleCheckout: () => void;
  handleCheckoutBack: () => void;
  handleCheckoutSuccess: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutSnapshot, setCheckoutSnapshot] = useState<{ items: CartItem[]; total: number }>({
    items: [],
    total: 0,
  });

  const addToCart = useCallback((product: Product, variant: Variant) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.variant.weight === variant.weight
      );
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string, variantWeight: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.variant.weight === variantWeight))
    );
  }, []);

  const updateCartQty = useCallback(
    (productId: string, variantWeight: string, delta: number) => {
      setCartItems((prev) =>
        prev.flatMap((i) => {
          if (i.product.id === productId && i.variant.weight === variantWeight) {
            const newQty = i.quantity + delta;
            return newQty <= 0 ? [] : [{ ...i, quantity: newQty }];
          }
          return [i];
        })
      );
    },
    []
  );

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartTotal = cartItems.reduce((s, i) => s + i.variant.price * i.quantity, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = useCallback(() => {
    setCartOpen(false);
    const total = cartItems.reduce((s, i) => s + i.variant.price * i.quantity, 0);
    setCheckoutSnapshot({ items: [...cartItems], total });
    setTimeout(() => {
      setCheckoutActive(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 350);
  }, [cartItems]);

  const handleCheckoutBack = useCallback(() => {
    setCheckoutActive(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleCheckoutSuccess = useCallback(() => {
    clearCart();
  }, [clearCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartOpen,
        checkoutActive,
        checkoutSnapshot,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        handleCheckout,
        handleCheckoutBack,
        handleCheckoutSuccess,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
