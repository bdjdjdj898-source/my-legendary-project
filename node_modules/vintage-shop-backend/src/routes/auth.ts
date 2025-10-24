import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/responses';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken, getRefreshTokenExpiration } from '../utils/jwt';
import { jwtAuth } from '../middleware/jwtAuth';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return ApiResponse.badRequest(res, 'Email, password, and name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiResponse.badRequest(res, 'Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return ApiResponse.badRequest(res, passwordValidation.errors.join('. '));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return ApiResponse.badRequest(res, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user',
        isVerified: false, // In production, send verification email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiration(),
      },
    });

    return ApiResponse.success(res, {
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[POST /api/auth/register] Error:', error);
    return ApiResponse.error(res, 'Failed to register user');
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return ApiResponse.badRequest(res, 'Email and password are required');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    // Check if user is banned
    if (user.isBanned) {
      return ApiResponse.forbidden(res, 'Your account has been banned');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiration(),
      },
    });

    return ApiResponse.success(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error);
    return ApiResponse.error(res, 'Failed to login');
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, 'Refresh token is required');
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch (error) {
      return ApiResponse.unauthorized(res, 'Invalid or expired refresh token');
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return ApiResponse.unauthorized(res, 'Invalid or expired refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.isBanned) {
      return ApiResponse.unauthorized(res, 'User not found or banned');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    return ApiResponse.success(res, {
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('[POST /api/auth/refresh] Error:', error);
    return ApiResponse.error(res, 'Failed to refresh token');
  }
});

/**
 * POST /api/auth/logout
 * Logout by invalidating refresh token
 */
router.post('/logout', jwtAuth, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, 'Refresh token is required');
    }

    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
        userId: req.user!.id,
      },
    });

    return ApiResponse.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('[POST /api/auth/logout] Error:', error);
    return ApiResponse.error(res, 'Failed to logout');
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', jwtAuth, async (req: Request, res: Response) => {
  try {
    return ApiResponse.success(res, { user: req.user });
  } catch (error) {
    console.error('[GET /api/auth/me] Error:', error);
    return ApiResponse.error(res, 'Failed to get user info');
  }
});

export default router;
