/* server/index.js */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const cron = require('node-cron');
const resend = require('./config/resend');
const Product = require('./models/Product');
const { validateObjectId } = require('./middleware/security');
const { sendResponse, sendError } = require('./utils/responseHandler');

dotenv.config();

const app = express();

/* ════════════════════════════════════════
   CORS — must be FIRST before everything
   ════════════════════════════════════════ */
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

/* ════════════════════════════════════════
   SECURITY
   ════════════════════════════════════════ */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false,
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.get('origin')}`);
  next();
});

/* Raw body for Razorpay webhook — must come BEFORE json parser */
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ════════════════════════════════════════
   RATE LIMITING
   ════════════════════════════════════════ */
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
}));

// Optimization: Strict rate limiting for sensitive payment and auth endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: { success: false, error: "Too many attempts, please try again after 15 minutes" }
});
app.use('/api/payments', strictLimiter);
app.use('/api/auth', strictLimiter);

/* ════════════════════════════════════════
   HEALTH CHECK
   ════════════════════════════════════════ */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Arihant Store API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1
      ? 'connected' : 'disconnected',
  });
});

/* ════════════════════════════════════════
   ROUTES — import your existing route files
   ════════════════════════════════════════ */

/* Check which route files you have and import them */
/* Run: ls server/routes to see what exists */
/* Then uncomment only the ones that exist: */

const authRoutes        = require('./routes/auth');
const schoolRoutes      = require('./routes/schools');
const standardRoutes    = require('./routes/standards');
const uniformItemRoutes = require('./routes/uniformItems');
const addressRoutes     = require('./routes/addresses');
const cartRoutes        = require('./routes/carts');
const orderRoutes       = require('./routes/orders');
const paymentRoutes     = require('./routes/payments');
const adminRoutes       = require('./routes/admin');
// ─── NEW ROUTES ─────────────────────────────────────────
const productRoutes        = require('./routes/products');
const searchRoutes         = require('./routes/search');
const wishlistRoutes       = require('./routes/wishlist');
const couponRoutes         = require('./routes/coupons');
const deliveryRoutes       = require('./routes/delivery');
const inquiryRoutes        = require('./routes/inquiries');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
// ─── HOMEPAGE CMS ROUTES ────────────────────────────────
const homepageRoutes       = require('./routes/homepage');
const adminHomepageRoutes  = require('./routes/adminHomepage');

app.use('/api/auth',          authRoutes);
app.use('/api/schools',       schoolRoutes);
app.use('/api/standards',     standardRoutes);
app.use('/api/uniform-items', uniformItemRoutes);
app.use('/api/addresses',     addressRoutes);
app.use('/api/carts',         cartRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/admin',         adminRoutes);
// ─── NEW ROUTES ─────────────────────────────────────────
app.use('/api/products',      productRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/wishlist',      wishlistRoutes);
app.use('/api/coupons',       couponRoutes);
app.use('/api/delivery',      deliveryRoutes);
app.use('/api/inquiries',       inquiryRoutes);
app.use('/api/admin',           adminAnalyticsRoutes); // extends /api/admin with analytics/inventory
// ─── HOMEPAGE CMS ────────────────────────────────────────
app.use('/api/homepage',        homepageRoutes);
app.use('/api/admin/homepage',  adminHomepageRoutes); // admin CRUD for homepage sections & categories

/* ════════════════════════════════════════
   404 HANDLER
   ════════════════════════════════════════ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ════════════════════════════════════════
   GLOBAL ERROR HANDLER — always last
   ════════════════════════════════════════ */
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  /* Mongoose bad ObjectId */
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  /* Mongoose duplicate key */
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  /* Mongoose validation error */
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(e => e.message).join('. ');
  }

  /* JWT errors */
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  if (statusCode >= 500) {
    console.error('🔴 SERVER ERROR:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
});

/* ════════════════════════════════════════
   DATABASE + SERVER START
   ════════════════════════════════════════ */

// Optimization: MongoDB Connection Pool & Monitoring
const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Monitoring: Log connection events for better visibility
mongoose.connection.on('error', (err) => console.error(`[${new Date().toISOString()}] MongoDB Error:`, err));
mongoose.connection.on('disconnected', () => console.warn(`[${new Date().toISOString()}] MongoDB Disconnected`));

// Performance: Slow Query Logger (only in development)
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    const start = Date.now();
    setTimeout(() => {
      const duration = Date.now() - start;
      if (duration > 100) {
        console.warn(`[SLOW QUERY] ${collectionName}.${method} took ${duration}ms`, JSON.stringify(query));
      }
    }, 0);
  });
}

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    console.log('✅ MongoDB Connected with Pool Size:', mongooseOptions.maxPoolSize);

    const PORT = process.env.PORT || 5051;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
    });

    // CRON JOB: Low Stock Monitoring (Runs every day at 8:00 AM)
    cron.schedule('0 8 * * *', async () => {
      try {
        console.log('[CRON] Running daily low stock check...');
        const products = await Product.find({ 'variants.stock_qty': { $lt: 10 } }).lean();
        const lowStockItems = [];
        
        products.forEach(p => {
          const badVariants = p.variants.filter(v => v.stock_qty < 10);
          if (badVariants.length > 0) lowStockItems.push({ name: p.name, id: p._id, variants: badVariants });
        });

        if (lowStockItems.length > 0 && resend) {
          const ownerEmail = process.env.OWNER_EMAIL || 'orders@arihantuniform.com';
          const listHtml = lowStockItems.map(item => `
            <li><strong>${item.name}</strong> (${item.id}): 
              ${item.variants.map(v => `${v.size} (${v.stock_qty} left)`).join(', ')}
            </li>
          `).join('');

          await resend.emails.send({
            from: 'Arihant Alerts <onboarding@resend.dev>',
            to: ownerEmail,
            subject: '⚠️ Daily Low Stock Alert — Arihant Store',
            html: `
              <div style="font-family:sans-serif;padding:20px;">
                <h2 style="color:#d97706;">Low Stock Alert</h2>
                <p>The following items have sizes with less than 10 units in stock:</p>
                <ul>${listHtml}</ul>
                <a href="https://arihant-uniforms.vercel.app/admin/inventory" style="display:inline-block;margin-top:20px;padding:10px 15px;background:#1a1a1a;color:#fff;text-decoration:none;">Go to Inventory</a>
              </div>
            `
          });
          console.log(`[CRON] Low stock alert email sent for ${lowStockItems.length} products.`);
        }
      } catch (err) {
        console.error('[CRON] Failed to run low stock check:', err);
      }
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the existing process and restart.`);
        console.error(`💡 Tip: Run 'lsof -ti:${PORT} | xargs kill -9' in terminal to kill the process.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', e.message);
      }
    });

    // Graceful Shutdown Handling
    const shutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await mongoose.connection.close(false);
          console.log('MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });

      // Force shutdown if it takes too long
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});