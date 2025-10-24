import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '30d';

export interface JWTPayload {
  userId: number;
  email?: string;
  role: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION,
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate expiration date for refresh tokens
 */
export function getRefreshTokenExpiration(): Date {
  const expiration = new Date();
  // Parse expiration string (e.g., "30d" = 30 days)
  const match = JWT_REFRESH_EXPIRATION.match(/^(\d+)([smhd])$/);

  if (!match) {
    // Default to 30 days
    expiration.setDate(expiration.getDate() + 30);
    return expiration;
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      expiration.setSeconds(expiration.getSeconds() + value);
      break;
    case 'm':
      expiration.setMinutes(expiration.getMinutes() + value);
      break;
    case 'h':
      expiration.setHours(expiration.getHours() + value);
      break;
    case 'd':
      expiration.setDate(expiration.getDate() + value);
      break;
  }

  return expiration;
}
