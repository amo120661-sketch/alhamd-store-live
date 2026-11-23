import { LogOut, Package, User as UserIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { OrderRecord } from '../types/store';
import {
  formatCurrency,
  getOrderStatusLabel,
  getRoleLabel,
  validateRegistrationInput,
} from '../utils/storeLogic';

interface AuthModalProps {
  /** يُستدعى بعد الدخول أو إنشاء الحساب للانتقال إلى قائمة الأقسام */
  onAuthenticated?: () => void;
}

export function AuthModal({ onAuthenticated }: AuthModalProps) {
  const {
    isAuthOpen,
    setIsAuthOpen,
    user,
    token,
    settings,
    loginWithPassword,
    registerAccount,
    logout,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [center, setCenter] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!isAuthOpen || !user || !token) return;
    setLoadingOrders(true);
    fetch('/api/my-orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMyOrders(Array.isArray(data) ? data : []))
      .catch(() => setMyOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [isAuthOpen, user, token]);

  if (!isAuthOpen) return null;

  const currency = settings?.currency || 'ج.م';

  const fieldClass =
    'w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]';
  const labelClass = 'block text-xs font-bold text-slate-700 mb-1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      const validation = validateRegistrationInput({
        name,
        storeName,
        phone,
        password,
        governorate,
        center,
        address,
      });
      if (!validation.valid) {
        setErrorMsg(validation.error || 'بيانات التسجيل غير مكتملة.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithPassword(identifier, password);
      } else {
        await registerAccount({
          name,
          storeName,
          phone,
          password,
          governorate,
          center,
          address,
        });
      }
      setIsAuthOpen(false);
      setPassword('');
      onAuthenticated?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر إتمام العملية.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="حساب المستخدم"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            {user
              ? 'حسابي وطلباتي'
              : mode === 'login'
                ? 'تسجيل الدخول'
                : 'إنشاء الحساب'}
          </h2>
          <button
            type="button"
            onClick={() => setIsAuthOpen(false)}
            aria-label="إغلاق نافذة الحساب"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#007185] text-white flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.storeName || user.phone || ''} ·{' '}
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setIsAuthOpen(false);
                }}
                className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg inline-flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#006577]" />
                <span>طلباتي السابقة</span>
              </h3>

              {loadingOrders ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  جاري تحميل الطلبات...
                </p>
              ) : myOrders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                  لم تقم بإجراء أي طلبات بعد.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {myOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="font-mono-nums text-slate-900">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[#006577]">
                          {getOrderStatusLabel(ord.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>الدفع عند الاستلام</span>
                        <span className="font-mono-nums font-bold text-slate-900">
                          {formatCurrency(ord.totalAmount, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إنشاء حساب
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' ? (
                <>
                  <div>
                    <label htmlFor="auth-name" className={labelClass}>
                      إسم العميل
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="الاسم الثلاثي"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-store" className={labelClass}>
                      اسم المحل
                    </label>
                    <input
                      id="auth-store"
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="اسم محلركم"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className={labelClass}>
                      رقم السري
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-phone" className={labelClass}>
                      رقم الهاتف
                    </label>
                    <input
                      id="auth-phone"
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={11}
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))
                      }
                      placeholder="11 رقماً — 01012345678"
                      className={fieldClass}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      يجب أن يتكون رقم الهاتف من 11 رقماً بالضبط.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="auth-gov" className={labelClass}>
                      المحافظه
                    </label>
                    <input
                      id="auth-gov"
                      type="text"
                      required
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      placeholder="مثال: القاهرة"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-center" className={labelClass}>
                      المركز
                    </label>
                    <input
                      id="auth-center"
                      type="text"
                      required
                      value={center}
                      onChange={(e) => setCenter(e.target.value)}
                      placeholder="مثال: مدينة نصر"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-address" className={labelClass}>
                      عنوان المحل
                    </label>
                    <input
                      id="auth-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="الشارع، رقم المحل"
                      className={fieldClass}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="auth-identifier" className={labelClass}>
                      رقم الهاتف أو البريد الإلكتروني
                    </label>
                    <input
                      id="auth-identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="01012345678"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-login-password" className={labelClass}>
                      رقم السري
                    </label>
                    <input
                      id="auth-login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      className={fieldClass}
                    />
                  </div>
                </>
              )}

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
                disabled={submitting}
                className="w-full py-3 bg-[#007185] hover:bg-[#006577] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {submitting
                  ? 'يرجى الانتظار...'
                  : mode === 'login'
                    ? 'دخول'
                    : 'إنشاء الحساب'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
