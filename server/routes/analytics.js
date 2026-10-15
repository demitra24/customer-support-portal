import { Router } from 'express';
import Ticket from '../models/Ticket.js';
import { protect, requireRole } from '../middleware/auth.js';

const r = Router();
r.use(protect, requireRole('agent', 'admin'));

r.get('/overview', async (req, res, next) => {
  try {
    const tickets = await Ticket.find({}).populate('assignee', 'name');
    const now = Date.now();
    const DAY = 86400000;

    const totals = { open: 0, in_progress: 0, escalated: 0, resolved: 0, unassigned: 0, total: tickets.length };
    for (const t of tickets) {
      if (t.status in totals) totals[t.status]++;
      if (!t.assignee) totals.unassigned++;
    }
    totals.active = totals.open + totals.in_progress + totals.escalated;

    // Volume, per day, last 14 days
    const volume = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date(now - i * DAY);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + DAY);
      volume.push({
        date: start.toISOString().slice(0, 10),
        created: tickets.filter((t) => t.createdAt >= start && t.createdAt < end).length,
        resolved: tickets.filter((t) => t.resolvedAt && t.resolvedAt >= start && t.resolvedAt < end).length,
      });
    }

    const resTimes = tickets.filter((t) => t.resolvedAt).map((t) => (t.resolvedAt - t.createdAt) / 3600000);
    const avgResolutionHours = resTimes.length ? resTimes.reduce((a, b) => a + b, 0) / resTimes.length : 0;

    const rated = tickets.filter((t) => t.rating);
    const dist = [0, 0, 0, 0, 0];
    rated.forEach((t) => dist[t.rating - 1]++);
    const csat = {
      avg: rated.length ? rated.reduce((a, t) => a + t.rating, 0) / rated.length : 0,
      count: rated.length,
      dist,
    };

    const catCount = {};
    tickets.forEach((t) => (catCount[t.category] = (catCount[t.category] || 0) + 1));
    const categories = Object.entries(catCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Per-agent performance
    const map = {};
    for (const t of tickets) {
      if (!t.assignee) continue;
      const id = String(t.assignee._id);
      map[id] ??= { id, name: t.assignee.name, resolved: 0, hours: [], ratings: [], open: 0 };
      const a = map[id];
      if (t.status === 'resolved' && t.resolvedAt) {
        a.resolved++;
        a.hours.push((t.resolvedAt - t.createdAt) / 3600000);
        if (t.rating) a.ratings.push(t.rating);
      } else if (t.status !== 'resolved') a.open++;
    }
    const agents = Object.values(map)
      .map((a) => ({
        id: a.id,
        name: a.name,
        resolved: a.resolved,
        open: a.open,
        avgHours: a.hours.length ? a.hours.reduce((x, y) => x + y, 0) / a.hours.length : 0,
        csat: a.ratings.length ? a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length : 0,
      }))
      .sort((a, b) => b.resolved - a.resolved);

    const inRange = (t, from, to) => t.createdAt >= new Date(now - from) && t.createdAt < new Date(now - to);
    const thisWeek = tickets.filter((t) => inRange(t, 7 * DAY, 0)).length;
    const lastWeek = tickets.filter((t) => inRange(t, 14 * DAY, 7 * DAY)).length;

    res.json({ totals, volume, avgResolutionHours, csat, categories, agents, trend: { thisWeek, lastWeek } });
  } catch (e) { next(e); }
});

export default r;