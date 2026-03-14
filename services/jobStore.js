const crypto = require('crypto');

const jobs = {};

const STEP_NAMES = [
    'Scraping reviews',
    'Analyzing reviews',
    'Generating report',
    'Sending email'
];

const CLEANUP_DELAY_MS = 10 * 60 * 1000; // 10 minutes
const STALE_TIMEOUT_MS = 5 * 60 * 1000;  // 5 minutes

function createJob() {
    const id = crypto.randomUUID();
    const job = {
        id,
        status: 'running',
        error: null,
        createdAt: new Date().toISOString(),
        steps: STEP_NAMES.map(name => ({ name, status: 'pending', meta: {} }))
    };
    jobs[id] = job;

    // Auto-fail if still running after 5 minutes
    setTimeout(() => {
        if (jobs[id] && jobs[id].status === 'running') {
            failJob(id, 'Job timed out after 5 minutes');
        }
    }, STALE_TIMEOUT_MS);

    return job;
}

function getJob(id) {
    return jobs[id] || null;
}

function getRunningJob() {
    return Object.values(jobs).find(j => j.status === 'running') || null;
}

function updateStep(id, stepIndex, status, meta) {
    const job = jobs[id];
    if (!job) return;
    job.steps[stepIndex].status = status;
    if (meta) {
        Object.assign(job.steps[stepIndex].meta, meta);
    }
}

function failJob(id, errorMessage) {
    const job = jobs[id];
    if (!job) return;
    job.status = 'failed';
    job.error = errorMessage;
    // Mark the currently active step as failed
    for (const step of job.steps) {
        if (step.status === 'active') {
            step.status = 'failed';
            break;
        }
    }
    scheduleCleanup(id);
}

function completeJob(id) {
    const job = jobs[id];
    if (!job) return;
    job.status = 'completed';
    scheduleCleanup(id);
}

function scheduleCleanup(id) {
    setTimeout(() => {
        delete jobs[id];
    }, CLEANUP_DELAY_MS);
}

module.exports = { createJob, getJob, getRunningJob, updateStep, failJob, completeJob };
