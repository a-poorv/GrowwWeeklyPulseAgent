const { v4: uuidv4 } = require('uuid');

class JobTracker {
    constructor() {
        this.jobs = new Map();
    }

    createJob(type = 'pulse_generation') {
        const jobId = uuidv4();
        const job = {
            id: jobId,
            type,
            status: 'pending',
            progress: 0,
            currentStage: 'initializing',
            stages: {
                initializing: { completed: false, progress: 0 },
                fetching_reviews: { completed: false, progress: 0 },
                analyzing_reviews: { completed: false, progress: 0 },
                generating_report: { completed: false, progress: 0 },
                sending_email: { completed: false, progress: 0 },
                completed: { completed: false, progress: 0 }
            },
            result: null,
            error: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {}
        };
        
        this.jobs.set(jobId, job);
        return job;
    }

    updateJob(jobId, updates) {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        // Update basic fields
        Object.assign(job, updates);
        job.updatedAt = new Date();

        // Calculate overall progress based on stages
        const stages = Object.values(job.stages);
        const completedStages = stages.filter(stage => stage.completed).length;
        const totalStages = stages.length;
        job.progress = Math.round((completedStages / totalStages) * 100);

        this.jobs.set(jobId, job);
        return job;
    }

    updateStage(jobId, stageName, progress = 100, completed = true) {
        const job = this.jobs.get(jobId);
        if (!job || !job.stages[stageName]) return null;

        job.stages[stageName] = { completed, progress };
        job.currentStage = stageName;
        job.updatedAt = new Date();

        // Recalculate overall progress
        const stages = Object.values(job.stages);
        const completedStages = stages.filter(stage => stage.completed).length;
        const totalStages = stages.length;
        job.progress = Math.round((completedStages / totalStages) * 100);

        this.jobs.set(jobId, job);
        return job;
    }

    setJobResult(jobId, result) {
        return this.updateJob(jobId, { 
            result, 
            status: 'completed',
            currentStage: 'completed'
        });
    }

    setJobError(jobId, error) {
        return this.updateJob(jobId, { 
            error: error.message || error, 
            status: 'failed',
            currentStage: 'failed'
        });
    }

    getJob(jobId) {
        return this.jobs.get(jobId) || null;
    }

    getAllJobs() {
        return Array.from(this.jobs.values());
    }

    cleanupOldJobs(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const now = Date.now();
        for (const [jobId, job] of this.jobs.entries()) {
            if (now - job.createdAt.getTime() > maxAge) {
                this.jobs.delete(jobId);
            }
        }
    }
}

module.exports = { JobTracker };
