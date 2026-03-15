// Email Service - Premium HTTP Web API Based (Brevo)
// This strictly uses HTTPS (Port 443) and delivers a high-fidelity report.
require('dotenv').config();
const axios = require('axios');

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Sends email via Brevo REST API (HTTP Path)
 */
async function sendEmail(to, subject, html, retries = 3) {
    if (!to || !validateEmail(to)) {
        throw new Error(`Invalid recipient: ${to}`);
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SMTP_USER;

    if (!apiKey) {
        throw new Error('Missing BREVO_API_KEY in environment variables.');
    }

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[HTTP-API] Attempt ${attempt}: Sending to ${to} via Brevo...`);
            
            const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { name: "Weekly Pulse", email: senderEmail },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            }, {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            console.log(`✅ HTTP SUCCESS! Message ID: ${response.data.messageId}`);
            return response.data;

        } catch (error) {
            lastError = error;
            const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
            console.error(`❌ HTTP Attempt ${attempt} failed: ${errorMsg}`);
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
    throw lastError;
}

/**
 * Formats pulse data and sends it.
 */
async function sendPulseEmail(pulseData, targetEmail = null, onProgress) {
    const recipientEmail = targetEmail || process.env.TARGET_EMAIL;
    
    if (!recipientEmail || !validateEmail(recipientEmail)) {
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Invalid recipient' });
        return;
    }

    try {
        onProgress?.({ phase: 'email', status: 'sending', progress: 30 });

        // Ensure we have fallbacks for the new data structure
        const themes = pulseData.themes || [];
        const actions = pulseData.actions || [];
        const quotes = pulseData.quotes || [];
        const urgentThemes = pulseData.urgentThemes || [];
        const totalReviews = pulseData.totalReviews || 0;
        const reviewChange = pulseData.reviewChange || '+0%';
        const sentimentScore = pulseData.sentimentScore || 0;
        const sentimentChange = pulseData.sentimentChange || 0;

        const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #00d09c 0%, #1ac089 100%); color: white; padding: 40px 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 0.5px; }
                    .header-subtitle { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; }
                    .content { padding: 30px; }
                    .section-title { font-size: 14px; font-weight: bold; color: #333; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #00d09c; }
                    .theme-bullet { margin: 10px 0; padding-left: 20px; position: relative; font-size: 13px; color: #333; line-height: 1.5; }
                    .theme-bullet:before { content: "▸"; position: absolute; left: 0; color: #00d09c; font-weight: bold; }
                    .urgent-item { background: #fff9f9; border-left: 4px solid #ff4747; padding: 12px 15px; margin: 10px 0; border-radius: 0 4px 4px 0; }
                    .urgent-name { font-weight: bold; color: #333; font-size: 13px; }
                    .urgent-action { color: #666; font-size: 12px; margin-top: 4px; }
                    .urgency-label { display: inline-block; background: #ff4747; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 8px; }
                    .quote-block { background: #f9f9f9; border-left: 4px solid #00d09c; padding: 12px 15px; margin: 10px 0; font-style: italic; color: #666; font-size: 13px; line-height: 1.6; }
                    .action-block { background: #f9f9f9; border-left: 4px solid #1ac089; padding: 12px 15px; margin: 10px 0; font-size: 13px; color: #333; line-height: 1.6; }
                    .empty-message { color: #999; font-style: italic; font-size: 12px; padding: 10px 0; }
                    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e0e0e0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Groww Weekly Pulse</h1>
                        <div class="header-subtitle">Week ${pulseData.weeks || 8} Review Digest</div>
                    </div>
                    <div class="content">
                        <!-- Key Metrics -->
                        <div class="section-title">📈 Top 3 User Themes</div>
                        ${themes && themes.length > 0 ? themes.slice(0, 3).map(t => `
                            <div class="theme-bullet">${typeof t === 'object' ? t.name || t : t}</div>
                        `).join('') : '<div class="empty-message">No themes available</div>'}

                        <!-- Urgent Themes -->
                        ${urgentThemes && urgentThemes.length > 0 ? `
                            <div class="section-title">⚠️ Themes Requiring Immediate Action</div>
                            ${urgentThemes.map(t => `
                                <div class="urgent-item">
                                    <span class="urgent-name">${t.name}</span>
                                    <span class="urgency-label">${t.urgency}</span>
                                    <div class="urgent-action" style="margin-top: 6px;">→ ${t.action}</div>
                                </div>
                            `).join('')}
                        ` : ''}

                        <!-- Raw User Voice -->
                        <div class="section-title">💬 Raw User Voice</div>
                        ${quotes && quotes.length > 0 ? quotes.map(q => `
                            <div class="quote-block">"${q}"</div>
                        `).join('') : '<div class="empty-message">No user feedback available</div>'}

                        <!-- Proposed Actions -->
                        <div class="section-title">🚀 Proposed Action Items</div>
                        ${actions && actions.length > 0 ? actions.map((a, idx) => `
                            <div class="action-block">
                                <strong>${idx + 1}. ${typeof a === 'object' ? a.text : a}</strong>
                            </div>
                        `).join('') : '<div class="empty-message">No actions recommended</div>'}
                    </div>
                    <div class="footer">
                        <p>Generated on ${new Date(pulseData.generatedAt).toLocaleString()}</p>
                        <p>Weekly Pulse Report via Groww Agent</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const subject = `📈 Groww Weekly Pulse Report - ${new Date().toLocaleDateString()}`;
        const result = await sendEmail(recipientEmail, subject, htmlTemplate);
        
        onProgress?.({ phase: 'email', status: 'completed', progress: 100 });
        return result;
        
    } catch (error) {
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = { sendEmail, sendPulseEmail };
