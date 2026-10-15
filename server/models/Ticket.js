import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
    role: String,
    body: String,
    kind: { type: String, enum: ['reply', 'system'], default: 'reply' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'escalated', 'resolved'], default: 'open', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    category: { type: String, enum: ['billing', 'technical', 'account', 'shipping', 'product', 'other'], default: 'other', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    replies: [replySchema],
    rating: { type: Number, min: 1, max: 5, default: null },
    // Triage engine output, stored at ingest time
    triage: {
      confidence: Number,
      sentiment: String,
      keywords: [String],
      suggestedPriority: String,
    },
    escalatedAt: Date,
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);