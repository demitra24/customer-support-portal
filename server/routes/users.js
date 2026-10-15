import { Router } from 'express';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import { protect, requireRole } from '../middleware/auth.js';

const r = Router();
r.use(protect);

r.get('/agents', requireRole('agent', 'admin'), async (req, res, next) => {
  try {
    res.json({ agents: await User.find({ role: { $in: ['agent', 'admin'] } }).select('name email role') });
  } catch (e) { next(e); }
});

r.get('/customers', requireRole('admin'), async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email createdAt').lean();
    const counts = await Ticket.aggregate([
      { $group: { _id: '$customer', total: { $sum: 1 }, open: { $sum: { $cond: [{ $ne: ['$status', 'resolved'] }, 1, 0] } } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c]));
    res.json({
      customers: customers.map((c) => ({
        ...c,
        total: map[String(c._id)]?.total || 0,
        open: map[String(c._id)]?.open || 0,
      })),
    });
  } catch (e) { next(e); }
});

export default r;