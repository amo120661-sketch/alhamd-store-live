import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AuthUser,
  Category,
  SliderImage,
  StoreDataPayload,
  StoreSettings,
  TopOffer,
} from '../types/store';
import {
  calculateCartTotals,
  type CartItem,
  type CartTotals,
  type PurchaseType,
  type StoreProduct,
} from '../utils/storeLogic';

interface StoreContextValue {
  loading: boolean;
  error: string | null;
  settings: StoreSettings | null;
  offers: TopOffer[];
  sliders: SliderImage[];
  categories: Category[];
  products: StoreProduct[];
  refreshStorefront: () => Promise<void>;

  user: AuthUser | null;
  token: string | null;
  loginWithPassword: (identifier: string, password: string) => Promise<AuthUser>;
  registerAccount: (input: {
    name: string;
    storeName: string;
    phone: string;
    password: string;
    governorate: string;
    center: string;
    address: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;

  cart: CartItem[];
  totals: CartTotals;
  addToCart: (
    product: StoreProduct,
    quantity?: number,
    purchaseType?: PurchaseType
  ) => void;
  updateCartQty: (
    productId: number,
    quantity: number,
    purchaseType?: PurchaseType
  ) => void;
  removeFromCart: (productId: number, purchaseType?: PurchaseType) => void;
  clearCart: () => void;

  selectedProduct: StoreProduct | null;
  setSelectedProduct: (product: StoreProduct | null) => void;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  isOffersOpen: boolean;
  setIsOffersOpen: (open: boolean) => void;

  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;

  checkoutItems: CartItem[] | null;
  openCheckout: (items: CartItem[]) => void;
  closeCheckout: () => void;

  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const TOKEN_KEY = 'alhamd_auth_token';
const CART_KEY = 'alhamd_cart_v1';

const normalizePurchaseType = (type?: PurchaseType): PurchaseType =>
  type === 'carton' ? 'carton' : 'piece';

/** قطعة وكرتونة من نفس المنتج يُعاملان كسطرين منفصلين في السلة */
const isSameCartLine = (
  item: CartItem,
  productId: number,
  purchaseType?: PurchaseType
): boolean =>
  item.product.id === productId &&
  normalizePurchaseType(item.purchaseType) ===
    normalizePurchaseType(purchaseType);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<StoreDataPayload>({
    settings: null,
    offers: [],
    sliders: [],
    categories: [],
    products: [],
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[] | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const refreshStorefront = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/storefront');
      if (!res.ok) {
        throw new Error('تعذر تحميل بيانات المتجر.');
      }
      const data: StoreDataPayload = await res.json();
      setStoreData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.user) {
          setUser(data.user);
        } else {
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const saveSession = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch {
      // ignore
    }
  }, []);

  const loginWithPassword = useCallback(
    async (identifier: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول.');
      }
      saveSession(data.token, data.user);
      showToast(`مرحباً بك، ${data.user.name}`);
      return data.user;
    },
    [saveSession, showToast]
  );

  const registerAccount = useCallback(
    async (input: {
      name: string;
      storeName: string;
      phone: string;
      password: string;
      governorate: string;
      center: string;
      address: string;
    }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر إنشاء الحساب.');
      }
      saveSession(data.token, data.user);
      showToast(`تم إنشاء حسابك بنجاح، أهلاً ${data.user.name}`);
      return data.user;
    },
    [saveSession, showToast]
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    showToast('تم تسجيل الخروج بنجاح');
  }, [showToast]);

  const addToCart = useCallback(
    (product: StoreProduct, quantity = 1, purchaseType?: PurchaseType) => {
      const qty = Math.max(1, Math.floor(quantity));
      const type = normalizePurchaseType(purchaseType);
      // الكرتونة متاحة فقط للمنتجات التي لها سعر كرتونة
      const effectiveType =
        type === 'carton' && !(Number(product.wholesalePrice) > 0)
          ? 'piece'
          : type;
      setCart((prev) => {
        const idx = prev.findIndex((i) =>
          isSameCartLine(i, product.id, effectiveType)
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            product,
            purchaseType: effectiveType,
            quantity: next[idx].quantity + qty,
          };
          return next;
        }
        return [...prev, { product, quantity: qty, purchaseType: effectiveType }];
      });
      showToast(
        `تمت إضافة "${product.name}" ${
          effectiveType === 'carton' ? 'كرتونة' : 'القطعة'
        } إلى السلة`
      );
    },
    [showToast]
  );

  const updateCartQty = useCallback(
    (productId: number, quantity: number, purchaseType?: PurchaseType) => {
      setCart((prev) => {
        if (quantity <= 0) {
          return prev.filter(
            (item) => !isSameCartLine(item, productId, purchaseType)
          );
        }
        return prev.map((item) =>
          isSameCartLine(item, productId, purchaseType)
            ? { ...item, quantity }
            : item
        );
      });
    },
    []
  );

  const removeFromCart = useCallback(
    (productId: number, purchaseType?: PurchaseType) => {
      setCart((prev) =>
        prev.filter((item) => !isSameCartLine(item, productId, purchaseType))
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const openCheckout = useCallback((items: CartItem[]) => {
    setIsCartOpen(false);
    setSelectedProduct(null);
    setCheckoutItems(items);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutItems(null);
  }, []);

  const totals = useMemo(() => {
    const fee = Number(storeData.settings?.deliveryFee ?? 35);
    const threshold = Number(storeData.settings?.freeDeliveryThreshold ?? 600);
    return calculateCartTotals(cart, fee, threshold);
  }, [cart, storeData.settings]);

  const value: StoreContextValue = {
    loading,
    error,
    settings: storeData.settings,
    offers: storeData.offers,
    sliders: storeData.sliders,
    categories: storeData.categories,
    products: storeData.products,
    refreshStorefront,
    user,
    token,
    loginWithPassword,
    registerAccount,
    logout,
    cart,
    totals,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    selectedProduct,
    setSelectedProduct,
    isCartOpen,
    setIsCartOpen,
    isOffersOpen,
    setIsOffersOpen,
    isAuthOpen,
    setIsAuthOpen,
    checkoutItems,
    openCheckout,
    closeCheckout,
    isChatOpen,
    setIsChatOpen,
    toastMessage,
    showToast,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
