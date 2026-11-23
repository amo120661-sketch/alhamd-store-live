import { Banknote, CheckCircle2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { OrderRecord } from '../types/store';
import {
  calculateCartTotals,
  formatCurrency,
  getCartUnitPrice,
  MIN_INVOICE_TOTAL,
  validateCheckoutInput,
} from '../utils/storeLogic';

export function CheckoutModal() {
  const {
    checkoutItems,
    closeCheckout,
    user,
    token,
    settings,
    cart,
    clearCart,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(
    null
  );

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name || '');
      setCustomerPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  if (!checkoutItems && !confirmedOrder) return null;

  const currency = settings?.currency || 'ج.م';
  const feeConfig = Number(settings?.deliveryFee ?? 35);
  const freeThreshold = Number(settings?.freeDeliveryThreshold ?? 600);
  const totals = checkoutItems
    ? calculateCartTotals(checkoutItems, feeConfig, freeThreshold)
    : null;
  const minimumReached = Boolean(totals && totals.subtotal >= MIN_INVOICE_TOTAL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItems) return;

    const validation = validateCheckoutInput({
      customerName,
      customerPhone,
      customerAddress,
      items: checkoutItems,
    });
    if (!validation.valid) {
      setErrorMsg(validation.error || 'بيانات غير مكتملة.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          notes,
          items: checkoutItems.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
            purchaseType: it.purchaseType || 'piece',
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر إرسال الطلب.');
      }

      // If checkout came from full cart, clear cart
      if (checkoutItems.length === cart.length) {
        const cartIds = new Set(cart.map((c) => c.product.id));
        if (checkoutItems.every((c) => cartIds.has(c.product.id))) {
          clearCart();
        }
      }
      setConfirmedOrder(data);
      showToast(`تم تأكيد الطلب رقم ${data.orderNumber}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setConfirmedOrder(null);
    setErrorMsg(null);
    closeCheckout();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="إتمام الطلب"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            {confirmedOrder ? 'تم تأكيد الطلب بنجاح' : 'إتمام الطلب'}
          </h2>
          <button
            type="button"
            onClick={handleCloseAll}
            aria-label="إغلاق نافذة إتمام الطلب"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-6 space-y-5 text-center">
            <CheckCircle2 className="w-14 h-14 text-[#007185] mx-auto" />
            <div>
              <p className="text-sm text-slate-600">رقم الطلب المرجعي</p>
              <p className="mt-1 text-2xl font-extrabold font-mono-nums text-[#202730]">
                {confirmedOrder.orderNumber}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                شكراً لك {confirmedOrder.customerName}، سيتم التواصل معك على الرقم{' '}
                <span className="font-mono-nums font-bold">
                  {confirmedOrder.customerPhone}
                </span>{' '}
                لتوصيل الطلب.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-right space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع</span>
                <span className="font-bold text-slate-900">
                  الدفع عند الاستلام
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">حالة الطلب</span>
                <span className="font-bold text-[#006577]">قيد المراجعة</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-extrabold text-base">
                <span>الإجمالي المطلوب عند الاستلام</span>
                <span className="font-mono-nums text-[#202730]">
                  {formatCurrency(confirmedOrder.totalAmount, currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseAll}
              className="w-full py-3 bg-[#007185] hover:bg-[#006577] text-white font-bold rounded-xl text-sm transition-colors"
            >
              متابعة التسوق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* COD Payment Method Callout */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#eef9fb] border border-[#b3dfe6]">
              <Banknote className="w-5 h-5 text-[#006577] shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-[#202730]">
                  طريقة الدفع المتاحة: الدفع عند الاستلام
                </p>
                <p className="text-[#006577]">
                  ادفع نقداً للمندوب فور استلام وفحص طلبك بالكامل.
                </p>
              </div>
            </div>

            {checkoutItems && totals && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                {minimumReached ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-[#00879e] text-white px-3 py-2 text-xs font-extrabold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تم الحد الأدنى للفاتوه</span>
                  </div>
                ) : (
                  <p className="rounded-lg bg-[#fffbe6] border border-[#ffef8a] text-[#6b5200] px-3 py-2 text-xs font-bold">
                    الحد الأدنى للفاتورة {formatCurrency(MIN_INVOICE_TOTAL, currency)} — أضف منتجات بقيمة{' '}
                    {formatCurrency(
                      Math.max(0, MIN_INVOICE_TOTAL - totals.subtotal),
                      currency
                    )}{' '}
                    لإتمام الطلب.
                  </p>
                )}
                <p className="text-xs font-bold text-slate-500">ملخص المنتجات</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {checkoutItems.map((it) => {
                    const price = getCartUnitPrice(
                      it.product,
                      it.quantity,
                      it.purchaseType
                    );
                    return (
                      <div
                        key={`${it.product.id}-${it.purchaseType || 'piece'}`}
                        className="flex justify-between text-xs sm:text-sm text-slate-800"
                      >
                        <span className="truncate ml-2">
                          {it.product.name} × {it.quantity}{' '}
                          {it.purchaseType === 'carton' ? 'كرتونة' : 'قطعة'}
                        </span>
                        <span className="font-mono-nums font-bold shrink-0">
                          {formatCurrency(price * it.quantity, currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-600">
                  <span>رسوم التوصيل</span>
                  <span className="font-mono-nums">
                    {totals.deliveryFee === 0
                      ? 'مجاني'
                      : formatCurrency(totals.deliveryFee, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-[#202730]">
                  <span>الإجمالي عند الاستلام</span>
                  <span className="font-mono-nums">
                    {formatCurrency(totals.total, currency)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  الاسم الكامل
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد محمود السيد"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  رقم الهاتف للتواصل
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  عنوان التوصيل بالتفصيل
                </label>
                <textarea
                  id="checkout-address"
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="المحافظة، المدينة، الشارع، رقم العمارة والشقة"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-notes"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  id="checkout-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: التوصيل بعد الساعة 5 مساءً"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                />
              </div>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !minimumReached}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {submitting
                ? 'جاري تأكيد الطلب...'
                : 'تأكيد الطلب (الدفع عند الاستلام)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
