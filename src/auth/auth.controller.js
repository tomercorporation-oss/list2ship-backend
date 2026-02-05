const authService = require('./auth.services');
const { registerSchema } = require('./dto/register.dto');
const { loginSchema } = require('./dto/login.dto');
const { verifyOtpSchema } = require('./dto/verify-otp.dto');

class AuthController {
  async register(req, res) {
    try {
      console.log('📝 Register request received:', req.body);
      
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        console.log('❌ Register validation failed:', error.details[0].message);
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      console.log('✅ Register validation passed, calling service...');
      const result = await authService.register(value);
      console.log('✅ Register service completed:', { userId: result.userId });

      res.status(201).json({
        success: true,
        message: `User registered successfully. OTP sent to your ${result.verificationMethod === 'PHONE' ? 'phone' : 'email'}.`,
        data: result
      });
    } catch (error) {
      console.error('💥 Register error:', error.message);
      
      // Handle specific error types
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { debug: error.message })
      });
    }
  }

  async login(req, res) {
    try {
      console.log('🔐 Login request received:', req.body);
      
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        console.log('❌ Login validation failed:', error.details[0].message);
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      console.log('✅ Login validation passed, calling service...');
      const result = await authService.login(value);
      console.log('✅ Login service completed:', { userId: result.userId });

      res.json({
        success: true,
        message: `OTP sent to your ${result.verificationMethod === 'PHONE' ? 'phone' : 'email'}`,
        data: result
      });
    } catch (error) {
      console.error('💥 Login error:', error.message);
      
      if (error.message.includes('No account found') || error.message.includes('required for')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      
      // Handle Prisma errors specifically
      if (error.code === 'P2022') {
        return res.status(500).json({
          success: false,
          message: 'Database configuration error. Please contact support.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { debug: error.message })
      });
    }
  }

  async verifyOtp(req, res) {
    try {
      console.log('🔢 Verify OTP request received:', req.body);
      
      // Validate request body using OTP schema
      const { error, value } = verifyOtpSchema.validate(req.body);
      if (error) {
        console.log('❌ OTP validation failed:', error.details[0].message);
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { userId, otp } = value;
      console.log('✅ OTP validation passed, verifying OTP for user:', userId);

      const result = await authService.verifyOtp({ userId, otp });
      console.log('✅ OTP verification successful for user:', userId);

      res.json({
        success: true,
        message: 'OTP verified successfully!',
        data: result
      });
    } catch (error) {
      console.error('💥 OTP verification error:', error.message);
      
      if (error.message.includes('Invalid or expired OTP')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('User not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'OTP verification failed. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { debug: error.message })
      });
    }
  }

  async getProfile(req, res) {
    try {
      console.log('👤 Get profile request for user:', req.user.userId);
      
      const user = await authService.getProfile(req.user.userId);
      console.log('✅ Profile fetched successfully for user:', req.user.userId);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('💥 Get profile error:', error.message);
      
      if (error.message.includes('User not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile.',
        ...(process.env.NODE_ENV === 'development' && { debug: error.message })
      });
    }
  }
}

module.exports = new AuthController();