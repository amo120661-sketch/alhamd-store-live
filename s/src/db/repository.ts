import { isAdminEmail } from '../config.ts';
import bcrypt from 'bcryptjs';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  categories,
  chatMessages,
  orderItems,
  orders,
  products,
  sliderImages,
  storeSettings,
  supportMessages,
  topOffers,
  users,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  try {
    const existingSettings = await db.select().from(storeSettings).limit(1);
    if (existingSettings.length === 0) {
      await db
        .insert(storeSettings)
        .values({
          id: 1,
          storeName: 'حرق اسعار',
          storeDescription:
            'متجركم الأول للمواد الغذائية الأساسية، الزيوت، العسل، التوابل، والمشروبات والعصائر الطبيعية بأسعار الجملة والتجزئة مع توصيل سريع والدفع عند الاستلام.',
          phone: '01098765432',
          whatsapp: '201098765432',
          email: 'support@alhamd-store.com',
          address: 'القاهرة - مدينة نصر - المنطقة التجارية',
          currency: 'ج.م',
          deliveryFee: '35',
          freeDeliveryThreshold: '600',
          facebookUrl: 'https://facebook.com',
          instagramUrl: 'https://instagram.com',
          tiktokUrl: 'https://tiktok.com',
          twitterUrl: 'https://x.com',
          youtubeUrl: 'https://youtube.com',
          whatsappUrl: 'https://wa.me/201098765432',
        })
        .onConflictDoNothing();
    }

    const existingAdmins = await db.select().from(users).limit(1);
    if (existingAdmins.length === 0) {
      const adminHash = await bcrypt.hash('Admin@1234', 10);
      await db
        .insert(users)
        .values([
          {
            uid: 'admin-owner-primary',
            name: 'إدارة حرق اسعار',
            email: 'amn2asayed@gmail.com',
            phone: '01098765432',
            passwordHash: adminHash,
            role: 'admin',
            isActive: true,
          },
          {
            uid: 'admin-store-demo',
            name: 'المدير التنفيذي',
            email: 'admin@alhamd.store',
            phone: '01011223344',
            passwordHash: adminHash,
            role: 'admin',
            isActive: true,
          },
        ])
        .onConflictDoNothing();
    }

    // Dedicated console login: username `admin`, password `admin123`.
    // Kept separate so existing admins keep their own passwords.
    const adminConsole = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@alhamd.local'))
      .limit(1);
    if (adminConsole.length === 0) {
      await db
        .insert(users)
        .values({
          uid: 'admin-console',
          name: 'مدير المتجر',
          email: 'admin@alhamd.local',
          phone: '01000000000',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: 'admin',
          isActive: true,
        })
        .onConflictDoNothing();
    }

    const existingCats = await db.select().from(categories).limit(1);
    let catRows = existingCats;
    if (existingCats.length === 0) {
      catRows = await db
        .insert(categories)
        .values([
          {
            name: 'زيوت و سمن',
            slug: 'oils-ghee',
            description: 'زيوت بكر ممتازة وعبوات الجملة والتجزئة',
            sortOrder: 1,
          },
          {
            name: 'أرز و حبوب',
            slug: 'rice-grains',
            description: 'أرز بسمتي ومصري وحبوب وبقوليات مختارة',
            sortOrder: 2,
          },
          {
            name: 'عسل و مكسرات',
            slug: 'honey-nuts',
            description: 'عسل نحل طبيعي ومكسرات طازجة',
            sortOrder: 3,
          },
          {
            name: 'قهوة و بهارات',
            slug: 'coffee-spices',
            description: 'قهوة عربية محمصة وتوابل أصلية',
            sortOrder: 4,
          },
          {
            name: 'عصائر و مشروبات',
            slug: 'juices-drinks',
            description: 'عصائر طبيعية مبردة ومشروبات بالجملة والتجزئة',
            sortOrder: 5,
          },
        ])
        .returning();
    }

    const allCats = await db.select().from(categories);
    const catBySlug = new Map(allCats.map((c) => [c.slug, c]));

    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      await db.insert(products).values([
        {
          name: 'زيت زيتون بكر ممتاز 750 مل',
          description:
            'زيت زيتون بكر ممتاز عصرة أولى على البارد بجودة فائقة، مناسب للاستخدام المنزلي والمطاعم مع خصم فوري على الجملة عند طلب 6 عبوات فأكثر.',
          price: '285',
          wholesalePrice: '1470',
          minWholesaleQty: 6,
          imageUrl: '/src/assets/images/product_olive_oil_1794832545531.jpg',
          categoryId: catBySlug.get('oils-ghee')?.id ?? null,
          categoryName: 'زيوت و سمن',
          isJuiceSection: false,
          isFeatured: true,
          stock: 80,
          unit: 'عبوة 750 مل',
        },
        {
          name: 'أرز بسمتي هندي فاخر 5 كجم',
          description:
            'أرز بسمتي طويل الحبة معطر ونقي 100%، مثالي للولائم والعائلات، متاح بسعر التجزئة وبسعر الجملة بدءاً من 4 شكاير.',
          price: '360',
          wholesalePrice: '1280',
          minWholesaleQty: 4,
          imageUrl: '/src/assets/images/product_basmati_rice_1794832544609.jpg',
          categoryId: catBySlug.get('rice-grains')?.id ?? null,
          categoryName: 'أرز و حبوب',
          isJuiceSection: false,
          isFeatured: true,
          stock: 65,
          unit: 'شكارة 5 كجم',
        },
        {
          name: 'عسل برسيم طبيعي صافي 500 جم',
          description:
            'عسل نحل طبيعي 100% مفحوص معملياً بدون أي إضافات سكرية، معبأ في برطمان زجاجي محكم الغلق.',
          price: '210',
          wholesalePrice: '1050',
          minWholesaleQty: 6,
          imageUrl: '/src/assets/images/product_clover_honey_1794832548060.jpg',
          categoryId: catBySlug.get('honey-nuts')?.id ?? null,
          categoryName: 'عسل و مكسرات',
          isJuiceSection: false,
          isFeatured: true,
          stock: 45,
          unit: 'برطمان 500 جم',
        },
        {
          name: 'قهوة عربية بالهيل المحمص 250 جم',
          description:
            'مزيج فاخر من البن العربي المحمص الطازج مع حبوب الهيل الخضراء الفاخرة لنكهة أصيلة وغنية.',
          price: '165',
          wholesalePrice: '1104',
          minWholesaleQty: 8,
          imageUrl: '/src/assets/images/product_arabic_coffee_1794832776305.jpg',
          categoryId: catBySlug.get('coffee-spices')?.id ?? null,
          categoryName: 'قهوة و بهارات',
          isJuiceSection: false,
          isFeatured: true,
          stock: 90,
          unit: 'عبوة 250 جم',
        },
        {
          name: 'مجموعة بهارات وتوابل فاخرة (3 برطمانات)',
          description:
            'تشكيلة منتقاة من الكركم النقي وحبهان أخضر فاخر وأعواد القرفة السيلانية في عبوات زجاجية بغطاء خشبي.',
          price: '240',
          wholesalePrice: '990',
          minWholesaleQty: 5,
          imageUrl: '/src/assets/images/product_mixed_spices_1794832776606.jpg',
          categoryId: catBySlug.get('coffee-spices')?.id ?? null,
          categoryName: 'قهوة و بهارات',
          isJuiceSection: false,
          isFeatured: true,
          stock: 50,
          unit: 'طقم 3 برطمانات',
        },
        {
          name: 'عصير مانجو طبيعي نكتار 355 مل',
          description:
            'عصير مانجو طبيعي غني باللب الطازج بدون مواد حافظة، متاح للطلب الفردي أو كراتين الجملة.',
          price: '38',
          wholesalePrice: '360',
          minWholesaleQty: 12,
          imageUrl: '/src/assets/images/product_mango_juice_1794832544692.jpg',
          categoryId: catBySlug.get('juices-drinks')?.id ?? null,
          categoryName: 'عصائر و مشروبات',
          isJuiceSection: true,
          isFeatured: true,
          stock: 180,
          unit: 'زجاجة 355 مل',
        },
        {
          name: 'عصير رمان طبيعي معصور على البارد 330 مل',
          description:
            'عصير رمان أحمر طبيعي 100% غني بمضادات الأكسدة، نكهة منعشة وقوام نقي.',
          price: '45',
          wholesalePrice: '432',
          minWholesaleQty: 12,
          imageUrl: '/src/assets/images/product_pomegranate_juice_1794832545108.jpg',
          categoryId: catBySlug.get('juices-drinks')?.id ?? null,
          categoryName: 'عصائر و مشروبات',
          isJuiceSection: true,
          isFeatured: true,
          stock: 140,
          unit: 'زجاجة 330 مل',
        },
        {
          name: 'عصير جوافة استوائية كريمي طبيعي',
          description:
            'عصير جوافة وردية وبيضاء طازجة بقوام كريمي طبيعي ومنعش يناسب كافة الأوقات.',
          price: '35',
          wholesalePrice: '336',
          minWholesaleQty: 12,
          imageUrl: '/src/assets/images/product_guava_juice_1794832777616.jpg',
          categoryId: catBySlug.get('juices-drinks')?.id ?? null,
          categoryName: 'عصائر و مشروبات',
          isJuiceSection: true,
          isFeatured: true,
          stock: 160,
          unit: 'زجاجة 355 مل',
        },
      ]);
    }

    const existingSliders = await db.select().from(sliderImages).limit(1);
    if (existingSliders.length === 0) {
      await db.insert(sliderImages).values([
        {
          title: 'عروض الجملة والتجزئة على الزيوت والعسل والمواد الغذائية',
          subtitle: 'أسعار تنافسية مباشرة للتجار والعائلات مع خدمة الدفع عند الاستلام',
          imageUrl: '/src/assets/images/slider_wholesale_pantry_1794832543519.jpg',
          linkSection: 'latest',
          sortOrder: 1,
          isActive: true,
        },
        {
          title: 'تشكيلة العصائر الطبيعية والمشروبات المبردة',
          subtitle: 'مانجو، رمان، وجوافة طبيعية 100% — متوفرة بالقطعة وبالكرتونة',
          imageUrl: '/src/assets/images/slider_fresh_juices_1794832543349.jpg',
          linkSection: 'juices',
          sortOrder: 2,
          isActive: true,
        },
        {
          title: 'تجهيزات السوبر ماركت والمطاعم بأعلى جودة',
          subtitle: 'أرز بسمتي، بن عربي، تمور، ومكسرات بخصومات كميات فورية',
          imageUrl: '/src/assets/images/slider_bulk_essentials_1794832544126.jpg',
          linkSection: 'categories',
          sortOrder: 3,
          isActive: true,
        },
      ]);
    }

    const existingOffers = await db.select().from(topOffers).limit(1);
    if (existingOffers.length === 0) {
      await db.insert(topOffers).values([
        {
          text: 'شحن مجاني للطلبات فوق 600 ج.م · الدفع متاح عند الاستلام لجميع المحافظات',
          badgeText: 'عرض التوصيل',
          isActive: true,
        },
        {
          text: 'خصومات الجملة تبدأ تلقائياً عند طلب الكميات المحددة داخل السلة',
          badgeText: 'أسعار الجملة',
          isActive: true,
        },
      ]);
    }
  } catch (error) {
    console.error('Seed error:', error);
    throw new Error('Failed to initialize default store data.', { cause: error });
  }
}

export async function getOrCreateFirebaseUser(
  uid: string,
  email: string,
  name: string
) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const isPrimaryOwner = isAdminEmail(cleanEmail);

    if (existingByEmail.length > 0) {
      const updated = await db
        .update(users)
        .set({
          uid,
          name: existingByEmail[0].name || name || cleanEmail.split('@')[0],
          role: isPrimaryOwner ? 'admin' : existingByEmail[0].role,
        })
        .where(eq(users.id, existingByEmail[0].id))
        .returning();
      return updated[0];
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role: isPrimaryOwner ? 'admin' : 'customer',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateFirebaseUser:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getStorefrontData() {
  try {
    await ensureSeeded();
    const [settingsRows, offerRows, sliderRows, categoryRows, productRows] =
      await Promise.all([
        db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1),
        db
          .select()
          .from(topOffers)
          .where(eq(topOffers.isActive, true))
          .orderBy(desc(topOffers.id)),
        db
          .select()
          .from(sliderImages)
          .where(eq(sliderImages.isActive, true))
          .orderBy(sliderImages.sortOrder, desc(sliderImages.id)),
        db.select().from(categories).orderBy(categories.sortOrder, categories.id),
        db.select().from(products).orderBy(desc(products.id)),
      ]);

    return {
      settings: settingsRows[0] ?? null,
      offers: offerRows,
      sliders: sliderRows,
      categories: categoryRows,
      products: productRows.map((p) => ({
        ...p,
        price: Number(p.price),
        wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
      })),
    };
  } catch (error) {
    console.error('Database query failed in getStorefrontData:', error);
    throw new Error('Failed to load storefront data.', { cause: error });
  }
}

export async function getAdminOverviewStats() {
  try {
    await ensureSeeded();
    const [
      orderAgg,
      pendingAgg,
      productAgg,
      userAgg,
      supportAgg,
      unreadChatAgg,
      recentOrders,
    ] = await Promise.all([
      db
        .select({
          totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
          totalOrders: sql<number>`COUNT(*)::int`,
        })
        .from(orders),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(orders)
        .where(eq(orders.status, 'pending')),
      db.select({ count: sql<number>`COUNT(*)::int` }).from(products),
      db.select({ count: sql<number>`COUNT(*)::int` }).from(users),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(supportMessages)
        .where(eq(supportMessages.status, 'new')),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(chatMessages)
        .where(eq(chatMessages.isRead, false)),
      db.select().from(orders).orderBy(desc(orders.id)).limit(8),
    ]);

    return {
      totalRevenue: Number(orderAgg[0]?.totalRevenue ?? 0),
      totalOrders: orderAgg[0]?.totalOrders ?? 0,
      pendingOrders: pendingAgg[0]?.count ?? 0,
      totalProducts: productAgg[0]?.count ?? 0,
      totalUsers: userAgg[0]?.count ?? 0,
      unreadSupport: supportAgg[0]?.count ?? 0,
      unreadChats: unreadChatAgg[0]?.count ?? 0,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        subtotalAmount: Number(o.subtotalAmount),
        deliveryFee: Number(o.deliveryFee),
        totalAmount: Number(o.totalAmount),
      })),
    };
  } catch (error) {
    console.error('Database query failed in getAdminOverviewStats:', error);
    throw new Error('Failed to load dashboard statistics.', { cause: error });
  }
}

export async function createOrderWithItems(input: {
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  items: {
    productId: number;
    quantity: number;
    purchaseType?: 'piece' | 'carton';
  }[];
}) {
  try {
    await ensureSeeded();
    const settingsRows = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, 1))
      .limit(1);
    const settings = settingsRows[0];
    const deliveryFeeConfig = Number(settings?.deliveryFee ?? 35);
    const freeThreshold = Number(settings?.freeDeliveryThreshold ?? 600);

    const allProducts = await db.select().from(products);
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const preparedItems: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      purchaseType: 'piece' | 'carton';
    }[] = [];

    for (const item of input.items) {
      const prod = productMap.get(Number(item.productId));
      if (!prod) continue;
      const purchaseType =
        item.purchaseType === 'carton' ? 'carton' : 'piece';
      const qty = Math.max(1, Math.floor(Number(item.quantity)));
      const retail = Number(prod.price);
      const cartonPrice = prod.wholesalePrice ? Number(prod.wholesalePrice) : 0;
      const unitPrice =
        purchaseType === 'carton' && cartonPrice > 0 ? cartonPrice : retail;
      const lineSub = Math.round(unitPrice * qty * 100) / 100;
      subtotal += lineSub;
      preparedItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice,
        subtotal: lineSub,
        purchaseType,
      });
    }

    if (preparedItems.length === 0) {
      throw new Error('لم يتم العثور على منتجات صالحة في الطلب.');
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryFeeConfig;
    const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const createdOrder = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: input.userId,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerAddress: input.customerAddress.trim(),
        paymentMethod: 'cash_on_delivery',
        status: 'pending',
        subtotalAmount: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        notes: (input.notes || '').trim(),
      })
      .returning();

    const orderRow = createdOrder[0];

    await db.insert(orderItems).values(
      preparedItems.map((it) => ({
        orderId: orderRow.id,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toFixed(2),
        subtotal: it.subtotal.toFixed(2),
        purchaseType: it.purchaseType,
      }))
    );

    return {
      ...orderRow,
      subtotalAmount: Number(orderRow.subtotalAmount),
      deliveryFee: Number(orderRow.deliveryFee),
      totalAmount: Number(orderRow.totalAmount),
      items: preparedItems,
    };
  } catch (error) {
    console.error('Database query failed in createOrderWithItems:', error);
    throw new Error(
      error instanceof Error && error.message.includes('منتجات')
        ? error.message
        : 'تعذر إتمام الطلب، يرجى المحاولة مرة أخرى.',
      { cause: error }
    );
  }
}

export async function getAllOrdersWithItems() {
  try {
    const orderRows = await db.select().from(orders).orderBy(desc(orders.id));
    const itemRows = await db.select().from(orderItems);
    const itemsByOrder = new Map<number, typeof itemRows>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    return orderRows.map((o) => ({
      ...o,
      subtotalAmount: Number(o.subtotalAmount),
      deliveryFee: Number(o.deliveryFee),
      totalAmount: Number(o.totalAmount),
      items: (itemsByOrder.get(o.id) ?? []).map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
    }));
  } catch (error) {
    console.error('Database query failed in getAllOrdersWithItems:', error);
    throw new Error('Failed to load orders.', { cause: error });
  }
}

export async function getOrdersForUser(userId: number) {
  try {
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.id));
    const itemRows = await db.select().from(orderItems);
    const itemsByOrder = new Map<number, typeof itemRows>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    return orderRows.map((o) => ({
      ...o,
      subtotalAmount: Number(o.subtotalAmount),
      deliveryFee: Number(o.deliveryFee),
      totalAmount: Number(o.totalAmount),
      items: (itemsByOrder.get(o.id) ?? []).map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
    }));
  } catch (error) {
    console.error('Database query failed in getOrdersForUser:', error);
    throw new Error('Failed to load user orders.', { cause: error });
  }
}
