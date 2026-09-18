import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwtConfig.js';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      userId: string;
      username: string;
    };
  };
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    if (!token || typeof token !== 'string') {
      return next(new Error('UNAUTHORIZED_SOCKET: Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    if (!decoded || !decoded.userId) {
      return next(new Error('INVALID_TOKEN: Invalid authentication token payload'));
    }

    socket.data.user = {
      userId: decoded.userId,
      username: decoded.username
    };

    next();
  } catch (error: any) {
    next(new Error(`SOCKET_AUTH_ERROR: ${error.message || 'Authentication failed'}`));
  }
}
