require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const { fetchAllReviews } = require('./services/reviewFetcher');
const { generatePulseReport } = require('./services/llmAnalyzer');
const { sendPulseEmail } = require('./services/emailService');
const { JobTracker } = require('./services/jobTracker');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Pulse = require('./services/PulseModel');

// MongoDB Connection
// MongoDB Connection - Force use of pulse_db to avoid configuration errors
mongoose.connect(process.env.MONGODB_URI, { dbName: 'pulse_db' })
    .then(() => console.log('Connected to MongoDB Atlas (pulse_db)'))
    .catch(err => console.error('MongoDB connection error:', err));

// Handle global errors to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize job tracker
const jobTracker = new JobTracker();

// Cleanup old jobs every hour
setInterval(() => jobTracker.cleanupOldJobs(), 60 * 60 * 1000);

app.use(cors());
app.use(express.json());

// Background Cron Job (Runs every 24 hours at 2:00 AM)
// This strictly pre-loads the data.
cron.schedule('0 2 * * *', () => runPulseGeneration(null, 8));

const HISTORY_PATH = path.join(__dirname, 'dashboard', 'src', 'data', 'pulse_history.json');

// Helper to load/save history (Updated for MongoDB)
const loadHistoryFromDB = async () => {
    try {
        console.log('[DB] Fetching all pulse records...');
        const results = await Pulse.find({});
        console.log(`[DB] Successfully fetched ${results.length} records.`);
        const history = {};
        results.forEach(r => {
            history[r.weeks] = r.toObject();
        });
        return history;
    } catch (e) {
        console.error('[DB] Error loading pulse history:', e.message);
        return {};
    }
};

const saveOneToDB = async (pulseData) => {
    try {
        await Pulse.findOneAndUpdate(
            { weeks: pulseData.weeks },
            pulseData,
            { upsert: true, new: true }
        );
        console.log(`[DB] Saved pulse for week ${pulseData.weeks}`);
    } catch (e) {
        console.error('Error saving to DB:', e);
    }
};

async function runPulseGeneration(jobId = null, weeks = 8, recipientEmail = null, forceNew = false) {
    const job = jobId ? jobTracker.getJob(jobId) : null;
    console.log(`[Pulse] Request for ${weeks} weeks. ForceNew: ${forceNew}`);
    
    const history = await loadHistoryFromDB();
    console.log(`[Pulse] Available weeks in DB: ${Object.keys(history).join(', ')}`);
    
    // Check if we already have a recent report for this week count
    if (!forceNew && history[weeks]) {
        console.log(`[Pulse] 🎯 CACHE HIT for ${weeks} weeks.`);
        const pulseData = history[weeks];
        
        if (job) {
            jobTracker.updateStage(jobId, 'initializing', 100, true);
            jobTracker.updateStage(jobId, 'fetching_reviews', 100, true);
            jobTracker.updateStage(jobId, 'analyzing_reviews', 100, true);
            jobTracker.updateStage(jobId, 'generating_report', 100, true);
        }

        const finalRecipient = recipientEmail || process.env.TARGET_EMAIL;
        if (finalRecipient) {
            // Restore AWAIT for reliability (so user sees success/fail)
            await handleEmailPhase(jobId, pulseData, finalRecipient);
        }

        if (job) {
            jobTracker.updateStage(jobId, 'completed', 100, true);
            jobTracker.setJobResult(jobId, pulseData);
        }
        return pulseData;
    }

    console.log(`\n[System] Starting fresh Pulse Generation for ${weeks} weeks...`);
    try {
        if (job) jobTracker.updateStage(jobId, 'initializing');
        
        const reviews = await fetchAllReviews({ 
            onProgress: (p) => handleFetchProgress(jobId, p), 
            weeks 
        });
        if (reviews.length === 0) throw new Error("No insightful reviews found.");

        if (job) jobTracker.updateStage(jobId, 'analyzing_reviews', 0, false);
        const pulseJsonString = await generatePulseReport(reviews, { 
            onProgress: (p) => handleAnalysisProgress(jobId, p) 
        });
        
        const pulseData = JSON.parse(pulseJsonString);
        pulseData.generatedAt = new Date().toISOString();
        pulseData.weeks = weeks;
        
        // Save to MongoDB Persistence
        await saveOneToDB(pulseData);

        if (job) jobTracker.updateStage(jobId, 'generating_report', 100, true);

        const finalRecipient = recipientEmail || process.env.TARGET_EMAIL;
        if (finalRecipient) {
            await handleEmailPhase(jobId, pulseData, finalRecipient);
        }
        
        if (job) {
            jobTracker.updateStage(jobId, 'completed', 100, true);
            jobTracker.setJobResult(jobId, pulseData);
        }
        
        return pulseData;
    } catch (error) {
        console.error(`[Error]`, error);
        if (job) jobTracker.setJobError(jobId, error);
        throw error;
    }
}

// Helpers for cleaner code
const handleFetchProgress = (jobId, progress) => {
    if (!jobId) return;
    if (progress.phase === 'fetching') {
        jobTracker.updateStage(jobId, 'fetching_reviews', Math.round((progress.batchesCompleted / progress.totalBatches) * 100), false);
    } else if (progress.phase === 'fetching_complete') {
        jobTracker.updateStage(jobId, 'fetching_reviews', 100, true);
    }
};

const handleAnalysisProgress = (jobId, progress) => {
    if (!jobId) return;
    if (progress.phase === 'mapping') {
        jobTracker.updateStage(jobId, 'analyzing_reviews', progress.progress, false);
    } else if (progress.phase === 'reducing' || progress.phase === 'analysis_complete') {
        jobTracker.updateStage(jobId, 'analyzing_reviews', 100, true);
    }
};

const handleEmailPhase = async (jobId, pulseData, targetEmail) => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS && targetEmail) {
        if (jobId) jobTracker.updateStage(jobId, 'sending_email', 0, false);
        await sendPulseEmail(pulseData, targetEmail, (progress) => {
            if (jobId && progress.phase === 'email') {
                const isDone = progress.status === 'completed' || progress.status === 'error';
                jobTracker.updateStage(jobId, 'sending_email', progress.progress || 50, isDone);
            }
        });
    }
};

// API Endpoint to trigger pulse generation with job tracking
app.post('/api/generate-pulse', async (req, res) => {
    try {
        const { weeks = 8, recipientEmail } = req.body;

        // --- INSTANT CACHE CHECK ---
        // If data exists, we return it immediately. No polling, no wait.
        const history = await loadHistoryFromDB();
        if (history[weeks]) {
            console.log(`[API] Instant Cache Hit for ${weeks} weeks. Returning immediately.`);
            const pulseData = history[weeks];
            
            // Send email - We AWAIT here so the UI knows if it REALLY worked
            const finalRecipient = recipientEmail || process.env.TARGET_EMAIL;
            if (finalRecipient) {
                console.log(`[API] Sending email to ${finalRecipient}...`);
                await handleEmailPhase(null, pulseData, finalRecipient);
            }

            return res.json({ 
                status: "completed",
                result: pulseData,
                message: "Pulse retrieved from cache"
            });
        }
        
        // --- SLOW PATH (FRESH GENERATION) ---
        // Create new job only if data is MISSING
        const job = jobTracker.createJob('pulse_generation');
        job.metadata.weeks = weeks;
        job.metadata.recipientEmail = recipientEmail;
        
        runPulseGeneration(job.id, weeks, recipientEmail).catch(err => {
            console.error('Background job failed:', err);
        });
        
        res.json({ 
            jobId: job.id,
            message: "Data not in cache. Starting fresh generation...",
            status: "pending"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoint to check job status
app.get('/api/jobs/:id', (req, res) => {
    try {
        const job = jobTracker.getJob(req.params.id);
        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoint to get all jobs
app.get('/api/jobs', (req, res) => {
    try {
        const jobs = jobTracker.getAllJobs();
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Optional API Endpoint to trigger the background job manually (legacy)
app.post('/api/trigger-cron-now', async (req, res) => {
    // Kick off the script async and return immediately
    runPulseGeneration(null, 8).catch(e => console.error("Manual Trigger Failed:", e));
    res.json({ message: "Cron job triggered manually in background!" });
});

// API Endpoint to Instantly GET pre-computed pulse data (0 latency!)
app.get('/api/pulse', async (req, res) => {
    try {
        const { weeks } = req.query;
        const history = await loadHistoryFromDB();
        
        // If a specific week is requested and exists in history, return it
        if (weeks && history[weeks]) {
            return res.json(history[weeks]);
        }
        
        // Otherwise return the most recent one
        const latest = Object.values(history).sort((a,b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0];
        if (latest) {
             return res.json(latest);
        } else {
            res.status(404).json({ error: "No pre-computed pulse found in DB." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Server API running on port ${PORT}`);
    console.log(`Cron scheduler active. Data will pre-load every night at 2:00 AM.`);
});
