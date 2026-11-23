import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').default(''),
  storeName: text('store_name').default(''),
  governorate: text('governorate').default(''),
  center: text('center').default(''),
  address: text('address').default(''),
  passwordHash: text('password_hash').default(''),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin' | 'manager'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  imageUrl: text('image_url').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: numeric('wholesale_price', { precision: 10, scale: 2 }),
  minWholesaleQty: integer('min_wholesale_qty').notNull().default(6),
  discountValue: text('discount_value').default(''),
  imageUrl: text('image_url').notNull(),
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  categoryName: text('category_name').notNull().default('عام'),
  isJuiceSection: boolean('is_juice_section').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(true),
  stock: integer('stock').notNull().default(50),
  unit: text('unit').notNull().default('قطعة'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address').notNull(),
  paymentMethod: text('payment_method').notNull().default('cash_on_delivery'),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotalAmount: numeric('subtotal_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  purchaseType: text('purchase_type').notNull().default('piece'),
  availability: text('availability').notNull().default('متوفر'),
});

export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'), // 'new' | 'read' | 'replied'
  adminReply: text('admin_reply').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull().default('customer'), // 'customer' | 'admin'
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sliderImages = pgTable('slider_images', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  imageUrl: text('image_url').notNull(),
  linkSection: text('link_section').default('latest'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const topOffers = pgTable('top_offers', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  badgeText: text('badge_text').default('عرض خاص'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey(),
  storeName: text('store_name').notNull().default('حرق اسعار'),
  storeDescription: text('store_description').default(
    'متجر متكامل لبيع المواد الغذائية الأساسية والمشروبات والعصائر الطبيعية بسعر الجملة والتجزئة.'
  ),
  phone: text('phone').default('01000000000'),
  whatsapp: text('whatsapp').default('201000000000'),
  email: text('email').default('support@alhamd-store.com'),
  address: text('address').default('القاهرة - جمهورية مصر العربية'),
  currency: text('currency').default('ج.م'),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('35'),
  freeDeliveryThreshold: numeric('free_delivery_threshold', {
    precision: 10,
    scale: 2,
  }).default('600'),
  facebookUrl: text('facebook_url').default('https://facebook.com'),
  instagramUrl: text('instagram_url').default('https://instagram.com'),
  tiktokUrl: text('tiktok_url').default('https://tiktok.com'),
  twitterUrl: text('twitter_url').default('https://x.com'),
  youtubeUrl: text('youtube_url').default('https://youtube.com'),
  whatsappUrl: text('whatsapp_url').default('https://wa.me/201000000000'),
  logoUrl: text('logo_url').default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
