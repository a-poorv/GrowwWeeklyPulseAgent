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

// Helper to load/save history
const loadHistory = () => {
    if (fs.existsSync(HISTORY_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
        } catch (e) {
            console.error('History file corrupt, resetting.');
            return {};
        }
    }
    
    // SEEDING GAP: If history doesn't exist, try to seed it from current pulse.json
    const latestPath = path.join(__dirname, 'dashboard', 'src', 'data', 'pulse.json');
    if (fs.existsSync(latestPath)) {
        try {
            const latestData = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
            const history = { [latestData.weeks || 8]: latestData };
            fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
            return history;
        } catch (e) {
            return {};
        }
    }
    return {};
};

const saveHistory = (history) => {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
    // Also update the "latest" for the main dashboard view
    const latestPath = path.join(__dirname, 'dashboard', 'src', 'data', 'pulse.json');
    const latest = Object.values(history).sort((a,b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0];
    if (latest) {
        fs.writeFileSync(latestPath, JSON.stringify(latest, null, 2));
    }
};

async function runPulseGeneration(jobId = null, weeks = 8, recipientEmail = null, forceNew = false) {
    const job = jobId ? jobTracker.getJob(jobId) : null;
    const history = loadHistory();
    
    // GAP FIXED: Check if we already have a recent report for this week count
    if (!forceNew && history[weeks]) {
        console.log(`[System] Found existing report for ${weeks} weeks. Using cached data.`);
        const pulseData = history[weeks];
        
        if (job) {
            jobTracker.updateStage(jobId, 'initializing', 100, true);
            jobTracker.updateStage(jobId, 'fetching_reviews', 100, true);
            jobTracker.updateStage(jobId, 'analyzing_reviews', 100, true);
            jobTracker.updateStage(jobId, 'generating_report', 100, true);
        }

        // Resolve final recipient
        const finalRecipient = recipientEmail || process.env.TARGET_EMAIL;

        // If a recipient is available, send the email immediately
        if (finalRecipient) {
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
        
        // --- FETCHING ---
        const reviews = await fetchAllReviews({ 
            onProgress: (p) => handleFetchProgress(jobId, p), 
            weeks 
        });
        if (reviews.length === 0) throw new Error("No insightful reviews found.");

        // --- ANALYSIS ---
        if (job) jobTracker.updateStage(jobId, 'analyzing_reviews', 0, false);
        const pulseJsonString = await generatePulseReport(reviews, { 
            onProgress: (p) => handleAnalysisProgress(jobId, p) 
        });
        
        const pulseData = JSON.parse(pulseJsonString);
        pulseData.generatedAt = new Date().toISOString();
        pulseData.weeks = weeks;
        
        // Save to history
        history[weeks] = pulseData;
        saveHistory(history);

        if (job) jobTracker.updateStage(jobId, 'generating_report', 100, true);

        // --- EMAIL ---
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
        
        // Create new job
        const job = jobTracker.createJob('pulse_generation');
        job.metadata.weeks = weeks;
        job.metadata.recipientEmail = recipientEmail;
        
        // Start processing in background
        runPulseGeneration(job.id, weeks, recipientEmail).catch(err => {
            console.error('Background job failed:', err);
        });
        
        res.json({ 
            jobId: job.id,
            message: "Pulse generation started",
            status: "pending",
            recipientEmail: recipientEmail || "default"
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
app.get('/api/pulse', (req, res) => {
    try {
        const { weeks } = req.query;
        const history = loadHistory();
        
        // If a specific week is requested and exists in history, return it
        if (weeks && history[weeks]) {
            return res.json(history[weeks]);
        }
        
        // Otherwise fall back to the latest pulse.json
        const outPath = path.join(__dirname, 'dashboard', 'src', 'data', 'pulse.json');
        if (fs.existsSync(outPath)) {
            const dataContent = fs.readFileSync(outPath, 'utf8');
            res.json(JSON.parse(dataContent));
        } else {
            res.status(404).json({ error: "No pre-computed pulse found." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Server API running on port ${PORT}`);
    console.log(`Cron scheduler active. Data will pre-load every night at 2:00 AM.`);
});
