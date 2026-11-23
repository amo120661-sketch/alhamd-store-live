import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  filterProducts,
  formatCurrency,
  getCartonBottles,
  getCartUnitPrice,
  getEffectiveUnitPrice,
  getItemBottles,
  nextSlideIndex,
  validateCheckoutInput,
  type StoreProduct,
} from './storeLogic';

const oliveOil: StoreProduct = {
  id: 1,
  name: 'زيت زيتون بكر ممتاز',
  description: 'عصرة أولى على البارد',
  price: 280,
  wholesalePrice: 1440,
  minWholesaleQty: 6,
  discountValue: null,
  imageUrl: '/img/oil.jpg',
  categoryId: 1,
  categoryName: 'زيوت و سمن',
  isJuiceSection: false,
  isFeatured: true,
  stock: 40,
  unit: 'عبوة 750 مل',
};

const mangoJuice: StoreProduct = {
  id: 2,
  name: 'عصير مانجو طبيعي',
  description: 'مانجو طبيعية 100%',
  price: 35,
  wholesalePrice: 336,
  minWholesaleQty: 12,
  discountValue: '15',
  imageUrl: '/img/mango.jpg',
  categoryId: 4,
  categoryName: 'عصائر و مشروبات',
  isJuiceSection: true,
  isFeatured: true,
  stock: 100,
  unit: 'زجاجة',
};

test('getEffectiveUnitPrice applies wholesale tier when quantity reaches threshold', () => {
  assert.equal(getEffectiveUnitPrice(oliveOil, 1), 280);
  assert.equal(getEffectiveUnitPrice(oliveOil, 5), 280);
  assert.equal(getEffectiveUnitPrice(oliveOil, 6), 240);
  assert.equal(getEffectiveUnitPrice(mangoJuice, 12), 28);
});

test('calculateCartTotals computes subtotal, delivery fee, free threshold, and wholesale savings', () => {
  const retailCart = calculateCartTotals([{ product: oliveOil, quantity: 1 }], 35, 600);
  assert.equal(retailCart.itemCount, 1);
  assert.equal(retailCart.subtotal, 280);
  assert.equal(retailCart.deliveryFee, 35);
  assert.equal(retailCart.remainingForFreeDelivery, 320);
  assert.equal(retailCart.total, 315);
  assert.equal(retailCart.wholesaleSavings, 0);

  const wholesaleCart = calculateCartTotals([{ product: oliveOil, quantity: 6 }], 35, 600);
  assert.equal(wholesaleCart.itemCount, 6);
  assert.equal(wholesaleCart.subtotal, 1440);
  assert.equal(wholesaleCart.deliveryFee, 0);
  assert.equal(wholesaleCart.remainingForFreeDelivery, 0);
  assert.equal(wholesaleCart.total, 1440);
  assert.equal(wholesaleCart.wholesaleSavings, 240);
});

test('getCartUnitPrice uses explicit purchase type (piece vs carton)', () => {
  // قطعة = سعر الزجاجة دائماً، حتى لو وصلت الكمية لحد الكرتونة
  assert.equal(getCartUnitPrice(oliveOil, 1, 'piece'), 280);
  assert.equal(getCartUnitPrice(oliveOil, 12, 'piece'), 280);
  assert.equal(getCartUnitPrice(mangoJuice, 24, 'piece'), 35);
  // كرتونة = سعر الكرتونة كاملة (الكمية تُحسب كراتين)
  assert.equal(getCartUnitPrice(oliveOil, 1, 'carton'), 1440);
  assert.equal(getCartUnitPrice(mangoJuice, 2, 'carton'), 336);
  // غياب النوع = السعر التلقائي القديم (توافق مع السلة القديمة)
  assert.equal(getCartUnitPrice(oliveOil, 6), 240);
});

test('getCartonBottles and getItemBottles count bottles for carton lines', () => {
  assert.equal(getCartonBottles(oliveOil), 6);
  assert.equal(getCartonBottles(mangoJuice), 12);
  assert.equal(
    getItemBottles({ product: oliveOil, quantity: 2, purchaseType: 'carton' }),
    12
  );
  assert.equal(
    getItemBottles({ product: mangoJuice, quantity: 3, purchaseType: 'piece' }),
    3
  );
});

test('calculateCartTotals prices carton lines by carton and counts their bottles', () => {
  const cartonCart = calculateCartTotals(
    [{ product: oliveOil, quantity: 1, purchaseType: 'carton' }],
    35,
    600
  );
  assert.equal(cartonCart.subtotal, 1440); // سعر الكرتونة لا سعر الزجاجة
  assert.equal(cartonCart.itemCount, 6); // 6 زجاجات داخل الكرتونة
  assert.equal(cartonCart.wholesaleSavings, 240); // (280×6) - 1440
  assert.equal(cartonCart.deliveryFee, 0);

  const pieceCart = calculateCartTotals(
    [{ product: oliveOil, quantity: 1, purchaseType: 'piece' }],
    35,
    600
  );
  assert.equal(pieceCart.subtotal, 280);
  assert.equal(pieceCart.itemCount, 1);

  // سطران منفصلان لنفس المنتج: قطعة + كرتونة
  const mixedCart = calculateCartTotals(
    [
      { product: oliveOil, quantity: 2, purchaseType: 'piece' },
      { product: oliveOil, quantity: 1, purchaseType: 'carton' },
    ],
    35,
    600
  );
  assert.equal(mixedCart.subtotal, 2000); // (280×2) + 1440
  assert.equal(mixedCart.itemCount, 8); // 2 زجاجات + 6 زجاجات
});

test('filterProducts filters by category, juice flag, and search text', () => {
  const all = [oliveOil, mangoJuice];
  assert.equal(filterProducts(all, { categoryName: 'زيوت و سمن' }).length, 1);
  assert.equal(filterProducts(all, { onlyJuices: true }).length, 1);
  assert.equal(filterProducts(all, { searchQuery: 'مانجو' })[0].id, 2);
  assert.equal(filterProducts(all, { searchQuery: 'غير موجود' }).length, 0);
});

test('validateCheckoutInput rejects invalid or empty fields and accepts valid COD payload', () => {
  assert.equal(
    validateCheckoutInput({
      customerName: 'أ',
      customerPhone: '01012345678',
      customerAddress: 'شارع التحرير القاهرة',
      items: [{ product: oliveOil, quantity: 1 }],
    }).valid,
    false
  );
  assert.equal(
    validateCheckoutInput({
      customerName: 'محمد أحمد',
      customerPhone: '123',
      customerAddress: 'شارع التحرير القاهرة',
      items: [{ product: oliveOil, quantity: 1 }],
    }).valid,
    false
  );
  assert.equal(
    validateCheckoutInput({
      customerName: 'محمد أحمد',
      customerPhone: '01012345678',
      customerAddress: 'القاهرة - مدينة نصر - شارع عباس العقاد',
      items: [{ product: oliveOil, quantity: 1, purchaseType: 'carton' }],
    }).valid,
    true
  );
  assert.equal(
    validateCheckoutInput({
      customerName: 'محمد أحمد',
      customerPhone: '01012345678',
      customerAddress: 'القاهرة - مدينة نصر - شارع عباس العقاد',
      items: [{ product: mangoJuice, quantity: 1 }],
    }).valid,
    false
  );
});

test('nextSlideIndex wraps forward and backward cleanly', () => {
  assert.equal(nextSlideIndex(0, 3, 1), 1);
  assert.equal(nextSlideIndex(2, 3, 1), 0);
  assert.equal(nextSlideIndex(0, 3, -1), 2);
});

test('formatCurrency formats integer and decimal amounts cleanly', () => {
  assert.equal(formatCurrency(1250), '1,250 ج.م');
  assert.equal(formatCurrency(35.5), '35.50 ج.م');
});
