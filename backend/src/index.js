import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Redis from 'ioredis';
import { pool } from './db/pool.js';
import { registerSocketHandlers } from './socket/index.js';
import { loadContentCache } from './admin/contentStore.js';
import { uploadsDir } from './admin/imageStore.js';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/uploads', express.static(uploadsDir()));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true }, // reflect request origin — no auth/cookies to protect, any client can connect
});

const redis = new Redis(process.env.REDIS_URL);

pool
  .query('SELECT 1')
  .then(() => console.log('postgres connected'))
  .catch((err) => console.error('postgres connection failed:', err.message));

loadContentCache()
  .then(() => console.log('content cache loaded'))
  .catch((err) => console.error('content cache load failed:', err.message));

redis.on('connect', () => console.log('redis connected'));
redis.on('error', (err) => console.error('redis connection failed:', err.message));

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`backend listening on port ${PORT}`);
});
