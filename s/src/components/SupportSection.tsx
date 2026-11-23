import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export function SupportSection() {
  const { settings, showToast } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر إرسال الرسالة.');
      }
      setSent(true);
      setName('');
      setPhone('');
      setMessage('');
      showToast('تم إرسال رسالتك إلى فريق الدعم بنجاح');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="support-section"
      aria-labelledby="support-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16"
    >
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <h2
            id="support-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900"
          >
            تواصل مع الدعم
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            هل لديك استفسار عن طلبات الجملة، تسعير الكميات، أو حالة التوصيل؟
            أرسل رسالتك وسيتواصل معك فريق خدمة العملاء في أقرب وقت.
          </p>

          <div className="pt-4 space-y-3 text-sm text-slate-700 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#006577] shrink-0" />
              <span className="font-mono-nums font-semibold">
                {settings?.phone || '01098765432'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#006577] shrink-0" />
              <span>{settings?.email || 'support@alhamd-store.com'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#006577] shrink-0" />
              <span>{settings?.address || 'القاهرة - جمهورية مصر العربية'}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {sent ? (
            <div className="p-6 rounded-xl bg-[#eef9fb] border border-[#b3dfe6] text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#007185] mx-auto" />
              <h3 className="text-base font-extrabold text-[#202730]">
                تم استلام رسالتك بنجاح
              </h3>
              <p className="text-sm text-[#006577]">
                وصلت رسالتك إلى لوحة تحكم الدعم الفني وسيتم التواصل معك هاتفياً
                قريباً.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="px-4 py-2 text-xs font-bold text-[#007185] bg-white border border-[#80c6d1] rounded-lg hover:bg-[#d9f0f4]"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="support-name"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    الاسم
                  </label>
                  <input
                    id="support-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اكتب اسمك"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="support-phone"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    رقم الهاتف
                  </label>
                  <input
                    id="support-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="support-message"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  الرسالة
                </label>
                <textarea
                  id="support-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب استفسارك أو طلبك بالتفصيل..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
                />
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
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#007185] hover:bg-[#006577] disabled:opacity-60 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'جاري الإرسال...' : 'إرسال'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
