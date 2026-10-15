import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CORS — open in dev; locked in prod via CLIENT_ORIGIN (leave unset on Render)
const ALLOWED = (process.env.CLIENT_ORIGIN || '').split(',').filter(Boolean);
app.use(cors(ALLOWED.length ? { origin: ALLOWED } : {}));
app.use(express.json());

app.get('/api', (req, res) => res.json({ name: 'Relay Support Intelligence API', status: 'running' }));
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// --- production: serve the built React app from the same server ---
const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist));
app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  app.listen(PORT, () => console.log(`[api] listening on port ${PORT}`))
);