const mongoose = require('mongoose');

const PulseSchema = new mongoose.Schema({
    weeks: { type: Number, required: true, unique: true },
    generatedAt: { type: String, required: true },
    themes: { type: Array, default: [] },
    quotes: { type: Array, default: [] },
    actions: { type: Array, default: [] },
    totalReviews: { type: Number, default: 0 },
    reviewChange: { type: String, default: '+0%' },
    sentimentScore: { type: Number, default: 0 },
    sentimentChange: { type: Number, default: 0 },
    urgentThemes: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Pulse', PulseSchema);
