require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorMiddleware');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Database Connection
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const workerRoutes = require('./routes/workerRoutes');
const expenseCategoryRoutes = require('./routes/expenseCategoryRoutes');
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const clientRoutes = require('./routes/clientRoutes');
const supplierTransactionRoutes = require('./routes/supplierTransactionRoutes');
const clientTransactionRoutes = require('./routes/clientTransactionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

connectDB();

app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Security Middlewares
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));
app.use(compression());

// CORS Setup
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  process.env.CLIENT_URL 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('غير مصرح بهذا النطاق بموجب سياسة CORS'));
    }
  },
  credentials: true 
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل'
});
app.use('/api', generalLimiter);

// Body Parsing & Data Sanitization
app.use(express.json({ limit: '100kb' })); 
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
//app.use(mongoSanitize());
app.use(hpp());

const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Dairy Company ERP API is running securely!' 
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Dairy Company API Docs"
}));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', supplierTransactionRoutes);
app.use('/api/client-transactions', clientTransactionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res, next) => {
  const err = new Error(`لا يمكن العثور على المسار ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Dairy Company Server running securely in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down gracefully...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});