import { Plus, Send, Trash2, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type {
  AdminUserRecord,
  ChatSessionGroup,
  SliderImage,
  StoreSettings,
  SupportMessageRecord,
  TopOffer,
} from '../../types/store';
import { getRoleLabel } from '../../utils/storeLogic';
import { ImageWithFallback } from '../ImageWithFallback';

// 1. Users Panel
export function AdminUsersPanel({
  token,
  usersList,
  onReload,
  onToast,
}: {
  token: string;
  usersList: AdminUserRecord[];
  onReload: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const toggleActive = async (id: number) => {
    const res = await fetch(`/api/admin/users/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      onToast(data.error || 'تعذر تغيير الحالة.');
      return;
    }
    onToast('تم تحديث حالة الحساب');
    await onReload();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-extrabold text-slate-900">
          إدارة المستخدمين ({usersList.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">الاسم</th>
              <th className="py-3 px-4">البريد الإلكتروني</th>
              <th className="py-3 px-4">الهاتف</th>
              <th className="py-3 px-4">الدور</th>
              <th className="py-3 px-4">الحالة</th>
              <th className="py-3 px-4">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.map((u) => (
              <tr key={u.id}>
                <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                <td className="py-3 px-4 text-xs text-slate-600">{u.email}</td>
                <td className="py-3 px-4 text-xs font-mono-nums">
                  {u.phone || '—'}
                </td>
                <td className="py-3 px-4 text-xs font-semibold">
                  {getRoleLabel(u.role)}
                </td>
                <td className="py-3 px-4 text-xs font-bold">
                  {u.isActive ? (
                    <span className="text-[#006577]">نشط</span>
                  ) : (
                    <span className="text-rose-700">موقوف</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleActive(u.id)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    {u.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. Support Messages + Live Chat Inbox
export function AdminSupportAndChatPanel({
  token,
  supportMessages,
  chatSessions,
  onReload,
  onToast,
}: {
  token: string;
  supportMessages: SupportMessageRecord[];
  chatSessions: ChatSessionGroup[];
  onReload: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    chatSessions[0]?.sessionId || null
  );
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!selectedSessionId && chatSessions.length > 0) {
      setSelectedSessionId(chatSessions[0].sessionId);
    }
  }, [chatSessions, selectedSessionId]);

  const activeSession = chatSessions.find(
    (s) => s.sessionId === selectedSessionId
  );

  const handleMarkReplied = async (id: number) => {
    await fetch(`/api/admin/support/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'replied' }),
    });
    onToast('تم التحديد كـ تم الرد');
    await onReload();
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !replyText.trim()) return;
    const res = await fetch(
      `/api/admin/chats/${encodeURIComponent(selectedSessionId)}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      }
    );
    if (res.ok) {
      setReplyText('');
      onToast('تم إرسال الرد للعميل');
      await onReload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Customer Chat Inbox */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            دردشة خدمة العملاء المباشرة ({chatSessions.length})
          </h3>
          <button
            type="button"
            onClick={onReload}
            className="text-xs font-bold text-[#007185] hover:underline"
          >
            تحديث المحادثات
          </button>
        </div>

        {chatSessions.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            لا توجد محادثات دردشة حالياً.
          </p>
        ) : (
          <div className="grid md:grid-cols-12 min-h-[320px]">
            <div className="md:col-span-4 border-b md:border-b-0 md:border-l border-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {chatSessions.map((sess) => (
                <button
                  key={sess.sessionId}
                  type="button"
                  onClick={() => setSelectedSessionId(sess.sessionId)}
                  className={`w-full text-right p-3.5 transition-colors ${
                    sess.sessionId === selectedSessionId
                      ? 'bg-[#eef9fb]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {sess.customerName}
                    </span>
                    {sess.unreadCount > 0 && (
                      <span className="font-mono-nums text-[11px] font-bold text-[#007185]">
                        {sess.unreadCount} جديد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    {sess.lastMessage}
                  </p>
                </button>
              ))}
            </div>

            <div className="md:col-span-8 flex flex-col justify-between p-4 bg-slate-50">
              {activeSession ? (
                <>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto mb-3">
                    {activeSession.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.senderRole === 'admin'
                            ? 'items-start'
                            : 'items-end'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 mb-0.5">
                          {m.senderName}
                        </span>
                        <div
                          className={`px-3 py-2 rounded-xl text-xs sm:text-sm max-w-[80%] ${
                            m.senderRole === 'admin'
                              ? 'bg-[#007185] text-white'
                              : 'bg-white border border-slate-200 text-slate-900'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChatReply} className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب رد خدمة العملاء هنا..."
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#007185] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>رد</span>
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-slate-500 m-auto">
                  اختر محادثة لعرضها
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Support Form Messages */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-extrabold text-slate-900">
            رسائل الدعم المستلمة ({supportMessages.length})
          </h3>
        </div>
        {supportMessages.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            لا توجد رسائل دعم مستلمة حتى الآن.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {supportMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span>{msg.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-nums text-[#007185]">
                      {msg.phone}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-xs text-slate-500">
                      {msg.status === 'new' ? 'جديدة' : 'تمت المتابعة'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{msg.message}</p>
                </div>

                {msg.status === 'new' && (
                  <button
                    type="button"
                    onClick={() => handleMarkReplied(msg.id)}
                    className="px-3.5 py-2 text-xs font-bold bg-[#007185] text-white rounded-lg shrink-0"
                  >
                    تحديد كمقروءة
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Add Managers Panel
export function AdminManagersPanel({
  token,
  usersList,
  onReload,
  onToast,
}: {
  token: string;
  usersList: AdminUserRecord[];
  onReload: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'admin'>('manager');

  const admins = usersList.filter(
    (u) => u.role === 'admin' || u.role === 'manager'
  );

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, phone, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      onToast(data.error || 'تعذر إضافة المدير.');
      return;
    }
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    onToast('تمت إضافة المدير بنجاح');
    await onReload();
  };

  const handleDemote = async (id: number) => {
    const res = await fetch(`/api/admin/admins/${id}/demote`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      onToast(data.error || 'تعذر إزالة الصلاحية.');
      return;
    }
    onToast('تم سحب صلاحيات الإدارة');
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAddManager}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <h3 className="text-base font-extrabold text-slate-900">
          إضافة مدير أو مشرف جديد
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المدير"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور (للحسابات الجديدة)"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value === 'admin' ? 'admin' : 'manager')
            }
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
          >
            <option value="manager">مدير متجر</option>
            <option value="admin">مدير عام</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>حفظ المدير</span>
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900">
            المديرون الحاليون ({admins.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {admins.map((a) => (
            <div
              key={a.id}
              className="px-5 py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-sm text-slate-900">{a.name}</p>
                <p className="text-xs text-slate-500">
                  {a.email} · {getRoleLabel(a.role)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDemote(a.id)}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg"
              >
                سحب الصلاحية
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. Store Settings & Social Media Links
export function AdminSettingsPanel({
  token,
  settings,
  mode,
  onReload,
  onToast,
}: {
  token: string;
  settings: StoreSettings | null;
  mode: 'settings' | 'social';
  onReload: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    storeName: settings?.storeName || 'حرق اسعار',
    logoUrl: settings?.logoUrl || '',
    storeDescription: settings?.storeDescription || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    address: settings?.address || '',
    deliveryFee: String(settings?.deliveryFee ?? '35'),
    freeDeliveryThreshold: String(settings?.freeDeliveryThreshold ?? '600'),
    facebookUrl: settings?.facebookUrl || '',
    instagramUrl: settings?.instagramUrl || '',
    whatsappUrl: settings?.whatsappUrl || '',
    tiktokUrl: settings?.tiktokUrl || '',
    twitterUrl: settings?.twitterUrl || '',
    youtubeUrl: settings?.youtubeUrl || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onToast(
        mode === 'social'
          ? 'تم تحديث روابط التواصل الاجتماعي بنجاح'
          : 'تم حفظ إعدادات المتجر بنجاح'
      );
      await onReload();
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <h3 className="text-base font-extrabold text-slate-900">
        {mode === 'social'
          ? 'روابط منصات التواصل الاجتماعي (تظهر أسفل الموقع)'
          : 'إعدادات المتجر والتوصيل'}
      </h3>

      {mode === 'settings' ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المتجر
            </label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              شعار الموقع (لوجو الموقع)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {form.logoUrl ? (
                  <ImageWithFallback
                    src={form.logoUrl}
                    alt="شعار المتجر"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[#007185] font-extrabold text-xl">ح</span>
                )}
              </div>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="رابط صورة الشعار أو ارفع ملفاً"
                className="flex-1 min-w-[180px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
              <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer whitespace-nowrap">
                <Upload className="w-4 h-4" />
                <span>رفع الشعار</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setForm({ ...form, logoUrl: reader.result });
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              سيظهر الشعار في الشريط العلوي للموقع بدلاً من الحرف الافتراضي.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم الهاتف
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني للدعم
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              العنوان
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رسوم التوصيل (ج.م)
            </label>
            <input
              type="number"
              value={form.deliveryFee}
              onChange={(e) =>
                setForm({ ...form, deliveryFee: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الحد الأدنى للتوصيل المجاني (ج.م)
            </label>
            <input
              type="number"
              value={form.freeDeliveryThreshold}
              onChange={(e) =>
                setForm({ ...form, freeDeliveryThreshold: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-nums"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نبذة عن المتجر
            </label>
            <textarea
              rows={2}
              value={form.storeDescription}
              onChange={(e) =>
                setForm({ ...form, storeDescription: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط فيسبوك (Facebook)
            </label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) =>
                setForm({ ...form, facebookUrl: e.target.value })
              }
              placeholder="https://facebook.com/..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط إنستغرام (Instagram)
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) =>
                setForm({ ...form, instagramUrl: e.target.value })
              }
              placeholder="https://instagram.com/..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط واتساب (WhatsApp)
            </label>
            <input
              type="url"
              value={form.whatsappUrl}
              onChange={(e) =>
                setForm({ ...form, whatsappUrl: e.target.value })
              }
              placeholder="https://wa.me/2010..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط تيك توك (TikTok)
            </label>
            <input
              type="url"
              value={form.tiktokUrl}
              onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
              placeholder="https://tiktok.com/@..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط إكس / تويتر (X)
            </label>
            <input
              type="url"
              value={form.twitterUrl}
              onChange={(e) => setForm({ ...form, twitterUrl: e.target.value })}
              placeholder="https://x.com/..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط يوتيوب (YouTube)
            </label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              placeholder="https://youtube.com/@..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="px-6 py-2.5 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] rounded-xl"
      >
        حفظ التغييرات
      </button>
    </form>
  );
}

// 5. Sliders Panel
export function AdminSlidersPanel({
  token,
  sliders,
  onReload,
  onToast,
}: {
  token: string;
  sliders: SliderImage[];
  onReload: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState(
    '/src/assets/images/slider_wholesale_pantry_1794832543519.jpg'
  );
  const [linkSection, setLinkSection] = useState('latest');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/sliders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, subtitle, imageUrl, linkSection }),
    });
    if (res.ok) {
      setTitle('');
      setSubtitle('');
      onToast('تمت إضافة صورة السلايدر');
      await onReload();
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/sliders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onToast('تم حذف الشريحة');
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <h3 className="text-base font-extrabold text-slate-900">
          إضافة صورة للسلايدر العلوي العريض
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الشريحة"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="وصف مختصر"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="رابط الصورة العريضة"
              className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>رفع صورة</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
          <select
            value={linkSection}
            onChange={(e) => setLinkSection(e.target.value)}
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
          >
            <option value="latest">توجيه إلى أحدث الإضافات</option>
            <option value="juices">توجيه إلى قسم العصائر والمشروبات</option>
            <option value="categories">توجيه إلى الأقسام</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-[#007185] rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة شريحة للسلايدر</span>
        </button>
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {sliders.map((s) => (
          <div
            key={s.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            <div className="h-36 bg-slate-100">
              <ImageWithFallback
                src={s.imageUrl}
                alt={s.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">
                  {s.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                aria-label={`حذف ${s.title}`}
                className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Top Offers Panel
export function AdminOffersPanel({
  token,
  offers,
  onReload,
  onToast,
}: {
  token: string;
  offers: TopOffer[];
  onReload: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const [badgeText, setBadgeText] = useState('عرض خاص');
  const [text, setText] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ badgeText, text }),
    });
    if (res.ok) {
      setText('');
      onToast('تمت إضافة العرض في أعلى الموقع');
      await onReload();
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onToast('تم حذف العرض');
    await onReload();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <h3 className="text-base font-extrabold text-slate-900">
          إضافة عرض في شريط أعلى الموقع
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <input
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            placeholder="عنوان قصير (مثال: عرض التوصيل)"
            className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <input
            type="text"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="نص العرض الذي يظهر أعلى المتجر..."
            className="sm:col-span-2 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-[#007185] rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>نشر العرض</span>
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {offers.map((o) => (
          <div
            key={o.id}
            className="px-5 py-3.5 flex items-center justify-between gap-4"
          >
            <p className="text-sm text-slate-800">
              {o.badgeText && (
                <strong className="text-[#007185] ml-2">{o.badgeText}:</strong>
              )}
              {o.text}
            </p>
            <button
              type="button"
              onClick={() => handleDelete(o.id)}
              aria-label="حذف العرض"
              className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
