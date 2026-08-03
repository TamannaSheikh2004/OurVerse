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

// Initialize Event-Driven Guardian Infrastructure
initializeGuardianInfrastructure();

export const app = express();
export const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// Initialize Socket.IO server
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
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

