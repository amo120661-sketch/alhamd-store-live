import { ShoppingBag, Tag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  formatCurrency,
  type PurchaseType,
} from '../utils/storeLogic';
import { ImageWithFallback } from './ImageWithFallback';

/** بديل سلة المفضلة: يعرض الأصناف التي حدد لها المدير قيمة خصم */
export function OffersDrawer() {
  const {
    isOffersOpen,
    setIsOffersOpen,
    products,
    settings,
    addToCart,
    setSelectedProduct,
  } = useStore();

  if (!isOffersOpen) return null;

  const currency = settings?.currency || 'ج.م';
  const offerProducts = products.filter((p) =>
    Boolean(String(p.discountValue || '').trim())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="العروض"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col border-r border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#007185]" />
            <h2 className="text-lg font-extrabold text-slate-900">
              العروض ({offerProducts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOffersOpen(false)}
            aria-label="إغلاق العروض"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {offerProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Tag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800">
                لا توجد عروض حالياً
              </p>
              <p className="text-sm text-slate-500">
                ستظهر هنا الأصناف التي يضيف لها المدير قيمة خصم.
              </p>
            </div>
          ) : (
            offerProducts.map((product) => {
              const cartonAvailable = Number(product.wholesalePrice) > 0;
              return (
                <div
                  key={product.id}
                  className="flex gap-3.5 pb-4 border-b border-slate-100"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#fff7c2] text-[#6b5200] text-[11px] font-extrabold">
                      خصم {product.discountValue}%
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm font-extrabold text-[#202730] font-mono-nums">
                      {cartonAvailable
                        ? formatCurrency(Number(product.wholesalePrice), currency)
                        : formatCurrency(product.price, currency)}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOffersOpen(false);
                          setSelectedProduct(product);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-lg"
                      >
                        شراء الآن
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart(
                            product,
                            1,
                            (cartonAvailable ? 'carton' : 'piece') as PurchaseType
                          )
                        }
                        className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>للسلة</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
