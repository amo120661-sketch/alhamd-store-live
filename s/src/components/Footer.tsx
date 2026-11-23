import { MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface FooterProps { onScrollToSection: (id: string) => void; }

const socials = [
  { key: 'facebook', label: 'فيسبوك', icon: 'fa-brands fa-facebook-f' },
  { key: 'twitter', label: 'إكس', icon: 'fa-brands fa-x-twitter' },
  { key: 'instagram', label: 'إنستغرام', icon: 'fa-brands fa-instagram' },
  { key: 'whatsapp', label: 'واتساب', icon: 'fa-brands fa-whatsapp' },
  { key: 'tiktok', label: 'تيك توك', icon: 'fa-brands fa-tiktok' },
  { key: 'youtube', label: 'يوتيوب', icon: 'fa-brands fa-youtube' },
] as const;

export function Footer({ onScrollToSection }: FooterProps) {
  const { settings } = useStore();
  const links = socials.filter((item) => {
    const value = settings?.[`${item.key}Url` as keyof typeof settings];
    return typeof value === 'string' && value.trim();
  });

  return (
    <footer dir="rtl" className="bg-white mt-8 pb-20 md:pb-8">
      <div className="w-full mx-auto px-[10px] md:px-[50px]">
        <div className="mx-auto w-full max-w-screen-2xl rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-8">
            <div className="grid grid-cols-12 gap-6 md:gap-8 items-start">
              <div className="col-span-12 md:col-span-5">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={settings?.logoUrl || '/logo.png'}
                    alt="شعار المتجر"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">عن المتجر</h3>
                    <p className="text-xs text-slate-500">نقدم لك أفضل المنتجات بأفضل تجربة شراء.</p>
                  </div>
                </div>
                <p className="text-slate-700 leading-7 text-sm">
                  {settings?.storeDescription || 'هذا هو الوصف الافتراضي لمتجرنا، يمكنك تعديله لاحقًا من لوحة التحكم.'}
                </p>
              </div>

              <div className="col-span-12 md:col-span-4">
                <h3 className="text-lg font-extrabold text-slate-800 mb-3">تابعنا على</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {links.length ? links.map((item) => {
                    const url = settings?.[`${item.key}Url` as keyof typeof settings] as string;
                    return (
                      <a
                        key={item.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow transition hover:text-[#FED700]"
                      >
                        <i className={item.icon} aria-hidden="true" />
                      </a>
                    );
                  }) : (
                    <p className="text-xs text-slate-500">يمكن إضافة روابط المنصات من لوحة الإدارة.</p>
                  )}
                </div>
              </div>

              <div className="col-span-12 md:col-span-3">
                <h3 className="text-lg font-extrabold text-slate-800 mb-3">تواصل معنا</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><MapPin className="w-5 h-5 text-slate-500 text-center" /><span>نخدم جميع المحافظات</span></li>
                  <li className="flex items-center gap-2"><Phone className="w-5 h-5 text-slate-500 text-center" /><span>الدعم: 7/24</span></li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-500 text-center" /><span>مدفوعات آمنة والتبديل سهل</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-right">
              <p className="text-xs text-slate-600">
                برمجة و تصميم شركة <i className="fa fa-heart text-rose-500" />{' '}
                <span className="font-bold text-slate-800">islam badawi</span>
              </p>
              <p className="text-xs text-slate-600">
                جميع الحقوق محفوظة <button type="button" onClick={() => onScrollToSection('top')} className="font-bold text-slate-800 hover:text-[#e6c200]">حرق اسعار</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
