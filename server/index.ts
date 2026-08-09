import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import universeRoutes from './routes/universeRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import guardianObservabilityRoutes from './routes/guardianObservabilityRoutes.js';
import { initializeGuardianInfrastructure } from './guardian/workerManager.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

if (isProduction) {
  if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET environment variable is required in production mode.');
    process.exit(1);
  }
  if (!frontendUrl) {
    console.error('[FATAL] FRONTEND_URL environment variable is required in production mode.');
    process.exit(1);
  }
}

// Initialize Event-Driven Guardian Infrastructure
initializeGuardianInfrastructure();

export const app = express();
export const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

// Dynamic CORS configuration for REST API
const allowedOrigins = isProduction && frontendUrl
  ? [frontendUrl.replace(/\/$/, '')]
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProduction || (frontendUrl && origin === frontendUrl.replace(/\/$/, '')) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// Initialize Socket.IO server with environment-driven CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: isProduction && frontendUrl ? frontendUrl.replace(/\/$/, '') : '*',
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Setup Socket.IO Event Handlers
setupSocketHandlers(io);

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// System Status & Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'OurVerse Real-Time Messaging & Identity Engine',
    timestamp: new Date().toISOString(),
  });
});

// Authentication & Identity Routes
app.use('/api/auth', authRoutes);

// Search & User Discovery Routes
app.use('/api/users', userRoutes);

// Universe Connection Engine Routes
app.use('/api/universe', universeRoutes);

// Real-Time Messaging Routes
app.use('/api/messages', messageRoutes);

// Guardian Infrastructure Observability Routes
app.use('/api/guardian/observability', guardianObservabilityRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const isTestRunner = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));

if (!isTestRunner) {
  server.listen(PORT, () => {
    console.log(`✨ OurVerse Real-Time Server listening on http://localhost:${PORT}`);
  });
}

export default app;

