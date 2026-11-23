export interface StoreProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  wholesalePrice: number | null;
  minWholesaleQty: number;
  discountValue: string | null;
  imageUrl: string;
  categoryId: number | null;
  categoryName: string;
  isJuiceSection: boolean;
  isFeatured: boolean;
  stock: number;
  unit: string;
  createdAt?: string;
}

export type PurchaseType = 'piece' | 'carton';

/** الحد الأدنى لقيمة الفاتورة قبل إتمام الطلب */
export const MIN_INVOICE_TOTAL = 1000;

export interface CartItem {
  product: StoreProduct;
  /** عدد القطع/الزجاجات أو عدد الكراتين حسب نوع الشراء */
  quantity: number;
  /** عند غيابه يُطبَّق السعر التلقائي القديم (توافق مع السلة المحفوظة) */
  purchaseType?: PurchaseType;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  remainingForFreeDelivery: number;
  total: number;
  wholesaleSavings: number;
}

export interface OrderValidationInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
}

export function getEffectiveUnitPrice(
  product: Pick<StoreProduct, 'price' | 'wholesalePrice' | 'minWholesaleQty'>,
  quantity: number
): number {
  const retail = Number(product.price) || 0;
  const cartonPrice =
    product.wholesalePrice !== null && product.wholesalePrice !== undefined
      ? Number(product.wholesalePrice)
      : 0;
  const perCarton = Math.max(1, Number(product.minWholesaleQty) || 12);
  const pricePerBottle = cartonPrice > 0 ? cartonPrice / perCarton : 0;

  if (
    cartonPrice > 0 &&
    pricePerBottle > 0 &&
    pricePerBottle < retail &&
    quantity >= perCarton
  ) {
    return Math.round(pricePerBottle * 100) / 100;
  }
  return retail;
}

/** عدد الزجاجات/القطع داخل الكرتونة الواحدة */
export function getCartonBottles(
  product: Pick<StoreProduct, 'minWholesaleQty'>
): number {
  return Math.max(1, Number(product.minWholesaleQty) || 12);
}

/**
 * سعر الوحدة حسب اختيار المشتري صراحةً:
 * - قطعة: سعر الزجاجة/القطعة
 * - كرتونة: سعر الكرتونة كاملة (الكمية تُحسب كراتين)
 * - غير محدد: السعر التلقائي القديم (للسلة المحفوظة قديماً)
 */
export function getCartUnitPrice(
  product: Pick<StoreProduct, 'price' | 'wholesalePrice' | 'minWholesaleQty'>,
  quantity: number,
  purchaseType?: PurchaseType
): number {
  if (purchaseType === 'carton') {
    const cartonPrice = Number(product.wholesalePrice) || 0;
    return cartonPrice > 0 ? cartonPrice : Number(product.price) || 0;
  }
  if (purchaseType === 'piece') {
    return Number(product.price) || 0;
  }
  return getEffectiveUnitPrice(product, quantity);
}

/** مجموع السلة قبل رسوم التوصيل — يُستخدم للتحقق من الحد الأدنى للفاتورة */
export function getCartSubtotal(items: CartItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    if (qty === 0) continue;
    subtotal += getCartUnitPrice(item.product, qty, item.purchaseType) * qty;
  }
  return Math.round(subtotal * 100) / 100;
}

export function hasMinimumInvoice(items: CartItem[]): boolean {
  return getCartSubtotal(items) >= MIN_INVOICE_TOTAL;
}

/** عدد الزجاجات الفعلي في العنصر (كرتونة = عدد الكراتين × زجاجات الكرتونة) */
export function getItemBottles(item: CartItem): number {
  const qty = Math.max(0, Math.floor(item.quantity));
  return item.purchaseType === 'carton'
    ? qty * getCartonBottles(item.product)
    : qty;
}

export function calculateCartTotals(
  items: CartItem[],
  deliveryFeeConfig = 35,
  freeDeliveryThreshold = 600
): CartTotals {
  let itemCount = 0;
  let subtotal = 0;
  let retailTotal = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    if (qty === 0) continue;
    const retailPrice = Number(item.product.price) || 0;
    const unitPrice = getCartUnitPrice(item.product, qty, item.purchaseType);
    const bottles = getItemBottles(item);
    itemCount += bottles;
    subtotal += unitPrice * qty;
    retailTotal += retailPrice * bottles;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  retailTotal = Math.round(retailTotal * 100) / 100;
  const wholesaleSavings = Math.max(0, Math.round((retailTotal - subtotal) * 100) / 100);

  const deliveryFee =
    subtotal === 0 || subtotal >= freeDeliveryThreshold ? 0 : Math.max(0, deliveryFeeConfig);
  const remainingForFreeDelivery =
    subtotal >= freeDeliveryThreshold
      ? 0
      : Math.max(0, Math.round((freeDeliveryThreshold - subtotal) * 100) / 100);

  return {
    itemCount,
    subtotal,
    deliveryFee,
    freeDeliveryThreshold,
    remainingForFreeDelivery,
    total: Math.round((subtotal + deliveryFee) * 100) / 100,
    wholesaleSavings,
  };
}

export function formatCurrency(amount: number, currency = 'ج.م'): string {
  const numeric = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);
  return `${formatted} ${currency}`;
}

export function filterProducts(
  products: StoreProduct[],
  options: {
    categoryName?: string | null;
    searchQuery?: string;
    onlyJuices?: boolean;
  }
): StoreProduct[] {
  const query = (options.searchQuery || '').trim().toLowerCase();
  return products.filter((p) => {
    if (options.onlyJuices && !p.isJuiceSection) return false;
    if (
      options.categoryName &&
      options.categoryName !== 'الكل' &&
      p.categoryName !== options.categoryName
    ) {
      return false;
    }
    if (query) {
      const hay = `${p.name} ${p.description} ${p.categoryName}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function validateCheckoutInput(input: OrderValidationInput): {
  valid: boolean;
  error?: string;
} {
  if (!input.items || input.items.length === 0) {
    return { valid: false, error: 'السلة فارغة، أضف منتجات أولاً.' };
  }
  const subtotal = getCartSubtotal(input.items);
  if (subtotal < MIN_INVOICE_TOTAL) {
    const remaining = Math.round((MIN_INVOICE_TOTAL - subtotal) * 100) / 100;
    return {
      valid: false,
      error: `الحد الأدنى للفاتورة ${formatCurrency(
        MIN_INVOICE_TOTAL
      )}. أضف منتجات بقيمة ${formatCurrency(remaining)} لإتمام الطلب.`,
    };
  }
  const name = (input.customerName || '').trim();
  const phone = (input.customerPhone || '').trim();
  const address = (input.customerAddress || '').trim();

  if (name.length < 2) {
    return { valid: false, error: 'يرجى إدخال الاسم الكامل بشكل صحيح.' };
  }
  const normalizedPhone = phone.replace(/[\s\-+()]/g, '');
  if (!/^\d{8,15}$/.test(normalizedPhone)) {
    return { valid: false, error: 'يرجى إدخال رقم هاتف صحيح (8 إلى 15 رقماً).' };
  }
  if (address.length < 6) {
    return { valid: false, error: 'يرجى إدخال عنوان التوصيل بالتفصيل.' };
  }
  return { valid: true };
}

export interface RegistrationInput {
  name: string;
  storeName: string;
  phone: string;
  password: string;
  governorate: string;
  center: string;
  address: string;
}

export function normalizePhone(phone: string): string {
  return (phone || '').replace(/[\s\-+()]/g, '');
}

export function validateRegistrationInput(input: RegistrationInput): {
  valid: boolean;
  error?: string;
  phone?: string;
} {
  if (!(input.name || '').trim()) {
    return { valid: false, error: 'يرجى إدخال إسم العميل.' };
  }
  if (!(input.storeName || '').trim()) {
    return { valid: false, error: 'يرجى إدخال اسم المحل.' };
  }
  const phone = normalizePhone(input.phone);
  if (!/^\d{11}$/.test(phone)) {
    return { valid: false, error: 'يجب أن يكون رقم الهاتف 11 رقماً بالضبط.' };
  }
  if ((input.password || '').length < 6) {
    return { valid: false, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' };
  }
  if (!(input.governorate || '').trim()) {
    return { valid: false, error: 'يرجى إدخال المحافظة.' };
  }
  if (!(input.center || '').trim()) {
    return { valid: false, error: 'يرجى إدخال المركز.' };
  }
  if (!(input.address || '').trim()) {
    return { valid: false, error: 'يرجى إدخال عنوان المحل.' };
  }
  return { valid: true, phone };
}

export function nextSlideIndex(current: number, total: number, step = 1): number {
  if (total <= 0) return 0;
  return ((current + step) % total + total) % total;
}

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'قيد المراجعة';
    case 'processing':
      return 'جاري التجهيز';
    case 'shipped':
      return 'تم الشحن';
    case 'delivered':
      return 'تم التسليم';
    case 'cancelled':
      return 'ملغي';
    default:
      return status;
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'مدير عام';
    case 'manager':
      return 'مدير متجر';
    default:
      return 'عميل';
  }
}
