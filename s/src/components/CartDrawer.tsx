import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  formatCurrency,
  getCartUnitPrice,
  getItemBottles,
  MIN_INVOICE_TOTAL,
} from '../utils/storeLogic';
import { ImageWithFallback } from './ImageWithFallback';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    totals,
    settings,
    updateCartQty,
    removeFromCart,
    openCheckout,
  } = useStore();

  if (!isCartOpen) return null;

  const currency = settings?.currency || 'ج.م';
  const minimumReached = totals.subtotal >= MIN_INVOICE_TOTAL;
  const remainingForMinimum = Math.max(
    0,
    Math.round((MIN_INVOICE_TOTAL - totals.subtotal) * 100) / 100
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="سلة التسوق"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col border-r border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#007185]" />
            <h2 className="text-lg font-extrabold text-slate-900">
              سلة التسوق ({totals.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="إغلاق سلة التسوق"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800">
                سلة التسوق فارغة حالياً
              </p>
              <p className="text-sm text-slate-500">
                تصفح المنتجات وأضف ما تحتاجه بالكرتونة أو بالقطعة.
              </p>
            </div>
          ) : (
            cart.map(({ product, quantity, purchaseType }) => {
              const unitPrice = getCartUnitPrice(product, quantity, purchaseType);
              const bottles = getItemBottles({
                product,
                quantity,
                purchaseType,
              });
              return (
                <div
                  key={`${product.id}-${purchaseType || 'piece'}`}
                  className="flex gap-3.5 pb-4 border-b border-slate-100"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 font-mono-nums">
                      <span>{formatCurrency(unitPrice, currency)}</span>
                      <span className="font-semibold text-[#006577]">
                        {purchaseType === 'carton' ? '/ كرتونة' : '/ قطعة'}
                      </span>
                      {purchaseType === 'carton' && (
                        <span className="text-slate-500">
                          ({bottles} زجاجة)
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(product.id, quantity - 1, purchaseType)
                          }
                          aria-label={`إنقاص كمية ${product.name}`}
                          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-bold font-mono-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(product.id, quantity + 1, purchaseType)
                          }
                          aria-label={`زيادة كمية ${product.name}`}
                          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id, purchaseType)}
                        aria-label={`حذف ${product.name} من السلة`}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* الحد الأدنى للفاتورة */}
            {minimumReached ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-[#00879e] text-white px-3 py-2.5 text-xs font-extrabold shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>تم الحد الأدنى للفاتوه</span>
              </div>
            ) : (
              <div className="rounded-lg bg-[#fffbe6] border border-[#ffef8a] px-3 py-2.5 text-xs text-[#6b5200]">
                <p className="font-bold">
                  الحد الأدنى للفاتورة {formatCurrency(MIN_INVOICE_TOTAL, currency)}
                </p>
                <p className="mt-0.5">
                  أضف منتجات بقيمة{' '}
                  <strong className="font-mono-nums">
                    {formatCurrency(remainingForMinimum, currency)}
                  </strong>{' '}
                  لإتمام الطلب.
                </p>
              </div>
            )}

            {totals.remainingForFreeDelivery === 0 && (
              <p className="text-xs font-semibold text-[#006577] flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>مؤهل للتوصيل المجاني</span>
              </p>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي</span>
                <span className="font-mono-nums font-semibold">
                  {formatCurrency(totals.subtotal, currency)}
                </span>
              </div>
              {totals.wholesaleSavings > 0 && (
                <div className="flex justify-between text-[#006577] text-xs font-semibold">
                  <span>توفير سعر الكرتونة</span>
                  <span className="font-mono-nums">
                    - {formatCurrency(totals.wholesaleSavings, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>رسوم التوصيل</span>
                <span className="font-mono-nums font-semibold">
                  {totals.deliveryFee === 0
                    ? 'مجاني'
                    : formatCurrency(totals.deliveryFee, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>الإجمالي</span>
                <span className="font-mono-nums text-[#202730]">
                  {formatCurrency(totals.total, currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!minimumReached}
              onClick={() => openCheckout(cart)}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] disabled:bg-slate-400 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {minimumReached
                ? 'إتمام الطلب · الدفع عند الاستلام'
                : `الحد الأدنى للفاتورة ${formatCurrency(
                    MIN_INVOICE_TOTAL,
                    currency
                  )}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
