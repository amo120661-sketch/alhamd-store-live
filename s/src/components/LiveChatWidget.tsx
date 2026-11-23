import { MessageCircle, Send, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { ChatMessageRecord } from '../types/store';

const SESSION_KEY = 'alhamd_chat_session_id';

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return `chat-${Date.now()}`;
  }
}

export function LiveChatWidget() {
  const { isChatOpen, setIsChatOpen, user, token } = useStore();
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [senderName, setSenderName] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user?.name && !senderName) {
      setSenderName(user.name);
    }
  }, [user, senderName]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(sessionId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch {
      // ignore transient network errors
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isChatOpen) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3500);
    return () => clearInterval(interval);
  }, [isChatOpen, fetchMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isChatOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          senderName: senderName.trim() || user?.name || 'عميل المتجر',
          message: draft.trim(),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setMessages((prev) => [...prev, created]);
        setDraft('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Customer Support Chat Button (kept clean above mobile sticky nav) */}
      <button
        type="button"
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? 'إغلاق دردشة خدمة العملاء' : 'دردشة خدمة العملاء'}
        className="fixed bottom-20 md:bottom-5 left-3 sm:left-6 z-40 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-[#007185] hover:bg-[#006577] text-white text-xs sm:text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5"
      >
        {isChatOpen ? (
          <X className="w-4 h-4" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        <span>خدمة العملاء</span>
      </button>

      {isChatOpen && (
        <div
          role="dialog"
          aria-label="محادثة خدمة العملاء"
          className="fixed bottom-36 md:bottom-20 left-4 sm:left-6 z-40 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[460px]"
        >
          <div className="px-4 py-3.5 bg-[#202730] text-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold">دردشة خدمة العملاء</h3>
              <p className="text-[11px] text-[#b3dfe6]">
                متصل مباشرة بإدارة حرق اسعار
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              aria-label="إغلاق الدردشة"
              className="p-1.5 rounded-lg text-[#b3dfe6] hover:text-white hover:bg-[#007185]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[220px]"
          >
            {messages.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">
                  أهلاً بك في متجر حرق اسعار
                </p>
                <p>اكتب رسالتك هنا وسيرد عليك موظف خدمة العملاء فوراً.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isCustomer = m.senderRole === 'customer';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isCustomer ? 'items-start' : 'items-end'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 mb-1 px-1">
                      {m.senderName}
                    </span>
                    <div
                      className={`max-w-[82%] px-3.5 py-2 rounded-xl text-xs sm:text-sm leading-relaxed ${
                        isCustomer
                          ? 'bg-[#007185] text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 space-y-2"
          >
            {!user && (
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="اسمك (اختياري)"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006577]"
              />
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="اكتب رسالتك لخدمة العملاء..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006577]"
              />
              <button
                type="submit"
                disabled={sending}
                aria-label="إرسال رسالة الدردشة"
                className="w-10 h-10 rounded-lg bg-[#007185] hover:bg-[#006577] text-white flex items-center justify-center shrink-0 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
