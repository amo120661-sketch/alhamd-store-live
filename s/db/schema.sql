-- الحمد جملة و تجزئة — مخطط قاعدة البيانات الموحّد
-- يُستخدم من قبل المتجر ولوحة التحكم معاً (نفس قاعدة البيانات عبر API واحد).
-- الملف آمن للتكرار: CREATE TABLE IF NOT EXISTS و ADD COLUMN IF NOT EXISTS.

create table if not exists users (
  id serial primary key,
  uid text not null unique,
  name text not null,
  email text not null unique,
  phone text default '',
  store_name text default '',
  governorate text default '',
  center text default '',
  address text default '',
  password_hash text default '',
  role text not null default 'customer',
  is_active boolean not null default true,
  created_at timestamp default now() not null
);

create table if not exists categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text default '',
  image_url text default '',
  sort_order integer not null default 0,
  created_at timestamp default now() not null
);

create table if not exists products (
  id serial primary key,
  name text not null,
  description text not null,
  price numeric(10,2) not null,
  wholesale_price numeric(10,2),
  min_wholesale_qty integer not null default 6,
  discount_value text default '',
  image_url text not null,
  category_id integer references categories(id) on delete set null,
  category_name text not null default 'عام',
  is_juice_section boolean not null default false,
  is_featured boolean not null default true,
  stock integer not null default 50,
  unit text not null default 'قطعة',
  created_at timestamp default now() not null
);

create table if not exists orders (
  id serial primary key,
  order_number text not null unique,
  user_id integer references users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  payment_method text not null default 'cash_on_delivery',
  status text not null default 'pending',
  subtotal_amount numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default '0',
  total_amount numeric(10,2) not null,
  notes text default '',
  created_at timestamp default now() not null
);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  product_id integer references products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  purchase_type text not null default 'piece',
  availability text not null default 'متوفر'
);

create table if not exists support_messages (
  id serial primary key,
  name text not null,
  phone text not null,
  message text not null,
  status text not null default 'new',
  admin_reply text default '',
  created_at timestamp default now() not null
);

create table if not exists chat_messages (
  id serial primary key,
  session_id text not null,
  user_id integer references users(id) on delete set null,
  sender_name text not null,
  sender_role text not null default 'customer',
  message text not null,
  is_read boolean not null default false,
  created_at timestamp default now() not null
);

create table if not exists slider_images (
  id serial primary key,
  title text not null,
  subtitle text default '',
  image_url text not null,
  link_section text default 'latest',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp default now() not null
);

create table if not exists top_offers (
  id serial primary key,
  text text not null,
  badge_text text default 'عرض خاص',
  is_active boolean not null default true,
  created_at timestamp default now() not null
);

create table if not exists store_settings (
  id integer primary key,
  store_name text not null default 'الحمد جملة و تجزئة',
  store_description text default '',
  phone text default '01000000000',
  whatsapp text default '201000000000',
  email text default 'support@alhamd-store.com',
  address text default 'القاهرة - جمهورية مصر العربية',
  currency text default 'ج.م',
  delivery_fee numeric(10,2) default '35',
  free_delivery_threshold numeric(10,2) default '600',
  facebook_url text default 'https://facebook.com',
  instagram_url text default 'https://instagram.com',
  tiktok_url text default 'https://tiktok.com',
  twitter_url text default 'https://x.com',
  youtube_url text default 'https://youtube.com',
  whatsapp_url text default 'https://wa.me/201000000000',
  logo_url text default '',
  updated_at timestamp default now() not null
);

-- ترقية قاعدة بيانات قديمة أنشئت بمخطط سابق (بدون حذف أي بيانات).
alter table users             add column if not exists store_name text default '';
alter table users             add column if not exists governorate text default '';
alter table users             add column if not exists center text default '';
alter table users             add column if not exists address text default '';
alter table categories        add column if not exists image_url text default '';
alter table products          add column if not exists discount_value text default '';
alter table order_items       add column if not exists purchase_type text not null default 'piece';
alter table order_items       add column if not exists availability text not null default 'متوفر';
alter table store_settings    add column if not exists logo_url text default '';

-- الوصول يتم عبر خادم التطبيق (Express) باستخدام connection string،
-- لذلك نوقف RLS حتى لا تتداخل سياسات Supabase مع صلاحيات الخادم.
do $$
begin
  alter table users             disable row level security;
  alter table categories        disable row level security;
  alter table products          disable row level security;
  alter table orders            disable row level security;
  alter table order_items       disable row level security;
  alter table support_messages  disable row level security;
  alter table chat_messages     disable row level security;
  alter table slider_images     disable row level security;
  alter table top_offers        disable row level security;
  alter table store_settings    disable row level security;
exception when insufficient_privilege then
  null; -- مالك الجدول فقط يستطيع تغيير RLS؛ بقية المخطط تم تطبيقه بنجاح.
end $$;

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_chat_messages_session on chat_messages(session_id);
