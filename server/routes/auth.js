import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const r = Router();
const sign = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
const shape = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

r.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' });
    // Self-registration is always a customer; agent/admin roles are provisioned internally.
    const user = await User.create({ name, email, password, role: 'customer' });
    res.status(201).json({ token: sign(user), user: shape(user) });
  } catch (e) { next(e); }
});

r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.compare(password || '')))
      return res.status(401).json({ message: 'Incorrect email or password' });
    res.json({ token: sign(user), user: shape(user) });
  } catch (e) { next(e); }
});

r.get('/me', protect, (req, res) => res.json({ user: shape(req.user) }));

export default r;