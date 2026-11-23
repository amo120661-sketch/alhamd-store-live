import { CheckCircle2, Minus, Plus, ShoppingBag, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  formatCurrency,
  getCartUnitPrice,
  getCartonBottles,
  type PurchaseType,
} from '../utils/storeLogic';
import { ImageWithFallback } from './ImageWithFallback';

export function ProductDetailModal() {
  const {
    selectedProduct,
    setSelectedProduct,
    settings,
    addToCart,
    openCheckout,
  } = useStore();

  const [qty, setQty] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('piece');

  useEffect(() => {
    setQty(1);
    setPurchaseType('piece');
  }, [selectedProduct?.id]);

  if (!selectedProduct) return null;

  const currency = settings?.currency || 'ج.م';
  const cartonAvailable = Number(selectedProduct.wholesalePrice) > 0;
  const bottlesPerCarton = getCartonBottles(selectedProduct);
  const unitPrice = getCartUnitPrice(selectedProduct, qty, purchaseType);
  const lineTotal = unitPrice * qty;
  const bottleCount =
    purchaseType === 'carton' ? qty * bottlesPerCarton : qty;
  const discount = String(selectedProduct.discountValue || '').trim();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{selectedProduct.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedProduct.unit}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#006577] font-semibold">
              متوفر ({selectedProduct.stock})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            aria-label="إغلاق نافذة المنتج"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-5 sm:p-6">
          <div className="space-y-2">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <ImageWithFallback
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            {discount && (
              <div className="px-3 py-1.5 rounded-lg bg-[#fff7c2] text-[#6b5200] text-xs font-extrabold text-center border border-[#ffef8a]">
                خصم {discount}%
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div>
              <h2
                id="product-modal-title"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug"
              >
                {selectedProduct.name}
              </h2>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {selectedProduct.description}
              </p>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                {/* سعر الكرتونة أولاً كسعر أساسي */}
                {cartonAvailable && (
                  <>
                    <div className="flex items-baseline justify-between rounded-lg bg-[#eef9fb] border border-[#d9f0f4] px-2.5 py-2">
                      <span className="text-xs font-semibold text-[#007185]">
                        الكرتونة ({bottlesPerCarton} زجاجة)
                      </span>
                      <span className="text-xl font-extrabold text-[#006577] font-mono-nums">
                        {formatCurrency(
                          Number(selectedProduct.wholesalePrice),
                          currency
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>سعر الزجاجة داخل الكرتونة</span>
                      <span className="font-bold text-[#006577] font-mono-nums">
                        {formatCurrency(
                          Number(selectedProduct.wholesalePrice) /
                            bottlesPerCarton,
                          currency
                        )}
                      </span>
                    </div>
                  </>
                )}
                {/* سعر القطعة / الزجاجة أسفل الكرتونة */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    سعر الزجاجة / القطعة
                  </span>
                  <span className="text-base font-extrabold text-slate-800 font-mono-nums">
                    {formatCurrency(selectedProduct.price, currency)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-200 pt-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {purchaseType === 'carton'
                      ? `الكرتونة × ${qty} (${bottleCount} زجاجة)`
                      : `القطعة × ${qty}`}
                  </span>
                  <span className="text-2xl font-extrabold text-[#202730] font-mono-nums">
                    {formatCurrency(lineTotal, currency)}
                  </span>
                </div>
                {purchaseType === 'carton' && (
                  <p className="text-xs font-semibold text-[#006577] flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم اختيار سعر الكرتونة</span>
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <Truck className="w-4 h-4 text-[#006577] shrink-0" />
                <span>طريقة الدفع المتاحة: الدفع عند الاستلام</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-bold text-slate-800">
                  اختر طريقة الشراء
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseType('piece');
                      setQty(1);
                    }}
                    aria-pressed={purchaseType === 'piece'}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      purchaseType === 'piece'
                        ? 'bg-[#007185] text-white border-[#007185]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    شراء قطعة / زجاجة
                    <span className="block mt-0.5 font-mono-nums font-semibold opacity-90">
                      {formatCurrency(selectedProduct.price, currency)}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!cartonAvailable}
                    onClick={() => {
                      setPurchaseType('carton');
                      setQty(1);
                    }}
                    aria-pressed={purchaseType === 'carton'}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      purchaseType === 'carton'
                        ? 'bg-[#007185] text-white border-[#007185]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    شراء كرتونة ({bottlesPerCarton} زجاجة)
                    <span className="block mt-0.5 font-mono-nums font-semibold opacity-90">
                      {cartonAvailable
                        ? formatCurrency(
                            Number(selectedProduct.wholesalePrice),
                            currency
                          )
                        : 'غير متوفرة'}
                    </span>
                  </button>
                </div>
              </div>

              {/* عداد الكمية يظهر عند اختيار الكرتونة أو القطعة بجانب أزرار الشراء */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm font-bold text-slate-800">
                  {purchaseType === 'carton'
                    ? `عدد الكراتين (${
                        Number(selectedProduct.wholesalePrice || 0) * qty
                      } ${currency})`
                    : 'عدد الزجاجات / القطع'}
                </span>
                <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="إنقاص الكمية"
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-r-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold font-mono-nums text-slate-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="زيادة الكمية"
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-l-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    openCheckout([
                      { product: selectedProduct, quantity: qty, purchaseType },
                    ])
                  }
                  className="py-3 px-4 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-xl transition-colors"
                >
                  شراء الآن ({formatCurrency(lineTotal, currency)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct, qty, purchaseType);
                    setSelectedProduct(null);
                  }}
                  className="py-3 px-4 text-sm font-bold text-[#202730] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    أضف {purchaseType === 'carton' ? 'كرتونة' : 'قطعة'} ({qty})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
