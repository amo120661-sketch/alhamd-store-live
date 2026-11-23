import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface MobileBottomBarProps {
  onNavigateHome: () => void;
  onNavigateCategories: () => void;
}

export function MobileBottomBar({
  onNavigateHome,
  onNavigateCategories,
}: MobileBottomBarProps) {
  const { totals, setIsCartOpen, setIsOffersOpen, setIsAuthOpen } = useStore();

  return (
    <nav
      aria-label="التنقل الرئيسي"
      dir="rtl"
      className="store-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-30 px-1 pt-1 grid grid-cols-5 items-center"
    >
      <button type="button" onClick={onNavigateHome} className="store-bottom-link">
        <Home className="w-[17px] h-[17px]" />
        <span>الرئيسية</span>
      </button>

      <button type="button" onClick={onNavigateCategories} className="store-bottom-link">
        <LayoutGrid className="w-[17px] h-[17px]" />
        <span>الأقسام</span>
      </button>

      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="store-bottom-link relative"
      >
        <span className="absolute -top-4 w-11 h-11 rounded-full bg-[#FED700] text-[#202730] shadow-lg border-4 border-white flex items-center justify-center">
          <ShoppingBag className="w-5 h-5" />
          {totals.itemCount > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-[#007185] text-white text-[10px] font-extrabold flex items-center justify-center font-mono-nums">
              {totals.itemCount}
            </span>
          )}
        </span>
        <span className="text-[9px] leading-none font-extrabold mt-6 whitespace-nowrap font-mono-nums">
          السلة ({totals.itemCount})
        </span>
      </button>

      <button type="button" onClick={() => setIsOffersOpen(true)} className="store-bottom-link">
        <Tag className="w-[17px] h-[17px]" />
        <span>العروض</span>
      </button>

      <button type="button" onClick={() => setIsAuthOpen(true)} className="store-bottom-link">
        <UserIcon className="w-[17px] h-[17px]" />
        <span>حسابي</span>
      </button>
    </nav>
  );
}
