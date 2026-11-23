import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import type { Category, OrderRecord } from '../../types/store';
import {
  formatCurrency,
  getOrderStatusLabel,
  type StoreProduct,
} from '../../utils/storeLogic';
import { ImageWithFallback } from '../ImageWithFallback';

const PRESET_IMAGES = [
  {
    label: 'زيت زيتون',
    url: '/src/assets/images/product_olive_oil_1794832545531.jpg',
  },
  {
    label: 'أرز بسمتي',
    url: '/src/assets/images/product_basmati_rice_1794832544609.jpg',
  },
  {
    label: 'عسل طبيعي',
    url: '/src/assets/images/product_clover_honey_1794832548060.jpg',
  },
  {
    label: 'قهوة عربية',
    url: '/src/assets/images/product_arabic_coffee_1794832776305.jpg',
  },
  {
    label: 'بهارات',
    url: '/src/assets/images/product_mixed_spices_1794832776606.jpg',
  },
  {
    label: 'عصير مانجو',
    url: '/src/assets/images/product_mango_juice_1794832544692.jpg',
  },
  {
    label: 'عصير رمان',
    url: '/src/assets/images/product_pomegranate_juice_1794832545108.jpg',
  },
  {
    label: 'عصير جوافة',
    url: '/src/assets/images/product_guava_juice_1794832777616.jpg',
  },
];

interface ProductsAdminProps {
  token: string;
  products: StoreProduct[];
  categories: Category[];
  currency: string;
  onRefresh: () => Promise<void>;
  onToast: (msg: string) => void;
}

export function AdminProductsPanel({
  token,
  products,
  categories,
  currency,
  onRefresh,
  onToast,
}: ProductsAdminProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [minWholesaleQty, setMinWholesaleQty] = useState('12');
  const [discountValue, setDiscountValue] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState(
    categories[0]?.name || 'زيوت و سمن'
  );
  const [unit, setUnit] = useState('قطعة');
  const [stock, setStock] = useState('50');
  const [isJuiceSection, setIsJuiceSection] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [catDrafts, setCatDrafts] = useState<
    Record<number, { name: string; imageUrl: string }>
  >({});
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setWholesalePrice('');
    setMinWholesaleQty('12');
    setDiscountValue('');
    setImageUrl(PRESET_IMAGES[0].url);
    setDescription('');
    setUnit('قطعة');
    setStock('50');
    setIsJuiceSection(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const catObj = categories.find((c) => c.name === categoryName);
      const url = editingId
        ? `/api/admin/products/${editingId}`
        : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
          minWholesaleQty: Number(minWholesaleQty) || 6,
          discountValue: discountValue ? String(Number(discountValue)) : '',
          imageUrl,
          description,
          categoryId: catObj?.id ?? null,
          categoryName,
          unit,
          stock: Number(stock) || 50,
          isJuiceSection,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ المنتج.');
      onToast(editingId ? 'تم تحديث المنتج بنجاح' : 'تمت إضافة المنتج للمتجر');
      resetForm();
      await onRefresh();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'حدث خطأ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: StoreProduct) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setWholesalePrice(p.wholesalePrice ? String(p.wholesalePrice) : '');
    setMinWholesaleQty(String(p.minWholesaleQty || 6));
    setDiscountValue(p.discountValue ? String(p.discountValue) : '');
    setImageUrl(p.imageUrl);
    setDescription(p.description);
    setCategoryName(p.categoryName);
    setUnit(p.unit);
    setStock(String(p.stock));
    setIsJuiceSection(p.isJuiceSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      onToast('تم حذف المنتج');
      await onRefresh();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newCatName.trim(),
        imageUrl: newCatImage.trim(),
      }),
    });
    if (res.ok) {
      setNewCatName('');
      setNewCatImage('');
      onToast('تمت إضافة القسم');
      await onRefresh();
    }
  };

  const readImage = (file: File | undefined, onLoad: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onLoad(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCategory = async (cat: Category) => {
    const draft = catDrafts[cat.id] || { name: cat.name, imageUrl: cat.imageUrl || '' };
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: draft.name,
        imageUrl: draft.imageUrl,
      }),
    });
    if (res.ok) {
      onToast(`تم حفظ بيانات قسم ${cat.name}`);
      await onRefresh();
    }
  };

  const cartonCount = Math.max(1, Number(minWholesaleQty) || 12);
  const cartonPriceValue = Number(wholesalePrice) || 0;
  const perBottleInCarton = cartonPriceValue > 0 ? cartonPriceValue / cartonCount : null;

  return (
    <div className="space-y-6">
      {/* Add/Edit Product Form */}
      <form
        onSubmit={handleSaveProduct}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            {editingId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="prod-name"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              اسم المنتج
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: زيت زيتون بكر 1 لتر"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
            />
          </div>

          <div>
            <label
              htmlFor="prod-price"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              سعر البيع (الزجاجة / القطعة - {currency})
            </label>
            <input
              id="prod-price"
              type="number"
              step="0.01"
              min="1"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="38"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-nums focus:outline-none focus:ring-2 focus:ring-[#006577]"
            />
          </div>

          <div>
            <label
              htmlFor="prod-wholesale"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              سعر الكرتونة ({currency})
            </label>
            <input
              id="prod-wholesale"
              type="number"
              step="0.01"
              min="0"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
              placeholder="360"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-nums focus:outline-none focus:ring-2 focus:ring-[#006577]"
            />
          </div>

          <div>
            <label
              htmlFor="prod-category"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              القسم
            </label>
            <select
              id="prod-category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#006577]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              <option value="عام">عام</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="prod-unit"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              الوحدة / الوزن
            </label>
            <input
              id="prod-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="عبوة / كجم / كرتونة"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="prod-stock"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                المخزون
              </label>
              <input
                id="prod-stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-nums"
              />
            </div>
            <div>
              <label
                htmlFor="prod-minqty"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                عدد الزجاجات داخل الكرتونة
              </label>
              <input
                id="prod-minqty"
                type="number"
                min="1"
                value={minWholesaleQty}
                onChange={(e) => setMinWholesaleQty(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-nums"
              />
            </div>
          </div>
        </div>

        {/* مربع الخصم الاختياري: المدير يكتب الرقم ويظهر على بطاقة المنتج كـ خصم X% */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#ffef8a] bg-[#fffbe6] px-3 py-2.5">
          <label
            htmlFor="prod-discount"
            className="text-xs font-extrabold text-[#6b5200]"
          >
            وفر 40% (اختياري)
          </label>
          <input
            id="prod-discount"
            type="number"
            min="1"
            max="100"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder="40"
            className="w-24 px-3 py-1.5 text-sm border border-[#FED700] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#e6c200] font-mono-nums"
          />
          <span className="text-[11px] text-amber-800">
            اكتب الرقم فقط (مثال 40). اتركه فارغاً لعدم إظهار خصم.
          </span>
          {discountValue && (
            <span className="text-[11px] font-bold text-[#6b5200]">
              سيظهر للعميل: خصم {discountValue}%
            </span>
          )}
        </div>

        <div className="rounded-lg bg-[#eef9fb] border border-[#b3dfe6] px-3 py-2 text-xs text-[#007185] leading-relaxed">
          {perBottleInCarton !== null ? (
            <>
              سعر الزجاجة داخل الكرتونة:{' '}
              <strong className="font-mono-nums">
                {formatCurrency(perBottleInCarton, currency)}
              </strong>
              {' · '} سيظهر للمشتري: الكرتونة ({cartonCount} زجاجة) بسعر{' '}
              <strong className="font-mono-nums">
                {formatCurrency(cartonPriceValue, currency)}
              </strong>
              {' '}والزجاجة بسعر{' '}
              <strong className="font-mono-nums">
                {formatCurrency(Number(price) || 0, currency)}
              </strong>
            </>
          ) : (
            <>أدخل سعر الكرتونة وعدد الزجاجات بداخلها ليظهر السعران للمشتري في المتجر.</>
          )}
        </div>

        {/* Product Image URL or Upload */}
        <div className="space-y-2">
          <label
            htmlFor="prod-image"
            className="block text-xs font-bold text-slate-700"
          >
            صورة المنتج (رابط الصورة أو رفع ملف أو اختيار من المعرض)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="prod-image"
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/src/assets/images/..."
              className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
            />
            <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer shrink-0">
              <Upload className="w-4 h-4" />
              <span>رفع صورة</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_IMAGES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setImageUrl(preset.url)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  imageUrl === preset.url
                    ? 'bg-[#007185] text-white border-[#007185]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <label
            htmlFor="prod-desc"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            بيانات المنتج (الوصف والمواصفات)
          </label>
          <textarea
            id="prod-desc"
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب مواصفات المنتج وجودته وتفاصيل العبوة..."
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isJuiceSection}
              onChange={(e) => setIsJuiceSection(e.target.checked)}
              className="w-4 h-4 rounded accent-[#006577]"
            />
            <span>إظهار في قسم عصائر ومشروبات</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-xl transition-colors disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>
              {submitting
                ? 'جاري الحفظ...'
                : editingId
                  ? 'حفظ التعديلات'
                  : 'إضافة المنتج'}
            </span>
          </button>
        </div>
      </form>

      {/* Category Adder + Image Editor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <form
          onSubmit={handleAddCategory}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="إضافة قسم جديد للمتجر..."
            className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="text"
            value={newCatImage}
            onChange={(e) => setNewCatImage(e.target.value)}
            placeholder="رابط صورة القسم (اختياري)"
            className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer whitespace-nowrap">
            <Upload className="w-4 h-4" />
            <span>رفع صورة</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                readImage(e.target.files?.[0], setNewCatImage)
              }
              className="hidden"
            />
          </label>
          <button
            type="submit"
            className="px-4 py-2 text-xs sm:text-sm font-bold text-[#202730] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg whitespace-nowrap"
          >
            إضافة قسم
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">
            تعديل أسماء الأقسام وصورها
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const draft = catDrafts[cat.id] || {
                name: cat.name,
                imageUrl: cat.imageUrl || '',
              };
              return (
                <div
                  key={cat.id}
                  className="border border-slate-200 rounded-xl p-3 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {draft.imageUrl ? (
                        <ImageWithFallback
                          src={draft.imageUrl}
                          alt={draft.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          لا توجد صورة
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) =>
                        setCatDrafts((prev) => ({
                          ...prev,
                          [cat.id]: { ...draft, name: e.target.value },
                        }))
                      }
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      aria-label={`اسم قسم ${cat.name}`}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={draft.imageUrl}
                      onChange={(e) =>
                        setCatDrafts((prev) => ({
                          ...prev,
                          [cat.id]: { ...draft, imageUrl: e.target.value },
                        }))
                      }
                      placeholder="رابط الصورة أو ارفع ملفاً"
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                    <label className="inline-flex items-center justify-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          readImage(e.target.files?.[0], (url) =>
                            setCatDrafts((prev) => ({
                              ...prev,
                              [cat.id]: { ...draft, imageUrl: url },
                            }))
                          )
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveCategory(cat)}
                    className="w-full py-1.5 text-xs font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-lg"
                  >
                    حفظ القسم
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            قائمة المنتجات ({products.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">المنتج</th>
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4">السعر / الكرتونة</th>
                <th className="py-3 px-4">المخزون</th>
                <th className="py-3 px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <ImageWithFallback
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {p.unit}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700">
                    {p.categoryName}
                  </td>
                  <td className="py-3 px-4 font-mono-nums">
                    <span className="font-bold text-[#202730]">
                      {formatCurrency(p.price, currency)}
                    </span>
                    {p.wholesalePrice && (
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        كرتونة ({p.minWholesaleQty}):{' '}
                        {formatCurrency(p.wholesalePrice, currency)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono-nums text-slate-700">
                    {p.stock}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        aria-label={`تعديل ${p.name}`}
                        className="p-2 text-slate-600 hover:text-[#007185] hover:bg-slate-100 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        aria-label={`حذف ${p.name}`}
                        className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface OrdersAdminProps {
  token: string;
  orders: OrderRecord[];
  currency: string;
  onReloadOrders: () => Promise<void>;
  onToast: (msg: string) => void;
}

export function AdminOrdersPanel({
  token,
  orders,
  currency,
  onReloadOrders,
  onToast,
}: OrdersAdminProps) {
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);

  const handleStatusChange = async (orderId: number, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onToast('تم تحديث حالة الطلب');
      await onReloadOrders();
    }
  };

  const handleAvailability = async (itemId: number, availability: string) => {
    const res = await fetch(`/api/admin/order-items/${itemId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availability }),
    });
    if (res.ok) {
      onToast('تم تحديث حالة الصنف');
      await onReloadOrders();
    }
  };

  const printInvoice = (ord: OrderRecord) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      onToast('يرجى السماح بفتح نوافذ جديدة لطباعة الفاتورة.');
      return;
    }
    const rows = (ord.items || [])
      .map(
        (it) => `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${it.productName}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.quantity}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${Number(
            it.unitPrice
          ).toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${Number(
            it.subtotal
          ).toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${
            it.availability || 'متوفر'
          }</td>
        </tr>`
      )
      .join('');
    win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة ${
      ord.orderNumber
    }</title></head><body style="font-family:Tahoma,Arial,sans-serif;padding:24px">
      <h1 style="text-align:center;margin-bottom:4px">فاتورة طلب</h1>
      <p style="text-align:center;color:#555;margin-top:0">${ord.orderNumber}</p>
      <p>العميل: ${ord.customerName} · الهاتف: ${ord.customerPhone}</p>
      <p>العنوان: ${ord.customerAddress}</p>
      <p>التاريخ: ${new Date(ord.createdAt).toLocaleString('ar-EG')}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:8px;border:1px solid #ddd;text-align:right">الصنف</th>
          <th style="padding:8px;border:1px solid #ddd">الكمية</th>
          <th style="padding:8px;border:1px solid #ddd">سعر الوحدة</th>
          <th style="padding:8px;border:1px solid #ddd">المجموع</th>
          <th style="padding:8px;border:1px solid #ddd">الحالة</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h3 style="text-align:left;margin-top:16px">الإجمالي: ${Number(
        ord.totalAmount
      ).toFixed(2)} ${currency}</h3>
      <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-extrabold text-slate-900">
          الطلبات المستلمة ({orders.length})
        </h3>
      </div>
      {orders.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">
          لا توجد طلبات مسجلة حتى الآن.
        </p>
      ) : (
        <div className="divide-y divide-slate-200">
          {orders.map((ord) => (
            <div key={ord.id} className="p-5 space-y-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setOpenOrderId(openOrderId === ord.id ? null : ord.id)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    setOpenOrderId(openOrderId === ord.id ? null : ord.id);
                }}
                className="flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1 -m-1"
              >
                <div>
                  <span className="font-mono-nums font-extrabold text-slate-900">
                    {ord.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500 mr-3">
                    {ord.customerName} · {ord.customerPhone}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono-nums font-extrabold text-[#202730]">
                    {formatCurrency(ord.totalAmount, currency)}
                  </span>
                  <select
                    aria-label={`تغيير حالة الطلب ${ord.orderNumber}`}
                    value={ord.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="pending">قيد المراجعة</option>
                    <option value="processing">جاري التجهيز</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                العنوان: {ord.customerAddress} · الدفع: عند الاستلام · الحالة:{' '}
                <strong>{getOrderStatusLabel(ord.status)}</strong>
              </p>

              {openOrderId === ord.id && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      الأصناف المطلوبة
                    </h4>
                    <button
                      type="button"
                      onClick={() => printInvoice(ord)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-lg"
                    >
                      اطبع الفاتورة
                    </button>
                  </div>
                  {ord.items && ord.items.length > 0 ? (
                    <div className="space-y-2">
                      {ord.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {it.productName} × {it.quantity}
                              {it.purchaseType === 'carton' && ' (كرتونة)'}
                            </p>
                            <p className="text-slate-500 font-mono-nums">
                              {formatCurrency(it.subtotal, currency)}
                            </p>
                          </div>
                          <select
                            aria-label={`توفر صنف ${it.productName}`}
                            value={it.availability || 'متوفر'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleAvailability(it.id, e.target.value)
                            }
                            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border ${
                              (it.availability || 'متوفر') === 'متوفر'
                                ? 'text-[#006577] bg-[#eef9fb] border-[#b3dfe6]'
                                : 'text-rose-800 bg-rose-50 border-rose-200'
                            }`}
                          >
                            <option value="متوفر">متوفر</option>
                            <option value="غير متوفر">غير متوفر</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      لا توجد أصناف مسجلة لهذا الطلب.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
