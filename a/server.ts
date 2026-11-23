import './src/config/env.ts';
import { isAdminEmail } from './src/config.ts';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { desc, eq, or, sql } from 'drizzle-orm';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './src/db/index.ts';
import { ensureSchema } from './src/db/migrate.ts';
import {
  createOrderWithItems,
  ensureSeeded,
  getAdminOverviewStats,
  getAllOrdersWithItems,
  getOrCreateFirebaseUser,
  getOrdersForUser,
  getStorefrontData,
} from './src/db/repository.ts';
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
} from './src/db/schema.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  type AuthRequest,
  optionalAuth,
  requireAdmin,
  requireAuth,
  signSessionToken,
} from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '8mb' }));

// Health check — also verifies the shared database connection.
app.get('/api/health', async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ ok: true, db: 'connected' });
  } catch (error) {
    res.status(503).json({
      ok: false,
      db: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown DB error',
    });
  }
});

// ========================
// PUBLIC STOREFRONT ROUTES
// ========================

app.get('/api/storefront', async (_req, res) => {
  try {
    const data = await getStorefrontData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'تعذر تحميل بيانات المتجر.',
    });
  }
});

app.post('/api/orders', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { customerName, customerPhone, customerAddress, notes, items } =
      req.body || {};

    if (
      !customerName ||
      String(customerName).trim().length < 2 ||
      !customerPhone ||
      String(customerPhone).trim().length < 8 ||
      !customerAddress ||
      String(customerAddress).trim().length < 6 ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error: 'يرجى استيفاء بيانات المستلم (الاسم، الهاتف، العنوان) والمنتجات.',
      });
    }

    const order = await createOrderWithItems({
      userId: req.dbUser?.id ?? null,
      customerName: String(customerName),
      customerPhone: String(customerPhone),
      customerAddress: String(customerAddress),
      notes: notes ? String(notes) : '',
      items,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : 'تعذر تسجيل الطلب حالياً.',
    });
  }
});

app.get('/api/my-orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: 'Unauthorized' });
    const list = await getOrdersForUser(req.dbUser.id);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل طلباتك.' });
  }
});

app.post('/api/support', async (req, res) => {
  try {
    await ensureSeeded();
    const { name, phone, message } = req.body || {};
    if (
      !name ||
      String(name).trim().length < 2 ||
      !phone ||
      String(phone).trim().length < 7 ||
      !message ||
      String(message).trim().length < 3
    ) {
      return res.status(400).json({
        error: 'يرجى إدخال الاسم ورقم الهاتف ونص الرسالة بشكل صحيح.',
      });
    }
    const inserted = await db
      .insert(supportMessages)
      .values({
        name: String(name).trim(),
        phone: String(phone).trim(),
        message: String(message).trim(),
        status: 'new',
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Support submit failed:', error);
    res.status(500).json({ error: 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً.' });
  }
});

// ========================
// LIVE CUSTOMER CHAT ROUTES
// ========================

app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    await ensureSeeded();
    const { sessionId } = req.params;
    if (!sessionId) return res.json([]);
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.id);
    res.json(rows);
  } catch (error) {
    console.error('Chat fetch failed:', error);
    res.status(500).json({ error: 'تعذر تحميل المحادثة.' });
  }
});

app.post('/api/chat', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const { sessionId, senderName, message } = req.body || {};
    if (!sessionId || !message || String(message).trim().length === 0) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب.' });
    }
    const inserted = await db
      .insert(chatMessages)
      .values({
        sessionId: String(sessionId).slice(0, 120),
        userId: req.dbUser?.id ?? null,
        senderName:
          (senderName && String(senderName).trim()) ||
          req.dbUser?.name ||
          'زائر المتجر',
        senderRole: 'customer',
        message: String(message).trim(),
        isRead: false,
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Chat send failed:', error);
    res.status(500).json({ error: 'تعذر إرسال الرسالة.' });
  }
});

// ========================
// AUTH ROUTES
// ========================

app.post('/api/auth/register', async (req, res) => {
  try {
    await ensureSeeded();
    const b = req.body || {};
    // واجهة المتجر ترسل رقم الهاتف (بدون بريد) مع اسم المحل والعنوان.
    // لوحة التحكم ترسل بريداً اختيارياً أيضاً — كلاهما مدعوم هنا.
    const cleanName = String(b.name || '').trim();
    const cleanPhone = String(b.phone || '').replace(/\D/g, '').slice(0, 15);
    const cleanEmail = String(b.email || '').toLowerCase().trim();
    const cleanPass = String(b.password || '');
    const storeName = String(b.storeName || '').trim();
    const governorate = String(b.governorate || '').trim();
    const center = String(b.center || '').trim();
    const address = String(b.address || '').trim();

    if (cleanName.length < 2 || cleanPass.length < 6) {
      return res.status(400).json({
        error: 'يرجى إدخال الاسم وكلمة مرور لا تقل عن 6 أحرف.',
      });
    }
    if (cleanEmail && !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صالح.' });
    }
    if (!cleanEmail && cleanPhone.length < 8) {
      return res.status(400).json({ error: 'يرجى إدخال رقم هاتف صحيح.' });
    }

    // عمود email NOT NULL UNIQUE، لذا نولّد بريداً داخلياً عند التسجيل بالهاتف فقط.
    const finalEmail = cleanEmail || `phone-${cleanPhone}@customers.alhamd.local`;

    const existing = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, finalEmail),
          cleanPhone ? eq(users.phone, cleanPhone) : sql`false`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'هذا الهاتف أو البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.',
      });
    }

    const passwordHash = await bcrypt.hash(cleanPass, 10);
    const uid = `usr-${crypto.randomUUID()}`;
    const role = isAdminEmail(finalEmail) ? 'admin' : 'customer';

    const created = await db
      .insert(users)
      .values({
        uid,
        name: cleanName,
        email: finalEmail,
        phone: cleanPhone,
        storeName,
        governorate,
        center,
        address,
        passwordHash,
        role,
        isActive: true,
      })
      .returning();

    const user = created[0];
    const token = signSessionToken({
      id: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName,
        governorate: user.governorate,
        center: user.center,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'تعذر إنشاء الحساب حالياً.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await ensureSeeded();
    const b = req.body || {};
    const rawIdentity = String(b.identifier || b.email || b.phone || '')
      .toLowerCase()
      .trim();
    // Friendly console username requested for the admin panel.
    const identity =
      rawIdentity === 'admin' ? 'admin@alhamd.local' : rawIdentity;
    const cleanPass = String(b.password || '');

    if (!identity || !cleanPass) {
      return res
        .status(400)
        .json({ error: 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور.' });
    }

    const digits = identity.replace(/\D/g, '');
    const rows = identity.includes('@')
      ? await db
          .select()
          .from(users)
          .where(eq(users.email, identity))
          .limit(1)
      : await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.phone, identity),
              digits
                ? sql`regexp_replace(coalesce(${users.phone}, ''), '[^0-9]', '', 'g') = ${digits}`
                : sql`false`
            )
          )
          .limit(1);

    const user = rows[0];
    if (!user || !user.passwordHash) {
      return res
        .status(401)
        .json({ error: 'بيانات الدخول غير صحيحة.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'تم إيقاف هذا الحساب من الإدارة.' });
    }

    const valid = await bcrypt.compare(cleanPass, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    }

    const token = signSessionToken({
      id: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName,
        governorate: user.governorate,
        center: user.center,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'تعذر تسجيل الدخول حالياً.' });
  }
});

app.post('/api/auth/firebase', async (req, res) => {
  try {
    await ensureSeeded();
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'رمز التحقق مفقود.' });
    }
    const decoded = await adminAuth.verifyIdToken(String(idToken));
    const user = await getOrCreateFirebaseUser(
      decoded.uid,
      decoded.email || `${decoded.uid}@firebase.local`,
      decoded.name || decoded.email?.split('@')[0] || 'مستخدم'
    );
    if (!user.isActive) {
      return res.status(403).json({ error: 'تم إيقاف هذا الحساب من الإدارة.' });
    }
    const token = signSessionToken({
      id: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role,
    });
    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName,
        governorate: user.governorate,
        center: user.center,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(401).json({ error: 'فشل التحقق من حساب جوجل.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.dbUser });
});

// ========================
// ADMIN DASHBOARD ROUTES
// ========================

app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const stats = await getAdminOverviewStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل الإحصائيات.' });
  }
});

// Products CRUD
app.get('/api/admin/products', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(products).orderBy(desc(products.id));
    res.json(
      rows.map((p) => ({
        ...p,
        price: Number(p.price),
        wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل المنتجات.' });
  }
});

app.post('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      wholesalePrice,
      minWholesaleQty,
      imageUrl,
      categoryId,
      categoryName,
      isJuiceSection,
      stock,
      unit,
    } = req.body || {};

    if (!name || !price || !description) {
      return res
        .status(400)
        .json({ error: 'اسم المنتج والسعر وبيانات المنتج حقول مطلوبة.' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال سعر صحيح.' });
    }

    const chosenCatName =
      String(categoryName || '').trim() ||
      (isJuiceSection ? 'عصائر و مشروبات' : 'عام');

    const inserted = await db
      .insert(products)
      .values({
        name: String(name).trim(),
        description: String(description).trim(),
        price: numericPrice.toFixed(2),
        wholesalePrice:
          wholesalePrice && Number(wholesalePrice) > 0
            ? Number(wholesalePrice).toFixed(2)
            : null,
        minWholesaleQty: Math.max(1, Number(minWholesaleQty) || 6),
        imageUrl:
          String(imageUrl || '').trim() ||
          '/src/assets/images/product_olive_oil_1794832545531.jpg',
        categoryId: categoryId ? Number(categoryId) : null,
        categoryName: chosenCatName,
        isJuiceSection: Boolean(isJuiceSection),
        isFeatured: true,
        stock: Math.max(0, Number(stock) || 50),
        unit: String(unit || 'قطعة').trim(),
      })
      .returning();

    const p = inserted[0];
    res.status(201).json({
      ...p,
      price: Number(p.price),
      wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'تعذر إضافة المنتج.' });
  }
});

app.put(
  '/api/admin/products/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        name,
        description,
        price,
        wholesalePrice,
        minWholesaleQty,
        imageUrl,
        categoryId,
        categoryName,
        isJuiceSection,
        stock,
        unit,
      } = req.body || {};

      const updated = await db
        .update(products)
        .set({
          name: String(name).trim(),
          description: String(description).trim(),
          price: Number(price).toFixed(2),
          wholesalePrice:
            wholesalePrice && Number(wholesalePrice) > 0
              ? Number(wholesalePrice).toFixed(2)
              : null,
          minWholesaleQty: Math.max(1, Number(minWholesaleQty) || 6),
          imageUrl: String(imageUrl).trim(),
          categoryId: categoryId ? Number(categoryId) : null,
          categoryName: String(categoryName || 'عام').trim(),
          isJuiceSection: Boolean(isJuiceSection),
          stock: Math.max(0, Number(stock) || 0),
          unit: String(unit || 'قطعة').trim(),
        })
        .where(eq(products.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'المنتج غير موجود.' });
      }
      const p = updated[0];
      res.json({
        ...p,
        price: Number(p.price),
        wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
      });
    } catch (error) {
      res.status(500).json({ error: 'تعذر تعديل المنتج.' });
    }
  }
);

app.delete(
  '/api/admin/products/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(products).where(eq(products.id, id));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: 'تعذر حذف المنتج.' });
    }
  }
);

// Categories CRUD
app.post(
  '/api/admin/categories',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, description } = req.body || {};
      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ error: 'اسم القسم مطلوب.' });
      }
      const slug = `cat-${Date.now()}`;
      const inserted = await db
        .insert(categories)
        .values({
          name: String(name).trim(),
          slug,
          description: String(description || '').trim(),
          sortOrder: 10,
        })
        .returning();
      res.status(201).json(inserted[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر إضافة القسم.' });
    }
  }
);

app.delete(
  '/api/admin/categories/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(categories).where(eq(categories.id, id));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: 'تعذر حذف القسم.' });
    }
  }
);

// Orders Management
app.get('/api/admin/orders', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const list = await getAllOrdersWithItems();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل الطلبات.' });
  }
});

app.patch(
  '/api/admin/orders/:id/status',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body || {};
      const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowed.includes(String(status))) {
        return res.status(400).json({ error: 'حالة طلب غير صالحة.' });
      }
      const updated = await db
        .update(orders)
        .set({ status: String(status) })
        .where(eq(orders.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر تحديث حالة الطلب.' });
    }
  }
);

// Order item availability (used by the admin orders panel)
app.patch(
  '/api/admin/order-items/:id/availability',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { availability } = req.body || {};
      const allowed = ['متوفر', 'غير متوفر'];
      if (!Number.isInteger(id) || !allowed.includes(String(availability))) {
        return res.status(400).json({ error: 'حالة التوفر غير صالحة.' });
      }
      const updated = await db
        .update(orderItems)
        .set({ availability: String(availability) })
        .where(eq(orderItems.id, id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: 'الصنف غير موجود.' });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error('Update item availability error:', error);
      res.status(500).json({ error: 'تعذر تحديث حالة الصنف.' });
    }
  }
);

// Users & Admins Management
app.get('/api/admin/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.id));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل المستخدمين.' });
  }
});

app.patch(
  '/api/admin/users/:id/toggle',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'المستخدم غير موجود.' });
      }
      if (isAdminEmail(rows[0].email) || rows[0].id === req.dbUser?.id) {
        return res.status(400).json({ error: 'لا يمكن تعطيل حسابك الحالي أو المالك الأساسي.' });
      }
      const updated = await db
        .update(users)
        .set({ isActive: !rows[0].isActive })
        .where(eq(users.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر تحديث حالة المستخدم.' });
    }
  }
);

app.post('/api/admin/admins', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body || {};
    const cleanEmail = String(email || '').toLowerCase().trim();
    const targetRole = role === 'admin' ? 'admin' : 'manager';

    if (!cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح.' });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          role: targetRole,
          name: name ? String(name).trim() : existing[0].name,
          phone: phone ? String(phone).trim() : existing[0].phone,
          isActive: true,
        })
        .where(eq(users.id, existing[0].id))
        .returning({
          id: users.id,
          uid: users.uid,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });
      return res.json(updated[0]);
    }

    if (!name || String(name).trim().length < 2 || !password || String(password).length < 6) {
      return res.status(400).json({
        error: 'لإنشاء مدير جديد، يرجى إدخال الاسم وكلمة المرور (6 أحرف على الأقل).',
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await db
      .insert(users)
      .values({
        uid: `mgr-${crypto.randomUUID()}`,
        name: String(name).trim(),
        email: cleanEmail,
        phone: String(phone || '').trim(),
        passwordHash,
        role: targetRole,
        isActive: true,
      })
      .returning({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Add manager error:', error);
    res.status(500).json({ error: 'تعذر إضافة المدير.' });
  }
});

app.patch(
  '/api/admin/admins/:id/demote',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (rows.length === 0) return res.status(404).json({ error: 'غير موجود.' });
      if (
        isAdminEmail(rows[0].email) ||
        rows[0].id === req.dbUser?.id
      ) {
        return res
          .status(400)
          .json({ error: 'لا يمكن إزالة صلاحيات المدير الأساسي.' });
      }
      const updated = await db
        .update(users)
        .set({ role: 'customer' })
        .where(eq(users.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر تعديل الصلاحية.' });
    }
  }
);

// Support Messages & Live Chats
app.get('/api/admin/support', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.id));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل رسائل الدعم.' });
  }
});

app.patch(
  '/api/admin/support/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status, adminReply } = req.body || {};
      const updated = await db
        .update(supportMessages)
        .set({
          status: status ? String(status) : 'replied',
          adminReply: adminReply !== undefined ? String(adminReply) : undefined,
        })
        .where(eq(supportMessages.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر تحديث رسالة الدعم.' });
    }
  }
);

app.get('/api/admin/chats', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.id));

    const sessionsMap = new Map<
      string,
      {
        sessionId: string;
        customerName: string;
        lastMessage: string;
        lastTime: Date;
        unreadCount: number;
        messages: typeof rows;
      }
    >();

    for (const msg of [...rows].reverse()) {
      const existing = sessionsMap.get(msg.sessionId);
      if (!existing) {
        sessionsMap.set(msg.sessionId, {
          sessionId: msg.sessionId,
          customerName:
            msg.senderRole === 'customer' ? msg.senderName : 'زائر المتجر',
          lastMessage: msg.message,
          lastTime: msg.createdAt,
          unreadCount: msg.senderRole === 'customer' && !msg.isRead ? 1 : 0,
          messages: [msg],
        });
      } else {
        if (msg.senderRole === 'customer') {
          existing.customerName = msg.senderName;
        }
        existing.lastMessage = msg.message;
        existing.lastTime = msg.createdAt;
        if (msg.senderRole === 'customer' && !msg.isRead) {
          existing.unreadCount += 1;
        }
        existing.messages.push(msg);
      }
    }

    const sessions = Array.from(sessionsMap.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل محادثات العملاء.' });
  }
});

app.post(
  '/api/admin/chats/:sessionId/reply',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body || {};
      if (!message || String(message).trim().length === 0) {
        return res.status(400).json({ error: 'يرجى كتابة الرد.' });
      }

      await db
        .update(chatMessages)
        .set({ isRead: true })
        .where(eq(chatMessages.sessionId, sessionId));

      const inserted = await db
        .insert(chatMessages)
        .values({
          sessionId,
          userId: req.dbUser?.id ?? null,
          senderName: req.dbUser?.name || 'خدمة العملاء',
          senderRole: 'admin',
          message: String(message).trim(),
          isRead: true,
        })
        .returning();

      res.status(201).json(inserted[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر إرسال الرد.' });
    }
  }
);

// Sliders Management
app.get('/api/admin/sliders', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(sliderImages)
      .orderBy(sliderImages.sortOrder, desc(sliderImages.id));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل صور السلايدر.' });
  }
});

app.post('/api/admin/sliders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, linkSection, sortOrder } = req.body || {};
    if (!title || !imageUrl) {
      return res
        .status(400)
        .json({ error: 'عنوان الشريحة ورابط/صورة السلايدر مطلوبان.' });
    }
    const inserted = await db
      .insert(sliderImages)
      .values({
        title: String(title).trim(),
        subtitle: String(subtitle || '').trim(),
        imageUrl: String(imageUrl).trim(),
        linkSection: String(linkSection || 'latest'),
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: 'تعذر إضافة صورة السلايدر.' });
  }
});

app.patch(
  '/api/admin/sliders/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body || {};
      const updated = await db
        .update(sliderImages)
        .set({ isActive: Boolean(isActive) })
        .where(eq(sliderImages.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر تعديل الشريحة.' });
    }
  }
);

app.delete(
  '/api/admin/sliders/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(sliderImages).where(eq(sliderImages.id, id));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: 'تعذر حذف الشريحة.' });
    }
  }
);

// Top Offers Management
app.get('/api/admin/offers', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(topOffers).orderBy(desc(topOffers.id));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحميل العروض.' });
  }
});

app.post('/api/admin/offers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { text, badgeText } = req.body || {};
    if (!text || String(text).trim().length < 3) {
      return res.status(400).json({ error: 'نص العرض مطلوب.' });
    }
    const inserted = await db
      .insert(topOffers)
      .values({
        text: String(text).trim(),
        badgeText: String(badgeText || 'عرض خاص').trim(),
        isActive: true,
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: 'تعذر إضافة العرض.' });
  }
});

app.patch(
  '/api/admin/offers/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body || {};
      const updated = await db
        .update(topOffers)
        .set({ isActive: Boolean(isActive) })
        .where(eq(topOffers.id, id))
        .returning();
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ error: 'تعذر تحديث العرض.' });
    }
  }
);

app.delete(
  '/api/admin/offers/:id',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(topOffers).where(eq(topOffers.id, id));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: 'تعذر حذف العرض.' });
    }
  }
);

// Store Settings & Social Media Links
app.put('/api/admin/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureSeeded();
    const b = req.body || {};
    const updated = await db
      .update(storeSettings)
      .set({
        storeName: b.storeName !== undefined ? String(b.storeName) : undefined,
        storeDescription:
          b.storeDescription !== undefined ? String(b.storeDescription) : undefined,
        phone: b.phone !== undefined ? String(b.phone) : undefined,
        whatsapp: b.whatsapp !== undefined ? String(b.whatsapp) : undefined,
        email: b.email !== undefined ? String(b.email) : undefined,
        address: b.address !== undefined ? String(b.address) : undefined,
        currency: b.currency !== undefined ? String(b.currency) : undefined,
        deliveryFee:
          b.deliveryFee !== undefined ? String(Number(b.deliveryFee) || 0) : undefined,
        freeDeliveryThreshold:
          b.freeDeliveryThreshold !== undefined
            ? String(Number(b.freeDeliveryThreshold) || 0)
            : undefined,
        facebookUrl: b.facebookUrl !== undefined ? String(b.facebookUrl) : undefined,
        instagramUrl:
          b.instagramUrl !== undefined ? String(b.instagramUrl) : undefined,
        tiktokUrl: b.tiktokUrl !== undefined ? String(b.tiktokUrl) : undefined,
        twitterUrl: b.twitterUrl !== undefined ? String(b.twitterUrl) : undefined,
        youtubeUrl: b.youtubeUrl !== undefined ? String(b.youtubeUrl) : undefined,
        whatsappUrl: b.whatsappUrl !== undefined ? String(b.whatsappUrl) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.id, 1))
      .returning();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'تعذر حفظ إعدادات المتجر.' });
  }
});

// ========================
// VITE / STATIC SERVING
// ========================

async function startServer() {
  // Storefront and admin panel share this one database; apply the canonical
  // schema before serving so an older DB cannot break either side.
  try {
    await ensureSchema();
    console.log('Database schema ready.');
  } catch (error) {
    console.error('Database schema check failed:', error);
    console.error('Check SUPABASE_DB_URL / DATABASE_URL in your environment.');
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    // Only SPA routes fall back to index.html — missing assets must stay 404
    // and /admin.html must be served as its own page, not as the storefront.
    app.get('*', (req, res) => {
      if (path.extname(req.path)) {
        return res.status(404).send('Not found');
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      return res.status(404).send('Build not found — run npm run build first.');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Admin panel: /  |  Health: /api/health`);
  });
}

startServer();
