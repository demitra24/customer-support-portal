import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => res.json({ name: 'Relay Support Intelligence API', status: 'running' }));
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`))
);