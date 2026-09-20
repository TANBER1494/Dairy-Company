require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');
const barnRoutes = require('./routes/barnRoutes');
const cycleRoutes = require('./routes/cycleRoutes');
const dailyLogRoutes = require('./routes/dailyLogRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const workerRoutes = require('./routes/workerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const platformPaymentRoutes = require('./routes/platformPaymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');  
const startCronJobs = require('./cronJobs');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
connectDB();

app.set('trust proxy', 'loopback, linklocal, uniquelocal');

app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

app.use(compression());

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

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل'
});
app.use('/api', generalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: 'محاولات تسجيل دخول كثيرة جداً، تم حظر جهازك مؤقتاً لمدة ربع ساعة.'
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '100kb' })); 
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

//app.use(mongoSanitize());
app.use(hpp()); 

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); 
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Poultry Farm ERP API is running securely!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/barns', barnRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/platform-payments', platformPaymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    err.statusCode = 400;
    err.message = `بيانات غير صالحة: المعرّف (${err.value}) ليس بصيغة صحيحة.`;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', err.message);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const http = require('http');
const socket = require('./models/socket'); 

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socket.init(server);

io.on('connection', (socket) => {
  const user = socket.user; 
  console.log(`🔌 Client connected securely: ${socket.id} | Role: ${user?.role || 'UNKNOWN'}`);

  if (user?.role === 'SUPER_ADMIN') {
    socket.join('SUPER_ADMIN_ROOM');
  } else if (user?.role === 'SUPERVISOR') {
    if (user?.farm_id) socket.join(user.farm_id.toString()); 
    if (user?._id) socket.join(user._id.toString()); 
  }

  socket.on('joinRoom', (room) => {
    if (room) {
      socket.join(room.toString());
      console.log(`🏠 Secure Socket ${socket.id} explicitly joined room: ${room}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Poultry Farm Server running securely in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  startCronJobs(); 
});

process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});