import { Home, LayoutGrid, LogIn, ShoppingBag, Tag, User as UserIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ImageWithFallback } from './ImageWithFallback';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateCategories: () => void;
}

const navButton =
  'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-extrabold text-[#202730] rounded-xl transition-colors hover:bg-[#fff9d9]';

export function Navbar({ onNavigateHome, onNavigateCategories }: NavbarProps) {
  const {
    settings,
    user,
    totals,
    setIsCartOpen,
    setIsOffersOpen,
    setIsAuthOpen,
  } = useStore();

  return (
    <div className="store-topbar sticky top-0 z-40">
      <header className="mx-auto max-w-6xl px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="store-brand flex items-center gap-2 min-w-0 font-extrabold"
        >
          <ImageWithFallback
            src={settings?.logoUrl || '/logo.png'}
            alt="شعار المتجر"
            className="shrink-0"
          />
          <span className="store-brand-name text-base sm:text-lg font-extrabold text-[#202730] truncate">
            {settings?.storeName || 'حرق اسعار'}
          </span>
        </a>

        <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-1">
          <button type="button" onClick={onNavigateHome} className={navButton}>
            <Home className="w-4 h-4 text-[#007185]" />
            <span>الرئيسية</span>
          </button>
          <button type="button" onClick={onNavigateCategories} className={navButton}>
            <LayoutGrid className="w-4 h-4 text-[#007185]" />
            <span>الأقسام</span>
          </button>
          <button type="button" onClick={() => setIsOffersOpen(true)} className={navButton}>
            <Tag className="w-4 h-4 text-[#007185]" />
            <span>العروض</span>
          </button>
          <button type="button" onClick={() => setIsCartOpen(true)} className={navButton}>
            <ShoppingBag className="w-4 h-4 text-[#007185]" />
            <span>السلة</span>
            <span className="text-[11px] bg-[#FED700] text-[#202730] px-1.5 py-0.5 rounded-md font-mono-nums">
              {totals.itemCount}
            </span>
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="store-top-action md:hidden relative"
            aria-label="السلة"
          >
            <ShoppingBag className="w-4 h-4" />
            {totals.itemCount > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FED700] text-[#202730] text-[10px] font-extrabold flex items-center justify-center font-mono-nums">
                {totals.itemCount}
              </span>
            )}
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-extrabold text-[#202730] bg-[#fff9d9] border border-[#f3e3a4] rounded-xl max-w-[150px]"
            >
              <UserIcon className="w-4 h-4 shrink-0 text-[#007185]" />
              <span className="truncate">{user.name}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-extrabold text-[#1d2630] bg-[#FED700] hover:bg-[#eac600] rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
