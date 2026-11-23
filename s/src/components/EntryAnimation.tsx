import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';

const WELCOME_TEXT = 'مرحبا بكم في حرق اسعار';

interface EntryAnimationProps {
  onDone: () => void;
}

/** شاشة دخول قصيرة تُكتب فيها عبارة الترحيب حرفاً بحرف ثم تفتح المتجر */
export function EntryAnimation({ onDone }: EntryAnimationProps) {
  const { settings } = useStore();
  const [visibleCount, setVisibleCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = settings?.logoUrl;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    if (visibleCount >= WELCOME_TEXT.length) {
      const t = setTimeout(() => setLeaving(true), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((n) => n + 1), 85);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, 450);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  const finished = visibleCount >= WELCOME_TEXT.length;

  return (
    <div
      role="splash"
      aria-label={WELCOME_TEXT}
      onClick={onDone}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#202730] transition-opacity duration-500 cursor-pointer ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden p-1.5">
        {logoUrl && !logoFailed ? (
          <img
            src={logoUrl}
            alt={settings?.storeName || 'شعار المتجر'}
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
            className="w-full h-full rounded-xl object-contain"
          />
        ) : (
          <span className="text-3xl font-extrabold text-[#FED700]">ح</span>
        )}
      </div>
      <p
        dir="rtl"
        className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight min-h-[2.5rem]"
      >
        {WELCOME_TEXT.slice(0, visibleCount)}
        {!finished && (
          <span className="inline-block w-[2px] h-[1em] mr-1 bg-[#FED700] align-middle animate-pulse" />
        )}
      </p>
      {finished && (
        <div className="w-40 h-1 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-full rounded-full bg-[#FED700]" />
        </div>
      )}
    </div>
  );
}
