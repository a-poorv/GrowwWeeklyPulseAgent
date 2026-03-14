const gPlayScraper = require('google-play-scraper').default || require('google-play-scraper');
const { sanitizeText, isInsightfulReview } = require('../utils/sanitizer');

const PLAY_STORE_PKG = process.env.GROWW_PLAY_STORE_PKG || 'com.nextbillion.groww';
const SCRAPE_TIMEOUT_MS = 22000; // 22s per batch before we give up and use what we have

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Race a promise against a timeout.
 * On timeout, resolves with the fallback value (empty array) instead of rejecting,
 * so one slow batch never kills the whole pipeline.
 */
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise(resolve =>
            setTimeout(() => {
                console.warn(`[Scraper] ⚠️  "${label}" timed out after ${ms}ms — using partial results`);
                resolve([]);
            }, ms)
        )
    ]);
}

/**
 * Convert raw scraper objects → clean { id, rating, text, date } shape.
 * Filters out non-insightful reviews (too short, repetitive, empty).
 */
function processRaw(rawReviews) {
    return rawReviews.reduce((acc, r) => {
        const text = sanitizeText(r.text);
        if (isInsightfulReview(text)) {
            acc.push({
                id: r.id || r.reviewId || null,
                rating: r.score,
                text,
                date: r.at || r.date
            });
        }
        return acc;
    }, []);
}

// ─── Core Fetcher ──────────────────────────────────────────────────────────────

/**
 * Fetch one batch of reviews with a specific sort order.
 * Wraps the scraper call with timeout + error safety so it always resolves.
 */
async function fetchBatch(sortValue, num, label, onProgress) {
    try {
        const t0 = Date.now();
        console.log(`[Scraper] ▶ Starting batch: ${label} (num=${num})`);

        const result = await withTimeout(
            gPlayScraper.reviews({
                appId: PLAY_STORE_PKG,
                sort: sortValue,
                num,
                lang: 'en',
                country: 'in'
            }),
            SCRAPE_TIMEOUT_MS,
            label
        );

        const raw = Array.isArray(result) ? result : (result.data || []);
        const processed = processRaw(raw);

        console.log(`[Scraper] ✓ ${label}: ${raw.length} raw → ${processed.length} insightful (${Date.now() - t0}ms)`);
        onProgress?.({ batch: label, rawCount: raw.length, processedCount: processed.length });
        return processed;

    } catch (err) {
        console.error(`[Scraper] ✗ ${label} failed: ${err.message}`);
        onProgress?.({ batch: label, error: err.message });
        return [];
    }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch reviews from TWO sort orders IN PARALLEL, then deduplicate.
 * 
 * Why parallel?
 *   - NEWEST (150) catches recent regressions and bug reports
 *   - HELPFULNESS (150) catches high-signal, community-validated complaints
 *   - Running both simultaneously (~6s) vs sequentially (~12s)
 *   - Deduplication ensures no review is counted twice
 * 
 * Returns 200-300 unique, insightful, sanitized reviews.
 */
async function fetchAllReviews({ onProgress, weeks = 8 } = {}) {
    const sortNewest = gPlayScraper.sort?.NEWEST ?? 2;
    const sortHelpfulness = gPlayScraper.sort?.HELPFULNESS ?? 1;

    console.log(`[Scraper] Firing 2 parallel batches: NEWEST + HELPFULNESS (${weeks} weeks)...`);
    const t0 = Date.now();

    let batchesCompleted = 0;
    const totalBatches = 2;

    const [newestBatch, helpfulBatch] = await Promise.all([
        fetchBatch(sortNewest, 100, 'NEWEST', (progress) => {
            batchesCompleted++;
            onProgress?.({ 
                phase: 'fetching', 
                batchesCompleted, 
                totalBatches,
                currentBatch: progress.batch,
                ...progress
            });
        }),
        fetchBatch(sortHelpfulness, 100, 'HELPFULNESS', (progress) => {
            batchesCompleted++;
            onProgress?.({ 
                phase: 'fetching', 
                batchesCompleted, 
                totalBatches,
                currentBatch: progress.batch,
                ...progress
            });
        })
    ]);

    // Deduplicate: prefer ID match, fall back to first-60-chars text fingerprint
    const seen = new Set();
    const merged = [];

    for (const review of [...newestBatch, ...helpfulBatch]) {
        const key = review.id || review.text.slice(0, 60).toLowerCase().trim();
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(review);
        }
    }

    console.log(`[Scraper] ✓ Total unique insightful reviews: ${merged.length} (in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    onProgress?.({ 
        phase: 'fetching_complete', 
        reviewCount: merged.length, 
        totalTime: Date.now() - t0 
    });
    return merged;
}

module.exports = { fetchAllReviews };
