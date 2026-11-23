import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { EntryAnimation } from './components/EntryAnimation';
import { Footer } from './components/Footer';
import { LiveChatWidget } from './components/LiveChatWidget';
import { MobileBottomBar } from './components/MobileBottomBar';
import { Navbar } from './components/Navbar';
import { OffersDrawer } from './components/OffersDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { StorefrontHome } from './components/StorefrontHome';
import { StoreProvider, useStore } from './context/StoreContext';

function AppShell() {
  const { toastMessage } = useStore();
  const [showEntry, setShowEntry] = useState(true);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToCategoriesAfterAuth = () => {
    window.setTimeout(() => scrollToSection('categories-section'), 120);
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#FAFAF8] text-slate-900">
      {showEntry && <EntryAnimation onDone={() => setShowEntry(false)} />}

      <Navbar
        onNavigateHome={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateCategories={() => scrollToSection('categories-section')}
      />

      <div className="flex-1">
        <StorefrontHome />
      </div>

      <Footer onScrollToSection={scrollToSection} />

      <MobileBottomBar
        onNavigateHome={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateCategories={() => scrollToSection('categories-section')}
      />

      <LiveChatWidget />
      <ProductDetailModal />
      <CartDrawer />
      <OffersDrawer />
      <CheckoutModal />
      <AuthModal onAuthenticated={goToCategoriesAfterAuth} />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[60] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap"
        >
          <CheckCircle2 className="w-4 h-4 text-[#33a9bb] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
