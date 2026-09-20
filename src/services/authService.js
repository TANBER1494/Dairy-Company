const mongoose = require('mongoose');
const User = require('../models/User');
const Farm = require('../models/Farm');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('./emailService'); 
const AppError = require('../utils/AppError');

const generateTokens = (id, sessionId) => {
  const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', 
  });
  
  const refreshToken = jwt.sign({ id, sessionId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', 
  });

  return { accessToken, refreshToken };
};

class AuthService {
  
  async registerSupervisor(data) {
    const { name, phone, email, password, farm_name, address } = data;

    const existingPhone = await User.findOne({ phone }).lean();
    if (existingPhone) {
      if (existingPhone.status === 'PENDING') throw new AppError('هذا الرقم مسجل وبانتظار التفعيل، يرجى تفعيل حسابك', 400);
      throw new AppError('رقم الهاتف مسجل بالفعل في النظام', 400);
    }

    if (email) {
      const existingEmail = await User.findOne({ email }).lean();
      if (existingEmail) {
        if (existingEmail.status === 'PENDING') throw new AppError('هذا الإيميل مسجل وبانتظار التفعيل، يرجى تفقد صندوق الوارد', 400);
        throw new AppError('البريد الإلكتروني مسجل بالفعل', 400);
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let supervisor; 
    let otpCode;

    try {
      const trialDays = Number(process.env.TRIAL_DAYS) || 14;
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = crypto.createHash('sha256').update(otpCode).digest('hex');

      const createdUsers = await User.create([{
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.toLowerCase().trim() : undefined,
        password_hash,
        role: 'SUPERVISOR', 
        status: 'PENDING',
        otp_code: hashedOTP,
        otp_expires_at: Date.now() + 10 * 60 * 1000,
        otp_last_sent_at: Date.now()
      }], { session });

      supervisor = createdUsers[0];

      const createdFarms = await Farm.create([{
        supervisor_id: supervisor._id,
        name: farm_name.trim(),
        location: address ? address.trim() : 'المقر الرئيسي',
        monthly_fee: 0,
        subscription_status: 'TRIAL',
        trial_ends_at: trialEndsAt,
      }], { session });

      supervisor.farm_id = createdFarms[0]._id;
      await supervisor.save({ session, validateBeforeSave: false });

      await session.commitTransaction();
      session.endSession();

    } catch (dbError) {
      await session.abortTransaction();
      session.endSession();
      console.error('Database Transaction Error:', dbError);
      throw new AppError('فشل تأسيس النظام بسبب خطأ في قواعد البيانات، يرجى المحاولة لاحقاً', 500);
    }

    try {
      await emailService.sendOTP({
        email: supervisor.email,
        name: supervisor.name,
        otp: otpCode,
        type: 'activation' 
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      throw new AppError('تم إنشاء الحساب بنجاح، ولكن تعذر إرسال كود التفعيل إلى بريدك. يرجى التأكد من صحة البريد أو استخدام ميزة إعادة الإرسال', 500);
    }

    return { message: 'تم إنشاء الحساب والمزرعة بنجاح، يرجى تفقد بريدك الإلكتروني لإدخال كود التفعيل' };
  }

  async verifyRegistration(email, otp) {
    if (!email || !otp) throw new AppError('البريد الإلكتروني وكود التحقق مطلوبان', 400);

    const user = await User.findOne({ email: email.toLowerCase(), status: 'PENDING', deleted_at: null })
      .select('+otp_code +otp_expires_at');
      
    if (!user) throw new AppError('الحساب غير موجود أو تم تفعيله مسبقاً', 404);

    if (!user.otp_code || !user.otp_expires_at || user.otp_expires_at.getTime() < Date.now()) {
      throw new AppError('كود التحقق منتهي الصلاحية، يرجى طلب كود جديد', 400);
    }

    const hashedInputOTP = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    if (hashedInputOTP !== user.otp_code) {
      throw new AppError('كود التحقق غير صحيح', 400);
    }

    user.status = 'ACTIVE';
    user.otp_code = undefined;
    user.otp_expires_at = undefined;
    
    const sessionId = crypto.randomBytes(16).toString('hex');
    user.current_session_id = sessionId;
    await user.save({ validateBeforeSave: false });

    // جلب المزرعة المرتبطة بالمشرف
    const farm = await Farm.findOne({ supervisor_id: user._id }).lean();

    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farm_id: farm ? farm._id : null,
        farm_name: farm ? farm.name : null,
      },
      accessToken,
      refreshToken
    };
  }

  async resendActivationOTP(email) {
    if (!email) throw new AppError('البريد الإلكتروني مطلوب', 400);

    const user = await User.findOne({ email: email.toLowerCase(), status: 'PENDING', deleted_at: null })
      .select('+otp_last_sent_at');
      
    if (!user) throw new AppError('الحساب غير موجود أو تم تفعيله مسبقاً', 404);

    if (user.otp_last_sent_at && (Date.now() - user.otp_last_sent_at.getTime() < 60000)) {
      const remainingSeconds = 60 - Math.floor((Date.now() - user.otp_last_sent_at.getTime()) / 1000);
      throw new AppError(`يرجى الانتظار ${remainingSeconds} ثانية قبل طلب كود جديد`, 429);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_code = crypto.createHash('sha256').update(otpCode).digest('hex');
    user.otp_expires_at = Date.now() + 10 * 60 * 1000;
    user.otp_last_sent_at = Date.now();
    await user.save({ validateBeforeSave: false });

    await emailService.sendOTP({
      email: user.email,
      name: user.name,
      otp: otpCode,
      type: 'activation'
    });

    return true;
  }

  async login(phone, password) {
    const user = await User.findOne({ phone, deleted_at: null })
      .select('+password_hash')
      .populate('farm_id', 'name'); 
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('بيانات الدخول غير صحيحة', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('هذا الحساب معطل، يرجى مراجعة الإدارة', 403);
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    user.current_session_id = sessionId;
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id, sessionId);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farm_id: user.farm_id ? user.farm_id._id : null, 
        farm_name: user.farm_id ? user.farm_id.name : null, // 🚀 اسم المزرعة متاح الآن
      },
      accessToken,
      refreshToken
    };
  }

  async forgotPassword(email) {
    // ... [باقي الكود كما هو بدون تغيير]
    if (!email) throw new AppError('البريد الإلكتروني مطلوب', 400);

    const user = await User.findOne({ email: email.toLowerCase(), deleted_at: null }).select('+otp_last_sent_at');
    if (!user) throw new AppError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', 404);

    if (user.status !== 'ACTIVE') throw new AppError('هذا الحساب معطل', 403);

    if (user.otp_last_sent_at && (Date.now() - user.otp_last_sent_at.getTime() < 60000)) {
      const remainingSeconds = 60 - Math.floor((Date.now() - user.otp_last_sent_at.getTime()) / 1000);
      throw new AppError(`يرجى الانتظار ${remainingSeconds} ثانية قبل طلب كود جديد`, 429);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(otpCode).digest('hex');

    user.otp_code = hashedOTP;
    user.otp_expires_at = Date.now() + 10 * 60 * 1000; 
    user.otp_last_sent_at = Date.now();
    await user.save({ validateBeforeSave: false });

    await emailService.sendOTP({
      email: user.email,
      name: user.name,
      otp: otpCode,
      type: 'reset_password' 
    });

    return true;
  }

  async resetPasswordWithOTP(email, otp, newPassword) {
    // ... [باقي الكود كما هو بدون تغيير]
    if (!email || !otp || !newPassword) throw new AppError('البيانات غير مكتملة', 400);
    if (newPassword.length < 6) throw new AppError('يجب أن تتكون كلمة المرور من 6 أحرف كحد أدنى', 400);

    const user = await User.findOne({ email: email.toLowerCase(), deleted_at: null })
      .select('+otp_code +otp_expires_at +password_hash');

    if (!user) throw new AppError('المستخدم غير موجود', 404);

    if (!user.otp_code || !user.otp_expires_at || user.otp_expires_at.getTime() < Date.now()) {
      throw new AppError('كود التحقق منتهي الصلاحية، يرجى طلب كود جديد', 400);
    }

    const hashedInputOTP = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    if (hashedInputOTP !== user.otp_code) {
      throw new AppError('كود التحقق غير صحيح', 400);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new AppError('لأسباب أمنية، يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية', 400);
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    
    user.otp_code = undefined;
    user.otp_expires_at = undefined;
    user.current_session_id = crypto.randomBytes(16).toString('hex');
    
    await user.save({ validateBeforeSave: false });

    return true;
  }

  async refreshAuthToken(token) {
    // ... [باقي الكود كما هو بدون تغيير]
    if (!token) throw new AppError('توكن التجديد مفقود', 401);

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user || user.deleted_at || user.status !== 'ACTIVE') {
        throw new AppError('حساب غير صالح', 401);
      }

      if (user.current_session_id !== decoded.sessionId) {
        throw new AppError('تم تسجيل الدخول من جهاز آخر. تم إنهاء هذه الجلسة.', 401);
      }

      const newSessionId = crypto.randomBytes(16).toString('hex');
      user.current_session_id = newSessionId;
      await user.save({ validateBeforeSave: false });

      return generateTokens(user._id, newSessionId);
    } catch (error) {
      throw new AppError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 401);
    }
  }

  async updateFcmToken(userId, fcm_token) {
    await User.findByIdAndUpdate(userId, { fcm_token });
  }
}

module.exports = new AuthService();