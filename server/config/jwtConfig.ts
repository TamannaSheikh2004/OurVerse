import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is required in production mode.');
  process.exit(1);
}

export const JWT_SECRET: string =
  process.env.JWT_SECRET || 'ourverse_cosmic_jwt_secret_key_2026_super_secure';
