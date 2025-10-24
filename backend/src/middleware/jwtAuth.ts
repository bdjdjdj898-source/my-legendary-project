import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/responses';

/**
 * JWT authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Требуется авторизация. Предоставьте токен в формате "Bearer <token>"');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Token expired') {
          return ApiResponse.unauthorized(res, 'Токен истек. Пожалуйста, обновите токен');
        }
        if (error.message === 'Invalid token') {
          return ApiResponse.unauthorized(res, 'Недействительный токен');
        }
      }
      return ApiResponse.unauthorized(res, 'Ошибка проверки токена');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        name: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'Пользователь не найден');
    }

    // Check if user is banned
    if (user.isBanned) {
      return ApiResponse.forbidden(res, 'Ваш аккаунт заблокирован');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error('[jwtAuth] Error:', error);
    return ApiResponse.error(res, 'Ошибка при проверке авторизации');
  }
};

/**
 * Optional JWT authentication middleware
 * If token is provided, verifies it and attaches user to request
 * If token is not provided, continues without user
 */
export const optionalJwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // No token provided - continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      return next();
    }

    const token = authHeader.substring(7);

    // Try to verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      // Token invalid - continue without user
      req.user = undefined;
      return next();
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        name: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // User not found or banned - continue without user
    if (!user || user.isBanned) {
      req.user = undefined;
      return next();
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[optionalJwtAuth] Error:', error);
    // On error, continue without user
    req.user = undefined;
    next();
  }
};
