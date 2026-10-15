// Relay triage engine — a transparent, rule-based classifier.
// It scores ticket text against domain lexicons; every match is traceable,
// so agents can see exactly WHY a ticket was classified the way it was.

const LEX = {
  billing: ['refund', 'charged', 'charge', 'invoice', 'billing', 'payment', 'card', 'subscription', 'price', 'receipt', 'money', 'renew', 'billed'],
  technical: ['error', 'bug', 'crash', 'crashes', 'broken', 'not working', 'fails', 'failed', 'failing', '500', 'blank', 'freeze', 'freezes', 'stuck', 'slow', 'timeout', 'down', 'glitch', 'corrupt', 'spinner'],
  account: ['password', 'login', 'log in', 'sign in', 'locked out', 'locked', 'account', 'access', '2fa', 'two-factor', 'two factor', 'username', 'profile', 'credentials'],
  shipping: ['delivery', 'shipping', 'shipped', 'track', 'tracking', 'package', 'parcel', 'order', 'arrived', 'courier', 'dispatch', 'transit', 'warehouse', 'redelivery', 'address'],
  product: ['feature', 'request', 'how do i', 'how to', 'export', 'integration', 'slack', 'limit', 'limits', 'plan', 'upgrade', 'api key', 'quota', 'documentation', 'docs', 'dark mode'],
};
const URGENT_WORDS = ['urgent', 'asap', 'immediately', 'outage', 'production', 'completely down', 'data loss', 'fraud', 'unauthorized', 'security', 'cannot access', 'emergency'];
const HIGH_WORDS = ['broken', 'not working', 'failed', 'failing', 'blocking', 'blocked', 'third time', 'again', 'days now', 'deadline', 'escalate', 'lost', 'wrong'];
const NEG_WORDS = ['angry', 'frustrated', 'frustrating', 'unacceptable', 'terrible', 'worst', 'disappointed', 'ridiculous', 'fed up', 'awful', 'horrible', 'useless', 'annoyed'];
const POS_WORDS = ['thanks', 'thank you', 'appreciate', 'great', 'love', 'awesome', 'helpful'];

export function classify(raw) {
  const text = (raw || '').toLowerCase();
  const hits = [];
  const scores = {};

  for (const [cat, words] of Object.entries(LEX)) {
    let score = 0;
    for (const w of words) {
      if (text.includes(w)) {
        score += w.includes(' ') ? 2 : 1;
        hits.push(w);
      }
    }
    if (score) scores[cat] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const category = ranked.length ? ranked[0][0] : 'other';
  const strength = ranked.length ? ranked[0][1] : 0;
  const confidence = ranked.length ? Math.min(0.95, 0.45 + strength * 0.11) : 0.3;

  const urgent = URGENT_WORDS.filter((w) => text.includes(w));
  const high = HIGH_WORDS.filter((w) => text.includes(w));
  const neg = NEG_WORDS.filter((w) => text.includes(w));
  const pos = POS_WORDS.filter((w) => text.includes(w));
  const sentiment = neg.length > pos.length ? 'negative' : pos.length > neg.length ? 'positive' : 'neutral';

  let priority = 'medium';
  if (urgent.length) priority = 'urgent';
  else if (high.length >= 2 || (high.length === 1 && sentiment === 'negative')) priority = 'high';
  else if (category === 'billing' && ['refund', 'charged', 'billed'].some((w) => text.includes(w))) priority = 'high';
  else if (!ranked.length && text.trim().length < 40) priority = 'low';

  return {
    category,
    priority,
    confidence: +confidence.toFixed(2),
    sentiment,
    keywords: [...new Set(hits)].slice(0, 8),
  };
}

const CATEGORY_REPLIES = {
  billing: `I've pulled up the transaction on our side and flagged the charge for review. If it's a duplicate or a billing error, our team reverses it within 3-5 business days and you'll see it back on your statement — I'll keep this ticket open until you confirm.`,
  technical: `Could you tell me exactly what you see when it fails — the error text, the page, and the browser you're on? While you check, try a hard refresh (Ctrl/Cmd + Shift + R) and signing out and back in; that clears most cases like this. I'm pulling the logs on our side in parallel.`,
  account: `I can get your access restored. I've queued a secure reset link to your registered email — it expires in 30 minutes, so use it as soon as it lands. If it doesn't arrive within a few minutes, check spam and reply here and I'll verify your identity manually instead.`,
  shipping: `I've located the shipment in our carrier's feed and requested a formal trace. If the parcel is confirmed lost, we reship immediately at no cost to you — you won't need to do a thing. I'll update this ticket as soon as the carrier responds.`,
  product: `Good news — this is covered in our guide, and I've linked the exact section below so you can set it up in a couple of minutes. If the limits on your current plan are what's holding you back, I can walk you through the tier that fits instead.`,
  other: `Thanks for reaching out — I've read your message carefully and I'm looking into it now. You'll hear back from me with a concrete update within one business day.`,
};
const EMPATHY = `I'm really sorry this has been such a frustrating experience — that's not the standard we hold ourselves to, and I'm taking ownership of it from here. `;
const URGENT_LINE = `I've marked this as urgent and flagged it to the on-duty lead; you won't need to follow up — we'll come to you. `;

export function suggestReplies(engine) {
  let base = CATEGORY_REPLIES[engine.category] || CATEGORY_REPLIES.other;
  if (engine.sentiment === 'negative') base = EMPATHY + base;
  if (engine.priority === 'urgent') base = URGENT_LINE + base;
  return [
    { title: `Opening response · ${engine.category}`, body: base },
    { title: 'Hold the loop', body: `Quick update so you're never left guessing: I'm still working on this and expect to have a substantive answer by end of day. No action needed from you right now.` },
    { title: 'Close it well', body: `I believe this is now fully resolved. If anything resurfaces in the next few days, reply right here and it comes straight back to me — otherwise I'll consider this closed. If you have a moment, a rating below helps our team a lot.` },
  ];
}