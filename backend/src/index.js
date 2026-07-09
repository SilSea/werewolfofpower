import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pg from 'pg';
import Redis from 'ioredis';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || '*' },
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);

pool
  .query('SELECT 1')
  .then(() => console.log('postgres connected'))
  .catch((err) => console.error('postgres connection failed:', err.message));

redis.on('connect', () => console.log('redis connected'));
redis.on('error', (err) => console.error('redis connection failed:', err.message));

io.on('connection', (socket) => {
  console.log(`player connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`player disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`backend listening on port ${PORT}`);
});
