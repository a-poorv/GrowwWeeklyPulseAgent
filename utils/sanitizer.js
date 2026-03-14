/**
 * Sanitizes review text by removing PII (Personally Identifiable Information)
 * like usernames, emails, and phone numbers. It also strips emojis.
 * @param {string} text - The raw review text.
 * @returns {string} - The sanitized text.
 */
function sanitizeText(text) {
    if (!text) return "";

    // Regex patterns for common PII
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
    const genericIdRegex = /\d{10,}/g; // Common for long IDs or account numbers

    // Regex to remove emojis
    const emojiRegex = /[\u1000-\uFFFF]+/g;

    return text
        .replace(emailRegex, "[REDACTED_EMAIL]")
        .replace(phoneRegex, "[REDACTED_PHONE]")
        .replace(genericIdRegex, "[REDACTED_ID]")
        .replace(emojiRegex, "")
        .trim();
}

/**
 * Validates if a review provides actual insight (not just "ok", "good").
 * @param {string} text 
 * @returns {boolean}
 */
function isInsightfulReview(text) {
    if (!text) return false;

    const cleanText = text.trim();
    // Too short (less than 15 characters) - usually just "good app", "nice", "ok"
    if (cleanText.length < 15) return false;

    // Less than 4 words
    const words = cleanText.split(/\s+/);
    if (words.length < 4) return false;

    // Just repetitive characters (e.g. "gooddddd", ".......")
    if (/^(.)\1+$/.test(cleanText)) return false;

    return true;
}

/**
 * Filter reviews within a specific timeframe (8-12 weeks)
 * @param {Array} reviews - Array of review objects.
 * @param {number} weeks - Number of weeks to look back.
 * @returns {Array} - Filtered reviews.
 */
function filterByDate(reviews, weeks = 12) {

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

    return reviews.filter((review) => {
        const reviewDate = new Date(review.at || review.date);
        return reviewDate >= cutoffDate;
    });
}

module.exports = {
    sanitizeText,
    filterByDate,
    isInsightfulReview
};
