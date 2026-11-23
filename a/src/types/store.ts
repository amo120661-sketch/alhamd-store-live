import type { StoreProduct } from '../utils/storeLogic';

export interface StoreSettings {
  id: number;
  storeName: string;
  storeDescription: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  currency: string | null;
  deliveryFee: string | number | null;
  freeDeliveryThreshold: string | number | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  whatsappUrl: string | null;
  logoUrl: string | null;
}

export interface TopOffer {
  id: number;
  text: string;
  badgeText: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface SliderImage {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkSection: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface AuthUser {
  id: number;
  uid: string;
  name: string;
  email: string;
  phone?: string | null;
  storeName?: string | null;
  governorate?: string | null;
  center?: string | null;
  address?: string | null;
  role: string;
}

export interface OrderItemRecord {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  purchaseType?: string | null;
  availability?: string | null;
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  status: string;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  items?: OrderItemRecord[];
}

export interface SupportMessageRecord {
  id: number;
  name: string;
  phone: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: number;
  sessionId: string;
  userId: number | null;
  senderName: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatSessionGroup {
  sessionId: string;
  customerName: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessageRecord[];
}

export interface AdminUserRecord {
  id: number;
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  storeName?: string | null;
  governorate?: string | null;
  center?: string | null;
  address?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  unreadSupport: number;
  unreadChats: number;
  recentOrders: OrderRecord[];
}

export type StoreDataPayload = {
  settings: StoreSettings | null;
  offers: TopOffer[];
  sliders: SliderImage[];
  categories: Category[];
  products: StoreProduct[];
};
