import { Router } from 'express';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/auth.js';
import { classify, suggestReplies } from '../utils/classifier.js';

const r = Router();
r.use(protect);

const SEV = { low: 0, medium: 1, high: 2, urgent: 3 };
const POP = [
  { path: 'customer', select: 'name email' },
  { path: 'assignee', select: 'name email' },
];
const isStaff = (u) => ['agent', 'admin'].includes(u.role);

// --- Live triage preview (composer calls this as the customer types) ---
r.post('/classify', async (req, res, next) => {
  try {
    res.json(classify(`${req.body.subject || ''} ${req.body.description || ''}`));
  } catch (e) { next(e); }
});

// --- Create: classification runs on ingest, server-side ---
r.post('/', async (req, res, next) => {
  try {
    const { subject, description } = req.body;
    if (!subject?.trim() || !description?.trim())
      return res.status(400).json({ message: 'Subject and description are required' });
    const t = classify(`${subject} ${description}`);
    const ticket = await Ticket.create({
      subject,
      description,
      category: t.category,
      priority: t.priority,
      customer: req.user._id,
      triage: {
        confidence: t.confidence,
        sentiment: t.sentiment,
        keywords: t.keywords,
        suggestedPriority: t.priority,
      },
    });
    res.status(201).json({ ticket: await ticket.populate(POP) });
  } catch (e) { next(e); }
});

// --- List, scoped by role: customers see only their own tickets ---
r.get('/', async (req, res, next) => {
  try {
    const { status, priority, category, q, scope } = req.query;
    const filter = {};
    if (!isStaff(req.user)) filter.customer = req.user._id;
    else if (scope === 'mine') filter.assignee = req.user._id;
    else if (scope === 'unassigned') filter.assignee = null;
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;

    const tickets = await Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .populate(POP)
      .limit(200);

    const ql = (q || '').trim().toLowerCase();
    const out = ql
      ? tickets.filter(
          (t) =>
            t.subject.toLowerCase().includes(ql) ||
            t.description.toLowerCase().includes(ql) ||
            (t.customer?.name || '').toLowerCase().includes(ql)
        )
      : tickets;
    res.json({ tickets: out });
  } catch (e) { next(e); }
});

// --- Single ticket with access control ---
r.get('/:id', async (req, res, next) => {
  try {
    const t = await Ticket.findById(req.params.id).populate(POP);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    const owns = String(t.customer._id) === String(req.user._id);
    if (!isStaff(req.user) && !owns)
      return res.status(403).json({ message: 'Not your ticket' });
    res.json({ ticket: t });
  } catch (e) { next(e); }
});

// --- Agent/admin controls: status, priority, category, assignment ---
r.patch('/:id', requireRole('agent', 'admin'), async (req, res, next) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    const { status, priority, category, assignee } = req.body;

    if (assignee !== undefined) {
      if (assignee === null || assignee === '') {
        t.assignee = null;
        t.replies.push({ authorName: req.user.name, role: req.user.role, kind: 'system', body: 'Returned to the unassigned pool.' });
      } else {
        const agent = await User.findOne({ _id: assignee, role: { $in: ['agent', 'admin'] } });
        if (!agent) return res.status(400).json({ message: 'Assignee must be an agent or admin' });
        if (String(t.assignee) !== String(agent._id)) {
          t.assignee = agent._id;
          t.replies.push({ author: req.user._id, authorName: req.user.name, role: req.user.role, kind: 'system', body: `Assigned to ${agent.name}.` });
          if (t.status === 'open') t.status = 'in_progress';
        }
      }
    }
    if (status && status !== t.status) {
      t.status = status;
      t.resolvedAt = status === 'resolved' ? new Date() : null;
      t.replies.push({ author: req.user._id, authorName: req.user.name, role: req.user.role, kind: 'system', body: `Status changed to ${status.replace('_', ' ')} by ${req.user.name}.` });
    }
    if (priority) t.priority = priority;
    if (category) t.category = category;
    await t.save();
    res.json({ ticket: await t.populate(POP) });
  } catch (e) { next(e); }
});

// --- Escalation: staff or the ticket owner; bumps priority, leaves an audit note ---
r.patch('/:id/escalate', async (req, res, next) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    const owns = String(t.customer) === String(req.user._id);
    if (!isStaff(req.user) && !owns) return res.status(403).json({ message: 'Not your ticket' });
    if (t.status === 'resolved') return res.status(400).json({ message: 'Resolved tickets cannot be escalated' });
    if (t.status === 'escalated') return res.status(400).json({ message: 'Already escalated' });
    t.status = 'escalated';
    t.escalatedAt = new Date();
    if (SEV[t.priority] < SEV.high) t.priority = 'high';
    t.replies.push({ authorName: req.user.name, role: req.user.role, kind: 'system', body: `Escalated by ${req.user.name} — moved to the priority lane.` });
    await t.save();
    res.json({ ticket: await t.populate(POP) });
  } catch (e) { next(e); }
});

// --- Replies; an agent reply moves "open" to "in_progress", a customer reply reopens resolved tickets ---
r.post('/:id/replies', async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'Reply cannot be empty' });
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    const owns = String(t.customer) === String(req.user._id);
    if (!isStaff(req.user) && !owns) return res.status(403).json({ message: 'Not your ticket' });

    t.replies.push({ author: req.user._id, authorName: req.user.name, role: req.user.role, body });
    if (isStaff(req.user) && t.status === 'open') t.status = 'in_progress';
    if (!isStaff(req.user) && t.status === 'resolved') {
      t.status = 'in_progress';
      t.resolvedAt = null;
      t.replies.push({ authorName: 'System', role: 'system', kind: 'system', body: 'Ticket reopened by customer reply.' });
    }
    await t.save();
    res.json({ ticket: await t.populate(POP) });
  } catch (e) { next(e); }
});

// --- CSAT rating: owner only, once the ticket is resolved ---
r.post('/:id/rate', async (req, res, next) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    if (String(t.customer) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the ticket owner can rate' });
    if (t.status !== 'resolved')
      return res.status(400).json({ message: 'You can rate once the ticket is resolved' });
    const rating = parseInt(req.body.rating, 10);
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'Rating must be 1-5' });
    t.rating = rating;
    t.replies.push({ authorName: req.user.name, role: 'customer', kind: 'system', body: `Customer rated the resolution ${rating}/5.` });
    await t.save();
    res.json({ ticket: await t.populate(POP) });
  } catch (e) { next(e); }
});

// --- Response suggestions: recomputed from the latest customer-authored text ---
r.get('/:id/suggestions', requireRole('agent', 'admin'), async (req, res, next) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    const lastCustomer = [...t.replies].reverse().find((x) => x.role === 'customer');
    const text = lastCustomer ? lastCustomer.body : t.description;
    const engine = classify(`${t.subject} ${text}`);
    res.json({
      engine,
      basedOn: lastCustomer ? 'latest customer reply' : 'original description',
      suggestions: suggestReplies(engine),
    });
  } catch (e) { next(e); }
});

export default r;