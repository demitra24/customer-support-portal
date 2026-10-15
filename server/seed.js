import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Ticket from './models/Ticket.js';
import { classify } from './utils/classifier.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

const USERS = [
  { name: 'Priya Raman', email: 'priya@relay.io', role: 'admin', password: 'admin123' },
  { name: 'Dana Whitfield', email: 'dana@relay.io', role: 'agent', password: 'agent123' },
  { name: 'Leo Martins', email: 'leo@relay.io', role: 'agent', password: 'agent123' },
  { name: 'Aisha Bello', email: 'aisha@relay.io', role: 'agent', password: 'agent123' },
  { name: 'Sam Ortiz', email: 'sam@relay.io', role: 'customer', password: 'customer123' },
  { name: 'Jules Petit', email: 'jules@relay.io', role: 'customer', password: 'customer123' },
  { name: 'Nina Kovacs', email: 'nina@relay.io', role: 'customer', password: 'customer123' },
  { name: 'Marco Ferreira', email: 'marco@relay.io', role: 'customer', password: 'customer123' },
  { name: 'Tessa Lange', email: 'tessa@relay.io', role: 'customer', password: 'customer123' },
  { name: 'Omar Haddad', email: 'omar@relay.io', role: 'customer', password: 'customer123' },
];

const TEMPLATES = {
  billing: [
    ['Double charged on my last invoice', 'I was charged twice for my subscription — two identical payments left my card on the same day. I need a refund for the duplicate charge and the invoice corrected.'],
    ['Refund for cancelled plan', 'I cancelled my plan two weeks ago but was still billed this month. Please refund the payment and confirm my subscription will not renew.'],
    ['Card declined but payment went through', 'My card showed a declined error yet the money left my account. I have the receipt and the transaction reference, but nothing shows on my billing page.'],
  ],
  technical: [
    ['Dashboard crashes when exporting reports', 'Every time I try to export a report the app crashes with a 500 error. It worked last week. This is blocking my whole team — we need this fixed urgently.'],
    ['Uploads fail with a timeout', 'File uploads fail after about 30 seconds with a timeout error. Files are small, under 5 MB, and my connection is fine. The spinner just freezes and nothing uploads.'],
    ['API returning 500 on orders endpoint', 'Our production integration started receiving 500 responses from the orders endpoint since yesterday. No changes on our side. This is taking our sync jobs down completely.'],
  ],
  account: [
    ['Locked out after password reset', 'I reset my password yesterday and now I am locked out of my account entirely. It says my credentials are invalid. I need access back urgently, I cannot reach any of my saved work.'],
    ['Two-factor codes not arriving', 'My 2fa codes stopped arriving by email so I cannot sign in. I have checked spam twice. Please help me regain access to my account.'],
    ['Change the email on my account', 'I want to change the email address on my account to my new work address and remove the old one for security reasons.'],
  ],
  shipping: [
    ['Order stuck in transit for 9 days', 'My order was shipped 9 days ago and tracking has not updated since it left the warehouse. The package appears to be lost. I need a replacement or a refund.'],
    ['Wrong delivery address on order', 'My package is being delivered to my old address. I updated my address before it shipped but the label still shows the old one. How can we redirect the courier?'],
    ['Late delivery, parcel returned', 'The courier attempted delivery while I was at work and returned the parcel to the depot without leaving a notice. I still want my order — please arrange redelivery.'],
  ],
  product: [
    ['Feature request: dark mode for reports', 'Any plan to add a dark mode for the report builder? Our analysts stare at it all day. Also, is there a way to increase the export row limit on the current plan?'],
    ['How do I integrate with Slack', 'How do I set up the Slack integration? I cannot find the documentation and the settings page does not show where to add the api key.'],
    ['Upgrade to the team plan', 'We want to upgrade our plan to the team tier and need to know how seat limits and quotas work before we upgrade.'],
  ],
  other: [
    ['Question about data deletion policy', 'Before we roll this out company-wide I need clarity on your data retention and deletion policy. Where can I find the documentation?'],
    ['Partnership enquiry', 'We run a support consultancy and would like to discuss a partnership. Who is the right person to talk to?'],
  ],
};

const AGENT_REPLIES = [
  "Thanks for flagging this — I've picked it up and I'm looking into it right now. I'll come back with a concrete update shortly.",
  "I can see the issue on our side and I've looped in the team that owns it. You don't need to do anything for now; I'll keep you posted here.",
  "Apologies for the trouble. I've checked the logs and I have a good idea of what's happening — give me a little time and I'll confirm the fix.",
  'Thanks for the details, they helped a lot. I have started the fix process and will confirm here as soon as it is done.',
];

async function main() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Ticket.deleteMany({})]);

  const created = await User.create(USERS);
  const agents = created.filter((u) => ['agent', 'admin'].includes(u.role));
  const customers = created.filter((u) => u.role === 'customer');

  const now = Date.now();
  const DAY = 86400000;
  const cats = Object.keys(TEMPLATES);
  const docs = [];

  for (let i = 0; i < 46; i++) {
    const category = cats[i % cats.length];
    const [subject, description] = pick(TEMPLATES[category]);
    const customer = pick(customers);
    const daysAgo = Math.random() * 13.5;
    const createdAt = new Date(now - daysAgo * DAY);

    const roll = Math.random();
    let status = roll < 0.45 ? 'resolved' : roll < 0.68 ? 'in_progress' : roll < 0.88 ? 'open' : 'escalated';
    if (daysAgo > 9 && status !== 'resolved' && Math.random() < 0.7) status = 'resolved';
    if (daysAgo < 0.7 && status === 'resolved') status = 'open';

    const triage = classify(`${subject} ${description}`);
    const needsAgent = status !== 'open';
    const assignee = needsAgent ? pick(agents) : Math.random() < 0.4 ? pick(agents) : null;

    const replies = [];
    if (needsAgent && assignee) {
      replies.push({
        author: assignee._id,
        authorName: assignee.name,
        role: 'agent',
        body: pick(AGENT_REPLIES),
        createdAt: new Date(createdAt.getTime() + (0.4 + Math.random() * 4) * 3600000),
      });
    }

    let resolvedAt = null;
    let rating = null;
    if (status === 'resolved') {
      resolvedAt = new Date(createdAt.getTime() + (2 + Math.random() * 46) * 3600000);
      if (resolvedAt > new Date()) resolvedAt = new Date();
      if (Math.random() < 0.72) rating = pick([5, 5, 4, 4, 4, 3, 2]);
    }
    if (status === 'escalated') {
      replies.push({
        authorName: assignee ? assignee.name : 'System',
        role: 'system',
        kind: 'system',
        body: 'Escalated — moved to the priority lane.',
        createdAt: new Date(createdAt.getTime() + 2 * 3600000),
      });
    }

    docs.push({
      subject,
      description,
      status,
      priority: triage.priority,
      category: triage.category,
      customer: customer._id,
      assignee: assignee ? assignee._id : null,
      replies,
      rating,
      triage: {
        confidence: triage.confidence,
        sentiment: triage.sentiment,
        keywords: triage.keywords,
        suggestedPriority: triage.priority,
      },
      escalatedAt: status === 'escalated' ? new Date(createdAt.getTime() + 2 * 3600000) : null,
      resolvedAt,
      createdAt,
      updatedAt: resolvedAt || replies[replies.length - 1]?.createdAt || createdAt,
    });
  }

  await Ticket.insertMany(docs);
  console.log(`[seed] ${created.length} users, ${docs.length} tickets`);
  console.table(USERS.map(({ name, email, role, password }) => ({ name, email, role, password })));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });