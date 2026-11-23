import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { filterProducts } from '../utils/storeLogic';
import { HeroSlider } from './HeroSlider';
import { ImageWithFallback } from './ImageWithFallback';
import { ProductCard } from './ProductCard';

export function StorefrontHome() {
  const { loading, error, categories, products, refreshStorefront } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLatest = useMemo(
    () =>
      filterProducts(products, {
        categoryName: selectedCategory,
        searchQuery,
      }),
    [products, selectedCategory, searchQuery]
  );

  const juiceProducts = useMemo(
    () => filterProducts(products, { onlyJuices: true }),
    [products]
  );

  const offerProducts = useMemo(
    () => products.filter((p) => Boolean(String(p.discountValue || '').trim())),
    [products]
  );

  const handleSliderAction = (section: string) => {
    const idMap: Record<string, string> = {
      categories: 'categories-section',
      latest: 'latest-section',
      juices: 'juices-section',
      offers: 'offers-section',
    };
    const el = document.getElementById(idMap[section] || 'latest-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="h-[240px] sm:h-[320px] rounded-2xl bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-lg font-bold text-slate-900">{error}</p>
        <button
          type="button"
          onClick={refreshStorefront}
          className="px-5 py-2.5 bg-[#007185] text-white text-sm font-bold rounded-xl"
        >
          إعادة المحاولة
        </button>
      </main>
    );
  }

  return (
    <main id="top">
      {/* 1. Wide Auto-Transitioning Top Slider */}
      <HeroSlider onSelectSection={handleSliderAction} />

      {/* 2. Categories Section (الأقسام) */}
      <section
        id="categories-section"
        aria-labelledby="categories-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h2
              id="categories-heading"
              className="text-xl sm:text-2xl font-extrabold text-slate-900"
            >
              الأقسام
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              اختر القسم لعرض المنتجات المتاحة بسعر الجملة والتجزئة
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              aria-label="ابحث عن منتج"
              className="w-full pr-9 pl-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006577]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategory('الكل')}
            className={`aspect-square rounded-xl border overflow-hidden flex flex-col items-center justify-center gap-2 p-2 transition-colors ${
              selectedCategory === 'الكل'
                ? 'bg-[#007185] text-white border-[#007185]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            }`}
          >
            <span className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-[#eef9fb] text-[#007185] flex items-center justify-center text-lg font-extrabold">
              الكل
            </span>
            <span className="text-[11px] sm:text-xs font-bold">
              الكل ({products.length})
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`aspect-square rounded-xl border overflow-hidden flex flex-col items-center justify-between p-2 transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-[#007185] text-white border-[#007185]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="w-full flex-1 rounded-lg overflow-hidden bg-slate-100">
                {cat.imageUrl ? (
                  <ImageWithFallback
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    صورة القسم
                  </span>
                )}
              </span>
              <span className="mt-1.5 text-[11px] sm:text-xs font-bold text-center line-clamp-1">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Latest Additions (أحدث الإضافات) */}
      <section
        id="latest-section"
        aria-labelledby="latest-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12"
      >
        <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-slate-200">
          <div>
            <h2
              id="latest-heading"
              className="text-xl sm:text-2xl font-extrabold text-slate-900"
            >
              أحدث الإضافات
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              اختر المنتج للمفاضلة بين الشراء الفوري أو الإضافة إلى السلة
            </p>
          </div>
          <span className="text-xs font-mono-nums text-slate-500">
            {filteredLatest.length} منتج
          </span>
        </div>

        {filteredLatest.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <p className="text-base font-bold text-slate-800">
              لا توجد منتجات مطابقة لبحثك حالياً
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('الكل');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 text-xs font-bold bg-[#007185] text-white rounded-lg"
            >
              عرض جميع المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredLatest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Juices & Beverages Section (قسم عصائر ومشروبات) */}
      <section
        id="juices-section"
        aria-labelledby="juices-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-14"
      >
        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <h2
                id="juices-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900"
              >
                قسم عصائر ومشروبات
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                عصائر طبيعية مبردة ومشروبات منتقاة متاحة بالزجاجة وبأسعار
                الكراتين
              </p>
            </div>
            <span className="text-xs font-mono-nums text-[#007185] font-bold">
              {juiceProducts.length} أصناف
            </span>
          </div>

          {juiceProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا توجد مشروبات مضافة في هذا القسم حالياً.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {juiceProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Offers Section (العروض) */}
      {offerProducts.length > 0 && (
        <section
          id="offers-section"
          aria-labelledby="offers-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8"
        >
          <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-slate-200">
            <div>
              <h2
                id="offers-heading"
                className="text-xl sm:text-2xl font-extrabold text-slate-900"
              >
                العروض
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                أصناف بخصم محدد من المتجر
              </p>
            </div>
            <span className="text-xs font-mono-nums text-amber-800 font-bold">
              {offerProducts.length} عرض
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {offerProducts.map((product) => (
              <ProductCard key={`offer-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
